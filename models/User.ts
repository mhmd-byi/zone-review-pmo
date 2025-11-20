import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'reviewer' | 'viewer';
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
  },
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
  },
  role: {
    type: String,
    enum: ['admin', 'reviewer', 'viewer'],
    default: 'reviewer',
  },
}, {
  timestamps: true,
});

const User: Model<IUser> = (mongoose.models?.User as Model<IUser>) || mongoose.model<IUser>('User', UserSchema);

export default User;
