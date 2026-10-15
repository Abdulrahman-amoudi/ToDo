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
  confus: 'curieux',
  confused: 'curieux',
  fier: 'fier',
  proud: 'fier',
  timide: 'timide',
  shy: 'timide',
  blase: 'blase',
  bored: 'blase',
  unamused: 'blase',
  somnolent: 'somnolent',
  sleep: 'somnolent',
  sleepy: 'somnolent',
  drowsy: 'somnolent',
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
    'M 41.34 13 C 46.10 10.25 53.90 10.25 58.66 13 L 77.71 24 C 82.48 26.75 86.37 33.50 86.37 39 L 86.37 61 C 86.37 66.50 82.48 73.25 77.71 76 L 58.66 87 C 53.90 89.75 46.10 89.75 41.34 87 L 22.29 76 C 17.52 73.25 13.63 66.50 13.63 61 L 13.63 39 C 13.63 33.50 17.52 26.75 22.29 24 Z',
  nuage:
    'M28 78 C16 78 10 69 12 58 C13 50 19 44 26 43 C29 29 42 20 56 23 C67 25 75 34 76 45 C84 47 90 55 89 64 C88 73 80 78 70 78 Z',
  goutte:
    'M50 12 C50 12 82 46 82 66 C82 82 68 90 50 90 C32 90 18 82 18 66 C18 46 50 12 50 12 Z',
  oeuf:
    'M50 12 C68 12 80 38 80 60 C80 78 67 90 50 90 C33 90 20 78 20 60 C20 38 32 12 50 12 Z',
  soleil:
    'M 50.00 9.00 C 52.93 9.00 55.38 16.24 58.80 17.16 C 62.22 18.07 67.96 13.03 70.50 14.49 C 73.04 15.96 71.54 23.46 74.04 25.96 C 76.54 28.46 84.04 26.96 85.51 29.50 C 86.97 32.04 81.93 37.78 82.84 41.20 C 83.76 44.62 91.00 47.07 91.00 50.00 C 91.00 52.93 83.76 55.38 82.84 58.80 C 81.93 62.22 86.97 67.96 85.51 70.50 C 84.04 73.04 76.54 71.54 74.04 74.04 C 71.54 76.54 73.04 84.04 70.50 85.51 C 67.96 86.97 62.22 81.93 58.80 82.84 C 55.38 83.76 52.93 91.00 50.00 91.00 C 47.07 91.00 44.62 83.76 41.20 82.84 C 37.78 81.93 32.04 86.97 29.50 85.51 C 26.96 84.04 28.46 76.54 25.96 74.04 C 23.46 71.54 15.96 73.04 14.49 70.50 C 13.03 67.96 18.07 62.22 17.16 58.80 C 16.24 55.38 9.00 52.93 9.00 50.00 C 9.00 47.07 16.24 44.62 17.16 41.20 C 18.07 37.78 13.03 32.04 14.49 29.50 C 15.96 26.96 23.46 28.46 25.96 25.96 C 28.46 23.46 26.96 15.96 29.50 14.49 C 32.04 13.03 37.78 18.07 41.20 17.16 C 44.62 16.24 47.07 9.00 50.00 9.00 Z',
  fromage:
    'M18 78 C14 78 12 74 14 70 L26 32 C28 26 34 22 42 22 L76 34 C84 37 88 44 86 52 L82 72 C80 76 76 78 72 78 Z',
  livre:
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
  capsule:  { dx: 0, dy: 0, scale: 0.80 },
  triangle: { dx: 0, dy: 8, scale: 0.78 },
  hexagone: { dx: 0, dy: 0, scale: 0.90 },
  nuage:    { dx: 0, dy: 2, scale: 0.88 },
  goutte:   { dx: 0, dy: 7, scale: 0.80 },
  oeuf:     { dx: 0, dy: 2, scale: 0.86 },
  soleil:   { dx: 0, dy: 0, scale: 0.85 },
  fromage:  { dx: 0, dy: 3, scale: 0.80 },
  livre:    { dx: 0, dy: 0, scale: 0.88 },
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
  goutte:   getFaceTransform('goutte'),
  oeuf:     getFaceTransform('oeuf'),
  soleil:   getFaceTransform('soleil'),
  fromage:  getFaceTransform('fromage'),
  livre:    getFaceTransform('livre'),
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
 * Relocated away from the center face area (x: 30..70, y: 35..65).
 */
export const SHAPE_EXTRAS: Record<string, () => React.ReactNode> = {
  fromage: () => (
    <g style={{ pointerEvents: 'none' }}>
      {/* 3 subtle cutout cheese holes placed in the outer corners */}
      <circle cx="72" cy="40" r="4" fill="#000" opacity="0.16" />
      <circle cx="25" cy="69" r="4.5" fill="#000" opacity="0.16" />
      <circle cx="73" cy="71" r="3.5" fill="#000" opacity="0.16" />
      {/* Top green leaf/stem accent */}
      <path d="M42 22 Q40 12 46 6" stroke="#8b5e3c" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M46 6 C40 2 40 -2 50 0 C54 6 50 8 46 6 Z" fill="#22c55e" />
    </g>
  ),
  livre: () => (
    <g style={{ pointerEvents: 'none' }}>
      {/* Layer 4 — Subtle Spine Crease Split into top and bottom notches so mouths & glasses are never sliced */}
      <path d="M50 23 L50 33" stroke="rgba(0,0,0,0.12)" strokeWidth="3" strokeLinecap="round" />
      <path d="M50 67 L50 78" stroke="rgba(0,0,0,0.12)" strokeWidth="3" strokeLinecap="round" />
      <path d="M18 73 C30 73 44 71 50 76 C56 71 70 73 82 73" stroke="rgba(0,0,0,0.14)" strokeWidth="3.5" strokeLinecap="round" fill="none" />
    </g>
  ),
};

/**
 * 15 Distinct SVG Eye/Brow/Mouth Expressions inside 0 0 100 100 space.
 * Soft, chubby kawaii aesthetic matching "timide" (rounded pills, strokeWidth 4-5.5, blush ovals).
 * Standardized cheek positions (cx=29, cx=71, rx=5) and safe face bounds (max width 38px).
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
      <ellipse cx="29" cy="55" rx="5" ry="3" fill="#FF758F" opacity="0.65" />
      <ellipse cx="71" cy="55" rx="5" ry="3" fill="#FF758F" opacity="0.65" />
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
      <ellipse cx="29" cy="56" rx="5" ry="3" fill="#FF758F" opacity="0.65" />
      <ellipse cx="71" cy="56" rx="5" ry="3" fill="#FF758F" opacity="0.65" />
    </g>
  ),

  // 6. heureux: Warm gentle smile with vertical pills, pink blush cheeks, and cute curved cat mouth
  heureux: (eyeColor) => (
    <g>
      <rect x="36" y="42" width="7" height="15" rx="3.5" fill={eyeColor} />
      <rect x="57" y="42" width="7" height="15" rx="3.5" fill={eyeColor} />
      <ellipse cx="29" cy="56" rx="5" ry="3" fill="#FF758F" opacity="0.65" />
      <ellipse cx="71" cy="56" rx="5" ry="3" fill="#FF758F" opacity="0.65" />
      <path d="M46 55 Q50 59 54 55" fill="none" stroke={eyeColor} strokeWidth="4.5" strokeLinecap="round" />
    </g>
  ),

  // 7. hilare: Soft rounded > < laughing eyes + pink blush cheeks + chubby happy mouth
  hilare: (eyeColor) => (
    <g>
      <path d="M34 44 L43 49 L34 54" fill="none" stroke={eyeColor} strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M66 44 L57 49 L66 54" fill="none" stroke={eyeColor} strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
      <ellipse cx="29" cy="56" rx="5" ry="3" fill="#FF758F" opacity="0.65" />
      <ellipse cx="71" cy="56" rx="5" ry="3" fill="#FF758F" opacity="0.65" />
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
      <path d="M55 35 Q61 30.5 67 35" stroke={eyeColor} strokeWidth="4" strokeLinecap="round" fill="none" />
    </g>
  ),

  // 13. fier: Confident closed smiling upward eye arcs, pink blush cheeks, and smirk
  fier: (eyeColor) => (
    <g>
      <path d="M34 48 Q39.5 42 45 48" fill="none" stroke={eyeColor} strokeWidth="5.5" strokeLinecap="round" />
      <path d="M55 48 Q60.5 42 66 48" fill="none" stroke={eyeColor} strokeWidth="5.5" strokeLinecap="round" />
      <ellipse cx="29" cy="56" rx="5" ry="3" fill="#FF758F" opacity="0.65" />
      <ellipse cx="71" cy="56" rx="5" ry="3" fill="#FF758F" opacity="0.65" />
      <path d="M46 56 Q51 58 55 54" stroke={eyeColor} strokeWidth="4.5" strokeLinecap="round" fill="none" />
    </g>
  ),

  // 14. blase: Smooth rounded kawaii sunglasses centered (x: 31..69, width 38px)
  blase: (eyeColor) => (
    <g>
      <rect x="31" y="42" width="16" height="11" rx="4" fill={eyeColor} />
      <rect x="53" y="42" width="16" height="11" rx="4" fill={eyeColor} />
      <line x1="47" y1="46" x2="53" y2="46" stroke={eyeColor} strokeWidth="3.5" strokeLinecap="round" />
      <line x1="46" y1="59" x2="54" y2="59" stroke={eyeColor} strokeWidth="3" strokeLinecap="round" />
    </g>
  ),

  // 15. somnolent: Sleepy / drowsy with curved closed drooping eyes, soft blush, and gentle 'z'
  somnolent: (eyeColor) => (
    <g>
      <path d="M35 48 Q40 54 45 48" fill="none" stroke={eyeColor} strokeWidth="4.5" strokeLinecap="round" />
      <path d="M55 48 Q60 54 65 48" fill="none" stroke={eyeColor} strokeWidth="4.5" strokeLinecap="round" />
      <ellipse cx="29" cy="55" rx="5" ry="3" fill="#FF758F" opacity="0.5" />
      <ellipse cx="71" cy="55" rx="5" ry="3" fill="#FF758F" opacity="0.5" />
      <ellipse cx="50" cy="59" rx="2.5" ry="2" fill={eyeColor} opacity="0.75" />
      <text x="67" y="39" fill={eyeColor} fontSize="8" fontWeight="bold" opacity="0.75" style={{ userSelect: 'none' }}>z</text>
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
