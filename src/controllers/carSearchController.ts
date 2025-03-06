import { Request, Response } from 'express';
import {downloadPresignedUrl} from "./uploadController.js";
import CarAdvert, {ICarAdvert} from "../models/CarAdvert.js";

// Configure geocoder
const getCoordinates = async (postcode: string) => {
    try {
        const formattedPostcode = postcode.replace(/\s+/g, '').toUpperCase();
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${formattedPostcode}&countrycodes=GB`,
            {
                headers: {
                    'User-Agent': 'YourAppName/1.0 (your@email.com)'
                }
            }
        );

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        if (!data.length) {
            console.log(`No coordinates found for postcode: ${postcode}`);
            return null;
        }

        const result = data[0];
        return {
            latitude: parseFloat(result.lat),
            longitude: parseFloat(result.lon)
        };
    } catch (error) {
        console.error('Error fetching coordinates:', error);
        return null;
    }
};

const createGeoFilter = (longitude: number, latitude: number, distanceMiles: number) => ({
    coordinates: {
        $geoWithin: {
            $centerSphere: [
                [longitude, latitude],
                distanceMiles / 3963.2 // Use more accurate Earth radius in miles
            ]
        }
    }
});

export const searchCars = async (req: Request, res: Response) => {
    try {
        const { postcode, distance, sortBy = 'relevance', ...otherFilters } = req.query;
        const query = buildQuery(otherFilters);

        // Handle geospatial query
        let geoFilter = {};
        if (postcode && distance && distance !== 'National') {
            const userLocation = await getCoordinates(postcode as string);
            if (!userLocation) return res.status(400).json({ message: 'Invalid postcode' });

            const bufferDistance = Number(distance) * 1.1;
            geoFilter = createGeoFilter(
                userLocation.latitude,
                userLocation.longitude,
                bufferDistance
            );
        }

        // Build base pipeline
        const aggregationPipeline: any[] = [];

        // Handle distance sorting first (must be first stage)
        if (sortBy === 'distance_asc' && postcode) {
            const userLocation = await getCoordinates(postcode as string);
            if (userLocation) {
                aggregationPipeline.push({
                    $geoNear: {
                        near: {
                            type: 'Point',
                            coordinates: [userLocation.longitude, userLocation.latitude]
                        },
                        distanceField: 'distance',
                        query: { ...query, ...geoFilter },
                        spherical: true
                    }
                });
            }
        } else {
            // Regular match stage
            if (Object.keys(query).length > 0 || Object.keys(geoFilter).length > 0) {
                aggregationPipeline.push({
                    $match: { ...query, ...geoFilter }
                });
            }
        }

        // Add sorting
        switch (sortBy) {
            case 'price_asc':
                aggregationPipeline.push({ $sort: { price: 1 } });
                break;
            case 'price_desc':
                aggregationPipeline.push({ $sort: { price: -1 } });
                break;
            case 'mileage_asc':
                aggregationPipeline.push({ $sort: { mileage: 1 } });
                break;
            case 'yearOfManufacture_desc':
                aggregationPipeline.push({ $sort: { yearOfManufacture: -1 } });
                break;
            case 'yearOfManufacture_asc':
                aggregationPipeline.push({ $sort: { yearOfManufacture: 1 } });
                break;
            case 'date_desc':
                aggregationPipeline.push({ $sort: { createdAt: -1 } });
                break;
        }

        // Add common pipeline stages
        aggregationPipeline.push(
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner"
                }
            },
            {
                $unwind: {
                    path: "$owner",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    // Include all fields except MongoDB internal fields
                    __v: 0,
                    'owner.__v': 0,
                    'owner.password': 0,
                    // Add other fields to include/exclude as needed
                }
            }
        );

        // Execute aggregation
        const carAdverts = await CarAdvert.aggregate(aggregationPipeline);

        // console.log('carAdverts ' + JSON.stringify(carAdverts));

        // Process images
        const results = await Promise.all(carAdverts.map(async (carAdvert) => {
            const presignedPhotos = carAdvert?.images
                ? await Promise.all(carAdvert.images.map((image: string) => downloadPresignedUrl(image)))
                : [];
            return {
                ...carAdvert,  // Remove .toObject()
                images: presignedPhotos
            };
        }));

        res.status(200).json(results);
    } catch (error) {
        console.error('Error searching cars:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const searchFilters = async (req: Request, res: Response) => {
    try {
        const { postcode, distance, sortBy, ...otherFilters } = req.body;
        const query = buildQuery(otherFilters);

        // Handle geospatial query
        if (postcode && distance && distance !== 'National') {
            const userLocation = await getCoordinates(postcode as string);
            if (!userLocation) return res.status(400).json({ message: 'Invalid postcode' });

            const bufferDistance = Number(distance) * 1.1;
            Object.assign(query, createGeoFilter(
                userLocation.latitude,
                userLocation.longitude,
                bufferDistance
            ));
        }

        console.log(JSON.stringify(query));

        // Get filter counts
        const filterCounts = await getFilterCounts(query);
        const totalCars = await CarAdvert.countDocuments(query);

        res.json({
            options: filterCounts,
            totalCars
        });
    } catch (error) {
        console.error("Options Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const buildQuery = (filters: any) => {
    const query: any = {};

    Object.entries(filters).forEach(([key, value]) => {
        if (!value || (Array.isArray(value) && value.length === 0)) return;

        switch (key) {
            case 'price_from':
            case 'price_to':
            case 'yearOfManufacture_from':
            case 'yearOfManufacture_to':
            case 'mileage_from':
            case 'mileage_to':
                const [field, rawOperator] = key.split(/(?=_)/);
                const operator = rawOperator.replace('_', '');
                const mongoOperator = operator === 'from' ? '$gte' : '$lte';
                query[field] = query[field] || {};
                query[field][mongoOperator] = Number(value);
                break;

            case 'numberOfDoors':
            case 'numberOfSeats':
                if (Array.isArray(value)) {
                    query[key] = { $in: value.map(Number) };
                } else {
                    query[key] = Number(value);
                }
                break;

            default:
                if (Array.isArray(value)) {
                    query[key] = { $in: value };
                } else {
                    query[key] = value;
                }
        }
    });

    return query;
};

async function getFilterCounts(baseQuery: any) {
    const counts: any = {};
    const filters = [
        "carMake", "carModel", "variant",
        "transmission", "fuelType", "bodyType",
        "colour", "numberOfDoors", "numberOfSeats"
    ];

    // Define filter dependencies
    const filterDependencies: { [key: string]: string[] } = {
        carMake: ['carModel', 'variant'],
        carModel: ['variant'],
        variant: []
    };

    for (const filter of filters) {
        // Clone and remove current filter + its dependencies
        const query = JSON.parse(JSON.stringify(baseQuery));

        // Remove dependent filters
        const dependencies = filterDependencies[filter] || [];
        [filter, ...dependencies].forEach(f => delete query[f]);

        counts[filter] = await CarAdvert.aggregate([
            { $match: query },
            { $group: {
                    _id: `$${filter}`,
                    count: { $sum: 1 }
                }},
            { $sort: { count: -1 } }
        ]);
    }

    return counts;
}

