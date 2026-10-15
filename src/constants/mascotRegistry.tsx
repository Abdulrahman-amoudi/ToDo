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
  squircle: 'squircle',
  square: 'squircle',
  cercle: 'cercle',
  circle: 'cercle',
  round: 'cercle',
  galet: 'galet',
  pebble: 'galet',
  capsule: 'capsule',
  pill: 'capsule',
  triangle: 'triangle',
  hexagone: 'hexagone',
  hexagon: 'hexagone',
  nuage: 'nuage',
  cloud: 'nuage',
  goutte: 'goutte',
  drop: 'goutte',
  droplet: 'goutte',
  oeuf: 'oeuf',
  egg: 'oeuf',
  soleil: 'soleil',
  sun: 'soleil',
  fromage: 'fromage',
  cheese: 'fromage',
  livre: 'livre',
  book: 'livre',
};

export function normalizeShape(shape: string | undefined | null): string {
  const norm = normalizeId(shape);
  return SHAPE_ALIASES[norm] || 'soleil';
}

export const EXPRESSION_ALIASES: Record<string, string> = {
  neutre: 'neutre',
  neutral: 'neutre',
  idle: 'neutre',
  attentif: 'attentif',
  attentive: 'attentif',
  focused: 'attentif',
  focus: 'attentif',
  surpris: 'surpris',
  surprised: 'surpris',
  surprise: 'surpris',
  excite: 'excite',
  excited: 'excite',
  heureux: 'heureux',
  happy: 'heureux',
  joyeux: 'heureux',
  hilare: 'hilare',
  laugh: 'hilare',
  laughing: 'hilare',
  colere: 'colere',
  angry: 'colere',
  anger: 'colere',
  triste: 'triste',
  sad: 'triste',
  sorrow: 'triste',
  effraye: 'effraye',
  scared: 'effraye',
  fear: 'effraye',
  mefiant: 'mefiant',
  suspicious: 'mefiant',
  curieux: 'curieux',
  curious: 'curieux',
  fier: 'fier',
  proud: 'fier',
  timide: 'timide',
  shy: 'timide',
  blase: 'blase',
  bored: 'blase',
  unamused: 'blase',
  somnolent: 'blase',
  sleep: 'blase',
  vroum: 'excite',
  klaxon: 'excite',
};

export function normalizeExpression(expr: string | undefined | null): string {
  const norm = normalizeId(expr);
  return EXPRESSION_ALIASES[norm] || 'neutre';
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
    'M50 12 C68 12 76 22 76 38 L76 62 C76 78 68 88 50 88 C32 88 24 78 24 62 L24 38 C24 22 32 12 50 12 Z',
  triangle:
    'M50 12 C56 12 60 16 63 22 L86 68 C90 76 85 86 75 86 L25 86 C15 86 10 76 14 68 L37 22 C40 16 44 12 50 12 Z',
  hexagone:
    'M50 10 L82 28 C86 30 88 35 88 40 L88 60 C88 65 86 70 82 72 L50 90 C46 92 44 92 40 90 L18 72 C14 70 12 65 12 60 L12 40 C12 35 14 30 18 28 Z',
  nuage:
    'M28 78 C16 78 10 69 12 58 C13 50 19 44 26 43 C29 29 42 20 56 23 C67 25 75 34 76 45 C84 47 90 55 89 64 C88 73 80 78 70 78 Z',
  goutte:
    'M50 12 C50 12 82 46 82 66 C82 82 68 90 50 90 C32 90 18 82 18 66 C18 46 50 12 50 12 Z',
  oeuf:
    'M50 12 C68 12 80 38 80 60 C80 78 67 90 50 90 C33 90 20 78 20 60 C20 38 32 12 50 12 Z',
  soleil:
    'M88 50 C88 51.16 86.68 52.49 85.25 53.47 C83.82 54.45 81.05 55.15 79.41 55.85 C77.77 56.55 75.95 56.88 75.38 57.7 C74.81 58.52 75.3 59.42 75.97 60.76 C76.64 62.09 78.52 64.02 79.4 65.71 C80.28 67.39 81.36 69.57 81.23 70.87 C81.1 72.17 80.03 73.17 78.62 73.49 C77.21 73.81 74.64 73.16 72.77 72.77 C70.89 72.38 68.68 71.25 67.37 71.17 C66.06 71.09 65.37 71.28 64.92 72.32 C64.47 73.36 64.82 75.53 64.65 77.4 C64.48 79.27 64.5 82.06 63.89 83.54 C63.28 85.02 62.2 86.22 61 86.26 C59.8 86.3 58.08 85 56.72 83.76 C55.36 82.52 53.96 80.06 52.84 78.84 C51.72 77.62 50.95 76.41 50 76.41 C49.05 76.41 48.28 77.62 47.16 78.84 C46.04 80.06 44.64 82.52 43.28 83.76 C41.92 85 40.2 86.3 39 86.26 C37.8 86.22 36.72 85.02 36.11 83.54 C35.5 82.06 35.52 79.27 35.35 77.4 C35.18 75.53 35.53 73.36 35.08 72.32 C34.63 71.28 33.94 71.09 32.63 71.17 C31.32 71.25 29.11 72.38 27.23 72.77 C25.36 73.16 22.79 73.81 21.38 73.49 C19.97 73.17 18.9 72.17 18.77 70.87 C18.64 69.57 19.72 67.39 20.6 65.71 C21.48 64.02 23.36 62.09 24.03 60.76 C24.7 59.42 25.19 58.52 24.62 57.7 C24.05 56.88 22.23 56.55 20.59 55.85 C18.95 55.15 16.18 54.45 14.75 53.47 C13.32 52.49 12 51.16 12 50 C12 48.84 13.32 47.51 14.75 46.53 C16.18 45.55 18.95 44.85 20.59 44.15 C22.23 43.45 24.05 43.12 24.62 42.3 C25.19 41.48 24.7 40.58 24.03 39.24 C23.36 37.91 21.48 35.98 20.6 34.29 C19.72 32.6 18.64 30.43 18.77 29.13 C18.9 27.83 19.97 26.83 21.38 26.51 C22.79 26.19 25.36 26.84 27.23 27.23 C29.11 27.62 31.32 28.75 32.63 28.83 C33.94 28.9 34.63 28.72 35.08 27.68 C35.53 26.64 35.18 24.47 35.35 22.6 C35.52 20.73 35.5 17.94 36.11 16.46 C36.72 14.98 37.8 13.78 39 13.74 C40.2 13.7 41.92 15 43.28 16.24 C44.64 17.48 46.04 19.93 47.16 21.16 C48.28 22.39 49.05 23.59 50 23.59 C50.95 23.59 51.72 22.39 52.84 21.16 C53.96 19.93 55.36 17.48 56.72 16.24 C58.08 15 59.8 13.7 61 13.74 C62.2 13.78 63.28 14.98 63.89 16.46 C64.5 17.94 64.48 20.73 64.65 22.6 C64.82 24.47 64.47 26.64 64.92 27.68 C65.37 28.72 66.06 28.9 67.37 28.83 C68.68 28.75 70.89 27.62 72.77 27.23 C74.64 26.84 77.21 26.19 78.62 26.51 C80.03 26.83 81.1 27.83 81.23 29.13 C81.36 30.43 80.28 32.6 79.4 34.29 C78.52 35.98 76.64 37.91 75.97 39.24 C75.3 40.58 74.81 41.48 75.38 42.3 C75.95 43.12 77.77 43.45 79.41 44.15 C81.05 44.85 83.82 45.55 85.25 46.53 C86.68 47.51 88 48.84 88 50Z',
  fromage:
    'M18 78 C14 78 12 74 14 70 L26 32 C28 26 34 22 42 22 L76 34 C84 37 88 44 86 52 L82 72 C80 76 76 78 72 78 Z',
  livre:
    'M14 24 C14 19 18 15 24 15 C35 15 45 18 50 23 C55 18 65 15 76 15 C82 15 86 19 86 24 L86 70 C86 75 82 78 76 78 C65 78 55 76 50 81 C45 76 35 78 24 78 C18 78 14 75 14 70 Z',
};

/**
 * Precise Face Transforms per Shape to prevent eye and blush clipping.
 */
export const FACE_TRANSFORMS: Record<string, string> = {
  squircle: 'translate(0, 1) scale(1)',
  cercle:   'translate(0, 1) scale(1)',
  galet:    'translate(0, 5) scale(1.02)',
  capsule:  'translate(0, 1) scale(0.84)',
  triangle: 'translate(0, 13) scale(0.85)',
  hexagone: 'translate(0, 1) scale(0.95)',
  nuage:    'translate(0, 6) scale(0.92)',
  goutte:   'translate(0, 12) scale(0.84)',
  oeuf:     'translate(0, 7) scale(0.86)',
  soleil:   'translate(0, 1) scale(0.86)',
  fromage:  'translate(-2, 6) scale(0.88)',
  livre:    'translate(0, -2) scale(0.95)',
};

/**
 * Shape underlays rendered BEHIND the primary body path (back cover rim, bookmark tails).
 */
export const SHAPE_UNDERLAYS: Record<string, (bodyHex: string) => React.ReactNode> = {
  livre: (bodyHex: string) => (
    <g style={{ pointerEvents: 'none' }}>
      {/* Layer 1 — Soft Rounded Back Cover Rim (Depth Layer) */}
      <path
        d="M10 26 C10 20 15 17 22 17 C34 17 45 20 50 25 C55 20 66 17 78 17 C85 17 90 20 90 26 L90 74 C90 80 85 83 78 83 C66 83 55 80 50 85 C45 80 34 83 22 83 C15 83 10 80 10 74 Z"
        fill={bodyHex}
        filter="brightness(0.78)"
      />
      {/* Layer 2 — Cute Bottom Ribbon Bookmark Tail (Out of the Way of the Face) */}
      <path
        d="M45 76 L55 76 L55 91 L50 87 L45 91 Z"
        fill="#FF5A79"
        strokeLinejoin="round"
      />
    </g>
  ),
};

/**
 * Shape decorative overlays (holes, toppers, bookmark ribbons).
 */
export const SHAPE_EXTRAS: Record<string, () => React.ReactNode> = {
  fromage: () => (
    <g style={{ pointerEvents: 'none' }}>
      {/* 3 subtle cutout cheese holes */}
      <circle cx="36" cy="62" r="5" fill="#000" opacity="0.16" />
      <circle cx="62" cy="56" r="6" fill="#000" opacity="0.16" />
      <circle cx="48" cy="42" r="3.5" fill="#000" opacity="0.16" />
      {/* Top green leaf/stem accent */}
      <path d="M42 22 Q40 12 46 6" stroke="#8b5e3c" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M46 6 C40 2 40 -2 50 0 C54 6 50 8 46 6 Z" fill="#22c55e" />
    </g>
  ),
  livre: () => (
    <g style={{ pointerEvents: 'none' }}>
      {/* Layer 4 — Subtle Center Spine Crease & Bottom Page Thickness (Behind the Face) */}
      <path d="M50 23 L50 79" stroke="rgba(0,0,0,0.12)" strokeWidth="3" strokeLinecap="round" />
      <path d="M18 73 C30 73 44 71 50 76 C56 71 70 73 82 73" stroke="rgba(0,0,0,0.14)" strokeWidth="3.5" strokeLinecap="round" fill="none" />
    </g>
  ),
};

/**
 * 14 Distinct SVG Eye/Brow/Mouth Expressions inside 0 0 100 100 space.
 * Soft, chubby kawaii aesthetic matching "timide" (rounded pills, strokeWidth 4-5.5, blush ovals).
 */
export const EXPRESSION_RENDERERS: Record<
  string,
  (eyeColor: string, isLightBody: boolean) => React.ReactNode
> = {
  // 1. neutre: Two soft vertical pills
  neutre: (eyeColor) => (
    <g>
      <rect x="36" y="42" width="7" height="15" rx="3.5" fill={eyeColor} />
      <rect x="57" y="42" width="7" height="15" rx="3.5" fill={eyeColor} />
    </g>
  ),

  // 2. timide (User Favorite): Soft vertical pills looking down-left + pink blush cheeks
  timide: (eyeColor) => (
    <g>
      <rect x="37" y="45" width="6.5" height="12" rx="3.25" fill={eyeColor} />
      <rect x="56.5" y="45" width="6.5" height="12" rx="3.25" fill={eyeColor} />
      <ellipse cx="28" cy="55" rx="5.5" ry="3" fill="#FF758F" opacity="0.65" />
      <ellipse cx="72" cy="55" rx="5.5" ry="3" fill="#FF758F" opacity="0.65" />
    </g>
  ),

  // 3. attentif: Tall glossy pill eyes with white kawaii sparkle dot in each eye
  attentif: (eyeColor) => (
    <g>
      <rect x="35" y="40" width="8" height="17" rx="4" fill={eyeColor} />
      <rect x="57" y="40" width="8" height="17" rx="4" fill={eyeColor} />
      <circle cx="38" cy="44" r="2.2" fill="#FFFFFF" />
      <circle cx="60" cy="44" r="2.2" fill="#FFFFFF" />
    </g>
  ),

  // 4. surpris: Solid, chubby wide oval eyes with sparkle dots + cute round 'o' mouth
  surpris: (eyeColor) => (
    <g>
      <rect x="34" y="40" width="9" height="14" rx="4.5" fill={eyeColor} />
      <rect x="57" y="40" width="9" height="14" rx="4.5" fill={eyeColor} />
      <circle cx="37" cy="43" r="2" fill="#FFFFFF" />
      <circle cx="60" cy="43" r="2" fill="#FFFFFF" />
      <circle cx="50" cy="59" r="3" fill={eyeColor} />
    </g>
  ),

  // 5. excite: Thick rounded upward happy arcs + pink blush cheeks
  excite: (eyeColor) => (
    <g>
      <path d="M34 52 Q39.5 41 45 52" fill="none" stroke={eyeColor} strokeWidth="5.5" strokeLinecap="round" />
      <path d="M55 52 Q60.5 41 66 52" fill="none" stroke={eyeColor} strokeWidth="5.5" strokeLinecap="round" />
      <ellipse cx="27" cy="56" rx="5.5" ry="3" fill="#FF758F" opacity="0.65" />
      <ellipse cx="73" cy="56" rx="5.5" ry="3" fill="#FF758F" opacity="0.65" />
    </g>
  ),

  // 6. heureux: Warm gentle smile with vertical pills, pink blush cheeks, and cute curved cat mouth
  heureux: (eyeColor) => (
    <g>
      <rect x="36" y="42" width="7" height="15" rx="3.5" fill={eyeColor} />
      <rect x="57" y="42" width="7" height="15" rx="3.5" fill={eyeColor} />
      <ellipse cx="27" cy="56" rx="5.5" ry="3" fill="#FF758F" opacity="0.65" />
      <ellipse cx="73" cy="56" rx="5.5" ry="3" fill="#FF758F" opacity="0.65" />
      <path d="M46 55 Q50 59 54 55" fill="none" stroke={eyeColor} strokeWidth="4.5" strokeLinecap="round" />
    </g>
  ),

  // 7. hilare: Soft rounded > < laughing eyes + pink blush cheeks + chubby happy mouth
  hilare: (eyeColor) => (
    <g>
      <path d="M34 44 L43 49 L34 54" fill="none" stroke={eyeColor} strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M66 44 L57 49 L66 54" fill="none" stroke={eyeColor} strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
      <ellipse cx="27" cy="56" rx="5.5" ry="3" fill="#FF758F" opacity="0.65" />
      <ellipse cx="73" cy="56" rx="5.5" ry="3" fill="#FF758F" opacity="0.65" />
      <path d="M44 56 Q50 64 56 56 Z" fill="#FF6B8B" stroke={eyeColor} strokeWidth="3.5" strokeLinejoin="round" />
    </g>
  ),

  // 8. colere: Pouty cute angry with angled rounded pill eyebrows and slight pout curve
  colere: (eyeColor) => (
    <g>
      <rect x="36" y="44" width="7" height="12" rx="3.5" fill={eyeColor} />
      <rect x="57" y="44" width="7" height="12" rx="3.5" fill={eyeColor} />
      <rect x="32" y="37" width="13" height="5" rx="2.5" fill={eyeColor} transform="rotate(18 38 39)" />
      <rect x="55" y="37" width="13" height="5" rx="2.5" fill={eyeColor} transform="rotate(-18 61 39)" />
      <path d="M46 59 Q50 56 54 59" fill="none" stroke={eyeColor} strokeWidth="4" strokeLinecap="round" />
    </g>
  ),

  // 9. triste: Soft teary vertical pill eyes with drooping pill brows + sky-blue teardrop pill
  triste: (eyeColor) => (
    <g>
      <rect x="36" y="44" width="7" height="13" rx="3.5" fill={eyeColor} />
      <rect x="57" y="44" width="7" height="13" rx="3.5" fill={eyeColor} />
      <rect x="32" y="37" width="13" height="5" rx="2.5" fill={eyeColor} transform="rotate(-16 38 39)" />
      <rect x="55" y="37" width="13" height="5" rx="2.5" fill={eyeColor} transform="rotate(16 61 39)" />
      <path d="M46 60 Q50 57 54 60" fill="none" stroke={eyeColor} strokeWidth="4" strokeLinecap="round" />
      <rect x="65" y="52" width="4.5" height="7" rx="2.25" fill="#38BDF8" />
    </g>
  ),

  // 10. effraye: Shrunk vertical pill eyes with high curved worried pill brows and wavy nervous mouth
  effraye: (eyeColor) => (
    <g>
      <rect x="37" y="45" width="6" height="10" rx="3" fill={eyeColor} />
      <rect x="57" y="45" width="6" height="10" rx="3" fill={eyeColor} />
      <path d="M33 38 Q39 34 45 38" fill="none" stroke={eyeColor} strokeWidth="4.5" strokeLinecap="round" />
      <path d="M55 38 Q61 34 67 38" fill="none" stroke={eyeColor} strokeWidth="4.5" strokeLinecap="round" />
      <path d="M45 58 Q47.5 55 50 58 T55 58" stroke={eyeColor} strokeWidth="4" strokeLinecap="round" fill="none" />
    </g>
  ),

  // 11. mefiant: Cute side-eye with chubby horizontal pills shifted right + flat unimpressed mouth
  mefiant: (eyeColor) => (
    <g transform="translate(3, 0)">
      <rect x="33" y="46" width="11" height="6" rx="3" fill={eyeColor} />
      <rect x="54" y="46" width="11" height="6" rx="3" fill={eyeColor} />
      <line x1="45" y1="58" x2="52" y2="58" stroke={eyeColor} strokeWidth="3.5" strokeLinecap="round" />
    </g>
  ),

  // 12. curieux: Asymmetric vertical pills with one thick rounded arc brow raised high
  curieux: (eyeColor) => (
    <g>
      <rect x="36" y="43" width="7" height="13" rx="3.5" fill={eyeColor} />
      <rect x="57" y="40" width="8" height="16" rx="4" fill={eyeColor} />
      <path d="M55 33 Q61 29 67 33" stroke={eyeColor} strokeWidth="4.5" strokeLinecap="round" fill="none" />
    </g>
  ),

  // 13. fier: Confident closed smiling upward eye arcs, pink blush cheeks, and smirk
  fier: (eyeColor) => (
    <g>
      <path d="M34 48 Q39.5 42 45 48" fill="none" stroke={eyeColor} strokeWidth="5.5" strokeLinecap="round" />
      <path d="M55 48 Q60.5 42 66 48" fill="none" stroke={eyeColor} strokeWidth="5.5" strokeLinecap="round" />
      <ellipse cx="27" cy="56" rx="5.5" ry="3" fill="#FF758F" opacity="0.65" />
      <ellipse cx="73" cy="56" rx="5.5" ry="3" fill="#FF758F" opacity="0.65" />
      <path d="M46 56 Q51 58 55 54" stroke={eyeColor} strokeWidth="4.5" strokeLinecap="round" fill="none" />
    </g>
  ),

  // 14. blase: Smooth rounded kawaii sunglasses with rx=4
  blase: (eyeColor) => (
    <g>
      <rect x="30" y="42" width="17" height="11" rx="4" fill={eyeColor} />
      <rect x="53" y="42" width="17" height="11" rx="4" fill={eyeColor} />
      <line x1="47" y1="46" x2="53" y2="46" stroke={eyeColor} strokeWidth="4" strokeLinecap="round" />
      <line x1="46" y1="59" x2="54" y2="59" stroke={eyeColor} strokeWidth="3" strokeLinecap="round" />
    </g>
  ),
};

/**
 * Palette of all 12 supported mascot colors.
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
};

export function resolveColor(color: string | undefined | null): string {
  if (!color) return COLOR_MAP.bleu;
  const norm = normalizeId(color);
  if (COLOR_MAP[norm]) return COLOR_MAP[norm];
  if (color.startsWith('#') || color.startsWith('rgb')) return color;
  return COLOR_MAP.bleu;
}

export function isLightColor(hex: string): boolean {
  if (!hex || !hex.startsWith('#')) return false;
  const clean = hex.replace('#', '');
  if (clean.length < 6) return false;
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  // Relative luminance formula
  const luma = 0.299 * r + 0.587 * g + 0.114 * b;
  return luma > 175;
}

export function getEyeColor(bodyHex: string): string {
  return isLightColor(bodyHex) ? '#18181B' : '#FFFFFF';
}
