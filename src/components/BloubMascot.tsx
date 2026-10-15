'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  normalizeShape,
  normalizeExpression,
  SHAPE_PATHS,
  SHAPE_EXTRAS,
  SHAPE_UNDERLAYS,
  FACE_TRANSFORMS,
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
  className = '',
  style = {},
}: BloubMascotProps) {
  const [isInteracting, setIsInteracting] = useState(false);
  const [isBouncingState, setIsBouncingState] = useState(state === 'orbit');

  const svgRef = useRef<SVGSVGElement>(null);
  const faceGroupRef = useRef<SVGGElement>(null);
  const bodyPathRef = useRef<SVGPathElement>(null);
  const extrasGroupRef = useRef<SVGGElement>(null);

  // Normalize shape and expression through the single source-of-truth registry
  const normShape = normalizeShape(shape);
  const normExpr = normalizeExpression(expression);

  // Look coordinates (normalized -1 to 1)
  const targetLook = useRef({ x: 0, y: 0 });
  const currentLook = useRef({ x: 0, y: 0 });
  const clockRef = useRef(0);
  const lastTimeRef = useRef(0);
  const blinkTimerRef = useRef(0);
  const isBlinkingRef = useRef(false);
  const blinkProgressRef = useRef(0);

  // Sync state prop with squish-pop animation
  useEffect(() => {
    if (state === 'orbit' || state === 'wide') {
      setIsBouncingState(true);
      const timer = setTimeout(() => setIsBouncingState(false), 950);
      return () => clearTimeout(timer);
    }
  }, [state]);

  // Handle explicit gaze prop
  useEffect(() => {
    const resolved = resolveGaze(gaze);
    if (resolved) {
      targetLook.current = {
        x: Math.max(-1, Math.min(1, resolved.yaw / 35)),
        y: Math.max(-1, Math.min(1, -resolved.pitch / 25)),
      };
    }
  }, [gaze]);

  // Window-wide pointer follow
  useEffect(() => {
    if (isStatic || !animated) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const mascotCenterX = rect.left + rect.width / 2;
      const mascotCenterY = rect.top + rect.height / 2;

      // Distance from mascot center normalized with max range
      const maxDistanceX = Math.max(window.innerWidth / 2, 280);
      const maxDistanceY = Math.max(window.innerHeight / 2, 280);

      const dx = Math.max(-1, Math.min(1, (e.clientX - mascotCenterX) / maxDistanceX));
      const dy = Math.max(-1, Math.min(1, (e.clientY - mascotCenterY) / maxDistanceY));

      targetLook.current = { x: dx, y: dy };
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
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = time;
      clockRef.current += dt;

      const t = clockRef.current;

      // 1. Spring-damped lerp toward mouse target
      const lerpFactor = Math.min(1, dt * 9.5);
      currentLook.current.x += (targetLook.current.x - currentLook.current.x) * lerpFactor;
      currentLook.current.y += (targetLook.current.y - currentLook.current.y) * lerpFactor;

      // 2. Idle floating & soft breathing bob
      const floatY = Math.sin(t * 2.2) * 2.4;
      const breathScaleX = 1 + Math.sin(t * 2.2) * 0.016;
      const breathScaleY = 1 - Math.sin(t * 2.2) * 0.016;

      // 3. Natural cute eye blink (every ~4 seconds)
      blinkTimerRef.current += dt;
      if (blinkTimerRef.current > 3.8) {
        isBlinkingRef.current = true;
        blinkProgressRef.current = 0;
        blinkTimerRef.current = Math.random() * 0.6;
      }

      let eyeScaleY = 1;
      if (isBlinkingRef.current) {
        blinkProgressRef.current += dt * 9;
        if (blinkProgressRef.current >= Math.PI) {
          isBlinkingRef.current = false;
          eyeScaleY = 1;
        } else {
          eyeScaleY = Math.max(0.08, 1 - Math.sin(blinkProgressRef.current) * 0.92);
        }
      }

      // 4. Calculate coordinates for face group
      const faceX = currentLook.current.x * 7.2;
      const faceY = currentLook.current.y * 5.2 + floatY * 0.4;
      const headTilt = currentLook.current.x * 3.4;

      // Update DOM directly for zero React reconciliation cost
      if (faceGroupRef.current) {
        faceGroupRef.current.setAttribute(
          'transform',
          `translate(${faceX}, ${faceY}) rotate(${headTilt} 50 50) scale(1, ${eyeScaleY})`
        );
      }

      if (extrasGroupRef.current) {
        extrasGroupRef.current.setAttribute(
          'transform',
          `translate(${faceX * 0.4}, ${faceY * 0.4}) rotate(${headTilt * 0.5} 50 50)`
        );
      }

      if (bodyPathRef.current) {
        const bodyTilt = currentLook.current.x * 1.8;
        bodyPathRef.current.setAttribute(
          'transform',
          `translate(0, ${floatY}) rotate(${bodyTilt} 50 50) scale(${breathScaleX}, ${breathScaleY})`
        );
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isStatic, animated, normShape]);

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
        }, 950);
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
        isBouncing ? 'mascot-squish-active' : ''
      } ${isThinking ? '-rotate-6 scale-105' : ''} ${className}`}
      style={{
        cursor: onInteract || (!isStatic && animated) ? 'pointer' : 'default',
        transformOrigin: '50% 50%',
        ...style,
      }}
    >
      <style>{`
        @keyframes mascotSquishPop {
          0% { transform: scale(1) translateY(0) rotate(0deg); }
          16% { transform: scale(1.22, 0.78) translateY(5px) rotate(0deg); }
          38% { transform: scale(0.86, 1.25) translateY(-20px) rotate(-6deg); }
          55% { transform: scale(1.12, 0.92) translateY(-10px) rotate(4deg); }
          72% { transform: scale(0.96, 1.05) translateY(-2px) rotate(-2deg); }
          86% { transform: scale(1.03, 0.98) translateY(1px) rotate(1deg); }
          100% { transform: scale(1) translateY(0) rotate(0deg); }
        }
        .mascot-squish-active {
          animation: mascotSquishPop 0.95s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>

      {/* Layer 1: Shape underlay OR bottom cushion depth (brightness 0.82) */}
      {renderUnderlay ? (
        <g style={{ transformOrigin: '50% 50%' }}>
          {renderUnderlay(bodyHex)}
        </g>
      ) : (
        <path
          d={shapeD}
          fill={bodyHex}
          transform="translate(0, 3.2)"
          filter="brightness(0.82)"
          style={{
            pointerEvents: 'none',
            transformOrigin: '50% 50%',
            transition: 'd 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), fill 0.2s ease',
          }}
        />
      )}

      {/* Layer 2: Main Silhouette Body Path with Morphs */}
      <path
        ref={bodyPathRef}
        d={shapeD}
        fill={bodyHex}
        className="mascot-body-path"
        style={{
          transition:
            'd 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), fill 0.2s ease',
          transformOrigin: '50% 50%',
          filter: 'drop-shadow(0 3px 10px rgba(0,0,0,0.18))',
        }}
      />

      {/* Layer 3: Glossy Highlight Overlay */}
      {normShape !== 'livre' && (
        <path
          d="M26 24 C34 17 50 16 62 19 C52 21 36 23 26 24 Z"
          fill="#FFFFFF"
          opacity="0.22"
          style={{ pointerEvents: 'none' }}
        />
      )}

      {/* Layer 4: Shape-specific decorative accessories (cheese holes, sprout, book spine crease) */}
      {renderExtra && (
        <g ref={extrasGroupRef} style={{ transformOrigin: '50% 50%' }}>
          {renderExtra()}
        </g>
      )}

      {/* Layer 5: Mascot Expression / Face Group with 120fps Mouse Tracking & Per-Shape Transform */}
      <g
        ref={faceGroupRef}
        className="mascot-face-group"
        style={{
          transformOrigin: '50% 50%',
          opacity: isSleeping ? 0.45 : 1,
        }}
      >
        <g
          transform={FACE_TRANSFORMS[normShape] || 'translate(0, 1) scale(1)'}
          style={{ transformOrigin: '50% 50%' }}
        >
          {renderExpression(eyeColor, isLight)}
        </g>
      </g>
    </svg>
  );
});

export default BloubMascot;
