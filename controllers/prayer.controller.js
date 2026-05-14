import { sendEmail } from '../utils/mailer.js';
import { prayerRequestTemplate } from '../utils/emailTemplates.js';
import { EMAIL_USER } from '../config/env.js';
import prisma from '../database/postgresql.js';

/**
 * Handles the submission of member prayer requests.
 * Sends an email to the church clergy.
 */
export const submitPrayerRequest = async (req, res, next) => {
    const { subject, details, isUrgent } = req.body;
    const userId = req.user.id;

    try {
        // 1. Fetch the member details
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
        const emailHtml = prayerRequestTemplate({
            name: user.fullName,
            email: user.email,
            subject: subject || 'Prayer Request',
            details: details,
            isUrgent: isUrgent || false
        });

        // 3. Send the email to the church admin/clergy
        await sendEmail({
            to: EMAIL_USER,
            subject: `${isUrgent ? '[URGENT] ' : ''}[Prayer Request] ${subject || 'New Request'}`,
            html: emailHtml,
            replyTo: user.email
        });

        res.status(200).json({
            success: true,
            message: 'Your prayer request has been submitted. Our clergy will stand with you in prayer.'
        });
    } catch (error) {
        next(error);
    }
};
