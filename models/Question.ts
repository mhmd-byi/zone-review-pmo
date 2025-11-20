import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IQuestion extends Document {
  text: string;
  departmentId: Types.ObjectId;
  departmentName: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema: Schema = new Schema({
  text: {
    type: String,
    required: [true, 'Please provide a question text'],
    trim: true,
  },
  departmentId: {
    type: Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Please select a department'],
  },
  departmentName: {
    type: String,
    required: [true, 'Department name is required'],
    trim: true,
  },
  order: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

const Question: Model<IQuestion> = (mongoose.models?.Question as Model<IQuestion>) || mongoose.model<IQuestion>('Question', QuestionSchema);

export default Question;
