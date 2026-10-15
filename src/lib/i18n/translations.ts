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
