import { Router } from 'express';
import Car from '../models/Car.js';
import { sendEmailNotification } from '../utils/email.js';
import { createCar, getAllCars, getCarById, updateCar } from '../controllers/carsController.js';
import { authenticate } from '../controllers/authController.js';

const carRoutes = Router();

// GET /api/cars - Get all cars
carRoutes.get('/', getAllCars);

// POST /api/cars - Create a new car
carRoutes.post('/', authenticate, createCar); // Protect the route

// GET /api/cars/:id - Get a single car by ID
carRoutes.get('/:id', getCarById);

// PUT /api/cars/:id - Update a car by ID
carRoutes.put('/:id', authenticate, updateCar);


// Express interest in a car
carRoutes.post('/:id/interest', async (req, res) => {
  try {
    const car = await Car.findById(req.params.id).populate('owner');
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    const interestedCarId = req.body.interestedCarId;
    car.interestedCars.push(interestedCarId);
    await car.save();

    // Check if the owner field is populated and has an email property
    if (typeof car.owner === 'object' && 'email' in car.owner) {
      // Send email notification to the car owner
      await sendEmailNotification(
        car.owner.email,
        'New Interest in Your Car',
        `Someone is interested in your ${car.make} ${car.model}.`
      );
    } else {
      console.error('Owner field is not populated or does not have an email property');
    }

    res.status(200).json({ message: 'Interest expressed successfully' });
  } catch (error) {
    console.error('Error expressing interest:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export { carRoutes };