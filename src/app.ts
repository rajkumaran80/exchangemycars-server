import dotenv from 'dotenv';
dotenv.config();


import express from 'express';
import passport from 'passport';
import session from 'express-session';
import mongoose from 'mongoose';

import { carRoutes } from './routes/carRoutes.js';
import { userRoutes } from './routes/userRoutes.js';
import { authRoutes } from './routes/authRoutes.js'



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
app.use('/api/cars', carRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);

export default app;