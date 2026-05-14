import { Router } from 'express';
import passport from 'passport';
import { signUp, signIn, signOut, forgotPassword, resetPassword, socialAuthSuccess } from '../controllers/auth.controller.js';
import { authLimiter } from '../middlewares/limit.middleware.js';
import { validate } from '../middlewares/validate.js';
import { signupSchema, signinSchema } from '../validations/auth.validation.js';

const router = Router();

// POST /api/v1/auth/signup
router.post('/signup', authLimiter, validate(signupSchema), signUp);

// POST /api/v1/auth/signin
router.post('/signin', authLimiter, validate(signinSchema), signIn);

// POST /api/v1/auth/signout
router.post('/signout', signOut);

// POST /api/v1/auth/forgot-password
router.post('/forgot-password', authLimiter, forgotPassword);

// POST /api/v1/auth/reset-password
router.post('/reset-password', authLimiter, resetPassword);

// Google Auth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/auth?error=google_failed', session: false }), socialAuthSuccess);

// GitHub Auth
router.get('/github', passport.authenticate('github', { scope: ['user:email'], session: false }));
router.get('/github/callback', passport.authenticate('github', { failureRedirect: '/auth?error=github_failed', session: false }), socialAuthSuccess);

export default router;
