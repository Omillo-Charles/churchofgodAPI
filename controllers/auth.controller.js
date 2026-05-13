import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../database/postgresql.js';
import { JWT_SECRET, JWT_EXPIRY, NODE_ENV, WEB_URL } from '../config/env.js';
import { sendEmail } from '../utils/mailer.js';
import { forgotPasswordTemplate, passwordResetSuccessTemplate } from '../utils/emailTemplates.js';

// POST /api/v1/auth/signup
export const signUp = async (req, res, next) => {
    const { fullName, email, password } = req.body;

    // Basic field validation
    if (!fullName || !email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Full name, email, and password are required.',
        });
    }

    if (password.length < 8) {
        return res.status(400).json({
            success: false,
            message: 'Password must be at least 8 characters long.',
        });
    }

    try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'An account with this email already exists.',
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const user = await prisma.user.create({
            data: {
                fullName,
                email,
                password: hashedPassword,
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                createdAt: true,
            },
        });

        return res.status(201).json({
            success: true,
            message: 'Account created successfully! Please sign in.',
            user,
        });
    } catch (error) {
        next(error);
    }
};

// POST /api/v1/auth/signin
export const signIn = async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Email and password are required.',
        });
    }

    try {
        // Find user
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.',
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.',
            });
        }

        // Sign JWT
        const token = jwt.sign(
            { id: user.id, role: user.role },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRY || '7d' }
        );

        // Set httpOnly cookie
        res.cookie('ntcogk_token', token, {
            httpOnly: true,
            secure: NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
        });

        return res.status(200).json({
            success: true,
            message: 'Welcome back!',
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        next(error);
    }
};

// POST /api/v1/auth/signout
export const signOut = async (req, res) => {
    res.clearCookie('ntcogk_token', {
        httpOnly: true,
        secure: NODE_ENV === 'production',
        sameSite: 'lax',
    });

    return res.status(200).json({
        success: true,
        message: 'You have been signed out successfully.',
    });
};

// POST /api/v1/auth/forgot-password
export const forgotPassword = async (req, res, next) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    try {
        const user = await prisma.user.findUnique({ where: { email } });

        // Always respond with success to prevent email enumeration attacks
        if (!user) {
            return res.status(200).json({
                success: true,
                message: 'If an account with that email exists, a recovery link has been sent.',
            });
        }

        // Generate a secure random token
        const rawToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
        const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Persist hashed token and expiry
        await prisma.user.update({
            where: { email },
            data: {
                resetToken: hashedToken,
                resetTokenExpiry: expiry,
            },
        });

        // Build reset URL using the raw token (never stored)
        const resetUrl = `${WEB_URL || 'http://localhost:3000'}/auth/reset-password?token=${rawToken}`;
        const firstName = user.fullName.split(' ')[0];

        await sendEmail({
            to: user.email,
            subject: 'Reset your NTCOGK Portal password',
            html: forgotPasswordTemplate(firstName, resetUrl),
        });

        return res.status(200).json({
            success: true,
            message: 'If an account with that email exists, a recovery link has been sent.',
        });
    } catch (error) {
        next(error);
    }
};

// POST /api/v1/auth/reset-password
export const resetPassword = async (req, res, next) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({ success: false, message: 'Token and new password are required.' });
    }

    if (newPassword.length < 8) {
        return res.status(400).json({
            success: false,
            message: 'Password must be at least 8 characters long.',
        });
    }

    try {
        // Hash the incoming raw token to compare against the stored hash
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await prisma.user.findFirst({
            where: {
                resetToken: hashedToken,
                resetTokenExpiry: { gt: new Date() },
            },
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'This reset link is invalid or has expired. Please request a new one.',
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // Update password and clear the reset token fields
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null,
            },
        });

        const firstName = user.fullName.split(' ')[0];

        await sendEmail({
            to: user.email,
            subject: 'Your NTCOGK Portal password has been updated',
            html: passwordResetSuccessTemplate(firstName),
        });

        return res.status(200).json({
            success: true,
            message: 'Password reset successful! You can now sign in with your new password.',
        });
    } catch (error) {
        next(error);
    }
};
