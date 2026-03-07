import { Request, Response } from 'express';
import axios from 'axios';
import logger from "../utils/logger.js";

const API_URL = process.env.CHECK_CAR_DETAILS_API_URL;
const API_KEY = process.env.CHECK_CAR_DETAILS_API_KEY;

export const getCarDetails = async (req: Request, res: Response) => {
    logger.info(`getCarDetails request received`);

    const { registrationNumber, mileage } = req.body;

    if (!registrationNumber || !mileage) {
        return res.status(400).json({ message: 'Registration number and mileage are required.' });
    }

    try {
        const response = await axios.get(
            `${API_URL}/vehicleregistration?apikey=${API_KEY}&vrm=${registrationNumber.replace(/\s/g, '').toUpperCase()}`
        );

        if (response.status !== 200) {
            return res.status(400).json({ message: 'Unable to find vehicle details.' });
        }

        const d = response.data;

        const carDetails = {
            // User input
            mileage: Number(mileage),
            // From vehicleregistration
            registrationNumber: d.registrationNumber,
            carMake: d.make,
            carModel: d.model,
            colour: d.colour,
            fuelType: d.fuelType,
            yearOfManufacture: Number(d.yearOfManufacture),
            vehicleAge: d.vehicleAge,
            engineCapacity: d.engineCapacity,
            co2Emissions: d.co2Emissions,
            // Tax / MOT
            taxStatus: d.tax?.taxStatus,
            taxDueDate: d.tax?.taxDueDate,
            taxDaysRemaining: d.tax?.days,
            motStatus: d.mot?.motStatus,
            motExpiryDate: d.mot?.motDueDate,
            motDaysRemaining: d.mot?.days,
        };

        logger.info(`carDetails: ${JSON.stringify(carDetails)}`);
        res.json(carDetails);
    } catch (error) {
        console.error('Error fetching car details:', error);
        res.status(500).json({ message: 'Failed to fetch car details.' });
    }
};
