import mongoose, { Schema, Model, Types } from 'mongoose';

export interface INote {
  _id?: Types.ObjectId;
  created_by: Types.ObjectId;
  category: string;
  content: string;
  business_id: Types.ObjectId | null;
  is_deleted: boolean;
  deleted_at: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const noteSchema = new Schema<INote>(
  {
    created_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    category: {
      type: String,
      required: true,
    },

    content: {
      type: String,
      default: '',
    },

    business_id: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      default: null,
    },

    is_deleted: {
      type: Boolean,
      default: false,
    },

    deleted_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const Note: Model<INote> = mongoose.model<INote>('Note', noteSchema);
