import mongoose, { Schema, Model, Types } from 'mongoose';

interface IBodyMeasurement {
  _id: Types.ObjectId;
  created_by: Types.ObjectId;
  date: string;
  notes: string | null;
  weight: number | null;
  body_fat: number | null;
  chest: number | null;
  waist: number | null;
  hips: number | null;
  neck: number | null;
  shoulders: number | null;
  left_arm: number | null;
  right_arm: number | null;
  left_thigh: number | null;
  right_thigh: number | null;
  resting_heart_rate: number | null;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  createdAt: Date;
  updatedAt: Date;
}

const bodyMeasurementSchema = new Schema<IBodyMeasurement>(
  {
    created_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    date: {
      type: String,
      required: true,
      index: true,
    },

    notes: {
      type: String,
      default: null,
      maxlength: 5000,
    },

    weight: { type: Number, default: null },
    body_fat: { type: Number, default: null },

    chest: { type: Number, default: null },
    waist: { type: Number, default: null },
    hips: { type: Number, default: null },

    neck: { type: Number, default: null },
    shoulders: { type: Number, default: null },

    left_arm: { type: Number, default: null },
    right_arm: { type: Number, default: null },

    left_thigh: { type: Number, default: null },
    right_thigh: { type: Number, default: null },

    resting_heart_rate: { type: Number, default: null },

    blood_pressure_systolic: { type: Number, default: null },
    blood_pressure_diastolic: { type: Number, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const BodyMeasurement: Model<IBodyMeasurement> =
  mongoose.model<IBodyMeasurement>('Measurement', bodyMeasurementSchema);
