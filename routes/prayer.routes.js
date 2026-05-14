import { Router } from 'express';
import { submitPrayerRequest } from '../controllers/prayer.controller.js';
import { isAuthenticated } from '../middlewares/auth.middleware.js';

const router = Router();

// POST /api/v1/prayer
router.post('/', isAuthenticated, submitPrayerRequest);

export default router;
