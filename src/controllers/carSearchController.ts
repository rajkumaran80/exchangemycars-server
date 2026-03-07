import { Request, Response } from 'express';
import { downloadPresignedUrl } from "./uploadController.js";
import prisma from '../utils/prisma.js';

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

        const data = await response.json() as any[];
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

// Haversine distance in miles using SQL
const haversineDistanceSql = (latCol: string, lonCol: string, lat: number, lon: number) =>
    `(3963.2 * acos(LEAST(1.0, cos(radians(${lat})) * cos(radians(${latCol})) * cos(radians(${lonCol}) - radians(${lon})) + sin(radians(${lat})) * sin(radians(${latCol})))))`;

const buildWhereClause = (filters: any, geoLat?: number, geoLon?: number, distanceMiles?: number): { where: string; params: any[] } => {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    const numberFields = ['numberOfDoors', 'numberOfSeats'];

    for (const [key, value] of Object.entries(filters)) {
        if (!value || (Array.isArray(value) && (value as any[]).length === 0)) continue;

        switch (key) {
            case 'priceFrom':
                conditions.push(`"price" >= $${paramIdx++}`);
                params.push(Number(value));
                break;
            case 'priceTo':
                conditions.push(`"price" <= $${paramIdx++}`);
                params.push(Number(value));
                break;
            case 'yearOfManufacture_from':
                conditions.push(`"yearOfManufacture" >= $${paramIdx++}`);
                params.push(Number(value));
                break;
            case 'yearOfManufacture_to':
                conditions.push(`"yearOfManufacture" <= $${paramIdx++}`);
                params.push(Number(value));
                break;
            case 'mileageFrom':
                conditions.push(`"mileage" >= $${paramIdx++}`);
                params.push(Number(value));
                break;
            case 'mileageTo':
                conditions.push(`"mileage" <= $${paramIdx++}`);
                params.push(Number(value));
                break;
            case 'evRangeFrom':
                conditions.push(`"evRangeWltpMiles" >= $${paramIdx++}`);
                params.push(Number(value));
                break;
            case 'numberOfDoors':
            case 'numberOfSeats':
                if (Array.isArray(value)) {
                    const placeholders = (value as any[]).map(() => `$${paramIdx++}`).join(',');
                    conditions.push(`"${key}" IN (${placeholders})`);
                    (value as any[]).forEach(v => params.push(Number(v)));
                } else {
                    conditions.push(`"${key}" = $${paramIdx++}`);
                    params.push(Number(value));
                }
                break;
            default:
                if (Array.isArray(value)) {
                    const placeholders = (value as any[]).map(() => `$${paramIdx++}`).join(',');
                    conditions.push(`"${key}" IN (${placeholders})`);
                    (value as any[]).forEach(v => params.push(v));
                } else {
                    conditions.push(`"${key}" = $${paramIdx++}`);
                    params.push(value);
                }
        }
    }

    if (geoLat !== undefined && geoLon !== undefined && distanceMiles !== undefined) {
        conditions.push(`${haversineDistanceSql('"latitude"', '"longitude"', geoLat, geoLon)} <= ${distanceMiles}`);
    }

    return {
        where: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
        params
    };
};

export const searchCars = async (req: Request, res: Response) => {
    try {
        const { postcode, distance, sortBy = 'relevance', ...otherFilters } = req.query;

        let geoLat: number | undefined;
        let geoLon: number | undefined;
        let distanceMiles: number | undefined;

        if (postcode && distance && distance !== 'National') {
            const userLocation = await getCoordinates(postcode as string);
            if (!userLocation) return res.status(400).json({ message: 'Invalid postcode' });
            geoLat = userLocation.latitude;
            geoLon = userLocation.longitude;
            distanceMiles = Number(distance) * 1.1;
        }

        const { where, params } = buildWhereClause(otherFilters, geoLat, geoLon, distanceMiles);

        let orderBy = '';
        switch (sortBy) {
            case 'price_asc': orderBy = 'ORDER BY "price" ASC'; break;
            case 'price_desc': orderBy = 'ORDER BY "price" DESC'; break;
            case 'mileage_asc': orderBy = 'ORDER BY "mileage" ASC'; break;
            case 'yearOfManufacture_desc': orderBy = 'ORDER BY "yearOfManufacture" DESC'; break;
            case 'yearOfManufacture_asc': orderBy = 'ORDER BY "yearOfManufacture" ASC'; break;
            case 'date_desc': orderBy = 'ORDER BY "createdAt" DESC'; break;
            case 'distance_asc':
                if (geoLat !== undefined && geoLon !== undefined) {
                    orderBy = `ORDER BY ${haversineDistanceSql('"latitude"', '"longitude"', geoLat, geoLon)} ASC`;
                }
                break;
        }

        const sql = `
            SELECT ca.*, 
                   u.id as "ownerId_join", u.name as "ownerName", u.email as "ownerEmail"
            FROM car_adverts ca
            LEFT JOIN users u ON ca."ownerId" = u.id
            ${where}
            ${orderBy}
        `;

        const carAdverts = await prisma.$queryRawUnsafe<any[]>(sql, ...params);

        const results = await Promise.all(carAdverts.map(async (carAdvert) => {
            const presignedPhotos = carAdvert?.images
                ? await Promise.all(carAdvert.images.map((image: string) => downloadPresignedUrl(image)))
                : [];
            return {
                ...carAdvert,
                owner: { id: carAdvert.ownerId_join, name: carAdvert.ownerName, email: carAdvert.ownerEmail },
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

        let geoLat: number | undefined;
        let geoLon: number | undefined;
        let distanceMiles: number | undefined;

        if (postcode && distance && distance !== 'National') {
            const userLocation = await getCoordinates(postcode as string);
            if (!userLocation) return res.status(400).json({ message: 'Invalid postcode' });
            geoLat = userLocation.latitude;
            geoLon = userLocation.longitude;
            distanceMiles = Number(distance) * 1.1;
        }

        const { where, params } = buildWhereClause(otherFilters, geoLat, geoLon, distanceMiles);

        const filterFields = [
            "carMake", "carModel", "variant",
            "transmission", "fuelType", "bodyType",
            "colour", "numberOfDoors", "numberOfSeats",
            "drivetrainType", "emissionClass"
        ];

        const filterCounts: any = {};
        for (const field of filterFields) {
            const rows = await prisma.$queryRawUnsafe<{ value: any; count: bigint }[]>(
                `SELECT "${field}" as value, COUNT(*) as count FROM car_adverts ${where} GROUP BY "${field}" ORDER BY count DESC`,
                ...params
            );
            filterCounts[field] = rows.map(r => ({ _id: r.value, count: Number(r.count) }));
        }

        const totalResult = await prisma.$queryRawUnsafe<{ total: bigint }[]>(
            `SELECT COUNT(*) as total FROM car_adverts ${where}`,
            ...params
        );
        const totalCars = Number(totalResult[0]?.total ?? 0);

        res.json({ options: filterCounts, totalCars });
    } catch (error) {
        console.error("Options Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
