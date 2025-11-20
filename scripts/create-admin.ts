// This script creates an initial admin user
// Run with: npx tsx scripts/create-admin.ts

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env.local');
  process.exit(1);
}

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['admin', 'reviewer', 'viewer'], default: 'reviewer' },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function createAdmin() {
  try {
    await mongoose.connect(MONGODB_URI!);
    console.log('Connected to MongoDB');

    const adminEmail = 'admin@example.com';
    const adminPassword = 'admin123';
    const adminName = 'Admin User';

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('Admin user already exists!');
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Create admin user
    const admin = await User.create({
      email: adminEmail,
      password: hashedPassword,
      name: adminName,
      role: 'admin',
    });

    console.log('\n✅ Admin user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n⚠️  Please change the password after first login!\n');

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdmin();
