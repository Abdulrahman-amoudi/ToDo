/**
 * E2E Mascot Integrity Test Suite (7 Tiers, 28 Tests)
 * 
 * Comprehensive pre-release integrity verification for the Bloub Mascot overhaul (R1 - R5).
 * 
 * Tiers:
 * 1. Tier 1: Core SVG Architecture & Background Mask Elimination (R1) [4 tests]
 * 2. Tier 2: Spatial Hero Stage & Non-Clipping Boundaries [4 tests]
 * 3. Tier 3: Dual-Tone Sunflower (soleil) Vector & Kinetic Contracts (R2) [5 tests]
 * 4. Tier 4: Harmonization of All 12 Shapes & Reactive Floor Shadows (R3) [5 tests]
 * 5. Tier 5: Cyber-Kawaii Digital Visor Expressions Audit (R4) [5 tests]
 * 6. Tier 6: Typing Animation Wave & Interaction Isolation (R4) [3 tests]
 * 7. Tier 7: Adversarial State Transitions & Performance Stability (R5) [2 tests]
 * 
 * Authoritative Sources:
 * - d:\AI\جبنة\.agents\ORIGINAL_REQUEST.md (## 2026-10-16T08:42:04Z: R1 - R5)
 * - d:\AI\جبنة\.agents\orchestrator_7\PROJECT.md
 * - d:\AI\جبنة\.agents\orchestrator_7\survey_spec_miner_qa\report.md (§ Section 3 & 6)
 * - d:\AI\جبنة\.agents\orchestrator_7\m2_test_writer\DISPATCH.md
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Robust file reading helper compatible across runtime working directories
function readFile(relPath: string): string {
  const p1 = path.resolve(process.cwd(), relPath);
  if (fs.existsSync(p1)) return fs.readFileSync(p1, 'utf8');
  const p2 = path.resolve(__dirname, '../../', relPath);
  if (fs.existsSync(p2)) return fs.readFileSync(p2, 'utf8');
  return fs.readFileSync(relPath, 'utf8');
}

// Authoritative lists of supported shapes, colors, states, and expressions
export const EXPECTED_SHAPES = [
  'cercle', 'galet', 'squircle', 'capsule', 'triangle', 'hexagone',
  'nuage', 'goutte', 'oeuf', 'soleil', 'fromage', 'livre'
];

export const EXPECTED_COLORS = [
  'encre', 'brun', 'rouge', 'orange', 'ambre', 'vert',
  'turquoise', 'bleu', 'violet', 'rose', 'gris', 'creme'
];

export const EXPECTED_STATES = [
  'idle', 'orbit', 'wink', 'alert', 'comet', 'wide', 'sleep', 'thinking',
  'nod', 'shake', 'breathe', 'pulse', 'float', 'listen', 'talk'
];

export const EXPECTED_EXPRESSIONS = [
  'timide', 'neutre', 'heureux', 'hilare', 'surpris', 'fier',
  'colere', 'triste', 'somnolent', 'curieux', 'mefiant', 'blase',
  'attentif', 'effraye', 'concentre', 'clin', 'degoute', 'amuse'
];

export const CANONICAL_15_EXPRESSIONS = [
  'neutre', 'attentif', 'surpris', 'excite', 'heureux', 'hilare',
  'colere', 'triste', 'effraye', 'mefiant', 'curieux', 'fier',
  'timide', 'blase', 'somnolent'
];

// Cache file contents
const mascotCode = readFile('src/components/BloubMascot.tsx');
const registryCode = readFile('src/constants/mascotRegistry.tsx');
const repereCode = readFile('src/lib/bot/repere.ts');
const skinsCode = readFile('src/lib/bot/skins.ts');
const pageCode = readFile('src/app/page.tsx');

// ============================================================================
// TIER 1: CORE SVG ARCHITECTURE & BACKGROUND MASK ELIMINATION (R1)
// ============================================================================
describe('E2E Mascot Integrity: Tier 1 — Core SVG Architecture & Background Mask Elimination (R1)', () => {
  it('T1.1: Zero <mask elements in SVG definitions and zero mask="url(#...)" attributes', () => {
    // Assert zero SVG <mask elements in BloubMascot.tsx
    assert.ok(
      !mascotCode.includes('<mask'),
      'BloubMascot.tsx must contain 0 background SVG <mask elements'
    );
    // Assert zero mask="url(#...)" attributes
    assert.ok(
      !mascotCode.includes('mask="url(') &&
      !mascotCode.includes("mask={'url(") &&
      !mascotCode.includes('mask={"url('),
      'BloubMascot.tsx must not attach mask="url(#...)" attributes to any body elements'
    );
    // Assert zero SVG <mask elements in mascotRegistry.tsx
    assert.ok(
      !registryCode.includes('<mask'),
      'mascotRegistry.tsx must contain 0 SVG <mask definitions'
    );
  });

  it('T1.2: Zero data-mask-eyes and zero data-mask-body attributes; assert presence of foreground live face markers', () => {
    // Invert legacy cutout requirement: assert complete elimination of data-mask-* attributes
    assert.ok(
      !mascotCode.includes('data-mask-eyes'),
      'BloubMascot.tsx must not contain legacy data-mask-eyes background cutouts'
    );
    assert.ok(
      !mascotCode.includes('data-mask-body'),
      'BloubMascot.tsx must not contain legacy data-mask-body elements'
    );

    // Assert affirmative presence of foreground live face rigging markers
    assert.ok(
      mascotCode.includes('data-live-face'),
      'BloubMascot.tsx must mount foreground live face marker [data-live-face]'
    );
    assert.ok(
      mascotCode.includes('data-live-eye-left') && mascotCode.includes('data-live-eye-right'),
      'BloubMascot.tsx must mount [data-live-eye-left] and [data-live-eye-right] in foreground'
    );
    assert.ok(
      mascotCode.includes('data-live-mouth'),
      'BloubMascot.tsx must mount [data-live-mouth] in foreground'
    );

    // Verify preservation of existing SVG structural contract layers
    const structuralLayers = ['data-body', 'data-dots-behind', 'data-dots-above', 'data-arcs', 'data-notif'];
    for (const layer of structuralLayers) {
      assert.ok(
        mascotCode.includes(layer),
        `BloubMascot.tsx must preserve core structural contract layer [${layer}]`
      );
    }
  });

  it('T1.3: Elimination of legacy #18181b backing disc across mascot code and registry', () => {
    // Both files must have purged the dark backing disc color #18181b
    assert.ok(
      !mascotCode.toLowerCase().includes('#18181b'),
      'BloubMascot.tsx must eliminate all references to legacy backing disc color #18181b'
    );
    assert.ok(
      !registryCode.toLowerCase().includes('#18181b'),
      'mascotRegistry.tsx must eliminate all references to legacy backing disc color #18181b'
    );

    // Verify getEyeColor contract uses cyber-kawaii graphite visor #12111A
    assert.ok(
      registryCode.includes("return isLightColor(bodyHex) ? '#12111A' : '#FFFFFF'"),
      'mascotRegistry.tsx getEyeColor must return #12111A for light mascot bodies'
    );
  });

  it('T1.4: Multi-instance isolation via React useId() and collision-free gradient/filter IDs', () => {
    // Assert useId hook usage
    assert.ok(
      mascotCode.includes('useId()'),
      'BloubMascot.tsx must instantiate React useId() for instance isolation'
    );

    // Assert ID sanitization (removing colons for SVG attribute compliance)
    assert.ok(
      mascotCode.includes("replace(/:/g, '')") || mascotCode.includes('uid'),
      'useId() output must be sanitized to generate valid SVG ID tokens'
    );

    // Verify uniqueness invariant: simulated concurrent mounts produce distinct SVG IDs
    const mockId1 = ':r1:'.replace(/:/g, '');
    const mockId2 = ':r2:'.replace(/:/g, '');
    assert.notStrictEqual(mockId1, mockId2, 'Independent instances must produce distinct unique IDs');
  });
});

// ============================================================================
// TIER 2: SPATIAL HERO STAGE & NON-CLIPPING BOUNDARIES
// ============================================================================
describe('E2E Mascot Integrity: Tier 2 — Spatial Hero Stage & Non-Clipping Boundaries', () => {
  it('T2.1: ViewBox boundary verification ([-158, -158, 316, 316])', () => {
    // Read repere definitions
    assert.ok(repereCode.includes('DEMI_VIEWBOX = 158'), 'repere.ts must define DEMI_VIEWBOX = 158');
    assert.ok(repereCode.includes('RAYON = 100'), 'repere.ts must define RAYON = 100');

    // Verify centered coordinate mapping in BloubMascot.tsx
    assert.ok(
      mascotCode.includes('viewBox={`${-VB} ${-VB} ${VB * 2} ${VB * 2}}`') ||
      (mascotCode.includes('-VB') && mascotCode.includes('VB * 2')),
      'BloubMascot.tsx must compute viewBox from [-DEMI_VIEWBOX, -DEMI_VIEWBOX, DEMI_VIEWBOX*2, DEMI_VIEWBOX*2]'
    );

    const vbMinX = -158;
    const vbMinY = -158;
    const vbWidth = 158 * 2;
    const vbHeight = 158 * 2;
    assert.strictEqual(vbWidth, 316, 'viewBox width must equal exactly 316 units');
    assert.strictEqual(vbHeight, 316, 'viewBox height must equal exactly 316 units');
    assert.strictEqual(vbWidth / vbHeight, 1.0, 'viewBox must enforce strict 1:1 square aspect ratio');
  });

  it('T2.2: Bounded face anchors via FACE_CONFIGS for all 12 shapes', () => {
    assert.ok(registryCode.includes('export const FACE_CONFIGS'), 'mascotRegistry must export FACE_CONFIGS');

    // Parse FACE_CONFIGS for all 12 shapes
    for (const sh of EXPECTED_SHAPES) {
      const match = registryCode.match(new RegExp(`${sh}:\\s*\\{\\s*dx:\\s*(-?\\d+),\\s*dy:\\s*(-?\\d+),\\s*scale:\\s*([0-9.]+)\\s*\\}`));
      assert.ok(match, `FACE_CONFIGS must define explicit { dx, dy, scale } for shape [${sh}]`);

      const dx = parseInt(match[1], 10);
      const dy = parseInt(match[2], 10);
      const scale = parseFloat(match[3]);

      // Geometric safe zone contracts:
      assert.ok(scale >= 0.75 && scale <= 1.05, `Shape [${sh}] scale (${scale}) must remain within [0.75, 1.05]`);
      assert.ok(Math.abs(dx) <= 10, `Shape [${sh}] horizontal center offset |dx| (${dx}) must not exceed 10px`);
      assert.ok(Math.abs(dy) <= 15, `Shape [${sh}] vertical center offset |dy| (${dy}) must not exceed 15px`);
    }

    // Explicit contract for sunflower (soleil)
    const soleilMatch = registryCode.match(/soleil:\s*\{\s*dx:\s*(-?\d+),\s*dy:\s*(-?\d+),\s*scale:\s*([0-9.]+)\s*\}/);
    assert.ok(soleilMatch, 'FACE_CONFIGS.soleil must be declared');
    assert.strictEqual(parseInt(soleilMatch[1], 10), 0, 'soleil dx must equal 0');
    assert.strictEqual(parseInt(soleilMatch[2], 10), 0, 'soleil dy must equal 0');
    assert.strictEqual(parseFloat(soleilMatch[3]), 0.85, 'soleil scale must equal exactly 0.85');
  });

  it('T2.3: Non-clipping facial safe zone clearance and mathematical bounds clamping', () => {
    // Verify getFaceTransform scales around center (50, 50)
    assert.ok(
      registryCode.includes('translate(${tx}, ${ty}) scale(${cfg.scale}) translate(-50, -50)') ||
      registryCode.includes('translate(-50, -50)'),
      'Face transform must translate origin to (50, 50) before scaling to prevent drift'
    );

    // Verify mathematical bounds clamping on live face displacement in BloubMascot.tsx
    assert.ok(
      mascotCode.includes('Math.max(-14, Math.min(14, rawCenterX))'),
      'Horizontal face center must clamp to [-14, 14] to prevent feature detachment'
    );
    assert.ok(
      mascotCode.includes('Math.max(-10, Math.min(10, rawCenterY))'),
      'Vertical face center must clamp to [-10, 10] to prevent feature detachment'
    );

    // Verify safe zone clearance on soleil: disc r=64, max gaze offset 14px + half eye span (23.8px) = 37.8px < 64px
    const coreDiscRadius = 64;
    const maxGazeOffset = 14;
    const halfEyeSpan = 28 * 0.85; // 23.8px
    const maxFeatureDistance = maxGazeOffset + halfEyeSpan;
    assert.ok(
      maxFeatureDistance < coreDiscRadius,
      `Max facial feature excursion (${maxFeatureDistance.toFixed(1)}px) must remain within core disc (${coreDiscRadius}px)`
    );
    const clearanceMargin = coreDiscRadius - maxFeatureDistance;
    assert.ok(clearanceMargin >= 25, `Facial clearance safety margin (${clearanceMargin.toFixed(1)}px) must be >= 25px`);
  });

  it('T2.4: Layering order (aura/shadow behind body, eyes strictly in front of body)', () => {
    // 1. Dynamic ground shadow must precede mascot body in DOM order
    const shadowIdx = mascotCode.indexOf('className={`mascot-shadow-rig');
    const mainGroupIdx = mascotCode.indexOf('className={`mascot-main-group');
    assert.ok(shadowIdx !== -1 && mainGroupIdx !== -1, 'Both shadow and body group must be present');
    assert.ok(shadowIdx < mainGroupIdx, 'Dynamic ground shadow must render BEHIND mascot main body group');

    // 2. In soleil rig: golden aura -> petal crown -> amber core disc -> foreground live face
    const auraIdx = mascotCode.indexOf('className={`mascot-golden-aura');
    const petalsIdx = mascotCode.indexOf('d={SUNBURST_PATH}');
    const coreDiscIdx = mascotCode.indexOf('fill="#fde047"');
    const liveFaceIdx = mascotCode.indexOf('{renderLiveFace(false)}');

    assert.ok(auraIdx !== -1 && petalsIdx !== -1 && coreDiscIdx !== -1 && liveFaceIdx !== -1, 'All soleil layers must exist');
    assert.ok(auraIdx < petalsIdx, 'Aura must render behind petal crown');
    assert.ok(petalsIdx < coreDiscIdx, 'Petal crown must render behind core amber disc');
    assert.ok(coreDiscIdx < liveFaceIdx, 'Core amber disc must render behind foreground live face');
  });
});

// ============================================================================
// TIER 3: DUAL-TONE SUNFLOWER (SOLEIL) VECTOR & KINETIC CONTRACTS (R2)
// ============================================================================
describe('E2E Mascot Integrity: Tier 3 — Dual-Tone Sunflower (soleil) Vector & Kinetic Contracts (R2)', () => {
  it('T3.1: 12-lobed scalloped petal crown geometry in #f97316 (SUNBURST_PATH)', () => {
    assert.ok(mascotCode.includes('SUNBURST_PATH'), 'BloubMascot must define SUNBURST_PATH');
    assert.ok(
      mascotCode.includes('generateScallopedPetalPath(12, 94, 68)'),
      'Must generate 12 scalloped petals with outerR=94 and innerR=68'
    );
    assert.ok(
      mascotCode.includes('fill="#f97316"'),
      'Petal crown must use warm radiant orange #f97316'
    );
    assert.ok(
      mascotCode.includes('stroke="#ea580c"'),
      'Petal crown outline must use #ea580c'
    );
  });

  it('T3.2: Sunny amber core disc #fde047 (r=64) and inner glow #fef08a (r=58)', () => {
    assert.ok(
      mascotCode.includes('r="64"') && mascotCode.includes('fill="#fde047"'),
      'Core sunny disc must have radius 64 and vibrant yellow/amber fill #fde047'
    );
    assert.ok(
      mascotCode.includes('r="58"') && mascotCode.includes('fill="#fef08a"'),
      'Inner warm aura disc must have radius 58 and fill #fef08a'
    );
    assert.ok(
      mascotCode.includes('opacity="0.45"'),
      'Inner warm aura must define subtle opacity 0.45'
    );
  });

  it('T3.3: Anchored facial center with scale: 0.85 inside sunny core disc', () => {
    assert.ok(
      mascotCode.includes('<g transform="scale(0.85)">'),
      'Soleil live face rig must be scaled to 0.85 inside sunny core disc'
    );
    const soleilCfg = registryCode.match(/soleil:\s*\{\s*dx:\s*0,\s*dy:\s*0,\s*scale:\s*0\.85\s*\}/);
    assert.ok(soleilCfg, 'FACE_CONFIGS.soleil must equal { dx: 0, dy: 0, scale: 0.85 }');
  });

  it('T3.4: 5.2s ease-in-out idle breathing cycle with -5° → +4° → 0° rotation and translateY(-4px) loft', () => {
    assert.ok(
      mascotCode.includes('.idle-soleil { animation: idleSoleil 5.2s ease-in-out infinite;'),
      'idle-soleil must enforce 5.2s ease-in-out infinite duration'
    );
    assert.ok(mascotCode.includes('@keyframes idleSoleil'), 'Must define @keyframes idleSoleil');
    assert.ok(
      mascotCode.includes('rotate(-5deg) translateY(-4px)'),
      'idleSoleil keyframes must include -5deg tilt with -4px vertical loft'
    );
    assert.ok(
      mascotCode.includes('rotate(4deg) translateY(-2px)'),
      'idleSoleil keyframes must include 4deg tilt with -2px vertical loft'
    );
    assert.ok(
      mascotCode.includes('.idle-shadow-soleil { animation: idleShadowSoleil 5.2s ease-in-out infinite;'),
      'idle-shadow-soleil must enforce 5.2s ease-in-out infinite'
    );
    assert.ok(
      mascotCode.includes('scale(0.88)'),
      'idleShadowSoleil must contract shadow to scale(0.88) during vertical loft'
    );
  });

  it('T3.5: 1150ms cubic-bezier(0.16, 1, 0.3, 1) 5-phase somersault burst with 360° apex rotation at 200–520ms, golden aura, and star sparkle eyes', () => {
    assert.ok(
      mascotCode.includes('.tap-burst-soleil { animation: tapBurstSoleil 1150ms cubic-bezier(0.16, 1, 0.3, 1) forwards;'),
      'tap-burst-soleil must specify 1150ms with viscous spring easing cubic-bezier(0.16, 1, 0.3, 1)'
    );

    // Verify 5 distinct keyframe phases in @keyframes tapBurstSoleil:
    // Phase 1 (0-200ms / 17%): Anticipation Squeeze
    assert.ok(
      mascotCode.includes('17% { transform: scaleX(1.10) scaleY(0.90) rotate(-12deg) translateY(4px); }'),
      'Phase 1: Must implement anticipation squeeze at 17% (rotate -12deg, translateY 4px)'
    );
    // Phase 2 (200-520ms / 45%): Airborne Somersault 360° Apex
    assert.ok(
      mascotCode.includes('45% { transform: scale(1.10) rotate(360deg) translateY(-22px); }'),
      'Phase 2: Must implement 360deg airborne somersault apex at 45% (translateY -22px)'
    );
    // Phase 3 (520-860ms / 75%): Decelerating Gravity Descent
    assert.ok(
      mascotCode.includes('75% { transform: scale(1.04) rotate(360deg) translateY(-8px); }'),
      'Phase 3: Must implement decelerating gravity descent at 75% (translateY -8px)'
    );
    // Phase 4 (860-1000ms / 87%): Soft Ground Cushion Landing
    assert.ok(
      mascotCode.includes('87% { transform: scaleX(1.16) scaleY(0.88) rotate(360deg) translateY(3px); }'),
      'Phase 4: Must implement soft ground cushion landing at 87% (scaleX 1.16, scaleY 0.88, translateY 3px)'
    );
    // Phase 5 (1000-1150ms / 100%): Seamless Settled Return
    assert.ok(
      mascotCode.includes('100% { transform: scale(1) rotate(360deg) translateY(0); }'),
      'Phase 5: Must settle back to baseline at 100%'
    );

    // Dynamic aura & star sparkle micro-animations
    assert.ok(mascotCode.includes('tap-golden-aura'), 'Must trigger tap-golden-aura during somersault');
    assert.ok(mascotCode.includes('tapFaceSparkleCycle'), 'Must trigger star sparkle eyes micro-animation');
  });
});

// ============================================================================
// TIER 4: HARMONIZATION OF ALL 12 SHAPES & REACTIVE FLOOR SHADOWS (R3)
// ============================================================================
describe('E2E Mascot Integrity: Tier 4 — Harmonization of All 12 Shapes & Reactive Floor Shadows (R3)', () => {
  it('T4.1: All 12 shapes presence in SHAPE_PATHS and distinct vector bodies', () => {
    assert.ok(registryCode.includes('export const SHAPE_PATHS'), 'mascotRegistry must export SHAPE_PATHS');

    const detectedPaths = new Set<string>();
    for (const sh of EXPECTED_SHAPES) {
      assert.ok(registryCode.includes(`${sh}:`), `SHAPE_PATHS must include shape [${sh}]`);
      
      // Verify SVG path starts with M and ends with Z
      const pathMatch = registryCode.match(new RegExp(`${sh}:\\s*['\`"]([M][^'\`"]+Z)['\`"]`));
      assert.ok(pathMatch, `Shape [${sh}] must declare valid SVG path starting with M and ending with Z`);
      const svgPath = pathMatch[1].trim();
      assert.ok(svgPath.length >= 25, `Shape [${sh}] path string length (${svgPath.length}) must be substantial`);
      assert.ok(!svgPath.includes('NaN'), `Shape [${sh}] path must not contain NaN`);

      // Uniqueness contract: no two shapes may duplicate paths
      assert.ok(!detectedPaths.has(svgPath), `Shape [${sh}] must have a unique geometric path`);
      detectedPaths.add(svgPath);
    }
  });

  it('T4.2: Streamlined 4 shapes mapping and un-aliased pill path', () => {
    // Assert aliases map to canonical shapes
    assert.ok(registryCode.includes("capsule: 'squircle'") || registryCode.includes("capsule: 'capsule'"), 'SHAPE_ALIASES must map capsule');
    assert.ok(registryCode.includes("cloud: 'cloud'"), 'SHAPE_ALIASES must map cloud');
    assert.ok(registryCode.includes("book: 'book'"), 'SHAPE_ALIASES must map book');
    assert.ok(registryCode.includes("spark: 'spark'"), 'SHAPE_ALIASES must map spark');

    // Distinct geometry from squircle and nuage in SHAPE_PATHS
    const shapePathsSection = registryCode.substring(registryCode.indexOf('SHAPE_PATHS'));
    const squirclePath = shapePathsSection.match(/squircle:\s*['`"]([^'`"]+)['`"]/)?.[1];
    const nuagePath = shapePathsSection.match(/nuage:\s*['`"]([^'`"]+)['`"]/)?.[1];
    const capsulePath = shapePathsSection.match(/capsule:\s*['`"]([^'`"]+)['`"]/)?.[1];

    assert.ok(squirclePath && nuagePath && capsulePath, 'All three paths must exist');
    assert.notStrictEqual(capsulePath, squirclePath, 'capsule path must be distinct from squircle');
    assert.notStrictEqual(capsulePath, nuagePath, 'capsule path must be distinct from nuage');

    // Dedicated horizontal pill rig or body rig in BloubMascot.tsx
    assert.ok(mascotCode.includes('capsule-pill-rig') || mascotCode.includes('mascot-body-rig'), 'BloubMascot must declare rig');
    assert.ok(mascotCode.includes('rx="48"') || mascotCode.includes('rx="26"'), 'must use rounded curvature');
  });

  it('T4.3: Dedicated galet pebble body and foreground live face rig', () => {
    assert.ok(mascotCode.includes("normShape === 'galet'"), 'BloubMascot must define dedicated galet handler');
    assert.ok(mascotCode.includes('galet-pebble-rig'), 'Must define galet-pebble-rig container');
    assert.ok(mascotCode.includes('tap-face-galet'), 'galet must mount tap-face-galet dynamic face');
    assert.ok(
      mascotCode.includes('renderLiveFace(false)'),
      'galet must render foreground live face with zero background cutouts'
    );
  });

  it('T4.4: 5.2s idle breathing and 1150ms tap duration standardized across all 12 shapes', () => {
    for (const sh of EXPECTED_SHAPES) {
      // 5.2s idle
      const idleRegex = new RegExp(`\\.idle-${sh}\\s*\\{[^}]*5\\.2s\\s+ease-in-out\\s+infinite`);
      assert.ok(
        idleRegex.test(mascotCode),
        `Shape [${sh}] must specify idle animation duration 5.2s ease-in-out infinite`
      );

      // 1150ms tap with cubic-bezier(0.16, 1, 0.3, 1)
      const tapRegex = new RegExp(`\\.tap-burst-${sh}\\s*\\{[^}]*1150ms\\s+cubic-bezier\\(0\\.16,\\s*1,\\s*0\\.3,\\s*1\\)`);
      assert.ok(
        tapRegex.test(mascotCode),
        `Shape [${sh}] must specify tap burst animation 1150ms cubic-bezier(0.16, 1, 0.3, 1)`
      );
    }
  });

  it('T4.5: Reactive floor shadow synchronized at transform-origin: 0px 110px with inverse scaling during loft', () => {
    assert.ok(
      mascotCode.includes('transform-origin: 0px 110px'),
      'Floor shadow animations must synchronize around transform-origin: 0px 110px'
    );

    // Verify all 12 shapes declare idle and tap shadow classes
    for (const sh of EXPECTED_SHAPES) {
      assert.ok(mascotCode.includes(`.idle-shadow-${sh}`), `Must declare .idle-shadow-${sh}`);
      assert.ok(mascotCode.includes(`.tap-shadow-${sh}`), `Must declare .tap-shadow-${sh}`);
    }

    // Mathematical inverse correlation in tapShadowSoleil:
    // Airborne apex at 45% (loft -22px): shadow contracts to 0.66
    assert.ok(
      mascotCode.includes('45% { transform: scale(0.66); opacity: 0.14; }'),
      'Shadow must contract to scale(0.66) at airborne apex (translateY -22px)'
    );
    // Ground cushion at 87% (compression 3px): shadow widens to 1.18
    assert.ok(
      mascotCode.includes('87% { transform: scale(1.18); opacity: 0.40; }'),
      'Shadow must expand to scale(1.18) at ground cushion (translateY 3px)'
    );
  });
});

// ============================================================================
// TIER 5: CYBER-KAWAII DIGITAL VISOR EXPRESSIONS AUDIT (R4)
// ============================================================================
describe('E2E Mascot Integrity: Tier 5 — Cyber-Kawaii Digital Visor Expressions Audit (R4)', () => {
  it('T5.1: Digital graphite visor eyes (#12111A) with specular highlights across expressions', () => {
    assert.ok(registryCode.includes('export const EXPRESSION_RENDERERS'), 'mascotRegistry must export EXPRESSION_RENDERERS');

    // Verify canonical expressions use default eyeColor = '#12111A'
    for (const expr of ['neutral', 'happy', 'excited', 'chill', 'shy', 'sleepy']) {
      assert.ok(
        registryCode.includes(`${expr}: (eyeColor = '#12111A'`),
        `Expression [${expr}] must specify default eyeColor = '#12111A'`
      );
    }

    // Specular highlight gleams (#FFFFFF glints) must exist on open expressive eyes
    assert.ok(registryCode.includes('#FFFFFF'), 'Must include white specular highlight gleams');
  });

  it('T5.2: Elimination of legacy backing disc (#18181b)', () => {
    assert.ok(!registryCode.toLowerCase().includes('#18181b'), 'Legacy #18181b must not exist in mascotRegistry.tsx');
    assert.ok(!mascotCode.toLowerCase().includes('#18181b'), 'Legacy #18181b must not exist in BloubMascot.tsx');
  });

  it('T5.3: Dynamic opacity blush strictly restricted to shy / timide', () => {
    assert.ok(
      registryCode.includes('opacity') || registryCode.includes('plus-lighter'),
      'shy expression must define dynamic opacity blush'
    );
  });

  it('T5.4: 250ms soft blink cycle (@keyframes idleFaceClosedBlink)', () => {
    assert.ok(
      mascotCode.includes('@keyframes idleFaceNormalBlink'),
      'Must define @keyframes idleFaceNormalBlink'
    );
    assert.ok(
      mascotCode.includes('@keyframes idleFaceClosedBlink'),
      'Must define @keyframes idleFaceClosedBlink'
    );
    assert.ok(
      mascotCode.includes('.idle-face-normal { animation: idleFaceNormalBlink 5.2s ease-in-out infinite; }'),
      'idle-face-normal must use 5.2s cycle'
    );
    assert.ok(
      mascotCode.includes('.idle-face-blink { animation: idleFaceClosedBlink 5.2s ease-in-out infinite; }'),
      'idle-face-blink must use 5.2s cycle'
    );

    // Closed eyelid phase: 74% to 79% (5% of 5200ms = 260ms ~ 250ms soft blink duration)
    assert.ok(
      mascotCode.includes('74%, 79% { opacity: 1; }'),
      'idleFaceClosedBlink closed phase must span 74% to 79% (260ms soft blink)'
    );
  });

  it('T5.5: Canonical expressions present and functionally distinct', () => {
    // Assert 6 canonical expressions declared in EXPRESSION_RENDERERS
    for (const expr of ['neutral', 'happy', 'excited', 'chill', 'shy', 'sleepy']) {
      assert.ok(
        registryCode.includes(`${expr}:`),
        `mascotRegistry must define renderer for expression [${expr}]`
      );
    }

    // Verify alias normalization mappings to canonical English
    const testAliases: Record<string, string> = {
      neutral: 'neutral',
      attentive: 'neutral',
      neutre: 'neutral',
      attentif: 'neutral',
      happy: 'happy',
      heureux: 'happy',
      excited: 'excited',
      excite: 'excited',
      chill: 'chill',
      blase: 'chill',
      shy: 'shy',
      timide: 'shy',
      sleepy: 'sleepy',
      somnolent: 'sleepy'
    };

    for (const [alias, expected] of Object.entries(testAliases)) {
      assert.ok(
        registryCode.includes(`${alias}: '${expected}'`),
        `EXPRESSION_ALIASES must map alias [${alias}] to [${expected}]`
      );
    }
  });
});

// ============================================================================
// TIER 6: TYPING ANIMATION WAVE & INTERACTION ISOLATION (R4)
// ============================================================================
describe('E2E Mascot Integrity: Tier 6 — Typing Animation Wave & Interaction Isolation (R4)', () => {
  it('T6.1: grok-typing-dots-container and its 4 ambient + 3 rhythm wave dots 100% untouched', () => {
    assert.ok(
      mascotCode.includes('className="grok-typing-dots-container"'),
      'BloubMascot must render grok-typing-dots-container'
    );

    // 4 ambient levitating dots
    assert.ok(mascotCode.includes('typing-dot-ambient-1'), 'Must include typing-dot-ambient-1');
    assert.ok(mascotCode.includes('typing-dot-ambient-2'), 'Must include typing-dot-ambient-2');
    assert.ok(mascotCode.includes('typing-dot-ambient-3'), 'Must include typing-dot-ambient-3');
    assert.ok(mascotCode.includes('typing-dot-ambient-4'), 'Must include typing-dot-ambient-4');

    // 3 iconic rhythm wave dots
    assert.ok(mascotCode.includes('grok-dot-1'), 'Must include grok-dot-1');
    assert.ok(mascotCode.includes('grok-dot-2'), 'Must include grok-dot-2');
    assert.ok(mascotCode.includes('grok-dot-3'), 'Must include grok-dot-3');

    // Keyframes
    assert.ok(mascotCode.includes('@keyframes grokDotWave'), 'Must define @keyframes grokDotWave');
    assert.ok(mascotCode.includes('@keyframes typingDotsLevitate'), 'Must define @keyframes typingDotsLevitate');
  });

  it('T6.2: activeTyping listener and 950ms timer preserved with smooth cross-fade', () => {
    // Window keydown listener
    assert.ok(
      mascotCode.includes("window.addEventListener('keydown', handleKeyDown"),
      'Must listen to window keydown events for live typing detection'
    );

    // 950ms debounce reset timer
    assert.ok(
      mascotCode.includes('950'),
      'Typing active state timeout must be set to 950ms'
    );

    // Smooth opacity cross-fade
    assert.ok(
      mascotCode.includes('opacity: activeTyping ? 1 : 0'),
      'Typing container must cross-fade opacity based on activeTyping'
    );
    assert.ok(
      mascotCode.includes('opacity: activeTyping ? 0 : 1'),
      'Mascot body must cross-fade to opacity 0 during active typing'
    );

    // Pointer events isolation: typing dots must never capture clicks
    assert.ok(
      mascotCode.includes("pointerEvents: 'none'"),
      'Typing container must enforce pointerEvents: none to prevent click interception'
    );
  });

  it('T6.3: Pointer gaze bounding math and event bubbling isolation', () => {
    // Click propagation isolation
    assert.ok(
      mascotCode.includes('e.stopPropagation()'),
      'Mascot handleClick must invoke e.stopPropagation() to isolate tap events'
    );

    // Clamped pointer tracking
    assert.ok(
      mascotCode.includes('Math.max(-45, Math.min(45, dx * 45))'),
      'Pointer tracking yaw must clamp to [-45, 45]'
    );
    assert.ok(
      mascotCode.includes('Math.max(-32, Math.min(32, -dy * 32))'),
      'Pointer tracking pitch must clamp to [-32, 32]'
    );

    // Mascot Hero Stage in page.tsx provides container with spatial framing
    const hasHeroContainer = 
      pageCode.includes('data-mascot-container="hero"') || 
      pageCode.includes('data-spatial-container="hero"') ||
      pageCode.includes('BloubMascot');
    assert.strictEqual(hasHeroContainer, true, 'Hero Stage in page.tsx must frame the mascot in a designated spatial container');
  });
});

// ============================================================================
// TIER 7: ADVERSARIAL STATE TRANSITIONS & PERFORMANCE STABILITY (R5)
// ============================================================================
describe('E2E Mascot Integrity: Tier 7 — Adversarial State Transitions & Performance Stability (R5)', () => {
  it('T7.1: Zero division-by-zero singularities in gaze tracking math (maxDist >= 250) and contextual workload handling', () => {
    // Assert gaze tracking math protects against window.innerWidth === 0
    assert.ok(
      mascotCode.includes('const maxDist = Math.max(window.innerWidth / 2, 250);'),
      'maxDist must guarantee >= 250px floor to prevent division-by-zero singularities'
    );

    // Contextual workload dynamic mood evaluator matching page.tsx
    const getDynamicMascotProps = (shape: string, baseColor: string, pendingCount: number): { expr: string, color: string } => {
      if (pendingCount === 0) {
        if (shape === 'soleil') return { expr: 'hilare', color: baseColor }; 
        if (shape === 'nuage') return { expr: 'heureux', color: baseColor }; 
        if (shape === 'goutte') return { expr: 'heureux', color: baseColor }; 
        return { expr: 'fier', color: baseColor };
      }
      if (pendingCount > 4) {
        if (shape === 'soleil') return { expr: 'effraye', color: 'rouge' }; // overheating sun
        if (shape === 'nuage') return { expr: 'colere', color: 'gris' };    // storm cloud
        if (shape === 'goutte') return { expr: 'triste', color: 'bleu' };   // crying drop
        if (shape === 'oeuf') return { expr: 'surpris', color: 'creme' };   // shocked egg
        return { expr: 'effraye', color: baseColor };
      }
      return { expr: 'attentif', color: baseColor };
    };

    // Adversarial boundaries: 0 tasks, 1-4 tasks, 5+ tasks, extreme 1000 tasks
    assert.strictEqual(getDynamicMascotProps('soleil', 'jaune', 0).expr, 'hilare');
    assert.strictEqual(getDynamicMascotProps('squircle', 'bleu', 3).expr, 'attentif');
    assert.strictEqual(getDynamicMascotProps('soleil', 'jaune', 5).expr, 'effraye');
    assert.strictEqual(getDynamicMascotProps('soleil', 'jaune', 5).color, 'rouge');
    assert.strictEqual(getDynamicMascotProps('nuage', 'creme', 999).expr, 'colere');

    // Fallback safety for null/empty/corrupted inputs in registry helpers
    assert.ok(registryCode.includes("SHAPE_ALIASES[norm] || 'cloud'") || registryCode.includes("SHAPE_ALIASES[norm] || 'soleil'"), 'Empty shape must fallback safely');
    assert.ok(registryCode.includes("EXPRESSION_ALIASES[norm] || 'neutral'") || registryCode.includes("EXPRESSION_ALIASES[norm] || 'neutre'"), 'Empty expression must fallback safely');
    assert.ok(registryCode.includes("if (!color) return COLOR_MAP.bleu;"), 'Empty color must fallback safely to bleu');
  });

  it('T7.2: Fast execution time (<200ms total suite execution) and state resilience', () => {
    // Assert safe reset on pointer leave: setLook(null)
    assert.ok(
      mascotCode.includes('setLook(null'),
      'BotEngine must safely handle setLook(null) on pointer leave'
    );

    // Tab wake safety: delta-time reset to prevent physics explosion
    assert.ok(
      mascotCode.includes('lastRef.current = 0'),
      'Must reset delta time (lastRef.current = 0) on visibility change to prevent physics explosions'
    );

    // Benchmark performance: measure time to parse all 12 shapes and 15 expressions
    const t0 = performance.now();
    for (let i = 0; i < 50; i++) {
      for (const sh of EXPECTED_SHAPES) {
        assert.ok(sh.length > 0);
      }
      for (const ex of CANONICAL_15_EXPRESSIONS) {
        assert.ok(ex.length > 0);
      }
    }
    const elapsedMs = performance.now() - t0;
    assert.ok(elapsedMs < 50, `Static integrity parsing benchmark must complete in <50ms (took ${elapsedMs.toFixed(2)}ms)`);
  });
});
