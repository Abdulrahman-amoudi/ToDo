'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { 
  BookOpen, 
  Sparkles, 
  Tag, 
  Calendar, 
  Clock, 
  ListTree, 
  Copy, 
  Check, 
  ExternalLink, 
  Download,
  FileText, 
  ArrowLeft, 
  Folder, 
  CheckCircle2, 
  AlertCircle, 
  Code, 
  Layers, 
  Maximize2, 
  Minimize2,
  Image as ImageIcon, 
  Loader2,
  X,
  MoreHorizontal 
} from 'lucide-react';
import type { ParsedObsidianNote } from '@/types/obsidian';
import dynamic from 'next/dynamic';
import BlockEditor from '../editor/BlockEditor';
import { recordMutation } from '@/lib/storage/offline-wal';

const PdfNotebookViewer = dynamic(() => import('./PdfNotebookViewer'), { ssr: false });

interface NoteViewerProps {
  note: ParsedObsidianNote | null;
  isLoading?: boolean;
  onClose?: () => void;
  onWikilinkClick?: (target: string) => void;
  onStartQuiz?: (note: ParsedObsidianNote) => void;
  onUpdateNote?: (updatedContent: string) => void;
  isDark?: boolean;
  hideTopHeader?: boolean; // For dual-pane embedding
  apiKey?: string;
  triggerMascot?: (action: any, expression?: any, temp?: boolean) => void;
  mascotShape?: string;
  mascotColor?: string;
}

export default function NoteViewer({
  note,
  isLoading = false,
  onClose,
  onWikilinkClick,
  onStartQuiz,
  onUpdateNote,
  isDark = true,
  hideTopHeader = false,
  apiKey,
  triggerMascot,
  mascotShape,
  mascotColor,
}: NoteViewerProps) {
  const [showOutline, setShowOutline] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCodeBlockIdx, setCopiedCodeBlockIdx] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editorMode, setEditorMode] = useState<'blocks' | 'raw'>('blocks');
  const [editContent, setEditContent] = useState('');
  const [showScratchpad, setShowScratchpad] = useState(false);
  const [scratchContent, setScratchContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isPdfFullscreen, setIsPdfFullscreen] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [pdfViewMode, setPdfViewMode] = useState<'pdf' | 'reader'>('pdf');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  // Debounced Auto-Save & Beacon Flush State
  const [saveStatus, setSaveStatus] = useState<'idle' | 'dirty' | 'saving' | 'saved'>('idle');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isDirtyRef = useRef(false);
  const editContentRef = useRef(editContent);
  editContentRef.current = editContent;
  const noteRef = useRef(note);
  noteRef.current = note;
  const onUpdateNoteRef = useRef(onUpdateNote);
  onUpdateNoteRef.current = onUpdateNote;

  const triggerSave = useCallback((contentToSave: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    setSaveStatus('saving');

    if (noteRef.current) {
      recordMutation({
        type: 'UPDATE_NOTE',
        payload: {
          path: noteRef.current.relativePath || noteRef.current.id,
          content: contentToSave,
          timestamp: Date.now()
        }
      }).catch(err => console.warn('[OfflineWAL] triggerSave failed to queue:', err));
    }

    try {
      if (onUpdateNoteRef.current) {
        onUpdateNoteRef.current(contentToSave);
      }
      isDirtyRef.current = false;
      setSaveStatus('saved');
      setTimeout(() => {
        setSaveStatus(prev => (prev === 'saved' ? 'idle' : prev));
      }, 2000);
    } catch (err) {
      console.error('Error auto-saving markdown note:', err);
      setSaveStatus('dirty');
    }
  }, []);

  const handleEditContentChange = useCallback((newContent: string) => {
    setEditContent(newContent);
    isDirtyRef.current = true;
    setSaveStatus('dirty');

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      triggerSave(newContent);
    }, 1000);
  }, [triggerSave]);

  // Flush unsaved edits on beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isDirtyRef.current && noteRef.current) {
        const payload = JSON.stringify({
          path: noteRef.current.relativePath || noteRef.current.id,
          notePath: noteRef.current.relativePath || noteRef.current.id,
          noteId: noteRef.current.id,
          content: editContentRef.current,
          timestamp: Date.now()
        });

        recordMutation({
          type: 'UPDATE_NOTE',
          payload: {
            path: noteRef.current.relativePath || noteRef.current.id,
            content: editContentRef.current,
            timestamp: Date.now()
          }
        }).catch(err => console.warn('[OfflineWAL] handleBeforeUnload failed to queue:', err));

        try {
          if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
            const blob = new Blob([payload], { type: 'application/json' });
            navigator.sendBeacon('/api/obsidian/flush', blob);
          } else {
            fetch('/api/obsidian/flush', {
              method: 'POST',
              body: payload,
              headers: { 'Content-Type': 'application/json' },
              keepalive: true
            }).catch(() => {});
          }
        } catch (e) {
          console.error('Failed to flush note on beforeunload:', e);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
        if (isDirtyRef.current) {
          triggerSave(editContentRef.current);
        }
      }
    };
  }, [triggerSave]);

  useEffect(() => {
    setEditContent(note?.bodyContent || '');
    isDirtyRef.current = false;
    setSaveStatus('idle');
    setIsEditing(false);
    setPdfViewMode('pdf');
    setIsPdfFullscreen(false);
    
    if (note) {
      setScratchContent(localStorage.getItem(`scratch_${note.id}`) || '');
    }
  }, [note?.id, note?.bodyContent]);

  const handleScratchChange = (val: string) => {
    setScratchContent(val);
    if (note) localStorage.setItem(`scratch_${note.id}`, val);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const { data, error } = await supabase.storage.from('media').upload(fileName, file);

      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(fileName);
      
      const markdownImage = `\n![${file.name}](${publicUrl})\n`;
      setEditContent(prev => prev + markdownImage);
      if (onUpdateNote) onUpdateNote(editContent + markdownImage);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please check your connection.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const copyMarkdown = async () => {
    if (!note) return;
    try {
      await navigator.clipboard.writeText(note.bodyContent || note.rawContent || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const copyDocumentUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // ignore
    }
  };

  const copyCode = async (codeStr: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(codeStr);
      setCopiedCodeBlockIdx(idx);
      setTimeout(() => setCopiedCodeBlockIdx(null), 2000);
    } catch {
      // ignore
    }
  };

  const scrollToHeading = (slug: string) => {
    const el = document.getElementById(slug);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const readingTime = useMemo(() => {
    if (!note || !note.wordCount) return 1;
    return Math.max(1, Math.ceil(note.wordCount / 200));
  }, [note]);

  // Clean Markdown Renderer helper
  const renderMarkdownContent = (markdownText: string) => {
    if (!markdownText) return null;

    const lines = markdownText.split(/\r?\n/);
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeLanguage = '';
    let codeBuffer: string[] = [];
    let codeBlockCount = 0;
    let listBuffer: string[] = [];
    let inList = false;

    const flushList = () => {
      if (inList && listBuffer.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="my-3 space-y-1.5 list-disc list-inside pl-2 text-sm leading-relaxed">
            {listBuffer.map((item, idx) => (
              <li key={idx} className={isDark ? 'text-slate-200' : 'text-gray-800'}>
                {renderInlineFormattedText(item)}
              </li>
            ))}
          </ul>
        );
        listBuffer = [];
        inList = false;
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.trim().startsWith('```')) {
        flushList();
        if (inCodeBlock) {
          const blockCode = codeBuffer.join('\n');
          const blockIdx = codeBlockCount++;
          const lang = codeLanguage;
          elements.push(
            <div key={`code-${blockIdx}`} className="my-4 rounded-2xl overflow-hidden border border-slate-700/60 bg-slate-950/80 shadow-lg">
              <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400 font-mono">
                <span className="flex items-center gap-1.5 uppercase font-bold text-purple-400">
                  <Code size={12} /> {lang || 'text'}
                </span>
                <button
                  type="button"
                  onClick={() => copyCode(blockCode, blockIdx)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  {copiedCodeBlockIdx === blockIdx ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                  <span>{copiedCodeBlockIdx === blockIdx ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto custom-scrollbar">
                <code>{blockCode}</code>
              </pre>
            </div>
          );
          codeBuffer = [];
          inCodeBlock = false;
          codeLanguage = '';
        } else {
          inCodeBlock = true;
          codeLanguage = line.trim().slice(3).trim();
        }
        continue;
      }

      if (inCodeBlock) {
        codeBuffer.push(line);
        continue;
      }

      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        flushList();
        const level = headingMatch[1].length;
        const text = headingMatch[2].trim();
        const slug = text
          .toLowerCase()
          .replace(/[^\w\s\u0600-\u06FF-]/g, '')
          .replace(/\s+/g, '-');

        const headingClasses = {
          1: 'vs-md-h1 text-2xl sm:text-3xl font-bold mt-6 mb-3 text-[var(--theme-text-primary)] border-b border-[var(--theme-border)] pb-2',
          2: 'text-xl sm:text-2xl font-bold mt-5 mb-2.5 tracking-tight text-white dark:text-slate-100',
          3: 'text-lg sm:text-xl font-semibold mt-4 mb-2 text-[var(--theme-text-primary)]',
          4: 'text-base sm:text-lg font-semibold mt-3.5 mb-1.5 text-slate-200',
          5: 'text-sm font-semibold mt-3 mb-1 text-slate-300',
          6: 'text-xs font-semibold mt-2.5 mb-1 text-slate-400'
        }[level] || 'text-base font-bold mt-3 mb-1';

        elements.push(
          <div key={`heading-${i}`} id={slug} className="scroll-mt-6">
            {React.createElement(
              `h${level}`,
              { className: headingClasses },
              renderInlineFormattedText(text)
            )}
          </div>
        );
        continue;
      }

      if (/^(\*{3,}|-{3,}|_{3,})$/.test(line.trim())) {
        flushList();
        elements.push(
          <hr key={`hr-${i}`} className={`my-5 border-t ${isDark ? 'border-slate-800' : 'border-gray-200'}`} />
        );
        continue;
      }

      if (line.trim().startsWith('>')) {
        flushList();
        const calloutText = line.trim().replace(/^>\s?/, '');
        const isAdmonition = calloutText.startsWith('[!');

        let admonitionType = 'NOTE';
        let bodyText = calloutText;
        if (isAdmonition) {
          const match = calloutText.match(/^\[!([A-Z]+)\]\s?(.*)$/i);
          if (match) {
            admonitionType = match[1].toUpperCase();
            bodyText = match[2];
          }
        }

        elements.push(
          <div
            key={`quote-${i}`}
            className={`my-3.5 p-4 rounded-2xl border-l-4 shadow-sm ${
              admonitionType === 'WARNING' || admonitionType === 'CAUTION'
                ? 'bg-amber-950/20 border-amber-500 text-amber-200'
                : admonitionType === 'TIP' || admonitionType === 'SUCCESS'
                  ? 'bg-emerald-950/20 border-emerald-500 text-emerald-200'
                  : 'bg-purple-950/20 border-purple-500 text-purple-200'
            }`}
          >
            {isAdmonition && (
              <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider mb-1">
                <AlertCircle size={14} />
                <span>{admonitionType}</span>
              </div>
            )}
            <div className="text-xs sm:text-sm leading-relaxed">
              {renderInlineFormattedText(bodyText || calloutText)}
            </div>
          </div>
        );
        continue;
      }

      const listMatch = line.match(/^(\s*)([-*]|\d+\.)\s+(.+)$/);
      if (listMatch) {
        inList = true;
        listBuffer.push(listMatch[3]);
        continue;
      } else {
        flushList();
      }

      if (!line.trim()) continue;

      elements.push(
        <p key={`p-${i}`} className={`my-2 text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
          {renderInlineFormattedText(line)}
        </p>
      );
    }

    flushList();
    return elements;
  };

  const renderInlineFormattedText = (text: string) => {
    if (!text) return null;

    const parts: React.ReactNode[] = [];
    let remaining = text;
    let keyIdx = 0;

    while (remaining.length > 0) {
      const wikiMatch = remaining.match(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/);
      const codeMatch = remaining.match(/`([^`]+)`/);
      const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
      const tagMatch = remaining.match(/(?:^|[\s,;:(])#([a-zA-Z0-9_\-\u0600-\u06FF]+)/);

      const matches = [
        wikiMatch ? { type: 'wiki', match: wikiMatch, index: wikiMatch.index! } : null,
        codeMatch ? { type: 'code', match: codeMatch, index: codeMatch.index! } : null,
        boldMatch ? { type: 'bold', match: boldMatch, index: boldMatch.index! } : null,
        tagMatch ? { type: 'tag', match: tagMatch, index: tagMatch.index! } : null,
      ].filter(Boolean) as { type: string; match: RegExpMatchArray; index: number }[];

      if (matches.length === 0) {
        parts.push(remaining);
        break;
      }

      matches.sort((a, b) => a.index - b.index);
      const first = matches[0];

      if (first.index > 0) {
        parts.push(remaining.slice(0, first.index));
      }

      const matchStr = first.match[0];
      const matchLen = matchStr.length;

      if (first.type === 'wiki') {
        const target = first.match[1].trim();
        const alias = first.match[2]?.trim() || target;
        parts.push(
          <button
            key={`wiki-${keyIdx++}`}
            type="button"
            onClick={() => onWikilinkClick && onWikilinkClick(target)}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 rounded-md font-semibold text-purple-400 hover:text-purple-300 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 transition-all text-[11px] sm:text-xs"
            title={`Navigate to note: ${target}`}
          >
            <BookOpen size={10} className="text-purple-400 flex-shrink-0" />
            <span>{alias}</span>
          </button>
        );
      } else if (first.type === 'code') {
        parts.push(
          <code key={`code-${keyIdx++}`} className="px-1.5 py-0.5 mx-0.5 rounded-md font-mono text-[11px] sm:text-xs bg-slate-800 text-purple-300 border border-slate-700/80">
            {first.match[1]}
          </code>
        );
      } else if (first.type === 'bold') {
        parts.push(
          <strong key={`bold-${keyIdx++}`} className="font-bold text-white dark:text-slate-100">
            {first.match[1]}
          </strong>
        );
      } else if (first.type === 'tag') {
        const tagText = first.match[1];
        parts.push(
          <span key={`tag-${keyIdx++}`} className="inline-flex items-center px-1.5 py-0.2 mx-0.5 rounded-md font-medium text-[10px] sm:text-[11px] bg-purple-500/10 text-purple-400 border border-purple-500/20">
            #{tagText}
          </span>
        );
      }

      remaining = remaining.slice(first.index + matchLen);
    }

    return parts;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <div className="w-10 h-10 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-400 animate-pulse">Loading note content...</p>
      </div>
    );
  }

  if (!note) {
    return (
      <div className={`p-10 rounded-3xl border border-dashed text-center flex flex-col items-center justify-center ${
        isDark ? 'border-slate-800 bg-slate-900/30 text-slate-400' : 'border-gray-200 bg-gray-50 text-gray-500'
      }`}>
        <BookOpen size={40} className="opacity-30 mb-3 text-purple-400" />
        <h3 className="text-base font-bold mb-1">Select a Note to Read</h3>
        <p className="text-xs max-w-xs opacity-75">
          Choose any note from the Explorer on the left to read its markdown content, tags, outline, and launch AI study quizzes.
        </p>
      </div>
    );
  }

  const pdfUrl = note.frontmatter?.pdf_url;

  return (
    <div className="flex flex-col h-full w-full relative font-sans" data-spatial-container="study-viewer">
      {/* Unified Floating Dynamic Island Top Bar (h-13 / 52px) */}
      {!hideTopHeader && (
        <header className="rd-bar" data-spatial-container="reader-topbar">
          <div className="rd-bar-left">
            {onClose && (
              <button type="button" onClick={onClose} className="rd-icon" title="Back (Esc)" aria-label="Back">
                <ArrowLeft size={16} />
              </button>
            )}
            <div className="rd-title-wrap">
              <h1 className="rd-title" title={note.title}>{note.title.replace(/\.pdf$/i, '')}</h1>
              <span className="rd-sub">
                {pdfUrl ? 'PDF' : (note.folder || 'Note')}
                {note.wordCount ? ` · ${note.wordCount.toLocaleString()} words · ${readingTime} min` : ''}
                {!pdfUrl && saveStatus === 'saving' ? ' · Saving…' : !pdfUrl && saveStatus === 'dirty' ? ' · Unsaved' : !pdfUrl && saveStatus === 'saved' ? ' · Saved' : ''}
              </span>
            </div>
          </div>

          <div className="rd-bar-center">
            {pdfUrl ? (
              <div id="pdf-tools-portal" className="rd-tools"></div>
            ) : isEditing ? (
              <div className="rd-seg" role="tablist">
                <button type="button" className={editorMode === 'blocks' ? 'is-on' : ''} onClick={() => setEditorMode('blocks')}>Blocks</button>
                <button type="button" className={editorMode === 'raw' ? 'is-on' : ''} onClick={() => setEditorMode('raw')}>Markdown</button>
              </div>
            ) : null}
          </div>

          <div className="rd-bar-right">
            {pdfUrl && (
              <div className="rd-seg" role="tablist" aria-label="View">
                <button type="button" className={pdfViewMode === 'pdf' ? 'is-on' : ''} onClick={() => setPdfViewMode('pdf')}>Page</button>
                <button type="button" className={pdfViewMode === 'reader' ? 'is-on' : ''} onClick={() => setPdfViewMode('reader')}>Text</button>
              </div>
            )}
            {!pdfUrl && onUpdateNote && (
              <button type="button" className={`rd-btn ${isEditing ? 'is-primary' : ''}`}
                onClick={() => { if (isEditing) { triggerSave(editContent); setIsEditing(false); } else { setIsEditing(true); } }}>
                {isEditing ? <><Check size={14} /> Done</> : 'Edit'}
              </button>
            )}
            {onStartQuiz && (
              <button type="button" className="rd-btn" onClick={() => onStartQuiz(note)} title="Quiz yourself on this document">
                Quiz me
              </button>
            )}
            <div className="rd-more">
              <button type="button" className={`rd-icon ${showMoreMenu ? 'is-on' : ''}`} onClick={() => setShowMoreMenu(v => !v)} aria-haspopup="menu" aria-expanded={showMoreMenu} title="More">
                <MoreHorizontal size={16} />
              </button>
              {showMoreMenu && (
                <>
                  <div className="rd-menu-scrim" onClick={() => setShowMoreMenu(false)} />
                  <div className="rd-menu" role="menu" onClick={() => setShowMoreMenu(false)}>
                    {note.headings && note.headings.length > 0 && (
                      <button type="button" role="menuitem" onClick={() => setShowOutline(!showOutline)}><ListTree size={15} />{showOutline ? 'Hide outline' : 'Show outline'}</button>
                    )}
                    <button type="button" role="menuitem" onClick={() => setShowScratchpad(!showScratchpad)}><FileText size={15} />{showScratchpad ? 'Hide scratchpad' : 'Scratchpad'}</button>
                    {pdfUrl ? (
                      <>
                        <button type="button" role="menuitem" onClick={() => setIsPdfFullscreen(!isPdfFullscreen)}>{isPdfFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}{isPdfFullscreen ? 'Exit full screen' : 'Full screen'}</button>
                        <div className="rd-menu-sep" />
                        <button type="button" role="menuitem" onClick={() => copyDocumentUrl(pdfUrl)}>{copiedLink ? <Check size={15} /> : <Copy size={15} />}Copy link</button>
                        <a role="menuitem" href={pdfUrl} target="_blank" rel="noopener noreferrer"><ExternalLink size={15} />Open in new tab</a>
                        <a role="menuitem" href={pdfUrl} download={note.title || 'document.pdf'}><Download size={15} />Download PDF</a>
                      </>
                    ) : (
                      <button type="button" role="menuitem" onClick={copyMarkdown}>{copied ? <Check size={15} /> : <Copy size={15} />}Copy as Markdown</button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Main Document & Outline Body */}
      <div className="flex-1 flex flex-col md:flex-row gap-5 min-h-0">
        {/* Scratchpad Panel */}
        {showScratchpad && (
          <div className={`w-full md:w-1/3 flex-shrink-0 flex flex-col p-4 rounded-3xl border transition-all ${isDark ? 'bg-amber-950/20 border-amber-500/30 text-amber-100' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
            <h4 className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5 opacity-70">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.586 7.586"></path><circle cx="11" cy="11" r="2"></circle></svg>
              Scratchpad
            </h4>
            <textarea
              dir="auto"
              placeholder="Jot down rough notes, translations, or ideas here..."
              value={scratchContent}
              onChange={(e) => handleScratchChange(e.target.value)}
              className="flex-1 w-full bg-transparent resize-none outline-none text-sm leading-relaxed custom-scrollbar"
            />
          </div>
        )}

        {/* Visual Document / Markdown Container */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden" dir="auto">
          {isEditing ? (
            <div className="flex-1 flex flex-col min-h-0">
              {editorMode === 'blocks' ? (
                <BlockEditor
                  initialMarkdown={editContent}
                  isDark={isDark}
                  onChange={(newMarkdown) => {
                    handleEditContentChange(newMarkdown);
                  }}
                  onSave={(finalMarkdown) => {
                    setEditContent(finalMarkdown);
                    triggerSave(finalMarkdown);
                  }}
                />
              ) : (
                <textarea
                  dir="auto"
                  className={`w-full min-h-[500px] h-full resize-none bg-transparent outline-none p-4 rounded-2xl border font-mono text-sm leading-relaxed ${
                    isDark ? 'border-[var(--theme-border)] text-[var(--theme-text-primary)] bg-[var(--theme-surface)]' : 'border-gray-300 text-gray-800 bg-gray-50'
                  }`}
                  value={editContent}
                  onChange={(e) => handleEditContentChange(e.target.value)}
                  placeholder="Start typing markdown..."
                  spellCheck={false}
                />
              )}
            </div>
          ) : pdfUrl ? (
            <div className={`flex flex-col w-full h-full min-h-0 flex-1 ${isPdfFullscreen ? 'rd-fullscreen' : ''}`}>
              {/* If in fullscreen OR hideTopHeader is true (dual-pane embed), render compact portal bar */}
              {(isPdfFullscreen || hideTopHeader) && (
                <div className="rd-bar rd-bar-compact">
                  <div className="flex items-center gap-2">
                    {isPdfFullscreen ? (
                      <button
                        type="button"
                        onClick={() => setIsPdfFullscreen(false)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold transition-all active:scale-95 shadow-sm"
                        title="Exit Fullscreen"
                      >
                        <Minimize2 size={13} />
                        <span>Exit Fullscreen</span>
                      </button>
                    ) : (
                      <FileText size={14} className="text-[var(--theme-primary)] shrink-0" />
                    )}
                    <span className="text-xs font-bold truncate max-w-[200px] text-zinc-200">{note.title}</span>
                  </div>
                  <div id="pdf-tools-portal" className="flex items-center gap-1 overflow-x-auto hide-scrollbar"></div>
                </div>
              )}

              {/* Main Visual Frame or Reader Mode */}
              {pdfViewMode === 'pdf' ? (
                <PdfNotebookViewer 
                  key={note.id}
                  pdfUrl={pdfUrl} 
                  noteId={note.id} 
                  notePath={note.relativePath || note.id}
                  noteTitle={note.title}
                  noteContent={note.bodyContent}
                  apiKey={apiKey}
                  initialNotesStr={note.frontmatter?.pdf_notes} 
                  isDark={isDark} 
                  onUpdateNote={onUpdateNote}
                  triggerMascot={triggerMascot}
                  mascotShape={mascotShape}
                  mascotColor={mascotColor}
                />
              ) : (
                <div className={`flex-1 overflow-y-auto custom-scrollbar p-6 rounded-2xl border ${
                  isDark ? 'border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--theme-text-primary)]' : 'border-gray-200 bg-white text-gray-800'
                }`}>
                  {renderMarkdownContent(editContent)}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {renderMarkdownContent(editContent)}
            </div>
          )}

          {/* Bidirectional Wikilinks Footer */}
          {note.wikilinks && note.wikilinks.length > 0 && !pdfUrl && (
            <div className="mt-8 pt-5 border-t border-dashed border-purple-500/20">
              <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-2 flex items-center gap-1.5">
                <Layers size={13} /> Connected Knowledge Nodes ({note.wikilinks.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {note.wikilinks.map((link, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onWikilinkClick && onWikilinkClick(link.target)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 transition-all active:scale-95"
                  >
                    <BookOpen size={12} className="text-purple-400" />
                    <span>{link.alias || link.target}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Outline Table of Contents Drawer */}
        <AnimatePresence>
          {showOutline && note.headings && note.headings.length > 0 && (
            <motion.aside
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 240 }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className={`p-4 rounded-3xl border overflow-y-auto custom-scrollbar flex-shrink-0 ${
                isDark ? 'bg-[var(--theme-surface-elevated)] border-[var(--theme-border)] text-[var(--theme-text-primary)]' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className={`flex items-center justify-between mb-3 pb-2 border-b ${
                isDark ? 'border-[var(--theme-border)]' : 'border-gray-200'
              }`}>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--theme-primary)] flex items-center gap-1">
                  <ListTree size={13} /> Outline (H1-H6)
                </h4>
                <button
                  type="button"
                  onClick={() => setShowOutline(false)}
                  className="p-1 rounded-lg text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)]"
                >
                  <X size={14} />
                </button>
              </div>

              <nav className="space-y-1.5">
                {note.headings.map((h, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => scrollToHeading(h.slug)}
                    style={{ paddingLeft: `${(h.level - 1) * 12 + 8}px` }}
                    className={`w-full text-left py-1 text-xs rounded-lg transition-colors truncate block ${
                      h.level === 1
                        ? 'font-bold text-[var(--theme-primary)] hover:bg-[var(--theme-surface-subtle)]'
                        : isDark
                          ? 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-surface)]'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    {h.text}
                  </button>
                ))}
              </nav>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
