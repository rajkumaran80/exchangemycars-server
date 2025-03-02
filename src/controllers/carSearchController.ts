import { Request, Response } from 'express';
import {downloadPresignedUrl} from "./uploadController.js";
import CarAdvert, {ICarAdvert} from "../models/CarAdvert.js";

// Configure geocoder
const getCoordinates = async (postcode: string) => {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${postcode}`);
        const data = await response.json();
        if (data.length === 0) return null;
        return { latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) };
    } catch (error) {
        console.error('Error fetching coordinates:', error);
        return null;
    }
};

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const R = 3958.8; // Radius of Earth in miles

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

// Get all cars
export const searchCars = async (req: Request, res: Response) => {
    try {
        const {
            postcode,
            distance,
            carMake,
            carModel,
            variant,
            priceFrom,
            priceTo,
            yearFrom,
            yearTo,
            mileageFrom,
            mileageTo,
            transmission,
            bodyType,
            colour,
            doors,
            seats,
            fuelType,
        } = req.query;

        const carAdvertQuery: any = {};

        if (carMake) carAdvertQuery.carMake = carMake;
        if (carModel) carAdvertQuery.carModel = carModel;
        if (variant) carAdvertQuery.variant = variant;
        if (transmission) carAdvertQuery.transmission = transmission;
        if (bodyType) carAdvertQuery.bodyType = bodyType;
        if (colour) carAdvertQuery.colour = colour;
        if (doors) carAdvertQuery.numberOfDoors = doors;
        if (seats) carAdvertQuery.numberOfSeats = seats;
        if (fuelType) carAdvertQuery.fuelType = fuelType;

        if (priceFrom || priceTo) {
            carAdvertQuery.price = {};
            if (priceFrom) carAdvertQuery.price.$gte = Number(priceFrom);
            if (priceTo) carAdvertQuery.price.$lte = Number(priceTo);
        }

        // Add range filters
        if (yearFrom || yearTo) {
            carAdvertQuery.yearOfManufacture = {};
            if (yearFrom) carAdvertQuery.yearOfManufacture.$gte = Number(yearFrom);
            if (yearTo) carAdvertQuery.yearOfManufacture.$lte = Number(yearTo);
        }
        if (mileageFrom || mileageTo) {
            carAdvertQuery.mileage = {};
            if (mileageFrom) carAdvertQuery.mileage.$gte = Number(mileageFrom);
            if (mileageTo) carAdvertQuery.mileage.$lte = Number(mileageTo);
        }

        // Fetch cars
        let carAdverts = await CarAdvert.find(carAdvertQuery).populate('owner', 'name email');

        // If postcode and distance are provided, filter by proximity
        if (postcode && distance && distance !== 'National') {
            const userLocation = await getCoordinates(postcode as string);
            if (!userLocation) return res.status(400).json({ message: 'Invalid postcode' });

            const filteredCarAdverts = await Promise.all(
                carAdverts.map(async (carAdvert) => {
                    if (!carAdvert.postcode || !carAdvert.latitude || !carAdvert.longitude) return carAdvert;

                    const calculatedDistance = getDistance(userLocation.latitude, userLocation.longitude, carAdvert.latitude, carAdvert.longitude);
                    return calculatedDistance <= Number(distance) ? carAdvert : null;
                })
            );

            // Filter out null values
            carAdverts = filteredCarAdverts.filter(carAdvert => carAdvert !== null);
        }

        const results = await Promise.all(carAdverts.map(async (carAdvert: ICarAdvert) => {
            const presignedPhotos = carAdvert?.images
                ? await Promise.all(carAdvert.images.map(image => downloadPresignedUrl(image)))
                : [];
            carAdvert.images = presignedPhotos;
            return carAdvert;
        }));

        res.status(200).json(results);

    } catch (error) {
        console.error('Error searching cars:', error);
        res.status(500).json({ message: 'Server error' });
    }
};


