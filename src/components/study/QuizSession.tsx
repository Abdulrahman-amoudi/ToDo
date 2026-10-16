'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, ArrowLeft, CheckCircle2, XCircle, Sparkles, Brain, Lightbulb, ChevronRight, Award } from 'lucide-react';
import type { ParsedObsidianNote } from '@/types/obsidian';
import type { QuizResponse, QuizQuestion, EvaluationResponse } from '@/types/quiz';
import { StudyMarkdownRenderer } from './StudyMarkdownRenderer';
import { useLanguage } from '@/lib/i18n/useLanguage';

interface QuizSessionProps {
  note: ParsedObsidianNote;
  apiKey: string;
  isDark?: boolean;
  onClose: () => void;
  triggerMascot: (state: any, expression: any, important?: boolean) => void;
}

export default function QuizSession({ note, apiKey, isDark = true, onClose, triggerMascot }: QuizSessionProps) {
  const { locale, t, isRTL } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quizData, setQuizData] = useState<QuizResponse | null>(null);
  
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { isCorrect: boolean, userText?: string, selectedIdx?: number, feedback?: string }>>({});
  const [isEvaluating, setIsEvaluating] = useState(false);
  
  const [hint, setHint] = useState<string | null>(null);
  const [isGettingHint, setIsGettingHint] = useState(false);
  
  const [isFinished, setIsFinished] = useState(false);
  const [isExhaustiveQuiz, setIsExhaustiveQuiz] = useState(false);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [showPromptInput, setShowPromptInput] = useState<boolean>(false);

  const fallbackContent = (note.bodyContent && note.bodyContent.trim()) || note.rawContent || (note.frontmatter?.pdf_notes ? JSON.stringify(note.frontmatter.pdf_notes) : '') || note.title || 'Study document content';

  useEffect(() => {
    generateQuiz(false);
  }, []);

  const generateQuiz = async (exhaustiveMode = false, promptOverride?: string) => {
    try {
      setLoading(true);
      setError(null);
      setCurrentIdx(0);
      setAnswers({});
      setIsFinished(false);
      setIsExhaustiveQuiz(exhaustiveMode);
      triggerMascot('thinking', 'curieux', true);

      const effectiveKey = apiKey || (typeof window !== 'undefined' ? (localStorage.getItem('vibe_geminiApiKey') || localStorage.getItem('guest_geminiApiKey') || localStorage.getItem('vibe_todos_gemini_api_key')) : '') || '';
      const selectedModel = (typeof window !== 'undefined' ? (localStorage.getItem('vibe_todos_gemini_model') || localStorage.getItem('vibe_gemini_model')) : '') || 'gemini-3.6-flash';
      
      const qCount = exhaustiveMode ? 20 : 8;
      const effectivePrompt = (promptOverride !== undefined ? promptOverride : customPrompt).trim();

      const res = await fetch('/api/study/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          apiKey: effectiveKey,
          model: selectedModel,
          noteTitle: exhaustiveMode ? `${note.title} (Full Document Exam)` : note.title,
          noteContent: fallbackContent,
          customPrompt: effectivePrompt || undefined,
          config: { 
            questionCount: qCount, 
            scope: 'full_document',
            exhaustive: exhaustiveMode,
            customPrompt: effectivePrompt || undefined
          },
          language: locale
        })
      });
      
      const data = await res.json();
      if (!data.success) throw new Error(data.error || data.message || 'Failed to generate quiz');
      
      setQuizData(data.quiz);
      triggerMascot('orbit', 'heureux');
    } catch (err: any) {
      setError(err.message);
      triggerMascot('idle', 'triste');
    } finally {
      setLoading(false);
    }
  };

  const currentQ = quizData?.questions[currentIdx];
  const currentAnswer = currentQ ? answers[currentQ.id] : null;

  const handleMultipleChoice = (idx: number) => {
    if (!currentQ || currentAnswer) return;
    const isCorrect = idx === currentQ.correctAnswerIndex;
    
    setAnswers(prev => ({
      ...prev,
      [currentQ.id]: { isCorrect, selectedIdx: idx, feedback: currentQ.explanation }
    }));
    
    triggerMascot('bounce', isCorrect ? 'hilare' : 'triste', true);
  };

  const handleShortAnswerSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentQ || currentAnswer || isEvaluating) return;
    
    const formData = new FormData(e.currentTarget);
    const text = formData.get('answer') as string;
    if (!text.trim()) return;

    try {
      setIsEvaluating(true);
      triggerMascot('thinking', 'curieux');
      
      const res = await fetch('/api/study/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'evaluate',
          apiKey,
          question: currentQ.question,
          userAnswer: text,
          expectedAnswer: currentQ.correctAnswerText,
          noteContent: fallbackContent,
          language: locale
        })
      });
      
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Evaluation failed');
      
      const evalData = data.evaluation as EvaluationResponse;
      
      setAnswers(prev => ({
        ...prev,
        [currentQ.id]: { 
          isCorrect: evalData.isCorrect, 
          userText: text, 
          feedback: evalData.feedback 
        }
      }));
      
      triggerMascot('bounce', evalData.isCorrect ? 'hilare' : 'triste', true);
    } catch (err) {
      alert('Failed to evaluate answer');
    } finally {
      setIsEvaluating(false);
    }
  };

  const getHint = async () => {
    if (!currentQ || hint) return;
    try {
      setIsGettingHint(true);
      const res = await fetch('/api/study/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'hint',
          apiKey,
          question: currentQ.question,
          noteContent: fallbackContent,
          language: locale
        })
      });
      const data = await res.json();
      if (data.success) setHint(data.hint.hint);
    } finally {
      setIsGettingHint(false);
    }
  };

  const nextQuestion = () => {
    if (currentIdx < (quizData?.questions.length || 0) - 1) {
      setCurrentIdx(i => i + 1);
      setHint(null);
      triggerMascot('idle', 'neutre');
    } else {
      setIsFinished(true);
      triggerMascot('orbit', 'fier', true);
    }
  };

  const score = Object.values(answers).filter(a => a.isCorrect).length;
  const total = quizData?.questions.length || 0;

  if (loading) {
    return (
      <div className={`flex flex-col items-center justify-center h-full w-full p-12 ${isDark ? 'text-[var(--theme-text-primary)]' : 'text-gray-800'}`}>
        <div className="w-16 h-16 mb-6 relative">
          <Brain className="w-full h-full text-[var(--theme-primary)] animate-pulse" />
          <Sparkles className="absolute -top-2 -right-2 text-pink-500 animate-spin" size={20} />
        </div>
        <h2 className="text-xl font-bold mb-2">NotebookLM is analyzing...</h2>
        <p className="text-sm opacity-60">Generating personalized quiz for {note.title}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full p-12 text-center">
        <XCircle className="text-red-500 w-16 h-16 mb-4" />
        <h2 className="text-lg font-bold text-red-500 mb-2">Failed to Generate Quiz</h2>
        <p className="text-sm opacity-75 max-w-md mb-6">{error}</p>
        <button onClick={() => generateQuiz()} className="px-6 py-2 bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)] text-white rounded-xl font-bold transition-all">Try Again</button>
        <button onClick={onClose} className="mt-4 text-xs opacity-60">Close</button>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className={`flex flex-col items-center justify-center h-full w-full p-8 animate-in fade-in zoom-in-95 ${isDark ? 'text-[var(--theme-text-primary)]' : 'text-slate-900'}`}>
        <Award className="w-24 h-24 text-yellow-400 mb-6 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
        <h2 className="text-3xl font-black mb-2 tracking-tight">Quiz Complete!</h2>
        <p className="text-lg opacity-80 mb-8">You scored {score} out of {total}</p>
        
        <div className="flex flex-wrap gap-3 justify-center">
          <button onClick={onClose} className="px-5 py-2.5 rounded-2xl bg-[var(--theme-surface-elevated)] hover:bg-[var(--theme-surface)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] font-bold transition-all shadow-md active:scale-95 text-xs">
            Back to Note
          </button>
          <button onClick={() => generateQuiz(false)} className="px-5 py-2.5 rounded-2xl bg-[var(--theme-surface-subtle)] hover:bg-[var(--theme-surface-elevated)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] font-bold transition-all shadow-md active:scale-95 text-xs">
            Standard Quiz (8 Qs)
          </button>
          <button onClick={() => generateQuiz(true)} className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:brightness-110 text-white font-bold shadow-lg shadow-amber-500/20 active:scale-95 transition-all text-xs flex items-center gap-1.5">
            <Sparkles size={14} /> All Possible Questions (Full PDF)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full w-full relative ${isDark ? 'text-[var(--theme-text-primary)]' : 'text-slate-900'}`}>
      {/* Header */}
      <div className={`flex items-center justify-between p-4 border-b transition-colors duration-200 ${isDark ? 'border-[var(--theme-border)] bg-[var(--theme-surface-elevated)]' : 'border-gray-200'}`}>
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="flex items-center gap-2 text-sm font-semibold opacity-70 hover:opacity-100 transition-opacity">
            <ArrowLeft size={16} /> End Quiz
          </button>
          <button
            onClick={() => generateQuiz(!isExhaustiveQuiz)}
            disabled={loading}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 shadow-xs ${
              isExhaustiveQuiz
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-[var(--theme-surface-subtle)] text-[var(--theme-text-muted)] border-[var(--theme-border)] hover:text-white'
            }`}
            title="Toggle between standard and exhaustive full-PDF quiz mode"
          >
            <Sparkles size={12} className={isExhaustiveQuiz ? 'text-amber-400' : ''} />
            <span>{isExhaustiveQuiz ? 'All Qs Mode (20 Qs)' : 'All Questions in Full PDF'}</span>
          </button>
          <button
            onClick={() => setShowPromptInput(prev => !prev)}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 shadow-xs ${
              showPromptInput || customPrompt
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                : 'bg-[var(--theme-surface-subtle)] text-[var(--theme-text-muted)] border-[var(--theme-border)] hover:text-white'
            }`}
            title="Prompt custom focus or specific rules into the exam"
          >
            <Sparkles size={12} className="text-purple-400" />
            <span>{customPrompt ? 'Prompt Active' : 'Prompt Focus'}</span>
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {quizData?.questions.map((_, i) => (
              <div key={i} className={`w-8 h-1.5 rounded-full transition-colors duration-200 ${i === currentIdx ? 'bg-[var(--theme-primary)]' : i < currentIdx ? (answers[quizData.questions[i].id]?.isCorrect ? 'bg-green-500' : 'bg-red-500') : isDark ? 'bg-[var(--theme-surface-subtle)]' : 'bg-gray-200'}`} />
            ))}
          </div>
          <span className="text-xs font-bold opacity-50">{currentIdx + 1}/{total}</span>
        </div>
      </div>

      {/* Expandable Custom Exam Prompt Bar */}
      {showPromptInput && (
        <div className="p-3 border-b border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-150">
          <Sparkles size={14} className="text-amber-400 shrink-0" />
          <input
            dir="auto"
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                generateQuiz(isExhaustiveQuiz, customPrompt);
              }
            }}
            placeholder={locale === 'ar' ? 'اكتب توجيه محدد للاختبار (مثال: ركّز على قاعدة التمييز وحذف حرف العلة، أسئلة صعبة...)' : 'Prompt specific focus into exam (e.g. Focus on distinction rules, tricky cases, formulas...)'}
            className="flex-1 px-3 py-1.5 rounded-xl bg-[var(--theme-surface)] border border-[var(--theme-border)] text-xs text-white placeholder:text-zinc-500 outline-none focus:border-amber-400/50"
          />
          <button
            onClick={() => generateQuiz(isExhaustiveQuiz, customPrompt)}
            disabled={loading}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:brightness-110 text-white font-bold text-xs shadow-md transition-all active:scale-95"
          >
            Apply & Retake
          </button>
        </div>
      )}

      {/* Main Question Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 flex flex-col max-w-4xl mx-auto w-full">
        {currentQ && (
          <div className="animate-in slide-in-from-right-8 fade-in duration-300">
            {/* Question Badge */}
            <div className="flex items-center justify-between mb-4">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${isDark ? 'bg-[var(--theme-border-subtle)] text-[var(--theme-primary)]' : 'bg-purple-100 text-purple-700'}`}>
                {currentQ.type.replace('_', ' ')}
              </span>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${currentQ.difficulty === 'hard' ? 'text-red-400 bg-red-400/10' : currentQ.difficulty === 'medium' ? 'text-amber-400 bg-amber-400/10' : 'text-green-400 bg-green-400/10'}`}>
                {currentQ.difficulty}
              </span>
            </div>

            {/* Question Text */}
            <div dir="auto" className="text-2xl md:text-3xl font-bold leading-snug mb-8 text-start [unicode-bidi:plaintext]">
              <StudyMarkdownRenderer content={currentQ.question} />
            </div>

            {/* Options or Text Input */}
            <div className="space-y-4" dir="auto">
              {currentQ.type === 'multiple_choice' || currentQ.type === 'true_false' ? (
                currentQ.options?.map((opt, idx) => {
                  const isSelected = currentAnswer?.selectedIdx === idx;
                  const isCorrectAnswer = currentQ.correctAnswerIndex === idx;
                  
                  let stateClass = isDark ? 'bg-[var(--theme-surface-subtle)] hover:bg-[var(--theme-surface-elevated)] border-[var(--theme-border-subtle)] hover:border-[var(--theme-border)] text-[var(--theme-text-primary)]' : 'bg-gray-50 hover:bg-gray-100 border-transparent';
                  
                  if (currentAnswer) {
                    if (isCorrectAnswer) stateClass = 'bg-green-500/20 border-green-500 text-green-700 dark:text-green-300';
                    else if (isSelected && !currentAnswer.isCorrect) stateClass = 'bg-red-500/20 border-red-500 text-red-700 dark:text-red-300';
                    else stateClass = 'opacity-40 grayscale';
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleMultipleChoice(idx)}
                      disabled={!!currentAnswer}
                      dir="auto"
                      className={`w-full text-start p-5 rounded-2xl border-2 transition-all font-medium text-sm md:text-base flex items-center justify-between gap-3 ${stateClass}`}
                    >
                      <div className="flex-1 min-w-0 [unicode-bidi:isolate] text-start" dir="auto">
                        <StudyMarkdownRenderer content={opt} />
                      </div>
                      {currentAnswer && isCorrectAnswer && <CheckCircle2 className="text-green-500 shrink-0" />}
                      {currentAnswer && isSelected && !currentAnswer.isCorrect && <XCircle className="text-red-500 shrink-0" />}
                    </button>
                  );
                })
              ) : (
                <form onSubmit={handleShortAnswerSubmit} className="space-y-4">
                  <textarea
                    name="answer"
                    placeholder="Type your answer here..."
                    disabled={!!currentAnswer || isEvaluating}
                    className={`w-full p-5 rounded-2xl border-2 min-h-[120px] resize-none outline-none transition-all ${isDark ? 'bg-[var(--theme-surface-subtle)] border-[var(--theme-border)] text-[var(--theme-text-primary)] placeholder:[var(--theme-text-muted)] focus:border-[var(--theme-primary)]' : 'bg-gray-50 border-gray-200 focus:border-purple-500'}`}
                  />
                  {!currentAnswer && (
                    <button 
                      type="submit" 
                      disabled={isEvaluating}
                      className="px-6 py-3 bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)] text-white font-bold rounded-xl flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 shadow-md"
                    >
                      {isEvaluating ? <Loader2 className="animate-spin" size={18} /> : <Brain size={18} />}
                      {t('submitAnswer')}
                    </button>
                  )}
                </form>
              )}
            </div>

            {/* Hint Button */}
            {!currentAnswer && !hint && (
              <div className="mt-8">
                <button onClick={getHint} disabled={isGettingHint} className="text-xs font-semibold text-[var(--theme-primary)] flex items-center gap-1.5 opacity-75 hover:opacity-100 transition-opacity">
                  {isGettingHint ? <Loader2 size={14} className="animate-spin" /> : <Lightbulb size={14} />}
                  {t('needHint')}
                </button>
              </div>
            )}

            {/* Hint Display */}
            {hint && !currentAnswer && (
              <div className={`mt-6 p-4 rounded-xl border border-dashed ${isDark ? 'bg-amber-950/20 border-amber-500/30 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                <div className="flex items-center gap-2 mb-2 font-bold text-xs uppercase tracking-wider">
                  <Lightbulb size={14} /> {t('bloubHint')}
                </div>
                <p className="text-sm font-medium">{hint}</p>
              </div>
            )}

            {/* Feedback & Next Button */}
            {currentAnswer && (
              <div className={`mt-8 p-6 rounded-2xl border animate-in slide-in-from-bottom-4 ${currentAnswer.isCorrect ? (isDark ? 'bg-green-950/30 border-green-500/30 text-green-100' : 'bg-green-50 border-green-200 text-green-900') : (isDark ? 'bg-red-950/30 border-red-500/30 text-red-100' : 'bg-red-50 border-red-200 text-red-900')}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className={`text-lg font-bold mb-2 flex items-center gap-2 ${currentAnswer.isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                      {currentAnswer.isCorrect ? <CheckCircle2 /> : <XCircle />}
                      {currentAnswer.isCorrect ? (locale === 'ar' ? 'إجابة صحيحة!' : 'Correct!') : (locale === 'ar' ? 'ليست دقيقة تماماً' : 'Not quite right.')}
                    </h4>
                    <div dir="auto" className="text-sm leading-relaxed opacity-90 text-start [unicode-bidi:plaintext]">
                      <StudyMarkdownRenderer content={currentAnswer.feedback || ''} />
                    </div>
                  </div>
                  <button onClick={nextQuestion} className={`flex items-center gap-1 px-5 py-2.5 rounded-xl font-bold transition-all active:scale-95 whitespace-nowrap ${currentAnswer.isCorrect ? 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-600/20' : 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20'}`}>
                    {currentIdx === total - 1 ? (locale === 'ar' ? 'إنهاء' : 'Finish') : t('nextQuestion')} <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
            
            {/* Source Citation */}
            <div className="mt-8 pt-6 border-t border-dashed opacity-50 flex justify-end">
               <span className="text-[10px] font-mono">Source: {currentQ.sourceCitation}</span>
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
}
