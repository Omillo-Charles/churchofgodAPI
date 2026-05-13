import { Router } from 'express';
import { signUp, signIn, signOut, forgotPassword, resetPassword } from '../controllers/auth.controller.js';
import { authLimiter } from '../middlewares/limit.middleware.js';

const router = Router();

// POST /api/v1/auth/signup
router.post('/signup', authLimiter, signUp);

// POST /api/v1/auth/signin
router.post('/signin', authLimiter, signIn);

// POST /api/v1/auth/signout
router.post('/signout', signOut);

// POST /api/v1/auth/forgot-password
router.post('/forgot-password', authLimiter, forgotPassword);

// POST /api/v1/auth/reset-password
router.post('/reset-password', authLimiter, resetPassword);

export default router;
