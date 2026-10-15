'use client';

import React, { useState, useCallback } from 'react';
import {
  normalizeShape,
  normalizeExpression,
  SHAPE_PATHS,
  SHAPE_EXTRAS,
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
  color = 'bleu',
  shape = 'squircle',
  expression = 'neutre',
  gaze,
  onInteract,
  isStatic = false,
  animated = true,
  className = '',
  style = {},
}: BloubMascotProps) {
  const [isInteracting, setIsInteracting] = useState(false);

  // Normalize shape and expression through the single source-of-truth registry
  const normShape = normalizeShape(shape);
  const normExpr = normalizeExpression(expression);

  // Resolve body and high-contrast eye colors
  const bodyHex = resolveColor(color);
  const isLight = isLightColor(bodyHex);
  const eyeColor = getEyeColor(bodyHex);

  const shapeD = SHAPE_PATHS[normShape] || SHAPE_PATHS.squircle;
  const renderExpression =
    EXPRESSION_RENDERERS[normExpr] || EXPRESSION_RENDERERS.neutre;
  const renderExtra = SHAPE_EXTRAS[normShape];

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onInteract?.();
      if (!isStatic && animated) {
        setIsInteracting(true);
        setTimeout(() => setIsInteracting(false), 600);
      }
    },
    [onInteract, isStatic, animated]
  );

  const isBouncing = isInteracting || state === 'orbit';
  const isSleeping = state === 'sleep';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      onClick={handleClick}
      role="img"
      aria-label={`Mascot ${normShape} with ${normExpr} expression`}
      className={`select-none overflow-visible transition-transform duration-200 ${
        isBouncing ? 'scale-110 -rotate-3' : ''
      } ${className}`}
      style={{
        cursor: onInteract || (!isStatic && animated) ? 'pointer' : 'default',
        ...style,
      }}
    >
      {/* Mascot Silhouette Body Path with Morphs */}
      <path
        d={shapeD}
        fill={bodyHex}
        className="mascot-body-path"
        style={{
          transition:
            'd 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), fill 0.2s ease, transform 0.25s ease',
          transformOrigin: '50% 50%',
          filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.14))',
        }}
      />

      {/* Shape-specific decorative accessories (cheese holes, sprout, book ribbon) */}
      {renderExtra && renderExtra()}

      {/* Mascot Expression / Face Group */}
      <g
        className="mascot-face-group"
        style={{
          transition: 'transform 0.25s ease, opacity 0.2s ease',
          transformOrigin: '50% 50%',
          opacity: isSleeping ? 0.45 : 1,
        }}
      >
        {renderExpression(eyeColor, isLight)}
      </g>
    </svg>
  );
});

export default BloubMascot;
