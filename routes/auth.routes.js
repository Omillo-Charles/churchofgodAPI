import { Router } from 'express';
import { signUp, signIn, signOut, forgotPassword, resetPassword } from '../controllers/auth.controller.js';

const router = Router();

// POST /api/v1/auth/signup
router.post('/signup', signUp);

// POST /api/v1/auth/signin
router.post('/signin', signIn);

// POST /api/v1/auth/signout
router.post('/signout', signOut);

// POST /api/v1/auth/forgot-password
router.post('/forgot-password', forgotPassword);

// POST /api/v1/auth/reset-password
router.post('/reset-password', resetPassword);

export default router;
