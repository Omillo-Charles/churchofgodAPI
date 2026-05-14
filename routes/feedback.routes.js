import { Router } from 'express';
import { submitFeedback } from '../controllers/feedback.controller.js';
import { isAuthenticated } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.js';
import { feedbackSchema } from '../validations/member.validation.js';

const router = Router();

// POST /api/v1/feedback
router.post('/', isAuthenticated, validate(feedbackSchema), submitFeedback);

export default router;
