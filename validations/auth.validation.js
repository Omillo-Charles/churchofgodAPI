import Joi from "joi";

export const signupSchema = Joi.object({
    fullName: Joi.string().required().min(3).max(50),
    email: Joi.string().email().required(),
    password: Joi.string()
        .required()
        .min(8)
        .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$'))
        .messages({
            "string.pattern.base": "Password must be at least 8 characters long, include an uppercase letter, a lowercase letter, a number, and a special character.",
            "string.min": "Password must be at least 8 characters long."
        }),
});

export const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});

export const forgotPasswordSchema = Joi.object({
    email: Joi.string().email().required(),
});

export const resetPasswordSchema = Joi.object({
    token: Joi.string().required(),
    newPassword: Joi.string()
        .required()
        .min(8)
        .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$'))
        .messages({
            "string.pattern.base": "Password must be at least 8 characters long, include an uppercase letter, a lowercase letter, a number, and a special character.",
            "string.min": "Password must be at least 8 characters long."
        }),
});
