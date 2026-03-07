import express from 'express';
import {register, login} from '../controllers/authController.js';
import passport from "passport";
import app from "../app.js";
// import {googleAuth} from "../controllers/googleAuthController.js";

const authRoutes = express.Router();

authRoutes.post('/register', register);
authRoutes.post('/login', login);
// authRoutes.post('/google', googleAuth);
//authRoutes.post('/verifyToken', verifyToken);


// Google authentication route
authRoutes.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

authRoutes.get("/google/callback",
    passport.authenticate("google", { session: false, failureRedirect: "/login" }),
    (req, res) => {


    console.log('google callback');
        console.log('user' + JSON.stringify(req.user));

        if (!req.user) {
            return res.redirect(`${process.env.FRONTEND_URL}/login?error=AuthenticationFailed`);
        }

        // Extract token and user info from req.user
        const { token, user } = req.user as unknown as { token: string; user: { name: string; email: string } };

        // Redirect to frontend with token and user info
        const encodedUser = encodeURIComponent(JSON.stringify(user)); // Encode user data
        res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}&user=${encodedUser}`);
    }
);

export { authRoutes };
