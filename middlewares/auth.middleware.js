import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env.js';
import prisma from '../database/postgresql.js';

export const isAuthenticated = async (req, res, next) => {
    const token = req.cookies.ntcogk_token;

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized. Please log in to access this resource.',
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Verify if user still exists in database
        const user = await prisma.user.findUnique({ where: { id: decoded.id } });
        
        if (!user) {
            res.clearCookie('ntcogk_token');
            return res.status(401).json({
                success: false,
                message: 'User account no longer exists. Please log in again.',
            });
        }

        req.user = user; // Attach full user object
        next();
    } catch (error) {
        res.clearCookie('ntcogk_token');
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token. Please log in again.',
        });
    }
};

export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role ${req.user.role} is not authorized to access this resource`,
            });
        }
        next();
    };
};
