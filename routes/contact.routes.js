import { Router } from 'express';
import { createContact } from '../controllers/contact.controller.js';
import { authLimiter } from '../middlewares/limit.middleware.js';

const router = Router();

// POST /api/v1/contact
router.post('/', authLimiter, createContact);

export default router;
