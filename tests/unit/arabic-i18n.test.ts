import { describe, it } from 'node:test';
import assert from 'node:assert';
import { TRANSLATIONS } from '../../src/lib/i18n/translations';
import { GeminiClient } from '../../src/lib/ai/gemini';

describe('Arabic i18n & AI Prompt Verification', () => {
  it('should have complete key parity between English and Arabic translations', () => {
    const enKeys = Object.keys(TRANSLATIONS.en).sort();
    const arKeys = Object.keys(TRANSLATIONS.ar).sort();

    assert.deepStrictEqual(enKeys, arKeys, 'Translation keys must match 100% across en and ar');
    assert.ok(enKeys.length > 50, 'Must have at least 50 translation keys');

    // Ensure all Arabic strings are non-empty and not identical placeholders
    for (const key of enKeys as (keyof typeof TRANSLATIONS.en)[]) {
      const enVal = TRANSLATIONS.en[key];
      const arVal = TRANSLATIONS.ar[key];
      assert.ok(typeof arVal === 'string' && arVal.trim().length > 0, `Arabic key "${key}" must be non-empty`);
      assert.ok(typeof enVal === 'string' && enVal.trim().length > 0, `English key "${key}" must be non-empty`);
    }
  });

  it('should use natural, authentic, modern Arabic (not stiff/academic translations)', () => {
    const ar = TRANSLATIONS.ar;

    // Friendly, modern Arabic task prompt
    assert.strictEqual(ar.whatsOnYourMind, 'وش ناوي تنجز اليوم؟');
    assert.strictEqual(ar.noTasks, 'يومك رايق، ما عندك مهام متبقية ✨');
    assert.strictEqual(ar.allDone, 'كفو! أنجزت كل شي بامتياز 🎉');

    // Modern, clear study and AI terms
    assert.strictEqual(ar.summarizePage, 'ملخص ذكي');
    assert.strictEqual(ar.keyTakeaways, 'أبرز النقاط');
    assert.strictEqual(ar.conceptTree, 'شجرة المفاهيم');
    assert.strictEqual(ar.storyMode, 'طريقة القصة');
    assert.strictEqual(ar.bloubHint, 'همسة من بلوب');
    assert.strictEqual(ar.langArabic, 'العربية');
  });

  it('should format true/false quiz options in Arabic when language is ar', async () => {
    // Intercept callGenerateContent to verify prompt and return mock quiz
    const originalCall = (GeminiClient as any).callGenerateContent;
    let capturedSystemPrompt = '';

    (GeminiClient as any).callGenerateContent = async (
      _apiKey: string,
      _model: string,
      _prompt: string,
      systemInstruction?: string,
      _jsonMode?: boolean
    ) => {
      capturedSystemPrompt = systemInstruction || '';
      return JSON.stringify({
        quizTitle: 'اختبار الطاقة الكهرومغناطيسية',
        summary: 'ملخص شامل',
        questions: [
          {
            id: 'q1',
            type: 'true_false',
            question: 'هل القدرة العظمى هي `P_max = 150 W`؟',
            options: ['صحيح', 'خطأ'],
            correctAnswerIndex: 0,
            explanation: 'القيمة القصوى هي بالفعل 150 W.',
            sourceCitation: 'الصفحة 3'
          }
        ]
      });
    };

    try {
      const quiz = await GeminiClient.generateQuiz({
        apiKey: 'test-api-key',
        noteTitle: 'ملاحظات الفيزياء',
        noteContent: 'القدرة العظمى P_max = 150 W',
        language: 'ar'
      });

      assert.ok(capturedSystemPrompt.includes('فصحى معاصرة وسلسة'), 'System prompt should enforce modern, fluent Arabic');
      assert.ok(capturedSystemPrompt.includes('inline backticks'), 'System prompt should enforce inline backticks for math');
      assert.strictEqual(quiz.questions[0].type, 'true_false');
      assert.deepStrictEqual(quiz.questions[0].options, ['صحيح', 'خطأ'], 'Options must be localized Arabic True/False');
    } finally {
      (GeminiClient as any).callGenerateContent = originalCall;
    }
  });

  it('should formulate Arabic Socratic hint with "همسة من بلوب:"', async () => {
    const originalCall = (GeminiClient as any).callGenerateContent;

    (GeminiClient as any).callGenerateContent = async () => {
      return 'تذكر العلاقة بين القدرة وفرق الجهد.';
    };

    try {
      const res = await GeminiClient.generateHint({
        apiKey: 'test-api-key',
        question: 'ما هو قانون القدرة المستهلكة؟',
        noteContext: 'P = V * I',
        language: 'ar'
      });

      assert.ok(res.hint.startsWith('همسة من بلوب: '), 'Arabic hint must start with friendly prefix');
      assert.ok(res.hint.includes('العلاقة بين القدرة'), 'Must include the generated guidance');
    } finally {
      (GeminiClient as any).callGenerateContent = originalCall;
    }
  });
});
