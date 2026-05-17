import { Router } from 'express';
import { createEvent, getEvents, getEventById, updateEvent, deleteEvent } from '../controllers/event.controller.js';
import { isAuthenticated } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/upload.middleware.js';

const router = Router();

// GET /api/v1/events
// Public route to retrieve all events
router.get('/', getEvents);

// GET /api/v1/events/:id
// Public route to retrieve a single event details
router.get('/:id', getEventById);

// POST /api/v1/events
// Protected route to create a new event with optional image upload
router.post('/', isAuthenticated, upload.single('image'), createEvent);

// PATCH /api/v1/events/:id
// Protected route to update an event with optional new image upload
router.patch('/:id', isAuthenticated, upload.single('image'), updateEvent);

// DELETE /api/v1/events/:id
// Protected route to delete an event and clean up Cloudinary assets
router.delete('/:id', isAuthenticated, deleteEvent);

export default router;
