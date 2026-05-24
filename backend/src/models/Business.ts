import mongoose, { Schema, Model, Types } from 'mongoose';

interface IBusiness {
  _id: Types.ObjectId;
  created_by: Types.ObjectId;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const businessSchema = new Schema<IBusiness>(
  {
    created_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },

    description: {
      type: String,
      default: null,
      maxlength: 5000,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const Business: Model<IBusiness> = mongoose.model<IBusiness>(
  'Business',
  businessSchema,
);
