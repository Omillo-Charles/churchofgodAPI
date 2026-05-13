import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env.js';

export const isAuthenticated = (req, res, next) => {
    const token = req.cookies.ntcogk_token;

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized. Please log in to access this resource.',
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
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
