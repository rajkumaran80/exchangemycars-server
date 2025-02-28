import { Request, Response } from 'express';
import Car, {ICar} from '../models/Car.js';
import logger from '../utils/logger.js';
import { IUser } from '../models/User.js';
import {downloadPresignedUrl} from "./uploadController.js";
import CarAdvert from "../models/CarAdvert.js";

// Get all cars
export const searchCars = async (req: Request, res: Response) => {
    try {
        const {
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

        // Query Advert first, applying price filters correctly
        const advertQuery: any = {};
        if (priceFrom || priceTo) {
            advertQuery.price = {};
            if (priceFrom) advertQuery.price.$gte = Number(priceFrom);
            if (priceTo) advertQuery.price.$lte = Number(priceTo);
        }

        // Find adverts matching the price criteria
        const adverts = await CarAdvert.find(advertQuery).exec();
        const carIds = adverts.map(ad => ad.car);

        // Build the query object for Cars
        const carQuery: any = { _id: { $in: carIds } };
        if (carMake) carQuery.carMake = carMake;
        if (carModel) carQuery.carModel = carModel;
        if (variant) carQuery.variant = variant;
        if (transmission) carQuery.transmission = transmission;
        if (bodyType) carQuery.bodyType = bodyType;
        if (colour) carQuery.colour = colour;
        if (doors) carQuery.numberOfDoors = doors;
        if (seats) carQuery.numberOfSeats = seats;
        if (fuelType) carQuery.fuelType = fuelType;

        // Add range filters
        if (yearFrom || yearTo) {
            carQuery.yearOfManufacture = {};
            if (yearFrom) carQuery.yearOfManufacture.$gte = Number(yearFrom);
            if (yearTo) carQuery.yearOfManufacture.$lte = Number(yearTo);
        }
        if (mileageFrom || mileageTo) {
            carQuery.mileage = {};
            if (mileageFrom) carQuery.mileage.$gte = Number(mileageFrom);
            if (mileageTo) carQuery.mileage.$lte = Number(mileageTo);
        }

        // Fetch cars
        const cars = await Car.find(carQuery).populate('owner', 'name email');

        // Process results with async photo transformation
        const results = await Promise.all(cars.map(async (car: ICar) => {
            const advert = adverts.find(ad => ad.car.toString() === car._id.toString());

            // Transform photos asynchronously
            const presignedPhotos = advert?.photos
                ? await Promise.all(advert.photos.map(photo => downloadPresignedUrl(photo)))
                : [];

            return {
                ...car.toObject(),
                price: advert?.price,
                title: advert?.title,
                description: advert?.description,
                photos: presignedPhotos,
            };
        }));

        res.status(200).json(results);

    } catch (error) {
        console.error('Error searching cars:', error);
        res.status(500).json({ message: 'Server error' });
    }
};


