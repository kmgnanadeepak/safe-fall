/**
 * Twilio SMS service for emergency alerts.
 * Uses: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
 */
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

let client = null;

function getClient() {
  if (!accountSid || !authToken) {
    return null;
  }
  if (!client) {
    client = twilio(accountSid, authToken);
  }
  return client;
}

/**
 * Send a single SMS.
 * @param {string} to - E.164 phone number (e.g. +1234567890)
 * @param {string} body - Message body
 * @returns {Promise<{ success: boolean, sid?: string, error?: string }>}
 */
export async function sendSms(to, body) {
  const c = getClient();
  if (!c) {
    console.warn('[Twilio] Not configured: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_PHONE_NUMBER missing.');
    return { success: false, error: 'Twilio not configured' };
  }
  if (!fromNumber) {
    console.warn('[Twilio] TWILIO_PHONE_NUMBER missing.');
    return { success: false, error: 'Twilio from number not set' };
  }
  const normalizedTo = String(to).trim();
  if (!normalizedTo) {
    return { success: false, error: 'Recipient number required' };
  }
  try {
    const message = await c.messages.create({
      body,
      from: fromNumber,
      to: normalizedTo,
    });
    console.log('[Twilio] SMS sent successfully:', { to: normalizedTo, sid: message.sid });
    return { success: true, sid: message.sid };
  } catch (err) {
    console.error('[Twilio] SMS failed:', { to: normalizedTo, error: err.message });
    return { success: false, error: err.message };
  }
}

/**
 * Send the same SMS to multiple numbers.
 * @param {string[]} phoneNumbers - E.164 numbers
 * @param {string} body - Message body
 * @returns {Promise<{ sent: number, failed: number, results: Array<{ to: string, success: boolean, error?: string }> }>}
 */
export async function sendSmsToMany(phoneNumbers, body) {
  const results = [];
  let sent = 0;
  let failed = 0;
  for (const to of phoneNumbers) {
    const r = await sendSms(to, body);
    results.push({ to, success: r.success, error: r.error });
    if (r.success) sent++;
    else failed++;
  }
  return { sent, failed, results };
}

export function isConfigured() {
  return !!(accountSid && authToken && fromNumber);
}
