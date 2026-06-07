import mongoose, { Schema, Model, Types } from 'mongoose';

export interface IEstate {
  _id: Types.ObjectId;
  created_by: Types.ObjectId;
  title: string;
  description: string;
  property_type: 'apartment' | 'house' | 'land' | 'commercial' | 'other';
  address: string | null;
  area_sqm: number | null;
  rooms: number | null;
  floor: number | null;
  year_built: number | null;
  purchase_price: number | null;
  current_value: number | null;
  purchase_date: string | null;
  mortgage_amount: number | null;
  monthly_rent: number | null;
  monthly_costs: number | null;
  monthly_mortgage_payment: number | null;
  createdAt: Date;
  updatedAt: Date;
}

const estateSchema = new Schema<IEstate>(
  {
    created_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    title: { type: String, required: true },
    description: { type: String, default: '' },

    property_type: {
      type: String,
      enum: ['apartment', 'house', 'land', 'commercial', 'other'],
      default: 'other',
      set: (v: string) => (v === '' ? 'other' : v),
    },

    address: { type: String, default: null },

    area_sqm: { type: Number, default: null },
    rooms: { type: Number, default: null },
    floor: { type: Number, default: null },
    year_built: { type: Number, default: null },

    purchase_price: { type: Number, default: null },
    current_value: { type: Number, default: null },

    purchase_date: { type: String, default: null },

    mortgage_amount: { type: Number, default: null },
    monthly_rent: { type: Number, default: null },
    monthly_costs: { type: Number, default: null },
    monthly_mortgage_payment: { type: Number, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const Estate: Model<IEstate> = mongoose.model('Estate', estateSchema);
