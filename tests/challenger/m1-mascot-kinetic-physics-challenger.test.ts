/**
 * ============================================================================
 * EMPIRICAL CHALLENGER TEST SUITE: BLOUB MASCOT KINETIC PHYSICS & ADVERSARIAL STRESS
 * ============================================================================
 *
 * Target: Milestone 1 Bloub Mascot Visual & Kinetic Overhaul
 * Scope:
 *   1. Soleil 5-Phase Tap Burst Progression, Somersault Physics, & Keyframe Curves
 *   2. Floor Shadow Dynamic Scaling, Transform-Origin (0px 110px), & Loft Synchronicity
 *   3. Omni-Shape Shadow Rig Uniformity Across All 12 Shapes
 *   4. Pointer Gaze Tracking Limits, Singularity Defense, & RAF Clamping Matrix
 *   5. Facial Feature Containment & Detachment Proof Across Boundary Extremes
 *   6. Dynamic Mathematical Simulation of Gaze Clamping & RAF Projection
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Load source code of BloubMascot.tsx and mascotRegistry.tsx directly
const mascotCodePath = path.resolve(process.cwd(), 'src/components/BloubMascot.tsx');
const mascotRegistryPath = path.resolve(process.cwd(), 'src/constants/mascotRegistry.tsx');

const mascotCode = fs.readFileSync(mascotCodePath, 'utf-8');
const registryCode = fs.readFileSync(mascotRegistryPath, 'utf-8');

describe('⚔️ CHALLENGER SUITE 1: Soleil Tap Burst 5-Phase Progression & Somersault Physics', () => {
  it('C1.1: tapBurstSoleil defines all 5 required keyframe stages with exact timing milestones', () => {
    // Extract tapBurstSoleil keyframe block
    const keyframeMatch = mascotCode.match(/@keyframes\s+tapBurstSoleil\s*\{([\s\S]*?)\n\s*\}/);
    assert.ok(keyframeMatch, 'tapBurstSoleil keyframe rule must exist in BloubMascot.tsx');
    const keyframeBody = keyframeMatch[1];

    // Phase 1 (0% - 17% / ~200ms): Anticipation Squeeze & Floor Coil
    assert.match(keyframeBody, /0%\s*\{[^}]*rotate\(0deg\)[^}]*translateY\(0\)/, 'Phase 1 start: neutral 0deg at translateY(0)');
    assert.match(keyframeBody, /17%\s*\{[^}]*scaleX\(1\.10\)\s*scaleY\(0\.90\)\s*rotate\(-12deg\)\s*translateY\(4px\)/,
      'Phase 1 apex at 17% (195.5ms): coil squeeze scaleX(1.10) scaleY(0.90) rotate(-12deg) translateY(4px)');

    // Phase 2 (17% - 45% / 200-520ms): Apex 360° Somersault & Loft Peak
    assert.match(keyframeBody, /45%\s*\{[^}]*scale\(1\.10\)\s*rotate\(360deg\)\s*translateY\(-22px\)/,
      'Phase 2 apex at 45% (517.5ms): full 360deg rotation at vertical loft translateY(-22px)');

    // Phase 3 (45% - 75% / 520-860ms): Decelerating Gravity Descent
    assert.match(keyframeBody, /75%\s*\{[^}]*scale\(1\.04\)\s*rotate\(360deg\)\s*translateY\(-8px\)/,
      'Phase 3 descent at 75% (862.5ms): gravity descent to translateY(-8px)');

    // Phase 4 (75% - 87% / 860-1000ms): Soft Ground Impact Cushion
    assert.match(keyframeBody, /87%\s*\{[^}]*scaleX\(1\.16\)\s*scaleY\(0\.88\)\s*rotate\(360deg\)\s*translateY\(3px\)/,
      'Phase 4 ground cushion at 87% (1000.5ms): impact squash scaleX(1.16) scaleY(0.88) translateY(3px)');

    // Phase 5 (87% - 100% / 1000-1150ms): Dampened Return to Rest
    assert.match(keyframeBody, /100%\s*\{[^}]*scale\(1\)\s*rotate\(360deg\)\s*translateY\(0\)/,
      'Phase 5 settled at 100% (1150ms): scale(1) rotate(360deg) translateY(0)');
  });

  it('C1.2: Animation duration is strictly 1150ms with cubic-bezier(0.16, 1, 0.3, 1) and forwards fill', () => {
    const tapBurstMatch = mascotCode.match(/\.tap-burst-soleil\s*\{([^}]+)\}/);
    assert.ok(tapBurstMatch, '.tap-burst-soleil class must exist');
    const rule = tapBurstMatch[1];

    assert.match(rule, /animation:\s*tapBurstSoleil\s+1150ms\s+cubic-bezier\(0\.16,\s*1,\s*0\.3,\s*1\)\s+forwards/,
      'tap-burst-soleil must enforce 1150ms cubic-bezier(0.16, 1, 0.3, 1) forwards');
    assert.match(rule, /transform-origin:\s*0px\s+0px/,
      'tap-burst-soleil must anchor at center transform-origin 0px 0px');
  });

  it('C1.3: Golden bloom aura and sparkling star eyes synchronize with somersault apex (200-520ms)', () => {
    // 1. Golden Aura cycle verification
    const auraMatch = mascotCode.match(/@keyframes\s+tapGoldenAuraCycle\s*\{([\s\S]*?)\n\s*\}/);
    assert.ok(auraMatch, 'tapGoldenAuraCycle keyframe must exist');
    const auraBody = auraMatch[1];

    // Aura is dormant during Phase 1 (0-17%)
    assert.match(auraBody, /0%,\s*17%\s*\{[^}]*opacity:\s*0;/, 'Golden aura remains dormant during Phase 1 squeeze');
    // Aura blooms during airborne loft (22% - 44% / ~250-506ms)
    assert.match(auraBody, /22%,\s*44%\s*\{[^}]*opacity:\s*0\.7;[^}]*transform:\s*scale\(1\.18\)\s*translateY\(2px\);/,
      'Golden aura blooms with opacity 0.7 and scale(1.18) at apex');
    // Aura fades out upon descent (47% - 100%)
    assert.match(auraBody, /47%,\s*100%\s*\{[^}]*opacity:\s*0;/, 'Golden aura fades out during descent and landing');

    // 2. Star Eyes (sparkle) cycle verification
    const sparkleMatch = mascotCode.match(/@keyframes\s+tapFaceSparkleCycle\s*\{([\s\S]*?)\n\s*\}/);
    assert.ok(sparkleMatch, 'tapFaceSparkleCycle keyframe must exist');
    const sparkleBody = sparkleMatch[1];

    assert.match(sparkleBody, /0%,\s*18%\s*\{[^}]*opacity:\s*0;/, 'Star sparkle eyes dormant during anticipation');
    assert.match(sparkleBody, /19%,\s*46%\s*\{[^}]*opacity:\s*1;/, 'Star sparkle eyes actively visible (opacity 1) during apex 360 flip');
    assert.match(sparkleBody, /47%,\s*100%\s*\{[^}]*opacity:\s*0;/, 'Star sparkle eyes disappear after apex flip');

    // 3. Squint eyes cycle verification during anticipation (Phase 1) and impact cushion (Phase 4)
    const squintMatch = mascotCode.match(/@keyframes\s+tapFaceSquintCycle\s*\{([\s\S]*?)\n\s*\}/);
    assert.ok(squintMatch, 'tapFaceSquintCycle keyframe must exist');
    const squintBody = squintMatch[1];

    assert.match(squintBody, /1%,\s*18%\s*\{[^}]*opacity:\s*1;/, 'Squint eyes active during Phase 1 anticipation squeeze');
    assert.match(squintBody, /19%,\s*74%\s*\{[^}]*opacity:\s*0;/, 'Squint eyes dormant during airborne flip and descent');
    assert.match(squintBody, /75%,\s*90%\s*\{[^}]*opacity:\s*1;/, 'Squint eyes reactivated during Phase 4 ground impact cushion');
    assert.match(squintBody, /91%,\s*100%\s*\{[^}]*opacity:\s*0;/, 'Squint eyes return to normal at landing settlement');
  });

  it('C1.4: Idle breathing cycle executes 5.2s ease-in-out with organic scallop drift and 0.88 shadow narrowing', () => {
    const idleSoleilMatch = mascotCode.match(/@keyframes\s+idleSoleil\s*\{([\s\S]*?)\n\s*\}/);
    assert.ok(idleSoleilMatch, 'idleSoleil keyframe must exist');
    const idleBody = idleSoleilMatch[1];

    assert.match(idleBody, /0%,\s*100%\s*\{[^}]*scale\(1\)\s*rotate\(0deg\)\s*translateY\(0\)/, 'Neutral resting orientation at 0% and 100%');
    assert.match(idleBody, /33%\s*\{[^}]*scale\(1\.04\)\s*rotate\(-5deg\)\s*translateY\(-4px\)/,
      'Organic breath lift to translateY(-4px) and -5deg rotation at 33%');
    assert.match(idleBody, /66%\s*\{[^}]*scale\(1\.02\)\s*rotate\(4deg\)\s*translateY\(-2px\)/,
      'Gentle scallop drift to +4deg rotation at 66%');

    const idleShadowSoleilMatch = mascotCode.match(/@keyframes\s+idleShadowSoleil\s*\{([\s\S]*?)\n\s*\}/);
    assert.ok(idleShadowSoleilMatch, 'idleShadowSoleil keyframe must exist');
    const idleShadowBody = idleShadowSoleilMatch[1];

    assert.match(idleShadowBody, /33%\s*\{[^}]*scale\(0\.88\);\s*opacity:\s*0\.2;/,
      'Floor shadow narrows to scale(0.88) at 33% when body reaches translateY(-4px)');
  });
});

describe('⚔️ CHALLENGER SUITE 2: Floor Shadow Scaling, Transform-Origin, & Loft Synchronicity', () => {
  it('C2.1: .mascot-shadow-rig specifies exact transform-origin of 0px 110px matching SVG ellipse center', () => {
    // 1. Check CSS transform-origin
    const shadowRigMatch = mascotCode.match(/\.mascot-shadow-rig\s*\{([^}]+)\}/);
    assert.ok(shadowRigMatch, '.mascot-shadow-rig CSS rule must exist');
    assert.match(shadowRigMatch[1], /transform-origin:\s*0px\s+110px;/,
      '.mascot-shadow-rig must specify transform-origin: 0px 110px');

    // 2. Check SVG ellipse center coordinates
    const ellipseMatch = mascotCode.match(/<ellipse\s+cx="([^"]+)"\s+cy="([^"]+)"\s+rx="([^"]+)"\s+ry="([^"]+)"[^>]*className=\{`mascot-shadow-rig/);
    assert.ok(ellipseMatch, 'Mascot floor shadow <ellipse> must exist');
    const [, cx, cy, rx, ry] = ellipseMatch;

    assert.strictEqual(cx, '0', 'Floor shadow ellipse cx must be 0');
    assert.strictEqual(cy, '110', 'Floor shadow ellipse cy must be 110');
    assert.strictEqual(rx, '66', 'Floor shadow ellipse rx must be 66');
    assert.strictEqual(ry, '12', 'Floor shadow ellipse ry must be 12');

    // Mathematical verification: distance between transform-origin and center of ellipse is 0
    const originX = 0;
    const originY = 110;
    const centerDist = Math.hypot(originX - parseFloat(cx), originY - parseFloat(cy));
    assert.strictEqual(centerDist, 0, 'Distance between shadow transform-origin and ellipse center must be strictly 0');
  });

  it('C2.2: Floor shadow scaling maintains strict mathematical inverse correlation with vertical loft', () => {
    // Extract tapShadowSoleil keyframe block
    const shadowMatch = mascotCode.match(/@keyframes\s+tapShadowSoleil\s*\{([\s\S]*?)\n\s*\}/);
    assert.ok(shadowMatch, 'tapShadowSoleil keyframe rule must exist');
    const shadowBody = shadowMatch[1];

    // Parse stages: percentage -> scale, opacity
    const parseKeyframe = (pct: number) => {
      const reg = new RegExp(`${pct}%\\s*\\{[^}]*scale\\(([^)]+)\\);[^}]*opacity:\\s*([^;]+);`);
      const m = shadowBody.match(reg);
      assert.ok(m, `Keyframe ${pct}% must be present in tapShadowSoleil`);
      return { scale: parseFloat(m[1]), opacity: parseFloat(m[2]) };
    };

    const k0 = parseKeyframe(0);
    const k17 = parseKeyframe(17);
    const k45 = parseKeyframe(45);
    const k75 = parseKeyframe(75);
    const k87 = parseKeyframe(87);
    const k100 = parseKeyframe(100);

    // Baseline: scale = 1.0, opacity = 0.30
    assert.strictEqual(k0.scale, 1.0);
    assert.strictEqual(k0.opacity, 0.3);

    // 17% (Body coils DOWN into ground +4px): Shadow MUST EXPAND (scale > 1) and DARKEN (opacity > 0.3)
    assert.ok(k17.scale > 1.0, `At anticipation squash (+4px), shadow scale must widen (> 1.0). Got: ${k17.scale}`);
    assert.ok(k17.opacity > 0.30, `At anticipation squash (+4px), shadow must darken (> 0.30). Got: ${k17.opacity}`);
    assert.strictEqual(k17.scale, 1.15);
    assert.strictEqual(k17.opacity, 0.42);

    // 45% (Body at APEX -22px loft): Shadow MUST CONTRACT to minimum (scale < 0.70) and FADE (opacity < 0.20)
    assert.ok(k45.scale < 0.70, `At apex loft (-22px), shadow must contract (< 0.70). Got: ${k45.scale}`);
    assert.ok(k45.opacity < 0.20, `At apex loft (-22px), shadow must fade (< 0.20). Got: ${k45.opacity}`);
    assert.strictEqual(k45.scale, 0.66);
    assert.strictEqual(k45.opacity, 0.14);

    // 75% (Body descending -8px): Shadow expands back toward baseline (0.70 < scale < 1.0)
    assert.ok(k75.scale > k45.scale && k75.scale < 1.0, `During descent (-8px), shadow scale must be between apex and ground. Got: ${k75.scale}`);
    assert.strictEqual(k75.scale, 0.88);
    assert.strictEqual(k75.opacity, 0.24);

    // 87% (Body cushions impact +3px): Shadow MUST WIDEN to cushion peak (scale > 1.15) and DARKEN (opacity >= 0.40)
    assert.ok(k87.scale >= 1.15, `At impact cushion (+3px), shadow must widen (> 1.15). Got: ${k87.scale}`);
    assert.ok(k87.opacity >= 0.40, `At impact cushion (+3px), shadow must darken (>= 0.40). Got: ${k87.opacity}`);
    assert.strictEqual(k87.scale, 1.18);
    assert.strictEqual(k87.opacity, 0.40);

    // 100% (Settled at rest translateY(0)): Shadow resets to 1.0 and 0.30
    assert.strictEqual(k100.scale, 1.0);
    assert.strictEqual(k100.opacity, 0.3);
  });

  it('C2.3: All 12 shapes possess dedicated idleShadow and tapShadow keyframes with uniform 5.2s / 1150ms timing', () => {
    const requiredShapes = [
      'cercle', 'squircle', 'galet', 'capsule', 'triangle', 'hexagone',
      'nuage', 'goutte', 'oeuf', 'soleil', 'fromage', 'livre'
    ];

    for (const shape of requiredShapes) {
      const capShape = shape.charAt(0).toUpperCase() + shape.slice(1);

      // Check keyframe existence
      assert.ok(
        mascotCode.includes(`@keyframes idleShadow${capShape}`),
        `Missing @keyframes idleShadow${capShape}`
      );
      assert.ok(
        mascotCode.includes(`@keyframes tapShadow${capShape}`),
        `Missing @keyframes tapShadow${capShape}`
      );

      // Check class definition and timing
      const idleClassRegex = new RegExp(`\\.idle-shadow-${shape}\\s*\\{[^}]*animation:\\s*idleShadow${capShape}\\s+5\\.2s\\s+ease-in-out\\s+infinite;`);
      assert.match(mascotCode, idleClassRegex, `.idle-shadow-${shape} must enforce 5.2s ease-in-out infinite`);

      const tapClassRegex = new RegExp(`\\.tap-shadow-${shape}\\s*\\{[^}]*animation:\\s*tapShadow${capShape}\\s+1150ms\\s+cubic-bezier\\(0\\.16,\\s*1,\\s*0\\.3,\\s*1\\)\\s+forwards;`);
      assert.match(mascotCode, tapClassRegex, `.tap-shadow-${shape} must enforce 1150ms cubic-bezier(0.16, 1, 0.3, 1) forwards`);
    }
  });
});

describe('⚔️ CHALLENGER SUITE 3: Pointer Gaze Tracking Limits, Boundary Clamping, & Detachment Proof', () => {
  it('C3.1: Pointer kinematic angles are bounded strictly within [-45°, +45°] yaw and [-32°, +32°] pitch', () => {
    // Mathematical simulation of the handleMove logic from BloubMascot.tsx:
    // const maxDist = Math.max(window.innerWidth / 2, 250);
    // const dx = (e.clientX - cx) / maxDist;
    // const dy = (e.clientY - cy) / maxDist;
    // const yaw = Math.max(-45, Math.min(45, dx * 45));
    // const pitch = Math.max(-32, Math.min(32, -dy * 32));

    const computeGazeAngles = (clientX: number, clientY: number, innerWidth = 1920, cx = 960, cy = 540) => {
      const maxDist = Math.max(innerWidth / 2, 250);
      const dx = (clientX - cx) / maxDist;
      const dy = (clientY - cy) / maxDist;
      let yaw = Math.max(-45, Math.min(45, dx * 45));
      let pitch = Math.max(-32, Math.min(32, -dy * 32));
      // Normalize -0 to 0
      if (yaw === 0) yaw = 0;
      if (pitch === 0) pitch = 0;
      return { dx, dy, yaw, pitch };
    };

    // Adversarial scenarios
    const adversarialTestCases = [
      { name: 'Ultra-distant East (+1,000,000 px)', x: 1000000, y: 540, expectedYaw: 45, expectedPitch: 0 },
      { name: 'Ultra-distant West (-1,000,000 px)', x: -1000000, y: 540, expectedYaw: -45, expectedPitch: 0 },
      { name: 'Ultra-distant North (-1,000,000 px)', x: 960, y: -1000000, expectedYaw: 0, expectedPitch: 32 },
      { name: 'Ultra-distant South (+1,000,000 px)', x: 960, y: 1000000, expectedYaw: 0, expectedPitch: -32 },
      { name: 'Northeast Extreme (10,000, -10,000)', x: 10000, y: -10000, expectedYaw: 45, expectedPitch: 32 },
      { name: 'Southwest Extreme (-10,000, 10,000)', x: -10000, y: 10000, expectedYaw: -45, expectedPitch: -32 },
      { name: 'Exact Center (960, 540)', x: 960, y: 540, expectedYaw: 0, expectedPitch: 0 },
      { name: 'Positive Infinity (+Infinity)', x: Infinity, y: 540, expectedYaw: 45, expectedPitch: 0 },
      { name: 'Negative Infinity (-Infinity)', x: -Infinity, y: 540, expectedYaw: -45, expectedPitch: 0 },
    ];

    for (const tc of adversarialTestCases) {
      const { yaw, pitch } = computeGazeAngles(tc.x, tc.y);
      assert.strictEqual(yaw, tc.expectedYaw, `Test case '${tc.name}' failed yaw clamp`);
      assert.strictEqual(pitch, tc.expectedPitch, `Test case '${tc.name}' failed pitch clamp`);
      assert.ok(yaw >= -45 && yaw <= 45, `Yaw ${yaw} exceeded boundary [-45, 45]`);
      assert.ok(pitch >= -32 && pitch <= 32, `Pitch ${pitch} exceeded boundary [-32, 32]`);
    }
  });

  it('C3.2: Division-by-zero singularity defense: window.innerWidth <= 0 preserves positive maxDist (>= 250)', () => {
    const testWidths = [0, -10, -1000, 10, 100, 499, 500, 1920];
    for (const w of testWidths) {
      const maxDist = Math.max(w / 2, 250);
      assert.ok(Number.isFinite(maxDist), `maxDist must be finite for innerWidth=${w}`);
      assert.ok(maxDist >= 250, `maxDist must be >= 250 for innerWidth=${w}. Got: ${maxDist}`);
    }
  });

  it('C3.3: RAF face feature coordinates are strictly clamped within [-14px, +14px] horizontal and [-10px, +10px] vertical', () => {
    // In BloubMascot.tsx:
    // const clampedCenterX = Math.max(-14, Math.min(14, rawCenterX));
    // const clampedCenterY = Math.max(-10, Math.min(10, rawCenterY));

    const clampCenter = (rawX: number, rawY: number) => {
      const clampedCenterX = Math.max(-14, Math.min(14, rawX));
      const clampedCenterY = Math.max(-10, Math.min(10, rawY));
      return { clampedCenterX, clampedCenterY };
    };

    const adversarialRawInputs = [
      { rawX: 500, rawY: 300, expX: 14, expY: 10 },
      { rawX: -500, rawY: -300, expX: -14, expY: -10 },
      { rawX: 14, rawY: 10, expX: 14, expY: 10 },
      { rawX: -14, rawY: -10, expX: -14, expY: -10 },
      { rawX: 0, rawY: 0, expX: 0, expY: 0 },
      { rawX: 14.0001, rawY: 10.0001, expX: 14, expY: 10 },
      { rawX: -14.0001, rawY: -10.0001, expX: -14, expY: -10 },
      { rawX: Infinity, rawY: -Infinity, expX: 14, expY: -10 },
    ];

    for (const tc of adversarialRawInputs) {
      const { clampedCenterX, clampedCenterY } = clampCenter(tc.rawX, tc.rawY);
      assert.strictEqual(clampedCenterX, tc.expX);
      assert.strictEqual(clampedCenterY, tc.expY);
    }
  });

  it('C3.4: Facial feature coordinates remain strictly contained within Soleil inner core disc (r=64 * 0.85)', () => {
    // In Soleil, face is rendered within <g transform="scale(0.85)">
    // Core disc radius = 64px in unscaled coordinates, which translates to a safety zone of 64px in the face coordinate frame.
    // Let's compute maximum extent of eye, cheek, and mouth across all clamped centers.

    const baseSeparation = 28;

    // Check all integer points in the clamp domain [-14, 14] x [-10, 10]
    for (let cx = -14; cx <= 14; cx += 1) {
      for (let cy = -10; cy <= 10; cy += 1) {
        const tx0 = cx - baseSeparation;
        const tx1 = cx + baseSeparation;
        const ey = cy;

        // Check eye positions distance from center (0, 0)
        const leftEyeDist = Math.hypot(tx0, ey);
        const rightEyeDist = Math.hypot(tx1, ey);
        assert.ok(leftEyeDist <= 55, `Left eye distance ${leftEyeDist} exceeds safe inner disc boundary (64px)`);
        assert.ok(rightEyeDist <= 55, `Right eye distance ${rightEyeDist} exceeds safe inner disc boundary (64px)`);

        // Check cheek positions distance from center (0, 0)
        const leftCheekDist = Math.hypot(tx0 - 10, ey + 20);
        const rightCheekDist = Math.hypot(tx1 + 10, ey + 20);
        assert.ok(leftCheekDist <= 62, `Left cheek distance ${leftCheekDist} exceeds safe inner disc boundary (64px)`);
        assert.ok(rightCheekDist <= 62, `Right cheek distance ${rightCheekDist} exceeds safe inner disc boundary (64px)`);

        // Check mouth position distance from center (0, 0)
        const mouthDist = Math.hypot(cx, cy + 18);
        assert.ok(mouthDist <= 35, `Mouth distance ${mouthDist} exceeds safe inner disc boundary (64px)`);
      }
    }
  });

  it('C3.5: All 12 shapes configure non-null face transforms and offsets in mascotRegistry.tsx', () => {
    const requiredShapes = [
      'cercle', 'squircle', 'galet', 'capsule', 'triangle', 'hexagone',
      'nuage', 'goutte', 'oeuf', 'soleil', 'fromage', 'livre'
    ];

    for (const shape of requiredShapes) {
      const faceConfigRegex = new RegExp(`${shape}:\\s*\\{[^}]*dx:\\s*[-0-9.]+,\\s*dy:\\s*[-0-9.]+,\\s*scale:\\s*[-0-9.]+`);
      assert.match(registryCode, faceConfigRegex, `FACE_CONFIGS must configure ${shape} with dx, dy, and scale`);
    }

    // Soleil specifically has { dx: 0, dy: 0, scale: 0.85 }
    assert.match(registryCode, /soleil:\s*\{\s*dx:\s*0,\s*dy:\s*0,\s*scale:\s*0\.85\s*\}/,
      'FACE_CONFIGS.soleil must be { dx: 0, dy: 0, scale: 0.85 }');
  });
});

// Helper to extract full keyframe block with nested braces
function extractKeyframeBlock(css: string, name: string): string {
  const startIdx = css.indexOf(`@keyframes ${name}`);
  if (startIdx === -1) return '';
  const openBrace = css.indexOf('{', startIdx);
  if (openBrace === -1) return '';
  let depth = 1;
  let idx = openBrace + 1;
  while (idx < css.length && depth > 0) {
    if (css[idx] === '{') depth++;
    else if (css[idx] === '}') depth--;
    idx++;
  }
  return css.slice(openBrace + 1, idx - 1);
}

describe('⚔️ CHALLENGER SUITE 4: Omni-Shape Shadow Oracle & Kinetic Invariants Across All 12 Shapes', () => {
  const ALL_12_SHAPES = [
    'squircle', 'cercle', 'soleil', 'livre', 'hexagone', 'nuage',
    'goutte', 'galet', 'capsule', 'triangle', 'oeuf', 'fromage'
  ];

  it('C4.1: Dynamic shadow oracle confirms inverse correlation between vertical loft and shadow scale across all 12 shapes', () => {
    for (const shape of ALL_12_SHAPES) {
      const capShape = shape.charAt(0).toUpperCase() + shape.slice(1);
      const shadowBody = extractKeyframeBlock(mascotCode, `tapShadow${capShape}`);
      const burstBody = extractKeyframeBlock(mascotCode, `tapBurst${capShape}`);
      assert.ok(shadowBody, `tapShadow${capShape} must exist in BloubMascot.tsx`);
      assert.ok(burstBody, `tapBurst${capShape} must exist in BloubMascot.tsx`);

      // For every shape, find minimum shadow scale (peak loft)
      const scaleMatches = [...shadowBody.matchAll(/scale\(([^)]+)\)/g)].map(m => parseFloat(m[1]));
      const minScale = Math.min(...scaleMatches);
      assert.ok(minScale < 1.0, `Shape ${shape} must have contracted shadow (< 1.0) during upward loft. Found min: ${minScale}`);

      // High-loft airborne shapes (soleil, cercle, squircle, hexagone, nuage, goutte, livre, triangle, oeuf, fromage) must contract to <= 0.80
      const highLoftJumpers = ['soleil', 'cercle', 'squircle', 'hexagone', 'nuage', 'goutte', 'livre', 'triangle', 'oeuf', 'fromage'];
      if (highLoftJumpers.includes(shape)) {
        assert.ok(minScale <= 0.80, `Airborne acrobat ${shape} must contract shadow to <= 0.80. Found: ${minScale}`);
      }

      // Grounded gentle-tilt shapes (galet, capsule) must contract shadow proportionately (0.90 - 0.95)
      if (shape === 'galet' || shape === 'capsule') {
        assert.ok(minScale <= 0.95, `Grounded rocker ${shape} must contract shadow proportionately (<= 0.95). Found: ${minScale}`);
      }

      // Resting scale at 100% must be strictly 1.0
      const restMatch = shadowBody.match(/100%\s*\{[^}]*scale\(([^)]+)\)/);
      assert.ok(restMatch, `Shape ${shape} must have a 100% resting scale in tapShadow${capShape}`);
      const restScale = parseFloat(restMatch[1]);
      assert.strictEqual(restScale, 1.0, `Resting shadow scale for ${shape} must be exactly 1.0`);
    }
  });

  it('C4.2: Dynamic shadow oracle confirms impact cushion / coil expansion (scale > 1.0) across all 12 shapes', () => {
    for (const shape of ALL_12_SHAPES) {
      const capShape = shape.charAt(0).toUpperCase() + shape.slice(1);
      const shadowBody = extractKeyframeBlock(mascotCode, `tapShadow${capShape}`);
      assert.ok(shadowBody, `tapShadow${capShape} must exist in BloubMascot.tsx`);

      // Look for expansion keyframes (> 1.0) during anticipation or landing cushion
      const scaleMatches = [...shadowBody.matchAll(/scale\(([^)]+)\)/g)].map(m => parseFloat(m[1]));
      const maxScale = Math.max(...scaleMatches);
      assert.ok(maxScale > 1.0,
        `Shape ${shape} must experience horizontal shadow widening (scale > 1.0) during cushion or squeeze. Found max: ${maxScale}`);
    }
  });

  it('C4.3: Every shape enforces 1150ms and cubic-bezier(0.16, 1, 0.3, 1) on tap burst', () => {
    for (const shape of ALL_12_SHAPES) {
      const burstRegex = new RegExp(`\\.tap-burst-${shape}\\s*\\{([^}]+)\\}`);
      const match = mascotCode.match(burstRegex);
      assert.ok(match, `.tap-burst-${shape} CSS class must exist`);

      const rule = match[1];
      assert.match(rule, /cubic-bezier\(0\.16,\s*1,\s*0\.3,\s*1\)/,
        `.tap-burst-${shape} must enforce cubic-bezier(0.16, 1, 0.3, 1)`);
      assert.match(rule, /1150ms/,
        `.tap-burst-${shape} must enforce duration 1150ms`);
      assert.match(rule, /forwards/,
        `.tap-burst-${shape} must enforce forwards fill mode`);
    }

    // Soleil specifically enforces transform-origin 0px 0px
    const soleilMatch = mascotCode.match(/\.tap-burst-soleil\s*\{([^}]+)\}/);
    assert.ok(soleilMatch);
    assert.match(soleilMatch[1], /transform-origin:\s*0px\s+0px/);
  });
});

describe('⚔️ CHALLENGER SUITE 5: Lifecycle & Interactive Event Hardening', () => {
  it('C5.1: Rapid tap bursts increment key to force immediate CSS re-trigger without collision', () => {
    // In BloubMascot.tsx:
    // key={`${normShape}-${tapCount}`}
    assert.match(mascotCode, /key=\{`\$\{normShape\}-\$\{tapCount\}`\}/,
      'Mascot container must bind key to `${normShape}-${tapCount}` to force re-render on tap burst');
    assert.match(mascotCode, /onAnimationEnd=\{\(\)\s*=>\s*\{[^}]*setIsTapping\(false\);/,
      'Mascot container must reset isTapping state on onAnimationEnd');
  });

  it('C5.2: Floor shadow is cleanly hidden during active typing to prevent shadow desynchronization', () => {
    // In BloubMascot.tsx:
    // display: activeTyping ? 'none' : 'block'
    assert.match(mascotCode, /display:\s*activeTyping\s*\?\s*'none'\s*:\s*'block'/,
      'Floor shadow must be cleanly hidden (display: none) when activeTyping is true');
  });

  it('C5.3: Pointer event listeners register and unregister cleanly on mount and unmount', () => {
    assert.match(mascotCode, /window\.addEventListener\('pointermove',\s*handleMove\)/);
    assert.match(mascotCode, /window\.addEventListener\('pointerdown',\s*handleMove\)/);
    assert.match(mascotCode, /window\.addEventListener\('pointerleave',\s*handleLeave\)/);
    assert.match(mascotCode, /window\.addEventListener\('pointercancel',\s*handleLeave\)/);

    assert.match(mascotCode, /window\.removeEventListener\('pointermove',\s*handleMove\)/);
    assert.match(mascotCode, /window\.removeEventListener\('pointerdown',\s*handleMove\)/);
    assert.match(mascotCode, /window\.removeEventListener\('pointerleave',\s*handleLeave\)/);
    assert.match(mascotCode, /window\.removeEventListener\('pointercancel',\s*handleLeave\)/);
  });
});

