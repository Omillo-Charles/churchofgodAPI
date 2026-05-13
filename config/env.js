import { config } from 'dotenv';

config({ path: '.env' });

export const {
    PORT,
    DATABASE_URL,
    NODE_ENV,
    JWT_SECRET,
    JWT_EXPIRY,
    JWT_REFRESH_SECRET,
    JWT_REFRESH_EXPIRY,
    EMAIL_USER,
    EMAIL_PASSWORD,
    WEB_URL,
} = process.env;

