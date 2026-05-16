import { WEB_URL } from '../config/env.js';

const fontBase = `${WEB_URL || 'http://localhost:3000'}/fonts/ubuntufont/ubuntu-font-family-0.83`;

/**
 * Shared base layout for all NTCOGK emails.
 * Uses Ubuntu font served from the frontend's public directory.
 * Falls back to system sans-serif fonts in clients that block remote fonts.
 */
const emailBase = (bodyContent) => /* html */`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>NTCOGK Portal</title>
  <style>
    @font-face {
      font-family: 'Ubuntu';
      src: url('${fontBase}/Ubuntu-L.ttf') format('truetype');
      font-weight: 300;
      font-style: normal;
    }
    @font-face {
      font-family: 'Ubuntu';
      src: url('${fontBase}/Ubuntu-R.ttf') format('truetype');
      font-weight: 400;
      font-style: normal;
    }
    @font-face {
      font-family: 'Ubuntu';
      src: url('${fontBase}/Ubuntu-M.ttf') format('truetype');
      font-weight: 500;
      font-style: normal;
    }
    @font-face {
      font-family: 'Ubuntu';
      src: url('${fontBase}/Ubuntu-B.ttf') format('truetype');
      font-weight: 700;
      font-style: normal;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      background-color: #09090b;
      font-family: 'Ubuntu', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      color: #e4e4e7;
      -webkit-font-smoothing: antialiased;
    }

    .wrapper {
      max-width: 560px;
      margin: 0 auto;
      padding: 40px 16px;
    }

    .logo-container {
      margin-bottom: 32px;
      text-align: center;
    }
 
    .logo-img {
      width: 120px;
      height: auto;
      display: inline-block;
    }

    .card {
      background: #18181b;
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 20px;
      overflow: hidden;
    }

    .card-accent {
      height: 4px;
      background: linear-gradient(90deg, #f59e0b, #d97706);
    }

    .card-body {
      padding: 36px 32px;
    }

    .greeting {
      font-family: 'Ubuntu', sans-serif;
      font-weight: 700;
      font-size: 22px;
      color: #ffffff;
      margin-bottom: 8px;
      letter-spacing: -0.02em;
    }

    .subtitle {
      font-family: 'Ubuntu', sans-serif;
      font-size: 13px;
      color: #71717a;
      margin-bottom: 28px;
      line-height: 1.6;
    }

    .divider {
      height: 1px;
      background: rgba(255,255,255,0.06);
      margin: 24px 0;
    }

    .body-text {
      font-family: 'Ubuntu', sans-serif;
      font-size: 14px;
      color: #a1a1aa;
      line-height: 1.7;
      margin-bottom: 16px;
    }

    .cta-block {
      text-align: center;
      margin: 32px 0;
    }

    .cta-button {
      display: inline-block;
      background: #ffffff;
      color: #09090b;
      font-family: 'Ubuntu', sans-serif;
      font-weight: 700;
      font-size: 12px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      text-decoration: none;
      padding: 14px 36px;
      border-radius: 12px;
    }

    .token-box {
      background: rgba(245,158,11,0.07);
      border: 1px solid rgba(245,158,11,0.2);
      border-radius: 12px;
      padding: 12px 20px;
      margin: 20px 0;
      font-family: 'Ubuntu', sans-serif;
      font-size: 12px;
      color: #fbbf24;
      word-break: break-all;
    }

    .warning-text {
      font-family: 'Ubuntu', sans-serif;
      font-size: 12px;
      color: #52525b;
      line-height: 1.6;
    }

    .footer {
      margin-top: 32px;
      text-align: center;
    }

    .footer-text {
      font-family: 'Ubuntu', sans-serif;
      font-size: 11px;
      color: #3f3f46;
      letter-spacing: 0.05em;
    }

    .footer-brand {
      font-family: 'Ubuntu', sans-serif;
      font-weight: 700;
      font-size: 11px;
      color: #52525b;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      margin-top: 6px;
    }
  </style>
</head>
<body>
  <div class="wrapper">

    <!-- Header -->
    <div class="logo-container">
      <img src="https://res.cloudinary.com/dtsa39r1g/image/upload/FIDEL_CHURCH_dyinay.png" alt="NTCOGK Logo" class="logo-img">
    </div>

    <!-- Card -->
    <div class="card">
      <div class="card-accent"></div>
      <div class="card-body">
        ${bodyContent}
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p class="footer-text">This email was sent from the NTCOGK Member Portal. If you did not request this, please ignore it.</p>
      <p class="footer-brand">New Testament Church of God Kenya &copy; ${new Date().getFullYear()}</p>
    </div>

  </div>
</body>
</html>
`;

// Forgot Password Email Template
/**
 * @param {string} firstName - The user's first name
 * @param {string} resetUrl - The full password reset URL
 * @returns {string} HTML email string
 */
export const forgotPasswordTemplate = (firstName, resetUrl) => emailBase(`
  <p class="greeting">Reset your password</p>
  <p class="subtitle">We received a request to reset the password for your NTCOGK portal account.</p>

  <div class="divider"></div>

  <p class="body-text">Hi ${firstName},</p>
  <p class="body-text">Click the button below to set a new password. This link will expire in <strong style="color:#ffffff">1 hour</strong>.</p>

  <div class="cta-block">
    <a href="${resetUrl}" class="cta-button">Reset My Password</a>
  </div>

  <p class="body-text">Or copy and paste this URL into your browser:</p>
  <div class="token-box">${resetUrl}</div>

  <div class="divider"></div>

  <p class="warning-text">
    If you didn't request a password reset, you can safely ignore this email &mdash; your password will remain unchanged.
    This link will expire after 1 hour for your security.
  </p>
`);

// Password Reset Confirmation Email Template
/**
 * @param {string} firstName - The user's first name
 * @returns {string} HTML email string
 */
export const passwordResetSuccessTemplate = (firstName) => emailBase(`
  <p class="greeting">Password updated</p>
  <p class="subtitle">Your NTCOGK portal password has been successfully changed.</p>

  <div class="divider"></div>

  <p class="body-text">Hi ${firstName},</p>
  <p class="body-text">
    Your password was just reset successfully. You can now sign in with your new credentials.
  </p>

  <div class="cta-block">
    <a href="${WEB_URL || 'http://localhost:3000'}/auth" class="cta-button">Sign In to Portal</a>
  </div>

  <div class="divider"></div>

  <p class="warning-text">
    If you did not make this change, please contact our support team immediately or secure your account
    by requesting another password reset.
  </p>
`);

// Feedback Submission Template
/**
 * @param {object} details - The feedback details { name, email, subject, message }
 * @returns {string} HTML email string
 */
export const feedbackTemplate = ({ name, email, subject, message }) => emailBase(`
  <p class="greeting">New Feedback Received</p>
  <p class="subtitle">A member has submitted feedback through the portal.</p>

  <div class="divider"></div>

  <p class="body-text"><strong style="color:#ffffff">From:</strong> ${name} (${email})</p>
  <p class="body-text"><strong style="color:#ffffff">Category:</strong> ${subject}</p>
  
  <div class="token-box" style="background:rgba(255,255,255,0.02); border-color:rgba(255,255,255,0.1); color:#e4e4e7;">
    ${message}
  </div>

  <div class="divider"></div>

  <p class="warning-text">
    This feedback was submitted via the NTCOGK Member Portal. You can reply directly to the member by clicking reply on this email.
  </p>
`);

// Prayer Request Template
/**
 * @param {object} details - The prayer request details { name, email, subject, details, isUrgent }
 * @returns {string} HTML email string
 */
export const prayerRequestTemplate = ({ name, email, subject, details, isUrgent }) => emailBase(`
  <p class="greeting">New Prayer Request</p>
  <p class="subtitle">A member has submitted a request for prayer.</p>

  <div class="divider"></div>

  <p class="body-text"><strong style="color:#ffffff">From:</strong> ${name} (${email})</p>
  <p class="body-text"><strong style="color:#ffffff">Topic:</strong> ${subject}</p>
  
  ${isUrgent ? `
    <div style="display:inline-block; background:rgba(225,29,72,0.1); border:1px solid rgba(225,29,72,0.2); border-radius:8px; padding:4px 12px; margin-bottom:16px;">
      <span style="color:#fb7185; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.1em;">⚠️ Urgent Request</span>
    </div>
  ` : ''}

  <div class="token-box" style="background:rgba(255,255,255,0.02); border-color:rgba(255,255,255,0.1); color:#e4e4e7;">
    ${details}
  </div>

  <div class="divider"></div>

  <p class="warning-text">
    This request was submitted via the NTCOGK Member Portal. Our clergy will be notified to lift this up in prayer.
  </p>
`);

// OTP Verification Template
/**
 * @param {string} firstName - The user's first name
 * @param {string} otp - The 6-digit verification code
 * @returns {string} HTML email string
 */
export const otpTemplate = (firstName, otp) => emailBase(`
  <p class="greeting">Verify your account</p>
  <p class="subtitle">Thank you for joining the NTCOGK digital community. Please use the code below to complete your registration.</p>

  <div class="divider"></div>

  <p class="body-text">Hi ${firstName},</p>
  <p class="body-text">Enter the following 6-digit verification code on the portal to activate your account. This code will expire in <strong style="color:#ffffff">10 minutes</strong>.</p>

  <div style="text-align: center; margin: 32px 0;">
    <div style="display: inline-block; background: #ffffff; color: #09090b; font-family: 'Ubuntu', sans-serif; font-weight: 900; font-size: 32px; letter-spacing: 0.2em; padding: 16px 40px; border-radius: 16px;">
      ${otp}
    </div>
  </div>

  <div class="divider"></div>

  <p class="warning-text">
    If you did not request this code, you can safely ignore this email. Someone may have entered your email address by mistake.
    For your security, never share this code with anyone.
  </p>
`);
