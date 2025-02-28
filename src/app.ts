import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import passport from 'passport';
import session from 'express-session';
import mongoose from 'mongoose';

import { userRoutes } from './routes/userRoutes.js';
import { authRoutes } from './routes/authRoutes.js'
import { uploadRoutes } from './routes/uploadRoutes.js';
import carMakeRoutes from "./routes/carMakeRoutes.js";
import carDetailsRoutes from "./routes/carDetailsRoutes.js";
import carAdvertRoutes from "./routes/carAdvertRoutes.js";
import carSearchRoutes from "./routes/carSearchRoutes.js";

const app = express();
app.use(express.json());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'your-secret-key', resave: false, saveUninitialized: false }));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI!)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/car-advert', carAdvertRoutes);
app.use('/api/car-search', carSearchRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use("/api/upload", uploadRoutes);
app.use('/api/car-makes', carMakeRoutes);
app.use('/api/car-details', carDetailsRoutes);

export default app;