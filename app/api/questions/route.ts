import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Question from '@/models/Question';
import { auth } from '@/auth';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    // Get departmentId from query params if provided
    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get('departmentId');
    
    const filter: any = { isActive: true };
    if (departmentId) {
      filter.departmentId = departmentId;
    }
    
    const questions = await Question.find(filter).sort({ order: 1, createdAt: 1 });
    return NextResponse.json(questions);
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
    const question = await Question.create(body);
    return NextResponse.json(question, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
