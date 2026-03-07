import { Router } from 'express';
import { createCarAdvert, getCarAdvert } from '../controllers/carAdvertController.js';
import { authenticate } from '../controllers/authController.js';

const carAdvertRoutes = Router();

carAdvertRoutes.get('/:id', getCarAdvert);
carAdvertRoutes.post('/', authenticate, createCarAdvert);

export default carAdvertRoutes;
