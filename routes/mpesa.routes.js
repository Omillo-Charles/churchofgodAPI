import { Router } from 'express';
import { initiateSTKPush, mpesaCallback, retryPayment } from '../controllers/mpesa.controller.js';
import { isAuthenticated } from '../middlewares/auth.middleware.js';

const router = Router();

// POST /api/v1/payments/stkpush
// Initiate the M-Pesa STK push. Requires the user to be authenticated.
router.post('/stkpush', isAuthenticated, initiateSTKPush);

// POST /api/v1/payments/retry
// Resend an STK push for an existing PENDING or FAILED registration. Requires authentication.
router.post('/retry', isAuthenticated, retryPayment);

// POST /api/v1/payments/callback
// Safaricom webhook endpoint. Must be publicly accessible.
router.post('/callback', mpesaCallback);

export default router;
