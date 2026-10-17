'use client';

import React from 'react';

interface StudyMarkdownRendererProps {
  content: string;
  className?: string;
  fontSize?: 'normal' | 'large' | 'xl';
}

// Helper to determine if a block is primarily Arabic
function isArabicText(text: string): boolean {
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
  return arabicRegex.test(text);
}

// Clean and normalize arrow symbols in math or grammar rules
function normalizeArrows(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\?rightarrow|-->|->/gi, '←')
    .replace(/\\?leftarrow|<--|<-/gi, '→')
    .replace(/\\?Leftarrow|<==|<=/gi, '⇐')
    .replace(/\\?Rightarrow|==>|=>/gi, '⇒');
}

// Helper to isolate embedded math equations, quantities with units, formulas, and Latin symbols in Arabic/mixed text
function renderBiDiText(text: string): React.ReactNode[] {
  if (!text) return [];
  const normalized = normalizeArrows(text);
  // If text does not contain any Latin letters or math symbols, return as is
  if (!/[A-Za-z\=\×\*\/\+\-\^]/.test(normalized)) {
    return [normalized];
  }

  // Matches:
  // 1. Parenthesized formulas e.g. (P_avg = 0.5 * P_max)
  // 2. Math expressions e.g. 2 × 75 = 150 W or W = 150 W
  // 3. Numbers with units e.g. 75 W, 10 m/s, 220 V
  // 4. Latin variables or abbreviations e.g. P_max, P_avg, W, V, Hz
  const bidiPattern = /(\([A-Za-z0-9_\.\s\=\×\*\/\+\-\^]+\)|(?:[A-Za-z0-9_\.]+\s*[\=\×\*\/\+\-\^]\s*)+[A-Za-z0-9_\.\s]+|\b\d+(?:\.\d+)?\s*[A-Za-z]+(?:\/[A-Za-z]+)?\b|\b[A-Za-z]+(?:_[A-Za-z0-9]+)?\b)/g;

  const parts = normalized.split(bidiPattern);
  return parts.map((p, idx) => {
    if (!p) return null;
    const isFormulaOrLatin = /^[A-Za-z0-9_\.\s\=\×\*\/\+\-\^\(\)]+$/.test(p.trim()) && /[A-Za-z\=\×\*\/\+\-\^]/.test(p);
    if (isFormulaOrLatin) {
      return (
        <bdi
          key={`bdi-${idx}`}
          dir="ltr"
          className="inline-block font-mono [unicode-bidi:isolate] font-bold text-indigo-200 mx-0.5 px-1 py-0.5 rounded bg-indigo-500/15 border border-indigo-500/25"
        >
          {p}
        </bdi>
      );
    }
    return <span key={`txt-${idx}`}>{p}</span>;
  });
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
      const codeInner = normalizeArrows(part.slice(1, -1));
      const isCodeAr = isArabicText(codeInner);
      return (
        <code
          key={idx}
          dir={isCodeAr ? 'rtl' : 'ltr'}
          className={`font-bold bg-amber-400/15 text-amber-300 px-2 py-0.5 rounded-lg border border-amber-400/30 mx-1 inline-block [unicode-bidi:isolate] shadow-xs ${
            isCodeAr ? 'font-arabic text-[14px] sm:text-[15px]' : 'font-mono text-xs'
          }`}
        >
          {codeInner}
        </code>
      );
    }

    if (part.startsWith('**') && part.endsWith('**')) {
      const boldText = part.slice(2, -2).trim();
      const isBoldAr = isArabicText(boldText);
      return (
        <strong
          key={idx}
          className={`font-black text-white tracking-wide ${
            isBoldAr
              ? 'font-arabic text-amber-200 bg-amber-400/15 px-1.5 py-0.5 rounded-md border border-amber-400/25 inline-block mx-0.5 shadow-xs'
              : 'font-bold'
          }`}
        >
          {renderBiDiText(boldText)}
        </strong>
      );
    }

    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={idx} className="italic text-zinc-200">
          {renderBiDiText(part.slice(1, -1))}
        </em>
      );
    }

    if (part.startsWith('[') && part.endsWith(']')) {
      return (
        <span
          key={idx}
          className="inline-flex items-center px-2 py-0.5 rounded-md bg-[var(--theme-primary,#6366f1)]/20 border border-[var(--theme-primary,#6366f1)]/40 text-[var(--theme-primary,#818cf8)] font-mono text-xs font-bold mx-1 select-none [unicode-bidi:isolate] shadow-xs"
        >
          {part.slice(1, -1)}
        </span>
      );
    }

    return <span key={idx}>{renderBiDiText(part)}</span>;
  });
}

export const StudyMarkdownRenderer: React.FC<StudyMarkdownRendererProps> = ({ 
  content, 
  className = '',
  fontSize = 'normal'
}) => {
  if (!content) return null;

  // Split into lines
  const rawLines = content.split('\n');
  const elements: React.ReactNode[] = [];

  let listBuffer: { type: 'ul' | 'ol'; items: string[] } | null = null;

  // Size multipliers
  const arBodySize = fontSize === 'xl' ? 'text-lg' : fontSize === 'large' ? 'text-[17px]' : 'text-[15px] sm:text-base';
  const enBodySize = fontSize === 'xl' ? 'text-base' : fontSize === 'large' ? 'text-[15px]' : 'text-sm';

  const flushList = (key: number) => {
    if (!listBuffer) return null;
    const isUl = listBuffer.type === 'ul';
    const items = listBuffer.items;
    listBuffer = null;

    return isUl ? (
      <ul key={`ul-${key}`} className="space-y-2.5 my-3 ps-3 list-none">
        {items.map((it, i) => {
          const isAr = isArabicText(it);
          return (
            <li
              key={i}
              dir={isAr ? 'rtl' : 'ltr'}
              className={`flex items-start gap-3 leading-[2.1] text-zinc-50 ${
                isAr ? `font-arabic ${arBodySize} font-medium` : `font-sans ${enBodySize} font-normal`
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[var(--theme-primary,#6366f1)] mt-2.5 shrink-0 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
              <div className="flex-1">{renderInlineFormatting(it)}</div>
            </li>
          );
        })}
      </ul>
    ) : (
      <ol key={`ol-${key}`} className="space-y-3 my-3 ps-1 list-none">
        {items.map((it, i) => {
          const isAr = isArabicText(it);
          return (
            <li
              key={i}
              dir={isAr ? 'rtl' : 'ltr'}
              className={`flex items-start gap-3 leading-[2.1] text-zinc-50 bg-white/[0.03] border border-white/10 p-3 rounded-2xl shadow-xs ${
                isAr ? `font-arabic ${arBodySize} font-medium` : `font-sans ${enBodySize} font-normal`
              }`}
            >
              <span className="flex items-center justify-center w-6 h-6 rounded-xl bg-gradient-to-tr from-[var(--theme-primary,#6366f1)]/25 to-purple-500/25 border border-[var(--theme-primary,#6366f1)]/40 text-[var(--theme-primary,#818cf8)] font-bold text-xs shrink-0 mt-0.5 shadow-sm">
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
        <div key={`hr-${index}`} className="my-4 border-t border-indigo-500/20" />
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
            className={`font-black text-white tracking-normal pt-4 pb-2 border-b border-indigo-500/30 flex items-center gap-2.5 ${
              isAr ? 'font-arabic text-lg sm:text-xl leading-[1.8]' : 'font-sans text-base'
            }`}
          >
            <span className="w-2 h-5 rounded-full bg-gradient-to-b from-indigo-400 to-amber-400 shrink-0 shadow-sm" />
            <span className="text-white drop-shadow-xs">{renderInlineFormatting(title)}</span>
          </h3>
        );
      } else {
        elements.push(
          <h4
            key={`h-${index}`}
            dir={isAr ? 'rtl' : 'ltr'}
            className={`font-extrabold text-amber-300 tracking-normal pt-3 pb-1 flex items-center gap-2 ${
              isAr ? 'font-arabic text-base sm:text-lg leading-[1.8]' : 'font-sans text-sm'
            }`}
          >
            <span className="w-1.5 h-3.5 rounded-full bg-emerald-400 shrink-0 shadow-sm" />
            <span className="drop-shadow-xs">{renderInlineFormatting(title)}</span>
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
          className="my-3.5 p-4 rounded-2xl bg-gradient-to-r from-[var(--theme-primary,#6366f1)]/15 via-white/[0.03] to-transparent border-s-4 border-[var(--theme-primary,#6366f1)] border border-white/10 shadow-md"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className={`font-black text-[var(--theme-primary,#818cf8)] tracking-wide uppercase ${isAr ? 'font-arabic text-sm' : 'text-xs'}`}>
              {qPrefix}
            </span>
          </div>
          {qBody && (
            <p className={`text-white leading-[2.1] ${isAr ? `font-arabic ${arBodySize} font-semibold` : `${enBodySize} font-medium`}`}>
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
        className={`leading-[2.1] text-zinc-50 [unicode-bidi:plaintext] my-2.5 ${
          isAr ? `text-right font-arabic ${arBodySize} font-medium` : `text-left font-sans ${enBodySize} text-zinc-100 font-normal`
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
    <div className={`space-y-2.5 ${className}`}>
      {elements}
    </div>
  );
};
