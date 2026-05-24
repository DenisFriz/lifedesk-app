import mongoose, { Schema, Model, Types } from 'mongoose';

export interface IMedicalDocument {
  _id: Types.ObjectId;
  created_by: Types.ObjectId;
  title: string;
  description: string | null;
  date: string;
  type:
    | 'prescription'
    | 'lab_result'
    | 'doctor_note'
    | 'insurance'
    | 'vaccination'
    | 'medical_history'
    | 'health_image'
    | 'other';
  file_url: string;
  is_archived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const medicalDocumentSchema = new Schema<IMedicalDocument>(
  {
    created_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    description: {
      type: String,
      default: null,
      maxlength: 5000,
    },

    date: {
      type: String,
      required: true,
      index: true,
    },

    type: {
      type: String,
      required: true,
      enum: [
        'prescription',
        'lab_result',
        'doctor_note',
        'insurance',
        'vaccination',
        'medical_history',
        'health_image',
        'other',
      ],
      default: 'other',
      index: true,
    },

    file_url: {
      type: String,
      required: true,
      trim: true,
    },

    is_archived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const MedicalDocument: Model<IMedicalDocument> =
  mongoose.model<IMedicalDocument>('MedicalDocument', medicalDocumentSchema);
