import { Router } from 'express';
import { searchCars, searchFilters } from "../controllers/carSearchController.js";
const carSearchRoutes = Router();
// GET /api/cars - Get all cars
carSearchRoutes.get('/', searchCars);
carSearchRoutes.post('/filters', searchFilters);
export default carSearchRoutes;
