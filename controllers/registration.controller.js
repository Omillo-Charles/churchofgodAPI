import prisma from '../database/postgresql.js';

// GET /api/v1/registrations
// Fetches event registrations with filters for admin use
export const getRegistrations = async (req, res, next) => {
    const { 
        eventId, 
        sortOrder, // 'asc' or 'desc'
        churchName, 
        district, 
        region,
        paymentStatus,
        status 
    } = req.query;

    try {
        const where = {};

        if (eventId) {
            where.eventId = eventId;
        }

        if (churchName) {
            where.churchName = {
                contains: churchName,
                mode: 'insensitive'
            };
        }

        if (district) {
            where.district = {
                contains: district,
                mode: 'insensitive'
            };
        }

        if (region) {
            where.region = {
                contains: region,
                mode: 'insensitive'
            };
        }

        if (paymentStatus) {
            where.paymentStatus = paymentStatus;
        }

        if (status) {
            where.status = status;
        }

        const orderBy = [];
        
        if (sortOrder === 'asc' || sortOrder === 'desc') {
            orderBy.push({ fullName: sortOrder });
        } else {
            orderBy.push({ createdAt: 'desc' });
        }

        const registrations = await prisma.eventRegistration.findMany({
            where,
            include: {
                event: {
                    select: {
                        title: true,
                        date: true,
                        location: true
                    }
                }
            },
            orderBy
        });

        res.status(200).json({
            success: true,
            data: registrations,
        });
    } catch (error) {
        console.error('Get Registrations Error:', error.message);
        next(error);
    }
};

// GET /api/v1/registrations/stats
// Fetches summary stats for registrations (optional but useful)
export const getRegistrationStats = async (req, res, next) => {
    try {
        const stats = await prisma.eventRegistration.groupBy({
            by: ['paymentStatus'],
            _count: {
                id: true
            }
        });

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Get Registration Stats Error:', error.message);
        next(error);
    }
};
