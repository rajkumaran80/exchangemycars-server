import express, { Request, Response } from 'express';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';
import logger from "../utils/logger.js";

dotenv.config();

const baseUrl = process.env.ONE_AUTO_API_BASE_URL;
const apiKey = process.env.ONE_AUTO_API_KEY;

const dvlaUrl = process.env.DVLA_URL!;
const dvlaKey = process.env.DVLA_KEY!;

export const getCarDetails = async (req: Request, res: Response) => {
    logger.info(`getCarDetails request ${req}`);

    const { registrationNumber, mileage } = req.body;

    if (!registrationNumber || !mileage) {
        return res.status(400).json({ message: 'Registration number and mileage are required.' });
    }

    console.log("dvlaKey: " + dvlaKey)

    try {
        const dvlaResponse = await axios.post(
            dvlaUrl,
            {
                registrationNumber
            },
            {
                headers: {
                    'x-api-key': dvlaKey,
                },
            }
        );

        if (dvlaResponse.status !== 200) {
            return res.status(400).json({ message: 'Sorry unable to find the vehicle details' });
        }

        const oneAutoResponse = await axios.get(
            `${baseUrl}/autotrader/vehiclelookupfromvrm/v2?vehicle_registration_mark=${registrationNumber}`,
            {
                headers: {
                    'x-api-key': apiKey,
                },
            }
        );

        // Extract and filter the required data
        // const carData = response.data;
        // const filteredData = {
        //     make: carData.result.basic_vehicle_info.manufacturer_desc,
        //     model: carData.result.basic_vehicle_info.model_range_desc,
        //     variant: carData.result.basic_vehicle_info.trim_level_desc,
        //     vehicle_desc: carData.result.basic_vehicle_info.derivative_desc,
        //     registration: carData.result.basic_vehicle_info.vehicle_registration_mark,
        //     mileage: mileage,
        //     fuelType: carData.result.basic_vehicle_info.autotrader_fuel_type_desc,
        //     bodyType: carData.result.basic_vehicle_info.body_type,
        //     colour: carData.result.basic_vehicle_info.colour,
        //     transmission: carData.result.basic_vehicle_info.autotrader_transmission_desc,
        //     dateOfFirstRegistration: carData.result.basic_vehicle_info.first_registration_date,
        // };

        // Add additional values to the response
        const modifiedCarData = {
            ...dvlaResponse.data,
            ...oneAutoResponse.data,
            mileage: mileage
        };

        // Return the filtered data to the frontend
        res.json(modifiedCarData);
    } catch (error) {
        console.error('Error fetching car details:', error);
        res.status(500).json({ message: 'Failed to fetch car details.' });
    }

};
