import { NODE_ENV, MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_PASSKEY, MPESA_SHORTCODE } from '../config/env.js';

// Module-level token cache to avoid redundant OAuth calls
let cachedToken = null;
let tokenExpiry = null;

// Resolve the correct Daraja API base URL based on environment
const MPESA_BASE_URL = NODE_ENV === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke';

// Generates the timestamp in YYYYMMDDHHMMSS format (UTC) as required by Safaricom
export const getTimestamp = () => {
    const now = new Date();
    const year  = now.getUTCFullYear();
    const month  = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day    = String(now.getUTCDate()).padStart(2, '0');
    const hour   = String(now.getUTCHours()).padStart(2, '0');
    const minute = String(now.getUTCMinutes()).padStart(2, '0');
    const second = String(now.getUTCSeconds()).padStart(2, '0');

    return `${year}${month}${day}${hour}${minute}${second}`;
};

// Generates the Base64-encoded STK Push password from ShortCode + PassKey + Timestamp
export const generatePassword = (timestamp) => {
    const raw = `${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`;
    return Buffer.from(raw).toString('base64');
};

// Normalises any Kenyan phone number into the 2547XXXXXXXX or 2541XXXXXXXX format
// Throws if the result does not match a valid Kenyan mobile number
export const formatPhoneNumber = (phone) => {
    let formatted = phone.replace(/\D/g, ''); // strip non-numeric characters

    if (formatted.startsWith('0')) {
        formatted = '254' + formatted.substring(1);
    } else if (formatted.startsWith('7') || formatted.startsWith('1')) {
        formatted = '254' + formatted;
    }

    const isValid = /^2547\d{8}$|^2541\d{8}$/.test(formatted);

    if (!isValid) {
        throw new Error('Invalid phone number. Must be a valid Kenyan mobile number (Safaricom or Airtel).');
    }

    return formatted;
};

// Fetches a Daraja OAuth token, returning the cached one if it is still valid
export const getMpesaAccessToken = async () => {
    // Return cached token if it has not expired yet (with a 60s safety buffer applied at set time)
    if (cachedToken && Date.now() < tokenExpiry) {
        return cachedToken;
    }

    const credentials = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString('base64');
    const url = `${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: { Authorization: `Basic ${credentials}` },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch M-Pesa access token: ${response.status} ${errorText}`);
        }

        const data = await response.json();

        // Cache the token and set expiry with a 60-second buffer before actual expiry
        cachedToken = data.access_token;
        tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;

        return cachedToken;
    } catch (error) {
        console.error('M-Pesa Auth Error:', error.message);
        throw error;
    }
};
