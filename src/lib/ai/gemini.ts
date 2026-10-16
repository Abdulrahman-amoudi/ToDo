/**
 * Live Google Gemini API Client
 * 
 * Direct REST integration with Google Gemini Generative Language API.
 * Supports structured JSON quiz generation, Socratic hints, conceptual answer grading,
 * and connection verification.
 */

import type {
  QuizQuestion,
  QuizResponse,
  QuizGenerateRequest,
  HintRequest,
  HintResponse,
  EvaluateRequest,
  EvaluationResponse,
  ConnectionTestResult,
  QuizDifficulty,
  QuestionType
} from '@/types/quiz';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

interface GeminiContentPart {
  text: string;
}

interface GeminiContent {
  role?: string;
  parts: GeminiContentPart[];
}

interface GeminiRequestBody {
  contents: GeminiContent[];
  generationConfig?: {
    temperature?: number;
    topP?: number;
    responseMimeType?: string;
  };
  systemInstruction?: {
    parts: GeminiContentPart[];
  };
}

interface GeminiCandidate {
  content?: {
    parts?: GeminiContentPart[];
  };
}

interface GeminiResponseBody {
  candidates?: GeminiCandidate[];
  error?: {
    message?: string;
    code?: number;
    status?: string;
  };
}

interface CustomHttpError extends Error {
  statusCode?: number;
  retryAfterMs?: number;
}

/**
 * Extracts and repairs JSON object or array from LLM markdown / text responses.
 */
export function extractJsonFromText<T = unknown>(text: string): T {
  if (!text || typeof text !== 'string') {
    throw new Error('MALFORMED_OUTPUT: Response is empty or not a string.');
  }

  const clean = text.trim();

  // Try direct parse first
  try {
    return JSON.parse(clean) as T;
  } catch {
    // Attempt markdown code block extraction
    const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
    const match = clean.match(jsonBlockRegex);
    if (match && match[1]) {
      try {
        return JSON.parse(match[1].trim()) as T;
      } catch {
        // continue to substring extraction
      }
    }

    // Attempt to extract from first '{' or '[' to last '}' or ']'
    const firstBrace = clean.indexOf('{');
    const firstBracket = clean.indexOf('[');
    let startIdx = -1;
    let endIdx = -1;

    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      startIdx = firstBrace;
      endIdx = clean.lastIndexOf('}');
    } else if (firstBracket !== -1) {
      startIdx = firstBracket;
      endIdx = clean.lastIndexOf(']');
    }

    if (startIdx !== -1 && endIdx > startIdx) {
      const candidate = clean.slice(startIdx, endIdx + 1);
      try {
        return JSON.parse(candidate) as T;
      } catch (err: unknown) {
        const parseErr = err as Error;
        throw new Error(`MALFORMED_OUTPUT: Unable to parse structured JSON from LLM response: ${parseErr.message}`);
      }
    }

    throw new Error('MALFORMED_OUTPUT: No valid JSON structure found in LLM response.');
  }
}

export class GeminiClient {
  /**
   * Calls Google Gemini REST generateContent endpoint.
   */
  private static async callGenerateContent(
    apiKey: string,
    model: string,
    prompt: string,
    systemInstruction?: string,
    jsonMode: boolean = false
  ): Promise<string> {
    const primaryModel = model || 'gemini-3.6-flash';
    
    // Ordered candidate cascade: prioritize requested model, followed by verified operational models
    const candidateModels = [
      primaryModel,
      'gemini-3.6-flash',
      'gemini-flash-lite-latest',
      'gemini-3.5-flash-lite',
      'gemini-3-flash-preview',
      'gemini-3.8-flash',
      'gemini-3.5-flash'
    ].filter((m, idx, arr) => arr.indexOf(m) === idx);

    const bodyPayload: GeminiRequestBody = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.3,
        topP: 0.95,
        responseMimeType: jsonMode ? 'application/json' : 'text/plain'
      }
    };

    if (systemInstruction) {
      bodyPayload.systemInstruction = {
        parts: [{ text: systemInstruction }]
      };
    }

    let lastError: CustomHttpError | null = null;

    for (const currentModel of candidateModels) {
      const url = `${GEMINI_API_BASE}/${currentModel}:generateContent?key=${encodeURIComponent(apiKey)}`;
      
      let res: Response;
      try {
        res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(bodyPayload)
        });
      } catch (networkErr: unknown) {
        const netErr = networkErr as Error;
        const err: CustomHttpError = new Error(`NETWORK_ERROR: Failed to connect to Gemini API (${currentModel}): ${netErr.message}`);
        err.statusCode = 503;
        lastError = err;
        continue;
      }

      if (res.ok) {
        const data = (await res.json()) as GeminiResponseBody;
        const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidateText) {
          return candidateText;
        }
        const err: CustomHttpError = new Error(`MALFORMED_OUTPUT: Received empty response from ${currentModel}.`);
        err.statusCode = 502;
        lastError = err;
        continue;
      }

      const errorData = (await res.json().catch(() => ({}))) as GeminiResponseBody;
      const errorMsg = errorData?.error?.message || res.statusText || 'Gemini API Error';

      // If invalid API key (401 / bad key), abort immediately because no model will work with an invalid key
      if (res.status === 401 || (res.status === 400 && errorMsg.toLowerCase().includes('api key'))) {
        const err: CustomHttpError = new Error(`INVALID_API_KEY: Provided API key is invalid or unauthorized (${errorMsg}).`);
        err.statusCode = 401;
        throw err;
      }

      // If rate limit (429), high demand (503), model retired/not found (404), or server error (500), try next model in cascade
      const err: CustomHttpError = new Error(`GEMINI_API_ERROR: HTTP ${res.status} (${currentModel}) - ${errorMsg}`);
      err.statusCode = res.status;
      lastError = err;
      console.warn(`[GeminiClient] Model ${currentModel} returned HTTP ${res.status}. Cascading to next fallback...`);
    }

    throw lastError || new Error('All operational Gemini models failed to respond.');
  }

  /**
   * Generates a structured quiz using Gemini.
   */
  static async generateQuiz(request: QuizGenerateRequest): Promise<QuizResponse> {
    const { 
      apiKey, 
      model = 'gemini-3.6-flash', 
      noteTitle, 
      noteContent, 
      config, 
      language,
      customPrompt,
      pageNumber,
      prevPageNumber,
      prevPageContent,
      nextPageNumber,
      nextPageContent
    } = request;
    const effectiveCustomPrompt = (customPrompt || config?.customPrompt || '').trim();
    const reqLang = language || config?.language;
    const isArabic = reqLang === 'ar' || /[\u0600-\u06FF]/.test(noteContent.slice(0, 600));

    if (!apiKey || apiKey.trim() === '') {
      const err: CustomHttpError = new Error('API_KEY_REQUIRED: An external LLM API key must be provided.');
      err.statusCode = 400;
      throw err;
    }

    if (!noteContent || noteContent.trim() === '') {
      const err: CustomHttpError = new Error('NOTE_CONTENT_REQUIRED: Note content cannot be empty.');
      err.statusCode = 400;
      throw err;
    }

    const isExhaustive = config?.exhaustive === true;
    const isFullDoc = config?.scope === 'full_document' || isExhaustive;
    const questionCount = isExhaustive 
      ? Math.max(15, config?.questionCount || 20)
      : Math.max(1, config?.questionCount || 8);
    const difficulty: QuizDifficulty = config?.difficulty || 'medium';
    const types: QuestionType[] = config?.types && config.types.length > 0 ? config.types : ['multiple_choice'];

    const systemPrompt = `You are an expert tutor and study assistant modeled after NotebookLM.
Your task is to generate high-yield, conceptually rigorous quiz questions based ONLY on the provided source note.

${effectiveCustomPrompt ? `CRITICAL USER CUSTOM EXAM FOCUS / PROMPT:
"${effectiveCustomPrompt}"
You MUST strictly prioritize and tailor the questions to test the exact topics, rules, formulas, distinctions, or difficulty specified above while remaining 100% faithful to the text.` : ''}

${isExhaustive ? `CRITICAL EXHAUSTIVE FULL-DOCUMENT COVERAGE MODE:
1. Your goal is to generate ALL possible conceptually distinct questions that thoroughly test EVERY fact, section, theorem, formula, law, milestone, and mechanism in the provided document.
2. Do NOT leave any page, chapter, or section untested. Walk through the document systematically from beginning to end.
3. Every question must test a different critical concept or nuance from the text.
4. Generate exactly ${questionCount} diverse, comprehensive questions covering all facets of the text.` : ''}

CRITICAL MULTI-PAGE CONTINUITY & SURROUNDING CONTEXT:
1. When context from the page above or page below is provided, inspect it to understand the full continuum of rules, theorems, classifications, or distinctions (e.g. antecedent rules, exceptions, past-tense verb distinction rules, worked examples).
2. Never ask ambiguous questions caused by an isolated page cut. Ground options, stems, and explanations in the complete multi-page context.

Rules:
1. Rely strictly on facts directly mentioned in the note. Do not assume or extrapolate external knowledge.
2. For multiple_choice questions, provide exactly 4 clear, mutually exclusive options. Ensure only ONE option is unmistakably correct. correctAnswerIndex must be a number 0, 1, 2, or 3.
3. For true_false questions, options must be ${isArabic ? '["صحيح", "خطأ"]' : '["True", "False"]'}, correctAnswerIndex must be 0 for True or 1 for False.
4. For short_answer questions, include correctAnswerText explaining the ideal student response.
5. Include a precise explanation citing the specific section or quote from the note in sourceCitation.
6. When questions involve visual setups, geometry, electrical circuits, physics forces, or timelines, provide an "imageCaption" summarizing the mental diagram or formula card (e.g. "Diagram: Series circuit with 2 resistors" or "Timeline: Treaty negotiations in 1919").
7. Output MUST be valid JSON adhering exactly to the requested schema.
8. Language & Arabic Style:
${isArabic ? `   - Write ALL questions, options, explanations, and titles in natural, modern, high-clarity Arabic (فصحى معاصرة وسلسة بدون ركاكة أو ترجمة حرفية جافة).
   - In Arabic questions containing Latin variables, scientific units, or math equations (e.g. W, J, V, Hz, N, kg, m/s, P_max, P_avg, 2 × 75 = 150):
     * Always enclose mathematical formulas, equations, and standalone units inside inline backticks (e.g. \`P_avg = 0.5 * P_max\` or \`75 W\` or \`W\`). This guarantees perfect bidirectional rendering without inverted numbers or misplaced punctuation.
   - For multiple choice options with numbers and units, write them clearly with spacing, e.g. "75 W", "150 W", "200 W", "250 W".` : `   - Always match the primary language of the source document (e.g. if the note is in Arabic, write questions, options, and explanations in Arabic).`}`;

    let compiledContent = noteContent;
    if (prevPageContent || nextPageContent) {
      compiledContent = `${prevPageContent ? `--- [PAGE ABOVE: Page ${prevPageNumber || (pageNumber ? pageNumber - 1 : '')}] (Preceding Context & Rules) ---\n${prevPageContent.trim()}\n\n` : ''}` +
        `--- [TARGET STUDY PAGE: Page ${pageNumber || ''}] (Primary Focus) ---\n${noteContent.trim()}\n\n` +
        `${nextPageContent ? `--- [PAGE BELOW: Page ${nextPageNumber || (pageNumber ? pageNumber + 1 : '')}] (Following Context & Distinctions) ---\n${nextPageContent.trim()}` : ''}`;
    }

    const userPrompt = `${isExhaustive 
      ? `EXHAUSTIVE FULL-DOCUMENT AUDIT & EXAM (${questionCount} QUESTIONS):\nExtract all possible exam questions covering every section, concept, formula, and definition across the full document without skipping any topic.` 
      : `Generate a ${difficulty} difficulty quiz with ${questionCount} questions based on the following note.`}
${effectiveCustomPrompt ? `\nSPECIAL USER EXAM INSTRUCTION / PROMPT:\n"${effectiveCustomPrompt}"\n(Tailor questions and choices specifically to this prompt while verifying against the source text!)\n` : ''}
Target question types: ${types.join(', ')}.
Target question count: exactly ${questionCount}.

Note Title: ${noteTitle || 'Untitled Document'}

Document Content:
${compiledContent}

Required JSON Output Schema:
{
  "quizTitle": "string",
  "summary": "string",
  "questions": [
    {
      "id": "q1",
      "type": "multiple_choice | true_false | short_answer",
      "question": "string",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswerIndex": 0,
      "correctAnswerText": "string (for short_answer only)",
      "explanation": "string",
      "sourceCitation": "string (verbatim quote or concept reference)",
      "imageCaption": "string (optional visual diagram description)",
      "difficulty": "${difficulty}"
    }
  ]
}`;

    const rawOutput = await this.callGenerateContent(apiKey, model, userPrompt, systemPrompt, true);
    const parsed = extractJsonFromText<QuizResponse>(rawOutput);

    if (!parsed || !Array.isArray(parsed.questions)) {
      const err: CustomHttpError = new Error('MALFORMED_OUTPUT: LLM response did not return a valid questions array.');
      err.statusCode = 502;
      throw err;
    }

    // Normalize questions to guarantee schema integrity
    const normalizedQuestions: QuizQuestion[] = parsed.questions.map((q, idx) => {
      const qType: QuestionType = q.type === 'true_false' || q.type === 'short_answer' ? q.type : 'multiple_choice';
      let options = q.options;
      let correctAnswerIndex = typeof q.correctAnswerIndex === 'number' ? q.correctAnswerIndex : 0;

      if (qType === 'multiple_choice') {
        if (!Array.isArray(options) || options.length !== 4) {
          options = options && options.length >= 2 ? options.slice(0, 4) : ['Choice A', 'Choice B', 'Choice C', 'Choice D'];
          while (options.length < 4) {
            options.push(`Option ${options.length + 1}`);
          }
        }
        correctAnswerIndex = Math.max(0, Math.min(3, correctAnswerIndex));
      } else if (qType === 'true_false') {
        options = isArabic ? ['صحيح', 'خطأ'] : ['True', 'False'];
        correctAnswerIndex = correctAnswerIndex === 1 ? 1 : 0;
      }

      return {
        id: q.id || `quiz-q-${idx + 1}-${Date.now().toString(36)}`,
        type: qType,
        question: q.question || `Question ${idx + 1}`,
        options,
        correctAnswerIndex,
        correctAnswerText: q.correctAnswerText,
        explanation: q.explanation || 'Refer to the source note for explanation.',
        sourceCitation: q.sourceCitation || noteTitle || 'Source Note',
        difficulty: (q.difficulty as QuizDifficulty) || difficulty,
        imageCaption: q.imageCaption,
        imageUrl: q.imageUrl
      };
    });

    return {
      quizTitle: parsed.quizTitle || `${noteTitle || 'Study Note'} — Mastery Quiz`,
      summary: parsed.summary || `AI study quiz generated for "${noteTitle || 'Study Note'}".`,
      questions: normalizedQuestions
    };
  }

  /**
   * Generates a Socratic hint without spoiling the answer.
   */
  static async generateHint(request: HintRequest): Promise<HintResponse> {
    const { apiKey, model = 'gemini-3.6-flash', question, noteContext, language } = request;
    const isArabic = language === 'ar' || /[\u0600-\u06FF]/.test(question);

    if (!apiKey || apiKey.trim() === '') {
      const err: CustomHttpError = new Error('API_KEY_REQUIRED: Missing API key for hint generation.');
      err.statusCode = 400;
      throw err;
    }

    if (!question || question.trim() === '') {
      const err: CustomHttpError = new Error('QUESTION_REQUIRED: Question text cannot be empty.');
      err.statusCode = 400;
      throw err;
    }

    const systemPrompt = isArabic
      ? `أنت بلوب، مساعد دراسي ذكي ومرح.
قدم تلميحاً سقراطياً لطيفاً (جملة أو جملتين) باللغة العربية الفصحى المعاصرة والسلسة لمساعدة الطالب في استنتاج الإجابة بنفسه دون كشفها مباشرة.`
      : `You are Bloub, a friendly, encouraging study mascot.
Provide a 1-to-2 sentence subtle Socratic hint for the given question based on the note context.
DO NOT reveal the answer, correct option index, or exact option text. Guide the user to think for themselves.`;

    const prompt = `Question: ${question}\n\nNote Context:\n${(noteContext || '').slice(0, 3000)}`;

    const text = await this.callGenerateContent(apiKey, model, prompt, systemPrompt, false);
    const prefix = isArabic ? 'همسة من بلوب: ' : "Bloub's Hint: ";
    const cleanText = text.trim();
    return {
      hint: cleanText.startsWith(prefix) ? cleanText : `${prefix}${cleanText}`
    };
  }

  /**
   * Evaluates a free-text response against the source note context.
   */
  static async evaluateAnswer(request: EvaluateRequest): Promise<EvaluationResponse> {
    const { apiKey, model = 'gemini-3.6-flash', question, userAnswer, expectedAnswer, noteContext, language } = request;
    const isArabic = language === 'ar' || /[\u0600-\u06FF]/.test(question) || /[\u0600-\u06FF]/.test(userAnswer);

    if (!apiKey || apiKey.trim() === '') {
      const err: CustomHttpError = new Error('API_KEY_REQUIRED: Missing API key.');
      err.statusCode = 400;
      throw err;
    }

    if (!userAnswer || userAnswer.trim().length === 0) {
      return {
        score: 0,
        isCorrect: false,
        feedback: isArabic 
          ? 'لم يتم إدخال إجابة. اكتب شرحاً مبسطاً للمفهوم لتقييمه.'
          : 'No answer was provided. Please write a response explaining the concept.',
        keyPointsCovered: [],
        missedPoints: isArabic ? ['التعريف الجوهري', 'الآليات الأساسية'] : ['Core definition', 'Key mechanisms']
      };
    }

    const systemPrompt = isArabic
      ? `أنت مساعد تقييم دراسي دقيق. قيّم إجابة الطالب باللغة العربية الفصحى السلسة والمشجعة بناءً على السياق والإجابة النموذجية.
أخرج JSON حصراً وفق هذا المخطط:
{
  "score": number (0-100),
  "isCorrect": boolean (score >= 60),
  "feedback": "string (ملاحظات تقييم ذكية ومشجعة بالعربية المعاصرة)",
  "keyPointsCovered": ["string بالعربية"],
  "missedPoints": ["string بالعربية"]
}`
      : `You are an accurate grading assistant. Evaluate the student's answer to the question based on the note context and expected answer.
Output JSON adhering to this schema:
{
  "score": number (0-100),
  "isCorrect": boolean (score >= 60),
  "feedback": "string",
  "keyPointsCovered": ["string"],
  "missedPoints": ["string"]
}`;

    const prompt = `Question: ${question}
Expected Answer: ${expectedAnswer || 'Accurate conceptual explanation'}
Student Answer: ${userAnswer}
Note Context: ${(noteContext || '').slice(0, 3000)}`;

    const raw = await this.callGenerateContent(apiKey, model, prompt, systemPrompt, true);
    const parsed = extractJsonFromText<EvaluationResponse>(raw);

    const score = typeof parsed.score === 'number' ? Math.max(0, Math.min(100, parsed.score)) : 50;
    return {
      score,
      isCorrect: score >= 60,
      feedback: parsed.feedback || (score >= 60 ? (isArabic ? 'فهم رائع ومتقن!' : 'Good understanding!') : (isArabic ? 'تحتاج مراجعة سريعة لتثبيت المعلومة.' : 'Needs review.')),
      keyPointsCovered: Array.isArray(parsed.keyPointsCovered) ? parsed.keyPointsCovered : [],
      missedPoints: Array.isArray(parsed.missedPoints) ? parsed.missedPoints : []
    };
  }

  /**
   * Grounded NotebookLM Document Chat (Zero Hallucination with Multi-Page Context)
   */
  static async askDocument(request: {
    apiKey: string;
    model?: string;
    question: string;
    documentTitle?: string;
    documentContent?: string;
    pageNumber?: number;
    pageContent?: string;
    prevPageNumber?: number;
    prevPageContent?: string;
    nextPageNumber?: number;
    nextPageContent?: string;
    chatHistory?: { role: 'user' | 'assistant'; text: string }[];
    language?: string;
  }): Promise<{ answer: string; citations: string[]; grounded: boolean }> {
    const {
      apiKey,
      model = 'gemini-3.6-flash',
      question,
      documentTitle = 'Study Document',
      documentContent = '',
      pageNumber,
      pageContent = '',
      prevPageNumber,
      prevPageContent = '',
      nextPageNumber,
      nextPageContent = '',
      chatHistory = [],
      language
    } = request;

    if (!apiKey || apiKey.trim() === '') {
      const err: CustomHttpError = new Error('API_KEY_REQUIRED: An external LLM API key must be provided.');
      err.statusCode = 400;
      throw err;
    }

    if (!question || question.trim() === '') {
      const err: CustomHttpError = new Error('QUESTION_REQUIRED: Question text cannot be empty.');
      err.statusCode = 400;
      throw err;
    }

    const contextSections: string[] = [];

    if (prevPageContent && prevPageContent.trim()) {
      contextSections.push(
        `--- [PAGE ABOVE: Page ${prevPageNumber || (pageNumber ? pageNumber - 1 : 'Previous')}] (Preceding Context, Rule Categories, Conditions & Headings) ---\n${prevPageContent.trim()}`
      );
    }

    if (pageContent && pageContent.trim()) {
      contextSections.push(
        `--- [ACTIVE CURRENT PAGE: Page ${pageNumber || 1}] (Primary Focus) ---\n${pageContent.trim()}`
      );
    }

    if (nextPageContent && nextPageContent.trim()) {
      contextSections.push(
        `--- [PAGE BELOW: Page ${nextPageNumber || (pageNumber ? pageNumber + 1 : 'Next')}] (Following Context, Continuations, Distinctions & Exceptions) ---\n${nextPageContent.trim()}`
      );
    }

    if (documentContent && documentContent.trim()) {
      contextSections.push(
        `--- [BROADER DOCUMENT EXCERPTS & ARCHIVE] ---\n${documentContent.slice(0, 20000)}`
      );
    }

    const availableContext = contextSections.join('\n\n');

    const isArabic = language === 'ar' || /[\u0600-\u06FF]/.test(question) || /[\u0600-\u06FF]/.test(availableContext.slice(0, 400));

    if (!availableContext.trim()) {
      return {
        answer: isArabic
          ? 'لا يوجد نص قابل للقراءة في هذا المستند أو الصفحة (قد تكون صورة ممسوحة ضوئياً). يُرجى فتح أو رفع مستند يحتوي على نصوص قابلة للاستخراج لأتمكن من إجابتك بدقة.'
          : 'This document does not contain readable text (it may be a scanned image or empty). Please open or upload a document with extractable text so I can ground my answers without hallucinating.',
        citations: [],
        grounded: false
      };
    }

    const systemPrompt = `You are Bloub NotebookLM, an intelligent study assistant powered by Google Gemini.
Your answers MUST be strictly and exclusively grounded in the provided document text.

CRITICAL MULTI-PAGE CONTINUITY & CONTEXTUAL AWARENESS:
1. Educational texts, Arabic grammar rules, scientific derivations, theorems, definitions, and formulas naturally flow across page breaks.
2. ALWAYS inspect the preceding page (Page above: Page ${pageNumber ? pageNumber - 1 : 'previous'}) to understand:
   - Topic headings, rule categories (e.g. rule #1, rule #2 leading to #3), introductory conditions, grammatical premises, or definitions that precede the current page text.
3. ALWAYS inspect the following page (Page below: Page ${pageNumber ? pageNumber + 1 : 'next'}) to understand:
   - Rule continuations, exceptions, clarifications, pedagogical distinction rules (e.g. "قاعدة المعلم للتمييز"), worked examples, or concluding remarks.
4. If a rule or explanation begins on the previous page or is clarified on the next page, COMBINE and SYNTHESIZE the full multi-page context seamlessly. NEVER give an incorrect, truncated, or misleading answer because a sentence or rule started or finished on an adjacent page!

CRITICAL ANTI-HALLUCINATION RULES:
1. ONLY state facts, numbers, equations, definitions, and conclusions directly present in the source text.
2. If the user's question asks for information NOT found in the source text, state clearly:
   ${isArabic ? '"بناءً على المستند المقدم، هذه المعلومة غير مذكورة."' : '"Based on the provided document, this information is not mentioned."'}
   DO NOT speculate, make assumptions, or introduce outside facts that could be incorrect for this document.
3. If only a partial answer is in the document, share only the grounded part and clarify what the document does not mention.
4. When stating facts, cite the location when applicable (e.g. [Page ${pageNumber || 1}] or quote the relevant phrase).
5. Language & Arabic Tone:
${isArabic ? `   - أجب باللغة العربية الفصحى المعاصرة، السلسة والذكية (ابتعد تماماً عن الترجمة الحرفية الركيكة أو الأسلوب الأكاديمي المعقد والجاف).
   - نسق إجابتك بنقاط وعناوين واضحة وممتعة للمراجعة والمذاكرة السريعة.
   - المصطلحات الإنجليزية أو المعادلات الرياضية اكتبها بدقة داخل inline code (مثال: \`W\`, \`P_max\`).` : `   - If the document or question is in Arabic, respond in clear, fluent Arabic.`}
6. Format answers with markdown headers, concise bullet points, and bold key terms.
7. CONCEPT TREE / ROADMAP MODE:
   - When asked for a concept tree, mind map, or what to start with:
     Structure the answer as a visual step-by-step roadmap:
     * 1. Foundation & Prerequisites (${isArabic ? 'الأساسيات والمتطلبات السابقة' : 'What you need to know first'})
     * 2. Core Principles & Mechanisms (${isArabic ? 'المفاهيم والآليات الجوهرية' : 'The central ideas and equations'})
     * 3. Applications & Mastery (${isArabic ? 'التطبيقات وربط الأفكار' : 'How it all connects and what to test'})
     Include visual branch connectors (├─, └─, ──▶) or clean markdown cards.
8. STORYTELLING / HISTORICAL NARRATIVE MODE:
   - When asked for Story Mode, storytelling, or historical context:
     Transform the facts into a compelling, chronological narrative. Make historical figures, events, and tensions feel alive and memorable for exams while remaining 100% strictly grounded in the document.`;

    let historyText = '';
    if (chatHistory.length > 0) {
      historyText = 'Previous Conversation:\n' +
        chatHistory.slice(-6).map(h => `${h.role === 'user' ? 'User' : 'Bloub'}: ${h.text}`).join('\n') + '\n\n';
    }

    const userPrompt = `${historyText}Source Document: "${documentTitle}"
${pageNumber ? `Active Focus Page: ${pageNumber}\n` : ''}
${availableContext}

User Question: ${question}

Provide an accurate, strictly grounded answer taking into account the full multi-page context above and below following the rules.`;

    const answer = await this.callGenerateContent(apiKey, model, userPrompt, systemPrompt, false);
    
    const citations: string[] = [];
    if (pageNumber) citations.push(`Page ${pageNumber}`);
    const pageMatches = answer.match(/\[(?:Page|Pg\.?)\s*(\d+)\]/gi);
    if (pageMatches) {
      pageMatches.forEach(m => {
        if (!citations.includes(m)) citations.push(m);
      });
    }

    const grounded = !answer.toLowerCase().includes('this information is not mentioned') &&
      !answer.includes('غير مذكورة');

    return {
      answer: answer.trim(),
      citations,
      grounded
    };
  }

  /**
   * Grounded Document Summarizer & Study Guide Generator
   */
  static async summarizeDocument(request: {
    apiKey: string;
    model?: string;
    documentTitle?: string;
    documentContent?: string;
    pageNumber?: number;
    pageContent?: string;
    prevPageNumber?: number;
    prevPageContent?: string;
    nextPageNumber?: number;
    nextPageContent?: string;
    mode?: 'summary' | 'key_takeaways' | 'study_guide';
    language?: string;
  }): Promise<{
    title: string;
    summary: string;
    keyPoints: string[];
    concepts?: { term: string; definition: string }[];
    suggestedQuestions?: string[];
  }> {
    const {
      apiKey,
      model = 'gemini-3.6-flash',
      documentTitle = 'Study Document',
      documentContent = '',
      pageNumber,
      pageContent = '',
      prevPageNumber,
      prevPageContent = '',
      nextPageNumber,
      nextPageContent = '',
      mode = 'summary',
      language
    } = request;

    if (!apiKey || apiKey.trim() === '') {
      const err: CustomHttpError = new Error('API_KEY_REQUIRED: Missing API key.');
      err.statusCode = 400;
      throw err;
    }

    const contextParts: string[] = [];
    if (prevPageContent && prevPageContent.trim()) {
      contextParts.push(`[Preceding Context - Page ${prevPageNumber || (pageNumber ? pageNumber - 1 : '')}]:\n${prevPageContent.trim()}`);
    }
    if (pageContent && pageContent.trim()) {
      contextParts.push(`[Active Page ${pageNumber || 1}]:\n${pageContent.trim()}`);
    }
    if (nextPageContent && nextPageContent.trim()) {
      contextParts.push(`[Following Context - Page ${nextPageNumber || (pageNumber ? pageNumber + 1 : '')}]:\n${nextPageContent.trim()}`);
    }
    if (documentContent && documentContent.trim()) {
      contextParts.push(`[Document Excerpts]:\n${documentContent.slice(0, 15000)}`);
    }

    const targetText = contextParts.join('\n\n').trim();
    const isArabic = language === 'ar' || /[\u0600-\u06FF]/.test(targetText.slice(0, 500));

    if (!targetText) {
      return {
        title: documentTitle,
        summary: isArabic 
          ? 'لم يتم العثور على نص قابل للقراءة في هذه الصفحة أو المستند لتلخيصه.'
          : 'No readable text was found in this document or page to summarize.',
        keyPoints: [isArabic ? 'تأكد من أن المستند يحتوي على نصوص قابلة للاختيار.' : 'Ensure document has selectable text.'],
        suggestedQuestions: []
      };
    }

    const systemPrompt = isArabic
      ? `أنت بلوب (Bloub NotebookLM)، مساعد دراسي ومُلخّص أكاديمي فائق الذكاء مدعوم بنموذج Google Gemini.
مهمتك: توليد ملخص دراسي مُحكَم، ذكي وسلس باللغة العربية الفصحى المعاصرة بناءً حصراً ومباشرة على النص المقدم، بدون أي هلاوس أو معلومات خارج النص.

قواعد الأسلوب واللغة العربية:
1. اكتب بلغة عربية فصحى معاصرة فائقة الوضوح والجاذبية — ابتعد تماماً عن الركاكة، الترجمة الحرفية الجافة، والتعقيد الأكاديمي المتكلف.
2. رتب الأفكار ترتيباً ذكياً يسهل استيعابه وحفظه للمذاكرة والاختبارات.
3. حافظ على المصطلحات الدقيقة بالإنجليزية بين قوسين أو inline code إذا لزم الأمر (مثال: \`P_max\`, \`75 W\`).
4. المخرجات يجب أن تكون JSON صالحاً مطابقاً تماماً لهذا المخطط:
{
  "title": "عنوان ذكي وموجز للملخص بالعربية",
  "summary": "فقرة ملخصة تجمع جوهر الصفحة أو النص بأسلوب عربي راقٍ وسلس ومباشر",
  "keyPoints": ["نقطة جوهرية 1 مركزة", "نقطة جوهرية 2", "نقطة جوهرية 3"],
  "concepts": [
    { "term": "المصطلح بالعربية (مع أصله إن وجد)", "definition": "شرح مبسط ومباشر للمفهوم" }
  ],
  "suggestedQuestions": ["سؤال مراجعة ذكي لتثبيت الفهم 1", "سؤال 2"]
}`
      : `You are Bloub NotebookLM, an academic synthesizer powered by Google Gemini.
Generate a structured study summary based STRICTLY on facts in the provided text. Never hallucinate outside facts.
Output MUST be valid JSON adhering to this schema:
{
  "title": "string",
  "summary": "string (concise overview paragraph)",
  "keyPoints": ["bullet point 1", "bullet point 2", "bullet point 3"],
  "concepts": [
    { "term": "string", "definition": "string" }
  ],
  "suggestedQuestions": ["question 1", "question 2", "question 3"]
}`;

    const userPrompt = `Document: "${documentTitle}" ${pageNumber ? `(Page ${pageNumber})` : ''}
Mode: ${mode}

Source Text:
${targetText}`;

    const raw = await this.callGenerateContent(apiKey, model, userPrompt, systemPrompt, true);
    const parsed = extractJsonFromText<{
      title?: string;
      summary?: string;
      keyPoints?: string[];
      concepts?: { term: string; definition: string }[];
      suggestedQuestions?: string[];
    }>(raw);

    return {
      title: parsed.title || `${documentTitle} — ${pageNumber ? (isArabic ? `صفحة ${pageNumber}` : `Page ${pageNumber}`) : (isArabic ? 'نظرة عامة' : 'Overview')}`,
      summary: parsed.summary || (isArabic ? 'ملخص مستند إلى نص الوثيقة.' : 'Summary based on document text.'),
      keyPoints: Array.isArray(parsed.keyPoints) && parsed.keyPoints.length > 0 ? parsed.keyPoints : [isArabic ? 'راجع المفاهيم الأساسية في الوثيقة.' : 'Review key concepts in document.'],
      concepts: Array.isArray(parsed.concepts) ? parsed.concepts : [],
      suggestedQuestions: Array.isArray(parsed.suggestedQuestions) ? parsed.suggestedQuestions : []
    };
  }

  /**
   * Tests API key validity with a lightweight ping.
   */
  static async testConnection(apiKey: string, model: string = 'gemini-3.6-flash'): Promise<ConnectionTestResult> {
    if (!apiKey || apiKey.trim() === '') {
      return { valid: false, message: 'API key cannot be empty.' };
    }

    try {
      await this.callGenerateContent(apiKey, model, 'Respond with the single word "OK".', undefined, false);
      return {
        valid: true,
        message: `Successfully connected to Google Gemini API (Model: ${model}).`,
        model
      };
    } catch (err: unknown) {
      const pingErr = err as Error;
      return {
        valid: false,
        message: pingErr.message || 'Failed to connect to Google Gemini API.'
      };
    }
  }
}
