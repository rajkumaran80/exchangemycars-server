import dotenv from 'dotenv';
dotenv.config();
import passport from 'passport';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from "../models/User.js";
import jwt from 'jsonwebtoken';
console.log('GOOGLE_CLIENT_ID' + process.env.GOOGLE_CLIENT_ID);
export const configureGoogleStrategy = () => {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.BACKEND_URL}/api/auth/google/callback`,
        scope: ['profile', 'email'],
        state: true
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            // Check if the user already exists in the database
            let user = await User.findOne({ googleId: profile.id });
            if (!user) {
                // Create a new user if not found
                user = new User({
                    name: profile.displayName,
                    email: profile.emails[0]?.value,
                    googleId: profile.id,
                });
                await user.save();
            }
            // Generate JWT token
            const jwtToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
            console.log('jwtToken: ' + jwtToken);
            // You can either return the JWT or attach it to the user object (if needed)
            return done(null, { token: jwtToken, user: { name: user.name, email: user.email } });
        }
        catch (error) {
            return done(error);
        }
    }));
};
export const configureFacebookStrategy = () => {
    passport.use(new FacebookStrategy({
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: `${process.env.CLIENT_URL}/auth/facebook/callback`,
        profileFields: ['id', 'emails', 'name']
    }, (accessToken, refreshToken, profile, done) => {
        return done(null, profile);
    }));
};
