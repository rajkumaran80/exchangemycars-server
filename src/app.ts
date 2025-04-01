import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import session from 'express-session';
import mongoose from 'mongoose';
import passport from 'passport';
import cors from 'cors';

import { authRoutes } from './routes/authRoutes.js'
import { uploadRoutes } from './routes/uploadRoutes.js';
import carMakeRoutes from "./routes/carMakeRoutes.js";
import carDetailsRoutes from "./routes/carDetailsRoutes.js";
import carAdvertRoutes from "./routes/carAdvertRoutes.js";
import carSearchRoutes from "./routes/carSearchRoutes.js";
import {configureGoogleStrategy, configureFacebookStrategy, configureLocalStrategy} from '././utils/authStrategy.js';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// Enable CORS for all origins (if you want to restrict, use origin: 'http://your-frontend-origin')
app.use(cors({
  origin: '*', // Allow all origins (or specify your frontend URL here like 'http://localhost:3000')
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allow these HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allow these headers
}));

app.use((req, res, next) => {
    console.log("Incoming request:", req.path, req.headers.authorization, req.method);
    next();
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI!)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Call both strategy configuration functions
configureLocalStrategy();
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