/**
 * Test OpenAI API Key
 * Run with: npx tsx scripts/test-openai.ts
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

async function testOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error('❌ OPENAI_API_KEY not found in environment variables');
    console.log('Make sure you have a .env.local file with OPENAI_API_KEY set');
    process.exit(1);
  }

  console.log('✓ API Key found:', apiKey.substring(0, 20) + '...');
  console.log('Testing OpenAI API connection...\n');

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Say "API test successful"' },
        ],
        max_tokens: 20,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', response.status, response.statusText);
      console.error('Details:', errorText);
      
      // Parse error for more details
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error) {
          console.error('\nError message:', errorData.error.message);
          console.error('Error type:', errorData.error.type);
          console.error('Error code:', errorData.error.code);
        }
      } catch {
        // Ignore JSON parse errors
      }
      
      process.exit(1);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    console.log('✅ Success! API is working correctly');
    console.log('Response:', content);
    console.log('\nModel:', data.model);
    console.log('Usage:', data.usage);
    
  } catch (error: any) {
    console.error('❌ Network or connection error:', error.message);
    process.exit(1);
  }
}

testOpenAI();
