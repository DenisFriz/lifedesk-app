import mongoose, { Schema, Model, Types } from 'mongoose';

export interface IProgressPhoto {
  _id: Types.ObjectId;
  created_by: Types.ObjectId;
  image_url: string;
  public_id: string | null;
  date: Date;
  description: string | null;
  body_area:
    | 'front'
    | 'back'
    | 'side'
    | 'full_body'
    | 'arms'
    | 'chest'
    | 'legs'
    | 'core'
    | 'other';
  is_deleted: boolean;
  is_archived: boolean;
  deleted_at: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const progressPhotoSchema = new Schema<IProgressPhoto>(
  {
    created_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    image_url: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    public_id: {
      type: String,
      default: null,
      trim: true,
      maxlength: 500,
    },

    date: {
      type: Date,
      required: true,
    },

    description: {
      type: String,
      default: null,
      maxlength: 500,
      trim: true,
    },

    body_area: {
      type: String,
      enum: [
        'front',
        'back',
        'side',
        'full_body',
        'arms',
        'chest',
        'legs',
        'core',
        'other',
      ],
      default: 'full_body',
      required: true,
    },

    is_deleted: {
      type: Boolean,
      default: false,
    },

    is_archived: {
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

progressPhotoSchema.index({
  created_by: 1,
  date: -1,
});

export const ProgressPhoto: Model<IProgressPhoto> =
  mongoose.model<IProgressPhoto>('ProgressPhoto', progressPhotoSchema);
