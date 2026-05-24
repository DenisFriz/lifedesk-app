import mongoose, { Schema, Model, Types } from 'mongoose';

export interface VehicleImage {
  url: string;
  thumbnailUrl?: string | null;
  uploadedAt: string;
}

export interface VehicleRepair {
  date?: Date | null;
  cost?: number | null;
  description: string;
  images: string[];
}

export interface IVehicle {
  _id: Types.ObjectId;
  created_by: Types.ObjectId;

  title: string;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  color?: string | null;

  fuel_type?: 'petrol' | 'diesel' | 'electric' | 'hybrid' | 'other' | null;
  transmission?: 'automatic' | 'manual' | null;

  mileage?: number | null;
  license_plate?: string | null;
  vin?: string | null;

  purchase_price?: number | null;
  current_value?: number | null;
  purchase_date?: string | null;

  insurance_expiry?: string | null;
  inspection_expiry?: string | null;

  notes: string;

  images: VehicleImage[];
  repairs: VehicleRepair[];

  createdAt: string;
  updatedAt: string;
}

const repairSchema = new Schema(
  {
    date: { type: Date, default: null },
    cost: { type: Number, default: null },
    description: { type: String, default: '' },

    images: [{ type: String }],
  },
  { _id: true },
);

const vehicleImageSchema = new Schema(
  {
    url: { type: String, required: true },
    thumbnailUrl: { type: String, default: null },

    uploadedAt: { type: String, default: () => new Date().toISOString() },
  },
  { _id: false },
);

const vehicleSchema = new Schema<IVehicle>(
  {
    created_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    make: { type: String, default: null },
    model: { type: String, default: null },
    year: { type: Number, default: null },
    color: { type: String, default: null },
    fuel_type: {
      type: String,
      enum: ['petrol', 'diesel', 'electric', 'hybrid', 'other'],
      default: null,
    },
    transmission: {
      type: String,
      enum: ['automatic', 'manual'],
      default: null,
    },
    mileage: { type: Number, default: null },
    license_plate: { type: String, default: null },
    vin: { type: String, default: null },
    // FINANCE
    purchase_price: { type: Number, default: null },
    current_value: { type: Number, default: null },
    purchase_date: { type: String, default: null },

    // EXPIRY / REMINDERS
    insurance_expiry: { type: String, default: null },
    inspection_expiry: { type: String, default: null },

    notes: { type: String, default: '' },

    // IMAGES (IMPORTANT PART)
    images: [vehicleImageSchema],

    // REPAIRS
    repairs: [repairSchema],
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const Vehicle: Model<IVehicle> = mongoose.model(
  'Vehicle',
  vehicleSchema,
);
