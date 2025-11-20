import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Department from '@/models/Department';
import { auth } from '@/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();
    const department = await Department.findById(id);
    
    if (!department) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }
    
    return NextResponse.json(department);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();
    const body = await request.json();
    
    const department = await Department.findByIdAndUpdate(id, body, { 
      new: true,
      runValidators: true 
    });
    
    if (!department) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }
    
    return NextResponse.json(department);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();
    const department = await Department.findByIdAndDelete(id);
    
    if (!department) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Department deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
