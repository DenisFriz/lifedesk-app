import mongoose, { Schema, Model, Types } from 'mongoose';

export interface IRelationShip {
  _id: Types.ObjectId;
  created_by: Types.ObjectId;
  name: string;
  relationship:
    | 'family'
    | 'close_friend'
    | 'friend'
    | 'colleague'
    | 'acquaintance'
    | 'mentor'
    | 'partner'
    | 'other'
    | null;
  avatar_color:
    | 'rose'
    | 'pink'
    | 'purple'
    | 'indigo'
    | 'blue'
    | 'teal'
    | 'emerald'
    | 'amber'
    | 'orange'
    | null;
  birthday: Date | null;
  phone: string | null;
  email: string | null;
  location: string | null;
  notes: string | null;
  interests: string | null;
  check_in_frequency:
    | 'weekly'
    | 'biweekly'
    | 'monthly'
    | 'quarterly'
    | 'twice_a_year'
    | 'yearly'
    | null;
  last_contact_date: Date | null;
  is_deleted: boolean;
  deleted_at: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const relationShipSchema = new Schema<IRelationShip>(
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
      maxlength: 200,
    },

    relationship: {
      type: String,
      enum: [
        'family',
        'close_friend',
        'friend',
        'colleague',
        'acquaintance',
        'mentor',
        'partner',
        'other',
      ],
      default: 'friend',
    },

    avatar_color: {
      type: String,
      enum: [
        'rose',
        'pink',
        'purple',
        'indigo',
        'blue',
        'teal',
        'emerald',
        'amber',
        'orange',
      ],
      default: 'indigo',
    },

    birthday: {
      type: Date,
      default: null,
    },

    phone: {
      type: String,
      default: null,
      trim: true,
      maxlength: 50,
    },

    email: {
      type: String,
      default: null,
      trim: true,
      lowercase: true,
      maxlength: 320,
    },

    location: {
      type: String,
      default: null,
      trim: true,
      maxlength: 300,
    },

    notes: {
      type: String,
      default: null,
      maxlength: 5000,
    },

    interests: {
      type: String,
      default: null,
      maxlength: 1000,
    },

    check_in_frequency: {
      type: String,
      enum: [
        'weekly',
        'biweekly',
        'monthly',
        'quarterly',
        'twice_a_year',
        'yearly',
      ],
      default: 'monthly',
    },

    last_contact_date: {
      type: Date,
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

export const RelationShip: Model<IRelationShip> = mongoose.model<IRelationShip>(
  'RelationShip',
  relationShipSchema,
);
