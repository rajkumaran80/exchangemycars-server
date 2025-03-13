import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import User from "../models/User.js";

// Initialize OAuth2Client with your Google Client ID
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID!);

// Function to verify Google Token and create a JWT for the user
export const googleAuth = async (req: Request, res: Response) => {
    const { token } = req.body; // Google ID Token sent from frontend


    console.log('token:' + token);

    try {
        // Step 1: Verify the Google ID Token using OAuth2Client
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID!, // Your Google Client ID
        });

        // Step 2: Get the user information from the decoded payload
        const payload = ticket.getPayload();
        if (!payload) {
            return res.status(400).json({ error: 'Invalid Google ID token' });
        }

        // Check if the user already exists in the database
        let user = await User.findOne({ googleId: payload.sub });

        if (!user) {
            // Step 3: If the user does not exist, create a new user
            user = new User({
                name: payload.name,
                email: payload.email,
                googleId: payload.sub,
            });
            await user.save();
        }

        // Step 4: Generate a JWT for the user
        const jwtToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, { expiresIn: '24h' });

        // Step 5: Send the JWT token and user details back to the frontend
        res.status(200).json({ token: jwtToken, user: { name: user.name, email: user.email } });

    } catch (error) {
        console.error('Error verifying Google token:', error);
        res.status(400).json({ error: 'Google authentication failed' });
    }
};
