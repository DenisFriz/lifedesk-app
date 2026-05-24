import mongoose, { Schema, Model, Types } from 'mongoose';

export interface IWorkout {
  _id: Types.ObjectId;
  created_by: Types.ObjectId;
  type: string;
  title: string;
  duration_minutes: number | null;
  calories_burned: number | null;
  date: string;
  notes: string | null;
  exercises: {
    name: string;
    sets: number | null;
    reps: number | null;
    weight: number | null;
    distance: number | null;
    duration: number | null;
    notes: string | null;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const workoutSchema = new Schema<IWorkout>(
  {
    created_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    type: {
      type: String,
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    duration_minutes: {
      type: Number,
      default: null,
    },

    calories_burned: {
      type: Number,
      default: null,
    },

    date: {
      type: String,
      required: true,
      index: true,
    },

    notes: {
      type: String,
      default: null,
      maxlength: 5000,
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

export const Workout: Model<IWorkout> = mongoose.model<IWorkout>(
  'Workout',
  workoutSchema,
);
