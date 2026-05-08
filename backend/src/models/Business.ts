import mongoose, { Schema, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { IBusiness } from '@/types/index.js';

const businessSchema = new Schema<IBusiness>(
  {
    id: { type: String, default: () => uuidv4(), unique: true, index: true },
    created_by: { type: String, index: true, required: true },
    name: { type: String, required: true },
    description: { type: String, default: null },
    categories: [String],
    color: { type: String, default: '#000000' },
    order: { type: Number, default: null },
    is_deleted: { type: Boolean, default: false },
    deleted_at: { type: String, default: null },
    deleted_by_process: { type: String, default: null },
    created_at: { type: String, default: () => new Date().toISOString() },
    updated_at: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: false, versionKey: false },
);

businessSchema.pre<IBusiness>('save', function (this: IBusiness) {
  this.updated_at = new Date().toISOString();
});

export const Business: Model<IBusiness> = mongoose.model<IBusiness>(
  'Business',
  businessSchema,
);
