import prisma from '../database/postgresql.js';

// POST /api/v1/announcements
// Handles announcement creation. Verified that user is CLERGY or ADMIN.
export const createAnnouncement = async (req, res, next) => {
    const { title, body } = req.body;

    if (!title || !body) {
        return res.status(400).json({
            success: false,
            message: 'Title and body are required fields.',
        });
    }

    try {
        const announcement = await prisma.announcement.create({
            data: {
                title,
                body,
                authorId: req.user.id,
            },
            include: {
                author: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });

        res.status(201).json({
            success: true,
            message: 'Announcement created successfully!',
            data: announcement,
        });
    } catch (error) {
        console.error('Create Announcement Error:', error.message);
        next(error);
    }
};

// GET /api/v1/announcements
// Public route to fetch all announcements ordered by newest first.
export const getAnnouncements = async (req, res, next) => {
    try {
        const announcements = await prisma.announcement.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                author: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });

        res.status(200).json({
            success: true,
            data: announcements,
        });
    } catch (error) {
        console.error('Get Announcements Error:', error.message);
        next(error);
    }
};

// GET /api/v1/announcements/:id
// Public route to fetch a single announcement by ID.
export const getAnnouncementById = async (req, res, next) => {
    const { id } = req.params;

    try {
        const announcement = await prisma.announcement.findUnique({
            where: { id },
            include: {
                author: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });

        if (!announcement) {
            return res.status(404).json({
                success: false,
                message: 'Announcement not found.',
            });
        }

        res.status(200).json({
            success: true,
            data: announcement,
        });
    } catch (error) {
        console.error('Get Announcement By ID Error:', error.message);
        next(error);
    }
};

// PATCH /api/v1/announcements/:id
// Protected route to update an announcement. Only author or ADMIN can update.
export const updateAnnouncement = async (req, res, next) => {
    const { id } = req.params;
    const { title, body } = req.body;

    try {
        const existingAnnouncement = await prisma.announcement.findUnique({
            where: { id },
        });

        if (!existingAnnouncement) {
            return res.status(404).json({
                success: false,
                message: 'Announcement not found.',
            });
        }

        // Authorization check: User must be ADMIN or the original author of the announcement
        if (req.user.role !== 'ADMIN' && req.user.id !== existingAnnouncement.authorId) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to update this announcement.',
            });
        }

        const updatedAnnouncement = await prisma.announcement.update({
            where: { id },
            data: {
                title: title !== undefined ? title : existingAnnouncement.title,
                body: body !== undefined ? body : existingAnnouncement.body,
            },
            include: {
                author: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });

        res.status(200).json({
            success: true,
            message: 'Announcement updated successfully!',
            data: updatedAnnouncement,
        });
    } catch (error) {
        console.error('Update Announcement Error:', error.message);
        next(error);
    }
};

// DELETE /api/v1/announcements/:id
// Protected route to delete an announcement. Only author or ADMIN can delete.
export const deleteAnnouncement = async (req, res, next) => {
    const { id } = req.params;

    try {
        const existingAnnouncement = await prisma.announcement.findUnique({
            where: { id },
        });

        if (!existingAnnouncement) {
            return res.status(404).json({
                success: false,
                message: 'Announcement not found.',
            });
        }

        // Authorization check: User must be ADMIN or the original author of the announcement
        if (req.user.role !== 'ADMIN' && req.user.id !== existingAnnouncement.authorId) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to delete this announcement.',
            });
        }

        await prisma.announcement.delete({
            where: { id },
        });

        res.status(200).json({
            success: true,
            message: 'Announcement deleted successfully!',
        });
    } catch (error) {
        console.error('Delete Announcement Error:', error.message);
        next(error);
    }
};
