import dotenv from 'dotenv';
dotenv.config();

import passport from 'passport';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as LocalStrategy } from 'passport-local';
import User from "../models/User.js";
import jwt from 'jsonwebtoken';

console.log('GOOGLE_CLIENT_ID' + process.env.GOOGLE_CLIENT_ID);

export const configureLocalStrategy = () => {
    passport.use(new LocalStrategy(
        {
            usernameField: 'email', // Username field is email in this case
            passwordField: 'password', // Password field
        },
        async (email, password, done) => {
            try {
                const user = await User.findOne({ email });

                // Check if user exists
                if (!user) return done(null, false, { message: 'User not found' });

                // Ensure both password and user.password are defined and not empty
                if (!password || !user.password) {
                    return done(null, false, { message: 'Invalid credentials' });
                }

                // Compare password and hash
                const isMatch = user.comparePassword(password);
                if (!isMatch) return done(null, false, { message: 'Invalid credentials' });

                // If successful, return the user object
                return done(null, user);
            } catch (error) {
                return done(error);
            }
        }
    ));

    // Serialize user into the session
    passport.serializeUser((user, done) => {
        // @ts-ignore
        done(null, user._id);
    });

    // Deserialize user from session
    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (error) {
            done(error, null);
        }
    });
};



export const configureGoogleStrategy = () => {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
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
                    email: profile.emails![0]?.value,
                    googleId: profile.id,
                });
                await user.save();
            }

            // Generate JWT token
            const jwtToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, { expiresIn: '24h' });


            console.log('jwtToken: ' + jwtToken);

            // You can either return the JWT or attach it to the user object (if needed)
            return done(null, { token: jwtToken, user: { name: user.name, email: user.email } });
        } catch (error) {
            return done(error);
        }
    }));
};

export const configureFacebookStrategy = () => {
    passport.use(new FacebookStrategy({
        clientID: process.env.FACEBOOK_APP_ID!,
        clientSecret: process.env.FACEBOOK_APP_SECRET!,
        callbackURL: `${process.env.CLIENT_URL}/auth/facebook/callback`,
        profileFields: ['id', 'emails', 'name']
    }, (accessToken, refreshToken, profile, done) => {
        return done(null, profile);
    }));
};

