import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as LinkedInStrategy } from 'passport-linkedin-oauth2';
import User from '../models/User';
import dotenv from 'dotenv';
dotenv.config(); // Ensure .env variables are loaded
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET);
// Email/Password Strategy
passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
    try {
        const user = await User.findOne({ email });
        if (!user)
            return done(null, false, { message: 'User not found' });
        const isMatch = await user.comparePassword(password);
        if (!isMatch)
            return done(null, false, { message: 'Invalid credentials' });
        return done(null, user);
    }
    catch (error) {
        return done(error);
    }
}));
// Google Strategy
// passport.use(
//   new GoogleStrategy(
//     {
//       clientID: process.env.GOOGLE_CLIENT_ID!,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
//       callbackURL: '/api/auth/google/callback',
//     },
//     async (accessToken, refreshToken, profile, done) => {
//       try {
//         let user = await User.findOne({ googleId: profile.id });
//         if (!user) {
//           user = new User({
//             googleId: profile.id,
//             email: profile.emails?.[0].value,
//             name: profile.displayName,
//           });
//           await user.save();
//         }
//         done(null, user);
//       } catch (error) {
//         done(error);
//       }
//     }
//   )
// );
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackURL: '/auth/google/callback',
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
            user = new User({
                googleId: profile.id,
                email: profile.emails?.[0].value,
                name: profile.displayName,
            });
            await user.save();
        }
        done(null, user);
    }
    catch (error) {
        done(error);
    }
}));
// Facebook Strategy
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: '/api/auth/facebook/callback',
    profileFields: ['id', 'emails', 'name'],
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ facebookId: profile.id });
        if (!user) {
            user = new User({
                facebookId: profile.id,
                email: profile.emails?.[0].value,
                name: `${profile.name?.givenName} ${profile.name?.familyName}`,
            });
            await user.save();
        }
        done(null, user);
    }
    catch (error) {
        done(error);
    }
}));
// LinkedIn Strategy
passport.use(new LinkedInStrategy({
    clientID: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    callbackURL: '/api/auth/linkedin/callback',
    scope: ['r_emailaddress', 'r_liteprofile'],
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ linkedinId: profile.id });
        if (!user) {
            user = new User({
                linkedinId: profile.id,
                email: profile.emails?.[0].value,
                name: `${profile.name?.givenName} ${profile.name?.familyName}`,
            });
            await user.save();
        }
        done(null, user);
    }
    catch (error) {
        done(error);
    }
}));
// Apple Strategy
// passport.use(
//   new AppleStrategy(
//     {
//       clientID: process.env.APPLE_CLIENT_ID!,
//       teamID: process.env.APPLE_TEAM_ID!,
//       keyID: process.env.APPLE_KEY_ID!,
//       keyFilePath: process.env.APPLE_KEY_FILE_PATH!,
//       callbackURL: '/api/auth/apple/callback',
//     },
//     async (accessToken, refreshToken, profile, done) => {
//       try {
//         let user = await User.findOne({ appleId: profile.id });
//         if (!user) {
//           user = new User({
//             appleId: profile.id,
//             email: profile.email,
//             name: profile.name,
//           });
//           await user.save();
//         }
//         done(null, user);
//       } catch (error) {
//         done(error);
//       }
//     }
//   )
// );
// Serialize and Deserialize User
passport.serializeUser((reqUser, done) => {
    const user = reqUser;
    done(null, user._id);
});
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    }
    catch (error) {
        done(error);
    }
});
