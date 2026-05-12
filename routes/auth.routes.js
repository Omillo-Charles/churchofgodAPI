import express from "express";
import { signUp, signIn, signOut, forgotPassword, resetPassword } from "../controllers/auth/auth.controller.js";

const router = express.Router();

router.post("/signup", signUp);
router.post("/signin", signIn);
router.post("/signout", signOut);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
