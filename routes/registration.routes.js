import express from 'express';
import { getRegistrations, getRegistrationStats } from '../controllers/registration.controller.js';
import { isAuthenticated, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All registration routes require authentication and Clergy/Admin authorization
router.use(isAuthenticated);
router.use(authorize('CLERGY', 'ADMIN'));

router.get('/', getRegistrations);
router.get('/stats', getRegistrationStats);

export default router;
