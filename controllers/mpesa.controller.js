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
    const required = { eventId, phone, fullName, email, ageGroup, gender, region, district, churchName };
    const missing  = Object.keys(required).filter(key => !required[key]);

    if (missing.length > 0) {
        return res.status(400).json({
            success: false,
            message: `Missing required fields: ${missing.join(', ')}.`,
        });
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            // Confirm the event exists before creating any records
            const event = await tx.event.findUnique({ where: { id: eventId } });

            if (!event) {
                throw new Error('EVENT_NOT_FOUND');
            }

            const amount = event.fee;

            // Block if there is already a CONFIRMED/COMPLETED registration for this event+email
            const existingRegistration = await tx.eventRegistration.findFirst({
                where: {
                    eventId,
                    email,
                    paymentStatus: 'COMPLETED',
                },
            });

            if (existingRegistration) {
                throw new Error('DUPLICATE_REGISTRATION');
            }

            // Check if this is a free registration
            const isFree = parseFloat(amount) === 0;

            // Create the registration in PENDING or CONFIRMED state
            const registration = await tx.eventRegistration.create({
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
                    paymentStatus: isFree ? 'COMPLETED' : 'PENDING',
                    status:        isFree ? 'CONFIRMED' : 'PENDING',
                    amountPaid:    0,
                },
            });

            // Bypasses STK push and returns immediately if event is free
            if (isFree) {
                return { isFree, registrationId: registration.id };
            }

            // Prepare STK push payload
            const formattedPhone = formatPhoneNumber(phone);

            // Validate formatted phone number (Kenyan format: 2547XXXXXXXX or 2541XXXXXXXX)
            const isValidKenyanPhone = /^254[17]\d{8}$/.test(formattedPhone);
            if (!isValidKenyanPhone) {
                throw new Error('INVALID_PHONE_NUMBER');
            }

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

            let response;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout

            try {
                response = await fetch(`${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`, {
                    method:  'POST',
                    headers: {
                        Authorization:  `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                    signal: controller.signal,
                });
            } catch (fetchError) {
                console.error('STK Push Fetch Exception:', fetchError);
                if (fetchError.name === 'AbortError') {
                    throw new Error('STK_PUSH_FAILED:Request to M-Pesa gateway timed out. Please try again.');
                }
                throw new Error('STK_PUSH_FAILED:Network error or M-Pesa gateway is currently unreachable. Please try again later.');
            } finally {
                clearTimeout(timeoutId);
            }

            if (!response.ok) {
                let errorDetails = '';
                try {
                    const errorJson = await response.json();
                    errorDetails = errorJson.errorMessage || errorJson.CustomerMessage || response.statusText;
                } catch {
                    errorDetails = response.statusText || `HTTP status ${response.status}`;
                }
                console.error(`STK Push Non-200 Response (${response.status}):`, errorDetails);
                throw new Error(`STK_PUSH_FAILED:M-Pesa gateway returned an error: ${errorDetails}`);
            }

            let data;
            try {
                data = await response.json();
            } catch (jsonError) {
                console.error('STK Push JSON Parse Error:', jsonError);
                throw new Error('STK_PUSH_FAILED:Received an invalid or malformed response from the M-Pesa gateway.');
            }

            // Defensive property validation
            if (!data || typeof data !== 'object') {
                console.error('STK Push Empty/Invalid Payload:', data);
                throw new Error('STK_PUSH_FAILED:Received an empty response from the M-Pesa gateway.');
            }

            if (data.ResponseCode !== '0') {
                const failureMsg = data.CustomerMessage || data.ResponseDescription || 'Failed to initiate STK Push.';
                console.error('STK Push Refusal Code:', data.ResponseCode, failureMsg);
                throw new Error(`STK_PUSH_FAILED:${failureMsg}`);
            }

            if (!data.CheckoutRequestID) {
                console.error('STK Push Response Missing CheckoutRequestID:', data);
                throw new Error('STK_PUSH_FAILED:Missing checkout transaction reference from the M-Pesa gateway.');
            }

            // Persist Safaricom's CheckoutRequestID so the callback can resolve this registration
            await tx.eventRegistration.update({
                where: { id: registration.id },
                data:  { checkoutRequestId: data.CheckoutRequestID },
            });

            return {
                isFree,
                registrationId:    registration.id,
                checkoutRequestId: data.CheckoutRequestID,
                formattedPhone,
            };
        });

        // Bypasses STK push and returns immediately if event is free
        if (result.isFree) {
            return res.status(200).json({
                success:        true,
                message:        'Registration successful! See you at the event.',
                registrationId: result.registrationId,
            });
        }

        return res.status(200).json({
            success:           true,
            message:           `M-Pesa prompt sent to ${result.formattedPhone}. Enter your PIN to complete payment.`,
            checkoutRequestId: result.checkoutRequestId,
            registrationId:    result.registrationId,
        });

    } catch (error) {
        if (error.message === 'EVENT_NOT_FOUND') {
            return res.status(404).json({ success: false, message: 'Event not found.' });
        }
        if (error.message === 'DUPLICATE_REGISTRATION') {
            return res.status(409).json({
                success: false,
                message: 'You have already registered for this event. Please complete your pending payment or contact church support for assistance.',
            });
        }
        if (error.message === 'INVALID_PHONE_NUMBER' || error.message.includes('Invalid phone number')) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid Kenyan mobile number (e.g., 2547XXXXXXXX).',
            });
        }
        if (error.message.startsWith('STK_PUSH_FAILED:')) {
            const message = error.message.replace('STK_PUSH_FAILED:', '');
            return res.status(400).json({
                success: false,
                message,
            });
        }
        console.error('STK Push Error:', error.message);
        next(error);
    }
};

// Safely updates payment and registration status enforcing atomic state machine transitions
export const updatePaymentStatus = async (registrationId, targetPaymentStatus, targetStatus, additionalData = {}, tx = prisma) => {
    return await tx.$transaction(async (innerTx) => {
        const registration = await innerTx.eventRegistration.findUnique({
            where: { id: registrationId },
        });

        if (!registration) {
            console.warn(`[State Transition] Registration ${registrationId} not found.`);
            return null;
        }

        const currentPaymentStatus = registration.paymentStatus;
        const currentStatus = registration.status;

        // If already in target states, return (idempotency check)
        if (currentPaymentStatus === targetPaymentStatus && currentStatus === targetStatus) {
            return registration;
        }

        // 1. If currently COMPLETED, reject further updates — final state
        if (currentPaymentStatus === 'COMPLETED') {
            console.warn(`[State Transition] Rejected invalid transition from COMPLETED to ${targetPaymentStatus} for registration ${registrationId}.`);
            return registration;
        }

        // 2. FAILED can only be reset back to PENDING (via retry flow), nothing else
        if (currentPaymentStatus === 'FAILED' && targetPaymentStatus !== 'PENDING') {
            console.warn(`[State Transition] Rejected transition from FAILED to ${targetPaymentStatus} for registration ${registrationId}.`);
            return registration;
        }

        // 3. PENDING or FAILED (resetting to PENDING) are valid — proceed
        // Enforce registration status logic
        let finalStatus = targetStatus;
        if (targetPaymentStatus === 'COMPLETED') {
            finalStatus = 'CONFIRMED';
        } else if (targetPaymentStatus === 'FAILED' || targetPaymentStatus === 'PENDING') {
            finalStatus = 'PENDING';
        }

        return await innerTx.eventRegistration.update({
            where: { id: registrationId },
            data: {
                paymentStatus: targetPaymentStatus,
                status:        finalStatus,
                ...additionalData,
            },
        });
    });
};

// POST /api/v1/payments/callback
// Receives Safaricom's async webhook and updates the registration's payment status
export const mpesaCallback = async (req, res, next) => {
    try {
        // Extract client IP address securely, handling reverse proxies
        const clientIp = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || req.ip || '';

        // Official Safaricom Daraja Webhook IP Ranges/Subnets (full /24 subnets)
        const TRUSTED_SAFARICOM_IPS = [
            '196.201.212.',  // Matches 196.201.212.X (sandbox & production ranges)
            '196.201.213.',  // Matches 196.201.213.X (sandbox & production ranges)
            '196.201.214.',  // Matches 196.201.214.X (sandbox & production ranges)
            '196.19.16.'     // Matches 196.19.16.X (sandbox & production ranges)
        ];

        const isTrusted = 
            NODE_ENV !== 'production' || 
            clientIp === '127.0.0.1' || 
            clientIp === '::1' || 
            clientIp === '::ffff:127.0.0.1' ||
            TRUSTED_SAFARICOM_IPS.some(trusted => clientIp.startsWith(trusted));

        if (!isTrusted) {
            console.warn(`[Security] Rejected unauthorized callback attempt from IP: ${clientIp}`);
            return res.status(403).json({ success: false, message: 'Forbidden. Untrusted callback origin.' });
        }

        console.log('M-Pesa Callback received:', JSON.stringify(req.body, null, 2));

        const callbackData = req.body?.Body?.stkCallback;

        if (!callbackData) {
            return res.status(400).json({ success: false, message: 'Invalid callback payload.' });
        }

        const { CheckoutRequestID, ResultCode, ResultDesc } = callbackData;

        // Respond immediately — Safaricom will retry if it does not receive a 200 quickly
        res.status(200).json({ success: true, message: 'Callback received.' });

        // Find the registration by unique checkoutRequestId
        const registration = await prisma.eventRegistration.findUnique({
            where: { checkoutRequestId: CheckoutRequestID },
        });

        if (!registration) {
            console.log(`Registration with checkoutRequestId ${CheckoutRequestID} not found.`);
            return;
        }

        // Idempotency check: prevent duplicate callback processing
        if (registration.paymentStatus === 'COMPLETED') {
            console.log(`Payment already processed. Registration ${registration.id} is COMPLETED. Ignoring duplicate callback.`);
            return;
        }

        if (Number(ResultCode) === 0) {
            // Payment succeeded — extract receipt details from the metadata array
            const items       = callbackData.CallbackMetadata?.Item ?? [];
            const amountPaid  = items.find(i => i.Name === 'Amount')?.Value  ?? 0;
            const receiptNo   = items.find(i => i.Name === 'MpesaReceiptNumber')?.Value ?? '';

            console.log(`Payment successful. Receipt: ${receiptNo}, Amount: ${amountPaid}`);

            await updatePaymentStatus(
                registration.id,
                'COMPLETED',
                'CONFIRMED',
                {
                    amountPaid:     parseFloat(amountPaid),
                    mpesaReceiptNo: receiptNo || null,
                    paidAt:         new Date(),
                }
            );
        } else {
            // Payment was cancelled or failed
            console.log(`Payment failed. Code: ${ResultCode}, Reason: ${ResultDesc}`);

            await updatePaymentStatus(
                registration.id,
                'FAILED',
                'PENDING'
            );
        }
    } catch (error) {
        // Do not call next(error) — a 200 was already sent to Safaricom above
        console.error('M-Pesa Callback Error:', error.message);
    }
};

// POST /api/v1/payments/retry
// Resends an STK push to a user who has a PENDING or FAILED registration.
// Does NOT create a new registration — reuses the existing record.
export const retryPayment = async (req, res, next) => {
    const { eventId, phone } = req.body;
    const userId = req.user.id;

    if (!eventId || !phone) {
        return res.status(400).json({
            success: false,
            message: 'eventId and phone are required.',
        });
    }

    try {
        // 1. Find the user's existing registration for this event
        const registration = await prisma.eventRegistration.findFirst({
            where: {
                eventId,
                userId,
            },
            include: {
                event: { select: { id: true, title: true, fee: true } },
            },
        });

        if (!registration) {
            return res.status(404).json({
                success: false,
                message: 'No registration found for this event. Please register first.',
            });
        }

        // 2. Guard: if already paid, reject the retry
        if (registration.paymentStatus === 'COMPLETED') {
            return res.status(409).json({
                success: false,
                message: 'Your payment for this event is already confirmed. No action needed.',
            });
        }

        // 3. Only PENDING or FAILED registrations may retry
        if (!['PENDING', 'FAILED'].includes(registration.paymentStatus)) {
            return res.status(400).json({
                success: false,
                message: 'This registration is not eligible for a payment retry.',
            });
        }

        const event  = registration.event;
        const amount = event.fee;

        // 4. Validate and format the phone number
        const formattedPhone = formatPhoneNumber(phone);
        const isValidKenyanPhone = /^254[17]\d{8}$/.test(formattedPhone);
        if (!isValidKenyanPhone) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid Kenyan mobile number (e.g., 07XXXXXXXX or 2547XXXXXXXX).',
            });
        }

        // 5. If the registration was FAILED, reset it back to PENDING so the state machine can proceed
        if (registration.paymentStatus === 'FAILED') {
            await updatePaymentStatus(registration.id, 'PENDING', 'PENDING');
        }

        // 6. Obtain a fresh Safaricom access token and build the STK payload
        const timestamp   = getTimestamp();
        const password    = generatePassword(timestamp);
        const accessToken = await getMpesaAccessToken();

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

        // 7. Fire the STK push
        let response;
        const controller = new AbortController();
        const timeoutId  = setTimeout(() => controller.abort(), 10000);

        try {
            response = await fetch(`${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`, {
                method:  'POST',
                headers: {
                    Authorization:  `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body:   JSON.stringify(payload),
                signal: controller.signal,
            });
        } catch (fetchError) {
            console.error('Retry STK Push Fetch Exception:', fetchError);
            if (fetchError.name === 'AbortError') {
                return res.status(400).json({ success: false, message: 'Request to M-Pesa gateway timed out. Please try again.' });
            }
            return res.status(400).json({ success: false, message: 'Network error reaching the M-Pesa gateway. Please try again later.' });
        } finally {
            clearTimeout(timeoutId);
        }

        if (!response.ok) {
            let errorDetails = '';
            try {
                const errorJson = await response.json();
                errorDetails = errorJson.errorMessage || errorJson.CustomerMessage || response.statusText;
            } catch {
                errorDetails = response.statusText || `HTTP status ${response.status}`;
            }
            console.error(`Retry STK Push Non-200 (${response.status}):`, errorDetails);
            return res.status(400).json({ success: false, message: `M-Pesa gateway error: ${errorDetails}` });
        }

        let data;
        try {
            data = await response.json();
        } catch {
            return res.status(400).json({ success: false, message: 'Received an invalid response from M-Pesa. Please try again.' });
        }

        if (data.ResponseCode !== '0') {
            const failureMsg = data.CustomerMessage || data.ResponseDescription || 'Failed to initiate STK Push.';
            console.error('Retry STK Push Refusal Code:', data.ResponseCode, failureMsg);
            return res.status(400).json({ success: false, message: failureMsg });
        }

        if (!data.CheckoutRequestID) {
            return res.status(400).json({ success: false, message: 'Missing checkout reference from M-Pesa. Please try again.' });
        }

        // 8. Update the existing registration with the new CheckoutRequestID
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
        console.error('Retry Payment Error:', error.message);
        next(error);
    }
};
