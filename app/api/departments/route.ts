import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Department from '@/models/Department';
import { auth } from '@/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const departments = await Department.find({}).sort({ name: 1 });
    return NextResponse.json(departments);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const body = await request.json();
    const department = await Department.create(body);
    return NextResponse.json(department, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
