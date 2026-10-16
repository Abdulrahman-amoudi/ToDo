'use client';

import React, { useEffect, useRef, useCallback, useId, useState } from 'react';
import { BotEngine } from '@/lib/bot/engine';
import { DEMI_VIEWBOX, RAYON } from '@/lib/bot/repere';
import { SHAPE_BY_ID, COLOR_BY_ID } from '@/lib/bot/skins';
import { EXPRESSION_BY_ID, type ExpressionId } from '@/lib/bot/expressions';
import { STATE_BY_ID, type StateId } from '@/lib/bot/states';
import {
  normalizeShape,
  normalizeExpression,
  resolveColor,
} from '@/constants/mascotRegistry';

export interface BloubMascotProps {
  size?: number;
  state?: StateId | string;
  color?: string;
  shape?: string;
  expression?: ExpressionId | string;
  gaze?: { yaw: number; pitch: number; roll?: number } | string;
  onInteract?: () => void;
  onClick?: (e?: React.MouseEvent) => void;
  isStatic?: boolean;
  animated?: boolean;
  isTyping?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export type Props = BloubMascotProps;

export const GAZE_PRESETS: Record<string, { yaw: number; pitch: number; roll: number }> = {
  center: { yaw: 0, pitch: 0, roll: 0 },
  left: { yaw: -28, pitch: 0, roll: 0 },
  right: { yaw: 28, pitch: 0, roll: 0 },
  up: { yaw: 0, pitch: 24, roll: 0 },
  down: { yaw: 0, pitch: -24, roll: 0 },
};

export function resolveGaze(
  g?: { yaw: number; pitch: number; roll?: number } | string | null
): { yaw: number; pitch: number; roll: number } | null {
  if (!g) return null;
  if (typeof g === 'object') {
    return { yaw: g.yaw ?? 0, pitch: g.pitch ?? 0, roll: g.roll ?? 0 };
  }
  return GAZE_PRESETS[g] ?? null;
}

function hexToRgba(hex: string, alpha: number): string {
  if (!hex || !hex.startsWith('#')) return `rgba(251, 191, 36, ${alpha})`;
  const clean = hex.replace('#', '');
  if (clean.length < 6) return `rgba(251, 191, 36, ${alpha})`;
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function generateSunburstPath(rays = 12, outerR = 98, innerR = 66): string {
  const points: string[] = [];
  const step = (Math.PI * 2) / rays;
  for (let i = 0; i < rays; i++) {
    const tipAngle = i * step - Math.PI / 2;
    const valAngle = tipAngle + step / 2;
    const prevValAngle = tipAngle - step / 2;
    const vx0 = (Math.cos(prevValAngle) * innerR).toFixed(1);
    const vy0 = (Math.sin(prevValAngle) * innerR).toFixed(1);
    const tx = (Math.cos(tipAngle) * outerR).toFixed(1);
    const ty = (Math.sin(tipAngle) * outerR).toFixed(1);
    const vx1 = (Math.cos(valAngle) * innerR).toFixed(1);
    const vy1 = (Math.sin(valAngle) * innerR).toFixed(1);
    if (i === 0) {
      points.push(`M ${vx0},${vy0} Q ${tx},${ty} ${vx1},${vy1}`);
    } else {
      points.push(`Q ${tx},${ty} ${vx1},${vy1}`);
    }
  }
  return points.join(' ') + ' Z';
}

const SUNBURST_PATH = generateSunburstPath(12, 98, 66);

const HEXAGONE_PATH =
  'M 29.0,-77.9 Q 45.0,-77.9 53.0,-64.1 L 82.0,-13.9 Q 90.0,0.0 82.0,13.9 L 53.0,64.1 Q 45.0,77.9 29.0,77.9 L -29.0,77.9 Q -45.0,77.9 -53.0,64.1 L -82.0,13.9 Q -90.0,0.0 -82.0,-13.9 L -53.0,-64.1 Q -45.0,-77.9 -29.0,-77.9 Z';

const SHAPE_ANIMATIONS: Record<string, { duration: number }> = {
  squircle: { duration: 1150 },
  cercle: { duration: 1150 },
  soleil: { duration: 1150 },
  livre: { duration: 1150 },
  hexagone: { duration: 1150 },
  nuage: { duration: 1150 },
  goutte: { duration: 1180 },
  galet: { duration: 1150 },
  capsule: { duration: 1180 },
  triangle: { duration: 1150 },
  oeuf: { duration: 1150 },
  fromage: { duration: 1180 },
};

export const BloubMascot = React.memo(function BloubMascot({
  size = 120,
  state = 'idle',
  color = 'ambre',
  shape = 'soleil',
  expression = 'neutre',
  gaze,
  onInteract,
  onClick,
  isStatic = false,
  animated = true,
  isTyping: propIsTyping,
  className = '',
  style = {},
}: Props) {
  const uid = useId().replace(/:/g, '');
  const maskId = `bot-mask-${uid}`;
  const VB = DEMI_VIEWBOX;
  const R = RAYON;

  const normShape = normalizeShape(shape);
  const normExpr = normalizeExpression(expression);

  const bodyHex =
    resolveColor(color) ||
    COLOR_BY_ID.get(color)?.hex ||
    (color.startsWith('#') ? color : '#fbbf24');
  const ink = bodyHex;
  const isBaseBodyActive = STATE_BY_ID.get(state as StateId)?.baseBody ?? true;

  const svgRef = useRef<SVGSVGElement>(null);
  const engineRef = useRef<BotEngine | null>(null);
  const rafRef = useRef<number>(0);
  const clockRef = useRef<number>(0);
  const lastRef = useRef<number>(0);
  const stateRef = useRef(state);
  const gazeRef = useRef(gaze);
  const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [isVisible, setIsVisible] = useState(true);
  const [internalTyping, setInternalTyping] = useState(false);
  const [isTapping, setIsTapping] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const currentDuration = SHAPE_ANIMATIONS[normShape]?.duration || 1200;

  useEffect(() => {
    gazeRef.current = gaze;
  }, [gaze]);

  useEffect(() => {
    return () => {
      if (animTimerRef.current) clearTimeout(animTimerRef.current);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, []);

  // Listen for user typing activity across all active inputs / window
  useEffect(() => {
    if (isStatic || !animated) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'].includes(e.key)) return;
      setInternalTyping(true);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        setInternalTyping(false);
      }, 950);
    };

    window.addEventListener('keydown', handleKeyDown, { passive: true });
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [isStatic, animated]);

  const activeTyping = propIsTyping ?? internalTyping;

  // Visibility Observer
  useEffect(() => {
    if (!svgRef.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      setIsVisible(entry.isIntersecting);
      if (entry.isIntersecting) {
        lastRef.current = 0; // Reset delta time to prevent physics explosions on wake
      }
    });
    observer.observe(svgRef.current);
    return () => observer.disconnect();
  }, []);

  // One-time init
  useEffect(() => {
    const shapeRadii = SHAPE_BY_ID.get(normShape)?.radii ?? null;
    const expr = EXPRESSION_BY_ID.get(normExpr as ExpressionId) ?? null;
    engineRef.current = new BotEngine(R, 'idle', shapeRadii, expr);
  }, []); // eslint-disable-line

  // React to `state` prop
  useEffect(() => {
    stateRef.current = state;
    if (engineRef.current) {
      if (state === 'orbit') {
        // Intercept orbit! Never pass orbit to BotEngine (prevents Groq spinning triangle morph).
        // Instead, trigger the shape's custom kinetic tap burst!
        setIsTapping(true);
        setTapCount((c) => c + 1);
        if (animTimerRef.current) clearTimeout(animTimerRef.current);
        animTimerRef.current = setTimeout(() => {
          setIsTapping(false);
        }, currentDuration);
      } else {
        engineRef.current.setState(state as StateId, clockRef.current);
      }
    }
  }, [state, currentDuration]);

  // React to `expression` prop
  useEffect(() => {
    if (engineRef.current) {
      const expr = EXPRESSION_BY_ID.get(normExpr as ExpressionId) ?? null;
      engineRef.current.setExpression(expr, clockRef.current, isStatic);
    }
  }, [normExpr, isStatic]);

  // React to `shape` prop
  useEffect(() => {
    if (engineRef.current) {
      const shapeRadii = SHAPE_BY_ID.get(normShape)?.radii ?? null;
      engineRef.current.setShape(shapeRadii, clockRef.current, isStatic);
    }
  }, [normShape, isStatic]);

  // React to resting `gaze` prop when state is idle
  useEffect(() => {
    if (engineRef.current && state === 'idle') {
      const target = resolveGaze(gaze);
      if (target) {
        engineRef.current.setLook(
          { yaw: target.yaw, pitch: target.pitch, mix: 0.7, spin: 0, wander: 0.15 },
          clockRef.current,
          0.25
        );
      } else {
        engineRef.current.setLook(null, clockRef.current, 0.4);
      }
    }
  }, [gaze, state]);

  // Pointer follow (window-wide, relative to mascot center)
  useEffect(() => {
    if (isStatic || !animated) return;

    const handleMove = (e: PointerEvent) => {
      if (!engineRef.current || !svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const maxDist = Math.max(window.innerWidth / 2, 250);
      const dx = (e.clientX - cx) / maxDist;
      const dy = (e.clientY - cy) / maxDist;
      const yaw = Math.max(-45, Math.min(45, dx * 45));
      const pitch = Math.max(-32, Math.min(32, -dy * 32));
      engineRef.current.setLook(
        { yaw, pitch, mix: 0.88, spin: 0, wander: 0.05 },
        clockRef.current,
        0.18
      );
    };

    const handleLeave = () => {
      engineRef.current?.setLook(null, clockRef.current, 0.5);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerdown', handleMove);
    window.addEventListener('pointerleave', handleLeave);
    window.addEventListener('pointercancel', handleLeave);

    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerdown', handleMove);
      window.removeEventListener('pointerleave', handleLeave);
      window.removeEventListener('pointercancel', handleLeave);
    };
  }, [isStatic, animated]);

  // Animation loop
  useEffect(() => {
    if (!isVisible) return;

    const tick = (ts: number) => {
      if (lastRef.current === 0) lastRef.current = ts;
      const dt = Math.min((ts - lastRef.current) / 1000, 0.1);
      lastRef.current = ts;
      clockRef.current += dt;
      const now = clockRef.current;

      if (!engineRef.current || !svgRef.current) {
        if (!isStatic) rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const frame = engineRef.current.sample(now);
      const svg = svgRef.current;

      // Body
      svg.querySelector('[data-body]')?.setAttribute('d', frame.bodyPath);
      svg.querySelector('[data-body]')?.setAttribute('fill', ink);
      svg.querySelector('[data-body]')?.setAttribute('opacity', String(frame.bodyAlpha));
      svg.querySelector('[data-mask-body]')?.setAttribute('d', frame.bodyPath);

      // Update dynamic live face for custom shapes (cercle, squircle, soleil, nuage, triangle, hexagone)
      const isCustomShape =
        normShape === 'cercle' ||
        normShape === 'squircle' ||
        normShape === 'soleil' ||
        normShape === 'nuage' ||
        normShape === 'triangle' ||
        normShape === 'hexagone';

      if (isCustomShape && svg) {
        let tx0 = -24, ty0 = -6, tx1 = 24, ty1 = -6;
        let k0 = 1, k1 = 1;
        if (frame.eyes && frame.eyes.length >= 2) {
          const p0 = frame.eyes[0].matrix.slice(7, -1).split(',');
          const p1 = frame.eyes[1].matrix.slice(7, -1).split(',');
          if (p0.length >= 6 && p1.length >= 6) {
            tx0 = parseFloat(p0[4]) || -24;
            ty0 = parseFloat(p0[5]) || -6;
            tx1 = parseFloat(p1[4]) || 24;
            ty1 = parseFloat(p1[5]) || -6;
            k0 = Math.abs(parseFloat(p0[3])) || 1;
            k1 = Math.abs(parseFloat(p1[3])) || 1;
          }
        }

        const shapeYOffset = normShape === 'triangle' ? 28 : 0;
        const ey0 = ty0 + shapeYOffset;
        const ey1 = ty1 + shapeYOffset;

        const eyeLeftEl = svg.querySelector('[data-live-eye-left]') as SVGGElement | null;
        if (eyeLeftEl) {
          eyeLeftEl.setAttribute('transform', `translate(${tx0.toFixed(1)}, ${ey0.toFixed(1)}) scale(1, ${k0.toFixed(2)})`);
        }
        const eyeRightEl = svg.querySelector('[data-live-eye-right]') as SVGGElement | null;
        if (eyeRightEl) {
          eyeRightEl.setAttribute('transform', `translate(${tx1.toFixed(1)}, ${ey1.toFixed(1)}) scale(1, ${k1.toFixed(2)})`);
        }
        const cheekLeftEl = svg.querySelector('[data-live-cheek-left]') as SVGCircleElement | null;
        if (cheekLeftEl) {
          cheekLeftEl.setAttribute('cx', (tx0 - 13).toFixed(1));
          cheekLeftEl.setAttribute('cy', (ey0 + 22).toFixed(1));
        }
        const cheekRightEl = svg.querySelector('[data-live-cheek-right]') as SVGCircleElement | null;
        if (cheekRightEl) {
          cheekRightEl.setAttribute('cx', (tx1 + 13).toFixed(1));
          cheekRightEl.setAttribute('cy', (ey1 + 22).toFixed(1));
        }
        const mouthEl = svg.querySelector('[data-live-mouth]') as SVGGElement | null;
        if (mouthEl) {
          const mx = ((tx0 + tx1) / 2).toFixed(1);
          const my = (((ey0 + ey1) / 2) + 20).toFixed(1);
          mouthEl.setAttribute('transform', `translate(${mx}, ${my})`);
        }
      }

      // Eyes (inside mask — cut holes through body for shapes using BotEngine face)
      const maskEyes = svg.querySelector('[data-mask-eyes]');
      if (maskEyes) {
        maskEyes.innerHTML = '';
        if (
          normShape !== 'cercle' &&
          normShape !== 'squircle' &&
          normShape !== 'soleil' &&
          normShape !== 'nuage' &&
          normShape !== 'triangle' &&
          normShape !== 'hexagone'
        ) {
          for (const eye of frame.eyes) {
            const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            p.setAttribute('d', eye.d);
            p.setAttribute('transform', eye.matrix);
            p.setAttribute('opacity', String(eye.alpha));
            p.setAttribute('fill', '#000');
            maskEyes.appendChild(p);
          }
        }
      }

      // Dots (behind body or above body)
      const dotsBehind = svg.querySelector('[data-dots-behind]');
      const dotsAbove = svg.querySelector('[data-dots-above]');
      if (dotsBehind) dotsBehind.innerHTML = '';
      if (dotsAbove) dotsAbove.innerHTML = '';
      for (const dot of frame.dots) {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', String(dot.x));
        circle.setAttribute('cy', String(dot.y));
        circle.setAttribute('r', String(dot.r));
        circle.setAttribute('opacity', String(dot.opacity));
        const dotColor = dot.color ?? ink;
        circle.setAttribute('fill', dotColor);
        const target = frame.dotsBehind ? dotsBehind : dotsAbove;
        target?.appendChild(circle);
      }

      // Arcs (the 3D orbital wireframe lines: back portion and front portion)
      const arcs = svg.querySelector('[data-arcs]');
      if (arcs) {
        arcs.innerHTML = '';
        for (const arc of frame.arcs) {
          // Back portion (goes behind body, drawn with subtle depth opacity)
          if (arc.back) {
            const pb = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            pb.setAttribute('d', arc.back);
            pb.setAttribute('stroke', ink);
            pb.setAttribute('stroke-width', String(arc.width));
            pb.setAttribute('opacity', String(arc.opacity * 0.45));
            pb.setAttribute('fill', 'none');
            pb.setAttribute('stroke-linecap', 'round');
            arcs.appendChild(pb);
          }
          // Front portion (in front of body)
          if (arc.front) {
            const pf = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            pf.setAttribute('d', arc.front);
            pf.setAttribute('stroke', ink);
            pf.setAttribute('stroke-width', String(arc.width));
            pf.setAttribute('opacity', String(arc.opacity));
            pf.setAttribute('fill', 'none');
            pf.setAttribute('stroke-linecap', 'round');
            arcs.appendChild(pf);
          }
        }
      }

      // Notification dot
      const notifEl = svg.querySelector('[data-notif]') as SVGCircleElement | null;
      if (notifEl) {
        if (frame.notif) {
          notifEl.setAttribute('cx', String(frame.notif.x));
          notifEl.setAttribute('cy', String(frame.notif.y));
          notifEl.setAttribute('r', String(frame.notif.r));
          notifEl.style.display = '';
        } else {
          notifEl.style.display = 'none';
        }
      }

      if (!isStatic) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    if (isStatic) {
      tick(performance.now());
    } else {
      rafRef.current = requestAnimationFrame(tick);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [color, normShape, normExpr, isVisible, isStatic, ink]);

  useEffect(() => {
    if (!isStatic && animated !== false) {
      setIsTapping(true);
      setTapCount((c) => c + 1);
      const timer = setTimeout(() => {
        setIsTapping(false);
      }, currentDuration);
      return () => clearTimeout(timer);
    }
  }, [normShape, isStatic, animated, currentDuration]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onClick?.(e);
      onInteract?.();
      if (!isStatic && animated !== false) {
        setIsTapping(true);
        setTapCount((c) => c + 1);

        if (animTimerRef.current) clearTimeout(animTimerRef.current);
        animTimerRef.current = setTimeout(() => {
          setIsTapping(false);
        }, currentDuration);
      }
    },
    [onClick, onInteract, isStatic, animated, currentDuration]
  );

  const isThinking = state === 'thinking';

  const renderLiveFace = (isTriangle = false) => {
    const initEyeY = isTriangle ? 22 : -6;
    const initCheekY = isTriangle ? 44 : 16;
    const initMouthY = isTriangle ? 42 : 14;

    return (
      <g data-live-face="" className="mascot-live-face-rig">
        {/* Left Eye Group */}
        <g data-live-eye-left="" transform={`translate(-24, ${initEyeY}) scale(1, 1)`}>
          {/* Normal upright pill eye */}
          <g className={`mascot-face-normal ${isTapping ? 'tap-face-normal' : isStatic ? '' : 'idle-face-normal'}`}>
            <rect x="-7" y="-13" width="14" height="26" rx="7" fill="#1e1b4b" />
            <circle cx="-2.5" cy="-4.5" r="3.2" fill="#fff" />
            <circle cx="2" cy="4" r="1.6" fill="#fff" opacity="0.8" />
          </g>
          {/* Peaceful soft blink eye */}
          <g className={`mascot-face-blink ${isTapping ? '' : isStatic ? '' : 'idle-face-blink'}`}>
            <path d="M -8,-2 Q 0,4 8,-2" stroke="#1e1b4b" strokeWidth="3" strokeLinecap="round" fill="none" />
          </g>
          {/* Soft squint eye (> <) during squeeze & impact */}
          <g className={`mascot-face-squint ${isTapping ? 'tap-face-squint' : ''}`}>
            <path d="M -8,-6 L 0,-1 L -8,4" stroke="#1e1b4b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </g>
          {/* Star sparkles (✦) during loft */}
          <g className={`mascot-face-sparkle ${isTapping ? 'tap-face-sparkle' : ''}`}>
            <path d="M 0,-10 Q 0,-2 6,-2 Q 0,-2 0,6 Q 0,-2 -6,-2 Q 0,-2 0,-10 Z" fill="#fff" stroke="#1e1b4b" strokeWidth="1.2" />
          </g>
        </g>

        {/* Right Eye Group */}
        <g data-live-eye-right="" transform={`translate(24, ${initEyeY}) scale(1, 1)`}>
          {/* Normal upright pill eye */}
          <g className={`mascot-face-normal ${isTapping ? 'tap-face-normal' : isStatic ? '' : 'idle-face-normal'}`}>
            <rect x="-7" y="-13" width="14" height="26" rx="7" fill="#1e1b4b" />
            <circle cx="-2.5" cy="-4.5" r="3.2" fill="#fff" />
            <circle cx="2" cy="4" r="1.6" fill="#fff" opacity="0.8" />
          </g>
          {/* Peaceful soft blink eye */}
          <g className={`mascot-face-blink ${isTapping ? '' : isStatic ? '' : 'idle-face-blink'}`}>
            <path d="M -8,-2 Q 0,4 8,-2" stroke="#1e1b4b" strokeWidth="3" strokeLinecap="round" fill="none" />
          </g>
          {/* Soft squint eye (> <) during squeeze & impact */}
          <g className={`mascot-face-squint ${isTapping ? 'tap-face-squint' : ''}`}>
            <path d="M 8,-6 L 0,-1 L 8,4" stroke="#1e1b4b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </g>
          {/* Star sparkles (✦) during loft */}
          <g className={`mascot-face-sparkle ${isTapping ? 'tap-face-sparkle' : ''}`}>
            <path d="M 0,-10 Q 0,-2 6,-2 Q 0,-2 0,6 Q 0,-2 -6,-2 Q 0,-2 0,-10 Z" fill="#fff" stroke="#1e1b4b" strokeWidth="1.2" />
          </g>
        </g>

        {/* Rosy Kawaii Blush Cheeks */}
        <circle data-live-cheek-left="" cx="-37" cy={initCheekY} r="9.5" fill="#fb7185" opacity={isTapping ? 0.8 : 0.6} />
        <circle data-live-cheek-right="" cx="37" cy={initCheekY} r="9.5" fill="#fb7185" opacity={isTapping ? 0.8 : 0.6} />

        {/* Sweet centered smile */}
        <g data-live-mouth="" transform={`translate(0, ${initMouthY})`}>
          <path
            d="M -7,-2 Q 0,5 7,-2"
            stroke="#1e1b4b"
            strokeWidth="2.8"
            strokeLinecap="round"
            fill="none"
            className={`mascot-mouth-smile ${isTapping ? 'tap-mouth-smile' : ''}`}
          />
          {/* Happy Open Mouth during airborne loft */}
          <ellipse
            cx="0"
            cy="0"
            rx="4.5"
            ry="5.5"
            fill="#e11d48"
            stroke="#1e1b4b"
            strokeWidth="1.6"
            className={`mascot-mouth-open ${isTapping ? 'tap-mouth-open' : ''}`}
          />
        </g>
      </g>
    );
  };

  return (
    <svg
      ref={svgRef}
      width={size}
      height={size}
      viewBox={`${-VB} ${-VB} ${VB * 2} ${VB * 2}`}
      onClick={handleClick}
      role="img"
      aria-label={`Mascot ${normShape} with ${normExpr} expression`}
      className={`select-none overflow-visible transition-transform duration-200 ${
        isThinking ? '-rotate-6 scale-105' : ''
      } ${className}`}
      style={{
        cursor: onInteract || onClick || (!isStatic && animated) ? 'pointer' : 'default',
        transformOrigin: '50% 50%',
        overflow: 'visible',
        ['--mascot-glow-soft' as any]: hexToRgba(ink, 0.45),
        ['--mascot-glow-mid' as any]: hexToRgba(ink, 0.65),
        ['--mascot-glow-intense' as any]: hexToRgba(ink, 0.85),
        ...style,
      }}
    >
      <style>{`
        /* Iconic Grok 3-dot Typing Wave Keyframes */
        @keyframes grokDotWave {
          0%, 100% {
            transform: translateY(0px) scale(0.85);
            opacity: 0.45;
          }
          50% {
            transform: translateY(-13px) scale(1.15);
            opacity: 1;
            filter: drop-shadow(0 0 12px var(--mascot-glow-intense, rgba(251, 191, 36, 0.75)));
          }
        }
        .grok-dot-1 {
          animation: grokDotWave 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
        }
        .grok-dot-2 {
          animation: grokDotWave 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s infinite;
        }
        .grok-dot-3 {
          animation: grokDotWave 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) 0.30s infinite;
        }

        /* Ambient floating dots while typing */
        @keyframes typingDotsLevitate {
          0%, 100% {
            opacity: 0.35;
            transform: translateY(0px) scale(0.9);
          }
          50% {
            opacity: 0.95;
            transform: translateY(-6px) scale(1.15);
            filter: drop-shadow(0 0 8px var(--mascot-glow-intense, rgba(255, 255, 255, 0.75)));
          }
        }
        .typing-dot-ambient-1 {
          animation: typingDotsLevitate 1.1s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .typing-dot-ambient-2 {
          animation: typingDotsLevitate 1.3s cubic-bezier(0.4, 0, 0.2, 1) 0.25s infinite;
        }
        .typing-dot-ambient-3 {
          animation: typingDotsLevitate 1.0s cubic-bezier(0.4, 0, 0.2, 1) 0.5s infinite;
        }
        .typing-dot-ambient-4 {
          animation: typingDotsLevitate 1.2s cubic-bezier(0.4, 0, 0.2, 1) 0.15s infinite;
        }

        /* ═════════════════════════════════════════════════════════════════════
           RELAXED KINETIC PHYSICS ENGINE (ALL 12 SHAPES)
           • Idle: 4.8s – 5.5s smooth sine waves (ease-in-out)
           • Tap Bursts: 1100ms – 1200ms luxurious deceleration (cubic-bezier(0.16, 1, 0.3, 1))
           • Secondary Motion: Face & reactive ground shadow lag smoothly by 80ms
           • 0% harsh snaps, 0% fast jitter
           ═════════════════════════════════════════════════════════════════════ */

        /* ── Common Rig Classes ── */
        .mascot-face-rig {
          transition: transform 80ms cubic-bezier(0.16, 1, 0.3, 1);
          transform-origin: 0px 0px;
        }
        .mascot-shadow-rig {
          transform-origin: 0px 114px;
        }

        /* ── Unified Kawaii Face Layers (Cercle, Squircle, Soleil) ── */
        .mascot-face-normal { opacity: 1; }
        .mascot-face-blink { opacity: 0; }
        .mascot-face-squint { opacity: 0; }
        .mascot-face-sparkle { opacity: 0; }
        .mascot-mouth-smile { opacity: 1; }
        .mascot-mouth-open { opacity: 0; }

        @keyframes idleFaceNormalBlink {
          0%, 71% { opacity: 1; }
          74%, 79% { opacity: 0; }
          82%, 100% { opacity: 1; }
        }
        @keyframes idleFaceClosedBlink {
          0%, 71% { opacity: 0; }
          74%, 79% { opacity: 1; }
          82%, 100% { opacity: 0; }
        }
        .idle-face-normal { animation: idleFaceNormalBlink 5.2s ease-in-out infinite; }
        .idle-face-blink { animation: idleFaceClosedBlink 5.2s ease-in-out infinite; }

        @keyframes tapFaceNormalCycle {
          0% { opacity: 1; }
          1%, 46% { opacity: 0; }
          47%, 74% { opacity: 1; }
          75%, 90% { opacity: 0; }
          91%, 100% { opacity: 1; }
        }
        @keyframes tapFaceSquintCycle {
          0% { opacity: 0; }
          1%, 18% { opacity: 1; }
          19%, 74% { opacity: 0; }
          75%, 90% { opacity: 1; }
          91%, 100% { opacity: 0; }
        }
        @keyframes tapFaceSparkleCycle {
          0%, 18% { opacity: 0; }
          19%, 46% { opacity: 1; }
          47%, 100% { opacity: 0; }
        }
        @keyframes tapMouthSmileCycle {
          0%, 18% { opacity: 1; }
          19%, 46% { opacity: 0; }
          47%, 100% { opacity: 1; }
        }
        @keyframes tapMouthOpenCycle {
          0%, 18% { opacity: 0; }
          19%, 46% { opacity: 1; }
          47%, 100% { opacity: 0; }
        }
        @keyframes tapGoldenAuraCycle {
          0%, 17% { opacity: 0; transform: scale(0.7) translateY(8px); }
          22%, 44% { opacity: 0.7; transform: scale(1.18) translateY(2px); }
          47%, 100% { opacity: 0; transform: scale(0.8) translateY(8px); }
        }

        .tap-face-normal { animation: tapFaceNormalCycle 1150ms cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .tap-face-squint { animation: tapFaceSquintCycle 1150ms cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .tap-face-sparkle { animation: tapFaceSparkleCycle 1150ms cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .tap-mouth-smile { animation: tapMouthSmileCycle 1150ms cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .tap-mouth-open { animation: tapMouthOpenCycle 1150ms cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .tap-golden-aura { animation: tapGoldenAuraCycle 1150ms cubic-bezier(0.16, 1, 0.3, 1) forwards; }

        /* ── 1. SQUIRCLE: Elegant 3D Floating Isometric Drift ── */
        @keyframes idleSquircle {
          0% {
            transform: perspective(600px) rotateX(0deg) rotateY(0deg) translateY(0);
          }
          30% {
            transform: perspective(600px) rotateY(-6deg) rotateZ(-2deg) translateY(-8px);
          }
          70% {
            transform: perspective(600px) rotateY(6deg) rotateZ(2deg) translateY(-5px);
          }
          100% {
            transform: perspective(600px) rotateX(0deg) rotateY(0deg) translateY(0);
          }
        }
        @keyframes idleShadowSquircle {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          30% { transform: scale(0.88); opacity: 0.2; }
          70% { transform: scale(0.92); opacity: 0.24; }
        }
        @keyframes tapBurstSquircle {
          0% {
            transform: perspective(600px) rotateY(0deg) translateY(0) scale(1);
          }
          18% {
            transform: perspective(600px) translateY(5px) scaleX(1.08) scaleY(0.92);
          }
          45% {
            transform: perspective(600px) translateY(-22px) rotateY(180deg) scale(1.04);
          }
          75% {
            transform: perspective(600px) translateY(3px) rotateY(360deg) scaleX(1.06) scaleY(0.95);
          }
          100% {
            transform: perspective(600px) translateY(0) rotateY(360deg) scale(1);
          }
        }
        @keyframes tapShadowSquircle {
          0% { transform: scale(1); opacity: 0.3; }
          18% { transform: scale(1.12); opacity: 0.4; }
          45% { transform: scale(0.70); opacity: 0.15; }
          75% { transform: scale(1.06); opacity: 0.35; }
          100% { transform: scale(1); opacity: 0.3; }
        }
        @keyframes tapFaceSquircle {
          0% { transform: perspective(600px) translateX(0) translateY(0); }
          18% { transform: perspective(600px) translateY(2px) scaleY(0.85); }
          45% { transform: perspective(600px) translateY(-14px) rotateY(180deg) scale(0.95); }
          75% { transform: perspective(600px) translateY(1px) rotateY(360deg); }
          100% { transform: perspective(600px) translateY(0) rotateY(360deg); }
        }
        .idle-squircle { animation: idleSquircle 5.0s ease-in-out infinite; transform-origin: 0px 0px; }
        .idle-shadow-squircle { animation: idleShadowSquircle 5.0s ease-in-out infinite; }
        .tap-burst-squircle { animation: tapBurstSquircle 1150ms cubic-bezier(0.16, 1, 0.3, 1) forwards; transform-origin: 0px 0px; }
        .tap-shadow-squircle { animation: tapShadowSquircle 1150ms cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .tap-face-squircle { animation: tapFaceSquircle 1150ms cubic-bezier(0.16, 1, 0.3, 1) forwards; transform-origin: 0px 0px; }

        /* ── 2. CERCLE: Smooth, Viscous Marshmallow Calm Bounce ── */
        @keyframes idleCercle {
          0% {
            transform: scale(1) translateY(0);
          }
          25% {
            transform: scaleX(0.96) scaleY(1.06) translateY(-4px);
          }
          75% {
            transform: scale(1) translateY(-1px);
          }
          100% {
            transform: scale(1) translateY(0);
          }
        }
        @keyframes idleShadowCercle {
          0%, 100% {
            transform: scale(1);
            opacity: 0.3;
          }
          25% {
            transform: scale(0.92);
            opacity: 0.22;
          }
          75% {
            transform: scale(0.97);
            opacity: 0.27;
          }
        }
        @keyframes tapBurstCercle {
          0% {
            transform: scale(1) translateY(0);
          }
          17% {
            transform: scaleX(1.14) scaleY(0.88) translateY(6px);
          }
          45% {
            transform: scaleX(0.92) scaleY(1.12) translateY(-20px);
          }
          74% {
            transform: scale(1) translateY(-4px);
          }
          87% {
            transform: scaleX(1.08) scaleY(0.94) translateY(4px);
          }
          100% {
            transform: scale(1) translateY(0);
          }
        }
        @keyframes tapShadowCercle {
          0% {
            transform: scale(1);
            opacity: 0.3;
          }
          17% {
            transform: scale(1.15);
            opacity: 0.45;
          }
          45% {
            transform: scale(0.70);
            opacity: 0.15;
          }
          74% {
            transform: scale(0.94);
            opacity: 0.26;
          }
          87% {
            transform: scale(1.10);
            opacity: 0.40;
          }
          100% {
            transform: scale(1);
            opacity: 0.3;
          }
        }
        @keyframes tapFaceCercle {
          0% {
            transform: scale(1) translateY(0);
          }
          17% {
            transform: scaleX(1.12) scaleY(0.80) translateY(5px);
          }
          45% {
            transform: scaleX(0.95) scaleY(1.08) translateY(-15px);
          }
          74% {
            transform: translateY(-3px);
          }
          87% {
            transform: scaleX(1.06) scaleY(0.90) translateY(3px);
          }
          100% {
            transform: scale(1) translateY(0);
          }
        }
        .idle-cercle { animation: idleCercle 5.2s ease-in-out infinite; transform-origin: 0px 0px; }
        .idle-shadow-cercle { animation: idleShadowCercle 5.2s ease-in-out infinite; }
        .tap-burst-cercle { animation: tapBurstCercle 1150ms cubic-bezier(0.16, 1, 0.3, 1) forwards; transform-origin: 0px 0px; }
        .tap-shadow-cercle { animation: tapShadowCercle 1150ms cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .tap-face-cercle { animation: tapFaceCercle 1150ms cubic-bezier(0.16, 1, 0.3, 1) forwards; transform-origin: 0px 0px; }

        /* ── 3. SOLEIL: Luminous Warm Pulse & Gentle Scallop Drift ── */
        @keyframes idleSoleil {
          0%, 100% { transform: scale(1) rotate(0deg) translateY(0); }
          33% { transform: scale(1.05) rotate(-5deg) translateY(-6px); }
          66% { transform: scale(1.02) rotate(4deg) translateY(-3px); }
        }
        @keyframes idleShadowSoleil {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          33% { transform: scale(0.88); opacity: 0.2; }
          66% { transform: scale(0.94); opacity: 0.24; }
        }
        @keyframes tapBurstSoleil {
          0% { transform: scale(1) rotate(0deg) translateY(0); }
          15% { transform: scaleX(1.10) scaleY(0.90) rotate(-12deg) translateY(4px); }
          40% { transform: scale(1.10) rotate(140deg) translateY(-22px); }
          65% { transform: scale(1.04) rotate(270deg) translateY(-8px); }
          85% { transform: scaleX(1.16) scaleY(0.88) rotate(360deg) translateY(3px); }
          100% { transform: scale(1) rotate(360deg) translateY(0); }
        }
        @keyframes tapShadowSoleil {
          0% { transform: scale(1); opacity: 0.3; }
          15% { transform: scale(1.14); opacity: 0.42; }
          40% { transform: scale(0.66); opacity: 0.14; }
          65% { transform: scale(0.78); opacity: 0.18; }
          85% { transform: scale(1.18); opacity: 0.38; }
          100% { transform: scale(1); opacity: 0.3; }
        }
        .idle-soleil { animation: idleSoleil 4.8s ease-in-out infinite; transform-origin: 0px 0px; }
        .idle-shadow-soleil { animation: idleShadowSoleil 4.8s ease-in-out infinite; }
        .tap-burst-soleil { animation: tapBurstSoleil 1150ms cubic-bezier(0.16, 1, 0.3, 1) forwards; transform-origin: 0px 0px; }
        .tap-shadow-soleil { animation: tapShadowSoleil 1150ms cubic-bezier(0.16, 1, 0.3, 1) forwards; }

        /* ── 4. LIVRE: Graceful Storybook Page Turn ── */
        @keyframes idleLivre {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-5px) rotate(1deg); }
        }
        @keyframes idleShadowLivre {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(0.91); opacity: 0.22; }
        }
        @keyframes tapBurstLivre {
          0% { transform: rotate(0deg) translateY(0) scale(1); }
          18% { transform: rotate(-3deg) translateY(-4px); }
          48% { transform: rotate(4deg) translateY(-16px) scale(1.03); }
          75% { transform: rotate(-1deg) translateY(2px) scaleX(1.04) scaleY(0.97); }
          100% { transform: rotate(0deg) translateY(0) scale(1); }
        }
        @keyframes tapShadowLivre {
          0% { transform: scale(1); opacity: 0.3; }
          18% { transform: scale(1.04) rotate(-3deg); opacity: 0.34; }
          48% { transform: scale(0.74); opacity: 0.16; }
          75% { transform: scale(1.05); opacity: 0.33; }
          100% { transform: scale(1); opacity: 0.3; }
        }
        @keyframes tapFaceLivre {
          0% { transform: rotate(0deg) translateY(0); }
          18% { transform: rotate(-2deg) translateY(-2px); }
          48% { transform: rotate(3deg) translateY(-10px); }
          75% { transform: translateY(1px); }
          100% { transform: rotate(0deg) translateY(0); }
        }
        @keyframes livrePageTurn {
          0% { transform: scaleX(1); }
          45% { transform: scaleX(0.05); }
          65% { transform: scaleX(0.85); }
          100% { transform: scaleX(1); }
        }
        @keyframes livreRibbonSway {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(12deg); }
          55% { transform: rotate(-10deg); }
          80% { transform: rotate(4deg); }
        }
        .idle-livre { animation: idleLivre 5.0s ease-in-out infinite; transform-origin: 0px 0px; }
        .idle-shadow-livre { animation: idleShadowLivre 5.0s ease-in-out infinite; }
        .tap-burst-livre { animation: tapBurstLivre 1150ms cubic-bezier(0.16, 1, 0.3, 1) forwards; transform-origin: 0px 0px; }
        .tap-shadow-livre { animation: tapShadowLivre 1150ms cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .tap-face-livre { animation: tapFaceLivre 1150ms cubic-bezier(0.16, 1, 0.3, 1) forwards; transform-origin: 0px 0px; }
        .livre-page-turn { animation: livrePageTurn 1150ms cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .livre-ribbon-sway { animation: livreRibbonSway 1150ms cubic-bezier(0.16, 1, 0.3, 1) forwards; }

        /* ── 5. HEXAGONE: Smooth Honeycomb Gem Breathe & Viscous Roll ── */
        @keyframes idleHexagone {
          0% {
            transform: scale(1) translateY(0) rotate(0deg);
          }
          25% {
            transform: scale(1.08) translateY(-4px) rotate(0deg);
          }
          75% {
            transform: scale(1.02) translateY(-1px) rotate(0deg);
          }
          100% {
            transform: scale(1) translateY(0) rotate(0deg);
          }
        }
        @keyframes idleShadowHexagone {
          0%, 100% {
            transform: scale(1);
            opacity: 0.3;
          }
          25% {
            transform: scale(0.90);
            opacity: 0.22;
          }
          75% {
            transform: scale(0.96);
            opacity: 0.26;
          }
        }
        @keyframes hexFacetGlint {
          0%, 100% {
            opacity: 0.2;
            transform: scale(0.8);
          }
          25% {
            opacity: 0.9;
            transform: scale(1.2);
          }
          75% {
            opacity: 0.2;
            transform: scale(0.8);
          }
        }
        @keyframes tapBurstHexagone {
          0% {
            transform: scale(1) translateY(0) rotate(0deg);
          }
          17% {
            transform: scaleX(1.12) scaleY(0.88) translateY(6px) rotate(0deg);
          }
          45% {
            transform: scale(1.06) translateY(-20px) rotate(30deg);
          }
          74% {
            transform: scale(1.04) translateY(-8px) rotate(60deg);
          }
          87% {
            transform: scaleX(1.14) scaleY(0.90) translateY(4px) rotate(60deg);
          }
          100% {
            transform: scale(1) translateY(0) rotate(60deg);
          }
        }
        @keyframes tapShadowHexagone {
          0% {
            transform: scale(1);
            opacity: 0.3;
          }
          17% {
            transform: scale(1.16);
            opacity: 0.45;
          }
          45% {
            transform: scale(0.65);
            opacity: 0.12;
          }
          74% {
            transform: scale(0.88);
            opacity: 0.22;
          }
          87% {
            transform: scale(1.15);
            opacity: 0.40;
          }
          100% {
            transform: scale(1);
            opacity: 0.3;
          }
        }
        @keyframes tapFaceHexagone {
          0% {
            transform: translate(0, 0) rotate(0deg);
          }
          17% {
            transform: translateY(3px) scaleY(0.88) rotate(0deg);
          }
          45% {
            transform: translateY(-14px) scale(1.05) rotate(-12deg);
          }
          74% {
            transform: translateY(-5px) rotate(-40deg);
          }
          87% {
            transform: translateY(3px) scaleX(1.10) scaleY(0.92) rotate(-56deg);
          }
          100% {
            transform: translate(0, 0) rotate(-60deg);
          }
        }
        .idle-hexagone { animation: idleHexagone 5.2s ease-in-out infinite; transform-origin: 0px 0px; }
        .idle-shadow-hexagone { animation: idleShadowHexagone 5.2s ease-in-out infinite; }
        .hex-facet-glint { transform-origin: 32px -46px; animation: hexFacetGlint 5.2s ease-in-out infinite; }
        .tap-burst-hexagone { animation: tapBurstHexagone 1150ms cubic-bezier(0.16, 1, 0.3, 1) forwards; transform-origin: 0px 0px; }
        .tap-shadow-hexagone { animation: tapShadowHexagone 1150ms cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .tap-face-hexagone { animation: tapFaceHexagone 1150ms cubic-bezier(0.16, 1, 0.3, 1) forwards; transform-origin: 0px 0px; }

        /* ── 6. NUAGE: Atmospheric Puff-Up & Zero-G Fluffy Drift ── */
        @keyframes idleNuage {
          0% {
            transform: scale(1) translate(0, 0) skewX(0deg);
          }
          25% {
            transform: scale(1.08) translateY(-4px) skewX(0deg);
          }
          75% {
            transform: scale(1.04) translateX(2px) translateY(-2px) skewX(-3deg);
          }
          100% {
            transform: scale(1) translate(0, 0) skewX(0deg);
          }
        }
        @keyframes idleShadowNuage {
          0%, 100% {
            transform: scale(1) translateX(0);
            opacity: 0.3;
          }
          25% {
            transform: scale(0.90) translateX(0);
            opacity: 0.22;
          }
          75% {
            transform: scale(0.95) translateX(2px);
            opacity: 0.26;
          }
        }
        @keyframes tapBurstNuage {
          0% {
            transform: scale(1) translate(0, 0) skewX(0deg);
          }
          17% {
            transform: scaleX(0.85) scaleY(0.88) translateY(4px) skewX(0deg);
          }
          45% {
            transform: scaleX(1.12) scaleY(1.08) translateY(-20px) skewX(0deg);
          }
          74% {
            transform: scale(1.05) translateX(3px) translateY(-8px) skewX(-4deg);
          }
          87% {
            transform: scaleX(1.15) scaleY(0.92) translateY(4px) skewX(0deg);
          }
          100% {
            transform: scale(1) translate(0, 0) skewX(0deg);
          }
        }
        @keyframes tapShadowNuage {
          0% {
            transform: scale(1) translateX(0);
            opacity: 0.3;
          }
          17% {
            transform: scale(1.12) translateX(0);
            opacity: 0.45;
          }
          45% {
            transform: scale(0.68) translateX(0);
            opacity: 0.14;
          }
          74% {
            transform: scale(0.90) translateX(3px);
            opacity: 0.24;
          }
          87% {
            transform: scale(1.14) translateX(0);
            opacity: 0.40;
          }
          100% {
            transform: scale(1) translateX(0);
            opacity: 0.3;
          }
        }
        @keyframes tapFaceNuage {
          0% { transform: translate(0, 0) skewX(0deg); }
          17% { transform: translateY(3px) scaleY(0.85); }
          45% { transform: translateY(-16px) scale(1.05); }
          74% { transform: translateX(2px) translateY(-6px) skewX(-3deg); }
          87% { transform: translateY(3px) scaleX(1.10) scaleY(0.90); }
          100% { transform: translate(0, 0) skewX(0deg); }
        }
        .idle-nuage { animation: idleNuage 5.2s ease-in-out infinite; transform-origin: 0px 0px; }
        .idle-shadow-nuage { animation: idleShadowNuage 5.2s ease-in-out infinite; }
        .tap-burst-nuage { animation: tapBurstNuage 1150ms cubic-bezier(0.16, 1, 0.3, 1) forwards; transform-origin: 0px 0px; }
        .tap-shadow-nuage { animation: tapShadowNuage 1150ms cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .tap-face-nuage { animation: tapFaceNuage 1150ms cubic-bezier(0.16, 1, 0.3, 1) forwards; transform-origin: 0px 0px; }

        /* ── 7. GOUTTE: Viscous Honey/Water Ripple ── */
        @keyframes idleGoutte {
          0%, 100% { transform: scale(1) translateY(0); }
          50% { transform: scaleX(0.97) scaleY(1.03) translateY(-5px); }
        }
        @keyframes idleShadowGoutte {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(0.90); opacity: 0.22; }
        }
        @keyframes tapBurstGoutte {
          0% { transform: scale(1) translateY(0); }
          30% { transform: translateY(-16px) scaleX(0.91) scaleY(1.10); }
          60% { transform: translateY(0px) scaleX(1.04) scaleY(0.96); }
          78% { transform: translateY(4px) scaleX(1.12) scaleY(0.90); }
          100% { transform: scale(1) translateY(0); }
        }
        @keyframes tapShadowGoutte {
          0% { transform: scale(1); opacity: 0.3; }
          30% { transform: scale(0.72); opacity: 0.16; }
          60% { transform: scale(0.98); opacity: 0.30; }
          78% { transform: scale(1.14); opacity: 0.38; }
          100% { transform: scale(1); opacity: 0.3; }
        }
        @keyframes tapFaceGoutte {
          0% { transform: translateY(0); }
          30% { transform: translateY(-11px) scaleX(0.94) scaleY(1.06); }
          60% { transform: translateY(-2px); }
          78% { transform: translateY(2px) scaleY(0.88); }
          100% { transform: translateY(0); }
        }
        .idle-goutte { animation: idleGoutte 5.0s ease-in-out infinite; transform-origin: 0px 0px; }
        .idle-shadow-goutte { animation: idleShadowGoutte 5.0s ease-in-out infinite; }
        .tap-burst-goutte { animation: tapBurstGoutte 1180ms cubic-bezier(0.16, 1, 0.3, 1) forwards; transform-origin: 0px 0px; }
        .tap-shadow-goutte { animation: tapShadowGoutte 1180ms cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .tap-face-goutte { animation: tapFaceGoutte 1180ms cubic-bezier(0.16, 1, 0.3, 1) forwards; transform-origin: 0px 0px; }

        /* ── 8. GALET: Slow Riverbed Rocking ── */
        @keyframes idleGalet {
          0%, 100% { transform: rotate(0deg) translateY(0); }
          35% { transform: rotate(-2deg) translateY(-3px); }
          70% { transform: rotate(2deg) translateY(-2px); }
        }
        @keyframes idleShadowGalet {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          35% { transform: scale(0.94); opacity: 0.24; }
          70% { transform: scale(0.96); opacity: 0.25; }
        }
        @keyframes tapBurstGalet {
          0% { transform: rotate(0deg) translateY(0); }
          24% { transform: rotate(-8deg) translateY(-5px); }
          52% { transform: rotate(6deg) translateY(-3px); }
          76% { transform: rotate(-2deg) translateY(1px); }
          100% { transform: rotate(0deg) translateY(0); }
        }
        @keyframes tapShadowGalet {
          0% { transform: scale(1); opacity: 0.3; }
          24% { transform: scale(0.92) rotate(-6deg); opacity: 0.25; }
          52% { transform: scale(0.94) rotate(4deg); opacity: 0.26; }
          76% { transform: scale(1.02); opacity: 0.32; }
          100% { transform: scale(1); opacity: 0.3; }
        }
        @keyframes tapFaceGalet {
          0% { transform: rotate(0deg) translateY(0); }
          24% { transform: rotate(-6deg) translateY(-3px); }
          52% { transform: rotate(4deg) translateY(-2px); }
          76% { transform: rotate(-1.5deg); }
          100% { transform: rotate(0deg) translateY(0); }
        }
        .idle-galet { animation: idleGalet 5.0s ease-in-out infinite; transform-origin: 0px 0px; }
        .idle-shadow-galet { animation: idleShadowGalet 5.0s ease-in-out infinite; }
        .tap-burst-galet { animation: tapBurstGalet 1150ms cubic-bezier(0.16, 1, 0.3, 1) forwards; transform-origin: 0px 0px; }
        .tap-shadow-galet { animation: tapShadowGalet 1150ms cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .tap-face-galet { animation: tapFaceGalet 1150ms cubic-bezier(0.16, 1, 0.3, 1) forwards; transform-origin: 0px 0px; }

        /* ── 9. CAPSULE: Gentle Weeble-Wobble ── */
        @keyframes idleCapsule {
          0%, 100% { transform: rotate(0deg) translateY(0); }
          50% { transform: rotate(1.5deg) translateY(-5px); }
        }
        @keyframes idleShadowCapsule {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(0.92); opacity: 0.22; }
        }
        @keyframes tapBurstCapsule {
          0% { transform: rotate(0deg) translateY(0); }
          25% { transform: rotate(-14deg) translateY(2px); }
          55% { transform: rotate(10deg) translateY(-3px); }
          78% { transform: rotate(-3deg) translateY(1px); }
          100% { transform: rotate(0deg) translateY(0); }
        }
        @keyframes tapShadowCapsule {
          0% { transform: scale(1); opacity: 0.3; }
          25% { transform: scale(1.08) rotate(-10deg); opacity: 0.36; }
          55% { transform: scale(0.95) rotate(8deg); opacity: 0.26; }
          78% { transform: scale(1.02); opacity: 0.32; }
          100% { transform: scale(1); opacity: 0.3; }
        }
        @keyframes tapFaceCapsule {
          0% { transform: rotate(0deg) translateY(0); }
          25% { transform: rotate(-10deg) translateY(1px); }
          55% { transform: rotate(8deg) translateY(-2px); }
          78% { transform: rotate(-2deg); }
          100% { transform: rotate(0deg) translateY(0); }
        }
        .idle-capsule { animation: idleCapsule 5.0s ease-in-out infinite; transform-origin: 0px 0px; }
        .idle-shadow-capsule { animation: idleShadowCapsule 5.0s ease-in-out infinite; }
        .tap-burst-capsule { animation: tapBurstCapsule 1180ms cubic-bezier(0.16, 1, 0.3, 1) forwards; transform-origin: 0px 0px; }
        .tap-shadow-capsule { animation: tapShadowCapsule 1180ms cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .tap-face-capsule { animation: tapFaceCapsule 1180ms cubic-bezier(0.16, 1, 0.3, 1) forwards; transform-origin: 0px 0px; }

        /* ── 10. TRIANGLE: Smooth, Viscous Onigiri Sway & Corner Pivot ── */
        @keyframes idleTriangle {
          0% {
            transform: scale(1) translate(0, 0) rotate(0deg);
          }
          25% {
            transform: scaleX(0.98) scaleY(1.04) translateY(-4px) rotate(-3deg);
          }
          75% {
            transform: scale(1.02) translateX(2px) translateY(-2px) rotate(2deg);
          }
          100% {
            transform: scale(1) translate(0, 0) rotate(0deg);
          }
        }
        @keyframes idleShadowTriangle {
          0%, 100% { transform: scale(1) translateX(0); opacity: 0.3; }
          25% { transform: scale(0.92) translateX(0); opacity: 0.22; }
          75% { transform: scale(0.96) translateX(2px); opacity: 0.26; }
        }
        @keyframes tapBurstTriangle {
          0% {
            transform-origin: 50% 80%;
            transform: scale(1) translate(0, 0) rotate(0deg);
          }
          17% {
            /* Anticipation Squeeze */
            transform-origin: 50% 80%;
            transform: scaleX(1.12) scaleY(0.88) translateY(6px) rotate(0deg);
          }
          45% {
            /* Corner Lift & Float (LOFT) on bottom-left corner */
            transform-origin: 22% 82%;
            transform: scale(1.06) translateY(-14px) rotate(-15deg);
          }
          74% {
            /* Sway Across (Graceful Roll-Over) to bottom-right corner */
            transform-origin: 78% 82%;
            transform: scale(1.06) translateY(-8px) rotate(15deg);
          }
          87% {
            /* Soft Ground Cushion Impact */
            transform-origin: 50% 80%;
            transform: scaleX(1.14) scaleY(0.92) translateY(4px) rotate(0deg);
          }
          100% {
            /* Dampened Return */
            transform-origin: 50% 80%;
            transform: scale(1) translate(0, 0) rotate(0deg);
          }
        }
        @keyframes tapShadowTriangle {
          0% { transform: scale(1) translateX(0); opacity: 0.3; }
          17% { transform: scale(1.14) translateX(0); opacity: 0.45; }
          45% { transform: scale(0.65) translateX(-8px); opacity: 0.12; }
          74% { transform: scale(0.85) translateX(6px); opacity: 0.25; }
          87% { transform: scale(1.18) translateX(0); opacity: 0.42; }
          100% { transform: scale(1) translateX(0); opacity: 0.3; }
        }
        .idle-triangle { animation: idleTriangle 5.2s ease-in-out infinite; transform-origin: 50% 80%; }
        .idle-shadow-triangle { animation: idleShadowTriangle 5.2s ease-in-out infinite; }
        .tap-burst-triangle { animation: tapBurstTriangle 1150ms cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .tap-shadow-triangle { animation: tapShadowTriangle 1150ms cubic-bezier(0.16, 1, 0.3, 1) forwards; }

        /* ── 11. OEUF: Gentle Cradle Rock ── */
        @keyframes idleOeuf {
          0%, 100% { transform: scale(1) translateY(0); }
          50% { transform: scaleX(0.99) scaleY(1.02) translateY(-4px); }
        }
        @keyframes idleShadowOeuf {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(0.92); opacity: 0.22; }
        }
        @keyframes tapBurstOeuf {
          0% { transform: rotate(0deg) translateY(0); }
          22% { transform: rotate(-8deg) translateY(-2px); }
          48% { transform: rotate(8deg) translateY(-2px); }
          70% { transform: rotate(-4deg) translateY(-1px); }
          84% { transform: rotate(0deg) translateY(-6px) scale(1.02); }
          100% { transform: rotate(0deg) translateY(0) scale(1); }
        }
        @keyframes tapShadowOeuf {
          0% { transform: scale(1); opacity: 0.3; }
          22% { transform: scale(0.96) rotate(-6deg); opacity: 0.28; }
          48% { transform: scale(0.96) rotate(6deg); opacity: 0.28; }
          70% { transform: scale(0.98); opacity: 0.29; }
          84% { transform: scale(0.86); opacity: 0.20; }
          100% { transform: scale(1); opacity: 0.3; }
        }
        @keyframes tapFaceOeuf {
          0% { transform: rotate(0deg) translateY(0); }
          22% { transform: rotate(-6deg) translateY(-1px); }
          48% { transform: rotate(6deg) translateY(-1px); }
          70% { transform: rotate(-3deg); }
          84% { transform: translateY(-4px); }
          100% { transform: rotate(0deg) translateY(0); }
        }
        .idle-oeuf { animation: idleOeuf 5.0s ease-in-out infinite; transform-origin: 0px 0px; }
        .idle-shadow-oeuf { animation: idleShadowOeuf 5.0s ease-in-out infinite; }
        .tap-burst-oeuf { animation: tapBurstOeuf 1150ms cubic-bezier(0.16, 1, 0.3, 1) forwards; transform-origin: 0px 0px; }
        .tap-shadow-oeuf { animation: tapShadowOeuf 1150ms cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .tap-face-oeuf { animation: tapFaceOeuf 1150ms cubic-bezier(0.16, 1, 0.3, 1) forwards; transform-origin: 0px 0px; }

        /* ── 12. FROMAGE: Playful Cheese Tilt ── */
        @keyframes idleFromage {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-4px) scale(1.02); }
        }
        @keyframes idleShadowFromage {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(0.92); opacity: 0.23; }
        }
        @keyframes tapBurstFromage {
          0% { transform: rotate(0deg) translateY(0); }
          32% { transform: rotate(12deg) translateY(-6px); }
          58% { transform: rotate(10deg) translateY(-4px); }
          80% { transform: rotate(-3deg) translateY(2px) scaleX(1.04) scaleY(0.97); }
          100% { transform: rotate(0deg) translateY(0) scale(1); }
        }
        @keyframes tapShadowFromage {
          0% { transform: scale(1); opacity: 0.3; }
          32% { transform: scale(0.88) rotate(8deg); opacity: 0.22; }
          58% { transform: scale(0.92) rotate(6deg); opacity: 0.24; }
          80% { transform: scale(1.05); opacity: 0.34; }
          100% { transform: scale(1); opacity: 0.3; }
        }
        @keyframes tapFaceFromage {
          0% { transform: rotate(0deg) translateY(0); }
          32% { transform: rotate(9deg) translateY(-4px); }
          58% { transform: rotate(7deg) translateY(-2px); }
          80% { transform: translateY(1px); }
          100% { transform: rotate(0deg) translateY(0); }
        }
        .idle-fromage { animation: idleFromage 5.0s ease-in-out infinite; transform-origin: 0px 0px; }
        .idle-shadow-fromage { animation: idleShadowFromage 5.0s ease-in-out infinite; }
        .tap-burst-fromage { animation: tapBurstFromage 1180ms cubic-bezier(0.16, 1, 0.3, 1) forwards; transform-origin: 0px 0px; }
        .tap-shadow-fromage { animation: tapShadowFromage 1180ms cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .tap-face-fromage { animation: tapFaceFromage 1180ms cubic-bezier(0.16, 1, 0.3, 1) forwards; transform-origin: 0px 0px; }
      `}</style>

      <defs>
        <mask
          id={maskId}
          maskUnits="userSpaceOnUse"
          x={-VB}
          y={-VB}
          width={VB * 2}
          height={VB * 2}
        >
          <g
            key={`${normShape}-${tapCount}-mask`}
            className={`mascot-mask-sync ${
              isTapping ? `tap-burst-${normShape}` : isStatic ? '' : `idle-${normShape}`
            }`}
          >
            {/* White body shape — fills the mask */}
            <path data-mask-body="" fill="#fff" />
            {/* Black eye holes — cut through the body */}
            <g
              data-mask-eyes=""
              className={`mascot-face-rig ${
                isTapping ? `tap-face-${normShape}` : ''
              }`}
            />
          </g>
        </mask>
      </defs>

      {/* Grok Typing Dots: Smooth Cross-fade and Spring Scale */}
      <g
        className="grok-typing-dots-container"
        style={{
          pointerEvents: 'none',
          opacity: activeTyping ? 1 : 0,
          transform: activeTyping ? 'scale(0.82)' : 'scale(1)',
          transition:
            'opacity 0.28s cubic-bezier(0.16, 1, 0.3, 1), transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Ambient subtle levitating dots */}
        <circle
          cx="-75"
          cy="-80"
          r="8"
          className="typing-dot-ambient-1"
          fill={hexToRgba(ink, 0.65)}
        />
        <circle
          cx="75"
          cy="-75"
          r="8"
          className="typing-dot-ambient-2"
          fill={hexToRgba(ink, 0.65)}
        />
        <circle
          cx="-85"
          cy="45"
          r="6.5"
          className="typing-dot-ambient-3"
          fill={hexToRgba(ink, 0.45)}
        />
        <circle
          cx="85"
          cy="50"
          r="6.5"
          className="typing-dot-ambient-4"
          fill={hexToRgba(ink, 0.45)}
        />

        {/* Iconic Grok 3-dot typing rhythm wave */}
        <g className="grok-dots-cluster">
          <circle
            cx="-48"
            cy="0"
            r="16"
            className="grok-dot-1"
            fill={ink}
            style={{ transformOrigin: '-48px 0px' }}
          />
          <circle
            cx="0"
            cy="0"
            r="16"
            className="grok-dot-2"
            fill={ink}
            style={{ transformOrigin: '0px 0px' }}
          />
          <circle
            cx="48"
            cy="0"
            r="16"
            className="grok-dot-3"
            fill={ink}
            style={{ transformOrigin: '48px 0px' }}
          />
        </g>
      </g>

      {/* Dynamic floor shadow */}
      <ellipse
        cx="0"
        cy="110"
        rx="66"
        ry="12"
        fill="#000"
        className={`mascot-shadow-rig ${
          isTapping
            ? `tap-shadow-${normShape}`
            : isStatic
            ? ''
            : `idle-shadow-${normShape}`
        }`}
        style={{
          pointerEvents: 'none',
          display: activeTyping ? 'none' : 'block',
        }}
      />

      {/* Mascot Main Layer */}
      <g
        key={`${normShape}-${tapCount}`}
        className={`mascot-main-group mascot-tap-rig ${
          isTapping
            ? `tap-burst-${normShape}`
            : isStatic
            ? ''
            : `idle-${normShape}`
        }`}
        onAnimationEnd={() => {
          if (isTapping) {
            setIsTapping(false);
          }
        }}
        style={{
          opacity: activeTyping ? 0 : 1,
          transform: activeTyping ? 'scale(0.82)' : undefined,
          pointerEvents: activeTyping ? 'none' : 'auto',
          transition:
            'opacity 0.28s cubic-bezier(0.16, 1, 0.3, 1), transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Standard body & backing disc ONLY for shapes using BotEngine mesh */}
        {normShape !== 'cercle' && normShape !== 'squircle' && normShape !== 'soleil' && normShape !== 'nuage' && normShape !== 'triangle' && normShape !== 'hexagone' && (
          <>
            <circle cx="0" cy="0" r="75" fill="#18181b" opacity="0.95" style={{ pointerEvents: 'none' }} />
            <path
              data-body=""
              mask={`url(#${maskId})`}
              style={{
                filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.18))',
                transition: 'fill 0.2s ease',
              }}
            />
          </>
        )}

        {/* ── 1. SOLEIL: 12-Pointed Vibrant Sunburst + Sunny Yellow Core Disc + Dynamic Live Face ── */}
        {normShape === 'soleil' && (
          <g className="soleil-sun-rig" style={{ pointerEvents: 'none' }}>
            {/* 12 Radiant Rays Sunburst in Warm Orange */}
            <path
              d={SUNBURST_PATH}
              fill="#f97316"
              stroke="#ea580c"
              strokeWidth="2.5"
              style={{
                filter: 'drop-shadow(0 3px 8px rgba(234, 88, 12, 0.35))',
              }}
            />

            {/* Sunny Core Disc in Vibrant Warm Yellow */}
            <circle
              cx="0"
              cy="0"
              r="64"
              fill={bodyHex === '#0a0a0c' ? '#fde047' : '#fde047'}
              stroke="#ea580c"
              strokeWidth="2.5"
              style={{
                filter: 'drop-shadow(0 2px 6px rgba(245, 158, 11, 0.4))',
              }}
            />
            {/* Inner Core Soft Warm Glow */}
            <circle cx="0" cy="0" r="58" fill="#fef08a" opacity="0.45" />

            {/* Live Dynamic Kawaii Face */}
            {renderLiveFace(false)}
          </g>
        )}

        {/* ── 2. CERCLE: Smooth Marshmallow Body + Specular Highlight + Dynamic Live Face ── */}
        {normShape === 'cercle' && (
          <g className="cercle-marshmallow-rig" style={{ pointerEvents: 'none' }}>
            {/* Golden radiant aura under airborne loft */}
            <circle
              cx="0"
              cy="30"
              r="60"
              fill="rgba(253, 224, 71, 0.45)"
              className={`mascot-golden-aura ${isTapping ? 'tap-golden-aura' : ''}`}
              style={{ filter: 'blur(12px)' }}
            />

            {/* Soft Circular Body */}
            <circle
              cx="0"
              cy="0"
              r="88"
              fill={ink}
              style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.2))' }}
            />
            {/* Subtle Depth Shadow */}
            <circle cx="0" cy="5" r="86" fill="#000" opacity="0.08" />

            {/* Glossy top-left specular highlight */}
            <ellipse
              cx="-38"
              cy="-42"
              rx="22"
              ry="10"
              transform="rotate(-38 -38 -42)"
              fill="#fff"
              opacity="0.45"
            />
            <circle cx="-20" cy="-56" r="4.5" fill="#fff" opacity="0.5" />

            {/* Live Dynamic Kawaii Face */}
            {renderLiveFace(false)}
          </g>
        )}

        {/* ── 3. SQUIRCLE: Puffy Squircle Body + Specular Highlight + Dynamic Live Face ── */}
        {normShape === 'squircle' && (
          <g className="squircle-puffy-rig" style={{ pointerEvents: 'none' }}>
            {/* Puffy Squircle Body */}
            <rect
              x="-86"
              y="-86"
              width="172"
              height="172"
              rx="56"
              ry="56"
              fill={bodyHex === '#0a0a0c' ? '#fef9ee' : bodyHex}
              style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.18))' }}
            />
            {/* Subtle Depth Shadow */}
            <rect x="-86" y="-80" width="172" height="172" rx="56" ry="56" fill="#000" opacity="0.08" />

            {/* Glossy top-left specular highlight */}
            <ellipse
              cx="-38"
              cy="-42"
              rx="22"
              ry="10"
              transform="rotate(-38 -38 -42)"
              fill="#fff"
              opacity="0.45"
            />
            <circle cx="-20" cy="-56" r="4.5" fill="#fff" opacity="0.5" />

            {/* Live Dynamic Kawaii Face */}
            {renderLiveFace(false)}
          </g>
        )}

        {/* ── 4. NUAGE: Atmospheric Cumulus Cloud Body + Inner Creases + Dynamic Live Face ── */}
        {normShape === 'nuage' && (
          <g className="nuage-fluffy-rig" style={{ pointerEvents: 'none' }}>
            {/* Golden radiant aura under airborne loft */}
            <circle
              cx="0"
              cy="30"
              r="62"
              fill="rgba(253, 224, 71, 0.45)"
              className={`mascot-golden-aura ${isTapping ? 'tap-golden-aura' : ''}`}
              style={{ filter: 'blur(12px)' }}
            />

            {/* Layer 1: Subtle Depth Shadow beneath base */}
            <path
              d="M -75,33 C -98,33 -102,1 -80,-15 C -84,-39 -52,-55 -30,-39 C -16,-69 28,-69 44,-41 C 68,-53 96,-29 86,-1 C 104,21 86,45 64,41 C 38,49 -38,49 -75,33 Z"
              fill="#000"
              opacity="0.08"
            />

            {/* Layer 2: Puffy Cloud Body */}
            <path
              d="M -75,28 C -98,28 -102,-4 -80,-20 C -84,-44 -52,-60 -30,-44 C -16,-74 28,-74 44,-46 C 68,-58 96,-34 86,-6 C 104,16 86,40 64,36 C 38,44 -38,44 -75,28 Z"
              fill={bodyHex === '#0a0a0c' ? '#fdfbf7' : bodyHex}
              style={{
                filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.16))',
              }}
            />

            {/* Glossy top-left specular highlight */}
            <ellipse
              cx="-34"
              cy="-34"
              rx="16"
              ry="8"
              transform="rotate(-28 -34 -34)"
              fill="#fff"
              opacity="0.45"
            />

            {/* Layer 3: Inner Creases (delicate puff divisions) */}
            <path
              d="M -30,-24 C -28,-6 -36,12 -48,18"
              stroke="#000"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
              opacity="0.07"
            />
            <path
              d="M 30,-28 C 34,-6 42,10 52,18"
              stroke="#000"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
              opacity="0.07"
            />

            {/* Live Dynamic Kawaii Face */}
            {renderLiveFace(false)}
          </g>
        )}

        {/* ── 5. TRIANGLE: Soft Puffy Onigiri Body + Specular Highlight + Kawaii Belly Face ── */}
        {normShape === 'triangle' && (
          <g className="triangle-onigiri-rig" style={{ pointerEvents: 'none' }}>
            {/* Golden radiant aura under airborne loft */}
            <circle
              cx="0"
              cy="20"
              r="55"
              fill="rgba(253, 224, 71, 0.45)"
              className={`mascot-golden-aura ${isTapping ? 'tap-golden-aura' : ''}`}
              style={{ filter: 'blur(12px)' }}
            />

            {/* Layer 1: Subtle Base Depth Shadow */}
            <path
              d="M -18,-60 C -8,-74 8,-74 18,-60 C 48,-16 74,40 86,70 C 92,82 80,88 64,88 C 32,88 -32,88 -64,88 C -80,88 -92,82 -86,70 C -74,40 -48,-16 -18,-60 Z"
              fill="#000"
              opacity="0.08"
            />

            {/* Layer 2: Puffy Onigiri Body */}
            <path
              d="M -18,-64 C -8,-78 8,-78 18,-64 C 48,-20 74,36 86,66 C 92,78 80,84 64,84 C 32,84 -32,84 -64,84 C -80,84 -92,78 -86,66 C -74,36 -48,-20 -18,-64 Z"
              fill={bodyHex === '#0a0a0c' ? '#fdfbf7' : bodyHex}
              style={{
                filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.18))',
              }}
            />

            {/* Glossy top-left specular highlight */}
            <ellipse
              cx="-26"
              cy="-40"
              rx="14"
              ry="7"
              transform="rotate(-38 -26 -40)"
              fill="#fff"
              opacity="0.45"
            />
            <circle cx="-14" cy="-52" r="3.2" fill="#fff" opacity="0.5" />

            {/* Live Dynamic Kawaii Face (positioned in wide belly) */}
            {renderLiveFace(true)}
          </g>
        )}

        {/* ── 6. HEXAGONE: Smooth Honeycomb Gem + Facet Gleam + Dynamic Live Face ── */}
        {normShape === 'hexagone' && (
          <g className="hexagone-gem-rig" style={{ pointerEvents: 'none' }}>
            {/* Golden radiant aura under airborne loft */}
            <circle
              cx="0"
              cy="24"
              r="60"
              fill="rgba(253, 224, 71, 0.45)"
              className={`mascot-golden-aura ${isTapping ? 'tap-golden-aura' : ''}`}
              style={{ filter: 'blur(12px)' }}
            />

            {/* Layer 1: Subtle Base Depth Shadow */}
            <path
              d={HEXAGONE_PATH}
              transform="translate(0, 5)"
              fill="#000"
              opacity="0.08"
            />

            {/* Layer 2: Honeycomb Gem Body */}
            <path
              d={HEXAGONE_PATH}
              fill={bodyHex === '#0a0a0c' ? '#3ecf8e' : bodyHex}
              style={{
                filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.18))',
              }}
            />

            {/* Layer 3: Top-left Glossy Glint */}
            <ellipse
              cx="-34"
              cy="-44"
              rx="18"
              ry="8"
              transform="rotate(-30 -34 -44)"
              fill="#fff"
              opacity="0.45"
            />
            <circle cx="-18" cy="-56" r="3.2" fill="#fff" opacity="0.5" />

            {/* Top Facet Shine Sparkle */}
            <path
              d="M 32,-56 Q 32,-46 42,-46 Q 32,-46 32,-36 Q 32,-46 22,-46 Q 32,-46 32,-56 Z"
              fill="#fff"
              className="hex-facet-glint"
            />

            {/* Live Dynamic Kawaii Face */}
            <g className={isTapping ? 'tap-face-hexagone' : ''}>
              {renderLiveFace(false)}
            </g>
          </g>
        )}

        {/* Cheese holes rendered on top of the body so they look indented, not like eyes */}
        {(normShape === 'fromage' || shape === 'fromage') && isBaseBodyActive && (
          <g fill="#000" opacity="0.14" style={{ pointerEvents: 'none' }}>
            <circle cx="-35" cy="-25" r="10" />
            <circle cx="45" cy="20" r="8" />
            <circle cx="-15" cy="40" r="7" />
            <circle cx="30" cy="-35" r="11" />
          </g>
        )}

        {/* Sprout leaf on top left for fromage */}
        {(normShape === 'fromage' || shape === 'fromage') && isBaseBodyActive && (
          <g style={{ pointerEvents: 'none' }}>
            <path
              d="M -10,-53 Q -15,-80 -5,-95"
              stroke="#8b5e3c"
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
            />
            <path d="M -5,-95 C -25,-105 -20,-125 10,-115 Z" fill="#15803d" />
            <path d="M -5,-95 C 5,-85 20,-95 10,-115 Z" fill="#4ade80" />
          </g>
        )}

        {/* Book pages, center binding crease, and bookmark ribbon for livre */}
        {(normShape === 'livre' || shape === 'livre') && isBaseBodyActive && (
          <g style={{ pointerEvents: 'none' }}>
            {/* Bookmark ribbon hanging from bottom center */}
            <path
              d="M -5,40 L -8,68 L 4,65 L 2,40 Z"
              fill="#ef4444"
              className={isTapping ? 'livre-ribbon-sway' : ''}
              style={{ transformOrigin: '0px 40px' }}
            />
            {/* Open book pages background */}
            <path
              d="M -42,-42 C -20,-38 0,-42 0,-42 C 0,-42 20,-38 42,-42 L 42,42 C 20,46 0,42 0,42 C 0,42 -20,46 -42,42 Z"
              fill="#fbfaf3"
              mask={`url(#${maskId})`}
              stroke="#000"
              strokeWidth="1.5"
              strokeOpacity="0.08"
              className={isTapping ? 'livre-page-turn' : ''}
              style={{ transformOrigin: '0px 0px' }}
            />
            {/* Book center binding crease */}
            <path
              d="M 0,-42 L 0,42"
              stroke="#000"
              strokeWidth="2.5"
              opacity="0.16"
              strokeLinecap="round"
              mask={`url(#${maskId})`}
            />
          </g>
        )}

        {/* Arcs (3D orbital wireframe rings, comet trails, swoosh) */}
        <g data-arcs="" />

        {/* Dots rendered ABOVE body */}
        <g data-dots-above="" />

        {/* Notification dot */}
        <circle data-notif="" fill="#2496e8" style={{ display: 'none' }} />
      </g>
    </svg>
  );
});

export default BloubMascot;
