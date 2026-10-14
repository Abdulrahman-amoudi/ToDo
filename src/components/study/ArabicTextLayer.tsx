'use client';

import React, { useMemo, useEffect, useState, useRef } from 'react';
import { processPageTextContent, ProcessedTextLine } from '@/lib/pdf/arabic-bidi';

export interface ArabicTextLayerProps {
  pageNumber?: number;
  viewport?: any;
  textContent?: any;
  scale?: number;
  page?: any;
  onTextExtracted?: (lines: ProcessedTextLine[]) => void;
  className?: string;
}

export const ArabicTextLayer = React.memo(function ArabicTextLayer({
  pageNumber = 1,
  viewport,
  textContent,
  scale = 1.0,
  page,
  onTextExtracted,
  className
}: ArabicTextLayerProps) {
  const [normalizedAsyncLines, setNormalizedAsyncLines] = useState<ProcessedTextLine[] | null>(null);
  const onTextExtractedRef = useRef(onTextExtracted);
  onTextExtractedRef.current = onTextExtracted;

  // Base page unscaled dimensions
  const baseViewport = useMemo(() => {
    const currentScale = scale || 1.0;
    if (viewport?.height) {
      return {
        scale: 1.0,
        height: viewport.height / currentScale,
        width: viewport.width ? viewport.width / currentScale : 600
      };
    }
    return { scale: 1.0, height: 800, width: 600 };
  }, [viewport?.height, viewport?.width, scale]);

  // Synchronous line extraction cached strictly at unit scale (1.0)
  const normalizedSyncLines = useMemo(() => {
    if (textContent) {
      return processPageTextContent(textContent, baseViewport);
    }
    return null;
  }, [textContent, baseViewport]);

  // Asynchronous fallback extraction when PDFPageProxy (page) is passed without textContent
  useEffect(() => {
    if (!normalizedSyncLines && page) {
      const baseVp = typeof page.getViewport === 'function' 
        ? page.getViewport({ scale: 1.0 }) 
        : baseViewport;
      
      if (typeof page.getTextContent === 'function') {
        page.getTextContent().then((tc: any) => {
          const lines = processPageTextContent(tc, baseVp);
          setNormalizedAsyncLines(lines);
        }).catch((err: any) => {
          console.error('Failed to extract text content in ArabicTextLayer:', err);
        });
      }
    }
  }, [normalizedSyncLines, page, baseViewport]);

  // Scale-invariant linear projection: zero clustering recalculation on zoom
  const activeLines = useMemo(() => {
    const baseLines = normalizedSyncLines || normalizedAsyncLines;
    if (!baseLines) return [];
    const currentScale = scale || 1.0;
    if (currentScale === 1.0) return baseLines;

    return baseLines.map(line => ({
      ...line,
      left: Math.round(line.left * currentScale * 100) / 100,
      top: Math.round(line.top * currentScale * 100) / 100,
      width: Math.round(line.width * currentScale * 100) / 100,
      height: Math.round(line.height * currentScale * 100) / 100,
      items: line.items.map(item => ({
        ...item,
        left: Math.round(item.left * currentScale * 100) / 100,
        top: Math.round(item.top * currentScale * 100) / 100,
        width: Math.round(item.width * currentScale * 100) / 100,
        height: Math.round(item.height * currentScale * 100) / 100,
        fontSize: Math.round(item.fontSize * currentScale * 100) / 100,
      }))
    }));
  }, [normalizedSyncLines, normalizedAsyncLines, scale]);

  // Trigger onTextExtracted callback when activeLines change
  useEffect(() => {
    if (activeLines.length > 0) {
      onTextExtractedRef.current?.(activeLines);
    }
  }, [activeLines]);

  return (
    <div
      className={`arabic-text-layer textLayer react-pdf__Page__textContent ${className || ''}`}
      data-page-number={pageNumber}
      dir="ltr"
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: viewport?.width ? `${Math.round(viewport.width)}px` : '100%',
        height: viewport?.height ? `${Math.round(viewport.height)}px` : '100%',
        overflow: 'hidden',
        pointerEvents: 'none', // Strict isolation: parent catches zero whitespace clicks
        userSelect: 'text',
        WebkitUserSelect: 'text',
        lineHeight: 1,
        zIndex: 10,
        ['--scale-factor' as any]: scale || 1.0,
      }}
    >
      <style>{`
        .arabic-text-layer, .textLayer, .react-pdf__Page__textContent {
          pointer-events: none !important;
          user-select: none !important;
          -webkit-user-select: none !important;
        }
        .arabic-text-layer::selection, .textLayer::selection, .react-pdf__Page__textContent::selection {
          background: transparent !important;
        }
        .arabic-text-layer span, .textLayer span, .react-pdf__Page__textContent span,
        .arabic-text-layer span.arabic-text-line {
          display: inline-block !important;
          white-space: pre !important;
          transform-origin: 0% 0% !important;
          line-height: 1 !important;
          vertical-align: baseline !important;
          color: transparent !important;
          cursor: text;
          user-select: text !important;
          -webkit-user-select: text !important;
          pointer-events: auto !important;
          padding: 0 !important;
          margin: 0 !important;
          box-sizing: border-box !important;
        }
        .arabic-text-layer span::selection, .textLayer span::selection, .react-pdf__Page__textContent span::selection,
        .arabic-text-layer span.arabic-text-line::selection {
          background: rgba(59, 130, 246, 0.35) !important;
          color: transparent !important;
        }
        .arabic-text-layer br, .textLayer br, .react-pdf__Page__textContent br,
        .arabic-text-layer .endOfContent, .textLayer .endOfContent, .react-pdf__Page__textContent .endOfContent {
          user-select: none !important;
          -webkit-user-select: none !important;
          pointer-events: none !important;
          display: none !important;
        }
        /* Newline pseudo-element to guarantee natural line breaking on multiline text selections */
        .arabic-text-layer span.arabic-text-line::after {
          content: "\\A";
          white-space: pre;
          width: 0;
          height: 0;
          position: absolute;
          pointer-events: none;
        }
      `}</style>
      {activeLines.map((line, index) => {
        const isArabicText = /[\u0600-\u06FF]/.test(line.fullText);
        const effectiveDir = isArabicText ? 'rtl' : (line.dir || 'ltr');
        const fontSize = line.items[0]?.fontSize || line.height;

        return (
          <span
            key={`page-${pageNumber}-line-${index}`}
            className="arabic-text-line"
            dir={effectiveDir}
            data-dir={effectiveDir}
            data-line-index={index}
            data-page-number={pageNumber}
            style={{
              position: 'absolute',
              left: `${line.left}px`,
              top: `${line.top}px`,
              width: `${line.width}px`,
              height: `${line.height}px`,
              fontSize: `${fontSize}px`,
              lineHeight: 1,
              display: 'inline-block',
              whiteSpace: 'pre',
              transformOrigin: '0% 0%',
              unicodeBidi: 'isolate',
              WebkitUserSelect: 'text',
              userSelect: 'text',
              pointerEvents: 'auto',
              color: 'transparent',
              fontFamily: isArabicText ? 'var(--font-lemonada), sans-serif' : 'sans-serif',
            }}
          >
            {line.fullText}
          </span>
        );
      })}
    </div>
  );
});

export default ArabicTextLayer;
