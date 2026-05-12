import nodemailer from "nodemailer";
import { EMAIL_USER, EMAIL_PASSWORD } from "../config/env.js";

const transporter = nodemailer.createTransport({
    service: "gmail", 
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASSWORD,
    },
});

export const sendEmail = async ({ to, subject, html }) => {
    try {
        await transporter.sendMail({
            from: `"NTCOGK Portal" <${EMAIL_USER}>`,
            to,
            subject,
            html,
        });
    } catch (error) {
        console.error("Error sending email:", error);
        throw new Error("Email sending failed");
    }
};
