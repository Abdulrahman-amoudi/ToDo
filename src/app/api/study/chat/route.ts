import { NextRequest, NextResponse } from 'next/server';
import { GeminiClient } from '@/lib/ai/gemini';

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const headerKey = req.headers.get('x-gemini-api-key') || req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    const apiKey = (body.apiKey || headerKey || process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '').trim();

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'API_KEY_REQUIRED',
          message: 'Gemini API key is required for NotebookLM AI features.'
        },
        { status: 400 }
      );
    }

    const action = body.action || 'ask';
    const model = body.model || 'gemini-3.6-flash';
    const language = body.language || body.locale;

    if (action === 'summarize') {
      const summaryResult = await GeminiClient.summarizeDocument({
        apiKey,
        model,
        documentTitle: body.documentTitle || 'Study Document',
        documentContent: body.documentContent || '',
        pageNumber: body.pageNumber,
        pageContent: body.pageContent || '',
        mode: body.mode || 'summary',
        language
      });

      return NextResponse.json({
        success: true,
        data: summaryResult
      });
    }

    // Default action: ask
    const question = (body.question || body.prompt || '').trim();
    if (!question) {
      return NextResponse.json(
        {
          success: false,
          error: 'QUESTION_REQUIRED',
          message: 'Question text cannot be empty.'
        },
        { status: 400 }
      );
    }

    const chatResult = await GeminiClient.askDocument({
      apiKey,
      model,
      question,
      documentTitle: body.documentTitle || 'Study Document',
      documentContent: body.documentContent || '',
      pageNumber: body.pageNumber,
      pageContent: body.pageContent || '',
      chatHistory: Array.isArray(body.chatHistory) ? body.chatHistory : [],
      language
    });

    return NextResponse.json({
      success: true,
      answer: chatResult.answer,
      citations: chatResult.citations,
      grounded: chatResult.grounded
    });
  } catch (err: any) {
    console.error('Error in /api/study/chat:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.name || 'CHAT_ERROR',
        message: err.message || 'Failed to process AI request with Gemini.'
      },
      { status: err.statusCode || 500 }
    );
  }
}
