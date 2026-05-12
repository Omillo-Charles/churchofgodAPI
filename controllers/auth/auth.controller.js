import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import prisma from "../../database/Neon.js";
import { signupSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from "../../validations/auth.validation.js";
import { JWT_SECRET, JWT_EXPIRY, FRONTEND_LOCAL_URL } from "../../config/env.js";
import { sendEmail } from "../../utils/sendEmail.js";

export const signUp = async (req, res) => {
    try {
        const { error } = signupSchema.validate(req.body);
        if (error) return res.status(400).json({ success: false, message: error.details[0].message });

        const { fullName, email, password } = req.body;

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) return res.status(400).json({ success: false, message: "User already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                fullName,
                email,
                password: hashedPassword,
                role: "MEMBER",
            },
        });

        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRY });

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        const { password: _, ...userWithoutPassword } = user;
        res.status(201).json({ success: true, message: "User created successfully", data: userWithoutPassword });
    } catch (error) {
        console.error("SignUp Error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const signIn = async (req, res) => {
    try {
        const { error } = loginSchema.validate(req.body);
        if (error) return res.status(400).json({ success: false, message: error.details[0].message });

        const { email, password } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.password) return res.status(401).json({ success: false, message: "Invalid credentials" });

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return res.status(401).json({ success: false, message: "Invalid credentials" });

        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRY });

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        const { password: _, ...userWithoutPassword } = user;
        res.status(200).json({ success: true, message: "Login successful", data: userWithoutPassword });
    } catch (error) {
        console.error("SignIn Error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const signOut = async (req, res) => {
    res.clearCookie("token");
    res.status(200).json({ success: true, message: "Logged out successfully" });
};

export const forgotPassword = async (req, res) => {
    try {
        const { error } = forgotPasswordSchema.validate(req.body);
        if (error) return res.status(400).json({ success: false, message: error.details[0].message });

        const { email } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            // Security: Don't reveal if user exists, but for now we'll be helpful or follow standard pattern
            return res.status(200).json({ success: true, message: "If an account exists, a reset link has been sent." });
        }

        const resetToken = crypto.randomBytes(32).toString("hex");
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

        await prisma.user.update({
            where: { email },
            data: { resetToken, resetTokenExpiry },
        });

        const resetLink = `${FRONTEND_LOCAL_URL}/auth/reset-password?token=${resetToken}`;

        await sendEmail({
            to: email,
            subject: "Password Reset Request - NTCOGK Portal",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
                    <h2 style="color: #f59e0b; text-align: center;">Password Reset</h2>
                    <p>Hello ${user.fullName},</p>
                    <p>You requested to reset your password for your NTCOGK Portal account. Click the button below to set a new password:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetLink}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
                    </div>
                    <p>This link will expire in 1 hour. If you didn't request this, please ignore this email.</p>
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                    <p style="font-size: 12px; color: #6b7280; text-align: center;">NTCOGK Digital Community</p>
                </div>
            `,
        });

        res.status(200).json({ success: true, message: "Reset link sent to email" });
    } catch (error) {
        console.error("ForgotPassword Error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { error } = resetPasswordSchema.validate(req.body);
        if (error) return res.status(400).json({ success: false, message: error.details[0].message });

        const { token, newPassword } = req.body;

        const user = await prisma.user.findFirst({
            where: {
                resetToken: token,
                resetTokenExpiry: { gt: new Date() },
            },
        });

        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid or expired reset token" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null,
            },
        });

        res.status(200).json({ success: true, message: "Password reset successful" });
    } catch (error) {
        console.error("ResetPassword Error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
