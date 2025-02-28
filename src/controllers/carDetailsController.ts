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

        const dvlaData = dvlaResponse.data;
        const oneAutoBasicVehicleInfo = oneAutoResponse.data.result.basic_vehicle_info;
        const oneAutoBasicVehicleCheck = oneAutoResponse.data.result.basic_vehicle_check;

        const carDetails = {
            mileage: mileage,
            registrationNumber: dvlaData.registrationNumber,
            taxStatus: dvlaData.taxStatus,
            taxDueDate: dvlaData.taxDueDate,
            motStatus: dvlaData.motStatus,
            motExpiryDate: dvlaData.motExpiryDate,
            monthOfFirstRegistration: dvlaData.monthOfFirstRegistration,
            yearOfManufacture: dvlaData.yearOfManufacture,
            engineCapacity: dvlaData.engineCapacity,
            co2Emissions: dvlaData.co2Emissions,
            fuelType: dvlaData.fuelType,
            colour: dvlaData.colour,
            carMake: dvlaData.make,
            carModel: oneAutoBasicVehicleInfo.model_range_desc,
            variant: oneAutoBasicVehicleInfo.trim_level_desc,
            vehicleShortDescription: oneAutoBasicVehicleInfo.derivative_desc,
            vehicleFullDescription: oneAutoBasicVehicleInfo.vehicle_desc,
            bodyType: oneAutoBasicVehicleInfo.autotrader_body_type_desc,
            transmission: oneAutoBasicVehicleInfo.autotrader_transmission_desc,
            drivetrainType: oneAutoBasicVehicleInfo.autotrader_drivetrain_type_desc,
            numberOfSeats: oneAutoBasicVehicleInfo.number_seats,
            numberOfDoors: oneAutoBasicVehicleInfo.number_doors,
            dateOfFirstRegistration: oneAutoBasicVehicleInfo.first_registration_date,
            vehicleIdentificationNumber: oneAutoBasicVehicleInfo.vehicle_identification_number,
            isStolen: oneAutoBasicVehicleCheck.is_stolen,
            isScrapped: oneAutoBasicVehicleCheck.is_scrapped,
            isExported: oneAutoBasicVehicleCheck.is_exported,
            isImported: oneAutoBasicVehicleCheck.is_imported,
            numberOfPreviousKeepers: oneAutoBasicVehicleCheck.number_previous_keepers,
            dateOfLastKeeperChange: oneAutoBasicVehicleCheck.date_of_last_keeper_change,
            previousKeeperAcquisitionDate: oneAutoBasicVehicleCheck.previous_keeper_acquisition_date
        };

        // Return the filtered data to the frontend
        res.json(carDetails);
    } catch (error) {
        console.error('Error fetching car details:', error);
        res.status(500).json({ message: 'Failed to fetch car details.' });
    }

};
