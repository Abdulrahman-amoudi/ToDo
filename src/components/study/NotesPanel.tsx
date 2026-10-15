'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  PenTool, 
  BookOpen, 
  Highlighter, 
  Sparkles, 
  PanelRightClose,
  PanelRightOpen,
  Send,
  Bot,
  Copy,
  Check,
  HelpCircle,
  RotateCcw,
  Plus,
  CheckCircle2,
  AlertCircle,
  FileText,
  Zap,
  Lightbulb,
  Search,
  Award,
  ArrowRight,
  Workflow,
  ScrollText,
  Image as ImageIcon
} from 'lucide-react';
import type { QuizResponse } from '@/types/quiz';
import { StudyMarkdownRenderer } from './StudyMarkdownRenderer';
import { BloubMascot } from '@/components/BloubMascot';

export interface NoteData {
  text: string;
  lang: 'en' | 'ar';
}

export type NotesPanelState = 'expanded' | 'rail' | 'drawer';
export type PanelTab = 'ai' | 'notes' | 'quiz';

export interface NotesPanelProps {
  pageNumber: number;
  notesWidth: number;
  docId?: string;
  docTitle?: string;
  documentContent?: string;
  pageContent?: string;
  apiKey?: string;
  isDark?: boolean;
  initialNote?: NoteData;
  initialTab?: PanelTab;
  onChange: (pageNumber: number, note: NoteData) => void;
  onDirty?: () => void;
  panelMode?: NotesPanelState;
  onToggleMode?: (mode: NotesPanelState) => void;
  onSelectNote?: (pageNumber: number) => void;
  onOpenChapters?: () => void;
  onOpenAnnotations?: () => void;
  onOpenAiSummary?: () => void;
  onClose?: () => void;
  triggerMascot?: (action: any, expression?: any, temp?: boolean) => void;
  isBookMinimized?: boolean;
  onToggleBook?: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  citations?: string[];
  grounded?: boolean;
  timestamp: number;
}

export const NotesPanel = React.memo(function NotesPanel({
  pageNumber,
  notesWidth,
  docId = 'doc',
  docTitle = 'Study Document',
  documentContent = '',
  pageContent = '',
  apiKey = '',
  isDark = true,
  initialNote,
  initialTab,
  onChange,
  onDirty,
  panelMode = 'expanded',
  onToggleMode,
  onSelectNote,
  onOpenChapters,
  onOpenAnnotations,
  onOpenAiSummary,
  onClose,
  triggerMascot,
  isBookMinimized = false,
  onToggleBook
}: NotesPanelProps) {
  const getDraftKey = useCallback((pg: number) => `note_draft_${docId}_${pg}`, [docId]);

  const [activeTab, setActiveTab] = useState<PanelTab>(initialTab || 'ai');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [localNote, setLocalNote] = useState<NoteData>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(`note_draft_${docId}_${pageNumber}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed.text === 'string' && parsed.text.length > 0) {
            return { text: parsed.text, lang: parsed.lang || 'en' };
          }
        }
      } catch {}
    }
    return initialNote || { text: '', lang: 'en' };
  });

  const [panelState, setPanelState] = useState<NotesPanelState>(panelMode);
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // AI Chat State: start clean so Hero Welcome Canvas renders when empty
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [queryInput, setQueryInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [lastFailedRequest, setLastFailedRequest] = useState<{
    prompt?: string;
    actionType: 'ask' | 'summarize';
    summaryMode?: string;
  } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // In-Panel Quiz State
  const [quizData, setQuizData] = useState<QuizResponse | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, { isCorrect: boolean; selectedIdx: number; feedback: string }>>({});
  const [quizCurrentIdx, setQuizCurrentIdx] = useState(0);
  const [quizQuestionCount, setQuizQuestionCount] = useState<number>(8);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const saveStatusTimerRef = useRef<NodeJS.Timeout | null>(null);
  const localNoteRef = useRef<NoteData>(localNote);
  localNoteRef.current = localNote;
  const currentPageRef = useRef<number>(pageNumber);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onDirtyRef = useRef(onDirty);
  onDirtyRef.current = onDirty;

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiLoading]);

  // Track responsive screen size for auto-hide drawer
  useEffect(() => {
    const checkViewport = () => {
      const isNarrow = window.innerWidth < 1024;
      setIsMobileOrTablet(isNarrow);
      if (isNarrow && panelState === 'expanded' && !panelMode) {
        setPanelState('rail');
      }
    };
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, [panelMode, panelState]);

  useEffect(() => {
    if (panelMode) {
      setPanelState(panelMode);
    }
  }, [panelMode]);

  const updatePanelState = (newState: NotesPanelState) => {
    setPanelState(newState);
    onToggleMode?.(newState);
  };

  const flushSync = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    const currentData = localNoteRef.current;
    try {
      localStorage.setItem(getDraftKey(currentPageRef.current), JSON.stringify({
        text: currentData.text,
        lang: currentData.lang,
        timestamp: Date.now()
      }));
    } catch {}
    onChangeRef.current(currentPageRef.current, currentData);
  }, [getDraftKey]);

  useEffect(() => {
    if (currentPageRef.current !== pageNumber) {
      flushSync();
      currentPageRef.current = pageNumber;
      let nextNote: NoteData = { text: '', lang: 'en' };
      try {
        const raw = localStorage.getItem(getDraftKey(pageNumber));
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed.text === 'string' && parsed.text.length > 0) {
            nextNote = { text: parsed.text, lang: parsed.lang || 'en' };
          }
        }
      } catch {}

      if (!nextNote.text && initialNote) {
        nextNote = initialNote;
      }

      setLocalNote(nextNote);
      localNoteRef.current = nextNote;
    }
  }, [pageNumber, flushSync, getDraftKey, initialNote]);

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    const updated: NoteData = { ...localNoteRef.current, text: newText };
    setLocalNote(updated);
    localNoteRef.current = updated;

    try {
      localStorage.setItem(getDraftKey(currentPageRef.current), JSON.stringify({
        text: newText,
        lang: updated.lang,
        timestamp: Date.now()
      }));
    } catch {}

    onDirtyRef.current?.();
    setSaveStatus('saving');

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      onChangeRef.current(currentPageRef.current, updated);
      setSaveStatus('saved');
      if (saveStatusTimerRef.current) clearTimeout(saveStatusTimerRef.current);
      saveStatusTimerRef.current = setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    }, 500);
  }, [getDraftKey]);

  const handleLangChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value as 'en' | 'ar';
    const updated: NoteData = { ...localNoteRef.current, lang: newLang };
    setLocalNote(updated);
    localNoteRef.current = updated;

    try {
      localStorage.setItem(getDraftKey(currentPageRef.current), JSON.stringify({
        text: updated.text,
        lang: newLang,
        timestamp: Date.now()
      }));
    } catch {}

    onDirtyRef.current?.();
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    onChangeRef.current(currentPageRef.current, updated);
  }, [getDraftKey]);

  // AI Chat & Action Dispatcher
  const handleAskAi = async (overridePrompt?: string, actionType: 'ask' | 'summarize' = 'ask', summaryMode?: string) => {
    const q = (overridePrompt || queryInput).trim();
    if (!q && actionType === 'ask') return;

    if (actionType === 'ask') {
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        text: q,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, userMsg]);
      setQueryInput('');
    }

    setIsAiLoading(true);
    setAiError(null);
    triggerMascot?.('thinking', 'curieux', true);

    try {
      const res = await fetch('/api/study/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          action: actionType,
          model: 'gemini-3.8-flash',
          question: q,
          documentTitle: docTitle,
          documentContent,
          pageNumber,
          pageContent,
          mode: summaryMode || 'summary',
          chatHistory: messages.map(m => ({ role: m.role, text: m.text }))
        })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || data.error || 'Failed to generate AI response');
      }

      let responseText = '';
      let citations: string[] = [];
      let isGrounded = true;

      if (actionType === 'summarize') {
        const s = data.data;
        responseText = `### ${s.title || 'Summary'}\n\n${s.summary}\n\n#### Key Takeaways:\n` +
          (s.keyPoints || []).map((kp: string) => `- ${kp}`).join('\n');
        if (s.concepts && s.concepts.length > 0) {
          responseText += '\n\n#### Core Concepts:\n' + s.concepts.map((c: any) => `- **${c.term}**: ${c.definition}`).join('\n');
        }
        citations = [`Page ${pageNumber}`];
      } else {
        responseText = data.answer;
        citations = data.citations || [];
        isGrounded = data.grounded ?? true;
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        text: responseText,
        citations,
        grounded: isGrounded,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, botMsg]);
      setLastFailedRequest(null);
      triggerMascot?.('orbit', 'heureux');
    } catch (err: any) {
      setLastFailedRequest({ prompt: q, actionType, summaryMode });
      setAiError(err.message || 'Error communicating with Gemini 3.8 Flash.');
      triggerMascot?.('idle', 'triste');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Generate In-Panel Quiz
  const handleGenerateInPanelQuiz = async () => {
    setQuizLoading(true);
    setQuizError(null);
    setQuizAnswers({});
    setQuizCurrentIdx(0);
    triggerMascot?.('thinking', 'curieux', true);

    try {
      const noteContentForQuiz = pageContent.trim() ? `[Page ${pageNumber} Content]:\n${pageContent}` : documentContent;
      const res = await fetch('/api/study/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          apiKey,
          model: 'gemini-3.8-flash',
          noteTitle: `${docTitle} (Pg. ${pageNumber})`,
          noteContent: noteContentForQuiz || 'Study document content',
          config: { questionCount: quizQuestionCount || 8, difficulty: 'medium' }
        })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || data.error || 'Failed to generate quiz');
      }

      setQuizData(data.quiz);
      triggerMascot?.('orbit', 'heureux');
    } catch (err: any) {
      setQuizError(err.message || 'Failed to create quiz with Gemini 3.8 Flash.');
      triggerMascot?.('idle', 'triste');
    } finally {
      setQuizLoading(false);
    }
  };

  const handleQuizAnswer = (qId: string, idx: number, correctIdx: number, explanation: string) => {
    if (quizAnswers[qId]) return;
    const isCorrect = idx === correctIdx;
    setQuizAnswers(prev => ({
      ...prev,
      [qId]: { isCorrect, selectedIdx: idx, feedback: explanation }
    }));
    triggerMascot?.('bounce', isCorrect ? 'hilare' : 'triste', true);
  };

  const handleAppendToNotes = (text: string) => {
    const cleanAppend = text.replace(/###/g, '').trim();
    const updatedText = localNote.text ? `${localNote.text}\n\n---\n${cleanAppend}` : cleanAppend;
    const updated: NoteData = { ...localNote, text: updatedText };
    setLocalNote(updated);
    localNoteRef.current = updated;
    onChange(pageNumber, updated);
    setActiveTab('notes');
  };

  const clampedWidth = Math.max(280, Math.min(notesWidth || 450, 680));
  const hasPageNotes = localNote.text.trim().length > 0;

  // COMPACT RAIL VIEW
  if (panelState === 'rail') {
    return (
      <div
        className={`w-12 flex-shrink-0 h-full border-l flex flex-col items-center py-4 justify-between transition-all duration-200 z-10 ${
          isDark
            ? 'border-[var(--theme-border)] bg-[var(--theme-surface)] backdrop-blur-xl'
            : 'border-gray-200 bg-[#fffdf5]'
        }`}
        data-spatial-container="notes-rail"
      >
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => updatePanelState(isMobileOrTablet ? 'drawer' : 'expanded')}
            className={`min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl transition-all active:scale-[0.98] ${
              isDark
                ? 'text-[var(--theme-primary)] hover:bg-[var(--theme-surface-elevated)] hover:text-white'
                : 'text-blue-600 hover:bg-blue-100'
            }`}
            title="Expand AI & Notebook Studio"
            aria-label="Expand Notes"
          >
            <PanelRightOpen size={18} />
          </button>

          <div className="flex flex-col items-center text-[10px] font-mono font-bold tracking-tighter text-[var(--theme-text-muted)]">
            <span>P.{pageNumber}</span>
            {hasPageNotes && (
              <span className="w-2 h-2 rounded-full mt-1 bg-[var(--theme-primary)] shadow-sm animate-pulse" title="Notes on this page" />
            )}
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('ai');
              updatePanelState(isMobileOrTablet ? 'drawer' : 'expanded');
            }}
            className={`min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl transition-all active:scale-[0.98] ${
              activeTab === 'ai' ? 'bg-[var(--theme-primary)]/20 text-[var(--theme-primary)] border border-[var(--theme-primary)]/30' : 'text-[var(--theme-text-muted)] hover:text-white hover:bg-[var(--theme-surface-elevated)]'
            }`}
            title="Gemini 3.8 Flash AI Studio"
          >
            <Sparkles size={16} />
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('notes');
              updatePanelState(isMobileOrTablet ? 'drawer' : 'expanded');
            }}
            className={`min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl transition-all active:scale-[0.98] ${
              activeTab === 'notes' ? 'bg-[var(--theme-primary)]/20 text-[var(--theme-primary)] border border-[var(--theme-primary)]/30' : 'text-[var(--theme-text-muted)] hover:text-white hover:bg-[var(--theme-surface-elevated)]'
            }`}
            title="Page Notes"
          >
            <PenTool size={16} />
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('quiz');
              updatePanelState(isMobileOrTablet ? 'drawer' : 'expanded');
            }}
            className={`min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl transition-all active:scale-[0.98] ${
              activeTab === 'quiz' ? 'bg-[var(--theme-primary)]/20 text-[var(--theme-primary)] border border-[var(--theme-primary)]/30' : 'text-[var(--theme-text-muted)] hover:text-white hover:bg-[var(--theme-surface-elevated)]'
            }`}
            title="Mastery Quiz"
          >
            <HelpCircle size={16} />
          </button>
        </div>

        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => updatePanelState(isMobileOrTablet ? 'drawer' : 'expanded')}
            className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border border-[var(--theme-border)] text-[var(--theme-text-secondary)]"
          >
            {localNote.lang === 'ar' ? 'ع' : 'En'}
          </button>
        </div>
      </div>
    );
  }

  // Common Header & Segmented Switcher
  const panelHeader = (
    <div className={`p-3 border-b flex flex-col gap-2.5 shrink-0 ${
      isDark ? 'border-[var(--theme-border)] bg-[var(--theme-surface-elevated)]/90 backdrop-blur-xl' : 'border-gray-200 bg-white'
    }`}>
      {/* Top row: Page title, collapse, and status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg bg-[var(--theme-primary,#6366f1)]/15 text-[var(--theme-primary,#818cf8)] border border-[var(--theme-primary,#6366f1)]/25 flex items-center gap-1.5">
            <Sparkles size={11} className="text-[var(--theme-primary,#818cf8)]" /> Gemini 3.8 Flash
          </span>
          <span className="text-xs font-mono font-semibold text-[var(--theme-text-muted)]">
            Pg. {pageNumber}
          </span>
          {onToggleBook && (
            <button
              type="button"
              onClick={onToggleBook}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all active:scale-95 ${
                isBookMinimized
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-[var(--theme-surface-subtle)] text-[var(--theme-text-secondary)] hover:text-white border border-[var(--theme-border)]'
              }`}
              title={isBookMinimized ? "Restore split view with book" : "Minimize book to focus on study notes"}
            >
              <BookOpen size={11} />
              <span>{isBookMinimized ? "Show Book" : "Minimize Book"}</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {activeTab === 'notes' && (
            <select
              value={localNote.lang}
              onChange={handleLangChange}
              className={`text-[11px] px-2.5 py-1 rounded-xl border outline-none cursor-pointer transition-colors ${
                isDark
                  ? 'bg-[var(--theme-surface-subtle)] border-[var(--theme-border)] text-[var(--theme-text-secondary)]'
                  : 'bg-gray-50 border-gray-200 text-gray-700'
              }`}
            >
              <option value="en">English</option>
              <option value="ar">عربي</option>
            </select>
          )}

          <button
            type="button"
            onClick={() => {
              if (onClose) onClose();
              else updatePanelState('rail');
            }}
            className="p-1.5 rounded-xl text-[var(--theme-text-muted)] hover:text-white hover:bg-[var(--theme-surface-subtle)] active:scale-95 transition-all"
            title="Collapse Panel"
          >
            <PanelRightClose size={16} />
          </button>
        </div>
      </div>

      {/* Segmented Control Bar */}
      <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-[var(--theme-surface-subtle)] border border-[var(--theme-border)]/60 text-xs font-semibold backdrop-blur-md">
        <button
          type="button"
          onClick={() => setActiveTab('ai')}
          className={`py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all duration-150 ${
            activeTab === 'ai'
              ? 'bg-[var(--theme-primary,#6366f1)] text-white shadow-md font-bold'
              : 'text-[var(--theme-text-muted)] hover:text-white hover:bg-[var(--theme-surface-elevated)]'
          }`}
        >
          <Sparkles size={13} className={activeTab === 'ai' ? 'text-white' : 'text-[var(--theme-text-muted)]'} />
          <span>Gemini AI</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('notes')}
          className={`py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all duration-150 relative ${
            activeTab === 'notes'
              ? 'bg-[var(--theme-primary,#6366f1)] text-white shadow-md font-bold'
              : 'text-[var(--theme-text-muted)] hover:text-white hover:bg-[var(--theme-surface-elevated)]'
          }`}
        >
          <PenTool size={13} className={activeTab === 'notes' ? 'text-white' : 'text-[var(--theme-text-muted)]'} />
          <span>Notes</span>
          {hasPageNotes && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('quiz')}
          className={`py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all duration-150 ${
            activeTab === 'quiz'
              ? 'bg-[var(--theme-primary,#6366f1)] text-white shadow-md font-bold'
              : 'text-[var(--theme-text-muted)] hover:text-white hover:bg-[var(--theme-surface-elevated)]'
          }`}
        >
          <HelpCircle size={13} className={activeTab === 'quiz' ? 'text-white' : 'text-[var(--theme-text-muted)]'} />
          <span>Quiz</span>
        </button>
      </div>
    </div>
  );

  // TAB 1: GEMINI 3.8 AI CHAT
  const renderAiStudio = () => (
    <div className="flex flex-col flex-1 h-full min-h-0 overflow-hidden relative bg-[var(--theme-surface)]">
      {/* Dynamic Theme-Reactive Background Ambient Glow */}
      <div className="absolute inset-0 pointer-events-none transition-all duration-700 ease-out z-0 overflow-hidden" aria-hidden="true">
        <div 
          className="absolute -top-16 left-1/2 -translate-x-1/2 w-[440px] h-[360px] rounded-full blur-[110px] opacity-40 transition-all duration-700" 
          style={{ background: 'radial-gradient(circle, var(--theme-primary, #6366f1) 0%, transparent 70%)' }} 
        />
        <div 
          className="absolute top-1/2 -right-16 w-[300px] h-[300px] rounded-full blur-[100px] opacity-30 transition-all duration-700" 
          style={{ background: 'radial-gradient(circle, var(--theme-accent, var(--theme-primary, #6366f1)) 0%, transparent 70%)' }} 
        />
      </div>

      {/* Quick Prompt Chips Bar */}
      <div className="p-2.5 border-b border-[var(--theme-border)] flex items-center gap-2 overflow-x-auto hide-scrollbar shrink-0 bg-[var(--theme-surface-elevated)]/60 backdrop-blur-md relative z-10">
        <button
          type="button"
          onClick={() => handleAskAi(`Build a Visual Concept Tree and Step-by-Step Study Roadmap for Page ${pageNumber}. Break down: 1) What foundational concepts to start with first, 2) Core mechanisms, rules, or formulas to learn, 3) Mastery summary and connection nodes. Format with visual node branches, flow arrows, and hierarchy.`, 'ask')}
          disabled={isAiLoading}
          className="px-3 py-1.5 rounded-full text-[11px] font-semibold bg-[var(--theme-surface-subtle)] hover:bg-[var(--theme-surface-elevated)] border border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:text-white transition-all shrink-0 active:scale-95 disabled:opacity-40 shadow-xs flex items-center gap-1.5"
        >
          <Workflow size={12} className="text-purple-400" />
          <span>Concept Tree</span>
        </button>
        <button
          type="button"
          onClick={() => handleAskAi(`Transform the events, concepts, and people on Page ${pageNumber} into a vivid, memorable story narrative. Make it engaging, historically contextual, and easy to retain for exams while remaining 100% grounded in the text.`, 'ask')}
          disabled={isAiLoading}
          className="px-3 py-1.5 rounded-full text-[11px] font-semibold bg-[var(--theme-surface-subtle)] hover:bg-[var(--theme-surface-elevated)] border border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:text-white transition-all shrink-0 active:scale-95 disabled:opacity-40 shadow-xs flex items-center gap-1.5"
        >
          <ScrollText size={12} className="text-amber-400" />
          <span>Story Mode</span>
        </button>
        <button
          type="button"
          onClick={() => handleAskAi(`Summarize page ${pageNumber} of this document with key takeaways and definitions.`, 'summarize')}
          disabled={isAiLoading}
          className="px-3 py-1.5 rounded-full text-[11px] font-semibold bg-[var(--theme-surface-subtle)] hover:bg-[var(--theme-surface-elevated)] border border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:text-white transition-all shrink-0 active:scale-95 disabled:opacity-40 shadow-xs flex items-center gap-1.5"
        >
          <Zap size={12} className="text-sky-400" />
          <span>Summarize Page</span>
        </button>
        <button
          type="button"
          onClick={() => handleAskAi(`Extract key takeaways from page ${pageNumber}.`, 'summarize', 'key_takeaways')}
          disabled={isAiLoading}
          className="px-3 py-1.5 rounded-full text-[11px] font-semibold bg-[var(--theme-surface-subtle)] hover:bg-[var(--theme-surface-elevated)] border border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:text-white transition-all shrink-0 active:scale-95 disabled:opacity-40 shadow-xs flex items-center gap-1.5"
        >
          <Lightbulb size={12} className="text-yellow-400" />
          <span>Key Takeaways</span>
        </button>
        <button
          type="button"
          onClick={() => handleAskAi(`Explain the core concept or formula on page ${pageNumber} simply with practical examples.`, 'ask')}
          disabled={isAiLoading}
          className="px-3 py-1.5 rounded-full text-[11px] font-semibold bg-[var(--theme-surface-subtle)] hover:bg-[var(--theme-surface-elevated)] border border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:text-white transition-all shrink-0 active:scale-95 disabled:opacity-40 shadow-xs flex items-center gap-1.5"
        >
          <Search size={12} className="text-emerald-400" />
          <span>Explain Concepts</span>
        </button>
      </div>

      {/* Messages Thread or Hero Welcome Canvas */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar relative z-10">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[460px] h-full text-center p-3 sm:p-5 space-y-6 animate-in fade-in duration-300">
            {/* Mascot with Glowing Theme Aura */}
            <div className="relative group select-none">
              <div 
                className="absolute inset-0 rounded-full blur-2xl opacity-50 scale-125 transition-all duration-700 pointer-events-none"
                style={{ background: 'radial-gradient(circle, var(--theme-primary, #6366f1) 0%, transparent 70%)' }}
              />
              <div 
                className="relative z-10 transition-transform duration-300 group-hover:scale-105 active:scale-95 cursor-pointer" 
                onClick={() => triggerMascot?.('bounce', 'heureux', true)}
                title="Tap Mascot"
              >
                <BloubMascot size={72} state="idle" expression="curieux" isStatic={false} />
              </div>
            </div>

            {/* Header / Intro */}
            <div className="space-y-1.5 max-w-sm">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[var(--theme-primary)]/15 text-[var(--theme-primary)] border border-[var(--theme-primary)]/30">
                <Sparkles size={11} />
                <span>Gemini 3.8 Flash • Study Studio</span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                What would you like to master on Pg. {pageNumber}?
              </h3>
              <p className="text-xs text-[var(--theme-text-muted)] leading-relaxed">
                Grounded 100% in this document. Ask questions, construct concept trees, or turn lessons into stories.
              </p>
            </div>

            {/* 4 Rich Starter Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-md pt-1 text-left">
              <button
                type="button"
                onClick={() => handleAskAi(`Build a Visual Concept Tree and Step-by-Step Study Roadmap for Page ${pageNumber}. Break down: 1) What foundational concepts to start with first, 2) Core mechanisms, rules, or formulas to learn, 3) Mastery summary and connection nodes. Format with visual node branches, flow arrows, and hierarchy.`, 'ask')}
                disabled={isAiLoading}
                className="p-3.5 rounded-2xl bg-[var(--theme-surface-elevated)]/85 hover:bg-[var(--theme-surface-elevated)] border border-[var(--theme-border)] hover:border-[var(--theme-primary)]/50 transition-all active:scale-[0.98] group flex flex-col gap-2 shadow-sm text-start"
              >
                <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                  <Workflow size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-[var(--theme-primary)] transition-colors">Concept Map Tree</h4>
                  <p className="text-[11px] text-[var(--theme-text-muted)] leading-snug mt-0.5">Visual roadmap of what concepts to start with first</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleAskAi(`Transform the events, concepts, and people on Page ${pageNumber} into a vivid, memorable story narrative. Make it engaging, historically contextual, and easy to retain for exams while remaining 100% grounded in the text.`, 'ask')}
                disabled={isAiLoading}
                className="p-3.5 rounded-2xl bg-[var(--theme-surface-elevated)]/85 hover:bg-[var(--theme-surface-elevated)] border border-[var(--theme-border)] hover:border-[var(--theme-primary)]/50 transition-all active:scale-[0.98] group flex flex-col gap-2 shadow-sm text-start"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                  <ScrollText size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">Storytelling Mode</h4>
                  <p className="text-[11px] text-[var(--theme-text-muted)] leading-snug mt-0.5">Turn historical events & facts into a vivid tale</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleAskAi(`Summarize page ${pageNumber} of this document with key takeaways and definitions.`, 'summarize')}
                disabled={isAiLoading}
                className="p-3.5 rounded-2xl bg-[var(--theme-surface-elevated)]/85 hover:bg-[var(--theme-surface-elevated)] border border-[var(--theme-border)] hover:border-[var(--theme-primary)]/50 transition-all active:scale-[0.98] group flex flex-col gap-2 shadow-sm text-start"
              >
                <div className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform">
                  <Zap size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-sky-300 transition-colors">Summarize Page</h4>
                  <p className="text-[11px] text-[var(--theme-text-muted)] leading-snug mt-0.5">Extract core takeaways and main bullet points</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleAskAi(`Explain the core concept or formula on page ${pageNumber} simply with practical examples.`, 'ask')}
                disabled={isAiLoading}
                className="p-3.5 rounded-2xl bg-[var(--theme-surface-elevated)]/85 hover:bg-[var(--theme-surface-elevated)] border border-[var(--theme-border)] hover:border-[var(--theme-primary)]/50 transition-all active:scale-[0.98] group flex flex-col gap-2 shadow-sm text-start"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                  <Search size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">Formulas & Concepts</h4>
                  <p className="text-[11px] text-[var(--theme-text-muted)] leading-snug mt-0.5">Break down equations, terms, and scientific laws</p>
                </div>
              </button>
            </div>
          </div>
        ) : (
          messages.map(msg => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-1 duration-150`}
            >
              {msg.role === 'user' ? (
                <div className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-2.5 text-xs font-medium leading-relaxed bg-[var(--theme-primary,#6366f1)]/20 border border-[var(--theme-primary,#6366f1)]/40 text-white shadow-sm">
                  <p dir="auto">{msg.text}</p>
                </div>
              ) : (
                <div className="w-full rounded-2xl rounded-tl-sm p-4 text-xs leading-relaxed bg-[var(--theme-surface-elevated)]/90 border border-[var(--theme-border)] backdrop-blur-xl text-[var(--theme-text-primary)] shadow-xl space-y-3">
                  {/* Identity header */}
                  <div className="flex items-center justify-between pb-2 border-b border-[var(--theme-border)] text-[10px] text-[var(--theme-text-muted)] select-none">
                    <div className="flex items-center gap-1.5 font-bold tracking-tight text-[var(--theme-primary,#818cf8)]">
                      <Sparkles size={11} />
                      <span>NotebookLM • Gemini 3.8 Flash</span>
                    </div>
                    {msg.grounded && (
                      <span className="flex items-center gap-1 text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        <CheckCircle2 size={10} /> 100% Grounded
                      </span>
                    )}
                  </div>

                  {/* Rich Formatted Markdown with Arabic BiDi support */}
                  <StudyMarkdownRenderer content={msg.text} />

                  {/* Footer with citations and actions */}
                  <div className="pt-2 border-t border-[var(--theme-border)] flex items-center justify-between text-[11px] text-[var(--theme-text-muted)]">
                    <div className="flex items-center gap-1.5">
                      {msg.citations && msg.citations.length > 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-[var(--theme-surface-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-secondary)] font-mono text-[10px]">
                          {msg.citations.join(', ')}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleAppendToNotes(msg.text)}
                        className="hover:text-white px-2.5 py-1 rounded-lg bg-[var(--theme-surface-subtle)] hover:bg-[var(--theme-surface-elevated)] border border-[var(--theme-border)] flex items-center gap-1 transition-all active:scale-95"
                        title="Append to Page Notes"
                      >
                        <Plus size={11} /> Add to Notes
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(msg.text);
                          setCopiedId(msg.id);
                          setTimeout(() => setCopiedId(null), 2000);
                        }}
                        className="hover:text-white p-1.5 rounded-lg bg-[var(--theme-surface-subtle)] hover:bg-[var(--theme-surface-elevated)] border border-[var(--theme-border)] flex items-center gap-1 transition-all active:scale-95"
                        title="Copy response"
                      >
                        {copiedId === msg.id ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}

        {isAiLoading && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-[var(--theme-surface-elevated)]/90 border border-[var(--theme-border)] text-xs text-[var(--theme-text-primary)] w-fit animate-pulse backdrop-blur-md shadow-lg">
            <Sparkles size={13} className="text-[var(--theme-primary)] animate-spin" />
            <span>Gemini 3.8 Flash formulating response...</span>
          </div>
        )}

        {aiError && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-xs flex flex-col gap-2.5 animate-in fade-in duration-150">
            <div className="flex items-start gap-2.5">
              <AlertCircle size={15} className="shrink-0 text-red-400 mt-0.5" />
              <div className="flex-1 leading-relaxed">
                {aiError.includes('503') || aiError.toLowerCase().includes('high demand') ? (
                  <>
                    <p className="font-semibold text-red-200">Gemini servers are momentarily busy</p>
                    <p className="text-[11px] text-red-300/80 mt-0.5">Free-tier models experience high traffic spikes. Our fallback cascade is ready to retry immediately.</p>
                  </>
                ) : (
                  <p className="text-red-200">{aiError}</p>
                )}
              </div>
            </div>
            {lastFailedRequest && (
              <div className="flex justify-end pt-1 border-t border-red-500/20">
                <button
                  type="button"
                  onClick={() => handleAskAi(lastFailedRequest.prompt, lastFailedRequest.actionType, lastFailedRequest.summaryMode)}
                  disabled={isAiLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/30 text-xs font-semibold active:scale-95 transition-all"
                >
                  <RotateCcw size={12} className={isAiLoading ? 'animate-spin' : ''} />
                  <span>Retry Request</span>
                </button>
              </div>
            )}
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Floating Input Dock */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAskAi();
        }}
        className="p-3 border-t border-[var(--theme-border)] bg-[var(--theme-surface-elevated)]/90 backdrop-blur-xl shrink-0 relative z-10"
      >
        <div className="relative flex items-center bg-[var(--theme-surface-subtle)] border border-[var(--theme-border)] focus-within:border-[var(--theme-primary,#6366f1)] focus-within:ring-2 focus-within:ring-[var(--theme-primary,#6366f1)]/20 rounded-2xl transition-all pl-3.5 pr-1.5 py-1.5 shadow-inner">
          <input
            type="text"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            placeholder={`Ask Gemini about ${docTitle || 'document'}...`}
            disabled={isAiLoading}
            dir="auto"
            className="flex-1 bg-transparent text-xs text-white placeholder:text-[var(--theme-text-muted)] outline-none font-sans"
          />
          <button
            type="submit"
            disabled={isAiLoading || !queryInput.trim()}
            className="p-2 rounded-xl bg-[var(--theme-primary,#3b82f6)] hover:brightness-110 active:scale-95 disabled:opacity-30 text-white font-bold transition-all shadow-md shrink-0 flex items-center justify-center"
            title="Send query to Gemini 3.8 Flash"
          >
            <Send size={14} />
          </button>
        </div>
      </form>
    </div>
  );

  // TAB 2: PAGE NOTES
  const renderNotesPad = () => (
    <div className="flex flex-col flex-1 h-full min-h-0 overflow-hidden">
      <div className="px-4 py-2 border-b border-[var(--theme-border)] flex items-center justify-between text-xs text-zinc-400 shrink-0">
        <span className="flex items-center gap-1.5 font-bold text-zinc-300">
          <FileText size={13} /> Notes for Page {pageNumber}
        </span>
        {saveStatus === 'saving' && <span className="text-amber-400 text-[10px] animate-pulse">saving...</span>}
        {saveStatus === 'saved' && <span className="inline-flex items-center gap-1 text-emerald-400 text-[10px]"><Check size={11} /> saved</span>}
      </div>

      <textarea
        value={localNote.text}
        onChange={handleTextChange}
        placeholder={`Write your handwritten or markdown notes for Page ${pageNumber}...`}
        dir={localNote.lang === 'ar' ? 'rtl' : 'ltr'}
        className={`flex-1 w-full p-6 bg-transparent outline-none resize-none leading-[32px] ${
          localNote.lang === 'ar'
            ? 'font-[family-name:var(--font-lemonada)] text-right text-[1.05rem]'
            : 'font-[family-name:var(--font-caveat)] text-left text-xl tracking-wide'
        } ${
          isDark
            ? 'text-[var(--theme-text-primary)] placeholder:[var(--theme-text-muted)]'
            : 'text-slate-800 placeholder:text-slate-300'
        }`}
        style={{
          backgroundImage: `repeating-linear-gradient(transparent, transparent 31px, ${
            isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(167, 139, 250, 0.25)'
          } 31px, ${
            isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(167, 139, 250, 0.25)'
          } 32px)`,
          backgroundAttachment: 'local'
        }}
      />
    </div>
  );

  // TAB 3: IN-PANEL QUIZ
  const renderQuizStudio = () => {
    const questions = quizData?.questions || [];
    const currentQ = questions[quizCurrentIdx];
    const currentAnswer = currentQ ? quizAnswers[currentQ.id] : null;

    return (
      <div className="flex flex-col flex-1 h-full min-h-0 overflow-y-auto p-4 custom-scrollbar bg-[var(--theme-surface)]">
        {!quizData && !quizLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-5 animate-in fade-in duration-200">
            <div className="w-14 h-14 rounded-2xl bg-[var(--theme-primary)]/15 border border-[var(--theme-primary)]/30 flex items-center justify-center text-[var(--theme-primary)] shadow-inner">
              <HelpCircle size={28} />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">Interactive Mastery Quiz</h4>
              <p className="text-xs text-[var(--theme-text-muted)] max-w-xs leading-relaxed">
                Test your comprehension of Page {pageNumber} with rigorous questions formulated strictly from this document.
              </p>
            </div>

            {/* Question Count Selector */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--theme-text-muted)]">Quiz Size</span>
              <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--theme-surface-subtle)] border border-[var(--theme-border)] text-xs font-semibold">
                {[5, 8, 10].map(count => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setQuizQuestionCount(count)}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      quizQuestionCount === count
                        ? 'bg-[var(--theme-primary)] text-white shadow-xs font-bold'
                        : 'text-[var(--theme-text-muted)] hover:text-white'
                    }`}
                  >
                    {count} Questions
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleGenerateInPanelQuiz}
              className="py-2.5 px-5 rounded-xl bg-[var(--theme-primary,#3b82f6)] hover:brightness-110 active:scale-95 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
            >
              <Sparkles size={14} /> Generate {quizQuestionCount}-Question Quiz
            </button>
          </div>
        )}

        {quizLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-3 animate-pulse">
            <Sparkles size={30} className="text-[var(--theme-primary)] animate-spin" />
            <h4 className="text-sm font-bold text-white">Formulating {quizQuestionCount} Questions...</h4>
            <p className="text-xs text-[var(--theme-text-muted)]">NotebookLM engine is verifying document facts.</p>
          </div>
        )}

        {quizError && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-xs mb-3 flex flex-col gap-2.5 animate-in fade-in duration-150">
            <div className="flex items-start gap-2.5">
              <AlertCircle size={15} className="shrink-0 text-red-400 mt-0.5" />
              <div className="flex-1 leading-relaxed">
                {quizError.includes('503') || quizError.toLowerCase().includes('high demand') ? (
                  <>
                    <p className="font-semibold text-red-200">Gemini is momentarily experiencing high demand</p>
                    <p className="text-[11px] text-red-300/80 mt-0.5">Please tap retry to re-generate the quiz using our resilient multi-model failover.</p>
                  </>
                ) : (
                  <p className="text-red-200">{quizError}</p>
                )}
              </div>
            </div>
            <div className="flex justify-end pt-1 border-t border-red-500/20">
              <button
                type="button"
                onClick={handleGenerateInPanelQuiz}
                disabled={quizLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/30 text-xs font-semibold active:scale-95 transition-all"
              >
                <RotateCcw size={12} className={quizLoading ? 'animate-spin' : ''} />
                <span>Retry Quiz</span>
              </button>
            </div>
          </div>
        )}

        {quizData && currentQ && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-[var(--theme-text-muted)] pb-2 border-b border-[var(--theme-border)]">
              <span className="font-bold text-zinc-200">
                Question {quizCurrentIdx + 1} of {questions.length}
              </span>
              <button
                type="button"
                onClick={handleGenerateInPanelQuiz}
                className="hover:text-white flex items-center gap-1 transition-colors"
                title="Regenerate"
              >
                <RotateCcw size={12} /> Reset
              </button>
            </div>

            {/* Visual Diagram / Mental Model Card */}
            {currentQ.imageCaption && (
              <div className="p-3 rounded-xl bg-[var(--theme-surface-subtle)] border border-[var(--theme-border)] text-xs text-[var(--theme-text-primary)] flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-[var(--theme-primary)]/15 text-[var(--theme-primary)] shrink-0">
                  <ImageIcon size={15} />
                </div>
                <span className="font-medium text-xs leading-relaxed">{currentQ.imageCaption}</span>
              </div>
            )}

            <div dir="auto" className="text-sm sm:text-base font-bold text-white leading-relaxed [unicode-bidi:plaintext] text-start">
              <StudyMarkdownRenderer content={currentQ.question} />
            </div>

            {currentQ.type === 'multiple_choice' && currentQ.options && (
              <div className="space-y-2 pt-1" dir="auto">
                {currentQ.options.map((opt, idx) => {
                  const isSelected = currentAnswer?.selectedIdx === idx;
                  const isCorrectAnswer = idx === currentQ.correctAnswerIndex;
                  let btnStyle = 'bg-[var(--theme-surface-elevated)] border-[var(--theme-border)] text-zinc-300 hover:bg-[var(--theme-surface-subtle)]';

                  if (currentAnswer) {
                    if (isCorrectAnswer) {
                      btnStyle = 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200 font-bold';
                    } else if (isSelected && !currentAnswer.isCorrect) {
                      btnStyle = 'bg-red-500/20 border-red-500/50 text-red-200 line-through';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={!!currentAnswer}
                      onClick={() => handleQuizAnswer(currentQ.id, idx, currentQ.correctAnswerIndex ?? 0, currentQ.explanation || '')}
                      dir="auto"
                      className={`w-full text-start p-3.5 rounded-xl border text-xs sm:text-sm transition-all active:scale-[0.99] flex items-center justify-between gap-3 ${btnStyle}`}
                    >
                      <div className="flex-1 min-w-0 [unicode-bidi:isolate] text-start" dir="auto">
                        <StudyMarkdownRenderer content={opt} />
                      </div>
                      {currentAnswer && isCorrectAnswer && <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}

            {currentAnswer && (
              <div className="p-3.5 rounded-xl bg-[var(--theme-surface-elevated)] border border-[var(--theme-border)] text-xs space-y-2 animate-in fade-in" dir="auto">
                <div className="flex items-center gap-1.5 font-bold">
                  {currentAnswer.isCorrect ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 size={14} />
                      <span>Correct!</span>
                    </span>
                  ) : (
                    <span className="text-amber-400 flex items-center gap-1">
                      <AlertCircle size={14} />
                      <span>Incorrect</span>
                    </span>
                  )}
                </div>
                <div className="text-zinc-200 leading-relaxed text-start [unicode-bidi:plaintext]" dir="auto">
                  <StudyMarkdownRenderer content={currentAnswer.feedback} />
                </div>
                {currentQ.sourceCitation && (
                  <p className="text-[10px] text-[var(--theme-text-muted)] italic text-start pt-1.5 border-t border-[var(--theme-border)]" dir="auto">
                    <span className="font-semibold text-zinc-300">Citation:</span> <bdi className="[unicode-bidi:isolate]">{currentQ.sourceCitation}</bdi>
                  </p>
                )}
              </div>
            )}

            {currentAnswer && quizCurrentIdx < questions.length - 1 && (
              <button
                type="button"
                onClick={() => setQuizCurrentIdx(i => i + 1)}
                className="w-full py-2.5 rounded-xl bg-[var(--theme-primary,#3b82f6)] text-white font-bold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <span>Next Question</span>
                <ArrowRight size={13} />
              </button>
            )}

            {currentAnswer && quizCurrentIdx === questions.length - 1 && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-center space-y-2">
                <h5 className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1.5">
                  <Award size={14} />
                  <span>Quiz Completed</span>
                </h5>
                <p className="text-xs text-zinc-300">
                  You scored {Object.values(quizAnswers).filter(a => a.isCorrect).length} / {questions.length}
                </p>
                <button
                  type="button"
                  onClick={handleGenerateInPanelQuiz}
                  className="py-1.5 px-3 rounded-lg bg-emerald-500 text-white font-bold text-xs active:scale-95"
                >
                  Try Another Quiz
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const notebookBody = (
    <div className="flex flex-col h-full w-full overflow-hidden select-none">
      {panelHeader}
      {activeTab === 'ai' && renderAiStudio()}
      {activeTab === 'notes' && renderNotesPad()}
      {activeTab === 'quiz' && renderQuizStudio()}
    </div>
  );

  // AUTO-HIDE DRAWER (Tablet & Mobile Overlay Mode)
  if (panelState === 'drawer') {
    return (
      <>
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-200"
          onClick={() => {
            if (onClose) onClose();
            else updatePanelState('rail');
          }}
        />

        <aside
          className={`fixed inset-y-0 right-0 z-50 w-[92vw] max-w-[480px] h-full shadow-2xl border-l flex flex-col transition-all duration-300 animate-in slide-in-from-right ${
            isDark
              ? 'border-[var(--theme-border)] bg-[var(--theme-surface)] backdrop-blur-2xl'
              : 'border-gray-200 bg-[#fffdf5]'
          }`}
          data-spatial-container="notes-drawer"
        >
          {notebookBody}
        </aside>
      </>
    );
  }

  // EXPANDED DESKTOP PANE
  return (
    <div
      style={isBookMinimized ? undefined : { width: clampedWidth }}
      className={`h-full border-l flex flex-col transition-all duration-200 ${
        isBookMinimized ? 'flex-1 w-full min-w-0' : 'flex-shrink-0'
      } ${
        isDark
          ? 'border-[var(--theme-border)] bg-[var(--theme-surface)]/95 backdrop-blur-2xl text-[var(--theme-text-primary)]'
          : 'border-gray-200 bg-[#fffdf5]'
      }`}
      data-spatial-container="notes-expanded"
    >
      {notebookBody}
    </div>
  );
});

export default NotesPanel;
