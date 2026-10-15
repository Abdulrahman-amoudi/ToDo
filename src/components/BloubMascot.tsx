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
}: BloubMascotProps) {
  const [tapCount, setTapCount] = useState(0);
  const [isTapping, setIsTapping] = useState(false);
  const [internalTyping, setInternalTyping] = useState(false);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);
  const faceGroupRef = useRef<SVGGElement>(null);
  const bodyGroupRef = useRef<SVGGElement>(null);

  // Normalization and blink gating: closed/sunglasses expressions never blink
  const normShape = normalizeShape(shape);
  const prevShapeRef = useRef(normShape);
  const normExpr = normalizeExpression(expression);
  const isSun = normShape === 'soleil';
  const isHexagon = normShape === 'hexagone';
  const isCircle = normShape === 'cercle';
  const isBook = normShape === 'livre';
  const isCloud = normShape === 'nuage' || normShape === 'capsule';

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

  // Sync state prop with kinetic tap burst
  useEffect(() => {
    if (state === 'orbit' || state === 'wide') {
      if (!isStatic && animated) {
        setTapCount((c) => c + 1);
        setIsTapping(true);
      }
    }
  }, [state, isStatic, animated]);

  // Trigger bespoke tap burst on shape change (e.g. when selected in Settings)
  useEffect(() => {
    if (prevShapeRef.current !== normShape) {
      prevShapeRef.current = normShape;
      if (!isStatic && animated) {
        setTapCount((c) => c + 1);
        setIsTapping(true);
      }
    }
  }, [normShape, isStatic, animated]);

  // Fallback safety timeout for isTapping
  useEffect(() => {
    if (isTapping) {
      const timer = setTimeout(() => {
        setIsTapping(false);
      }, 750);
      return () => clearTimeout(timer);
    }
  }, [isTapping, tapCount]);

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
      const faceY = 0;
      const headTilt = currentLook.current.x * 2.0;
      const bodyTilt = currentLook.current.x * 1.0;

      // Update Body Group (bobs and breathes as one unified unit)
      if (bodyGroupRef.current) {
        bodyGroupRef.current.setAttribute(
          'transform',
          `translate(0, ${floatY}) translate(50, 50) rotate(${bodyTilt}) scale(${breathScaleX}, ${breathScaleY}) translate(-50, -50)`
        );
      }

      // Update Face Group (moves 1:1 with floatY and faceX, permanently stable and forward-facing)
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

  const handleMascotTap = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      onClick?.(e);
      onInteract?.();
      if (!isStatic && animated) {
        setTapCount((prev) => prev + 1);
        setIsTapping(true);
      }
    },
    [onClick, onInteract, isStatic, animated]
  );

  const isThinking = state === 'thinking';
  const isSleeping = state === 'sleep';

  return (
    <svg
      ref={svgRef}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      onClick={handleMascotTap}
      role="img"
      aria-label={`Mascot ${normShape} with ${normExpr} expression`}
      className={`select-none overflow-visible transition-transform duration-200 ${
        isThinking ? '-rotate-6 scale-105' : ''
      } ${
        isStatic || size <= 44 ? 'mascot-static' : ''
      } ${
        activeTyping ? 'mascot-typing' : ''
      } ${className}`}
      style={{
        cursor: onInteract || onClick || (!isStatic && animated) ? 'pointer' : 'default',
        transformOrigin: '50% 50%',
        ['--mascot-glow-soft' as any]: hexToRgba(bodyHex, 0.45),
        ['--mascot-glow-mid' as any]: hexToRgba(bodyHex, 0.65),
        ['--mascot-glow-intense' as any]: hexToRgba(bodyHex, 0.85),
        ...style,
      }}
    >
      <style>{`
        /* 12 BESPOKE SHAPE TAP BURST ANIMATIONS (Groq-style high-velocity kinetic physics, 650ms) */
        .mascot-tap-rig {
          transform-origin: 50% 50%;
          transform-box: fill-box;
        }

        /* 1. Cercle: High-Velocity Basketball Slam & Double Dribble */
        @keyframes tapBurstCercle {
          0% { transform: scale(1) translateY(0); }
          18% { transform: translateY(12px) scaleX(1.32) scaleY(0.68); }
          48% { transform: translateY(-26px) scaleX(0.84) scaleY(1.22); }
          72% { transform: translateY(6px) scaleX(1.16) scaleY(0.84); }
          88% { transform: translateY(-6px) scaleX(0.96) scaleY(1.04); }
          100% { transform: scale(1) translateY(0); }
        }
        .tap-burst-cercle {
          animation: tapBurstCercle 0.65s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        /* 2. Hexagone: Harsh 180° / 360° Mechanical Heavy-Metal Flip & Slam */
        @keyframes tapBurstHexagone {
          0% { transform: rotate(0deg) translateY(0); }
          25% { transform: translateY(-14px) rotate(90deg) scale(1.06); }
          50% { transform: translateY(4px) rotate(180deg) scaleX(1.14) scaleY(0.88); }
          75% { transform: translateY(-10px) rotate(270deg); }
          90% { transform: translateY(3px) rotate(360deg) scaleX(1.08) scaleY(0.92); }
          100% { transform: rotate(360deg) scale(1); }
        }
        .tap-burst-hexagone {
          animation: tapBurstHexagone 0.65s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        /* 3. Livre: Snap-Shut Hardcover Clap & Tornado Page Riffle */
        @keyframes tapBurstLivre {
          0% { transform: scaleX(1) scaleY(1) translateY(0); }
          22% { transform: scaleX(0.14) scaleY(1.12) translateY(-10px); }
          45% { transform: scaleX(1.24) scaleY(0.90) translateY(4px) rotate(-4deg); }
          68% { transform: scaleX(0.92) scaleY(1.06) translateY(-6px) rotate(4deg); }
          85% { transform: scaleX(1.05) scaleY(0.97); }
          100% { transform: scale(1) translateY(0); }
        }
        .tap-burst-livre {
          animation: tapBurstLivre 0.65s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        /* 4. Soleil: Supernova Charge-Up & 180° Rotary Saw-Spin */
        @keyframes tapBurstSoleil {
          0% { transform: scale(1) rotate(0deg); }
          25% { transform: scale(0.72) rotate(-35deg); }
          55% { transform: scale(1.28) rotate(145deg); }
          80% { transform: scale(0.94) rotate(190deg); }
          100% { transform: scale(1) rotate(180deg); }
        }
        .tap-burst-soleil {
          animation: tapBurstSoleil 0.65s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        /* 5. Squircle: 3D Coin-Flip & Isometric Snap */
        @keyframes tapBurstSquircle {
          0% { transform: perspective(400px) rotateY(0deg) scale(1); }
          30% { transform: perspective(400px) translateY(-16px) rotateY(180deg) rotateZ(-8deg) scale(1.12); }
          65% { transform: perspective(400px) translateY(4px) rotateY(360deg) rotateZ(4deg) scaleX(1.10) scaleY(0.90); }
          100% { transform: perspective(400px) rotateY(360deg) scale(1); }
        }
        .tap-burst-squircle {
          animation: tapBurstSquircle 0.65s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        /* 6. Galet: Water-Skip Triple Ricochet */
        @keyframes tapBurstGalet {
          0% { transform: translate(0, 0) rotate(0deg); }
          20% { transform: translate(-14px, 6px) rotate(-14deg) scaleX(1.15) scaleY(0.85); }
          45% { transform: translate(12px, -16px) rotate(12deg) scale(0.95); }
          70% { transform: translate(-6px, 4px) rotate(-6deg) scaleX(1.10) scaleY(0.90); }
          100% { transform: translate(0, 0) rotate(0deg) scale(1); }
        }
        .tap-burst-galet {
          animation: tapBurstGalet 0.65s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        /* 7. Capsule: Spring-Loaded Pill Launcher & 360° Backflip */
        @keyframes tapBurstCapsule {
          0% { transform: translateY(0) scale(1) rotate(0deg); }
          22% { transform: translateY(14px) scaleX(1.28) scaleY(0.65); }
          55% { transform: translateY(-28px) scaleX(0.85) scaleY(1.18) rotate(-180deg); }
          82% { transform: translateY(5px) scaleX(1.14) scaleY(0.88) rotate(-360deg); }
          100% { transform: translateY(0) scale(1) rotate(-360deg); }
        }
        .tap-burst-capsule {
          animation: tapBurstCapsule 0.65s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        /* 8. Triangle: Onigiri Corner-Kick & Pendulum Rock */
        @keyframes tapBurstTriangle {
          0% { transform: translate(0,0) rotate(0deg); }
          25% { transform: translate(-10px, -8px) rotate(-28deg) scale(1.06); }
          55% { transform: translate(10px, -12px) rotate(26deg) scale(1.06); }
          80% { transform: translate(0, 6px) rotate(0deg) scaleX(1.22) scaleY(0.80); }
          100% { transform: scale(1); }
        }
        .tap-burst-triangle {
          animation: tapBurstTriangle 0.65s cubic-bezier(0.22, 1, 0.36, 1) both;
          transform-origin: 50% 75%;
        }

        /* 9. Nuage: Thundercloud Squeeze & Lightning Shudder */
        @keyframes tapBurstNuage {
          0% { transform: scale(1); }
          25% { transform: scaleX(0.74) scaleY(0.78) translateY(6px); }
          45% { transform: scaleX(1.26) scaleY(1.18) translate(-6px, -10px); }
          55% { transform: scaleX(1.22) scaleY(1.14) translate(6px, -10px); }
          65% { transform: scaleX(1.16) scaleY(1.10) translate(-4px, -6px); }
          100% { transform: scale(1) translate(0,0); }
        }
        .tap-burst-nuage {
          animation: tapBurstNuage 0.65s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        /* 10. Goutte: Water Balloon Splat & High-Frequency Jelly Wobble */
        @keyframes tapBurstGoutte {
          0% { transform: scale(1) translateY(0); }
          20% { transform: translateY(-18px) scaleX(0.78) scaleY(1.26); }
          42% { transform: translateY(12px) scaleX(1.42) scaleY(0.62); }
          62% { transform: translateY(-6px) scaleX(0.86) scaleY(1.16); }
          80% { transform: translateY(3px) scaleX(1.10) scaleY(0.92); }
          100% { transform: scale(1) translateY(0); }
        }
        .tap-burst-goutte {
          animation: tapBurstGoutte 0.65s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }

        /* 11. Oeuf: Frantic Egg-Crack Shake & Pop-Jump */
        @keyframes tapBurstOeuf {
          0% { transform: rotate(0deg); }
          12% { transform: rotate(-22deg) translateX(-4px); }
          24% { transform: rotate(22deg) translateX(4px); }
          36% { transform: rotate(-20deg) translateX(-3px); }
          48% { transform: rotate(20deg) translateX(3px); }
          68% { transform: translateY(-20px) rotate(0deg) scaleX(0.90) scaleY(1.14); }
          86% { transform: translateY(4px) scaleX(1.12) scaleY(0.90); }
          100% { transform: scale(1); }
        }
        .tap-burst-oeuf {
          animation: tapBurstOeuf 0.65s cubic-bezier(0.22, 1, 0.36, 1) both;
          transform-origin: 50% 85%;
        }

        /* 12. Fromage: Mouse-Trap Snap & Elastic Wedge Flip */
        @keyframes tapBurstFromage {
          0% { transform: rotate(0deg); }
          28% { transform: translateX(8px) translateY(-6px) rotate(32deg) scale(0.95); }
          52% { transform: translateX(-10px) translateY(6px) rotate(-16deg) scaleX(1.24) scaleY(0.80); }
          76% { transform: translateY(-10px) rotate(6deg) scaleX(0.94) scaleY(1.08); }
          100% { transform: rotate(0deg) scale(1); }
        }
        .tap-burst-fromage {
          animation: tapBurstFromage 0.65s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        /* Facial Tap Impact Reactions & Counter-Rotations */
        @keyframes tapFaceHexagone {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }
        .tap-face-hexagone {
          animation: tapFaceHexagone 0.65s cubic-bezier(0.22, 1, 0.36, 1) 0.06s both;
        }

        @keyframes tapFaceSoleil {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(-180deg); }
        }
        .tap-face-soleil {
          animation: tapFaceSoleil 0.65s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        @keyframes tapFaceImpact {
          0% { transform: scale(1); }
          20% { transform: scale(1.12, 0.86); }
          48% { transform: scale(0.94, 1.08); }
          75% { transform: scale(1.04, 0.96); }
          100% { transform: scale(1); }
        }
        .tap-face-impact {
          animation: tapFaceImpact 0.65s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }

        /* Ambient Sun Typing Energy Glow with dynamic matching color */
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

        /* Unique Hexagon Rocking Roll while typing */
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

        /* Circle Buoyant Levitation Pulse while typing */
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

        /* Book Rapid Page Swipe Flutter Keyframes */
        @keyframes bookPageSwipe {
          0% {
            transform: scaleX(1);
            opacity: 0;
          }
          10% {
            transform: scaleX(0.85);
            opacity: 0.85;
          }
          45% {
            transform: scaleX(0.08);
            opacity: 0.95;
            filter: drop-shadow(0 0 6px var(--mascot-glow-mid, rgba(255, 255, 255, 0.5)));
          }
          55% {
            transform: scaleX(-0.08);
            opacity: 0.95;
          }
          90% {
            transform: scaleX(-0.85);
            opacity: 0.85;
          }
          100% {
            transform: scaleX(-1);
            opacity: 0;
          }
        }

        .book-page-swipe-tap-1 {
          animation: bookPageSwipe 0.30s cubic-bezier(0.4, 0, 0.2, 1) 0.05s 1 forwards;
        }
        .book-page-swipe-tap-2 {
          animation: bookPageSwipe 0.30s cubic-bezier(0.4, 0, 0.2, 1) 0.22s 1 forwards;
        }
        .book-page-swipe-tap-3 {
          animation: bookPageSwipe 0.30s cubic-bezier(0.4, 0, 0.2, 1) 0.42s 1 forwards;
        }
        .book-page-swipe-tap-4 {
          animation: bookPageSwipe 0.30s cubic-bezier(0.4, 0, 0.2, 1) 0.65s 1 forwards;
        }

        .book-page-swipe-type-1 {
          animation: bookPageSwipe 0.26s cubic-bezier(0.4, 0, 0.2, 1) 0.0s infinite;
        }
        .book-page-swipe-type-2 {
          animation: bookPageSwipe 0.26s cubic-bezier(0.4, 0, 0.2, 1) 0.15s infinite;
        }
        .book-page-swipe-type-3 {
          animation: bookPageSwipe 0.26s cubic-bezier(0.4, 0, 0.2, 1) 0.30s infinite;
        }

        /* Book Typing Rhythm Glow */
        @keyframes bookTypingGlow {
          0%, 100% {
            filter: drop-shadow(0 0 6px var(--mascot-glow-soft, rgba(244, 63, 94, 0.4)));
            transform: translateY(0px) scale(1, 1);
          }
          50% {
            filter: drop-shadow(0 0 16px var(--mascot-glow-intense, rgba(244, 63, 94, 0.75)));
            transform: translateY(-2px) scale(1.02, 0.98);
          }
        }
        .book-typing-glow {
          animation: bookTypingGlow 0.8s ease-in-out infinite;
        }

        /* Cloud Typing Fluffy Atmospheric Bob */
        @keyframes cloudTypingDrift {
          0%, 100% {
            filter: drop-shadow(0 0 6px var(--mascot-glow-soft, rgba(147, 197, 253, 0.35)));
            transform: translateY(0px) scale(1, 1);
          }
          50% {
            filter: drop-shadow(0 0 14px var(--mascot-glow-intense, rgba(147, 197, 253, 0.7)));
            transform: translateY(-4px) scale(1.05, 0.95);
          }
        }
        .cloud-typing-drift {
          animation: cloudTypingDrift 0.9s ease-in-out infinite;
        }

        /* 15. Universal Typing Dots Animation Keyframes (Active for all shapes only when typing) */
        @keyframes typingDotsLevitate {
          0%, 100% {
            opacity: 0.35;
            transform: translateY(0px) scale(0.9);
          }
          50% {
            opacity: 0.95;
            transform: translateY(-4px) scale(1.15);
            filter: drop-shadow(0 0 6px var(--mascot-glow-intense, rgba(255, 255, 255, 0.75)));
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
        .typing-dot-ambient-5 {
          animation: typingDotsLevitate 1.4s cubic-bezier(0.4, 0, 0.2, 1) 0.35s infinite;
        }

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

        /* 16. Mascot Facial Feature Live Micro-Animations */
        @keyframes mascotBlink {
          0%, 92%, 100% {
            transform: scaleY(1);
          }
          95% {
            transform: scaleY(0.1);
          }
          98% {
            transform: scaleY(1);
          }
        }
        .eye-blink {
          transform-box: fill-box;
          transform-origin: center 45px;
          animation: mascotBlink 4.2s ease-in-out infinite;
        }

        @keyframes laughChortleMouth {
          0%, 100% { transform: scale(1, 1); }
          25% { transform: scale(1.05, 1.18); }
          50% { transform: scale(0.96, 0.88); }
          75% { transform: scale(1.03, 1.12); }
        }
        @keyframes laughChortleEyes {
          0%, 100% { transform: translateY(0); }
          25% { transform: translateY(-1.5px); }
          50% { transform: translateY(0); }
          75% { transform: translateY(-1.5px); }
        }
        .laugh-mouth {
          transform-box: fill-box;
          transform-origin: 50px 55px;
          animation: laughChortleMouth 0.44s ease-in-out infinite;
        }
        .laugh-eyes {
          animation: laughChortleEyes 0.44s ease-in-out infinite;
        }

        @keyframes tearDripSway {
          0%, 100% { transform: rotate(-6deg); }
          50% { transform: rotate(6deg) scaleY(1.06); }
        }
        .tear-drip {
          transform-origin: 74px 46px;
          animation: tearDripSway 2.4s ease-in-out infinite;
        }

        @keyframes effrayeTremor {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-1px); }
          75% { transform: translateX(1px); }
        }
        .effraye-pupils {
          animation: effrayeTremor 0.12s linear infinite;
        }

        @keyframes sleepZzzFloat {
          0% {
            transform: translate(0, 0) scale(0.85);
            opacity: 0.35;
          }
          50% {
            transform: translate(2px, -3.5px) scale(1.05);
            opacity: 0.95;
          }
          80% {
            transform: translate(3px, -6px) scale(1.1);
            opacity: 0.8;
          }
          100% {
            transform: translate(4px, -8px) scale(1.15);
            opacity: 0;
          }
        }
        @keyframes sleepMouthBreathe {
          0%, 100% { transform: scale(0.85); }
          50% { transform: scale(1.25); }
        }
        .sleep-zzz {
          animation: sleepZzzFloat 2.8s ease-in-out infinite;
        }
        .sleep-mouth {
          transform-box: fill-box;
          transform-origin: 50px 58px;
          animation: sleepMouthBreathe 3.0s ease-in-out infinite;
        }

        @keyframes mouthPulseO {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.12); }
        }
        .mouth-pulse {
          transform-box: fill-box;
          transform-origin: 50px 59px;
          animation: mouthPulseO 2.2s ease-in-out infinite;
        }

        /* Suppress facial micro-animations when static, typing, or tiny (size <= 44) */
        .mascot-static .eye-blink,
        .mascot-static .laugh-mouth,
        .mascot-static .laugh-eyes,
        .mascot-static .tear-drip,
        .mascot-static .effraye-pupils,
        .mascot-static .sleep-zzz,
        .mascot-static .sleep-mouth,
        .mascot-static .mouth-pulse,
        .mascot-typing .eye-blink,
        .mascot-typing .laugh-mouth,
        .mascot-typing .laugh-eyes,
        .mascot-typing .tear-drip,
        .mascot-typing .effraye-pupils,
        .mascot-typing .sleep-zzz,
        .mascot-typing .sleep-mouth,
        .mascot-typing .mouth-pulse {
          animation: none !important;
        }
      `}</style>

      {/* Grok Typing Dots: Smooth Cross-fade and Spring Scale */}
      <g
        className="grok-typing-dots-container"
        style={{
          pointerEvents: 'none',
          transformBox: 'view-box',
          transformOrigin: '50px 50px',
          opacity: activeTyping ? 1 : 0,
          transform: activeTyping ? 'scale(1)' : 'scale(0.82)',
          transition: 'opacity 0.28s cubic-bezier(0.16, 1, 0.3, 1), transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Ambient subtle levitating dots */}
        <circle
          cx="18"
          cy="24"
          r="2.5"
          className="typing-dot-ambient-1"
          fill="var(--mascot-glow-mid, rgba(255,255,255,0.65))"
        />
        <circle
          cx="82"
          cy="22"
          r="2.5"
          className="typing-dot-ambient-2"
          fill="var(--mascot-glow-mid, rgba(255,255,255,0.65))"
        />
        <circle
          cx="14"
          cy="60"
          r="2"
          className="typing-dot-ambient-3"
          fill="var(--mascot-glow-soft, rgba(255,255,255,0.45))"
        />
        <circle
          cx="86"
          cy="62"
          r="2"
          className="typing-dot-ambient-4"
          fill="var(--mascot-glow-soft, rgba(255,255,255,0.45))"
        />

        {/* Iconic Grok 3-dot typing rhythm wave */}
        <g className="grok-dots-cluster">
          <circle
            cx="26"
            cy="50"
            r="8"
            className="grok-dot-1"
            fill={bodyHex}
            style={{ transformOrigin: '26px 50px' }}
          />
          <circle
            cx="50"
            cy="50"
            r="8"
            className="grok-dot-2"
            fill={bodyHex}
            style={{ transformOrigin: '50px 50px' }}
          />
          <circle
            cx="74"
            cy="50"
            r="8"
            className="grok-dot-3"
            fill={bodyHex}
            style={{ transformOrigin: '74px 50px' }}
          />
        </g>
      </g>

      {/* Mascot Avatar Layer: Smooth Cross-fade and Spring Settle */}
      <g
        className="mascot-avatar-layer"
        style={{
          transformBox: 'view-box',
          transformOrigin: '50px 50px',
          opacity: activeTyping ? 0 : 1,
          transform: activeTyping ? 'scale(0.82)' : 'scale(1)',
          pointerEvents: activeTyping ? 'none' : 'auto',
          transition: 'opacity 0.28s cubic-bezier(0.16, 1, 0.3, 1), transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <g
          key={isTapping ? `tap-${tapCount}` : 'idle'}
          onAnimationEnd={() => setIsTapping(false)}
          className={`mascot-tap-rig ${isTapping ? `tap-burst-${normShape}` : `idle-${normShape}`}`}
          style={{ transformOrigin: '50% 50%', transformBox: 'fill-box' }}
        >
          {/* Layer 1: Unified Mascot Body (Cushion Depth + Silhouette + Extras breathe and float together) */}
          <g ref={bodyGroupRef} style={{ transformOrigin: '50% 50%' }}>
            <g style={{ transformOrigin: '50% 50%' }}>
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

              {/* Rapid Page Swipe Flutter Layer for Book */}
              {isBook && (
                <g className="book-pages-layer" style={{ pointerEvents: 'none' }}>
                  <g
                    className={isTapping ? 'book-page-swipe-tap-1' : 'opacity-0'}
                    style={{ transformOrigin: '50px 50px' }}
                  >
                    <path
                      d="M 50 23 C 55 18 65 15 76 15 C 82 15 86 19 86 24 L 86 70 C 86 75 82 78 76 78 C 65 78 55 76 50 81 Z"
                      fill="rgba(255, 255, 255, 0.40)"
                      stroke="rgba(255, 255, 255, 0.70)"
                      strokeWidth="1.2"
                    />
                  </g>

                  <g
                    className={isTapping ? 'book-page-swipe-tap-2' : 'opacity-0'}
                    style={{ transformOrigin: '50px 50px' }}
                  >
                    <path
                      d="M 50 23 C 55 18 65 15 76 15 C 82 15 86 19 86 24 L 86 70 C 86 75 82 78 76 78 C 65 78 55 76 50 81 Z"
                      fill="rgba(255, 255, 255, 0.45)"
                      stroke="rgba(255, 255, 255, 0.75)"
                      strokeWidth="1.2"
                    />
                  </g>

                  <g
                    className={isTapping ? 'book-page-swipe-tap-3' : 'opacity-0'}
                    style={{ transformOrigin: '50px 50px' }}
                  >
                    <path
                      d="M 50 23 C 55 18 65 15 76 15 C 82 15 86 19 86 24 L 86 70 C 86 75 82 78 76 78 C 65 78 55 76 50 81 Z"
                      fill="rgba(255, 255, 255, 0.40)"
                      stroke="rgba(255, 255, 255, 0.70)"
                      strokeWidth="1.2"
                    />
                  </g>

                  <g
                    className={
                      isTapping
                        ? 'book-page-swipe-tap-4'
                        : 'opacity-0'
                    }
                    style={{ transformOrigin: '50px 50px' }}
                  >
                    <path
                      d="M 50 23 C 55 18 65 15 76 15 C 82 15 86 19 86 24 L 86 70 C 86 75 82 78 76 78 C 65 78 55 76 50 81 Z"
                      fill="rgba(255, 255, 255, 0.35)"
                      stroke="rgba(255, 255, 255, 0.65)"
                      strokeWidth="1.2"
                    />
                  </g>
                </g>
              )}

              {renderExtra && renderExtra()}
            </g>
          </g>

          {/* Layer 2: Mascot Expression with Per-Shape Center Transform & In-Place Gaze/Blink */}
          <g
            ref={faceGroupRef}
            className={`mascot-face-group mascot-face-rig ${
              isTapping
                ? normShape === 'hexagone'
                  ? 'tap-face-hexagone'
                  : normShape === 'soleil'
                  ? 'tap-face-soleil'
                  : 'tap-face-impact'
                : ''
            }`}
            style={{
              transformOrigin: '50% 50%',
              opacity: isSleeping ? 0.45 : 1,
              transition: 'opacity 0.2s ease-in-out',
            }}
          >
            <g
              transform={FACE_TRANSFORMS[normShape] || getFaceTransform(normShape)}
              style={{ transformOrigin: '50% 50%' }}
            >
              {renderExpression(eyeColor, isLight)}
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
});

export default BloubMascot;
