import prisma from '../database/postgresql.js';

// GET /api/v1/users/me
export const getProfile = async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                phone: true,
                homeCounty: true,
                churchName: true,
                ministry: true,
                address: true,
                bio: true,
                googleId: true,
                githubId: true,
                createdAt: true,
            },
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.',
            });
        }

        res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

// PATCH /api/v1/users/me
export const updateProfile = async (req, res, next) => {
    const { fullName, phone, homeCounty, churchName, ministry, address, bio } = req.body;

    try {
        const updatedUser = await prisma.user.update({
            where: { id: req.user.id },
            data: {
                fullName,
                phone,
                homeCounty,
                churchName,
                ministry,
                address,
                bio,
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                phone: true,
                homeCounty: true,
                churchName: true,
                ministry: true,
                address: true,
                bio: true,
                createdAt: true,
            },
        });

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully!',
            data: updatedUser,
        });
    } catch (error) {
        next(error);
    }
};

// DELETE /api/v1/users/me
export const deleteAccount = async (req, res, next) => {
    try {
        // Delete user from database
        await prisma.user.delete({
            where: { id: req.user.id },
        });

        // Clear cookies
        res.clearCookie('jwt');
        res.clearCookie('connect.sid'); // If using sessions

        res.status(200).json({
            success: true,
            message: 'Account deleted successfully.',
        });
    } catch (error) {
        next(error);
    }
};
