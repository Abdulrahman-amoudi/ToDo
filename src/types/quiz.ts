/**
 * AI Quiz & Study Engine Types
 */

export type QuestionType = 'multiple_choice' | 'short_answer' | 'true_false';

export type QuizDifficulty = 'easy' | 'medium' | 'hard';

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  correctAnswerIndex?: number;
  correctAnswerText?: string;
  explanation: string;
  sourceCitation: string;
  difficulty: QuizDifficulty;
  imageUrl?: string;
  imageCaption?: string;
}

export interface QuizConfig {
  questionCount?: number;
  difficulty?: QuizDifficulty;
  types?: QuestionType[];
  language?: string;
  scope?: 'page' | 'full_document';
  exhaustive?: boolean;
}

export interface QuizGenerateRequest {
  apiKey?: string;
  model?: string;
  noteTitle: string;
  noteContent: string;
  config?: QuizConfig;
  useMock?: boolean;
  language?: string;
}

export interface QuizResponse {
  quizTitle: string;
  summary: string;
  questions: QuizQuestion[];
}

export interface QuizSession {
  id: string;
  notePath: string;
  noteTitle: string;
  generatedAt: string;
  model: string;
  questions: QuizQuestion[];
  userAnswers: Record<string, {
    selectedOptionIndex?: number;
    textAnswer?: string;
    isCorrect?: boolean;
    aiFeedback?: string;
  }>;
  score?: {
    total: number;
    correct: number;
    percentage: number;
  };
  completed: boolean;
}

export interface HintRequest {
  apiKey?: string;
  question: string;
  noteContext: string;
  model?: string;
  useMock?: boolean;
  language?: string;
}

export interface HintResponse {
  hint: string;
}

export interface EvaluateRequest {
  apiKey?: string;
  question: string;
  userAnswer: string;
  expectedAnswer?: string;
  noteContext?: string;
  model?: string;
  useMock?: boolean;
  language?: string;
}

export interface EvaluationResponse {
  score: number; // 0 - 100
  isCorrect: boolean;
  feedback: string;
  keyPointsCovered: string[];
  missedPoints: string[];
}

export interface ConnectionTestResult {
  valid: boolean;
  message: string;
  model?: string;
}
