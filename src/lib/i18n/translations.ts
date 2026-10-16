export type Locale = 'en' | 'ar';

export interface Translations {
  // Navigation
  navLists: string;
  navStats: string;
  navSettings: string;
  navStudy: string;
  navVault: string;

  // General Actions
  search: string;
  save: string;
  saved: string;
  cancel: string;
  delete: string;
  edit: string;
  close: string;
  back: string;
  all: string;
  active: string;
  completed: string;
  loading: string;
  signOut: string;
  signIn: string;

  // Tasks & Lists
  whatsOnYourMind: string;
  newTask: string;
  addTaskPlaceholder: string;
  noTasks: string;
  allDone: string;
  dueToday: string;
  overdue: string;
  today: string;
  tomorrow: string;
  priority: string;
  priorityHigh: string;
  priorityMedium: string;
  priorityLow: string;
  category: string;
  newCategory: string;
  myLists: string;
  createList: string;
  listNamePlaceholder: string;
  tasksCount: string;

  // Settings
  settingsTitle: string;
  language: string;
  languageDesc: string;
  langEnglish: string;
  langArabic: string;
  shape: string;
  expression: string;
  colour: string;
  themeStudio: string;
  autoMood: string;
  autoMoodDesc: string;
  pushNotifications: string;
  pushNotificationsDesc: string;
  sendTestPush: string;
  notebookLmApi: string;
  apiKeyPlaceholder: string;
  apiKeyDesc: string;
  keyActive: string;
  noKey: string;
  cliSkill: string;
  copy: string;
  copied: string;
  eyeGazeDirection: string;

  // Mascot Shapes (4 Iconic + Legacy)
  shape_cloud: string;
  shape_book: string;
  shape_squircle: string;
  shape_spark: string;
  shape_cercle: string;
  shape_galet: string;
  shape_capsule: string;
  shape_triangle: string;
  shape_hexagone: string;
  shape_nuage: string;
  shape_goutte: string;
  shape_oeuf: string;
  shape_soleil: string;
  shape_fromage: string;
  shape_livre: string;

  // Mascot Expressions (6 Canonical + Legacy)
  expr_neutral: string;
  expr_happy: string;
  expr_excited: string;
  expr_chill: string;
  expr_shy: string;
  expr_sleepy: string;
  expr_neutre: string;
  expr_attentif: string;
  expr_surpris: string;
  expr_excite: string;
  expr_heureux: string;
  expr_hilare: string;
  expr_colere: string;
  expr_triste: string;
  expr_effraye: string;
  expr_mefiant: string;
  expr_curieux: string;
  expr_fier: string;
  expr_timide: string;
  expr_blase: string;
  expr_somnolent: string;

  // Themes (16)
  theme_dark_blue: string;
  theme_midnight_violet: string;
  theme_emerald_night: string;
  theme_crimson_ember: string;
  theme_solar_amber: string;
  theme_abyssal_cyan: string;
  theme_neon_rose: string;
  theme_forest_moss: string;
  theme_royal_indigo: string;
  theme_deep_plum: string;
  theme_burnt_bronze: string;
  theme_titanium_slate: string;
  theme_obsidian_oled: string;
  theme_phantom_charcoal: string;
  theme_mystic_magenta: string;
  theme_arctic_navy: string;

  // Theme Categories (5)
  theme_cat_all: string;
  theme_cat_cyber: string;
  theme_cat_atmosphere: string;
  theme_cat_element: string;
  theme_cat_studio: string;

  // Study & AI
  studyWorkspace: string;
  documentChat: string;
  askPlaceholder: string;
  summarizePage: string;
  keyTakeaways: string;
  conceptTree: string;
  storyMode: string;
  explainConcepts: string;
  takeQuiz: string;
  masteryQuiz: string;
  quizSummary: string;
  score: string;
  nextQuestion: string;
  submitAnswer: string;
  bloubHint: string;
  needHint: string;
  pageNotes: string;
  typeNotePlaceholder: string;
  noNotes: string;
  uploadPdf: string;
  library: string;
  activePage: string;
  thinking: string;
  groundedNote: string;
  question: string;
  explanation: string;
  sourceCitation: string;
  goodUnderstanding: string;
  needsReview: string;
}

export const TRANSLATIONS: Record<Locale, Translations> = {
  en: {
    // Navigation
    navLists: 'Lists',
    navStats: 'Stats',
    navSettings: 'Settings',
    navStudy: 'Study',
    navVault: 'Vault',

    // General Actions
    search: 'Search',
    save: 'Save',
    saved: 'Saved ✓',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
    back: 'Back',
    all: 'All',
    active: 'Active',
    completed: 'Completed',
    loading: 'Loading...',
    signOut: 'Sign Out',
    signIn: 'Sign In',

    // Tasks & Lists
    whatsOnYourMind: "What's on your mind?",
    newTask: 'New Task',
    addTaskPlaceholder: 'Add a new task...',
    noTasks: 'All clear! No pending tasks.',
    allDone: 'All done! Fantastic job ✨',
    dueToday: 'Due today',
    overdue: 'Overdue',
    today: 'Today',
    tomorrow: 'Tomorrow',
    priority: 'Priority',
    priorityHigh: 'High',
    priorityMedium: 'Medium',
    priorityLow: 'Low',
    category: 'Category',
    newCategory: 'New List',
    myLists: 'My Lists',
    createList: 'Create List',
    listNamePlaceholder: 'List name...',
    tasksCount: 'tasks',

    // Settings
    settingsTitle: 'Settings',
    language: 'Language',
    languageDesc: 'Choose interface and AI response language',
    langEnglish: 'English',
    langArabic: 'العربية',
    shape: 'Shape',
    expression: 'Expression',
    colour: 'Colour',
    themeStudio: 'Theme Studio',
    autoMood: 'Reactive Auto-Mood',
    autoMoodDesc: 'Bloub dynamically reacts to your study and task flow',
    pushNotifications: 'Push Notifications',
    pushNotificationsDesc: 'Get daily task reminders & study nudges',
    sendTestPush: 'Send Test Push Notification',
    notebookLmApi: 'NOTEBOOKLM / GEMINI API',
    apiKeyPlaceholder: 'Paste your Gemini API Key...',
    apiKeyDesc: 'Powers smart summaries, quizzes, and document Q&A.',
    keyActive: 'Key Active',
    noKey: 'No Key',
    cliSkill: 'ANTIGRAVITY /TODO SKILL',
    copy: 'Copy',
    copied: 'Copied!',
    eyeGazeDirection: 'Eye Gaze Direction',

    // Mascot Shapes (4 Iconic + Legacy)
    shape_cloud: 'Cloud',
    shape_book: 'Book',
    shape_squircle: 'Squircle',
    shape_spark: 'Spark',
    shape_cercle: 'Circle',
    shape_galet: 'Pebble',
    shape_capsule: 'Capsule',
    shape_triangle: 'Triangle',
    shape_hexagone: 'Hexagon',
    shape_nuage: 'Cloud',
    shape_goutte: 'Droplet',
    shape_oeuf: 'Egg',
    shape_soleil: 'Sun',
    shape_fromage: 'Cheese',
    shape_livre: 'Book',

    // Mascot Expressions (6 Canonical + Legacy)
    expr_neutral: 'Focused',
    expr_happy: 'Happy',
    expr_excited: 'Hyped',
    expr_chill: 'Chill',
    expr_shy: 'Shy',
    expr_sleepy: 'Sleepy',
    expr_neutre: 'Focused',
    expr_attentif: 'Attentive',
    expr_surpris: 'Surprised',
    expr_excite: 'Excited',
    expr_heureux: 'Happy',
    expr_hilare: 'Laughing',
    expr_colere: 'Angry',
    expr_triste: 'Sad',
    expr_effraye: 'Scared',
    expr_mefiant: 'Suspicious',
    expr_curieux: 'Curious',
    expr_fier: 'Proud',
    expr_timide: 'Shy',
    expr_blase: 'Chill',
    expr_somnolent: 'Sleepy',

    // Themes (16)
    theme_dark_blue: 'Dark Blue',
    theme_midnight_violet: 'Midnight Violet',
    theme_emerald_night: 'Emerald Night',
    theme_crimson_ember: 'Crimson Ember',
    theme_solar_amber: 'Solar Amber',
    theme_abyssal_cyan: 'Abyssal Cyan',
    theme_neon_rose: 'Neon Rose',
    theme_forest_moss: 'Forest Moss',
    theme_royal_indigo: 'Royal Indigo',
    theme_deep_plum: 'Deep Plum',
    theme_burnt_bronze: 'Burnt Bronze',
    theme_titanium_slate: 'Titanium Slate',
    theme_obsidian_oled: 'Obsidian OLED',
    theme_phantom_charcoal: 'Phantom Charcoal',
    theme_mystic_magenta: 'Mystic Magenta',
    theme_arctic_navy: 'Arctic Navy',

    // Theme Categories (5)
    theme_cat_all: 'All',
    theme_cat_cyber: 'Cyber',
    theme_cat_atmosphere: 'Atmosphere',
    theme_cat_element: 'Element',
    theme_cat_studio: 'Studio',

    // Study & AI
    studyWorkspace: 'Study Workspace',
    documentChat: 'NotebookLM Assistant',
    askPlaceholder: 'Ask Bloub anything about this document...',
    summarizePage: 'Summarize Page',
    keyTakeaways: 'Key Takeaways',
    conceptTree: 'Concept Tree',
    storyMode: 'Story Mode',
    explainConcepts: 'Explain Concepts',
    takeQuiz: 'Take Quiz',
    masteryQuiz: 'Mastery Quiz',
    quizSummary: 'Quiz Summary',
    score: 'Score',
    nextQuestion: 'Next Question',
    submitAnswer: 'Submit Answer',
    bloubHint: "Bloub's Hint",
    needHint: 'Need a hint?',
    pageNotes: 'Page Notes',
    typeNotePlaceholder: 'Write notes for this page... (/ for blocks)',
    noNotes: 'No notes on this page yet.',
    uploadPdf: 'Upload Document',
    library: 'Library',
    activePage: 'Page',
    thinking: 'Bloub is thinking...',
    groundedNote: 'Strictly grounded in your document',
    question: 'Question',
    explanation: 'Explanation',
    sourceCitation: 'Source Citation',
    goodUnderstanding: 'Great grasp of the concept!',
    needsReview: 'Review the key points in the text.'
  },

  ar: {
    // Navigation
    navLists: 'قوائمي',
    navStats: 'إنجازاتي',
    navSettings: 'الإعدادات',
    navStudy: 'مساحة المذاكرة',
    navVault: 'المستودع',

    // General Actions
    search: 'بحث',
    save: 'حفظ',
    saved: 'تم الحفظ ✓',
    cancel: 'إلغاء',
    delete: 'حذف',
    edit: 'تعديل',
    close: 'إغلاق',
    back: 'رجوع',
    all: 'الكل',
    active: 'قيد الإنجاز',
    completed: 'المكتملة',
    loading: 'لحظات...',
    signOut: 'تسجيل الخروج',
    signIn: 'تسجيل الدخول',

    // Tasks & Lists
    whatsOnYourMind: 'وش ناوي تنجز اليوم؟',
    newTask: 'مهمة جديدة',
    addTaskPlaceholder: 'أضف مهمة جديدة...',
    noTasks: 'يومك رايق، ما عندك مهام متبقية ✨',
    allDone: 'كفو! أنجزت كل شي بامتياز 🎉',
    dueToday: 'مستحقة اليوم',
    overdue: 'متأخرة',
    today: 'اليوم',
    tomorrow: 'غداً',
    priority: 'الأولوية',
    priorityHigh: 'عالية',
    priorityMedium: 'متوسطة',
    priorityLow: 'عادية',
    category: 'التصنيف',
    newCategory: 'قائمة جديدة',
    myLists: 'قوائمي',
    createList: 'إنشاء قائمة',
    listNamePlaceholder: 'اسم القائمة...',
    tasksCount: 'مهام',

    // Settings
    settingsTitle: 'الإعدادات',
    language: 'اللغة',
    languageDesc: 'اختر لغة الواجهة ومساعد الذكاء الاصطناعي',
    langEnglish: 'English',
    langArabic: 'العربية',
    shape: 'الشكل',
    expression: 'المزاج',
    colour: 'اللون',
    themeStudio: 'استوديو الثيمات',
    autoMood: 'المزاج التفاعلي',
    autoMoodDesc: 'يتفاعل بلوب تلقائياً مع وتيرة إنجازك ودراستك',
    pushNotifications: 'إشعارات التذكير',
    pushNotificationsDesc: 'تنبيهات يومية بالمهام ومواعيد المذاكرة',
    sendTestPush: 'إرسال إشعار تجريبي',
    notebookLmApi: 'مفتاح الذكاء الاصطناعي (Gemini)',
    apiKeyPlaceholder: 'الصق مفتاح Gemini API هنا...',
    apiKeyDesc: 'يُشغّل التلخيص الذكي، وتوليد الاختبارات، وسؤال الملاحظات.',
    keyActive: 'المفتاح مفعّل',
    noKey: 'بدون مفتاح',
    cliSkill: 'إضافة /TODO في Antigravity',
    copy: 'نسخ',
    copied: 'تم النسخ!',
    eyeGazeDirection: 'اتجاه نظرة العين',

    // Mascot Shapes (4 Iconic + Legacy)
    shape_cloud: 'سحابة',
    shape_book: 'كتاب',
    shape_squircle: 'مربع دائري',
    shape_spark: 'نجمة',
    shape_cercle: 'دائرة',
    shape_galet: 'حصاة',
    shape_capsule: 'كبسولة',
    shape_triangle: 'مثلث',
    shape_hexagone: 'سداسي',
    shape_nuage: 'غيمة',
    shape_goutte: 'قطرة',
    shape_oeuf: 'بيضة',
    shape_soleil: 'شمس',
    shape_fromage: 'جبنة',
    shape_livre: 'كتاب',

    // Mascot Expressions (6 Canonical + Legacy)
    expr_neutral: 'مركّز',
    expr_happy: 'سعيد',
    expr_excited: 'متحمّس',
    expr_chill: 'هادئ',
    expr_shy: 'خجول',
    expr_sleepy: 'نعسان',
    expr_neutre: 'مركّز',
    expr_attentif: 'منتبه',
    expr_surpris: 'متفاجئ',
    expr_excite: 'متحمّس',
    expr_heureux: 'سعيد',
    expr_hilare: 'ضاحك',
    expr_colere: 'غاضب',
    expr_triste: 'حزين',
    expr_effraye: 'مذعور',
    expr_mefiant: 'حذر',
    expr_curieux: 'فضولي',
    expr_fier: 'فخور',
    expr_timide: 'خجول',
    expr_blase: 'هادئ',
    expr_somnolent: 'نعسان',

    // Themes (16)
    theme_dark_blue: 'أزرق داكن',
    theme_midnight_violet: 'بنفسج منتصف الليل',
    theme_emerald_night: 'زمرد ليلي',
    theme_crimson_ember: 'جمر قرمزي',
    theme_solar_amber: 'كهرمان شمسي',
    theme_abyssal_cyan: 'سماوي أعماق',
    theme_neon_rose: 'وردي نيون',
    theme_forest_moss: 'طحلب الغابة',
    theme_royal_indigo: 'نيلي ملكي',
    theme_deep_plum: 'برقوقي داكن',
    theme_burnt_bronze: 'برونزي محروق',
    theme_titanium_slate: 'رمادي تيتانيوم',
    theme_obsidian_oled: 'سواد أوبسيديان',
    theme_phantom_charcoal: 'فحمي شبحي',
    theme_mystic_magenta: 'أرجواني غامض',
    theme_arctic_navy: 'كحلي قطبي',

    // Theme Categories (5)
    theme_cat_all: 'الكل',
    theme_cat_cyber: 'سايبر',
    theme_cat_atmosphere: 'أجواء',
    theme_cat_element: 'عناصر',
    theme_cat_studio: 'استوديو',

    // Study & AI
    studyWorkspace: 'مساحة المذاكرة',
    documentChat: 'مساعد الملاحظات الذكي',
    askPlaceholder: 'اسأل بلوب عن أي نقطة في المستند...',
    summarizePage: 'ملخص ذكي',
    keyTakeaways: 'أبرز النقاط',
    conceptTree: 'شجرة المفاهيم',
    storyMode: 'طريقة القصة',
    explainConcepts: 'شرح مبسط',
    takeQuiz: 'اختبار تثبيت',
    masteryQuiz: 'اختبار قياس الفهم',
    quizSummary: 'ملخص الاختبار',
    score: 'النتيجة',
    nextQuestion: 'السؤال التالي',
    submitAnswer: 'تأكيد الإجابة',
    bloubHint: 'همسة من بلوب',
    needHint: 'تحتاج تلميح؟',
    pageNotes: 'ملاحظات الصفحة',
    typeNotePlaceholder: 'دوّن ملاحظاتك لهذه الصفحة... (اكتب / للقوائم والعناوين)',
    noNotes: 'لا توجد ملاحظات على هذه الصفحة بعد.',
    uploadPdf: 'رفع مستند',
    library: 'المكتبة',
    activePage: 'صفحة',
    thinking: 'بلوب يفكر...',
    groundedNote: 'مستند مباشرة من محتوى الملاحظات',
    question: 'السؤال',
    explanation: 'التوضيح والتعليل',
    sourceCitation: 'المرجع في المستند',
    goodUnderstanding: 'فهم ممتاز للنقطة الجوهرية!',
    needsReview: 'راجع النقاط الأساسية لتثبيت المفهوم.'
  }
};

const THEME_SLUG_MAP: Record<string, keyof Translations> = {
  'dark-blue': 'theme_dark_blue',
  'midnight-violet': 'theme_midnight_violet',
  'emerald-night': 'theme_emerald_night',
  'crimson-ember': 'theme_crimson_ember',
  'solar-amber': 'theme_solar_amber',
  'abyssal-cyan': 'theme_abyssal_cyan',
  'neon-rose': 'theme_neon_rose',
  'forest-moss': 'theme_forest_moss',
  'royal-indigo': 'theme_royal_indigo',
  'deep-plum': 'theme_deep_plum',
  'burnt-bronze': 'theme_burnt_bronze',
  'titanium-slate': 'theme_titanium_slate',
  'obsidian-oled': 'theme_obsidian_oled',
  'phantom-charcoal': 'theme_phantom_charcoal',
  'mystic-magenta': 'theme_mystic_magenta',
  'arctic-navy': 'theme_arctic_navy',

  // Tailwind class IDs
  'bg-[#080d2a]': 'theme_dark_blue',
  'bg-[#1a0b2e]': 'theme_midnight_violet',
  'bg-[#022c22]': 'theme_emerald_night',
  'bg-[#3b0712]': 'theme_crimson_ember',
  'bg-[#422006]': 'theme_solar_amber',
  'bg-[#082f49]': 'theme_abyssal_cyan',
  'bg-[#380424]': 'theme_neon_rose',
  'bg-[#052e16]': 'theme_forest_moss',
  'bg-[#1e1b4b]': 'theme_royal_indigo',
  'bg-[#2e0854]': 'theme_deep_plum',
  'bg-[#3c1605]': 'theme_burnt_bronze',
  'bg-[#0f172a]': 'theme_titanium_slate',
  'bg-[#030712]': 'theme_obsidian_oled',
  'bg-[#18181b]': 'theme_phantom_charcoal',
  'bg-[#3b0d2d]': 'theme_mystic_magenta',
  'bg-[#0c1a30]': 'theme_arctic_navy',

  // Names lowercase
  'dark blue': 'theme_dark_blue',
  'midnight violet': 'theme_midnight_violet',
  'emerald night': 'theme_emerald_night',
  'crimson ember': 'theme_crimson_ember',
  'solar amber': 'theme_solar_amber',
  'abyssal cyan': 'theme_abyssal_cyan',
  'neon rose': 'theme_neon_rose',
  'forest moss': 'theme_forest_moss',
  'royal indigo': 'theme_royal_indigo',
  'deep plum': 'theme_deep_plum',
  'burnt bronze': 'theme_burnt_bronze',
  'titanium slate': 'theme_titanium_slate',
  'obsidian oled': 'theme_obsidian_oled',
  'phantom charcoal': 'theme_phantom_charcoal',
  'mystic magenta': 'theme_mystic_magenta',
  'arctic navy': 'theme_arctic_navy',
};

export function getLocalizedShape(shape: string | undefined | null, locale: Locale): string {
  if (!shape) return '';
  const norm = shape.toLowerCase().trim();
  const key = `shape_${norm}` as keyof Translations;
  const dict = TRANSLATIONS[locale] || TRANSLATIONS.en;
  return (dict[key] as string) || shape;
}

export function getLocalizedExpression(expr: string | undefined | null, locale: Locale): string {
  if (!expr) return '';
  const norm = expr.toLowerCase().trim();
  const key = `expr_${norm}` as keyof Translations;
  const dict = TRANSLATIONS[locale] || TRANSLATIONS.en;
  return (dict[key] as string) || expr;
}

export function getLocalizedThemeName(identifier: string | undefined | null, locale: Locale): string {
  if (!identifier) return '';
  const clean = identifier.trim();
  const lower = clean.toLowerCase();
  const key = THEME_SLUG_MAP[clean] || THEME_SLUG_MAP[lower];
  const dict = TRANSLATIONS[locale] || TRANSLATIONS.en;
  if (key && dict[key]) {
    return dict[key] as string;
  }
  return identifier;
}

export function getLocalizedThemeCategory(category: string | undefined | null, locale: Locale): string {
  if (!category) return '';
  const norm = category.toLowerCase().trim();
  const key = `theme_cat_${norm}` as keyof Translations;
  const dict = TRANSLATIONS[locale] || TRANSLATIONS.en;
  return (dict[key] as string) || category;
}

