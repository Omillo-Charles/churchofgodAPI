import nodemailer from 'nodemailer';
import { EMAIL_USER, EMAIL_PASSWORD } from '../config/env.js';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASSWORD,
    },
});

/**
 * Send an email.
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML body
 */
export const sendEmail = async ({ to, subject, html }) => {
    await transporter.sendMail({
        from: `"NTCOGK Portal" <${EMAIL_USER}>`,
        to,
        subject,
        html,
    });
};
