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
      engineRef.current.setState(state as StateId, clockRef.current);
      if (state === 'orbit') {
        setIsTapping(true);
        if (animTimerRef.current) clearTimeout(animTimerRef.current);
        animTimerRef.current = setTimeout(() => {
          if (engineRef.current && engineRef.current.state === 'orbit') {
            engineRef.current.setState('idle', clockRef.current);
            stateRef.current = 'idle';
          }
          setIsTapping(false);
        }, 3400);
      }
    }
  }, [state]);

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

  // Pointer follow (window-wide)
  useEffect(() => {
    if (isStatic || !animated) return;

    const handleMove = (e: PointerEvent) => {
      if (!engineRef.current) return;
      const hw = window.innerWidth / 2;
      const hh = window.innerHeight / 2;
      const yaw = ((e.clientX - hw) / hw) * 35;
      const pitch = -((e.clientY - hh) / hh) * 22;
      engineRef.current.setLook(
        { yaw, pitch, mix: 0.5, spin: 0, wander: 0.1 },
        clockRef.current,
        0.25
      );
    };

    const handleLeave = () => {
      engineRef.current?.setLook(null, clockRef.current, 0.6);
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

      // Eyes (inside mask — cut holes through body)
      const maskEyes = svg.querySelector('[data-mask-eyes]');
      if (maskEyes) {
        maskEyes.innerHTML = '';
        for (const eye of frame.eyes) {
          const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          p.setAttribute('d', eye.d);
          p.setAttribute('transform', eye.matrix);
          p.setAttribute('opacity', String(eye.alpha));
          p.setAttribute('fill', '#000');
          maskEyes.appendChild(p);
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

  const [tapCount, setTapCount] = useState(0);

  useEffect(() => {
    if (!isStatic && animated !== false && normShape === 'soleil') {
      setIsTapping(true);
      setTapCount((c) => c + 1);
      const timer = setTimeout(() => {
        setIsTapping(false);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [normShape, isStatic, animated]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onClick?.(e);
      onInteract?.();
      if (!isStatic && animated !== false) {
        setIsTapping(true);
        setTapCount((c) => c + 1);

        if (normShape === 'soleil') {
          if (animTimerRef.current) clearTimeout(animTimerRef.current);
          animTimerRef.current = setTimeout(() => {
            setIsTapping(false);
          }, 1200);
        } else if (engineRef.current) {
          engineRef.current.setState('orbit', clockRef.current);
          stateRef.current = 'idle';

          if (animTimerRef.current) clearTimeout(animTimerRef.current);
          animTimerRef.current = setTimeout(() => {
            if (engineRef.current && engineRef.current.state === 'orbit') {
              engineRef.current.setState('idle', clockRef.current);
              stateRef.current = 'idle';
              const target = resolveGaze(gazeRef.current);
              if (target) {
                engineRef.current.setLook(
                  { yaw: target.yaw, pitch: target.pitch, mix: 0.7, spin: 0, wander: 0.15 },
                  clockRef.current,
                  0.3
                );
              }
            }
            setIsTapping(false);
          }, 3400);
        }
      }
    },
    [onClick, onInteract, isStatic, animated, normShape]
  );

  const isThinking = state === 'thinking';

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

        /* ── Soleil (Sun) Kinetic Engine: Calm, Radiant & Slow ── */
        @keyframes idleSoleil {
          0% {
            transform: scale(1) rotate(0deg) translateY(0);
          }
          50% {
            transform: scale(1.06) rotate(18deg) translateY(-5px);
          }
          100% {
            transform: scale(1) rotate(36deg) translateY(0);
          }
        }

        @keyframes idleShadowSoleil {
          0%, 100% {
            transform: scale(1);
            opacity: 0.3;
          }
          50% {
            transform: scale(0.90);
            opacity: 0.2;
          }
        }

        @keyframes tapBurstSoleil {
          0% {
            transform: scale(1) rotate(0deg) translateY(0);
          }
          18% {
            transform: scale(0.92) rotate(-10deg) translateY(4px);
          }
          50% {
            transform: scale(1.12) rotate(36deg) translateY(-18px);
          }
          80% {
            transform: scaleX(1.06) scaleY(0.96) rotate(36deg) translateY(2px);
          }
          100% {
            transform: scale(1) rotate(36deg) translateY(0);
          }
        }

        @keyframes tapShadowSoleil {
          0% {
            transform: scale(1);
            opacity: 0.3;
          }
          18% {
            transform: scale(1.10);
            opacity: 0.38;
          }
          50% {
            transform: scale(0.72);
            opacity: 0.15;
          }
          80% {
            transform: scale(1.05);
            opacity: 0.32;
          }
          100% {
            transform: scale(1);
            opacity: 0.3;
          }
        }

        @keyframes tapFaceSoleil {
          0% {
            transform: scale(1) rotate(0deg) translateY(0);
          }
          18% {
            transform: scale(0.94) rotate(-6deg) translateY(2px);
          }
          50% {
            transform: scale(1.08) rotate(28deg) translateY(-12px);
          }
          80% {
            transform: scale(1.02) rotate(34deg) translateY(1px);
          }
          100% {
            transform: scale(1) rotate(36deg) translateY(0);
          }
        }

        .idle-soleil {
          animation: idleSoleil 5.2s ease-in-out infinite;
          transform-origin: 0px 0px;
        }
        .tap-burst-soleil {
          animation: tapBurstSoleil 1200ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
          transform-origin: 0px 0px;
        }
        .idle-shadow-soleil {
          animation: idleShadowSoleil 5.2s ease-in-out infinite;
          transform-origin: 0px 114px;
        }
        .tap-shadow-soleil {
          animation: tapShadowSoleil 1200ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
          transform-origin: 0px 114px;
        }
        .mascot-face-rig {
          transition: transform 80ms cubic-bezier(0.16, 1, 0.3, 1);
          transform-origin: 0px 0px;
        }
        .tap-face-soleil {
          animation: tapFaceSoleil 1200ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
          transform-origin: 0px 0px;
        }
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
          {/* White body shape — fills the mask */}
          <path data-mask-body="" fill="#fff" />
          {/* Black eye holes — cut through the body */}
          <g
            data-mask-eyes=""
            className={`mascot-face-rig ${
              normShape === 'soleil' && isTapping ? 'tap-face-soleil' : ''
            }`}
          />
        </mask>
      </defs>

      {/* Grok Typing Dots: Smooth Cross-fade and Spring Scale */}
      <g
        className="grok-typing-dots-container"
        style={{
          pointerEvents: 'none',
          opacity: activeTyping ? 1 : 0,
          transform: activeTyping ? 'scale(1)' : 'scale(0.82)',
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
        cy="114"
        rx="48"
        ry="9"
        fill="#000"
        className={
          normShape === 'soleil'
            ? isTapping
              ? 'tap-shadow-soleil'
              : isStatic
              ? ''
              : 'idle-shadow-soleil'
            : ''
        }
        style={{
          pointerEvents: 'none',
          display: normShape === 'soleil' && !activeTyping ? 'block' : 'none',
        }}
      />

      {/* Mascot Main Layer */}
      <g
        key={normShape === 'soleil' ? `soleil-${tapCount}` : undefined}
        className={`mascot-main-group ${
          normShape === 'soleil'
            ? `mascot-tap-rig ${isTapping ? 'tap-burst-soleil' : isStatic ? '' : 'idle-soleil'}`
            : ''
        }`}
        onAnimationEnd={() => {
          if (normShape === 'soleil' && isTapping) {
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
        {/* Dots rendered BEHIND body */}
        <g data-dots-behind="" />

        {/* Body with eye holes punched via mask */}
        <path
          data-body=""
          mask={`url(#${maskId})`}
          style={{
            filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.18))',
            transition: 'fill 0.2s ease',
          }}
        />

        {/* Soleil inner core disc + kawaii blush cheeks */}
        {normShape === 'soleil' && (
          <g className="soleil-core-disc" style={{ pointerEvents: 'none' }}>
            {/* Subtle inner core disc depth */}
            <circle cx="0" cy="0" r="42" fill="#fff" opacity="0.12" />
            {/* Kawaii blush cheeks */}
            <circle cx="-32" cy="12" r="8" fill="#ff8a80" opacity={isTapping ? 0.65 : 0.45} />
            <circle cx="32" cy="12" r="8" fill="#ff8a80" opacity={isTapping ? 0.65 : 0.45} />
          </g>
        )}

        {/* Cheese holes rendered on top of the body so they look indented, not like eyes */}
        {shape === 'fromage' && isBaseBodyActive && !isTapping && (
          <g fill="#000" opacity="0.14" style={{ pointerEvents: 'none' }}>
            <circle cx="-35" cy="-25" r="10" />
            <circle cx="45" cy="20" r="8" />
            <circle cx="-15" cy="40" r="7" />
            <circle cx="30" cy="-35" r="11" />
          </g>
        )}

        {/* Sprout leaf on top left for fromage */}
        {shape === 'fromage' && isBaseBodyActive && !isTapping && (
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
        {(normShape === 'livre' || shape === 'livre') && isBaseBodyActive && !isTapping && (
          <g style={{ pointerEvents: 'none' }}>
            {/* Bookmark ribbon hanging from bottom center */}
            <path d="M -5,40 L -8,68 L 4,65 L 2,40 Z" fill="#ef4444" />
            {/* Open book pages background */}
            <path
              d="M -42,-42 C -20,-38 0,-42 0,-42 C 0,-42 20,-38 42,-42 L 42,42 C 20,46 0,42 0,42 C 0,42 -20,46 -42,42 Z"
              fill="#fbfaf3"
              mask={`url(#${maskId})`}
              stroke="#000"
              strokeWidth="1.5"
              strokeOpacity="0.08"
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
