import { sendEmail } from '../utils/mailer.js';
import { feedbackTemplate } from '../utils/emailTemplates.js';
import { EMAIL_USER } from '../config/env.js';
import prisma from '../database/postgresql.js';


// Handles the submission of member feedback.
// Sends an email to the church administration.
export const submitFeedback = async (req, res, next) => {
    const { subject, message } = req.body;
    const userId = req.user.id;

    try {
        // 1. Fetch the user's full details from the database
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { fullName: true, email: true }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        // 2. Prepare the email content
        const emailHtml = feedbackTemplate({
            name: user.fullName,
            email: user.email,
            subject: subject || 'General Feedback',
            message: message
        });

        // 3. Send the email to the church admin email
        await sendEmail({
            to: EMAIL_USER, // Sending to ourselves (the church admin)
            subject: `[Member Feedback] ${subject || 'New Feedback'}`,
            html: emailHtml,
            replyTo: user.email // So admin can reply directly to the member
        });

        res.status(200).json({
            success: true,
            message: 'Feedback submitted successfully! Thank you for your input.'
        });
    } catch (error) {
        next(error);
    }
};
