import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Review from '@/models/Review';
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
    const review = await Review.findById(id);
    
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }
    
    return NextResponse.json(review);
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
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();
    const body = await request.json();
    
    const review = await Review.findByIdAndUpdate(id, body, { 
      new: true,
      runValidators: true 
    });
    
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }
    
    return NextResponse.json(review);
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
    const review = await Review.findByIdAndDelete(id);
    
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Review deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
