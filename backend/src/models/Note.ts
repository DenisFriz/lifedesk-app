import mongoose, { Schema, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { encryptNullable, decryptNullable } from '@utils/encryption.js';
import { INote } from '@/types/index.js';

const NoteSchema = new Schema<INote>(
  {
    id: { type: String, default: () => uuidv4(), unique: true, index: true },
    created_by: { type: String, required: true, index: true },
    title: { type: String },
    content: {
      type: String,
      default: null,
      set: encryptNullable,
      get: decryptNullable,
    },
    category: String,
    is_deleted: { type: Boolean, default: false },
    deleted_at: String,
    deleted_by_process: String,
    created_at: { type: String, default: () => new Date().toISOString() },
    updated_at: { type: String, default: () => new Date().toISOString() },
  },
  {
    timestamps: false,
    versionKey: false,
    toObject: { getters: true },
    toJSON: { getters: true },
  },
);

NoteSchema.pre<INote>('save', function (this: INote) {
  this.updated_at = new Date().toISOString();
});

export const Note: Model<INote> = mongoose.model<INote>('Note', NoteSchema);
