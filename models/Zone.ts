import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IZone extends Document {
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ZoneSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Please provide a zone name'],
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

const Zone: Model<IZone> = (mongoose.models?.Zone as Model<IZone>) || mongoose.model<IZone>('Zone', ZoneSchema);

export default Zone;
