import { Router } from 'express';
import { createContact } from '../controllers/contact.controller.js';

const router = Router();

// POST /api/v1/contact
router.post('/', createContact);

export default router;
