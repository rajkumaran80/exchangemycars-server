import { Router } from 'express';
import { sendEmailNotification } from '../utils/email.js';
import { createCarAdvert } from '../controllers/carAdvertController.js';
import { authenticate } from '../controllers/authController.js';
import {searchCars, searchFilters} from "../controllers/carSearchController.js";

const carSearchRoutes = Router();

// GET /api/cars - Get all cars
carSearchRoutes.get('/', searchCars);
carSearchRoutes.post('/filters', searchFilters);

export default carSearchRoutes;
