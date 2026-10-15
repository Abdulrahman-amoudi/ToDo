'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import ArabicTextLayer from './ArabicTextLayer';
import NotesPanel from './NotesPanel';
import { ChevronLeft, ChevronRight, PenTool, Save, Check, Highlighter, Type, MousePointer2, ZoomIn, ZoomOut, Eraser, Undo2, Sidebar, Hand, Eye, EyeOff, Square, Baseline, Maximize2, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { updateFrontmatterField } from '@/lib/obsidian/parser';
import { recordMutation, markMutationSynced, markMutationFailed } from '@/lib/storage/offline-wal';
import { getCachedPdfBlob, cachePdfBlob } from '@/lib/pdf/pdf-cache';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const options = {
  cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
  cMapPacked: true,
  standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
  disableAutoFetch: false,
  disableStream: false,
};

interface PdfNotebookViewerProps {
  pdfUrl: string;
  noteId?: string;
  notePath?: string;
  noteTitle?: string;
  noteContent?: string;
  apiKey?: string;
  initialNotesStr?: string;
  isDark?: boolean;
  onUpdateNote?: ((updatedContent: string) => void) | ((noteId: string, updates: { content?: string; frontmatter?: any }) => void);
  triggerMascot?: (action: any, expression?: any, temp?: boolean) => void;
}

export default function PdfNotebookViewer({ 
  pdfUrl, 
  noteId = '', 
  notePath, 
  noteTitle = 'Study Document',
  noteContent = '',
  apiKey = '',
  initialNotesStr, 
  isDark = true, 
  onUpdateNote,
  triggerMascot
}: PdfNotebookViewerProps) {
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [notes, setNotes] = useState<Record<number, { text: string, lang: 'en' | 'ar' }>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pdfTool, setPdfTool] = useState('cursor');
  const [textColor, setTextColor] = useState('#9333ea'); // default purple-600
  const [highlightColor, setHighlightColor] = useState('#fef08a'); // default yellow-200
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [pageNaturalWidth, setPageNaturalWidth] = useState<number>(595);
  const [isMobileOrTabletVertical, setIsMobileOrTabletVertical] = useState<boolean>(false);

  const [notesWidth, setNotesWidth] = useState(450);
  const [isDragging, setIsDragging] = useState(false);
  const [showPdfUi, setShowPdfUi] = useState(true);
  const [showNotes, setShowNotes] = useState(true);
  const [pendingText, setPendingText] = useState<{x: number, y: number, text: string, color?: string, fontSize?: number, id?: number} | null>(null);
  const [viewerEngine, setViewerEngine] = useState<'pdfjs' | 'native'>('pdfjs');
  const [highlightMode, setHighlightMode] = useState<'box' | 'text'>('box');
  const [highlightStart, setHighlightStart] = useState<{x: number, y: number} | null>(null);
  const [highlightCurrent, setHighlightCurrent] = useState<{x: number, y: number} | null>(null);
  
  // Instant IndexedDB PDF Cache: Load in <50ms if opened before
  const [resolvedPdfSource, setResolvedPdfSource] = useState<string | Blob>(pdfUrl);

  useEffect(() => {
    let isCancelled = false;
    let createdBlobUrl: string | null = null;

    async function loadWithCache() {
      if (!pdfUrl) return;
      try {
        const cachedBlob = await getCachedPdfBlob(pdfUrl);
        if (cachedBlob && !isCancelled) {
          createdBlobUrl = URL.createObjectURL(cachedBlob);
          setResolvedPdfSource(createdBlobUrl);
          return;
        }

        // Use direct URL for immediate streaming
        setResolvedPdfSource(pdfUrl);

        // Fetch & cache in background into IndexedDB
        fetch(pdfUrl)
          .then(res => res.blob())
          .then(blob => {
            if (!isCancelled && blob && blob.size > 0) {
              cachePdfBlob(pdfUrl, blob);
            }
          })
          .catch(() => {});
      } catch {
        if (!isCancelled) {
          setResolvedPdfSource(pdfUrl);
        }
      }
    }

    loadWithCache();

    return () => {
      isCancelled = true;
      if (createdBlobUrl) {
        URL.revokeObjectURL(createdBlobUrl);
      }
    };
  }, [pdfUrl]);

  // High-Precision Arabic Text Layer State
  const [activePageProxy, setActivePageProxy] = useState<any>(null);
  const [pageTextContent, setPageTextContent] = useState<any>(null);
  const [pageViewport, setPageViewport] = useState<any>(null);

  const activePageText = React.useMemo(() => {
    if (!pageTextContent || !pageTextContent.items) return '';
    return pageTextContent.items.map((it: any) => it.str || '').join(' ').trim();
  }, [pageTextContent]);

  const handlePageLoadSuccess = (pageProxy: any) => {
    setActivePageProxy(pageProxy);
    const unscaled = pageProxy.getViewport ? pageProxy.getViewport({ scale: 1.0 }) : null;
    if (unscaled && unscaled.width) {
      setPageNaturalWidth(unscaled.width);
    }
    const vp = pageProxy.getViewport ? pageProxy.getViewport({ scale: zoomLevel }) : null;
    setPageViewport(vp);
    if (pageProxy && typeof pageProxy.getTextContent === 'function') {
      pageProxy.getTextContent().then((tc: any) => {
        setPageTextContent(tc);
      }).catch((err: any) => {
        console.error('Failed to extract text content in PdfNotebookViewer:', err);
      });
    }
  };

  const checkResponsive = useCallback(() => {
    if (typeof window === 'undefined') return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const isNarrow = w < 1024;
    const isVertical = h >= w;
    const isMobile = w < 640;
    const isVerticalLayout = isNarrow || (isVertical && w <= 1180);
    setIsMobileOrTabletVertical(isVerticalLayout);

    if (containerRef.current) {
      const availWidth = containerRef.current.clientWidth;
      if (availWidth > 0 && (isMobile || (isNarrow && isVertical))) {
        const targetZoom = Math.min(2.0, Math.max(0.4, (availWidth - 24) / (pageNaturalWidth || 595)));
        setZoomLevel(prev => {
          if (prev === 1.0 || prev * (pageNaturalWidth || 595) > availWidth) {
            return Number(targetZoom.toFixed(2));
          }
          return prev;
        });
      }
    }
  }, [pageNaturalWidth]);

  useEffect(() => {
    checkResponsive();
    window.addEventListener('resize', checkResponsive);
    window.addEventListener('orientationchange', checkResponsive);
    return () => {
      window.removeEventListener('resize', checkResponsive);
      window.removeEventListener('orientationchange', checkResponsive);
    };
  }, [checkResponsive]);

  const fitToWidth = useCallback(() => {
    if (!containerRef.current) return;
    const availWidth = containerRef.current.clientWidth;
    const target = (availWidth - (isMobileOrTabletVertical ? 16 : 32)) / (pageNaturalWidth || 595);
    setZoomLevel(Number(Math.min(2.5, Math.max(0.35, target)).toFixed(2)));
  }, [isMobileOrTabletVertical, pageNaturalWidth]);

  useEffect(() => {
    if (activePageProxy && typeof activePageProxy.getViewport === 'function') {
      const vp = activePageProxy.getViewport({ scale: zoomLevel });
      setPageViewport(vp);
    }
  }, [zoomLevel, activePageProxy]);

  // Explicit canvas context destruction and page cleanup on page change
  useEffect(() => {
    if (activePageProxy && typeof activePageProxy.cleanup === 'function') {
      try {
        activePageProxy.cleanup();
      } catch {}
    }
    if (overlayRef.current) {
      const canvases = overlayRef.current.querySelectorAll('canvas');
      canvases.forEach(c => {
        c.width = 0;
        c.height = 0;
      });
    }
    setActivePageProxy(null);
    setPageTextContent(null);
    setPageViewport(null);
  }, [pageNumber]);

  // Cleanup on complete component unmount
  useEffect(() => {
    return () => {
      if (activePageProxy && typeof activePageProxy.cleanup === 'function') {
        try {
          activePageProxy.cleanup();
        } catch {}
      }
    };
  }, [activePageProxy]);
  
  // Annotation State
  const [annotations, setAnnotations] = useState<Record<number, any[]>>({});
  const overlayRef = React.useRef<HTMLDivElement>(null);
  const notesRef = useRef(notes);
  const annotationsRef = useRef(annotations);
  const pendingTextRef = useRef(pendingText);
  const isDirtyRef = useRef(false);

  useEffect(() => {
    notesRef.current = notes;
    annotationsRef.current = annotations;
    pendingTextRef.current = pendingText;
  }, [notes, annotations, pendingText]);

  const getEventClientCoords = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    if ('touches' in e && e.touches.length > 0) {
      return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
    }
    if ('changedTouches' in e && e.changedTouches.length > 0) {
      return { clientX: e.changedTouches[0].clientX, clientY: e.changedTouches[0].clientY };
    }
    if ('clientX' in e) {
      return { clientX: (e as React.MouseEvent).clientX, clientY: (e as React.MouseEvent).clientY };
    }
    return null;
  };
  
  const handleUndo = () => {
    setAnnotations(prev => {
      const pageAnns = prev[pageNumber] || [];
      if (pageAnns.length === 0) return prev;
      isDirtyRef.current = true;
      return {
        ...prev,
        [pageNumber]: pageAnns.slice(0, -1)
      };
    });
  };

  const handleContainerMouseUp = (e: React.MouseEvent | React.TouchEvent) => {
    if (!overlayRef.current) return;
    const containerRect = overlayRef.current.getBoundingClientRect();
    const coords = getEventClientCoords(e);
    if (!coords) return;
    
    if (pdfTool === 'text') {
      if (pendingText) return; // Don't create a new box if they are just clicking to blur the current one

      const x = (coords.clientX - containerRect.left) / zoomLevel;
      const y = (coords.clientY - containerRect.top) / zoomLevel;
      setPendingText({ x, y, text: '', color: textColor, fontSize: 24 });
      return;
    }

    if (pdfTool === 'highlight') {
        // Now handled by pointer events
      }
  };
  
  const containerRef = React.useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    let rafId: number | null = null;
    let latestWidth: number | null = null;

    const handleGlobalMouseMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const rightEdge = rect.right;
      let clientX = 0;
      if ('touches' in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
      } else if ('clientX' in e) {
        clientX = (e as MouseEvent).clientX;
      }
      const newWidth = Math.max(200, Math.min(rightEdge - clientX, Math.max(200, rect.width - 300)));
      latestWidth = newWidth;

      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          if (latestWidth !== null) {
            setNotesWidth(latestWidth);
          }
          rafId = null;
        });
      }
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (latestWidth !== null) {
        setNotesWidth(latestWidth);
      }
    };
    
    if (isDragging) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
      window.addEventListener('touchmove', handleGlobalMouseMove, { passive: false });
      window.addEventListener('touchend', handleGlobalMouseUp);
    }
    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchmove', handleGlobalMouseMove);
      window.removeEventListener('touchend', handleGlobalMouseUp);
    };
  }, [isDragging]);

  const supabase = createClient();
  const prevNoteIdRef = useRef<string>(noteId);
  const prevNotePathRef = useRef<string | undefined>(notePath);

  // Reset or load annotations whenever noteId or initialNotesStr changes
  useEffect(() => {
    // If switching notes and previous note had dirty changes, flush save for previous note
    if (prevNoteIdRef.current && prevNoteIdRef.current !== noteId) {
      if (isDirtyRef.current) {
        flushPendingState(notesRef.current, annotationsRef.current, prevNoteIdRef.current, prevNotePathRef.current);
      }
      prevNoteIdRef.current = noteId;
      prevNotePathRef.current = notePath;

      if (initialNotesStr) {
        try {
          let parsed = typeof initialNotesStr === 'string' ? JSON.parse(initialNotesStr) : initialNotesStr;
          if (typeof parsed === 'string') {
            try {
              parsed = JSON.parse(parsed);
            } catch {}
          }
          if (parsed && typeof parsed === 'object') {
            setNotes(parsed.notes || (!parsed.annotations ? parsed : {}));
            setAnnotations(parsed.annotations || {});
          } else {
            setNotes({});
            setAnnotations({});
          }
        } catch (e) {
          console.error("Failed to parse initial pdf notes", e);
          setNotes({});
          setAnnotations({});
        }
      } else {
        setNotes({});
        setAnnotations({});
      }
      isDirtyRef.current = false;
    } else {
      // Same note: only update if not dirty to prevent race condition clobbering active edits
      prevNotePathRef.current = notePath;
      if (!isDirtyRef.current && initialNotesStr) {
        try {
          let parsed = typeof initialNotesStr === 'string' ? JSON.parse(initialNotesStr) : initialNotesStr;
          if (typeof parsed === 'string') {
            try {
              parsed = JSON.parse(parsed);
            } catch {}
          }
          if (parsed && typeof parsed === 'object') {
            const newNotes = parsed.notes || (!parsed.annotations ? parsed : {});
            const newAnnotations = parsed.annotations || {};
            if (JSON.stringify(newNotes) !== JSON.stringify(notesRef.current)) {
              setNotes(newNotes);
            }
            if (JSON.stringify(newAnnotations) !== JSON.stringify(annotationsRef.current)) {
              setAnnotations(newAnnotations);
            }
          }
        } catch {}
      }
    }
  }, [noteId, initialNotesStr, notePath]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
    setPageNumber(1);
  }

  const handleSave = async (forceNotes?: any, forceAnnotations?: any, targetNoteId?: string, targetNotePath?: string) => {
    let saveAnnotations = forceAnnotations !== undefined ? forceAnnotations : annotationsRef.current;
    
    // Commit any active pending text annotation before persisting
    if (pendingTextRef.current && pendingTextRef.current.text.trim()) {
      const pending = pendingTextRef.current;
      const newAnn = { id: Date.now(), type: 'text', ...pending };
      saveAnnotations = {
        ...saveAnnotations,
        [pageNumber]: [...(saveAnnotations[pageNumber] || []), newAnn]
      };
      setAnnotations(saveAnnotations);
      setPendingText(null);
      // setPdfTool('cursor');
    }

    const saveNotes = forceNotes !== undefined ? forceNotes : notesRef.current;
    const effNoteId = targetNoteId || noteId;
    const effNotePath = targetNotePath || notePath || effNoteId;
    setIsSaving(true);

    // Durable Offline WAL logging before network operations
    const walPayload = {
      noteId: effNoteId,
      notePath: effNotePath,
      pdfNotes: {
        notes: saveNotes,
        annotations: saveAnnotations
      }
    };

    let walId: string | null = null;
    try {
      walId = await recordMutation({
        type: 'SAVE_PDF_ANNOTATIONS',
        payload: walPayload
      });
    } catch (walErr) {
      console.warn('[OfflineWAL] Failed to record PDF annotations mutation:', walErr);
    }

    try {
      let currentNote: { id: string; content: string; path: string } | null = null;

      // 1. Try querying by id
      const { data: byId } = await supabase
        .from('vault_notes')
        .select('id, content, path')
        .eq('id', effNoteId)
        .maybeSingle();

      if (byId) {
        currentNote = byId;
      } else {
        // 2. Try querying by path
        const { data: byPath } = await supabase
          .from('vault_notes')
          .select('id, content, path')
          .eq('path', effNotePath)
          .maybeSingle();
        if (byPath) {
          currentNote = byPath;
        }
      }

      const notesJson = JSON.stringify({ notes: saveNotes, annotations: saveAnnotations });
      const baseContent = currentNote?.content || (pdfUrl ? `---\npdf_url: '${pdfUrl}'\n---\n` : '');
      const updatedContent = updateFrontmatterField(baseContent, 'pdf_notes', notesJson);

      if (currentNote) {
        const { error: updateError } = await supabase
          .from('vault_notes')
          .update({ 
            content: updatedContent, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', currentNote.id);

        if (updateError) {
          throw updateError;
        }
      }

      if (walId) {
        await markMutationSynced(walId);
      }

      if (onUpdateNote) {
        if (typeof onUpdateNote === 'function') {
          if (onUpdateNote.length > 1 && effNoteId) {
            (onUpdateNote as any)(effNoteId, { content: updatedContent });
          } else {
            (onUpdateNote as any)(updatedContent);
          }
        }
      }
      
      isDirtyRef.current = false;
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      console.error('Failed to save PDF notebook:', e);
      if (walId) {
        await markMutationFailed(walId, e?.message || 'Save failed');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const flushPendingState = useCallback((forceNotes?: any, forceAnnotations?: any, targetNoteId?: string, targetNotePath?: string) => {
    if (!isDirtyRef.current) return;

    let saveAnnotations = forceAnnotations !== undefined ? forceAnnotations : annotationsRef.current;
    
    // Commit any active pending text annotation before persisting
    if (pendingTextRef.current && pendingTextRef.current.text.trim()) {
      const pending = pendingTextRef.current;
      const newAnn = { id: Date.now(), type: 'text', ...pending };
      saveAnnotations = {
        ...saveAnnotations,
        [pageNumber]: [...(saveAnnotations[pageNumber] || []), newAnn]
      };
      annotationsRef.current = saveAnnotations;
      setAnnotations(saveAnnotations);
      setPendingText(null);
    }

    const saveNotes = forceNotes !== undefined ? forceNotes : notesRef.current;
    const effNoteId = targetNoteId || prevNoteIdRef.current || noteId;
    const effNotePath = targetNotePath || prevNotePathRef.current || notePath || effNoteId;

    if (!effNoteId && !effNotePath) return;

    const payload = {
      noteId: effNoteId,
      notePath: effNotePath,
      pdfNotes: {
        notes: saveNotes,
        annotations: saveAnnotations
      }
    };

    recordMutation({
      type: 'SAVE_PDF_ANNOTATIONS',
      payload
    }).catch(err => {
      console.warn('[OfflineWAL] flushPendingState recordMutation warning:', err);
    });

    const payloadStr = JSON.stringify(payload);
    let beaconSent = false;
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      try {
        const blob = new Blob([payloadStr], { type: 'application/json' });
        beaconSent = navigator.sendBeacon('/api/obsidian/flush', blob);
      } catch (err) {
        beaconSent = false;
      }
    }

    if (!beaconSent && typeof fetch !== 'undefined') {
      try {
        fetch('/api/obsidian/flush', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payloadStr,
          keepalive: true
        }).catch(() => {});
      } catch (err) {}
    }

    handleSave(saveNotes, saveAnnotations, effNoteId, effNotePath);
    isDirtyRef.current = false;
  }, [noteId, notePath, pageNumber]);

  useEffect(() => {
    if (!isDirtyRef.current) return;
    
    // Auto-save debounce (runs on any user mutation, including deletions)
    const timer = setTimeout(() => {
      handleSave();
    }, 1500);
    return () => clearTimeout(timer);
  }, [notes, annotations]);

  useEffect(() => {
    // Unmount & visibility change save using beacon flush
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && isDirtyRef.current) {
        flushPendingState();
      }
    };
    const handleBeforeUnload = () => {
      if (isDirtyRef.current) {
        flushPendingState();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (isDirtyRef.current) {
        flushPendingState();
      }
    };
  }, [flushPendingState]);

  // Keyboard shortcut Ctrl+S / Cmd+S to immediately save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const currentNote = notes[pageNumber] || { text: "", lang: "en" };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (pdfTool === 'highlight' && highlightMode === 'text') {
        setTimeout(() => {
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0 && selection.toString().trim().length > 0) {
            const range = selection.getRangeAt(0);
            if (!overlayRef.current) return;
            const containerRect = overlayRef.current.getBoundingClientRect();

            // 1. Collect only valid trimmed text sub-ranges inside actual textLayer spans
            const rawRects: { left: number; top: number; width: number; height: number; right: number; bottom: number }[] = [];
            const textNodes: Text[] = [];
            const root = range.commonAncestorContainer;

            if (root.nodeType === Node.TEXT_NODE) {
              if (root.textContent && root.textContent.trim()) {
                textNodes.push(root as Text);
              }
            } else {
              const walker = document.createTreeWalker(
                root,
                NodeFilter.SHOW_TEXT,
                {
                  acceptNode(node) {
                    if (!range.intersectsNode(node)) return NodeFilter.FILTER_REJECT;
                    const parentSpan = node.parentElement?.closest('.textLayer span, .arabic-text-layer span, .react-pdf__Page__textContent span');
                    if (!parentSpan) return NodeFilter.FILTER_REJECT;
                    if (!node.textContent || !node.textContent.trim()) return NodeFilter.FILTER_REJECT;
                    return NodeFilter.FILTER_ACCEPT;
                  }
                }
              );
              let curr = walker.nextNode();
              while (curr) {
                textNodes.push(curr as Text);
                curr = walker.nextNode();
              }
            }

            // Fallback: If no text nodes caught via walker, find intersecting text spans directly
            if (textNodes.length === 0) {
              const candidateSpans = overlayRef.current.parentElement?.querySelectorAll('.textLayer span, .arabic-text-layer span, .react-pdf__Page__textContent span') || [];
              candidateSpans.forEach(span => {
                if (range.intersectsNode(span)) {
                  span.childNodes.forEach(child => {
                    if (child.nodeType === Node.TEXT_NODE && child.textContent?.trim() && range.intersectsNode(child)) {
                      textNodes.push(child as Text);
                    }
                  });
                }
              });
            }

            // Extract exact word-level sub-ranges (strictly non-whitespace)
            for (const textNode of textNodes) {
              const parentSpan = textNode.parentElement?.closest('span');
              const spanBounding = parentSpan ? parentSpan.getBoundingClientRect() : null;

              const fullContent = textNode.textContent || '';
              const nodeLength = fullContent.length;
              let startOffset = 0;
              let endOffset = nodeLength;

              if (textNode === range.startContainer) {
                startOffset = Math.max(0, range.startOffset);
              }
              if (textNode === range.endContainer) {
                endOffset = Math.min(nodeLength, range.endOffset);
              }

              if (startOffset >= endOffset) continue;

              const slice = fullContent.substring(startOffset, endOffset);
              const wordRegex = /\S+/g;
              let match: RegExpExecArray | null;

              while ((match = wordRegex.exec(slice)) !== null) {
                const wStart = startOffset + match.index;
                const wEnd = wStart + match[0].length;

                try {
                  const wordRange = document.createRange();
                  wordRange.setStart(textNode, wStart);
                  wordRange.setEnd(textNode, wEnd);

                  const wordRects = Array.from(wordRange.getClientRects());
                  for (const r of wordRects) {
                    if (r.width < 1.5 || r.height < 1.5) continue;

                    let clampedLeft = r.left;
                    let clampedRight = r.right;
                    if (spanBounding) {
                      clampedLeft = Math.max(spanBounding.left, clampedLeft);
                      clampedRight = Math.min(spanBounding.right, clampedRight);
                    }
                    const clampedWidth = clampedRight - clampedLeft;
                    if (clampedWidth < 1.5) continue;

                    rawRects.push({
                      left: clampedLeft,
                      top: r.top,
                      width: clampedWidth,
                      height: r.height,
                      right: clampedRight,
                      bottom: r.bottom
                    });
                  }
                } catch (e) {
                  // Ignore DOM range boundary exceptions
                }
              }
            }

            // Fallback to direct client rects if no word sub-ranges found
            if (rawRects.length === 0) {
              const fallbackRects = Array.from(range.getClientRects()).filter(r => r.width >= 2 && r.height >= 2);
              for (const r of fallbackRects) {
                rawRects.push({
                  left: r.left,
                  top: r.top,
                  width: r.width,
                  height: r.height,
                  right: r.right,
                  bottom: r.bottom
                });
              }
            }

            if (rawRects.length === 0) return;

            // 2. Mathematically compress vertical height (45% of raw font bounding box, capped at 16px at 1.0 zoom)
            const processedRects = rawRects.map(rect => {
              const compHeight = Math.min(rect.height * 0.45, 16 * zoomLevel);
              const compTop = rect.top + (rect.height - compHeight) * 0.65;

              return {
                left: (rect.left - containerRect.left) / zoomLevel,
                top: (compTop - containerRect.top) / zoomLevel,
                width: rect.width / zoomLevel,
                height: compHeight / zoomLevel,
                right: (rect.right - containerRect.left) / zoomLevel,
                bottom: (compTop + compHeight - containerRect.top) / zoomLevel,
              };
            });

            // 3. Sort by line (top), then horizontal (left)
            processedRects.sort((a, b) => {
              if (Math.abs(a.top - b.top) < (a.height * 0.6)) {
                return a.left - b.left;
              }
              return a.top - b.top;
            });

            // 4. Merge adjacent word fragments on the same line if gap is small
            const mergedRects: typeof processedRects = [];
            for (const r of processedRects) {
              const prev = mergedRects[mergedRects.length - 1];
              if (prev && Math.abs(prev.top - r.top) < (prev.height * 0.6)) {
                const gap = Math.max(0, r.left - prev.right);
                const maxAllowedGap = Math.max(prev.height, r.height) * 1.5;

                if (gap <= maxAllowedGap) {
                  const newLeft = Math.min(prev.left, r.left);
                  const newRight = Math.max(prev.right, r.right);
                  const newTop = Math.min(prev.top, r.top);
                  const newBottom = Math.max(prev.bottom, r.bottom);
                  prev.left = newLeft;
                  prev.right = newRight;
                  prev.top = newTop;
                  prev.bottom = newBottom;
                  prev.width = newRight - newLeft;
                  prev.height = newBottom - newTop;
                  continue;
                }
              }
              mergedRects.push({ ...r });
            }

            let saveAnnotations = { ...annotationsRef.current };
            const newAnns = mergedRects.map((r, i) => ({
              id: Date.now() + i,
              type: 'highlight',
              startX: r.left,
              startY: r.top,
              w: r.width,
              h: r.height,
              color: highlightColor,
              text: selection.toString()
            }));

            saveAnnotations = {
              ...saveAnnotations,
              [pageNumber]: [...(saveAnnotations[pageNumber] || []), ...newAnns]
            };

            isDirtyRef.current = true;
            setAnnotations(saveAnnotations);
            selection.removeAllRanges();
          }
        }, 50);
      }
    };
    
    document.addEventListener('pointerup', handleGlobalMouseUp);
    document.addEventListener('touchend', handleGlobalMouseUp);
    return () => {
      document.removeEventListener('pointerup', handleGlobalMouseUp);
      document.removeEventListener('touchend', handleGlobalMouseUp);
    };
  }, [pdfTool, highlightMode, pageNumber, zoomLevel, highlightColor]);

  const toolsPortal = typeof document !== 'undefined' ? document.getElementById('pdf-tools-portal') : null;

  return (
    <div ref={containerRef} className={`flex w-full flex-1 h-full min-h-[500px] border rounded-2xl overflow-hidden shadow-inner ${isDark ? 'border-[var(--theme-border)] bg-[var(--theme-surface)]' : 'border-gray-200 bg-gray-100'}`}>
      <style>{`
        .react-pdf__Page__textContent, .textLayer {
          line-height: 1 !important;
          pointer-events: none !important;
          user-select: none !important;
          -webkit-user-select: none !important;
        }
        .react-pdf__Page__textContent > span, .textLayer span {
          line-height: 1 !important;
          vertical-align: baseline !important;
          display: inline-block !important;
          pointer-events: auto !important;
          user-select: text !important;
          -webkit-user-select: text !important;
        }
        .react-pdf__Page__textContent br, .textLayer br,
        .react-pdf__Page__textContent .endOfContent, .textLayer .endOfContent {
          user-select: none !important;
          -webkit-user-select: none !important;
          pointer-events: none !important;
          display: none !important;
        }
      `}</style>
       
       {/* PDF Viewer Side */}
       <div 
          className={`flex-1 h-full overflow-auto custom-scrollbar flex flex-col py-6 px-6 relative bg-black/20 ${(pdfTool === 'pan' || (pdfTool === 'highlight' && highlightMode === 'box')) ? 'touch-none' : ''}`}
          onPointerDown={(e) => {
            if ((e.target as HTMLElement).closest('button, input, select, .pointer-events-auto')) return;
            if (pdfTool === 'pan') {
              e.preventDefault();
              const container = e.currentTarget;
              if (e.pointerId) container.setPointerCapture(e.pointerId);
              const startX = e.clientX;
              const startY = e.clientY;
              const startScrollLeft = container.scrollLeft;
              const startScrollTop = container.scrollTop;
              
              const handleMove = (ev: any) => {
                container.scrollLeft = startScrollLeft - (ev.clientX - startX);
                container.scrollTop = startScrollTop - (ev.clientY - startY);
              };
              const handleUp = (ev: any) => {
                try {
                  if (ev.pointerId && container.hasPointerCapture && container.hasPointerCapture(ev.pointerId)) {
                    container.releasePointerCapture(ev.pointerId);
                  }
                } catch (err) {}
                window.removeEventListener('pointermove', handleMove);
                window.removeEventListener('pointerup', handleUp);
                window.removeEventListener('pointercancel', handleUp);
              };
              window.addEventListener('pointermove', handleMove);
              window.addEventListener('pointerup', handleUp);
              window.addEventListener('pointercancel', handleUp);
            }
          }}
          style={{ cursor: pdfTool === 'pan' ? 'grab' : 'default' }}
        >
          {/* PDF Toolbar rendered in portal */}
          {toolsPortal && createPortal(
             <div className="flex items-center gap-1 sm:gap-1.5">
               {viewerEngine === 'pdfjs' && (
                 <>
                   <button 
                     onClick={() => setPdfTool('pan')} 
                     className={`p-1.5 rounded-lg transition-all active:scale-[0.98] ${
                       pdfTool === 'pan' 
                         ? 'text-[var(--theme-primary)] bg-[var(--theme-primary)]/20 border border-[var(--theme-primary)]/30' 
                         : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-surface)]'
                     }`} 
                     title="Pan Tool"
                     aria-label="Pan Tool"
                   >
                     <Hand size={16}/>
                   </button>
                   <button 
                     onClick={() => setPdfTool('cursor')} 
                     className={`p-1.5 rounded-lg transition-all active:scale-[0.98] ${
                       pdfTool === 'cursor' 
                         ? 'bg-[var(--theme-primary)]/20 text-[var(--theme-primary)] border border-[var(--theme-primary)]/30' 
                         : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-surface)]'
                     }`} 
                     title="Pointer Tool"
                     aria-label="Pointer Tool"
                   >
                     <MousePointer2 size={16}/>
                   </button>
                   <button 
                     onClick={() => setPdfTool('highlight')} 
                     className={`p-1.5 rounded-lg transition-all active:scale-[0.98] ${
                       pdfTool === 'highlight' 
                         ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
                         : 'text-[var(--theme-text-muted)] hover:text-yellow-400 hover:bg-[var(--theme-surface)]'
                     }`} 
                     title="Highlighter Tool"
                     aria-label="Highlighter Tool"
                   >
                     <Highlighter size={16}/>
                   </button>
                   
                   <button 
                     onClick={() => setPdfTool('text')} 
                     className={`p-1.5 rounded-lg transition-all active:scale-[0.98] ${
                       pdfTool === 'text' 
                         ? 'bg-[var(--theme-primary)]/20 text-[var(--theme-primary)] border border-[var(--theme-primary)]/30' 
                         : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-surface)]'
                     }`} 
                     title="Text Note Tool"
                     aria-label="Text Note Tool"
                   >
                     <Type size={16}/>
                   </button>

                   {pdfTool === 'highlight' && (
                       <div className="flex items-center gap-1 mx-1 bg-[var(--theme-surface-subtle)] border border-[var(--theme-border)] rounded-lg p-1">
                         <button 
                           onPointerDown={(e) => e.preventDefault()} 
                           onClick={() => setHighlightMode(m => m === 'box' ? 'text' : 'box')} 
                           className={`flex items-center gap-1 px-2 py-0.5 mr-1 rounded border border-[var(--theme-border)] bg-[var(--theme-surface-elevated)] text-xs font-bold text-[var(--theme-text-primary)] transition-all hover:bg-[var(--theme-surface)] active:scale-[0.98]`}
                           title={highlightMode === 'box' ? "Switch to Text Selection Mode" : "Switch to Box Drawing Mode"}
                         >
                           {highlightMode === 'box' ? <Square size={12}/> : <Baseline size={12}/>}
                           <span className="hidden sm:inline">{highlightMode === 'box' ? 'Box' : 'Text'}</span>
                         </button>
                         {['#fef08a', '#bbf7d0', '#bfdbfe', '#fbcfe8', '#fed7aa', '#e9d5ff'].map(c => (
                           <button 
                             key={c} 
                             onPointerDown={(e) => e.preventDefault()} 
                             onClick={() => setHighlightColor(c)} 
                             className={`w-4 h-4 rounded-full border ${highlightColor === c ? 'border-white scale-125' : 'border-transparent hover:scale-110'} transition-all`} 
                             style={{ backgroundColor: c }} 
                           />
                         ))}
                       </div>
                   )}
                   {pdfTool === 'text' && (
                       <div className="flex items-center gap-1 mx-1 bg-[var(--theme-surface-subtle)] border border-[var(--theme-border)] rounded-lg p-1">
                         {['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#9333ea', '#ec4899', '#ffffff', '#000000'].map(c => (
                           <button 
                             key={c} 
                             onPointerDown={(e) => e.preventDefault()} 
                             onClick={() => { setTextColor(c); if (pendingText) setPendingText({ ...pendingText, color: c }); }} 
                             className={`w-4 h-4 rounded-full border ${textColor === c ? 'border-white scale-125' : 'border-transparent hover:scale-110'} transition-all`} 
                             style={{ backgroundColor: c }} 
                           />
                         ))}
                       </div>
                   )}
                   
                   <button 
                     onClick={() => setPdfTool('eraser')} 
                     className={`p-1.5 rounded-lg transition-all active:scale-[0.98] ${
                       pdfTool === 'eraser' 
                         ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' 
                         : 'text-[var(--theme-text-muted)] hover:text-pink-400 hover:bg-[var(--theme-surface)]'
                     }`} 
                     title="Eraser Tool"
                     aria-label="Eraser Tool"
                   >
                     <Eraser size={16}/>
                   </button>
                   <button 
                     onClick={handleUndo} 
                     className="p-1.5 rounded-lg transition-all active:scale-[0.98] text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-surface)]" 
                     title="Undo Annotation"
                     aria-label="Undo"
                   >
                     <Undo2 size={16}/>
                   </button>
                 </>
               )}

               <div className="w-px h-4 bg-[var(--theme-border)] mx-1"></div>

               <button 
                 onClick={() => setViewerEngine(v => v === 'pdfjs' ? 'native' : 'pdfjs')} 
                 className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all active:scale-[0.98] border ${
                   viewerEngine === 'native' 
                     ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                     : 'bg-[var(--theme-surface-subtle)] text-[var(--theme-text-secondary)] border-[var(--theme-border)] hover:bg-[var(--theme-surface)] hover:text-[var(--theme-text-primary)]'
                 }`} 
                 title="Toggle PDF Engine (Native Browser vs Interactive)"
               >
                 <Eye size={14}/>
                 <span className="text-xs font-bold hidden sm:inline">{viewerEngine === 'native' ? 'Native' : 'Interactive'}</span>
               </button>

               <div className="w-px h-4 bg-[var(--theme-border)] mx-1"></div>

               <button 
                 onClick={() => setShowNotes(!showNotes)} 
                 className={`p-1.5 rounded-lg transition-all active:scale-[0.98] ${
                   showNotes 
                     ? 'text-[var(--theme-primary)] bg-[var(--theme-primary)]/20 border border-[var(--theme-primary)]/30' 
                     : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-surface)]'
                 }`} 
                 title="Toggle Notes Panel"
                 aria-label="Toggle Notes"
               >
                 <Sidebar size={16}/>
               </button>

               <div className="w-px h-4 bg-[var(--theme-border)] mx-1"></div>
               
               <button 
                 onClick={() => setZoomLevel(z => Math.max(z - 0.25, 0.5))} 
                 className="p-1.5 rounded-lg transition-all active:scale-[0.98] text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-surface)]" 
                 title="Zoom Out"
                 aria-label="Zoom Out"
               >
                 <ZoomOut size={16}/>
               </button>
               <div className="text-xs font-mono text-[var(--theme-text-secondary)] font-bold min-w-[36px] text-center">{Math.round(zoomLevel * 100)}%</div>
               <button 
                 onClick={() => setZoomLevel(z => Math.min(z + 0.25, 3.0))} 
                 className="p-1.5 rounded-lg transition-all active:scale-[0.98] text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-surface)]" 
                 title="Zoom In"
                 aria-label="Zoom In"
               >
                 <ZoomIn size={16}/>
               </button>
             </div>,
             toolsPortal
          )}

         {viewerEngine === 'native' ? (
           <iframe src={`${pdfUrl}#toolbar=0`} className="w-full h-full flex-1 border-0 bg-transparent rounded-xl" title="PDF Native Viewer" />
         ) : (
         <div className="w-fit mx-auto relative flex flex-col items-center">
           <Document 
              file={resolvedPdfSource} 
              options={options}
              onLoadSuccess={onDocumentLoadSuccess} 
              loading={<div className="text-slate-400 font-mono text-sm animate-pulse flex h-full items-center">Loading Document...</div>}
              className="drop-shadow-2xl"
           >
           
           
            <div className="relative inline-block shadow-2xl" ref={overlayRef} 
                  onPointerDown={(e) => {
                    if (pdfTool === 'text') {
                      // let handleContainerMouseUp handle it
                    }
                    if (pdfTool === 'highlight' && highlightMode === 'box') {
                      e.preventDefault();
                      const coords = getEventClientCoords(e);
                      if (!coords) return;
                      const containerRect = e.currentTarget.getBoundingClientRect();
                      const x = (coords.clientX - containerRect.left) / zoomLevel;
                      const y = (coords.clientY - containerRect.top) / zoomLevel;
                      setHighlightStart({ x, y });
                      setHighlightCurrent({ x, y });
                    }
                  }}
                  onPointerMove={(e) => {
                    if (pdfTool === 'highlight' && highlightMode === 'box' && highlightStart) {
                      e.preventDefault();
                      const coords = getEventClientCoords(e);
                      if (!coords) return;
                      const containerRect = e.currentTarget.getBoundingClientRect();
                      const x = (coords.clientX - containerRect.left) / zoomLevel;
                      const y = (coords.clientY - containerRect.top) / zoomLevel;
                      setHighlightCurrent({ x, y });
                    }
                  }}
                  onPointerUp={(e) => {
                    if (pdfTool === 'text') {
                      handleContainerMouseUp(e as any);
                    }
                    if (pdfTool === 'highlight' && highlightMode === 'box' && highlightStart && highlightCurrent) {
                      const newAnn = {
                        id: Date.now(),
                        type: 'highlight',
                        startX: Math.min(highlightStart.x, highlightCurrent.x),
                        startY: Math.min(highlightStart.y, highlightCurrent.y),
                        w: Math.abs(highlightCurrent.x - highlightStart.x),
                        h: Math.abs(highlightCurrent.y - highlightStart.y),
                        color: highlightColor
                      };
                      isDirtyRef.current = true;
                      setAnnotations(prev => ({
                        ...prev,
                        [pageNumber]: [...(prev[pageNumber] || []), newAnn]
                      }));
                      setHighlightStart(null);
                      setHighlightCurrent(null);
                      // setPdfTool('cursor');
                    }
                  }} style={{ cursor: pdfTool === 'text' ? 'text' : pdfTool === 'highlight' ? 'crosshair' : pdfTool === 'eraser' ? 'crosshair' : 'default' }}>
              <div className="absolute inset-0 z-20" style={{ pointerEvents: (pdfTool === "eraser" || (pdfTool === "highlight" && highlightMode === "box") || pdfTool === "text") ? "auto" : "none" }}>
                {highlightStart && highlightCurrent && (
                  <div 
                    className="absolute border-2 border-yellow-400 bg-yellow-400/20"
                    style={{
                      left: Math.min(highlightStart.x, highlightCurrent.x) * zoomLevel,
                      top: Math.min(highlightStart.y, highlightCurrent.y) * zoomLevel,
                      width: Math.abs(highlightCurrent.x - highlightStart.x) * zoomLevel,
                      height: Math.abs(highlightCurrent.y - highlightStart.y) * zoomLevel
                    }}
                  />
                )}
                {(annotations[pageNumber] || []).map(ann => {
                  if (ann.type === 'highlight') {
                    const w = Math.abs(ann.w) * zoomLevel;
                    const rawH = Math.abs(ann.h);
                    // Slim height normalization:
                    // Compresses bloated font boxes (>18px unscaled) down to ~45% and shifts down to text baseline
                    const slimH = rawH > 18 ? Math.max(13, rawH * 0.45) : rawH;
                    const shiftY = (rawH - slimH) * 0.65;
                    const h = slimH * zoomLevel;
                    const left = ann.startX * zoomLevel;
                    const top = (ann.startY + shiftY) * zoomLevel;
                    return (
                      <div 
                        key={ann.id} 
                        onMouseDown={(e) => { if (pdfTool === 'eraser') { e.stopPropagation(); isDirtyRef.current = true; setAnnotations(p => ({ ...p, [pageNumber]: (p[pageNumber] || []).filter(a => a.id !== ann.id) })); } }} 
                        onTouchStart={(e) => { if (pdfTool === 'eraser') { e.stopPropagation(); isDirtyRef.current = true; setAnnotations(p => ({ ...p, [pageNumber]: (p[pageNumber] || []).filter(a => a.id !== ann.id) })); } }} 
                        className={`absolute ${pdfTool === 'eraser' ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'}`} 
                        style={{ 
                          backgroundColor: (ann.color && ann.color.length === 7) ? ann.color + '80' : (ann.color || '#facc1580'), 
                          left, 
                          top, 
                          width: w, 
                          height: h,
                          borderRadius: '3px',
                          mixBlendMode: 'multiply'
                        }} 
                        title={ann.text} 
                      />
                    );
                  }
                  if (ann.type === 'text') {
                    return (
                      <div 
                        key={ann.id} 
                        onMouseDown={(e) => { if (pdfTool === 'eraser') { e.stopPropagation(); isDirtyRef.current = true; setAnnotations(p => ({ ...p, [pageNumber]: (p[pageNumber] || []).filter(a => a.id !== ann.id) })); } else if (pdfTool === 'cursor' || pdfTool === 'text') { e.stopPropagation(); setPendingText({ x: ann.x, y: ann.y, text: ann.text, color: ann.color, fontSize: ann.fontSize || 24, id: ann.id }); setAnnotations(p => ({ ...p, [pageNumber]: (p[pageNumber] || []).filter(a => a.id !== ann.id) })); } }} 
                        onTouchStart={(e) => { if (pdfTool === 'eraser') { e.stopPropagation(); isDirtyRef.current = true; setAnnotations(p => ({ ...p, [pageNumber]: (p[pageNumber] || []).filter(a => a.id !== ann.id) })); } else if (pdfTool === 'cursor' || pdfTool === 'text') { e.stopPropagation(); setPendingText({ x: ann.x, y: ann.y, text: ann.text, color: ann.color, fontSize: ann.fontSize || 24, id: ann.id }); setAnnotations(p => ({ ...p, [pageNumber]: (p[pageNumber] || []).filter(a => a.id !== ann.id) })); } }} 
                        className={`absolute font-bold bg-transparent px-2 py-1 whitespace-pre select-none ${(pdfTool === 'eraser' || pdfTool === 'cursor' || pdfTool === 'text') ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'}`} 
                        style={{ 
                          left: ann.x * zoomLevel, 
                          top: ann.y * zoomLevel, 
                          fontSize: `${Math.max(12, Math.round((ann.fontSize || 24) * zoomLevel))}px`,
                          lineHeight: 1.2,
                          fontFamily: (ann.text || '').match(/[\u0600-\u06FF]/) ? 'var(--font-lemonada)' : 'var(--font-caveat)', 
                          color: ann.color || '#9333ea',
                          pointerEvents: (pdfTool === 'eraser' || pdfTool === 'cursor' || pdfTool === 'text') ? 'auto' : 'none'
                        }} 
                        dir="auto"
                      >
                        {ann.text}
                      </div>
                    );
                  }
                  return null;
                })}

                {pendingText && (
                  <div 
                    className="absolute z-50 flex flex-col gap-1 pointer-events-none"
                    style={{ 
                      left: pendingText.x * zoomLevel, 
                      top: pendingText.y * zoomLevel - 30
                    }}
                  >
                    <div className="flex items-center gap-1 bg-slate-800 p-1 rounded shadow-lg pointer-events-auto border border-slate-700 w-max">
                      <button 
                        onPointerDown={(e) => e.preventDefault()}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPendingText({ ...pendingText, fontSize: Math.max(12, (pendingText.fontSize || 24) - 2) }); }}
                        className="w-6 h-6 flex items-center justify-center rounded bg-slate-700 text-white hover:bg-slate-600 text-xs font-bold"
                      >A-</button>
                      <button 
                        onPointerDown={(e) => e.preventDefault()}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPendingText({ ...pendingText, fontSize: Math.min(72, (pendingText.fontSize || 24) + 2) }); }}
                        className="w-6 h-6 flex items-center justify-center rounded bg-slate-700 text-white hover:bg-slate-600 text-xs font-bold"
                      >A+</button>
                      <div 
                        onPointerDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (e.pointerId) e.currentTarget.setPointerCapture(e.pointerId);
                          const startX = e.clientX;
                          const startY = e.clientY;
                          const startPX = pendingText.x;
                          const startPY = pendingText.y;
                          const handleMove = (ev: any) => {
                             setPendingText(p => p ? { ...p, x: startPX + (ev.clientX - startX) / zoomLevel, y: startPY + (ev.clientY - startY) / zoomLevel } : p);
                          };
                          const handleUp = (ev: any) => {
                             try {
                               if (ev.pointerId && ev.currentTarget && typeof ev.currentTarget.releasePointerCapture === 'function') {
                                 ev.currentTarget.releasePointerCapture(ev.pointerId);
                               }
                             } catch (err) {}
                             window.removeEventListener('pointermove', handleMove);
                             window.removeEventListener('pointerup', handleUp);
                             window.removeEventListener('pointercancel', handleUp);
                          };
                          window.addEventListener('pointermove', handleMove);
                          window.addEventListener('pointerup', handleUp);
                          window.addEventListener('pointercancel', handleUp);
                        }}
                        className="px-2 h-6 flex items-center justify-center rounded bg-purple-600 text-white hover:bg-purple-500 text-xs font-bold cursor-move touch-none"
                      >
                        Drag to Move
                      </div>
                    </div>
                    <input
                      autoFocus
                      type="text"
                      dir="auto"
                      value={pendingText.text}
                      onChange={(e) => setPendingText({ ...pendingText, text: e.target.value })}
                      onBlur={() => {
                        if (pendingText.text.trim()) {
                          isDirtyRef.current = true;
                          setAnnotations(prev => ({
                            ...prev,
                            [pageNumber]: [...(prev[pageNumber] || []), { id: pendingText.id || Date.now(), type: 'text', ...pendingText }]
                          }));
                        }
                        setPendingText(null);
                        // setPdfTool('cursor');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.currentTarget.blur();
                        }
                        if (e.key === 'Escape') {
                          setPendingText(null);
                          // setPdfTool('cursor');
                        }
                      }}
                      className="font-bold bg-transparent px-2 py-1 border-2 border-dashed border-purple-500/50 outline-none pointer-events-auto min-w-[150px]"
                      style={{ 
                        marginTop: '30px',
                        fontSize: `${Math.max(12, Math.round((pendingText.fontSize || 24) * zoomLevel))}px`,
                        lineHeight: 1.2,
                        fontFamily: pendingText.text.match(/[\u0600-\u06FF]/) ? 'var(--font-lemonada)' : 'var(--font-caveat)',
                        color: pendingText.color || textColor
                      }}
                    />
                  </div>
                )}
              </div>
              {/* Custom High-Precision Arabic RTL Text Layer */}
              <ArabicTextLayer
                pageNumber={pageNumber}
                viewport={pageViewport}
                textContent={pageTextContent}
                scale={zoomLevel}
                page={activePageProxy}
              />
              <Page devicePixelRatio={Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2)} 
                pageNumber={pageNumber} 
                renderTextLayer={false} 
                renderAnnotationLayer={true} 
                scale={zoomLevel} 
                onLoadSuccess={handlePageLoadSuccess}
                className="rounded-lg overflow-hidden shadow-2xl transition-transform duration-300 transform-gpu"
              />
            </div>
          </Document>
        </div>
      )}
           
      {viewerEngine === 'pdfjs' && numPages && !isMobileOrTabletVertical && (
        <div className="sticky bottom-6 mt-6 left-1/2 -translate-x-1/2 w-max flex items-center gap-3 bg-[var(--theme-surface-elevated)]/90 backdrop-blur-md px-4 py-2 rounded-full border border-[var(--theme-border)] shadow-xl z-50 text-[var(--theme-text-primary)]">
          <button 
            onClick={() => setPageNumber(p => Math.max(1, p - 1))} 
            disabled={pageNumber <= 1} 
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--theme-text-primary)] disabled:opacity-30 hover:bg-[var(--theme-surface-subtle)] active:scale-95 rounded-full transition-all"
            aria-label="Previous page"
            title="Previous page"
          >
            <ChevronLeft size={20}/>
          </button>
          
          <div className="flex items-center gap-2 text-xs tracking-widest font-bold uppercase text-[var(--theme-text-secondary)]">
            <span>Page</span>
            <input 
              type="number" 
              min={1} 
              max={numPages || 1} 
              value={pageNumber} 
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (!isNaN(val)) setPageNumber(Math.min(Math.max(1, val), numPages || 1));
              }}
              className="w-12 text-center bg-[var(--theme-surface-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] rounded py-1 outline-none focus:border-[var(--theme-primary)] focus:ring-1 focus:ring-[var(--theme-primary)] transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-mono"
            />
            <span>/ {numPages}</span>
          </div>

          <button 
            onClick={() => setPageNumber(p => Math.min(numPages || 1, p + 1))} 
            disabled={pageNumber >= (numPages||1)} 
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--theme-text-primary)] disabled:opacity-30 hover:bg-[var(--theme-surface-subtle)] active:scale-95 rounded-full transition-all"
            aria-label="Next page"
            title="Next page"
          >
            <ChevronRight size={20}/>
          </button>
        </div>
      )}

      {/* Mobile & Vertical Tablet Ergonomic Floating Navigation Pill */}
      {viewerEngine === 'pdfjs' && numPages && isMobileOrTabletVertical && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 p-1.5 rounded-2xl bg-zinc-950/90 border border-white/15 backdrop-blur-xl shadow-2xl text-xs max-w-[94vw] animate-in fade-in slide-in-from-bottom-2">
          <button 
            onClick={() => setPageNumber(p => Math.max(1, p - 1))} 
            disabled={pageNumber <= 1} 
            className="p-2 rounded-xl bg-white/5 disabled:opacity-30 active:scale-95 text-white"
            title="Previous Page"
          >
            <ChevronLeft size={16}/>
          </button>
          <span className="px-2 font-mono font-bold text-zinc-300">
            {pageNumber} / {numPages || 1}
          </span>
          <button 
            onClick={() => setPageNumber(p => Math.min(numPages || 1, p + 1))} 
            disabled={pageNumber >= (numPages||1)} 
            className="p-2 rounded-xl bg-white/5 disabled:opacity-30 active:scale-95 text-white"
            title="Next Page"
          >
            <ChevronRight size={16}/>
          </button>

          <div className="w-px h-4 bg-white/10 mx-0.5" />

          <button 
            onClick={fitToWidth} 
            className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 font-semibold text-zinc-300 flex items-center gap-1"
            title="Fit Page to Width"
          >
            <Maximize2 size={13}/>
            <span>Fit</span>
          </button>

          <button 
            onClick={() => setZoomLevel(z => Math.max(0.4, Number((z - 0.15).toFixed(2))))}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-zinc-300"
            title="Zoom Out"
          >
            <ZoomOut size={15}/>
          </button>
          <span className="text-[11px] font-mono text-zinc-400 font-bold min-w-[32px] text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button 
            onClick={() => setZoomLevel(z => Math.min(2.5, Number((z + 0.15).toFixed(2))))}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-zinc-300"
            title="Zoom In"
          >
            <ZoomIn size={15}/>
          </button>

          <div className="w-px h-4 bg-white/10 mx-0.5" />

          <button 
            onClick={() => setShowNotes(s => !s)} 
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all active:scale-95 ${
              showNotes ? 'bg-[var(--theme-primary,#3b82f6)] text-white shadow-md' : 'bg-white/10 text-zinc-200 hover:bg-white/15'
            }`}
          >
            <Sparkles size={14}/>
            <span>AI / Notes</span>
          </button>
        </div>
      )}
    </div>

    {showNotes && (
      <>
        {/* Draggable Resizer - only on desktop horizontal layout */}
        {!isMobileOrTabletVertical && (
          <div 
            className="w-3 cursor-col-resize bg-transparent hover:bg-[var(--theme-primary)]/20 active:bg-[var(--theme-primary)]/40 transition-colors z-20 relative flex-shrink-0 group flex items-center justify-center" title="Drag to resize notebook pane"
            onMouseDown={(e) => { e.preventDefault(); setIsDragging(true); }} 
            onTouchStart={(e) => { e.preventDefault(); setIsDragging(true); }}
            aria-label="Resize Notes Panel"
          >
            <div className="w-1 h-12 bg-white/20 group-hover:bg-[var(--theme-primary)] group-hover:h-16 group-active:bg-[var(--theme-primary)] rounded-full transition-all pointer-events-none"></div>
          </div>
        )}

        {/* Handwriting / Markdown Notes & NotebookLM Panel */}
        <NotesPanel
          docId={noteId || notePath || 'current'}
          docTitle={noteTitle}
          documentContent={noteContent}
          pageContent={activePageText}
          apiKey={apiKey}
          pageNumber={pageNumber}
          notesWidth={notesWidth}
          isDark={isDark}
          initialNote={notes[pageNumber] || { text: '', lang: 'en' }}
          panelMode={isMobileOrTabletVertical ? 'drawer' : 'expanded'}
          onChange={(pg, noteData) => {
            isDirtyRef.current = true;
            setNotes(n => ({
              ...n,
              [pg]: noteData
            }));
          }}
          onDirty={() => {
            isDirtyRef.current = true;
          }}
          onClose={() => setShowNotes(false)}
          triggerMascot={triggerMascot}
        />
      </>
    )}
  </div>
  )
}
