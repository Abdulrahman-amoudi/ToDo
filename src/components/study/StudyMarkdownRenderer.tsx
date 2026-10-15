'use client';

import React from 'react';

interface StudyMarkdownRendererProps {
  content: string;
  className?: string;
}

// Helper to determine if a block is primarily Arabic
function isArabicText(text: string): boolean {
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
  return arabicRegex.test(text);
}

// Parse inline formatting: **bold**, *italic*, `code`, [Page X]
function renderInlineFormatting(text: string): React.ReactNode[] {
  // Regex pattern matching:
  // 1: `code`
  // 2: **bold**
  // 3: *italic*
  // 4: [citations] e.g. [Page 8] or [صفحة 8]
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[(?:Page|صفحة)\s*\d+\])/g;
  const parts = text.split(pattern);

  return parts.map((part, idx) => {
    if (!part) return null;

    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={idx}
          className="font-mono text-[11px] bg-white/10 text-amber-300 px-1.5 py-0.5 rounded border border-white/10 mx-0.5"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    if (part.startsWith('**') && part.endsWith('**')) {
      const boldText = part.slice(2, -2).trim();
      return (
        <strong key={idx} className="font-bold text-white tracking-wide">
          {boldText}
        </strong>
      );
    }

    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={idx} className="italic text-zinc-300">
          {part.slice(1, -1)}
        </em>
      );
    }

    if (part.startsWith('[') && part.endsWith(']')) {
      return (
        <span
          key={idx}
          className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-[var(--theme-primary,#6366f1)]/15 border border-[var(--theme-primary,#6366f1)]/30 text-[var(--theme-primary,#818cf8)] font-mono text-[10px] font-semibold mx-1 select-none"
        >
          {part.slice(1, -1)}
        </span>
      );
    }

    return <span key={idx}>{part}</span>;
  });
}

export const StudyMarkdownRenderer: React.FC<StudyMarkdownRendererProps> = ({ content, className = '' }) => {
  if (!content) return null;

  // Split into lines
  const rawLines = content.split('\n');
  const elements: React.ReactNode[] = [];

  let listBuffer: { type: 'ul' | 'ol'; items: string[] } | null = null;

  const flushList = (key: number) => {
    if (!listBuffer) return null;
    const isUl = listBuffer.type === 'ul';
    const items = listBuffer.items;
    listBuffer = null;

    return isUl ? (
      <ul key={`ul-${key}`} className="space-y-1.5 my-2.5 ps-3 list-none">
        {items.map((it, i) => {
          const isAr = isArabicText(it);
          return (
            <li
              key={i}
              dir={isAr ? 'rtl' : 'ltr'}
              className="flex items-start gap-2.5 text-xs text-zinc-200 leading-relaxed"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--theme-primary,#6366f1)] mt-1.5 shrink-0 shadow-sm" />
              <div className="flex-1">{renderInlineFormatting(it)}</div>
            </li>
          );
        })}
      </ul>
    ) : (
      <ol key={`ol-${key}`} className="space-y-2 my-2.5 ps-1 list-none">
        {items.map((it, i) => {
          const isAr = isArabicText(it);
          return (
            <li
              key={i}
              dir={isAr ? 'rtl' : 'ltr'}
              className="flex items-start gap-2 text-xs text-zinc-200 leading-relaxed bg-white/[0.02] border border-white/5 p-2 rounded-xl"
            >
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[var(--theme-primary,#6366f1)]/20 border border-[var(--theme-primary,#6366f1)]/40 text-[var(--theme-primary,#818cf8)] font-mono text-[10px] font-bold shrink-0 mt-0.5">
                {i + 1}
              </span>
              <div className="flex-1">{renderInlineFormatting(it)}</div>
            </li>
          );
        })}
      </ol>
    );
  };

  rawLines.forEach((line, index) => {
    const trimmed = line.trim();

    // Empty line: flush list
    if (!trimmed) {
      if (listBuffer) {
        elements.push(flushList(index));
      }
      return;
    }

    // Horizontal Rule: --- or ***
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      if (listBuffer) elements.push(flushList(index));
      elements.push(
        <div key={`hr-${index}`} className="my-3 border-t border-white/10" />
      );
      return;
    }

    // Headers: ### or ## or #
    const headerMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (headerMatch) {
      if (listBuffer) elements.push(flushList(index));
      const level = headerMatch[1].length;
      const title = headerMatch[2].replace(/\*\*/g, '').trim();
      const isAr = isArabicText(title);

      if (level === 1 || level === 2) {
        elements.push(
          <h3
            key={`h-${index}`}
            dir={isAr ? 'rtl' : 'ltr'}
            className="text-sm font-bold text-white tracking-tight pt-3 pb-1 border-b border-white/10 flex items-center gap-2"
          >
            <span className="w-1.5 h-3.5 rounded-full bg-[var(--theme-primary,#6366f1)]" />
            <span>{renderInlineFormatting(title)}</span>
          </h3>
        );
      } else {
        elements.push(
          <h4
            key={`h-${index}`}
            dir={isAr ? 'rtl' : 'ltr'}
            className="text-xs font-bold text-zinc-100 tracking-tight pt-2.5 pb-0.5 flex items-center gap-2"
          >
            <span className="w-1 h-2.5 rounded-full bg-emerald-400" />
            <span>{renderInlineFormatting(title)}</span>
          </h4>
        );
      }
      return;
    }

    // Question format detection e.g. "**السؤال الأول" or "السؤال الأول:" or "**Question 1"
    const questionMatch = trimmed.match(/^(\*\*?السؤال\s+[^\*:]+\*\*?:?|\*\*?Question\s+\d+\*\*?:?)\s*(.*)$/);
    if (questionMatch) {
      if (listBuffer) elements.push(flushList(index));
      const qPrefix = questionMatch[1].replace(/\*\*/g, '').trim();
      const qBody = questionMatch[2].trim();
      const isAr = isArabicText(trimmed);

      elements.push(
        <div
          key={`q-${index}`}
          dir={isAr ? 'rtl' : 'ltr'}
          className="my-2.5 p-3 rounded-xl bg-gradient-to-r from-[var(--theme-primary,#6366f1)]/10 to-transparent border-s-2 border-[var(--theme-primary,#6366f1)] bg-white/[0.02] border-white/5"
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold text-[var(--theme-primary,#818cf8)] tracking-wide uppercase">
              {qPrefix}
            </span>
          </div>
          {qBody && (
            <p className="text-xs text-zinc-100 font-medium leading-relaxed">
              {renderInlineFormatting(qBody)}
            </p>
          )}
        </div>
      );
      return;
    }

    // Unordered List: - item or * item
    const ulMatch = trimmed.match(/^[-*•]\s+(.+)$/);
    if (ulMatch) {
      if (listBuffer && listBuffer.type !== 'ul') {
        elements.push(flushList(index));
      }
      if (!listBuffer) {
        listBuffer = { type: 'ul', items: [] };
      }
      listBuffer.items.push(ulMatch[1]);
      return;
    }

    // Numbered List: 1. item or (1) item
    const olMatch = trimmed.match(/^(\d+\.|\(\d+\))\s+(.+)$/);
    if (olMatch) {
      if (listBuffer && listBuffer.type !== 'ol') {
        elements.push(flushList(index));
      }
      if (!listBuffer) {
        listBuffer = { type: 'ol', items: [] };
      }
      listBuffer.items.push(olMatch[2]);
      return;
    }

    // If we were building a list and line is regular text, flush list
    if (listBuffer) {
      elements.push(flushList(index));
    }

    // Standard Paragraph
    const isAr = isArabicText(trimmed);
    elements.push(
      <p
        key={`p-${index}`}
        dir={isAr ? 'rtl' : 'ltr'}
        className={`text-xs text-zinc-200 leading-relaxed ${
          isAr ? 'text-right font-sans' : 'text-left'
        }`}
      >
        {renderInlineFormatting(trimmed)}
      </p>
    );
  });

  if (listBuffer) {
    elements.push(flushList(999999));
  }

  return (
    <div className={`space-y-2 font-sans ${className}`}>
      {elements}
    </div>
  );
};
