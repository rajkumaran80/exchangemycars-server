import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import session from 'express-session';
import mongoose from 'mongoose';
import cors from 'cors';
import passport from 'passport';
import { authRoutes } from './routes/authRoutes.js';
import { uploadRoutes } from './routes/uploadRoutes.js';
import carMakeRoutes from "./routes/carMakeRoutes.js";
import carDetailsRoutes from "./routes/carDetailsRoutes.js";
import carAdvertRoutes from "./routes/carAdvertRoutes.js";
import carSearchRoutes from "./routes/carSearchRoutes.js";
import { configureGoogleStrategy } from '././utils/authStrategy.js';
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use((req, res, next) => {
    console.log("Incoming request:", req.path, req.headers.authorization, req.method);
    next();
});
// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection error:', err));
// Call both strategy configuration functions
configureGoogleStrategy();
// configureFacebookStrategy();
// Routes
app.use('/api/car-advert', carAdvertRoutes);
app.use('/api/car-search', carSearchRoutes);
app.use("/api/upload", uploadRoutes);
app.use('/api/car-makes', carMakeRoutes);
app.use('/api/car-details', carDetailsRoutes);
app.use('/api/auth', authRoutes);
export default app;
