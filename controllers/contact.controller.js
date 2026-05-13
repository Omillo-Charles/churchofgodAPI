import prisma from '../database/postgresql.js';

// POST /api/v1/contact
export const createContact = async (req, res, next) => {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
        return res.status(400).json({
            success: false,
            message: 'All fields are required.',
        });
    }

    try {
        const contact = await prisma.contact.create({
            data: {
                name,
                email,
                phone,
                subject,
                message,
            },
        });

        return res.status(201).json({
            success: true,
            message: 'Your message has been sent successfully. We will get back to you soon!',
            contact,
        });
    } catch (error) {
        next(error);
    }
};
