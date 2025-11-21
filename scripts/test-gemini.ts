/**
 * Test Gemini API Key
 * Run with: npx tsx scripts/test-gemini.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// Load .env.local
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local file not found');
    process.exit(1);
  }
  
  const envFile = fs.readFileSync(envPath, 'utf-8');
  const lines = envFile.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    }
  }
}

loadEnv();

async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY not found in environment variables');
    console.log('Make sure you have a .env.local file with GEMINI_API_KEY set');
    process.exit(1);
  }

  console.log('✓ API Key found:', apiKey.substring(0, 20) + '...');
  console.log('Testing Gemini API connection...\n');

  try {
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
                  text: 'Say "API test successful"',
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 50,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', response.status, response.statusText);
      console.error('Details:', errorText);
      
      // Parse error for more details
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error) {
          console.error('\nError message:', errorData.error.message);
          console.error('Error status:', errorData.error.status);
          console.error('Error code:', errorData.error.code);
        }
      } catch {
        // Ignore JSON parse errors
      }
      
      process.exit(1);
    }

    const data = await response.json();
    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    console.log('✅ Success! Gemini API is working correctly');
    console.log('Response:', content);
    console.log('\nModel:', data?.modelVersion || 'gemini-2.5-flash');
    if (data?.usageMetadata) {
      console.log('Usage:', data.usageMetadata);
    }
    
  } catch (error: any) {
    console.error('❌ Network or connection error:', error.message);
    process.exit(1);
  }
}

testGemini();
