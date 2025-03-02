import { Router } from "express";
import { getCarDetails } from "../controllers/carDetailsController.js";
const carDetailsRoutes = Router();
carDetailsRoutes.post('/', getCarDetails);
export default carDetailsRoutes;
