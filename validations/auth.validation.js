import { z } from "zod";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const signupSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters long"),
  email: z.string().regex(emailRegex, "Invalid email address").transform(val => val.toLowerCase()),
  password: z.string().regex(passwordRegex, "Password must be at least 8 characters and include uppercase, lowercase, number, and special character"),
});

export const signinSchema = z.object({
  email: z.string().regex(emailRegex, "Invalid email address").transform(val => val.toLowerCase()),
  password: z.string().min(1, "Password is required"),
});
