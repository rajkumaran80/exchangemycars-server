import {Router} from "express";
// import dotenv from "dotenv";
import {authenticate} from "../controllers/authController.js";
import {uploadPresignedUrl} from "../controllers/uploadController.js";

// dotenv.config();

const uploadRoutes = Router();

uploadRoutes.get('/presigned-url', authenticate, uploadPresignedUrl);

export {uploadRoutes};
