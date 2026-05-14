import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/user.controller.js';
import { isAuthenticated } from '../middlewares/auth.middleware.js';

const router = Router();

// GET /api/v1/users/me
router.get('/me', isAuthenticated, getProfile);

// PATCH /api/v1/users/me
router.patch('/me', isAuthenticated, updateProfile);

export default router;
