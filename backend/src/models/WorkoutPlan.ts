import mongoose, { Schema, Model, Types } from 'mongoose';

export interface IWorkoutPlan {
  _id: Types.ObjectId;
  created_by: Types.ObjectId;
  name: string;
  description: string | null;
  type: string;
  active: boolean;
  scheduled_days: number[];
  exercises: {
    name: string;
    sets: number | null;
    reps: number | null;
    weight: number | null;
    distance: number | null;
    duration: number | null;
    rest_seconds: number | null;
    notes: string | null;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const workoutPlanSchema = new Schema<IWorkoutPlan>(
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

    description: {
      type: String,
      default: null,
      maxlength: 1000,
    },

    type: {
      type: String,
      required: true,
    },

    active: {
      type: Boolean,
      default: true,
    },

    scheduled_days: {
      type: [Number],
      default: [],
    },

    exercises: [
      {
        name: {
          type: String,
          required: true,
        },

        sets: {
          type: Number,
          default: null,
        },

        reps: {
          type: Number,
          default: null,
        },

        weight: {
          type: Number,
          default: null,
        },

        distance: {
          type: Number,
          default: null,
        },

        duration: {
          type: Number,
          default: null,
        },

        rest_seconds: {
          type: Number,
          default: null,
        },

        notes: {
          type: String,
          default: null,
        },
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const WorkoutPlan: Model<IWorkoutPlan> = mongoose.model<IWorkoutPlan>(
  'WorkoutPlan',
  workoutPlanSchema,
);
