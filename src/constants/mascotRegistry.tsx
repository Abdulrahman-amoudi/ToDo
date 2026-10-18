import React from 'react';

/**
 * Single Source-of-Truth Mascot Registry
 * Provides normalized IDs, 100x100 SVG shape paths, and distinct expression geometries.
 */

export function normalizeId(str: string | undefined | null): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/œ/gi, 'oe')
    .toLowerCase()
    .trim();
}

export const SHAPE_ALIASES: Record<string, string> = {
  // 1. Cloud / Nuage
  cloud: 'cloud',
  nuage: 'nuage',

  // 2. Book / Livre
  book: 'book',
  livre: 'livre',

  // 3. Squircle
  squircle: 'squircle',
  square: 'squircle',

  // 4. Cercle
  cercle: 'cercle',
  circle: 'cercle',
  round: 'cercle',

  // 5. Galet
  galet: 'galet',
  pebble: 'galet',

  // 6. Capsule
  capsule: 'capsule',
  pill: 'capsule',

  // 7. Triangle
  triangle: 'triangle',

  // 8. Hexagone
  hexagone: 'hexagone',
  hexagon: 'hexagone',

  // 9. Goutte
  goutte: 'goutte',
  drop: 'goutte',
  droplet: 'goutte',

  // 10. Oeuf
  oeuf: 'oeuf',
  egg: 'oeuf',

  // 11. Soleil & Spark
  soleil: 'soleil',
  sun: 'soleil',
  spark: 'spark',
  star: 'spark',

  // 12. Fromage
  fromage: 'fromage',
  cheese: 'fromage',
};

export function normalizeShape(shape: string | undefined | null): string {
  const norm = normalizeId(shape);
  return SHAPE_ALIASES[norm] || 'soleil';
}

export type CanonicalShape =
  | 'soleil'
  | 'cercle'
  | 'squircle'
  | 'galet'
  | 'capsule'
  | 'triangle'
  | 'hexagone'
  | 'nuage'
  | 'cloud'
  | 'goutte'
  | 'oeuf'
  | 'spark'
  | 'fromage'
  | 'livre'
  | 'book';

export function resolveShape(raw?: string | null): string {
  const norm = normalizeShape(raw);
  if (norm === 'fromage' || norm === 'cheese' || norm === 'oeuf' || norm === 'egg') return 'soleil';
  if (norm === 'book' || norm === 'livre') return 'livre';
  if (norm === 'cloud' || norm === 'nuage') return 'nuage';
  return norm;
}

export const EXPRESSION_ALIASES: Record<string, string> = {
  // 1. neutral ("Focused")
  neutral: 'neutral',
  focused: 'neutral',
  focus: 'neutral',
  neutre: 'neutral',
  attentif: 'neutral',
  attentive: 'neutral',
  idle: 'neutral',

  // 2. happy ("Happy")
  happy: 'happy',
  heureux: 'happy',
  joyeux: 'happy',

  // 3. excited ("Hyped")
  excited: 'excited',
  hyped: 'excited',
  excite: 'excited',
  hilare: 'excited',
  laugh: 'excited',
  laughing: 'excited',
  surpris: 'excited',
  surprised: 'excited',
  surprise: 'excited',
  vroum: 'excited',
  klaxon: 'excited',

  // 4. chill ("Chill")
  chill: 'chill',
  cool: 'chill',
  blase: 'chill',
  bored: 'chill',
  unamused: 'chill',
  mefiant: 'chill',
  suspicious: 'chill',
  fier: 'chill',
  proud: 'chill',
  curieux: 'chill',
  curious: 'chill',
  confus: 'chill',
  confused: 'chill',
  colere: 'chill',
  angry: 'chill',
  anger: 'chill',
  triste: 'chill',
  sad: 'chill',
  sorrow: 'chill',

  // 5. shy ("Shy")
  shy: 'shy',
  timide: 'shy',

  // 6. sleepy ("Sleepy")
  sleepy: 'sleepy',
  sleep: 'sleepy',
  somnolent: 'sleepy',
  drowsy: 'sleepy',
  effraye: 'excited',
  scared: 'excited',
  fear: 'excited',
};

export function normalizeExpression(expr: string | undefined | null): string {
  const norm = normalizeId(expr);
  return EXPRESSION_ALIASES[norm] || 'neutral';
}

export type CanonicalExpression = 'neutral' | 'happy' | 'excited' | 'chill' | 'shy' | 'sleepy';

export function resolveExpression(raw?: string | null): CanonicalExpression {
  const norm = normalizeExpression(raw);
  if (norm === 'happy' || norm === 'heureux' || norm === 'proud') return 'happy';
  if (norm === 'excited' || norm === 'hyped' || norm === 'hilare' || norm === 'surpris') return 'excited';
  if (norm === 'chill' || norm === 'blase' || norm === 'mefiant') return 'chill';
  if (norm === 'shy' || norm === 'timide' || norm === 'sad' || norm === 'triste' || norm === 'effraye') return 'shy';
  if (norm === 'sleepy' || norm === 'somnolent') return 'sleepy';
  return 'neutral';
}

/**
 * Complete, valid 100x100 SVG paths for all shapes.
 */
export const SHAPE_PATHS: Record<string, string> = {
  squircle:
    'M50 10 C80 10 90 20 90 50 C90 80 80 90 50 90 C20 90 10 80 10 50 C10 20 20 10 50 10 Z',
  cercle:
    'M50 10 C72.09 10 90 27.91 90 50 C90 72.09 72.09 90 50 90 C27.91 90 10 72.09 10 50 C10 27.91 27.91 10 50 10 Z',
  galet:
    'M50 12 C78 14 88 32 86 60 C84 82 72 88 50 88 C26 88 14 78 14 54 C14 30 26 10 50 12 Z',
  capsule:
    'M 25 24 L 75 24 C 88.8 24 100 35.2 100 49 C 100 62.8 88.8 74 75 74 L 25 74 C 11.2 74 0 62.8 0 49 C 0 35.2 11.2 24 25 24 Z',
  triangle:
    'M50 12 C56 12 60 16 63 22 L86 68 C90 76 85 86 75 86 L25 86 C15 86 10 76 14 68 L37 22 C40 16 44 12 50 12 Z',
  hexagone:
    'M 41.34 13 C 46.10 10.25 53.90 10.25 58.66 13 L 77.71 24 C 82.48 26.75 86.37 33.50 86.37 39 L 86.37 61 C 86.37 66.50 82.48 73.25 77.71 76 L 58.66 87 C 53.90 89.75 46.10 89.75 41.34 87 L 22.29 76 C 17.52 73.25 13.63 66.50 13.63 61 L 13.63 39 C 13.63 33.50 17.52 26.75 22.29 24 Z',
  nuage:
    'M 32 76 C 21 76 13 67 13 56 C 13 46 20 38 30 37 C 33 26 43 19 50 19 C 57 19 67 26 70 37 C 80 38 87 46 87 56 C 87 67 79 76 68 76 C 58 76 42 76 32 76 Z',
  cloud:
    'M 32 76 C 21 76 13 67 13 56 C 13 46 20 38 30 37 C 33 26 43 19 50 19 C 57 19 67 26 70 37 C 80 38 87 46 87 56 C 87 67 79 76 68 76 C 58 76 42 76 32 76 Z',
  goutte:
    'M50 12 C50 12 82 46 82 66 C82 82 68 90 50 90 C32 90 18 82 18 66 C18 46 50 12 50 12 Z',
  oeuf:
    'M50 13 C69 13 83 39 83 61 C83 79 69 88 50 88 C31 88 17 79 17 61 C17 39 31 13 50 13 Z',
  soleil:
    'M 50.00 9.00 C 52.93 9.00 55.38 16.24 58.80 17.16 C 62.22 18.07 67.96 13.03 70.50 14.49 C 73.04 15.96 71.54 23.46 74.04 25.96 C 76.54 28.46 84.04 26.96 85.51 29.50 C 86.97 32.04 81.93 37.78 82.84 41.20 C 83.76 44.62 91.00 47.07 91.00 50.00 C 91.00 52.93 83.76 55.38 82.84 58.80 C 81.93 62.22 86.97 67.96 85.51 70.50 C 84.04 73.04 76.54 71.54 74.04 74.04 C 71.54 76.54 73.04 84.04 70.50 85.51 C 67.96 86.97 62.22 81.93 58.80 82.84 C 55.38 83.76 52.93 91.00 50.00 91.00 C 47.07 91.00 44.62 83.76 41.20 82.84 C 37.78 81.93 32.04 86.97 29.50 85.51 C 26.96 84.04 28.46 76.54 25.96 74.04 C 23.46 71.54 15.96 73.04 14.49 70.50 C 13.03 67.96 18.07 62.22 17.16 58.80 C 16.24 55.38 9.00 52.93 9.00 50.00 C 9.00 47.07 16.24 44.62 17.16 41.20 C 18.07 37.78 13.03 32.04 14.49 29.50 C 15.96 26.96 23.46 28.46 25.96 25.96 C 28.46 23.46 26.96 15.96 29.50 14.49 C 32.04 13.03 37.78 18.07 41.20 17.16 C 44.62 16.24 47.07 9.00 50.00 9.00 Z',
  spark:
    'M 50.00 9.00 C 52.93 9.00 55.38 16.24 58.80 17.16 C 62.22 18.07 67.96 13.03 70.50 14.49 C 73.04 15.96 71.54 23.46 74.04 25.96 C 76.54 28.46 84.04 26.96 85.51 29.50 C 86.97 32.04 81.93 37.78 82.84 41.20 C 83.76 44.62 91.00 47.07 91.00 50.00 C 91.00 52.93 83.76 55.38 82.84 58.80 C 81.93 62.22 86.97 67.96 85.51 70.50 C 84.04 73.04 76.54 71.54 74.04 74.04 C 71.54 76.54 73.04 84.04 70.50 85.51 C 67.96 86.97 62.22 81.93 58.80 82.84 C 55.38 83.76 52.93 91.00 50.00 91.00 C 47.07 91.00 44.62 83.76 41.20 82.84 C 37.78 81.93 32.04 86.97 29.50 85.51 C 26.96 84.04 28.46 76.54 25.96 74.04 C 23.46 71.54 15.96 73.04 14.49 70.50 C 13.03 67.96 18.07 62.22 17.16 58.80 C 16.24 55.38 9.00 52.93 9.00 50.00 C 9.00 47.07 16.24 44.62 17.16 41.20 C 18.07 37.78 13.03 32.04 14.49 29.50 C 15.96 26.96 23.46 28.46 25.96 25.96 C 28.46 23.46 26.96 15.96 29.50 14.49 C 32.04 13.03 37.78 18.07 41.20 17.16 C 44.62 16.24 47.07 9.00 50.00 9.00 Z',
  fromage:
    'M16 68 C14 42 22 28 32 24 C44 20 66 32 84 54 C88 59 88 65 82 69 C68 76 34 76 16 68 Z',
  livre:
    'M14 24 C14 19 18 15 24 15 C35 15 45 18 50 23 C55 18 65 15 76 15 C82 15 86 19 86 24 L86 70 C86 75 82 78 76 78 C65 78 55 76 50 81 C45 76 35 78 24 78 C18 78 14 75 14 70 Z',
  book:
    'M14 24 C14 19 18 15 24 15 C35 15 45 18 50 23 C55 18 65 15 76 15 C82 15 86 19 86 24 L86 70 C86 75 82 78 76 78 C65 78 55 76 50 81 C45 76 35 78 24 78 C18 78 14 75 14 70 Z',
};

export interface FaceConfig {
  dx: number;
  dy: number;
  scale: number;
}

export const FACE_CONFIGS: Record<string, FaceConfig> = {
  squircle: { dx: 0, dy: 0, scale: 1.0 },
  cercle:   { dx: 0, dy: 0, scale: 1.0 },
  galet:    { dx: 0, dy: 1, scale: 0.98 },
  capsule:  { dx: 0, dy: 1, scale: 0.92 },
  triangle: { dx: 0, dy: 8, scale: 0.78 },
  hexagone: { dx: 0, dy: 0, scale: 0.90 },
  nuage:    { dx: 0, dy: 1, scale: 0.92 },
  cloud:    { dx: 0, dy: 1, scale: 0.92 },
  goutte:   { dx: 0, dy: 7, scale: 0.80 },
  oeuf:     { dx: 0, dy: 7, scale: 0.86 },
  soleil:   { dx: 0, dy: 0, scale: 0.85 },
  spark:    { dx: 0, dy: 0, scale: 0.85 },
  fromage:  { dx: -2, dy: 4, scale: 0.88 },
  livre:    { dx: 0, dy: -2, scale: 0.95 },
  book:     { dx: 0, dy: -2, scale: 0.95 },
};

/**
 * Returns an SVG transform string that scales around center (50, 50) and shifts by (dx, dy).
 * Math: translate(50 + dx, 50 + dy) scale(s) translate(-50, -50)
 * Guarantees that scaling never shifts the center X away from 50!
 */
export function getFaceTransform(shape: string | undefined | null): string {
  const norm = normalizeShape(shape);
  const cfg = FACE_CONFIGS[norm] || { dx: 0, dy: 1, scale: 1.0 };
  const tx = 50 + cfg.dx;
  const ty = 50 + cfg.dy;
  return `translate(${tx}, ${ty}) scale(${cfg.scale}) translate(-50, -50)`;
}

/**
 * Precise Face Transforms per Shape using true center scaling.
 */
export const FACE_TRANSFORMS: Record<string, string> = {
  squircle: getFaceTransform('squircle'),
  cercle:   getFaceTransform('cercle'),
  galet:    getFaceTransform('galet'),
  capsule:  getFaceTransform('capsule'),
  triangle: getFaceTransform('triangle'),
  hexagone: getFaceTransform('hexagone'),
  nuage:    getFaceTransform('nuage'),
  cloud:    getFaceTransform('cloud'),
  goutte:   getFaceTransform('goutte'),
  oeuf:     getFaceTransform('oeuf'),
  soleil:   getFaceTransform('soleil'),
  spark:    getFaceTransform('spark'),
  fromage:  getFaceTransform('fromage'),
  livre:    getFaceTransform('livre'),
  book:     getFaceTransform('book'),
};

/**
 * Shape underlays rendered BEHIND the primary body path (back cover rim, bookmark tails).
 */
export const SHAPE_UNDERLAYS: Record<string, (bodyHex: string) => React.ReactNode> = {
  livre: (bodyHex: string) => (
    <g style={{ pointerEvents: 'none' }}>
      {/* Layer 1: Outer Cover Frame (Dynamic Accent Color + Depth Rim) */}
      <path
        d="M10 26 C10 20 15 17 22 17 C34 17 45 20 50 25 C55 20 66 17 78 17 C85 17 90 20 90 26 L90 74 C90 80 85 83 78 83 C66 83 55 80 50 85 C45 80 34 83 22 83 C15 83 10 80 10 74 Z"
        fill={bodyHex}
        filter="brightness(0.82)"
        transform="translate(0, 3)"
      />
      <path
        d="M10 26 C10 20 15 17 22 17 C34 17 45 20 50 25 C55 20 66 17 78 17 C85 17 90 20 90 26 L90 74 C90 80 85 83 78 83 C66 83 55 80 50 85 C45 80 34 83 22 83 C15 83 10 80 10 74 Z"
        fill={bodyHex}
      />
      {/* Layer 2: Swallowtail Ribbon Bookmark Tail (Bottom Spine) */}
      <path
        d="M45 76 L55 76 L55 92 L50 87 L45 92 Z"
        fill="#ef4444"
        strokeLinejoin="round"
      />
    </g>
  ),
  book: (bodyHex: string) => (
    <g style={{ pointerEvents: 'none' }}>
      <path
        d="M10 26 C10 20 15 17 22 17 C34 17 45 20 50 25 C55 20 66 17 78 17 C85 17 90 20 90 26 L90 74 C90 80 85 83 78 83 C66 83 55 80 50 85 C45 80 34 83 22 83 C15 83 10 80 10 74 Z"
        fill={bodyHex}
        filter="brightness(0.82)"
        transform="translate(0, 3)"
      />
      <path
        d="M10 26 C10 20 15 17 22 17 C34 17 45 20 50 25 C55 20 66 17 78 17 C85 17 90 20 90 26 L90 74 C90 80 85 83 78 83 C66 83 55 80 50 85 C45 80 34 83 22 83 C15 83 10 80 10 74 Z"
        fill={bodyHex}
      />
      <path
        d="M45 76 L55 76 L55 92 L50 87 L45 92 Z"
        fill="#ef4444"
        strokeLinejoin="round"
      />
    </g>
  ),
  oeuf: (bodyHex: string) => (
    <g style={{ pointerEvents: 'none' }}>
      {/* Layer 1 — Subtle Depth Shadow Rim */}
      <path
        d="M50 13 C69 13 83 39 83 61 C83 79 69 88 50 88 C31 88 17 79 17 61 C17 39 31 13 50 13 Z"
        fill={bodyHex}
        filter="brightness(0.80)"
        transform="translate(0, 3)"
      />
    </g>
  ),
  fromage: (bodyHex: string) => (
    <g style={{ pointerEvents: 'none' }}>
      {/* Layer 1 — Subtle Depth Shadow Rim */}
      <path
        d="M16 68 C14 42 22 28 32 24 C44 20 66 32 84 54 C88 59 88 65 82 69 C68 76 34 76 16 68 Z"
        fill={bodyHex}
        filter="brightness(0.78)"
        transform="translate(0, 3)"
      />
    </g>
  ),
  soleil: (bodyHex: string) => (
    <g style={{ pointerEvents: 'none' }}>
      {/* Outer Scalloped Petal Crown (Warm Golden Amber) */}
      <circle cx="50" cy="50" r="42" fill="#f97316" stroke="#ea580c" strokeWidth="1.5" />
    </g>
  ),
};

/**
 * Shape decorative overlays (holes, toppers, bookmark ribbons).
 * Relocated away from the center face area (x: 30..70, y: 35..65).
 */
export const SHAPE_EXTRAS: Record<string, () => React.ReactNode> = {
  fromage: () => (
    <g style={{ pointerEvents: 'none' }}>
      {/* Layer 3 — Flat Perimeter Dimples (Safe Zones) */}
      <circle cx="24" cy="38" r="3.5" fill="rgba(0,0,0,0.12)" />
      <circle cx="76" cy="60" r="3" fill="rgba(0,0,0,0.12)" />
      <circle cx="24" cy="62" r="3.5" fill="rgba(0,0,0,0.12)" />
    </g>
  ),
  livre: () => (
    <g style={{ pointerEvents: 'none' }}>
      {/* Layer 4: Soft Spine Crease & Page Thickness Underlay */}
      <path
        d="M50 23 L50 80"
        stroke="rgba(0, 0, 0, 0.12)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M18 73 C30 73 44 71 50 76 C56 71 70 73 82 73"
        stroke="rgba(0, 0, 0, 0.08)"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
    </g>
  ),
  oeuf: () => (
    <g style={{ pointerEvents: 'none' }}>
      {/* Layer 3 — Shell Highlight Glint */}
      <ellipse
        cx="36"
        cy="30"
        rx="4.5"
        ry="8"
        transform="rotate(-25 36 30)"
        fill="rgba(255, 255, 255, 0.35)"
      />
    </g>
  ),
};

/**
 * 15 Distinct SVG Eye/Brow/Mouth Expressions inside 0 0 100 100 space.
 * Soft, chubby kawaii aesthetic matching "timide" (rounded pills, strokeWidth 4-5.5, blush ovals).
 * Standardized cheek positions (cx=29, cx=71, rx=5) and safe face bounds (max width 38px).
 */
/**
 * 6 Canonical, Unmistakable Expressions inside 0 0 100 100 space.
 * 1. neutral ("Focused"): Two clean vertical pill eyes with specular glints
 * 2. happy ("Happy"): Two thick upward-curved eye arcs + warm smile
 * 3. excited ("Hyped"): Starry wide eyes with 4-point star glints + open D mouth
 * 4. chill ("Chill"): Sleek connected dark sunglasses with glare slashes + confident smirk
 * 5. shy ("Shy"): Soft vertical pill eyes, cheek blush ovals, cat-smile
 * 6. sleepy ("Sleepy"): Peaceful downward-curved eyelids, breathing o mouth, floating zZ
 */
export const EXPRESSION_RENDERERS: Record<
  string,
  (eyeColor: string, isLightBody: boolean) => React.ReactNode
> = {
  // 1. neutral ("Focused")
  neutral: (eyeColor = '#12111A') => (
    <g>
      <rect className="eye-blink" x="32" y="44" width="8" height="15" rx="4" fill={eyeColor} />
      <rect className="eye-blink" x="60" y="44" width="8" height="15" rx="4" fill={eyeColor} />
      <circle cx="37" cy="48" r="1.5" fill="#FFFFFF" />
      <circle cx="65" cy="48" r="1.5" fill="#FFFFFF" />
    </g>
  ),

  // 2. happy ("Happy")
  happy: (eyeColor = '#12111A') => (
    <g>
      <path d="M28 49 Q34.5 39 41 49" stroke={eyeColor} strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M59 49 Q65.5 39 72 49" stroke={eyeColor} strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M45 56 Q50 61 55 56" stroke={eyeColor} strokeWidth="4" strokeLinecap="round" fill="none" />
    </g>
  ),

  // 3. excited ("Hyped")
  excited: (eyeColor = '#12111A') => (
    <g>
      <circle cx="34" cy="46" r="6.5" fill={eyeColor} />
      <circle cx="66" cy="46" r="6.5" fill={eyeColor} />
      {/* 4-point white star glints inside */}
      <path d="M34 42 Q34 46 38 46 Q34 46 34 50 Q34 46 30 46 Q34 46 34 42 Z" fill="#FFFFFF" />
      <path d="M66 42 Q66 46 70 46 Q66 46 66 50 Q66 46 62 46 Q66 46 66 42 Z" fill="#FFFFFF" />
      {/* Open happy D-mouth */}
      <path d="M44 55 L56 55 C56 63 44 63 44 55 Z" fill="#FF4D6D" stroke={eyeColor} strokeWidth="2" strokeLinejoin="round" />
    </g>
  ),

  // 4. chill ("Chill")
  chill: (eyeColor = '#12111A') => (
    <g>
      {/* Sleek connected dark sunglasses */}
      <rect x="24" y="41" width="21" height="13" rx="4" fill={eyeColor} />
      <rect x="55" y="41" width="21" height="13" rx="4" fill={eyeColor} />
      <line x1="45" y1="45" x2="55" y2="45" stroke={eyeColor} strokeWidth="4" strokeLinecap="round" />
      {/* White diagonal lens glare slashes */}
      <line x1="28" y1="50" x2="33" y2="44" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
      <line x1="59" y1="50" x2="64" y2="44" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
      {/* Confident smirk */}
      <path d="M45 58 Q51 60 56 55" stroke={eyeColor} strokeWidth="3.5" strokeLinecap="round" fill="none" />
    </g>
  ),

  // 5. shy ("Shy")
  shy: (eyeColor = '#12111A') => (
    <g>
      <g className="eye-blink">
        <rect x="31" y="42" width="6.5" height="12" rx="3.25" fill={eyeColor} />
        <rect x="62.5" y="42" width="6.5" height="12" rx="3.25" fill={eyeColor} />
      </g>
      {/* Subtle dynamic cheek blush ovals */}
      <ellipse cx="23" cy="54" rx="6" ry="3.2" fill="#FF6B8B" opacity="0.45" />
      <ellipse cx="77" cy="54" rx="6" ry="3.2" fill="#FF6B8B" opacity="0.45" />
      {/* Tiny cat-smile */}
      <path d="M46 56 Q48 59 50 56 Q52 59 54 56" stroke={eyeColor} strokeWidth="3" strokeLinecap="round" fill="none" />
    </g>
  ),

  // 6. sleepy ("Sleepy")
  sleepy: (eyeColor = '#12111A') => (
    <g>
      {/* Peaceful downward-curved closed eyelids */}
      <path d="M28 47 Q34.5 54 41 47" stroke={eyeColor} strokeWidth="4.5" strokeLinecap="round" fill="none" />
      <path d="M59 47 Q65.5 54 72 47" stroke={eyeColor} strokeWidth="4.5" strokeLinecap="round" fill="none" />
      {/* Tiny breathing o mouth */}
      <circle cx="50" cy="58" r="2.5" fill={eyeColor} />
      {/* Floating zZ */}
      <text x="73" y="34" fill={eyeColor} fontSize="11" fontWeight="bold" fontFamily="sans-serif">z</text>
      <text x="80" y="27" fill={eyeColor} fontSize="14" fontWeight="bold" fontFamily="sans-serif">Z</text>
    </g>
  ),
};

// Aliases for backwards compatibility
EXPRESSION_RENDERERS.neutre = EXPRESSION_RENDERERS.neutral;
EXPRESSION_RENDERERS.attentif = EXPRESSION_RENDERERS.neutral;
EXPRESSION_RENDERERS.heureux = EXPRESSION_RENDERERS.happy;
EXPRESSION_RENDERERS.excite = EXPRESSION_RENDERERS.excited;
EXPRESSION_RENDERERS.hilare = EXPRESSION_RENDERERS.excited;
EXPRESSION_RENDERERS.blase = EXPRESSION_RENDERERS.chill;
EXPRESSION_RENDERERS.mefiant = EXPRESSION_RENDERERS.chill;
EXPRESSION_RENDERERS.timide = EXPRESSION_RENDERERS.shy;
EXPRESSION_RENDERERS.somnolent = EXPRESSION_RENDERERS.sleepy;
EXPRESSION_RENDERERS.surpris = EXPRESSION_RENDERERS.excited;
EXPRESSION_RENDERERS.colere = EXPRESSION_RENDERERS.chill;
EXPRESSION_RENDERERS.triste = EXPRESSION_RENDERERS.chill;
EXPRESSION_RENDERERS.effraye = EXPRESSION_RENDERERS.excited;
EXPRESSION_RENDERERS.curieux = EXPRESSION_RENDERERS.chill;
EXPRESSION_RENDERERS.fier = EXPRESSION_RENDERERS.chill;

/**
 * Palette of all supported mascot colors.
 */
export const COLOR_MAP: Record<string, string> = {
  encre: '#0a0a0c',
  brun: '#8b5e3c',
  rouge: '#e8483f',
  orange: '#f08a24',
  ambre: '#f0b429',
  vert: '#3ecf8e',
  turquoise: '#2fbfa0',
  bleu: '#3b93f0',
  violet: '#8b5cf6',
  rose: '#e152b0',
  gris: '#a3a3a3',
  creme: '#f1efe9',
  blanc: '#ffffff',
  white: '#ffffff',
  black: '#000000',
};

export function resolveColor(color: string | undefined | null): string {
  if (!color) return COLOR_MAP.bleu;
  const norm = normalizeId(color);
  if (COLOR_MAP[norm]) return COLOR_MAP[norm];
  if (color.startsWith('#') || color.startsWith('rgb')) return color;
  return COLOR_MAP.bleu;
}

/**
 * Critical SafeColor: Never invert #FFFFFF to black, and map pure black to #27272A.
 */
export function getSafeColor(color: string | undefined | null): string {
  if (!color) return '#3B82F6';
  const clean = color.toLowerCase().trim();
  if (clean === '#000000' || clean === '#0a0a0c' || clean === '#12111a' || clean === 'encre' || clean === 'black') {
    return '#27272A';
  }
  if (clean === '#ffffff' || clean === 'white' || clean === 'blanc') {
    return '#FFFFFF';
  }
  return resolveColor(color);
}

export function isLightColor(hex: string): boolean {
  if (!hex || !hex.startsWith('#')) return false;
  const clean = hex.replace('#', '');
  if (clean.length < 6) return false;
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  const luma = 0.299 * r + 0.587 * g + 0.114 * b;
  return luma > 100;
}

export function getEyeColor(bodyHex: string): string {
  // If the body is dark graphite (#27272A), black or dark blue, flip eyes to crisp white!
  return isLightColor(bodyHex) ? '#12111A' : '#FFFFFF';
}

