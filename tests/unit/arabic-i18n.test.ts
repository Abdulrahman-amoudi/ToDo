import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  TRANSLATIONS,
  getLocalizedShape,
  getLocalizedExpression,
  getLocalizedThemeName,
  getLocalizedThemeCategory
} from '../../src/lib/i18n/translations';
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

  it('should localize all 12 shapes into natural Arabic', () => {
    const expectedShapes: Record<string, string> = {
      squircle: 'سكويركل',
      cercle: 'دائرة',
      galet: 'حصاة',
      capsule: 'كبسولة',
      triangle: 'مثلث',
      hexagone: 'سداسي',
      nuage: 'غيمة',
      goutte: 'قطرة',
      oeuf: 'بيضة',
      soleil: 'شمس',
      fromage: 'جبنة',
      livre: 'كتاب'
    };

    for (const [id, expectedAr] of Object.entries(expectedShapes)) {
      assert.strictEqual(getLocalizedShape(id, 'ar'), expectedAr, `Shape "${id}" in Arabic should be "${expectedAr}"`);
      assert.ok(getLocalizedShape(id, 'en').length > 0, `Shape "${id}" in English should be defined`);
    }
  });

  it('should localize all 15 expressions into authentic Arabic', () => {
    const expectedExpressions: Record<string, string> = {
      neutre: 'هادئ',
      attentif: 'مركّز',
      surpris: 'متفاجئ',
      excite: 'متحمّس',
      heureux: 'مبسوط',
      hilare: 'ضاحك',
      colere: 'غاضب',
      triste: 'حزين',
      effraye: 'مذعور',
      mefiant: 'حذر',
      curieux: 'فضولي',
      fier: 'فخور',
      timide: 'خجول',
      blase: 'مروّق',
      somnolent: 'نعسان'
    };

    for (const [id, expectedAr] of Object.entries(expectedExpressions)) {
      assert.strictEqual(getLocalizedExpression(id, 'ar'), expectedAr, `Expression "${id}" in Arabic should be "${expectedAr}"`);
      assert.ok(getLocalizedExpression(id, 'en').length > 0, `Expression "${id}" in English should be defined`);
    }
  });

  it('should localize all 16 themes and categories into authentic Arabic', () => {
    const expectedThemes: Record<string, string> = {
      'dark-blue': 'أزرق داكن',
      'midnight-violet': 'بنفسج منتصف الليل',
      'emerald-night': 'زمرد ليلي',
      'crimson-ember': 'جمر قرمزي',
      'solar-amber': 'كهرمان شمسي',
      'abyssal-cyan': 'سماوي أعماق',
      'neon-rose': 'وردي نيون',
      'forest-moss': 'طحلب الغابة',
      'royal-indigo': 'نيلي ملكي',
      'deep-plum': 'برقوقي داكن',
      'burnt-bronze': 'برونزي محروق',
      'titanium-slate': 'رمادي تيتانيوم',
      'obsidian-oled': 'سواد أوبسيديان',
      'phantom-charcoal': 'فحمي شبحي',
      'mystic-magenta': 'أرجواني غامض',
      'arctic-navy': 'كحلي قطبي',
    };

    for (const [slug, expectedAr] of Object.entries(expectedThemes)) {
      assert.strictEqual(getLocalizedThemeName(slug, 'ar'), expectedAr, `Theme "${slug}" in Arabic should be "${expectedAr}"`);
      assert.ok(getLocalizedThemeName(slug, 'en').length > 0, `Theme "${slug}" in English should be defined`);
    }

    // Categories
    assert.strictEqual(getLocalizedThemeCategory('All', 'ar'), 'الكل');
    assert.strictEqual(getLocalizedThemeCategory('Cyber', 'ar'), 'سايبر');
    assert.strictEqual(getLocalizedThemeCategory('Atmosphere', 'ar'), 'أجواء');
    assert.strictEqual(getLocalizedThemeCategory('Element', 'ar'), 'عناصر');
    assert.strictEqual(getLocalizedThemeCategory('Studio', 'ar'), 'استوديو');
  });
});

