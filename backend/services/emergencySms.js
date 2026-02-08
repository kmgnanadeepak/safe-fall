/**
 * Emergency SMS orchestration for fall events.
 * - Resolves patient location (event coords or latest fall event coords).
 * - Collects recipient numbers (patient emergency contacts + hospital numbers from env).
 * - Builds message with OpenStreetMap live location link and sends via Twilio.
 */
import FallEvent from '../models/FallEvent.js';
import User from '../models/User.js';
import EmergencyContact from '../models/EmergencyContact.js';
import { generateLocationLink } from '../lib/locationLink.js';
import { sendSmsToMany } from './twilioService.js';

const HOSPITAL_NUMBERS_ENV = 'TWILIO_EMERGENCY_HOSPITAL_NUMBERS';

/**
 * Get latitude and longitude for a fall event. Prefer the event's own coords;
 * if missing, use the patient's latest fall event that has coords.
 * @param {object} event - FallEvent document or plain object with user_id, latitude, longitude
 * @returns {Promise<{ latitude: number | null, longitude: number | null }>}
 */
export async function getPatientLocationForEvent(event) {
  const userId = event.user_id?.toString?.() || event.user_id;
  let lat = event.latitude;
  let lng = event.longitude;
  if (lat != null && lng != null && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng))) {
    return { latitude: Number(lat), longitude: Number(lng) };
  }
  const latest = await FallEvent.findOne({ user_id: userId })
    .where('latitude').ne(null)
    .where('longitude').ne(null)
    .sort({ timestamp: -1 })
    .select('latitude longitude')
    .lean();
  if (latest) {
    return { latitude: latest.latitude, longitude: latest.longitude };
  }
  return { latitude: null, longitude: null };
}

/**
 * Get all phone numbers that should receive the emergency SMS:
 * - Patient's emergency contacts
 * - Optional hospital numbers from env (comma-separated)
 * @param {string} patientUserId - Patient's user ID
 * @returns {Promise<string[]>} E.164 or normalized phone numbers (no duplicates)
 */
export async function getEmergencyRecipientPhones(patientUserId) {
  const contacts = await EmergencyContact.find({ user_id: patientUserId }).select('phone').lean();
  const phones = [...new Set((contacts || []).map((c) => String(c.phone).trim()).filter(Boolean))];
  const hospitalEnv = process.env[HOSPITAL_NUMBERS_ENV];
  if (hospitalEnv && typeof hospitalEnv === 'string') {
    const extra = hospitalEnv.split(',').map((s) => s.trim()).filter(Boolean);
    extra.forEach((p) => phones.push(p));
  }
  return [...new Set(phones)];
}

/**
 * Build the emergency SMS body with live location link.
 * @param {string} patientName
 * @param {number | null} latitude
 * @param {number | null} longitude
 * @returns {string}
 */
export function buildEmergencyMessage(patientName, latitude, longitude) {
  const name = patientName || 'Patient';
  const link = generateLocationLink(latitude, longitude);
  const locationLine = link
    ? ` Live Location: ${link}`
    : ' (Location not available)';
  return `Emergency Alert: Fall detected for Patient ${name}. Immediate attention required.${locationLine}`;
}

/**
 * Send emergency SMS for a fall event (async, fire-and-forget).
 * Call this after creating a fall record. Logs success/failure.
 * @param {object} event - FallEvent document or plain object with _id, user_id, latitude, longitude
 */
export async function sendEmergencySmsForFallEvent(event) {
  const eventId = event._id?.toString?.() || event.id;
  try {
    const userId = event.user_id?.toString?.() || event.user_id;
    const user = await User.findById(userId).select('name').lean();
    const patientName = user?.name || 'Patient';

    const { latitude, longitude } = await getPatientLocationForEvent(event);
    const message = buildEmergencyMessage(patientName, latitude, longitude);
    const phones = await getEmergencyRecipientPhones(userId);

    if (phones.length === 0) {
      console.log('[EmergencySms] No recipient phones for fall event:', eventId);
      return;
    }

    const { sent, failed, results } = await sendSmsToMany(phones, message);
    console.log('[EmergencySms] Fall event:', eventId, '| Sent:', sent, '| Failed:', failed, '| Results:', results);
  } catch (err) {
    console.error('[EmergencySms] Error sending SMS for fall event:', eventId, err.message);
  }
}
