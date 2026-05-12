import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../../database/Neon.js";
import { signupSchema, loginSchema } from "../../validations/auth.validation.js";
import { JWT_SECRET, JWT_EXPIRY } from "../../config/env.js";

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
