import dotenv from 'dotenv';
dotenv.config();

import passport from 'passport';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as LocalStrategy } from 'passport-local';
import { comparePassword } from '../models/User.js';
import prisma from './prisma.js';
import jwt from 'jsonwebtoken';

console.log('GOOGLE_CLIENT_ID' + process.env.GOOGLE_CLIENT_ID);

export const configureLocalStrategy = () => {
    passport.use(new LocalStrategy(
        {
            usernameField: 'email',
            passwordField: 'password',
        },
        async (email, password, done) => {
            try {
                const user = await prisma.user.findUnique({ where: { email } });

                if (!user) return done(null, false, { message: 'User not found' });

                if (!password || !user.password) {
                    return done(null, false, { message: 'Invalid credentials' });
                }

                const isMatch = await comparePassword(password, user.password);
                if (!isMatch) return done(null, false, { message: 'Invalid credentials' });

                return done(null, user);
            } catch (error) {
                return done(error);
            }
        }
    ));

    passport.serializeUser((user: any, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id: string, done) => {
        try {
            const user = await prisma.user.findUnique({ where: { id } });
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
            let user = await prisma.user.findFirst({ where: { googleId: profile.id } });

            if (!user) {
                user = await prisma.user.create({
                    data: {
                        name: profile.displayName,
                        email: profile.emails![0]?.value,
                        googleId: profile.id,
                    }
                });
            }

            const jwtToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '24h' });

            console.log('jwtToken: ' + jwtToken);

            return done(null, { token: jwtToken, user: { name: user.name, email: user.email } } as any);
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
