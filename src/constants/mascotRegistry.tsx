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
  capsule: 'nuage',
  pill: 'nuage',
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
    'M 32 76 C 21 76 13 67 13 56 C 13 46 20 38 30 37 C 33 26 43 19 50 19 C 57 19 67 26 70 37 C 80 38 87 46 87 56 C 87 67 79 76 68 76 C 58 76 42 76 32 76 Z',
  triangle:
    'M50 12 C56 12 60 16 63 22 L86 68 C90 76 85 86 75 86 L25 86 C15 86 10 76 14 68 L37 22 C40 16 44 12 50 12 Z',
  hexagone:
    'M 41.34 13 C 46.10 10.25 53.90 10.25 58.66 13 L 77.71 24 C 82.48 26.75 86.37 33.50 86.37 39 L 86.37 61 C 86.37 66.50 82.48 73.25 77.71 76 L 58.66 87 C 53.90 89.75 46.10 89.75 41.34 87 L 22.29 76 C 17.52 73.25 13.63 66.50 13.63 61 L 13.63 39 C 13.63 33.50 17.52 26.75 22.29 24 Z',
  nuage:
    'M 32 76 C 21 76 13 67 13 56 C 13 46 20 38 30 37 C 33 26 43 19 50 19 C 57 19 67 26 70 37 C 80 38 87 46 87 56 C 87 67 79 76 68 76 C 58 76 42 76 32 76 Z',
  goutte:
    'M50 12 C50 12 82 46 82 66 C82 82 68 90 50 90 C32 90 18 82 18 66 C18 46 50 12 50 12 Z',
  oeuf:
    'M50 13 C69 13 83 39 83 61 C83 79 69 88 50 88 C31 88 17 79 17 61 C17 39 31 13 50 13 Z',
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
  capsule:  { dx: 0, dy: 1, scale: 0.92 },
  triangle: { dx: 0, dy: 8, scale: 0.78 },
  hexagone: { dx: 0, dy: 0, scale: 0.90 },
  nuage:    { dx: 0, dy: 1, scale: 0.92 },
  goutte:   { dx: 0, dy: 7, scale: 0.80 },
  oeuf:     { dx: 0, dy: 7, scale: 0.86 },
  soleil:   { dx: 0, dy: 0, scale: 0.85 },
  fromage:  { dx: 0, dy: 3, scale: 0.80 },
  livre:    { dx: 0, dy: -2, scale: 0.95 },
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
        fill="#FF4D6D"
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
export const EXPRESSION_RENDERERS: Record<
  string,
  (eyeColor: string, isLightBody: boolean) => React.ReactNode
> = {
  // 1. neutre (Calm Classic): 32px separation, y=38..53 with eye blink
  neutre: (eyeColor = '#18181B') => (
    <g>
      <rect className="eye-blink" x="30.5" y="38" width="7" height="15" rx="3.5" fill={eyeColor} />
      <rect className="eye-blink" x="62.5" y="38" width="7" height="15" rx="3.5" fill={eyeColor} />
    </g>
  ),

  // 2. attentif (Wide Starry-Eyed Focus): Taller glossy pill eyes + dual white specular highlights
  attentif: (eyeColor = '#18181B') => (
    <g className="eye-blink">
      <rect x="29.75" y="36" width="8.5" height="17" rx="4.25" fill={eyeColor} />
      <rect x="61.75" y="36" width="8.5" height="17" rx="4.25" fill={eyeColor} />
      <circle cx="32.5" cy="40.5" r="2.4" fill="#FFFFFF" />
      <circle cx="64.5" cy="40.5" r="2.4" fill="#FFFFFF" />
      <circle cx="35.5" cy="49" r="1.2" fill="#FFFFFF" />
      <circle cx="67.5" cy="49" r="1.2" fill="#FFFFFF" />
    </g>
  ),

  // 3. surpris (Shocked Wide Eyes + Low 'O' Mouth): Clean air gap, arched brows, low mouth
  surpris: (eyeColor = '#18181B') => (
    <g>
      <path d="M28 31 Q34 26 40 31 M60 31 Q66 26 72 31" stroke={eyeColor} strokeWidth="4" strokeLinecap="round" fill="none" />
      <ellipse cx="34" cy="44" rx="5" ry="6.5" fill={eyeColor} />
      <ellipse cx="66" cy="44" rx="5" ry="6.5" fill={eyeColor} />
      <circle cx="34" cy="41.5" r="1.8" fill="#FFFFFF" />
      <circle cx="66" cy="41.5" r="1.8" fill="#FFFFFF" />
      <ellipse className="mouth-pulse" cx="50" cy="59" rx="4" ry="4.8" fill={eyeColor} />
    </g>
  ),

  // 4. excite (Super Happy Arcs + Rosy Cheeks): Wide separated arcs at cx=34/66 + rosy blush
  excite: (eyeColor = '#18181B') => (
    <g>
      <path d="M27 48 Q34 36 41 48" stroke={eyeColor} strokeWidth="5.5" strokeLinecap="round" fill="none" />
      <path d="M59 48 Q66 36 73 48" stroke={eyeColor} strokeWidth="5.5" strokeLinecap="round" fill="none" />
      <ellipse cx="23" cy="54" rx="5.5" ry="3.2" fill="#FF6B8B" opacity="0.65" />
      <ellipse cx="77" cy="54" rx="5.5" ry="3.2" fill="#FF6B8B" opacity="0.65" />
    </g>
  ),

  // 5. heureux (Warm Sweet Smile + Glossy Eyes): Glossy pill eyes, blush, and smile cleanly at y=56
  heureux: (eyeColor = '#18181B') => (
    <g>
      <g className="eye-blink">
        <rect x="30.5" y="38" width="7" height="14" rx="3.5" fill={eyeColor} />
        <rect x="62.5" y="38" width="7" height="14" rx="3.5" fill={eyeColor} />
        <circle cx="33" cy="41.5" r="1.8" fill="#FFFFFF" />
        <circle cx="65" cy="41.5" r="1.8" fill="#FFFFFF" />
      </g>
      <ellipse cx="23" cy="54" rx="5.5" ry="3.2" fill="#FF6B8B" opacity="0.65" />
      <ellipse cx="77" cy="54" rx="5.5" ry="3.2" fill="#FF6B8B" opacity="0.65" />
      <path d="M44 56 Q50 62 56 56" stroke={eyeColor} strokeWidth="4.5" strokeLinecap="round" fill="none" />
    </g>
  ),

  // 6. hilare (Squinting > < Laughing Eyes + Open Pink Mouth): Separated eyes + laughing D-mouth
  hilare: (eyeColor = '#18181B') => (
    <g>
      <g className="laugh-eyes">
        <path d="M28 39 L38 45 L28 51" stroke={eyeColor} strokeWidth="5.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M72 39 L62 45 L72 51" stroke={eyeColor} strokeWidth="5.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>
      <ellipse cx="22" cy="55" rx="5.5" ry="3.2" fill="#FF6B8B" opacity="0.65" />
      <ellipse cx="78" cy="55" rx="5.5" ry="3.2" fill="#FF6B8B" opacity="0.65" />
      <path className="laugh-mouth" d="M42 55 L58 55 C58 64 42 64 42 55 Z" fill="#FF4D6D" stroke={eyeColor} strokeWidth="4" strokeLinejoin="round" />
    </g>
  ),

  // 7. colere (Fierce Cute Pout): V-brows strictly at y=31..37 with 5px clear gap above eyes at y=42
  colere: (eyeColor = '#18181B') => (
    <g>
      <path d="M26 31 L40 37 M74 31 L60 37" stroke={eyeColor} strokeWidth="5.5" strokeLinecap="round" />
      <rect x="30.5" y="42" width="7" height="12" rx="3.5" fill={eyeColor} />
      <rect x="62.5" y="42" width="7" height="12" rx="3.5" fill={eyeColor} />
      <path d="M45 60 Q50 56 55 60" stroke={eyeColor} strokeWidth="4.5" strokeLinecap="round" fill="none" />
    </g>
  ),

  // 8. triste (Droopy Puppy Eyes + Animated Teardrop): Clean brows at y=31..37, eyes at y=41, teardrop
  triste: (eyeColor = '#18181B') => (
    <g>
      <path d="M26 37 Q33 31 40 33 M74 37 Q67 31 60 33" stroke={eyeColor} strokeWidth="4.5" strokeLinecap="round" fill="none" />
      <rect x="30.5" y="41" width="7" height="13" rx="3.5" fill={eyeColor} />
      <rect x="62.5" y="41" width="7" height="13" rx="3.5" fill={eyeColor} />
      <circle cx="33" cy="44.5" r="2" fill="#FFFFFF" />
      <circle cx="65" cy="44.5" r="2" fill="#FFFFFF" />
      <path d="M45 60 Q50 56 55 60" stroke={eyeColor} strokeWidth="4.5" strokeLinecap="round" fill="none" />
      <path className="tear-drip" d="M74 46 C74 46 79 53 79 56.5 A4.5 4.5 0 1 1 70 56.5 C70 53 74 46 74 46 Z" fill="#38BDF8" />
    </g>
  ),

  // 9. effraye (Spooked Shrunk Pupils + Wavy Squiggle Mouth): Worried brows, sclera + jitter pupils
  effraye: (eyeColor = '#18181B') => (
    <g>
      <path d="M27 33 Q34 28 40 32 M73 33 Q66 28 60 32" stroke={eyeColor} strokeWidth="4.2" strokeLinecap="round" fill="none" />
      <ellipse cx="34" cy="44" rx="5.5" ry="6.5" fill="#FFFFFF" stroke={eyeColor} strokeWidth="3.5" />
      <ellipse cx="66" cy="44" rx="5.5" ry="6.5" fill="#FFFFFF" stroke={eyeColor} strokeWidth="3.5" />
      <g className="effraye-pupils">
        <circle cx="34" cy="44" r="2.2" fill={eyeColor} />
        <circle cx="66" cy="44" r="2.2" fill={eyeColor} />
      </g>
      <path d="M41 59 Q44 55 47 59 T53 59 T59 59" stroke={eyeColor} strokeWidth="4" strokeLinecap="round" fill="none" />
    </g>
  ),

  // 10. mefiant (Skeptical Side-Eye Glare): Heavy half-lidded bars shifted + flat mouth at y=58
  mefiant: (eyeColor = '#18181B') => (
    <g>
      <g transform="translate(3, 0)">
        <rect x="28" y="42" width="12" height="5.5" rx="2.75" fill={eyeColor} />
        <rect x="60" y="42" width="12" height="5.5" rx="2.75" fill={eyeColor} />
      </g>
      <line x1="45" y1="58" x2="55" y2="58" stroke={eyeColor} strokeWidth="4.2" strokeLinecap="round" />
    </g>
  ),

  // 11. curieux (Asymmetric Inquisitive Brow & Tilt): Pill eyes, high arch brow above right eye, cute smirk
  curieux: (eyeColor = '#18181B') => (
    <g>
      <rect className="eye-blink" x="30.5" y="40" width="7" height="13" rx="3.5" fill={eyeColor} />
      <g className="eye-blink">
        <rect x="61.5" y="36" width="8" height="16" rx="4" fill={eyeColor} />
        <circle cx="64.5" cy="40.5" r="2" fill="#FFFFFF" />
      </g>
      <path d="M59 29 Q66 24 73 29" stroke={eyeColor} strokeWidth="4.5" strokeLinecap="round" fill="none" />
      <ellipse cx="50" cy="58" rx="2.8" ry="3.2" fill={eyeColor} />
    </g>
  ),

  // 12. fier (Smug Confident Closed Arcs + Smirk): Smug closed arcs, blush ovals, confident smirk
  fier: (eyeColor = '#18181B') => (
    <g>
      <path d="M27 46 Q34 39 41 46 M59 46 Q66 39 73 46" stroke={eyeColor} strokeWidth="5.2" strokeLinecap="round" fill="none" />
      <ellipse cx="23" cy="54" rx="5.5" ry="3.2" fill="#FF6B8B" opacity="0.65" />
      <ellipse cx="77" cy="54" rx="5.5" ry="3.2" fill="#FF6B8B" opacity="0.65" />
      <path d="M44 57 Q51 60 57 53" stroke={eyeColor} strokeWidth="4.5" strokeLinecap="round" fill="none" />
    </g>
  ),

  // 13. timide (Shy Blushing — User Favorite, Spacious & Crisp): Clean pills, prominent blush, low wobble mouth
  timide: (eyeColor = '#18181B') => (
    <g>
      <g className="eye-blink">
        <rect x="31" y="41" width="6.5" height="12.5" rx="3.25" fill={eyeColor} />
        <rect x="62.5" y="41" width="6.5" height="12.5" rx="3.25" fill={eyeColor} />
      </g>
      <ellipse cx="23" cy="53" rx="6.5" ry="3.8" fill="#FF6B8B" opacity="0.78" />
      <ellipse cx="77" cy="53" rx="6.5" ry="3.8" fill="#FF6B8B" opacity="0.78" />
      <path d="M47.5 56 Q50 58 52.5 56" stroke={eyeColor} strokeWidth="3.8" strokeLinecap="round" fill="none" />
    </g>
  ),

  // 14. blase (Cool Deal-With-It Shades): Connected sunglasses with thick frames and lens glare slashes
  blase: (eyeColor = '#18181B') => (
    <g>
      <path d="M24 41 L76 41" stroke={eyeColor} strokeWidth="4.5" strokeLinecap="round" />
      <rect x="26" y="40" width="19" height="13" rx="4" fill={eyeColor} />
      <rect x="55" y="40" width="19" height="13" rx="4" fill={eyeColor} />
      <line x1="30" y1="49" x2="35" y2="43" stroke="rgba(255,255,255,0.45)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="59" y1="49" x2="64" y2="43" stroke="rgba(255,255,255,0.45)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="46" y1="58" x2="54" y2="58" stroke={eyeColor} strokeWidth="3.8" strokeLinecap="round" />
    </g>
  ),

  // 15. somnolent (Peaceful Sleeping Eyes + Floating "Zzz" & Breathing Mouth): Downward arcs, blush, floating Zzz
  somnolent: (eyeColor = '#18181B') => (
    <g>
      <path d="M27 45 Q34 52 41 45 M59 45 Q66 52 73 45" stroke={eyeColor} strokeWidth="5" strokeLinecap="round" fill="none" />
      <ellipse cx="23" cy="54" rx="5.5" ry="3.2" fill="#FF6B8B" opacity="0.5" />
      <ellipse cx="77" cy="54" rx="5.5" ry="3.2" fill="#FF6B8B" opacity="0.5" />
      <circle className="sleep-mouth" cx="50" cy="58" r="2.8" fill={eyeColor} />
      <g className="sleep-zzz">
        <text x="74" y="32" fill={eyeColor} fontSize="11" fontWeight="900" fontFamily="sans-serif">z</text>
        <text x="81" y="24" fill={eyeColor} fontSize="14" fontWeight="900" fontFamily="sans-serif">Z</text>
      </g>
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
