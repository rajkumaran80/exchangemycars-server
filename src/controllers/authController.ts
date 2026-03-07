import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { hashPassword } from '../models/User.js';
import prisma from '../utils/prisma.js';
import passport from "passport";

export const register = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  try {
    const hashed = await hashPassword(password);
    const user = await prisma.user.create({
      data: { name, email, password: hashed }
    });
    res.status(201).json({ message: 'User registered successfully' });
    console.log("user created:", user.email);
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error });
  }
};

export const login1 = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ message: 'User not found...' + email });
    console.log(password + ":" + user.password);
    const isMatch = await bcrypt.compare(password, user.password!);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const jwtToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '24h' });
    res.status(200).json({ token: jwtToken, user: { name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error });
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('local', { session: true }, (err: any, user: any, info: any) => {
    if (err) return res.status(500).json({ message: 'Internal Server Error' });
    if (!user) return res.status(400).json({ message: info?.message || 'Login failed' });

    req.login(user, (loginErr: any) => {
      if (loginErr) return res.status(500).json({ message: 'Login failed' });

      const jwtToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '24h' });
      res.status(200).json({ token: jwtToken, user: { name: user.name, email: user.email } });
    });
  })(req, res, next);
};

export const authenticate = async (req: any, res: any, next: any) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload & { userId: string };
    console.info("decoded:" + JSON.stringify(decoded));
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};
