import { Router } from 'express';
import {
    createAnnouncement,
    getAnnouncements,
    getAnnouncementById,
    updateAnnouncement,
    deleteAnnouncement,
} from '../controllers/announcement.controller.js';
import { isAuthenticated, authorize } from '../middlewares/auth.middleware.js';

const router = Router();

// GET /api/v1/announcements
// Public route to retrieve all announcements
router.get('/', getAnnouncements);

// GET /api/v1/announcements/:id
// Public route to retrieve a single announcement details
router.get('/:id', getAnnouncementById);

// POST /api/v1/announcements
// Protected route to create a new announcement (Only Admin or Clergy)
router.post('/', isAuthenticated, authorize('ADMIN', 'CLERGY'), createAnnouncement);

// PATCH /api/v1/announcements/:id
// Protected route to update an announcement (Only Admin or Clergy)
router.patch('/:id', isAuthenticated, authorize('ADMIN', 'CLERGY'), updateAnnouncement);

// DELETE /api/v1/announcements/:id
// Protected route to delete an announcement (Only Admin or Clergy)
router.delete('/:id', isAuthenticated, authorize('ADMIN', 'CLERGY'), deleteAnnouncement);

export default router;
