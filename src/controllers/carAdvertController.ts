import { Request, Response } from 'express';
import axios from 'axios';
import logger from '../utils/logger.js';
import { IUser } from '../models/User.js';
import { downloadPresignedUrl } from './uploadController.js';
import prisma from '../utils/prisma.js';

const API_URL = process.env.CHECK_CAR_DETAILS_API_URL;
const API_KEY = process.env.CHECK_CAR_DETAILS_API_KEY;

const getPostcodeCoordinates = async (postcode: string) => {
    const cleanedPostcode = postcode.replace(/\s/g, '');
    const response = await axios.get(
        `https://api.postcodes.io/postcodes/${encodeURIComponent(cleanedPostcode)}`
    );
    if (response.data.status === 200) {
        return {
            latitude: response.data.result.latitude,
            longitude: response.data.result.longitude,
        };
    }
    throw new Error(`Postcode lookup failed for "${cleanedPostcode}"`);
};

const fetchUkVehicleData = async (registrationNumber: string) => {
    const vrm = registrationNumber.replace(/\s/g, '').toUpperCase();
    const response = await axios.get(
        `${API_URL}/ukvehicledata?apikey=${API_KEY}&vrm=${vrm}`
    );
    return response.data;
};

const fetchVehicleSpecs = async (registrationNumber: string) => {
    const vrm = registrationNumber.replace(/\s/g, '').toUpperCase();
    const response = await axios.get(
        `${API_URL}/vehiclespecs?apikey=${API_KEY}&vrm=${vrm}`
    );
    return response.data;
};

const isElectric = (fuelType: string) =>
    ['ELECTRIC', 'ELECTRICITY'].includes(fuelType?.toUpperCase() ?? '');

const getChargeTimeAtMaxPower = (port: any): number | null => {
    const times = port?.ChargeTimes?.AverageChargeTimes10To80Percent;
    if (!times?.length) return null;
    const match = times.find((t: any) => t.ChargePortKw === port.MaxChargePowerKw);
    return match?.TimeInMinutes ?? times[times.length - 1]?.TimeInMinutes ?? null;
};

export const getCarAdvert = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const advert = await prisma.carAdvert.findUnique({
            where: { id },
            include: { owner: true },
        });

        if (!advert) {
            return res.status(404).json({ message: 'Car advert not found' });
        }

        const presignedPhotos = advert.images.length > 0
            ? await Promise.all(advert.images.map(img => downloadPresignedUrl(img)))
            : [];

        const { owner, ...advertData } = advert;
        const { password: _, ...safeOwner } = owner;
        res.json({ ...advertData, images: presignedPhotos, owner: safeOwner });
    } catch (error) {
        logger.error('Error fetching car advert:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const createCarAdvert = async (req: Request, res: Response) => {
    logger.info(`createCarAdvert request received`);

    try {
        const { registrationNumber, mileage, title, description, price, images, email, mobile, postcode } = req.body;

        if (!postcode) return res.status(400).json({ message: 'Postcode is required' });
        if (!registrationNumber) return res.status(400).json({ message: 'Registration number is required' });
        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

        // Fetch full vehicle data and postcode coordinates in parallel
        const [vehicleData, coordinates] = await Promise.all([
            fetchUkVehicleData(registrationNumber),
            getPostcodeCoordinates(postcode),
        ]);

        if (!coordinates) return res.status(400).json({ message: 'Invalid postcode' });

        const vr   = vehicleData.VehicleRegistration;
        const dim  = vehicleData.Dimensions;
        const hist = vehicleData.VehicleHistory;
        const smmt = vehicleData.SmmtDetails;
        const gen  = vehicleData.General;
        const eng  = vehicleData.Engine;
        const perf = vehicleData.Performance;
        const cons = vehicleData.Consumption;
        const ved  = vehicleData.vedRate;

        const keeperChange = hist?.KeeperChangesList?.[0];

        // If EV, fetch vehiclespecs for battery/range/charging data
        let evDetails: any = null;
        if (isElectric(vr.FuelType)) {
            try {
                const specsData = await fetchVehicleSpecs(registrationNumber);
                evDetails = specsData?.PowerSource?.ElectricDetails ?? null;
            } catch {
                logger.warn('vehiclespecs call failed for EV — EV fields will be null');
            }
        }

        const evBattery  = evDetails?.BatteryDetailsList?.[0] ?? null;
        const evMotor    = evDetails?.MotorDetailsList?.[0] ?? null;
        const evAcPort   = evDetails?.ChargePortDetailsList?.find((p: any) => !p.PortType?.includes('CCS')) ?? null;
        const evDcPort   = evDetails?.ChargePortDetailsList?.find((p: any) => p.PortType?.includes('CCS')) ?? null;

        const user = req.user as IUser;

        const savedCarAdvert = await prisma.carAdvert.create({
            data: {
                ownerId:    user.id,
                mileage:    Number(mileage),
                title:      title,
                description: description,
                price:      Number(price),
                images:     images ?? [],
                email:      email,
                mobile:     mobile,
                postcode:   postcode,
                latitude:   coordinates.latitude,
                longitude:  coordinates.longitude,

                // From ukvehicledata VehicleRegistration
                registrationNumber:          vr.Vrm ?? registrationNumber,
                carMake:                     vr.Make,
                carModel:                    smmt?.Range ?? vr.Model,
                variant:                     smmt?.ModelVariant ?? vr.Model,
                carModelDescription:         vr.MakeModel ?? vr.Model,
                colour:                      vr.Colour,
                fuelType:                    vr.FuelType,
                transmission:                vr.TransmissionType ?? vr.Transmission,
                yearOfManufacture:           Number(vr.YearOfManufacture),
                dateOfFirstRegistration:     vr.DateFirstRegisteredUk ?? vr.DateFirstRegistered ?? '',
                vehicleIdentificationNumber: vr.Vin ?? '',
                isScrapped:                  vr.Scrapped ?? false,
                isExported:                  vr.Exported ?? false,
                isImported:                  vr.Imported ?? false,
                isStolen:                    false,

                // From Dimensions
                numberOfSeats: dim?.NumberOfSeats ?? 0,
                numberOfDoors: dim?.NumberOfDoors ?? 0,

                // From SmmtDetails
                bodyType:      smmt?.BodyStyle ?? '',
                drivetrainType: smmt?.DriveType ?? '',
                emissionClass: gen?.EuroStatus ?? '',

                // From VehicleHistory
                numberOfPreviousKeepers: hist?.NumberOfPreviousKeepers ?? 0,
                dateOfLastKeeperChange:  keeperChange?.DateOfLastKeeperChange
                    ? new Date(keeperChange.DateOfLastKeeperChange).toISOString().split('T')[0]
                    : '',

                // Engine
                engineCapacity:     vr.EngineCapacity ? Number(vr.EngineCapacity) : null,
                engineSizeL:        smmt?.NominalEngineCapacity ?? null,
                engineDescription:  eng?.Description ?? null,
                engineCylinders:    eng?.NumberOfCylinders ?? null,
                engineAspiration:   eng?.Aspiration ?? null,
                powerBhp:           perf?.Power?.Bhp ?? null,
                powerKw:            perf?.Power?.Kw ?? null,
                torqueNm:           perf?.Torque?.Nm ?? null,
                co2Emissions:       vr.Co2Emissions ?? perf?.Co2 ?? null,

                // Performance
                acceleration0To60:  perf?.Acceleration?.ZeroTo60Mph ?? null,
                maxSpeedMph:        perf?.MaxSpeed?.Mph ?? null,

                // Fuel consumption
                fuelConsumptionCombinedMpg:    cons?.Combined?.Mpg ?? null,
                fuelConsumptionUrbanMpg:        cons?.UrbanCold?.Mpg ?? null,
                fuelConsumptionExtraUrbanMpg:   cons?.ExtraUrban?.Mpg ?? null,

                // Road tax
                roadTaxYearly:   ved?.Standard?.TwelveMonth ?? null,
                roadTaxSixMonth: ved?.Standard?.SixMonth ?? null,
                vedBand:         ved?.vedBand ?? null,

                // Origin
                countryOfOrigin: smmt?.CountryOfOrigin ?? null,

                // EV (only populated when fuelType is electric)
                evRangeWltpMiles:        evDetails?.RangeFigures?.RealRangeMiles ?? null,
                evBatteryDescription:    evBattery?.BatteryDescription ?? null,
                evBatteryCapacityKwh:    evBattery?.CapacityKwh ?? null,
                evBatteryWarrantyMonths: evBattery?.BatteryWarrantyMonths ?? null,
                evBatteryWarrantyMiles:  evBattery?.BatteryWarrantyMiles ?? null,
                evMaxAcChargePowerKw:    evAcPort?.MaxChargePowerKw ?? null,
                evMaxDcChargePowerKw:    evDcPort?.MaxChargePowerKw ?? null,
                evChargeTimeAcMins:      getChargeTimeAtMaxPower(evAcPort),
                evChargeTimeDcMins:      getChargeTimeAtMaxPower(evDcPort),
                evMotorType:             evMotor?.MotorType ?? null,
            },
            include: { owner: true },
        });

        const presignedPhotos = savedCarAdvert.images.length > 0
            ? await Promise.all(savedCarAdvert.images.map(img => downloadPresignedUrl(img)))
            : [];

        const { owner, ...advertData } = savedCarAdvert;
        const { password: _, ...safeOwner } = owner;
        res.status(201).json({ ...advertData, images: presignedPhotos, owner: safeOwner });
    } catch (error: any) {
        const detail = error?.response?.data ?? error?.message ?? String(error);
        logger.error('Error creating car advert:', detail);
        res.status(500).json({ message: 'Server error', detail });
    }
};
