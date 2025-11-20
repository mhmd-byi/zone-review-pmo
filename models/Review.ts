import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IReviewAnswer {
  questionId: Types.ObjectId;
  questionText: string;
  answer: string;
  rating?: number;
}

export interface IReview extends Document {
  zoneId: Types.ObjectId;
  zoneName: string;
  departmentId: Types.ObjectId;
  departmentName: string;
  reviewDate: Date;
  day: string;
  venue: string;
  aamil?: string;
  zonalHead?: string;
  zoneCapacity?: number;
  mumineenCount?: number;
  thaalCount?: number;
  reviewedBy: Types.ObjectId;
  reviewerName: string;
  answers: IReviewAnswer[];
  overallNotes?: string;
  status: 'draft' | 'completed' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

const ReviewAnswerSchema: Schema = new Schema({
  questionId: {
    type: Schema.Types.ObjectId,
    ref: 'Question',
    required: true,
  },
  questionText: {
    type: String,
    required: true,
  },
  answer: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
});

const ReviewSchema: Schema = new Schema({
  zoneId: {
    type: Schema.Types.ObjectId,
    ref: 'Zone',
    required: true,
  },
  zoneName: {
    type: String,
    required: true,
  },
  departmentId: {
    type: Schema.Types.ObjectId,
    ref: 'Department',
    required: true,
  },
  departmentName: {
    type: String,
    required: true,
  },
  reviewDate: {
    type: Date,
    required: true,
  },
  day: {
    type: String,
    required: true,
  },
  venue: {
    type: String,
    required: true,
  },
  aamil: {
    type: String,
  },
  zonalHead: {
    type: String,
  },
  zoneCapacity: {
    type: Number,
  },
  mumineenCount: {
    type: Number,
  },
  thaalCount: {
    type: Number,
  },
  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reviewerName: {
    type: String,
    required: true,
  },
  answers: [ReviewAnswerSchema],
  overallNotes: {
    type: String,
  },
  status: {
    type: String,
    enum: ['draft', 'completed', 'archived'],
    default: 'draft',
  },
}, {
  timestamps: true,
});

const Review: Model<IReview> = (mongoose.models?.Review as Model<IReview>) || mongoose.model<IReview>('Review', ReviewSchema);

export default Review;
