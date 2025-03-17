import axios from 'axios';
import logger from "../utils/logger.js";
const baseUrl = process.env.ONE_AUTO_API_BASE_URL;
const apiKey = process.env.ONE_AUTO_API_KEY;
const dvlaUrl = process.env.DVLA_URL;
const dvlaKey = process.env.DVLA_KEY;
export const getCarDetails = async (req, res) => {
    logger.info(`getCarDetails request ${req}`);
    const { registrationNumber, mileage } = req.body;
    if (!registrationNumber || !mileage) {
        return res.status(400).json({ message: 'Registration number and mileage are required.' });
    }
    console.log("dvlaKey: " + dvlaKey);
    try {
        const dvlaResponse = await axios.post(dvlaUrl, {
            registrationNumber
        }, {
            headers: {
                'x-api-key': dvlaKey,
            },
        });
        if (dvlaResponse.status !== 200) {
            return res.status(400).json({ message: 'Sorry unable to find the vehicle details from dvla' });
        }
        const oneAutoResponse = await axios.get(`${baseUrl}/ukvehicledata/vehicleandmodeldetailsfromvrm/v2?vehicle_registration_mark=${registrationNumber}`, {
            headers: {
                'x-api-key': apiKey,
            },
        });
        // const oneAutoResponse = await axios.get(
        //     `${baseUrl}/autotrader/vehiclelookupfromvrm/v2?vehicle_registration_mark=${registrationNumber}`,
        //     {
        //         headers: {
        //             'x-api-key': apiKey,
        //         },
        //     }
        // );
        if (oneAutoResponse.status !== 200) {
            return res.status(400).json({ message: 'Sorry unable to find the vehicle details from ' });
        }
        const dvlaData = dvlaResponse.data;
        const oneAutoData = oneAutoResponse.data.result;
        // const oneAutoVehicleBasicDetails = oneAutoResponse.data.result.basic_vehicle_info;
        // const oneAutoBasicVehicleCheck = oneAutoResponse.data.result.basic_vehicle_check;
        console.log(JSON.stringify(oneAutoData));
        const keeperChange = oneAutoData.vehicle_details?.keeper_change_list?.[0]; // Get first entry safely
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
            colour: dvlaData.colour,
            carMake: oneAutoData.model_details?.model_data?.manufacturer_desc,
            carModel: oneAutoData.model_details?.model_data?.model_desc,
            variant: oneAutoData.model_details?.model_data?.model_variant,
            carModelDescription: oneAutoData.vehicle_details?.vehicle_identification?.dvla_model_desc,
            bodyType: oneAutoData.model_details?.model_data?.model_range_desc,
            fuelType: oneAutoData.model_details?.model_data?.ukvd_fuel_type_desc,
            emissionClass: oneAutoData.model_details?.model_data?.emission_class,
            //vehicleShortDescription: oneAutoVehicleModelDetails.derivative_desc,
            //vehicleFullDescription: oneAutoVehicleModelDetails.vehicle_desc,
            numberOfSeats: oneAutoData.model_details?.body_details.number_seats,
            numberOfDoors: oneAutoData.model_details?.body_details.number_doors,
            transmission: oneAutoData.model_details?.transmission?.transmission_type,
            drivetrainType: oneAutoData.model_details?.transmission?.drive_type_desc,
            dateOfFirstRegistration: oneAutoData.vehicle_details?.vehicle_identification?.first_registration_date,
            vehicleIdentificationNumber: oneAutoData.vehicle_details?.vehicle_identification?.vehicle_identification_number,
            // isStolen: oneAutoData.vehicle_details?.vehicle_status_details?.is_stolen,
            isScrapped: oneAutoData.vehicle_details?.vehicle_status_details?.is_scrapped,
            isExported: oneAutoData.vehicle_details?.vehicle_status_details?.is_exported,
            isImported: oneAutoData.vehicle_details?.vehicle_status_details?.is_imported,
            isNonEUImported: oneAutoData.vehicle_details?.vehicle_status_details?.is_non_eu_import,
            numberOfPreviousKeepers: keeperChange?.number_previous_keepers || 0,
            dateOfLastKeeperChange: keeperChange?.date_of_last_keeper_change || null,
            //previousKeeperAcquisitionDate: oneAutoData.vehicle_details?.keeper_change_list?.date_of_last_keeper_change,
            co2Emission: oneAutoData.model_details?.emissions.co2_gkm,
            fuel_economy: oneAutoData.model_details?.fuel_economy
            // carModel: oneAutoVehicleBasicDetails.model_range_desc,
            // variant: oneAutoVehicleBasicDetails.trim_level_desc,
            // vehicleShortDescription: oneAutoVehicleBasicDetails.derivative_desc,
            // vehicleFullDescription: oneAutoVehicleBasicDetails.vehicle_desc,
            // bodyType: oneAutoVehicleBasicDetails.autotrader_body_type_desc,
            // transmission: oneAutoVehicleBasicDetails.autotrader_transmission_desc,
            // drivetrainType: oneAutoVehicleBasicDetails.autotrader_drivetrain_type_desc,
            // numberOfSeats: oneAutoVehicleBasicDetails.number_seats,
            // numberOfDoors: oneAutoVehicleBasicDetails.number_doors,
            // dateOfFirstRegistration: oneAutoVehicleBasicDetails.first_registration_date,
            // vehicleIdentificationNumber: oneAutoVehicleBasicDetails.vehicle_identification_number,
            // isStolen: oneAutoBasicVehicleCheck.is_stolen,
            // isScrapped: oneAutoBasicVehicleCheck.is_scrapped,
            // isExported: oneAutoBasicVehicleCheck.is_exported,
            // isImported: oneAutoBasicVehicleCheck.is_imported,
            // numberOfPreviousKeepers: oneAutoBasicVehicleCheck.number_previous_keepers,
            // dateOfLastKeeperChange: oneAutoBasicVehicleCheck.date_of_last_keeper_change,
            // previousKeeperAcquisitionDate: oneAutoBasicVehicleCheck.previous_keeper_acquisition_date
        };
        console.log(carDetails);
        // Return the filtered data to the frontend
        res.json(carDetails);
    }
    catch (error) {
        console.error('Error fetching car details:', error);
        res.status(500).json({ message: 'Failed to fetch car details.' });
    }
};
