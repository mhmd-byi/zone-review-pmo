import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Zone from '@/models/Zone';
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
    const zone = await Zone.findById(id);
    
    if (!zone) {
      return NextResponse.json({ error: 'Zone not found' }, { status: 404 });
    }
    
    return NextResponse.json(zone);
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
    
    const zone = await Zone.findByIdAndUpdate(id, body, { 
      new: true,
      runValidators: true 
    });
    
    if (!zone) {
      return NextResponse.json({ error: 'Zone not found' }, { status: 404 });
    }
    
    return NextResponse.json(zone);
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
    const zone = await Zone.findByIdAndDelete(id);
    
    if (!zone) {
      return NextResponse.json({ error: 'Zone not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Zone deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
