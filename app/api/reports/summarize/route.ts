import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Review from '@/models/Review';

type Scope = 'zone' | 'department';

interface SummarizeRequest {
  scope: Scope;
}

export async function POST(request: Request) {
  console.log('=== REPORT GENERATION STARTED ===');
  try {
    console.log('1. Checking authentication...');
    const session = await auth();
    if (!session) {
      console.error('❌ No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('✓ Session found:', session.user?.email);
    
    // Admin-only access for generating reports
    if ((session.user as any)?.role !== 'admin') {
      console.error('❌ User is not admin. Role:', (session.user as any)?.role);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.log('✓ User is admin');

    console.log('2. Parsing request body...');
    const { scope } = (await request.json()) as SummarizeRequest;
    console.log('Scope:', scope);
    
    if (scope !== 'zone' && scope !== 'department') {
      console.error('❌ Invalid scope:', scope);
      return NextResponse.json({ error: 'Invalid scope' }, { status: 400 });
    }

    console.log('3. Checking Gemini API key...');
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('❌ GEMINI_API_KEY not found in environment');
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }
    console.log('✓ API key found:', apiKey.substring(0, 20) + '...');

    console.log('4. Connecting to database...');
    await dbConnect();
    console.log('✓ Database connected');
    
    console.log('5. Fetching reviews from database...');
    const reviews = await Review.find({}).sort({ reviewDate: -1 }).lean();
    console.log(`✓ Found ${reviews.length} reviews`);

    if (reviews.length === 0) {
      console.warn('⚠ No reviews found in database');
      return NextResponse.json({ 
        scope, 
        groups: [], 
        highlights: ['No reviews found in the database'] 
      }, { status: 200 });
    }

    console.log('6. Grouping reviews by', scope + '...');
    // Group reviews by zone or department
    const groups: Record<string, any[]> = {};
    for (const r of reviews) {
      const groupKey = scope === 'zone' ? r.zoneName : r.departmentName;
      if (!groups[groupKey]) groups[groupKey] = [];
      // Minimize token usage: include only necessary fields, truncate long text
      const answers = (r.answers || [])
        .slice(0, 3)
        .map(a => (a.answer || '').toString().slice(0, 500));

      groups[groupKey].push({
        day: r.day,
        date: new Date(r.reviewDate).toISOString().slice(0, 10),
        venue: r.venue,
        reviewerName: r.reviewerName,
        status: r.status,
        notes: (r.overallNotes || '').toString().slice(0, 1000),
        answers,
      });
    }
    console.log(`✓ Created ${Object.keys(groups).length} groups`);
    console.log('Group names:', Object.keys(groups));

    console.log('7. Building prompt payload...');

    // Build prompt content
    const inputPayload = {
      scope,
      groups: Object.entries(groups).map(([name, items]) => ({
        name,
        totalReviews: items.length,
        items,
      })),
    };
    console.log('✓ Payload built. Total groups:', inputPayload.groups.length);
    console.log('Payload size:', JSON.stringify(inputPayload).length, 'characters');

    const systemPrompt =
      'You are a reporting assistant. Generate concise, structured summaries suitable for a PMO report. Use clear, actionable language.';

    const userPrompt = `
Summarize the following ${scope}-grouped review data into strict JSON with:
{
  "scope": "${scope}",
  "groups": [
    {
      "name": "string",
      "metrics": { "totalReviews": number, "completed": number, "draft": number },
      "keyThemes": ["string"],
      "issues": ["string"],
      "actionItems": ["string"]
    }
  ],
  "highlights": ["string"]
}

Notes:
- Derive metrics from status fields.
- Key themes: recurring observations.
- Issues: problems or risks.
- Action items: specific, actionable steps.
- Be concise; avoid duplications; no free-form paragraphs.
- Output must be valid JSON only.

DATA:
${JSON.stringify(inputPayload)}
    `.trim();
    console.log('✓ Prompts created');
    console.log('User prompt length:', userPrompt.length, 'characters');

    console.log('8. Calling Gemini API...');
    const apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey.substring(0, 20)}...`;
    console.log('API URL:', apiUrl.replace(apiKey.substring(0, 20) + '...', 'REDACTED'));

    // Call Google Gemini API using native fetch
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${systemPrompt}\n\n${userPrompt}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 2048,
          },
        }),
      }
    );
    console.log('✓ Gemini API response received');
    console.log('Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errText = await response.text();
      console.error('❌ Gemini API Error:', response.status, errText);
      let errorMessage = 'LLM error';
      
      // Parse Gemini error for better user feedback
      try {
        const errorData = JSON.parse(errText);
        if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        }
      } catch {
        errorMessage = errText;
      }
      
      return NextResponse.json({ 
        error: 'Failed to generate report', 
        details: errorMessage,
        statusCode: response.status 
      }, { status: 500 });
    }

    console.log('9. Parsing Gemini response...');
    const data = await response.json();
    console.log('Raw response data:', JSON.stringify(data, null, 2));
    
    // Extract content from Gemini response format
    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    console.log('Extracted content length:', content.length, 'characters');
    console.log('Content preview:', content.substring(0, 200) + '...');
    
    // Remove markdown code blocks if present
    let cleanContent = content.trim();
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    console.log('Clean content length:', cleanContent.length, 'characters');

    console.log('10. Parsing JSON response...');

    let json;
    try {
      json = JSON.parse(cleanContent);
      console.log('✓ JSON parsed successfully');
      console.log('Parsed JSON:', JSON.stringify(json, null, 2));
    } catch (e: any) {
      console.error('❌ JSON parse error:', e.message);
      console.error('Failed content:', cleanContent);
      // Fallback: wrap content if not strictly JSON
      json = { scope, error: 'Invalid JSON from model', raw: cleanContent };
    }

    console.log('11. Sending response...');
    console.log('=== REPORT GENERATION COMPLETED SUCCESSFULLY ===');
    return NextResponse.json(json, { status: 200 });
  } catch (error: any) {
    console.error('=== REPORT GENERATION FAILED ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return NextResponse.json({ 
      error: 'Failed to generate report', 
      details: error.message 
    }, { status: 500 });
  }
}
