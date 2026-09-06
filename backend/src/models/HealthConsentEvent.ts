import mongoose, { Schema, Model, Types } from 'mongoose';

export interface IHealthConsentEvent {
  _id: Types.ObjectId;
  user_id: Types.ObjectId;
  consent_type: 'health_data';
  consent_scope: 'health_features_and_user_initiated_ai';
  event_type: 'granted' | 'withdrawn';
  occurred_at: Date;
  consent_text_version: string;
  consent_text_hash: string;
  privacy_policy_version: string;
  consumer_health_policy_version: string;
  language: string;
  consent_source: 'web' | 'ios' | 'android';
  created_at: Date;
}

const healthConsentEventSchema = new Schema<IHealthConsentEvent>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    consent_type: {
      type: String,
      enum: ['health_data'],
      required: true,
    },
    consent_scope: {
      type: String,
      enum: ['health_features_and_user_initiated_ai'],
      required: true,
    },
    event_type: {
      type: String,
      enum: ['granted', 'withdrawn'],
      required: true,
    },
    occurred_at: {
      type: Date,
      required: true,
      default: () => new Date(),
    },
    consent_text_version: {
      type: String,
      required: true,
    },
    consent_text_hash: {
      type: String,
      required: true,
    },
    privacy_policy_version: {
      type: String,
      required: true,
    },
    consumer_health_policy_version: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      required: true,
    },
    consent_source: {
      type: String,
      enum: ['web', 'ios', 'android'],
      required: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
    versionKey: false,
  },
);

export const HealthConsentEvent: Model<IHealthConsentEvent> =
  mongoose.model<IHealthConsentEvent>(
    'HealthConsentEvent',
    healthConsentEventSchema,
  );
