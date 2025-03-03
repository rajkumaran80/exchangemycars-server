import { Request, Response } from 'express';
import logger from '../utils/logger.js';
import { IUser } from '../models/User.js';
import {downloadPresignedUrl} from "./uploadController.js";
import CarAdvert, {ICarAdvert} from "../models/CarAdvert.js";
import axios from "axios";

// Helper function to get coordinates from UK postcode
const getPostcodeCoordinates = async (postcode: string) => {
  try {
    const cleanedPostcode = postcode.replace(/\s/g, '');
    const response = await axios.get(
        `https://api.postcodes.io/postcodes/${encodeURIComponent(cleanedPostcode)}`
    );

    if (response.data.status === 200) {
      return {
        latitude: response.data.result.latitude,
        longitude: response.data.result.longitude
      };
    } else {
      // Throw error for non-200 API response status
      throw new Error(`Postcode lookup failed for "${cleanedPostcode}": ${response.data.error}`);
    }
  } catch (error) {
    // Log and rethrow the error
    logger.error('Postcode lookup failed:', error);
    throw error;
  }
};

export const createCarAdvert = async (req: Request, res: Response) => {
  logger.info(`createCarAdvert request received`);

  try {
    // Extract carDetails and advertDetails from the request body
    const carDetails = req.body;

    console.log(JSON.stringify(carDetails));

    // Validate required fields
    if (!carDetails.postcode) {
      return res.status(400).json({ message: "Postcode is required" });
    }

    // Get coordinates for postcode
    const coordinates = await getPostcodeCoordinates(carDetails.postcode);
    if (!coordinates) {
      return res.status(400).json({ message: "Invalid postcode" });
    }

    // Ensure the user is authenticated
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Extract the user ID from the authenticated request
    const user = req.user as IUser;
    const owner = user._id;

    // Step 1: Create and save the Car document
    const newCarAdvert = new CarAdvert({
      ...carDetails,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      owner, // Link the car to the user
    });

    const savedCarAdvert = await newCarAdvert.save();

    const presignedPhotos = savedCarAdvert?.images
        ? await Promise.all(savedCarAdvert.images.map(image => downloadPresignedUrl(image)))
        : [];
    savedCarAdvert.images = presignedPhotos;

    // Return the created advert along with the car details
    res.status(201).json(savedCarAdvert);
  } catch (error) {
    logger.error("Error creating car advert:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// export const getAllCarAdverts = async (req: Request, res: Response) => {
//     logger.info(`get cars request ${req}`);
//   try {
//     const cars = await Car.find().populate('owner', 'name email'); // Populate owner details
//     res.status(200).json(cars);
//   } catch (error) {
//     console.error('Error fetching cars:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

// Create a new car
// export const createCarAdvert = async (req: Request, res: Response) => {
//   logger.info(`createCarAdvert request ${req}`);
//
//   try {
//     const { name, carModel, year, price, description, imageUrl, interestedInExchange } = req.body;
//
//     // Ensure the user is authenticated
//     if (!req.user) {
//       return res.status(401).json({ message: 'Unauthorized' });
//     }
//
//     // Extract the user ID from the authenticated request
//     const user = req.user as IUser;
//     const owner = user._id; // Assuming req.user is set by your authentication middleware
//
//     const newCar = new Car({
//       name,
//       carModel,
//       year,
//       price,
//       description,
//       imageUrl,
//       owner, // Link the car to the user
//       interestedInExchange,
//     });
//
//     await newCar.save();
//     res.status(201).json(newCar);
//   } catch (error) {
//     console.error('Error creating car:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// };
//
// Get a single car by ID
// export const getCarById = async (req: Request, res: Response) => {
//   try {
//     const car = await Car.findById(req.params.id).populate('owner', 'name email');
//     if (!car) {
//       return res.status(404).json({ message: 'Car not found' });
//     }
//     res.status(200).json(car);
//   } catch (error) {
//     console.error('Error fetching car:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

// Update a car by ID
// export const updateCar = async (req: Request, res: Response) => {
//   try {
//     const { make, carModel, year, price, description, imageUrl, interestedInExchange } = req.body;
//
//     const updatedCar = await Car.findByIdAndUpdate(
//       req.params.id,
//       { make, carModel, year, price, description, imageUrl, interestedInExchange },
//       { new: true } // Return the updated document
//     );
//
//     if (!updatedCar) {
//       return res.status(404).json({ message: 'Car not found' });
//     }
//
//     res.status(200).json(updatedCar);
//   } catch (error) {
//     console.error('Error updating car:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

// Delete a car by ID
// export const deleteCar = async (req: Request, res: Response) => {
//   try {
//     const deletedCar = await Car.findByIdAndDelete(req.params.id);
//     if (!deletedCar) {
//       return res.status(404).json({ message: 'Car not found' });
//     }
//     res.status(200).json({ message: 'Car deleted successfully' });
//   } catch (error) {
//     console.error('Error deleting car:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// };