import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, {JwtPayload} from 'jsonwebtoken';
import User from '../models/User.js';
import admin from 'firebase-admin';

import axios from "axios";
import passport from "passport";
import app from "../app.js";

export const register = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  try {
    const user = new User({ name, email, password: password });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
    const user2 = await User.findOne({ email });
    if (!user2) return res.status(400).json({ message: 'User not found...' + email});
    console.log("userpassword:" + user2.password);

  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found...' + email});
    console.log(password + ":" + user.password);
    const isMatch = await bcrypt.compare(password, user.password!);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const jwtToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, { expiresIn: '24h' });
    res.status(200).json({ token: jwtToken, user: { name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error });
  }
};

export const authenticate = async (req: any, res: any, next: any) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload & { id: string };
    console.info("decoded:" + JSON.stringify(decoded));
    // Fetch the full user document from the database
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    // Attach the full user document to the request
    req.user = user;
    next();
  }
  catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

export const verifyToken = async (req: any, res: any, next: any) => {
  const { token } = req.body;
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    res.status(200).send(decodedToken);
  } catch (error) {
    res.status(401).send({ error: 'Invalid token' });
  }
};


