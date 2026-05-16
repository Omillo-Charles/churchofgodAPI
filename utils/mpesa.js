import {
    NODE_ENV,
    MPESA_CONSUMER_KEY,
    MPESA_CONSUMER_SECRET,
    MPESA_PASSKEY,
    MPESA_SHORTCODE
} from '../config/env.js';

let cachedToken = null;
let tokenExpiry = null;

const MPESA_BASE_URL = NODE_ENV === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke';

/**
 * Generates the M-Pesa timestamp in the format YYYYMMDDHHMMSS
 * @returns {string} Timestamp
 */
export const getTimestamp = () => {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    const hour = String(now.getUTCHours()).padStart(2, '0');
    const minute = String(now.getUTCMinutes()).padStart(2, '0');
    const second = String(now.getUTCSeconds()).padStart(2, '0');

    return `${year}${month}${day}${hour}${minute}${second}`;
};

/**
 * Generates the M-Pesa STK Push Password
 * @param {string} timestamp - Timestamp in format YYYYMMDDHHMMSS
 * @returns {string} Base64 encoded password
 */
export const generatePassword = (timestamp) => {
    const passwordString = `${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`;
    return Buffer.from(passwordString).toString('base64');
};

/**
 * Formats a phone number to the 254... format required by Safaricom
 * @param {string} phone - User provided phone number
 * @returns {string} Formatted phone number
 */
export const formatPhoneNumber = (phone) => {
    let formatted = phone.replace(/\D/g, ''); // Remove non-numeric

    if (formatted.startsWith('0')) {
        formatted = '254' + formatted.substring(1);
    } else if (formatted.startsWith('7') || formatted.startsWith('1')) {
        formatted = '254' + formatted;
    }

    const isValid = /^2547\d{8}$|^2541\d{8}$/.test(formatted);
    if (!isValid) {
        throw new Error('Invalid phone number format. Must be a valid Kenyan mobile number.');
    }

    return formatted;
};

/**
 * Retrieves the M-Pesa OAuth access token from Daraja API
 * @returns {Promise<string>} The access token
 */
export const getMpesaAccessToken = async () => {
    if (cachedToken && Date.now() < tokenExpiry) {
        return cachedToken;
    }

    const credentials = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString('base64');
    const url = `${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                Authorization: `Basic ${credentials}`,
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to get M-Pesa access token: ${response.status} ${errorText}`);
        }

        const data = await response.json();

        cachedToken = data.access_token;
        tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;

        return cachedToken;
    } catch (error) {
        console.error('M-Pesa Auth Error:', error.message);
        throw error;
    }
};
