import { Router } from 'express';
import { submitPrayerRequest } from '../controllers/prayer.controller.js';
import { isAuthenticated } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.js';
import { prayerSchema } from '../validations/member.validation.js';

const router = Router();

// POST /api/v1/prayer
router.post('/', isAuthenticated, validate(prayerSchema), submitPrayerRequest);

export default router;
