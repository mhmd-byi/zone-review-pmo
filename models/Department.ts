import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDepartment extends Document {
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DepartmentSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Please provide a department name'],
    unique: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

const Department: Model<IDepartment> = (mongoose.models?.Department as Model<IDepartment>) || mongoose.model<IDepartment>('Department', DepartmentSchema);

export default Department;
