// src/routes/authRoutes.ts
import express from 'express';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import passport from 'passport';
const authRoutes = express.Router();
// Register a new user
authRoutes.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
        // Create a new user
        const newUser = new User({ name, email, password });
        await newUser.save();
        // Generate a JWT token
        const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
            expiresIn: '1h',
        });
        res.status(201).json({ token, user: { id: newUser._id, name: newUser.name, email: newUser.email } });
    }
    catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// Email/Password Login
authRoutes.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err)
            return res.status(500).json({ message: 'Server error' });
        if (!user)
            return res.status(400).json({ message: info.message });
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ token, user: { id: user._id, name: user.name, email: user.email } });
    })(req, res, next);
});
// Google Login
authRoutes.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
authRoutes.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: 'User not authenticated' });
    }
    const user = req.user;
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.redirect(`http://localhost:3000?token=${token}`);
});
// Facebook Login
// router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));
// router.get('/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/login' }), (req, res) => {
//   if (!req.user) {
//     return res.status(401).json({ message: 'User not authenticated' });
//   }
//   const user = req.user as IUser;
//   const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET!, { expiresIn: '1h' });
//   res.redirect(`http://localhost:3000?token=${token}`);
// });
// // LinkedIn Login
// router.get('/linkedin', passport.authenticate('linkedin'));
// router.get('/linkedin/callback', passport.authenticate('linkedin', { failureRedirect: '/login' }), (req, res) => {
//   if (!req.user) {
//     return res.status(401).json({ message: 'User not authenticated' });
//   }
//   const user = req.user as IUser;
//   const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET!, { expiresIn: '1h' });
//   res.redirect(`http://localhost:3000?token=${token}`);
// });
// Apple Login
// router.get('/apple', passport.authenticate('apple'));
// router.get('/apple/callback', passport.authenticate('apple', { failureRedirect: '/login' }), (req, res) => {
//   if (!req.user) {
//     return res.status(401).json({ message: 'User not authenticated' });
//   }
//   const user = req.user as IUser;
//   const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET!, { expiresIn: '1h' });
//   res.redirect(`http://localhost:3000?token=${token}`);
// });
export { authRoutes };
