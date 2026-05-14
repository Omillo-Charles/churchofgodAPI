import { Router } from 'express';
import { getProfile } from '../controllers/user.controller.js';
import { isAuthenticated } from '../middlewares/auth.middleware.js';

const router = Router();

// GET /api/v1/users/me
router.get('/me', isAuthenticated, getProfile);

export default router;
