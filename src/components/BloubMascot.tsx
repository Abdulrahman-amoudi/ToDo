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
  const bodyGroupRef = useRef<SVGGElement>(null);

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
      const timer = setTimeout(() => setIsBouncingState(false), 850);
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
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.08);
      lastTimeRef.current = time;
      clockRef.current += dt;

      const t = clockRef.current;

      // 1. Spring-damped smooth lerp toward target look
      const lerpFactor = Math.min(1, dt * 8.5);
      currentLook.current.x += (targetLook.current.x - currentLook.current.x) * lerpFactor;
      currentLook.current.y += (targetLook.current.y - currentLook.current.y) * lerpFactor;

      // 2. Organic breathing bob & idle float
      const floatY = Math.sin(t * 2.2) * 2.2;
      const breathScaleX = 1 + Math.sin(t * 2.2) * 0.015;
      const breathScaleY = 1 - Math.sin(t * 2.2) * 0.015;

      // 3. Natural eye blink (every ~4.2 seconds)
      blinkTimerRef.current += dt;
      if (blinkTimerRef.current > 4.2) {
        isBlinkingRef.current = true;
        blinkProgressRef.current = 0;
        blinkTimerRef.current = Math.random() * 0.8;
      }

      let eyeScaleY = 1;
      if (isBlinkingRef.current) {
        blinkProgressRef.current += dt * 10;
        if (blinkProgressRef.current >= Math.PI) {
          isBlinkingRef.current = false;
          eyeScaleY = 1;
        } else {
          eyeScaleY = Math.max(0.06, 1 - Math.sin(blinkProgressRef.current) * 0.94);
        }
      }

      // 4. Coordinates for gaze, tilt, and head motion
      const faceX = currentLook.current.x * 6.5;
      const faceY = currentLook.current.y * 4.8;
      const headTilt = currentLook.current.x * 3.2;
      const bodyTilt = currentLook.current.x * 1.8;

      // Update Body Group (Cushion depth + Silhouette body + Extras move as ONE cohesive unit)
      if (bodyGroupRef.current) {
        bodyGroupRef.current.setAttribute(
          'transform',
          `translate(0, ${floatY}) translate(50, 50) rotate(${bodyTilt}) scale(${breathScaleX}, ${breathScaleY}) translate(-50, -50)`
        );
      }

      // Update Face Group (moves with body float, tracks gaze, blinks in place around 50 50)
      if (faceGroupRef.current) {
        faceGroupRef.current.setAttribute(
          'transform',
          `translate(${faceX}, ${faceY + floatY * 0.7}) translate(50, 50) rotate(${headTilt}) scale(1, ${eyeScaleY}) translate(-50, -50)`
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
        }, 850);
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
          0% { transform: scale(1) translateY(0); }
          20% { transform: scale(1.14, 0.86) translateY(3px); }
          45% { transform: scale(0.92, 1.10) translateY(-6px); }
          70% { transform: scale(1.04, 0.97) translateY(1.5px); }
          85% { transform: scale(0.99, 1.01) translateY(-0.5px); }
          100% { transform: scale(1) translateY(0); }
        }
        .mascot-squish-active {
          animation: mascotSquishPop 0.85s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>

      {/* Layer 1: Unified Mascot Body (Cushion Depth + Silhouette + Extras breathe and float together) */}
      <g ref={bodyGroupRef} style={{ transformOrigin: '50% 50%' }}>
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

      {/* Layer 2: Mascot Expression with Per-Shape Center Transform & In-Place Gaze/Blink */}
      <g
        ref={faceGroupRef}
        className="mascot-face-group"
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
