import { HealthConsentEvent } from '@/models/HealthConsentEvent.js';
import {
  HEALTH_CONSENT_VERSION,
  HEALTH_CONSENT_TEXT,
  PRIVACY_POLICY_VERSION,
  CONSUMER_HEALTH_POLICY_VERSION,
  HEALTH_CONSENT_TYPE,
  HEALTH_CONSENT_SCOPE,
} from '@/config/healthConsent.js';
import crypto from 'crypto';
import type { Request } from 'express';
import type { Types } from 'mongoose';

export const MAX_CONSENT_EVENTS_PER_USER = 10;

export async function recordConsentEvent(
  userId: Types.ObjectId,
  eventType: 'granted' | 'withdrawn',
  req: Request,
): Promise<void> {
  const consentTextHash = crypto
    .createHash('sha256')
    .update(HEALTH_CONSENT_TEXT)
    .digest('hex');

  const acceptLanguage = req.headers['accept-language'] || 'en';
  const language = acceptLanguage.split(',')[0].split('-')[0] || 'en';

  await HealthConsentEvent.create({
    user_id: userId,
    consent_type: HEALTH_CONSENT_TYPE,
    consent_scope: HEALTH_CONSENT_SCOPE,
    event_type: eventType,
    occurred_at: new Date(),
    consent_text_version: HEALTH_CONSENT_VERSION,
    consent_text_hash: consentTextHash,
    privacy_policy_version: PRIVACY_POLICY_VERSION,
    consumer_health_policy_version: CONSUMER_HEALTH_POLICY_VERSION,
    language,
    consent_source: 'web',
  });

  await pruneConsentEvents(userId);
}

export async function pruneConsentEvents(userId: Types.ObjectId): Promise<void> {
  const events = await HealthConsentEvent.find({ user_id: userId })
    .sort({ occurred_at: -1 })
    .lean();

  if (events.length > MAX_CONSENT_EVENTS_PER_USER) {
    const eventsToDelete = events
      .slice(MAX_CONSENT_EVENTS_PER_USER)
      .map((e) => e._id);

    await HealthConsentEvent.deleteMany({
      _id: { $in: eventsToDelete },
    });
  }
}

export async function getConsentStatus(
  userId: Types.ObjectId,
): Promise<'granted' | 'withdrawn' | 'not_granted'> {
  const latestEvent = await HealthConsentEvent.findOne({ user_id: userId })
    .sort({ occurred_at: -1 })
    .lean();

  if (!latestEvent) {
    return 'not_granted';
  }

  return latestEvent.event_type;
}
