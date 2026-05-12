import Joi from "joi";

export const signupSchema = Joi.object({
    fullName: Joi.string().required().min(3).max(50),
    email: Joi.string().email().required(),
    password: Joi.string().required().min(6),
});

export const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});
