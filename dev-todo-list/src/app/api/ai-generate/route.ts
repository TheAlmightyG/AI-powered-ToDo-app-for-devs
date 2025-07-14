// app/api/ai-generate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Set this in your .env file
});

// Type for AI response
type GeneratedTask = {
  task: string;
  subtasks: string[];
};

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();

  const systemPrompt = `You are a helpful assistant that returns todo lists in JSON format.

For a given prompt, return an array of objects like:
[
  {
    "task": "Main Task",
    "subtasks": ["Subtask 1", "Subtask 2"]
  }
]

Only return valid JSON — no explanation, no markdown.`;

  try {
    const chat = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      max_tokens: 200,
    });

    const raw = chat.choices[0].message.content || '';
    let parsed: GeneratedTask[] = [];

    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      console.error('Failed to parse AI JSON:', err);
      // Optionally, you could return a 400 error here
    }

    return NextResponse.json({ tasks: parsed });
  } catch (err) {
    console.error('AI generation error:', err);
    return NextResponse.json({ tasks: [] }, { status: 500 });
  }
}
