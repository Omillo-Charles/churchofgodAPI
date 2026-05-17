import prisma from '../database/postgresql.js';
import { uploadBufferToCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';

// POST /api/v1/events
// Handles event creation with optional image upload to Cloudinary
export const createEvent = async (req, res, next) => {
    const { title, description, date, time, location, fee, category } = req.body;

    // Validate required fields
    if (!title || !date || !location) {
        return res.status(400).json({
            success: false,
            message: 'Title, date, and location are required fields.',
        });
    }

    try {
        let imageUrl = null;

        // Upload the image from memory buffer to Cloudinary if provided
        if (req.file) {
            const uploadResult = await uploadBufferToCloudinary(req.file.buffer, 'events');
            imageUrl = uploadResult.url;
        }

        // Create the event record in the database
        const event = await prisma.event.create({
            data: {
                title,
                description: description || null,
                date:        new Date(date),
                time:        time        || null,
                location,
                fee:         fee ? parseFloat(fee) : 0,
                category:    category    || null,
                imageUrl,
            },
        });

        res.status(201).json({
            success: true,
            message: 'Event created successfully!',
            data:    event,
        });
    } catch (error) {
        console.error('Create Event Error:', error.message);
        next(error);
    }
};

// GET /api/v1/events
// Fetches all upcoming and past events from the database
export const getEvents = async (req, res, next) => {
    try {
        const events = await prisma.event.findMany({
            orderBy: { date: 'asc' },
        });

        res.status(200).json({
            success: true,
            data:    events,
        });
    } catch (error) {
        console.error('Get Events Error:', error.message);
        next(error);
    }
};

// GET /api/v1/events/:id
// Fetches a single event by its ID
export const getEventById = async (req, res, next) => {
    const { id } = req.params;

    try {
        const event = await prisma.event.findUnique({
            where: { id },
        });

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found.',
            });
        }

        res.status(200).json({
            success: true,
            data:    event,
        });
    } catch (error) {
        console.error('Get Event By ID Error:', error.message);
        next(error);
    }
};

// PATCH /api/v1/events/:id
// Updates an event with optional new image upload
export const updateEvent = async (req, res, next) => {
    const { id } = req.params;
    const { title, description, date, time, location, fee, category } = req.body;

    try {
        const existingEvent = await prisma.event.findUnique({
            where: { id },
        });

        if (!existingEvent) {
            return res.status(404).json({
                success: false,
                message: 'Event not found.',
            });
        }

        let imageUrl = existingEvent.imageUrl;

        // If a new image is uploaded, upload to Cloudinary and replace the old one
        if (req.file) {
            const uploadResult = await uploadBufferToCloudinary(req.file.buffer, 'events');
            imageUrl = uploadResult.url;

            // Extract public ID from the previous image URL to clean it up
            if (existingEvent.imageUrl) {
                const parts = existingEvent.imageUrl.split('/');
                const fileName = parts[parts.length - 1];
                const publicId = `events/${fileName.split('.')[0]}`;
                await deleteFromCloudinary(publicId).catch(err => 
                    console.error('Failed to delete old Cloudinary image:', err.message)
                );
            }
        }

        // Update the event fields in the database
        const updatedEvent = await prisma.event.update({
            where: { id },
            data: {
                title:       title       !== undefined ? title                  : existingEvent.title,
                description: description !== undefined ? description            : existingEvent.description,
                date:        date        !== undefined ? new Date(date)         : existingEvent.date,
                time:        time        !== undefined ? time                   : existingEvent.time,
                location:    location    !== undefined ? location               : existingEvent.location,
                fee:         fee         !== undefined ? parseFloat(fee)        : existingEvent.fee,
                category:    category    !== undefined ? category               : existingEvent.category,
                imageUrl:    imageUrl,
            },
        });

        res.status(200).json({
            success: true,
            message: 'Event updated successfully!',
            data:    updatedEvent,
        });
    } catch (error) {
        console.error('Update Event Error:', error.message);
        next(error);
    }
};

// DELETE /api/v1/events/:id
// Deletes an event and cleans up its image from Cloudinary
export const deleteEvent = async (req, res, next) => {
    const { id } = req.params;

    try {
        const event = await prisma.event.findUnique({
            where: { id },
        });

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found.',
            });
        }

        // Clean up image from Cloudinary if one exists
        if (event.imageUrl) {
            const parts = event.imageUrl.split('/');
            const fileName = parts[parts.length - 1];
            const publicId = `events/${fileName.split('.')[0]}`;
            await deleteFromCloudinary(publicId).catch(err => 
                console.error('Failed to delete Cloudinary image on event deletion:', err.message)
            );
        }

        // Remove the event record from the database
        await prisma.event.delete({
            where: { id },
        });

        res.status(200).json({
            success: true,
            message: 'Event deleted successfully!',
        });
    } catch (error) {
        console.error('Delete Event Error:', error.message);
        next(error);
    }
};
