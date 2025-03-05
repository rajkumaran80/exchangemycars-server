import { downloadPresignedUrl } from "./uploadController.js";
import CarAdvert from "../models/CarAdvert.js";
// Configure geocoder
const getCoordinates = async (postcode) => {
    try {
        const formattedPostcode = postcode.replace(/\s+/g, '').toUpperCase();
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${formattedPostcode}&countrycodes=GB`, {
            headers: {
                'User-Agent': 'YourAppName/1.0 (your@email.com)'
            }
        });
        if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
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
    }
    catch (error) {
        console.error('Error fetching coordinates:', error);
        return null;
    }
};
const createGeoFilter = (longitude, latitude, distanceMiles) => ({
    coordinates: {
        $geoWithin: {
            $centerSphere: [
                [longitude, latitude],
                distanceMiles / 3963.2 // Use more accurate Earth radius in miles
            ]
        }
    }
});
export const searchCars = async (req, res) => {
    try {
        const { postcode, distance, ...otherFilters } = req.query;
        const query = {};
        // Handle non-geo filters
        Object.entries(otherFilters).forEach(([key, value]) => {
            if (value) {
                switch (key) {
                    case 'priceFrom':
                    case 'priceTo':
                    case 'yearFrom':
                    case 'yearTo':
                    case 'mileageFrom':
                    case 'mileageTo':
                        const [field, operator] = key.split(/(?=[A-Z])/);
                        query[field] = query[field] || {};
                        query[field][`$${operator.toLowerCase()}`] = Number(value);
                        break;
                    default:
                        query[key] = value;
                }
            }
        });
        // Handle geospatial query
        if (postcode && distance && distance !== 'National') {
            const userLocation = await getCoordinates(postcode);
            if (!userLocation)
                return res.status(400).json({ message: 'Invalid postcode' });
            // Add 10% buffer to the distance to account for coordinate inaccuracies
            const bufferDistance = Number(distance) * 1.1;
            Object.assign(query, createGeoFilter(userLocation.latitude, userLocation.longitude, bufferDistance));
        }
        // Combine queries
        const carAdverts = await CarAdvert.find(query)
            .populate('owner', 'name email');
        // Process images
        const results = await Promise.all(carAdverts.map(async (carAdvert) => {
            const presignedPhotos = carAdvert?.images
                ? await Promise.all(carAdvert.images.map(image => downloadPresignedUrl(image)))
                : [];
            return { ...carAdvert.toObject(), images: presignedPhotos };
        }));
        res.status(200).json(results);
    }
    catch (error) {
        console.error('Error searching cars:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
export const searchFilters = async (req, res) => {
    try {
        const { postcode, distance, ...otherFilters } = req.body;
        const query = {};
        // Handle non-geo filters
        Object.entries(otherFilters).forEach(([key, value]) => {
            if (value) {
                switch (key) {
                    case 'priceFrom':
                    case 'priceTo':
                    case 'yearFrom':
                    case 'yearTo':
                    case 'mileageFrom':
                    case 'mileageTo':
                        const [field, operator] = key.split(/(?=[A-Z])/);
                        query[field] = query[field] || {};
                        query[field][`$${operator.toLowerCase()}`] = Number(value);
                        break;
                    default:
                        query[key] = value;
                }
            }
        });
        // Handle geospatial query
        if (postcode && distance && distance !== 'National') {
            const userLocation = await getCoordinates(postcode);
            if (!userLocation)
                return res.status(400).json({ message: 'Invalid postcode' });
            // Add 10% buffer to the distance to account for coordinate inaccuracies
            const bufferDistance = Number(distance) * 1.1;
            Object.assign(query, createGeoFilter(userLocation.latitude, userLocation.longitude, bufferDistance));
        }
        console.log(JSON.stringify(query));
        // Get filter counts
        const filterCounts = await getFilterCounts(query);
        const totalCars = await CarAdvert.countDocuments(query);
        res.json({
            options: filterCounts,
            totalCars
        });
    }
    catch (error) {
        console.error("Options Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
async function getFilterCounts(baseQuery) {
    const counts = {};
    // Count available options for each filter
    const filters = ["carMake", "carModel", "variant", "transmission", "fuelType", "bodyType", "colour", "numberOfDoors", "numberOfSeats"];
    for (const filter of filters) {
        counts[filter] = await CarAdvert.aggregate([
            { $match: baseQuery },
            { $group: { _id: `$${filter}`, count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);
    }
    return counts;
}
