import { Router } from 'express';
import { createCarAdvert } from '../controllers/carAdvertController.js';
import { authenticate } from '../controllers/authController.js';
const carAdvertRoutes = Router();
// POST /api/cars - Create a new car
carAdvertRoutes.post('/', authenticate, createCarAdvert);
export default carAdvertRoutes;
