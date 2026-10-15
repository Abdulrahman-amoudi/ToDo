/**
 * Google Stitch Design Token Matrix & Universal Theme Definitions
 * 
 * Formal design token system adhering to the calibrated 85/10/5 Rule:
 * - 85% Atmospheric Canvas (--theme-bg, rich, distinctive, atmospheric tones)
 * - 10% Tonal Elevated Surfaces (--theme-surface, --theme-surface-elevated, hairline border)
 * - 5% High-Vibrancy Theme Accent (--theme-primary) strictly for active states, CTAs, and badges
 */

export type StitchColorVariant = 
  | 'TONAL_SPOT' 
  | 'VIBRANT' 
  | 'EXPRESSIVE' 
  | 'NEUTRAL' 
  | 'MONOCHROME';

export type ThemeCategory = 
  | 'Cyber' 
  | 'Atmosphere' 
  | 'Element' 
  | 'Studio';

export interface ThemeCssVariables {
  '--theme-bg': string;
  '--theme-surface': string;
  '--theme-surface-elevated': string;
  '--theme-surface-subtle': string;
  '--theme-surface-overlay': string;
  '--theme-border': string;
  '--theme-border-subtle': string;
  '--theme-primary': string;
  '--theme-primary-hover': string;
  '--theme-text-primary': string;
  '--theme-text-secondary': string;
  '--theme-text-muted': string;
  '--theme-focus-ring': string;
}

export interface StitchThemeToken {
  id: string;
  slug: string;
  name: string;
  category: ThemeCategory;
  color: string;
  customColor: string;
  surfaceColor: string;
  neutralColor: string;
  colorVariant: StitchColorVariant;
  cssVariables: ThemeCssVariables;
}

export const STITCH_THEMES: readonly StitchThemeToken[] = [
  {
    id: 'bg-[#080d2a]',
    slug: 'dark-blue',
    name: 'Dark Blue',
    category: 'Studio',
    color: '#3b82f6',
    customColor: '#3b82f6',
    surfaceColor: '#131d3f',
    neutralColor: '#0c1329',
    colorVariant: 'TONAL_SPOT',
    cssVariables: {
      '--theme-bg': '#0c1329',
      '--theme-surface': '#131d3f',
      '--theme-surface-elevated': '#1a2652',
      '--theme-surface-subtle': 'rgba(59, 130, 246, 0.08)',
      '--theme-surface-overlay': 'rgba(12, 19, 41, 0.94)',
      '--theme-border': 'rgba(59, 130, 246, 0.20)',
      '--theme-border-subtle': 'rgba(255, 255, 255, 0.08)',
      '--theme-primary': '#3b82f6',
      '--theme-primary-hover': '#60a5fa',
      '--theme-text-primary': '#ffffff',
      '--theme-text-secondary': '#cbd5e1',
      '--theme-text-muted': '#94a3b8',
      '--theme-focus-ring': 'rgba(59, 130, 246, 0.35)',
    },
  },
  {
    id: 'bg-[#1a0b2e]',
    slug: 'midnight-violet',
    name: 'Midnight Violet',
    category: 'Cyber',
    color: '#a855f7',
    customColor: '#a855f7',
    surfaceColor: '#221040',
    neutralColor: '#170b2c',
    colorVariant: 'VIBRANT',
    cssVariables: {
      '--theme-bg': '#170b2c',
      '--theme-surface': '#221040',
      '--theme-surface-elevated': '#2d1654',
      '--theme-surface-subtle': 'rgba(168, 85, 247, 0.08)',
      '--theme-surface-overlay': 'rgba(23, 11, 44, 0.94)',
      '--theme-border': 'rgba(168, 85, 247, 0.22)',
      '--theme-border-subtle': 'rgba(255, 255, 255, 0.08)',
      '--theme-primary': '#a855f7',
      '--theme-primary-hover': '#c084fc',
      '--theme-text-primary': '#ffffff',
      '--theme-text-secondary': '#e4e4e7',
      '--theme-text-muted': '#a1a1aa',
      '--theme-focus-ring': 'rgba(168, 85, 247, 0.35)',
    },
  },
  {
    id: 'bg-[#022c22]',
    slug: 'emerald-night',
    name: 'Emerald Night',
    category: 'Element',
    color: '#10b981',
    customColor: '#10b981',
    surfaceColor: '#0c3021',
    neutralColor: '#062016',
    colorVariant: 'TONAL_SPOT',
    cssVariables: {
      '--theme-bg': '#062016',
      '--theme-surface': '#0c3021',
      '--theme-surface-elevated': '#12422e',
      '--theme-surface-subtle': 'rgba(16, 185, 129, 0.08)',
      '--theme-surface-overlay': 'rgba(6, 32, 22, 0.94)',
      '--theme-border': 'rgba(16, 185, 129, 0.20)',
      '--theme-border-subtle': 'rgba(255, 255, 255, 0.08)',
      '--theme-primary': '#10b981',
      '--theme-primary-hover': '#34d399',
      '--theme-text-primary': '#ffffff',
      '--theme-text-secondary': '#d1fae5',
      '--theme-text-muted': '#86efac',
      '--theme-focus-ring': 'rgba(16, 185, 129, 0.35)',
    },
  },
  {
    id: 'bg-[#3b0712]',
    slug: 'crimson-ember',
    name: 'Crimson Ember',
    category: 'Atmosphere',
    color: '#f43f5e',
    customColor: '#f43f5e',
    surfaceColor: '#330d1a',
    neutralColor: '#230912',
    colorVariant: 'EXPRESSIVE',
    cssVariables: {
      '--theme-bg': '#230912',
      '--theme-surface': '#330d1a',
      '--theme-surface-elevated': '#461224',
      '--theme-surface-subtle': 'rgba(244, 63, 94, 0.08)',
      '--theme-surface-overlay': 'rgba(35, 9, 18, 0.94)',
      '--theme-border': 'rgba(244, 63, 94, 0.22)',
      '--theme-border-subtle': 'rgba(255, 255, 255, 0.08)',
      '--theme-primary': '#f43f5e',
      '--theme-primary-hover': '#fb7185',
      '--theme-text-primary': '#ffffff',
      '--theme-text-secondary': '#fecdd3',
      '--theme-text-muted': '#fda4af',
      '--theme-focus-ring': 'rgba(244, 63, 94, 0.35)',
    },
  },
  {
    id: 'bg-[#422006]',
    slug: 'solar-amber',
    name: 'Solar Amber',
    category: 'Atmosphere',
    color: '#f59e0b',
    customColor: '#f59e0b',
    surfaceColor: '#301e09',
    neutralColor: '#211406',
    colorVariant: 'VIBRANT',
    cssVariables: {
      '--theme-bg': '#211406',
      '--theme-surface': '#301e09',
      '--theme-surface-elevated': '#432a0d',
      '--theme-surface-subtle': 'rgba(245, 158, 11, 0.08)',
      '--theme-surface-overlay': 'rgba(33, 20, 6, 0.94)',
      '--theme-border': 'rgba(245, 158, 11, 0.22)',
      '--theme-border-subtle': 'rgba(255, 255, 255, 0.08)',
      '--theme-primary': '#f59e0b',
      '--theme-primary-hover': '#fbbf24',
      '--theme-text-primary': '#ffffff',
      '--theme-text-secondary': '#fef3c7',
      '--theme-text-muted': '#fcd34d',
      '--theme-focus-ring': 'rgba(245, 158, 11, 0.35)',
    },
  },
  {
    id: 'bg-[#082f49]',
    slug: 'abyssal-cyan',
    name: 'Abyssal Cyan',
    category: 'Cyber',
    color: '#06b6d4',
    customColor: '#06b6d4',
    surfaceColor: '#0c2d3f',
    neutralColor: '#061f2c',
    colorVariant: 'EXPRESSIVE',
    cssVariables: {
      '--theme-bg': '#061f2c',
      '--theme-surface': '#0c2d3f',
      '--theme-surface-elevated': '#113d54',
      '--theme-surface-subtle': 'rgba(6, 182, 212, 0.08)',
      '--theme-surface-overlay': 'rgba(6, 31, 44, 0.94)',
      '--theme-border': 'rgba(6, 182, 212, 0.22)',
      '--theme-border-subtle': 'rgba(255, 255, 255, 0.08)',
      '--theme-primary': '#06b6d4',
      '--theme-primary-hover': '#22d3ee',
      '--theme-text-primary': '#ffffff',
      '--theme-text-secondary': '#cffafe',
      '--theme-text-muted': '#67e8f9',
      '--theme-focus-ring': 'rgba(6, 182, 212, 0.35)',
    },
  },
  {
    id: 'bg-[#380424]',
    slug: 'neon-rose',
    name: 'Neon Rose',
    category: 'Cyber',
    color: '#fb7185',
    customColor: '#fb7185',
    surfaceColor: '#330d29',
    neutralColor: '#23091c',
    colorVariant: 'VIBRANT',
    cssVariables: {
      '--theme-bg': '#23091c',
      '--theme-surface': '#330d29',
      '--theme-surface-elevated': '#461338',
      '--theme-surface-subtle': 'rgba(251, 113, 133, 0.08)',
      '--theme-surface-overlay': 'rgba(35, 9, 28, 0.94)',
      '--theme-border': 'rgba(251, 113, 133, 0.22)',
      '--theme-border-subtle': 'rgba(255, 255, 255, 0.08)',
      '--theme-primary': '#fb7185',
      '--theme-primary-hover': '#fda4af',
      '--theme-text-primary': '#ffffff',
      '--theme-text-secondary': '#ffe4e6',
      '--theme-text-muted': '#f43f5e',
      '--theme-focus-ring': 'rgba(251, 113, 133, 0.35)',
    },
  },
  {
    id: 'bg-[#052e16]',
    slug: 'forest-moss',
    name: 'Forest Moss',
    category: 'Element',
    color: '#84cc16',
    customColor: '#84cc16',
    surfaceColor: '#193111',
    neutralColor: '#10200b',
    colorVariant: 'TONAL_SPOT',
    cssVariables: {
      '--theme-bg': '#10200b',
      '--theme-surface': '#193111',
      '--theme-surface-elevated': '#234317',
      '--theme-surface-subtle': 'rgba(132, 204, 22, 0.08)',
      '--theme-surface-overlay': 'rgba(16, 32, 11, 0.94)',
      '--theme-border': 'rgba(132, 204, 22, 0.20)',
      '--theme-border-subtle': 'rgba(255, 255, 255, 0.08)',
      '--theme-primary': '#84cc16',
      '--theme-primary-hover': '#a3e635',
      '--theme-text-primary': '#ffffff',
      '--theme-text-secondary': '#ecfccb',
      '--theme-text-muted': '#bef264',
      '--theme-focus-ring': 'rgba(132, 204, 22, 0.35)',
    },
  },
  {
    id: 'bg-[#1e1b4b]',
    slug: 'royal-indigo',
    name: 'Royal Indigo',
    category: 'Cyber',
    color: '#6366f1',
    customColor: '#6366f1',
    surfaceColor: '#191a4c',
    neutralColor: '#111236',
    colorVariant: 'TONAL_SPOT',
    cssVariables: {
      '--theme-bg': '#111236',
      '--theme-surface': '#191a4c',
      '--theme-surface-elevated': '#222464',
      '--theme-surface-subtle': 'rgba(99, 102, 241, 0.08)',
      '--theme-surface-overlay': 'rgba(17, 18, 54, 0.94)',
      '--theme-border': 'rgba(99, 102, 241, 0.22)',
      '--theme-border-subtle': 'rgba(255, 255, 255, 0.08)',
      '--theme-primary': '#6366f1',
      '--theme-primary-hover': '#818cf8',
      '--theme-text-primary': '#ffffff',
      '--theme-text-secondary': '#e0e7ff',
      '--theme-text-muted': '#a5b4fc',
      '--theme-focus-ring': 'rgba(99, 102, 241, 0.35)',
    },
  },
  {
    id: 'bg-[#2e0854]',
    slug: 'deep-plum',
    name: 'Deep Plum',
    category: 'Atmosphere',
    color: '#c084fc',
    customColor: '#c084fc',
    surfaceColor: '#280e3e',
    neutralColor: '#1c092c',
    colorVariant: 'EXPRESSIVE',
    cssVariables: {
      '--theme-bg': '#1c092c',
      '--theme-surface': '#280e3e',
      '--theme-surface-elevated': '#361453',
      '--theme-surface-subtle': 'rgba(192, 132, 252, 0.08)',
      '--theme-surface-overlay': 'rgba(28, 9, 44, 0.94)',
      '--theme-border': 'rgba(192, 132, 252, 0.22)',
      '--theme-border-subtle': 'rgba(255, 255, 255, 0.08)',
      '--theme-primary': '#c084fc',
      '--theme-primary-hover': '#d8b4fe',
      '--theme-text-primary': '#ffffff',
      '--theme-text-secondary': '#f3e8ff',
      '--theme-text-muted': '#e9d5ff',
      '--theme-focus-ring': 'rgba(192, 132, 252, 0.35)',
    },
  },
  {
    id: 'bg-[#3c1605]',
    slug: 'burnt-bronze',
    name: 'Burnt Bronze',
    category: 'Element',
    color: '#d97706',
    customColor: '#d97706',
    surfaceColor: '#341c09',
    neutralColor: '#241306',
    colorVariant: 'TONAL_SPOT',
    cssVariables: {
      '--theme-bg': '#241306',
      '--theme-surface': '#341c09',
      '--theme-surface-elevated': '#48270d',
      '--theme-surface-subtle': 'rgba(217, 119, 6, 0.08)',
      '--theme-surface-overlay': 'rgba(36, 19, 6, 0.94)',
      '--theme-border': 'rgba(217, 119, 6, 0.22)',
      '--theme-border-subtle': 'rgba(255, 255, 255, 0.08)',
      '--theme-primary': '#d97706',
      '--theme-primary-hover': '#f59e0b',
      '--theme-text-primary': '#ffffff',
      '--theme-text-secondary': '#ffedd5',
      '--theme-text-muted': '#fed7aa',
      '--theme-focus-ring': 'rgba(217, 119, 6, 0.35)',
    },
  },
  {
    id: 'bg-[#0f172a]',
    slug: 'titanium-slate',
    name: 'Titanium Slate',
    category: 'Studio',
    color: '#94a3b8',
    customColor: '#94a3b8',
    surfaceColor: '#172336',
    neutralColor: '#0f1826',
    colorVariant: 'NEUTRAL',
    cssVariables: {
      '--theme-bg': '#0f1826',
      '--theme-surface': '#172336',
      '--theme-surface-elevated': '#202f48',
      '--theme-surface-subtle': 'rgba(148, 163, 184, 0.08)',
      '--theme-surface-overlay': 'rgba(15, 24, 38, 0.94)',
      '--theme-border': 'rgba(148, 163, 184, 0.18)',
      '--theme-border-subtle': 'rgba(255, 255, 255, 0.08)',
      '--theme-primary': '#94a3b8',
      '--theme-primary-hover': '#cbd5e1',
      '--theme-text-primary': '#ffffff',
      '--theme-text-secondary': '#f1f5f9',
      '--theme-text-muted': '#64748b',
      '--theme-focus-ring': 'rgba(148, 163, 184, 0.35)',
    },
  },
  {
    id: 'bg-[#030712]',
    slug: 'obsidian-oled',
    name: 'Obsidian OLED',
    category: 'Studio',
    color: '#ffffff',
    customColor: '#ffffff',
    surfaceColor: '#0d0d0d',
    neutralColor: '#000000',
    colorVariant: 'MONOCHROME',
    cssVariables: {
      '--theme-bg': '#000000',
      '--theme-surface': '#0d0d0d',
      '--theme-surface-elevated': '#181818',
      '--theme-surface-subtle': 'rgba(255, 255, 255, 0.05)',
      '--theme-surface-overlay': 'rgba(0, 0, 0, 0.96)',
      '--theme-border': 'rgba(255, 255, 255, 0.14)',
      '--theme-border-subtle': 'rgba(255, 255, 255, 0.06)',
      '--theme-primary': '#ffffff',
      '--theme-primary-hover': '#e4e4e7',
      '--theme-text-primary': '#ffffff',
      '--theme-text-secondary': '#d4d4d8',
      '--theme-text-muted': '#71717a',
      '--theme-focus-ring': 'rgba(255, 255, 255, 0.4)',
    },
  },
  {
    id: 'bg-[#18181b]',
    slug: 'phantom-charcoal',
    name: 'Phantom Charcoal',
    category: 'Studio',
    color: '#d4d4d8',
    customColor: '#d4d4d8',
    surfaceColor: '#1a1b20',
    neutralColor: '#121316',
    colorVariant: 'NEUTRAL',
    cssVariables: {
      '--theme-bg': '#121316',
      '--theme-surface': '#1a1b20',
      '--theme-surface-elevated': '#24252c',
      '--theme-surface-subtle': 'rgba(212, 212, 216, 0.08)',
      '--theme-surface-overlay': 'rgba(18, 19, 22, 0.94)',
      '--theme-border': 'rgba(255, 255, 255, 0.12)',
      '--theme-border-subtle': 'rgba(255, 255, 255, 0.06)',
      '--theme-primary': '#d4d4d8',
      '--theme-primary-hover': '#f4f4f5',
      '--theme-text-primary': '#ffffff',
      '--theme-text-secondary': '#e4e4e7',
      '--theme-text-muted': '#a1a1aa',
      '--theme-focus-ring': 'rgba(212, 212, 216, 0.35)',
    },
  },
  {
    id: 'bg-[#3b0d2d]',
    slug: 'mystic-magenta',
    name: 'Mystic Magenta',
    category: 'Atmosphere',
    color: '#ec4899',
    customColor: '#ec4899',
    surfaceColor: '#330c35',
    neutralColor: '#230824',
    colorVariant: 'EXPRESSIVE',
    cssVariables: {
      '--theme-bg': '#230824',
      '--theme-surface': '#330c35',
      '--theme-surface-elevated': '#461248',
      '--theme-surface-subtle': 'rgba(236, 72, 153, 0.08)',
      '--theme-surface-overlay': 'rgba(35, 8, 36, 0.94)',
      '--theme-border': 'rgba(236, 72, 153, 0.22)',
      '--theme-border-subtle': 'rgba(255, 255, 255, 0.08)',
      '--theme-primary': '#ec4899',
      '--theme-primary-hover': '#f472b6',
      '--theme-text-primary': '#ffffff',
      '--theme-text-secondary': '#fce7f3',
      '--theme-text-muted': '#f472b6',
      '--theme-focus-ring': 'rgba(236, 72, 153, 0.35)',
    },
  },
  {
    id: 'bg-[#0c1a30]',
    slug: 'arctic-navy',
    name: 'Arctic Navy',
    category: 'Element',
    color: '#38bdf8',
    customColor: '#38bdf8',
    surfaceColor: '#102943',
    neutralColor: '#0a1d30',
    colorVariant: 'TONAL_SPOT',
    cssVariables: {
      '--theme-bg': '#0a1d30',
      '--theme-surface': '#102943',
      '--theme-surface-elevated': '#16375a',
      '--theme-surface-subtle': 'rgba(56, 189, 248, 0.08)',
      '--theme-surface-overlay': 'rgba(10, 29, 48, 0.94)',
      '--theme-border': 'rgba(56, 189, 248, 0.22)',
      '--theme-border-subtle': 'rgba(255, 255, 255, 0.08)',
      '--theme-primary': '#38bdf8',
      '--theme-primary-hover': '#7dd3fc',
      '--theme-text-primary': '#ffffff',
      '--theme-text-secondary': '#e0f2fe',
      '--theme-text-muted': '#7dd3fc',
      '--theme-focus-ring': 'rgba(56, 189, 248, 0.35)',
    },
  },
] as const;

/**
 * Fast lookup map for Stitch themes by ID, Slug, or Hex.
 */
const THEME_MAP = new Map<string, StitchThemeToken>();
STITCH_THEMES.forEach(t => {
  THEME_MAP.set(t.id, t);
  THEME_MAP.set(t.slug, t);
  THEME_MAP.set(t.color.toLowerCase(), t);
  THEME_MAP.set(t.customColor.toLowerCase(), t);
});

/**
 * Resolves a Stitch theme token by its Tailwind ID, Slug, or Hex code.
 */
export function getThemeToken(identifier: string): StitchThemeToken {
  return THEME_MAP.get(identifier) || THEME_MAP.get(identifier.toLowerCase()) || STITCH_THEMES[0];
}

/**
 * Returns CSS variable key-value pairs for a specific theme ID.
 */
export function getThemeVariables(identifier: string): Record<string, string> {
  const token = getThemeToken(identifier);
  return {
    ...token.cssVariables,
    '--bg-base': token.neutralColor,
    '--bg-surface': token.surfaceColor,
    '--bg-card': token.cssVariables['--theme-surface-elevated'] || token.surfaceColor,
    '--border-subtle': token.cssVariables['--theme-border-subtle'] || 'rgba(255, 255, 255, 0.08)',
    '--accent-primary': token.customColor,
    '--accent-glow': `${token.customColor}40`,
  };
}

/**
 * Clean UI theme list for pickers and settings menus with dual-tone swatches.
 */
export const THEMES = STITCH_THEMES.map(t => ({
  id: t.id,
  slug: t.slug,
  name: t.name,
  category: t.category,
  accentColor: t.customColor,
  surfaceColor: t.surfaceColor,
  bgColor: t.neutralColor,
  color: t.customColor, // compatibility with existing theme pickers
}));

export const THEME_CATEGORIES: readonly (ThemeCategory | 'All')[] = ['All', 'Cyber', 'Atmosphere', 'Element', 'Studio'] as const;
