import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Review from '@/models/Review';
import { auth } from '@/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const reviews = await Review.find({}).sort({ reviewDate: -1 });
    return NextResponse.json(reviews);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const body = await request.json();
    
    // Add reviewer info from session
    const reviewData = {
      ...body,
      reviewedBy: (session.user as any).id,
      reviewerName: session.user?.name,
    };
    
    const review = await Review.create(reviewData);
    return NextResponse.json(review, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
