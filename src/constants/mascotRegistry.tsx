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
  return SHAPE_ALIASES[norm] || 'squircle';
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
    'M 50 10 C 53 10 56 16 59 18 C 65 15 70 17 73 22 C 77 26 77 32 82 36 C 87 39 88 45 88 50 C 88 55 87 61 82 64 C 77 68 77 74 73 78 C 70 83 65 85 59 82 C 56 84 53 90 50 90 C 47 90 44 84 41 82 C 35 85 30 83 27 78 C 23 74 23 68 18 64 C 13 61 12 55 12 50 C 12 45 13 39 18 36 C 23 32 23 26 27 22 C 30 17 35 15 41 18 C 44 16 47 10 50 10 Z',
  fromage:
    'M18 78 C14 78 12 74 14 70 L26 32 C28 26 34 22 42 22 L76 34 C84 37 88 44 86 52 L82 72 C80 76 76 78 72 78 Z',
  livre:
    'M16 26 C28 22 42 24 50 30 C58 24 72 22 84 26 L84 76 C72 72 58 74 50 80 C42 74 28 72 16 76 Z',
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
      {/* Bookmark ribbon hanging from center fold */}
      <path d="M48 30 L48 68 L50 65 L52 68 L52 30 Z" fill="#ef4444" />
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
