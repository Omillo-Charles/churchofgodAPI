import { Router } from 'express';
import { submitFeedback } from '../controllers/feedback.controller.js';
import { isAuthenticated } from '../middlewares/auth.middleware.js';

const router = Router();

// POST /api/v1/feedback
router.post('/', isAuthenticated, submitFeedback);

export default router;
