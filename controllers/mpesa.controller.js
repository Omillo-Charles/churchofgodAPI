import prisma from '../database/postgresql.js';
import { NODE_ENV, MPESA_SHORTCODE, MPESA_CALLBACK_URL } from '../config/env.js';
import { formatPhoneNumber, getTimestamp, generatePassword, getMpesaAccessToken } from '../utils/mpesa.js';

// Resolve the correct Daraja API base URL based on environment
const MPESA_BASE_URL = NODE_ENV === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke';

// POST /api/v1/payments/stkpush
// Creates a pending EventRegistration then triggers the M-Pesa STK prompt on the user's phone
export const initiateSTKPush = async (req, res, next) => {
    const {
        eventId,
        amount,
        phone,
        fullName,
        email,
        ageGroup,
        gender,
        region,
        district,
        churchName,
        emergencyName,
        emergencyPhone,
        emergencyEmail,
    } = req.body;

    // Validate required fields
    const required = { eventId, amount, phone, fullName, email, ageGroup, gender, region, district, churchName };
    const missing  = Object.keys(required).filter(key => !required[key]);

    if (missing.length > 0) {
        return res.status(400).json({
            success: false,
            message: `Missing required fields: ${missing.join(', ')}.`,
        });
    }

    try {
        // Confirm the event exists before creating any records
        const event = await prisma.event.findUnique({ where: { id: eventId } });

        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found.' });
        }

        // Create the registration in PENDING state before payment is confirmed
        const registration = await prisma.eventRegistration.create({
            data: {
                eventId,
                userId:        req.user?.id ?? null, // link to member account if authenticated
                fullName,
                email,
                phone,
                ageGroup,
                gender,
                region,
                district,
                churchName,
                emergencyName:  emergencyName  || null,
                emergencyPhone: emergencyPhone || null,
                emergencyEmail: emergencyEmail || null,
                paymentStatus: 'PENDING',
                status:        'PENDING',
                amountPaid:    0,
            },
        });

        // Prepare STK push payload
        const formattedPhone = formatPhoneNumber(phone);
        const timestamp      = getTimestamp();
        const password       = generatePassword(timestamp);
        const accessToken    = await getMpesaAccessToken();

        const payload = {
            BusinessShortCode: MPESA_SHORTCODE,
            Password:          password,
            Timestamp:         timestamp,
            TransactionType:   'CustomerPayBillOnline',
            Amount:            amount,
            PartyA:            formattedPhone,
            PartyB:            MPESA_SHORTCODE,
            PhoneNumber:       formattedPhone,
            CallBackURL:       MPESA_CALLBACK_URL,
            AccountReference:  'NTCOGK Event',
            TransactionDesc:   `Registration – ${event.title}`,
        };

        const response = await fetch(`${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`, {
            method:  'POST',
            headers: {
                Authorization:  `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (data.ResponseCode !== '0') {
            // STK push failed — delete the dangling pending registration
            await prisma.eventRegistration.delete({ where: { id: registration.id } });

            return res.status(400).json({
                success: false,
                message: data.CustomerMessage || 'Failed to initiate STK Push.',
            });
        }

        // Persist Safaricom's CheckoutRequestID so the callback can resolve this registration
        await prisma.eventRegistration.update({
            where: { id: registration.id },
            data:  { checkoutRequestId: data.CheckoutRequestID },
        });

        return res.status(200).json({
            success:           true,
            message:           `M-Pesa prompt sent to ${formattedPhone}. Enter your PIN to complete payment.`,
            checkoutRequestId: data.CheckoutRequestID,
            registrationId:    registration.id,
        });
    } catch (error) {
        console.error('STK Push Error:', error.message);
        next(error);
    }
};

// POST /api/v1/payments/callback
// Receives Safaricom's async webhook and updates the registration's payment status
export const mpesaCallback = async (req, res, next) => {
    try {
        console.log('M-Pesa Callback received:', JSON.stringify(req.body, null, 2));

        const callbackData = req.body?.Body?.stkCallback;

        if (!callbackData) {
            return res.status(400).json({ success: false, message: 'Invalid callback payload.' });
        }

        const { CheckoutRequestID, ResultCode, ResultDesc } = callbackData;

        // Respond immediately — Safaricom will retry if it does not receive a 200 quickly
        res.status(200).json({ success: true, message: 'Callback received.' });

        if (ResultCode === 0) {
            // Payment succeeded — extract receipt details from the metadata array
            const items       = callbackData.CallbackMetadata?.Item ?? [];
            const amountPaid  = items.find(i => i.Name === 'Amount')?.Value  ?? 0;
            const receiptNo   = items.find(i => i.Name === 'MpesaReceiptNumber')?.Value ?? '';

            console.log(`Payment successful. Receipt: ${receiptNo}, Amount: ${amountPaid}`);

            await prisma.eventRegistration.updateMany({
                where: { checkoutRequestId: CheckoutRequestID },
                data:  {
                    paymentStatus: 'COMPLETED',
                    status:        'CONFIRMED',
                    amountPaid:    parseFloat(amountPaid),
                },
            });
        } else {
            // Payment was cancelled or failed
            console.log(`Payment failed. Code: ${ResultCode}, Reason: ${ResultDesc}`);

            await prisma.eventRegistration.updateMany({
                where: { checkoutRequestId: CheckoutRequestID },
                data:  { paymentStatus: 'FAILED' },
            });
        }
    } catch (error) {
        // Do not call next(error) — a 200 was already sent to Safaricom above
        console.error('M-Pesa Callback Error:', error.message);
    }
};
