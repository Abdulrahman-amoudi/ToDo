'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  normalizeShape,
  normalizeExpression,
  SHAPE_PATHS,
  SHAPE_EXTRAS,
  SHAPE_UNDERLAYS,
  FACE_TRANSFORMS,
  getFaceTransform,
  EXPRESSION_RENDERERS,
  resolveColor,
  isLightColor,
  getEyeColor,
} from '@/constants/mascotRegistry';
import type { StateId } from '@/lib/bot/states';
import type { ExpressionId } from '@/lib/bot/expressions';

export interface BloubMascotProps {
  size?: number;
  state?: StateId | string;
  color?: string;
  shape?: string;
  expression?: ExpressionId | string;
  gaze?: { yaw: number; pitch: number; roll?: number } | string;
  onInteract?: () => void;
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
  isStatic = false,
  animated = true,
  isTyping: propIsTyping,
  className = '',
  style = {},
}: BloubMascotProps) {
  const [isInteracting, setIsInteracting] = useState(false);
  const [isBouncingState, setIsBouncingState] = useState(state === 'orbit');
  const [internalTyping, setInternalTyping] = useState(false);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);
  const faceGroupRef = useRef<SVGGElement>(null);
  const bodyGroupRef = useRef<SVGGElement>(null);

  // Normalization and blink gating: closed/sunglasses expressions never blink
  const normShape = normalizeShape(shape);
  const normExpr = normalizeExpression(expression);
  const isSun = normShape === 'soleil';
  const isHexagon = normShape === 'hexagone';
  const isCircle = normShape === 'cercle';

  // Look coordinates (normalized -1 to 1, strictly horizontal)
  const targetLook = useRef({ x: 0, y: 0 });
  const currentLook = useRef({ x: 0, y: 0 });
  const clockRef = useRef(0);
  const lastTimeRef = useRef(0);

  // Sun-specific smooth turbine spin physics
  const sunSpinAngleRef = useRef(0);
  const sunSpinSpeedRef = useRef(0);

  // Listen for user typing activity across all active inputs / window
  useEffect(() => {
    if (isStatic || !animated) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'].includes(e.key)) return;
      setInternalTyping(true);
      // Give a tiny energetic impulse to sun spin on each keystroke
      if (isSun) {
        sunSpinSpeedRef.current = Math.min(sunSpinSpeedRef.current + 35, 260);
      }
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
  }, [isStatic, animated, isSun]);

  const activeTyping = propIsTyping ?? internalTyping;

  // Sync state prop with squish-pop animation
  useEffect(() => {
    if (state === 'orbit' || state === 'wide') {
      setIsBouncingState(true);
      const timer = setTimeout(() => setIsBouncingState(false), 1250);
      return () => clearTimeout(timer);
    }
  }, [state]);

  // Handle explicit gaze prop
  useEffect(() => {
    const resolved = resolveGaze(gaze);
    if (resolved) {
      targetLook.current = {
        x: Math.max(-1, Math.min(1, resolved.yaw / 35)),
        y: 0,
      };
    }
  }, [gaze]);

  // Window-wide pointer follow (horizontal tracking only, strictly zero downward ground gaze)
  useEffect(() => {
    if (isStatic || !animated) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const mascotCenterX = rect.left + rect.width / 2;

      // Distance from mascot center normalized with max range (strictly horizontal tracking)
      const maxDistanceX = Math.max(window.innerWidth / 2, 280);
      const dx = Math.max(-1, Math.min(1, (e.clientX - mascotCenterX) / maxDistanceX));

      targetLook.current = { x: dx, y: 0 };
    };

    const handlePointerLeave = () => {
      targetLook.current = { x: 0, y: 0 };
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerleave', handlePointerLeave);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [isStatic, animated]);

  // 120fps requestAnimationFrame Physics & Animation Loop
  useEffect(() => {
    if (isStatic || !animated) return;

    let rafId: number;

    const tick = (time: number) => {
      if (lastTimeRef.current === 0) lastTimeRef.current = time;
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.08);
      lastTimeRef.current = time;
      clockRef.current += dt;

      const t = clockRef.current;

      // 1. Spring-damped smooth lerp toward target look (strictly horizontal eye tracking)
      const lerpFactor = Math.min(1, dt * 8.5);
      currentLook.current.x += (targetLook.current.x - currentLook.current.x) * lerpFactor;
      currentLook.current.y = 0;

      // 2. Gentle organic breathing bob (subtle 0.4px float, zero downward droop)
      const floatY = Math.sin(t * 1.8) * 0.4;
      const breathScaleX = 1 + Math.sin(t * 1.8) * 0.010;
      const breathScaleY = 1 - Math.sin(t * 1.8) * 0.010;

      // 3. Coordinates for gaze, tilt, and head motion (strictly zero downward pitch)
      const faceX = currentLook.current.x * 3.6;
      const faceY = activeTyping ? -0.8 : 0;
      const headTilt = currentLook.current.x * 2.0;
      const bodyTilt = currentLook.current.x * 1.0;

      // 4. Sun turbine spin physics while typing
      if (isSun) {
        if (activeTyping) {
          sunSpinSpeedRef.current += (160 - sunSpinSpeedRef.current) * Math.min(1, dt * 10);
        } else {
          sunSpinSpeedRef.current += (0 - sunSpinSpeedRef.current) * Math.min(1, dt * 4.5);
        }
        sunSpinAngleRef.current = (sunSpinAngleRef.current + sunSpinSpeedRef.current * dt) % 360;
      }

      // Update Body Group (Rays rotate smoothly for sun, bobs and breathes as one unit)
      if (bodyGroupRef.current) {
        const sunRot = isSun ? sunSpinAngleRef.current : 0;
        bodyGroupRef.current.setAttribute(
          'transform',
          `translate(0, ${floatY}) translate(50, 50) rotate(${bodyTilt + sunRot}) scale(${breathScaleX}, ${breathScaleY}) translate(-50, -50)`
        );
      }

      // Update Face Group (moves 1:1 with floatY, permanently stable and forward-facing, zero downward nod)
      if (faceGroupRef.current) {
        faceGroupRef.current.setAttribute(
          'transform',
          `translate(${faceX}, ${faceY + floatY}) translate(50, 50) rotate(${headTilt}) translate(-50, -50)`
        );
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isStatic, animated, normShape, isSun, activeTyping]);

  // Resolve body and high-contrast eye colors
  const bodyHex = resolveColor(color);
  const isLight = isLightColor(bodyHex);
  const eyeColor = getEyeColor(bodyHex);

  const shapeD = SHAPE_PATHS[normShape] || SHAPE_PATHS.soleil;
  const renderUnderlay = SHAPE_UNDERLAYS[normShape];
  const renderExpression =
    EXPRESSION_RENDERERS[normExpr] || EXPRESSION_RENDERERS.neutre;
  const renderExtra = SHAPE_EXTRAS[normShape];

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onInteract?.();
      if (!isStatic && animated) {
        setIsInteracting(true);
        setIsBouncingState(true);
        setTimeout(() => {
          setIsInteracting(false);
          setIsBouncingState(false);
        }, 1250);
      }
    },
    [onInteract, isStatic, animated]
  );

  const isBouncing = isInteracting || isBouncingState;
  const isThinking = state === 'thinking';
  const isSleeping = state === 'sleep';

  return (
    <svg
      ref={svgRef}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      onClick={handleClick}
      role="img"
      aria-label={`Mascot ${normShape} with ${normExpr} expression`}
      className={`select-none overflow-visible transition-transform duration-200 ${
        isBouncing
          ? isSun
            ? 'sun-tap-bounce'
            : isHexagon
            ? 'hexagon-tap-roll'
            : isCircle
            ? 'circle-tap-bounce'
            : 'mascot-squish-active'
          : ''
      } ${
        activeTyping
          ? isSun
            ? 'sun-typing-glow'
            : isHexagon
            ? 'hexagon-typing-rock'
            : isCircle
            ? 'circle-typing-levitate'
            : ''
          : ''
      } ${
        isThinking ? '-rotate-6 scale-105' : ''
      } ${className}`}
      style={{
        cursor: onInteract || (!isStatic && animated) ? 'pointer' : 'default',
        transformOrigin: '50% 50%',
        ['--mascot-glow-soft' as any]: hexToRgba(bodyHex, 0.45),
        ['--mascot-glow-mid' as any]: hexToRgba(bodyHex, 0.65),
        ['--mascot-glow-intense' as any]: hexToRgba(bodyHex, 0.85),
        ...style,
      }}
    >
      <style>{`
        /* 1. Universal Tactile Mochi Squish & Hop for non-specialized shapes (Extended 1.25s) */
        @keyframes mascotSquishPop {
          0% { transform: scale(1) translateY(0); }
          15% { transform: scale(1.15, 0.85) translateY(2.5px); }
          42% { transform: scale(0.92, 1.12) translateY(-9px); }
          68% { transform: scale(1.05, 0.96) translateY(2px); }
          85% { transform: scale(0.99, 1.01) translateY(-0.5px); }
          100% { transform: scale(1) translateY(0); }
        }
        .mascot-squish-active {
          animation: mascotSquishPop 1.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        /* 2. Unique Sun Tactile Elastic Hop (Extended 1.25s with floaty apex hang-time) */
        @keyframes sunTapBounce {
          0% { transform: scale(1) translateY(0); }
          14% { transform: scale(1.14, 0.86) translateY(2.5px); }
          38% { transform: scale(0.92, 1.12) translateY(-10px); }
          56% { transform: scale(1.01, 0.99) translateY(-7.5px); }
          74% { transform: scale(1.06, 0.95) translateY(2px); }
          88% { transform: scale(0.99, 1.01) translateY(-0.5px); }
          100% { transform: scale(1) translateY(0); }
        }
        .sun-tap-bounce {
          animation: sunTapBounce 1.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        /* 3. Unique Sun Rays Elastic Twirl (Smooth silky 90deg ray twirl with dynamic matching color shimmer) */
        @keyframes sunRaysTwirl {
          0% {
            transform: rotate(0deg) scale(1);
          }
          15% {
            transform: rotate(12deg) scale(1.03);
            filter: drop-shadow(0 0 8px var(--mascot-glow-soft, rgba(251, 191, 36, 0.45)));
          }
          45% {
            transform: rotate(75deg) scale(1.14);
            filter: drop-shadow(0 0 18px var(--mascot-glow-intense, rgba(251, 191, 36, 0.75)));
          }
          65% {
            transform: rotate(96deg) scale(1.08);
            filter: drop-shadow(0 0 14px var(--mascot-glow-mid, rgba(251, 191, 36, 0.6)));
          }
          82% {
            transform: rotate(88deg) scale(0.98);
            filter: drop-shadow(0 0 6px var(--mascot-glow-soft, rgba(251, 191, 36, 0.3)));
          }
          100% {
            transform: rotate(90deg) scale(1);
            filter: drop-shadow(0 3px 8px rgba(0,0,0,0.18));
          }
        }
        .sun-rays-twirl {
          animation: sunRaysTwirl 1.25s cubic-bezier(0.25, 1.25, 0.35, 1) forwards;
        }

        /* 4. Sun Joyful Face Hop (Synchronized with the floaty apex) */
        @keyframes sunFacePop {
          0% { transform: scale(1) translateY(0); }
          38% { transform: scale(1.10) translateY(-3.5px); }
          60% { transform: scale(1.04) translateY(-2px); }
          80% { transform: scale(0.98) translateY(0.5px); }
          100% { transform: scale(1) translateY(0); }
        }
        .sun-face-pop {
          animation: sunFacePop 1.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        /* 5. Ambient Sun Typing Energy Glow with dynamic matching color */
        @keyframes sunTypingGlow {
          0%, 100% {
            filter: drop-shadow(0 0 6px var(--mascot-glow-soft, rgba(251, 191, 36, 0.4)));
          }
          50% {
            filter: drop-shadow(0 0 16px var(--mascot-glow-mid, rgba(251, 191, 36, 0.75)));
          }
        }
        .sun-typing-glow {
          animation: sunTypingGlow 1.2s ease-in-out infinite;
        }

        /* 6. Unique Hexagon Tumble Roll (Physical 360-degree roll across ground and back) */
        @keyframes hexagonTapRoll {
          0% {
            transform: translateX(0px) translateY(0px) rotate(0deg);
          }
          8% {
            transform: translateX(-4px) translateY(1.5px) rotate(-14deg);
          }
          22% {
            transform: translateX(12px) translateY(-5px) rotate(90deg);
          }
          36% {
            transform: translateX(24px) translateY(0px) rotate(195deg);
          }
          50% {
            transform: translateX(34px) translateY(-6px) rotate(295deg);
          }
          58% {
            transform: translateX(38px) translateY(1px) rotate(360deg) scale(0.92, 1.08);
            filter: drop-shadow(0 0 16px var(--mascot-glow-intense, rgba(59, 130, 246, 0.8)));
          }
          68% {
            transform: translateX(26px) translateY(-5px) rotate(260deg);
          }
          80% {
            transform: translateX(10px) translateY(0px) rotate(125deg);
          }
          90% {
            transform: translateX(-5px) translateY(-1.5px) rotate(-18deg);
          }
          96% {
            transform: translateX(1.5px) translateY(0px) rotate(6deg);
          }
          100% {
            transform: translateX(0px) translateY(0px) rotate(0deg);
          }
        }
        .hexagon-tap-roll {
          animation: hexagonTapRoll 1.25s cubic-bezier(0.25, 1, 0.35, 1) forwards;
        }

        /* 7. Unique Hexagon Rocking Roll while typing */
        @keyframes hexagonTypingRock {
          0%, 100% {
            transform: translateX(0px) translateY(0px) rotate(0deg);
            filter: drop-shadow(0 0 5px var(--mascot-glow-soft, rgba(59, 130, 246, 0.4)));
          }
          25% {
            transform: translateX(4px) translateY(-1px) rotate(10deg);
            filter: drop-shadow(0 0 10px var(--mascot-glow-mid, rgba(59, 130, 246, 0.6)));
          }
          50% {
            transform: translateX(0px) translateY(0px) rotate(0deg);
            filter: drop-shadow(0 0 15px var(--mascot-glow-intense, rgba(59, 130, 246, 0.75)));
          }
          75% {
            transform: translateX(-4px) translateY(-1px) rotate(-10deg);
            filter: drop-shadow(0 0 10px var(--mascot-glow-mid, rgba(59, 130, 246, 0.6)));
          }
        }
        .hexagon-typing-rock {
          animation: hexagonTypingRock 0.85s ease-in-out infinite;
        }

        /* 8. Unique Circle In-Place Superball Squish Bounce (Extended 1.25s) */
        @keyframes circleTapBounce {
          0% {
            transform: translateY(0px) scale(1, 1);
          }
          10% {
            /* Deep floor squash before launch */
            transform: translateY(5px) scale(1.36, 0.64);
          }
          24% {
            /* Rocket launch with vertical elongation */
            transform: translateY(-20px) scale(0.76, 1.30);
          }
          38% {
            /* Floaty apex hang-time with theme glow flare */
            transform: translateY(-24px) scale(1.06, 0.94);
            filter: drop-shadow(0 0 18px var(--mascot-glow-intense, rgba(59, 130, 246, 0.8)));
          }
          52% {
            /* Gravity drop stretch */
            transform: translateY(-8px) scale(0.86, 1.16);
          }
          62% {
            /* Rebound ground squash */
            transform: translateY(3.5px) scale(1.26, 0.76);
          }
          74% {
            /* Secondary rebound hop */
            transform: translateY(-9px) scale(0.90, 1.10);
          }
          84% {
            /* Cushioned landing */
            transform: translateY(1px) scale(1.08, 0.94);
          }
          92% {
            /* Soft jelly ripple settle */
            transform: translateY(-0.5px) scale(0.98, 1.02);
          }
          100% {
            transform: translateY(0px) scale(1, 1);
          }
        }
        .circle-tap-bounce {
          animation: circleTapBounce 1.25s cubic-bezier(0.28, 1.4, 0.35, 1) forwards;
        }

        /* 9. Circle Air Flow Particles Burst on Tap */
        @keyframes circleAirBlast {
          0% {
            opacity: 0;
            transform: translateY(0) scale(0.8);
          }
          12% {
            opacity: 0.35;
            transform: translateY(3px) scale(1.1);
          }
          26% {
            opacity: 1;
            transform: translateY(14px) scale(1.05);
            filter: drop-shadow(0 0 8px var(--mascot-glow-intense, rgba(59, 130, 246, 0.8)));
          }
          48% {
            opacity: 0.85;
            transform: translateY(20px) scale(1.18);
          }
          72% {
            opacity: 0.25;
            transform: translateY(24px) scale(1.28);
          }
          100% {
            opacity: 0;
            transform: translateY(28px) scale(1.35);
          }
        }
        .circle-air-blast {
          animation: circleAirBlast 1.25s cubic-bezier(0.2, 0.8, 0.3, 1) forwards;
        }

        /* 10. Circle Air Cushion Levitation while typing */
        @keyframes circleTypingLevitate {
          0%, 100% {
            transform: translateY(0px) scale(1, 1);
            filter: drop-shadow(0 0 6px var(--mascot-glow-soft, rgba(59, 130, 246, 0.4)));
          }
          35% {
            transform: translateY(-4px) scale(0.96, 1.05);
            filter: drop-shadow(0 0 14px var(--mascot-glow-mid, rgba(59, 130, 246, 0.65)));
          }
          65% {
            transform: translateY(-1.5px) scale(1.04, 0.96);
            filter: drop-shadow(0 0 16px var(--mascot-glow-intense, rgba(59, 130, 246, 0.8)));
          }
        }
        .circle-typing-levitate {
          animation: circleTypingLevitate 0.9s ease-in-out infinite;
        }

        /* 11. Continuous Airflow Stream while typing */
        @keyframes circleAirLevitate {
          0%, 100% {
            opacity: 0.45;
            transform: translateY(1.5px) scale(0.98);
          }
          50% {
            opacity: 0.95;
            transform: translateY(-3.5px) scale(1.04);
            filter: drop-shadow(0 0 8px var(--mascot-glow-mid, rgba(59, 130, 246, 0.6)));
          }
        }
        .circle-air-levitate {
          animation: circleAirLevitate 0.9s ease-in-out infinite;
        }
      `}</style>

      {/* Layer 0: Circle Aerodynamic Air Flow Streamlines & Breeze Particles */}
      {isCircle && (
        <g
          className={`circle-air-layer ${
            isBouncing
              ? 'circle-air-blast'
              : activeTyping
              ? 'circle-air-levitate'
              : 'opacity-0'
          }`}
          style={{
            pointerEvents: 'none',
            transformOrigin: '50% 50%',
            transition: 'opacity 0.25s ease',
          }}
        >
          {/* Left curved slipstream air streaks */}
          <path
            d="M 12 30 C 4 42 4 58 12 70"
            fill="none"
            stroke="var(--mascot-glow-mid, rgba(255,255,255,0.45))"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M 6 40 C 1 48 1 54 6 62"
            fill="none"
            stroke="var(--mascot-glow-soft, rgba(255,255,255,0.3))"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Right curved slipstream air streaks */}
          <path
            d="M 88 30 C 96 42 96 58 88 70"
            fill="none"
            stroke="var(--mascot-glow-mid, rgba(255,255,255,0.45))"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M 94 40 C 99 48 99 54 94 62"
            fill="none"
            stroke="var(--mascot-glow-soft, rgba(255,255,255,0.3))"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Bottom downward air thrust whoosh jets */}
          <line
            x1="38"
            y1="82"
            x2="38"
            y2="96"
            stroke="var(--mascot-glow-soft, rgba(255,255,255,0.35))"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <line
            x1="50"
            y1="85"
            x2="50"
            y2="102"
            stroke="var(--mascot-glow-intense, rgba(255,255,255,0.65))"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <line
            x1="62"
            y1="82"
            x2="62"
            y2="96"
            stroke="var(--mascot-glow-soft, rgba(255,255,255,0.35))"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Air flow levitation breeze particles */}
          <circle cx="18" cy="22" r="2" fill="var(--mascot-glow-mid, rgba(255,255,255,0.5))" />
          <circle cx="82" cy="20" r="2.5" fill="var(--mascot-glow-mid, rgba(255,255,255,0.5))" />
          <circle cx="14" cy="62" r="1.5" fill="var(--mascot-glow-soft, rgba(255,255,255,0.4))" />
          <circle cx="86" cy="64" r="1.8" fill="var(--mascot-glow-soft, rgba(255,255,255,0.4))" />
        </g>
      )}

      {/* Layer 1: Unified Mascot Body (Cushion Depth + Silhouette + Extras breathe and float together) */}
      <g ref={bodyGroupRef} style={{ transformOrigin: '50% 50%' }}>
        <g
          className={
            isBouncing
              ? isSun
                ? 'sun-rays-twirl'
                : ''
              : ''
          }
          style={{ transformOrigin: '50% 50%' }}
        >
          {renderUnderlay ? (
            renderUnderlay(bodyHex)
          ) : (
            <path
              key={`underlay-${normShape}`}
              d={shapeD}
              fill={bodyHex}
              transform="translate(0, 3)"
              filter="brightness(0.82)"
              style={{
                pointerEvents: 'none',
                transition: 'fill 0.2s ease',
              }}
            />
          )}

          <path
            key={`body-${normShape}`}
            d={shapeD}
            fill={bodyHex}
            className="mascot-body-path"
            style={{
              transition: 'fill 0.2s ease',
              filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.18))',
            }}
          />

          {renderExtra && renderExtra()}
        </g>
      </g>

      {/* Layer 2: Mascot Expression with Per-Shape Center Transform & In-Place Gaze/Blink */}
      <g
        ref={faceGroupRef}
        className={`mascot-face-group ${
          isBouncing
            ? isSun
              ? 'sun-face-pop'
              : ''
            : ''
        }`}
        style={{
          transformOrigin: '50% 50%',
          opacity: isSleeping ? 0.45 : 1,
        }}
      >
        <g
          transform={FACE_TRANSFORMS[normShape] || getFaceTransform(normShape)}
          style={{ transformOrigin: '50% 50%' }}
        >
          {renderExpression(eyeColor, isLight)}
        </g>
      </g>
    </svg>
  );
});

export default BloubMascot;
