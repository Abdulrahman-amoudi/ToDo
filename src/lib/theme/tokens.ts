/**
 * Google Stitch Design Token Matrix & Universal Theme Definitions
 * 
 * Formal design token system adhering to the 85/10/5 Rule:
 * - 85% Neutral Obsidian Canvas (#0b0a0e)
 * - 10% Neutral Elevated Surfaces (#141318 / 1px white/0.07 border)
 * - 5% Saturated Theme Accent (--theme-primary) strictly for active states, CTAs, and badges
 */

export type StitchColorVariant = 
  | 'TONAL_SPOT' 
  | 'VIBRANT' 
  | 'EXPRESSIVE' 
  | 'NEUTRAL' 
  | 'MONOCHROME';

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
  color: string;
  customColor: string;
  neutralColor: string;
  colorVariant: StitchColorVariant;
  cssVariables: ThemeCssVariables;
}

export const STITCH_THEMES: readonly StitchThemeToken[] = [
  {
    id: 'bg-[#080d2a]',
    slug: 'dark-blue',
    name: 'Dark Blue',
    color: '#080d2a',
    customColor: '#3b82f6',
    neutralColor: '#0b0a0e',
    colorVariant: 'TONAL_SPOT',
    cssVariables: {
      '--theme-bg': '#0b0a0e',
      '--theme-surface': '#141318',
      '--theme-surface-elevated': '#1a1921',
      '--theme-surface-subtle': 'rgba(255, 255, 255, 0.03)',
      '--theme-surface-overlay': 'rgba(11, 10, 14, 0.94)',
      '--theme-border': 'rgba(255, 255, 255, 0.08)',
      '--theme-border-subtle': 'rgba(255, 255, 255, 0.04)',
      '--theme-primary': '#3b82f6',
      '--theme-primary-hover': '#60a5fa',
      '--theme-text-primary': '#ffffff',
      '--theme-text-secondary': '#e4e4e7',
      '--theme-text-muted': '#a1a1aa',
      '--theme-focus-ring': 'rgba(59, 130, 246, 0.35)',
    },
  },
  {
    id: 'bg-[#1a0b2e]',
    slug: 'midnight-violet',
    name: 'Midnight Violet',
    color: '#1a0b2e',
    customColor: '#a855f7',
    neutralColor: '#0b0a0e',
    colorVariant: 'VIBRANT',
    cssVariables: {
      '--theme-bg': '#0b0a0e',
      '--theme-surface': '#141318',
      '--theme-surface-elevated': '#1a1921',
      '--theme-surface-subtle': 'rgba(255, 255, 255, 0.03)',
      '--theme-surface-overlay': 'rgba(11, 10, 14, 0.94)',
      '--theme-border': 'rgba(255, 255, 255, 0.08)',
      '--theme-border-subtle': 'rgba(255, 255, 255, 0.04)',
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
    color: '#022c22',
    customColor: '#10b981',
    neutralColor: '#0b0a0e',
    colorVariant: 'TONAL_SPOT',
    cssVariables: {
      '--theme-bg': '#0b0a0e',
      '--theme-surface': '#141318',
      '--theme-surface-elevated': '#1a1921',
      '--theme-surface-subtle': 'rgba(255, 255, 255, 0.03)',
      '--theme-surface-overlay': 'rgba(11, 10, 14, 0.94)',
      '--theme-border': 'rgba(255, 255, 255, 0.08)',
      '--theme-border-subtle': 'rgba(255, 255, 255, 0.04)',
      '--theme-primary': '#10b981',
      '--theme-primary-hover': '#34d399',
      '--theme-text-primary': '#ffffff',
      '--theme-text-secondary': '#e4e4e7',
      '--theme-text-muted': '#a1a1aa',
      '--theme-focus-ring': 'rgba(16, 185, 129, 0.35)',
    },
  },
  {
    id: 'bg-[#3b0712]',
    slug: 'crimson-ember',
    name: 'Crimson Ember',
    color: '#3b0712',
    customColor: '#f43f5e',
    neutralColor: '#0b0a0e',
    colorVariant: 'EXPRESSIVE',
    cssVariables: {
      '--theme-bg': '#0b0a0e',
      '--theme-surface': '#141318',
      '--theme-surface-elevated': '#1a1921',
      '--theme-surface-subtle': 'rgba(255, 255, 255, 0.03)',
      '--theme-surface-overlay': 'rgba(11, 10, 14, 0.94)',
      '--theme-border': 'rgba(255, 255, 255, 0.08)',
      '--theme-border-subtle': 'rgba(255, 255, 255, 0.04)',
      '--theme-primary': '#f43f5e',
      '--theme-primary-hover': '#fb7185',
      '--theme-text-primary': '#ffffff',
      '--theme-text-secondary': '#e4e4e7',
      '--theme-text-muted': '#a1a1aa',
      '--theme-focus-ring': 'rgba(244, 63, 94, 0.35)',
    },
  },
  {
    id: 'bg-[#422006]',
    slug: 'solar-amber',
    name: 'Solar Amber',
    color: '#422006',
    customColor: '#f59e0b',
    neutralColor: '#0b0a0e',
    colorVariant: 'VIBRANT',
    cssVariables: {
      '--theme-bg': '#0b0a0e',
      '--theme-surface': '#141318',
      '--theme-surface-elevated': '#1a1921',
      '--theme-surface-subtle': 'rgba(255, 255, 255, 0.03)',
      '--theme-surface-overlay': 'rgba(11, 10, 14, 0.94)',
      '--theme-border': 'rgba(255, 255, 255, 0.08)',
      '--theme-border-subtle': 'rgba(255, 255, 255, 0.04)',
      '--theme-primary': '#f59e0b',
      '--theme-primary-hover': '#fbbf24',
      '--theme-text-primary': '#ffffff',
      '--theme-text-secondary': '#e4e4e7',
      '--theme-text-muted': '#a1a1aa',
      '--theme-focus-ring': 'rgba(245, 158, 11, 0.35)',
    },
  },
  {
    id: 'bg-[#082f49]',
    slug: 'abyssal-cyan',
    name: 'Abyssal Cyan',
    color: '#082f49',
    customColor: '#06b6d4',
    neutralColor: '#0b0a0e',
    colorVariant: 'TONAL_SPOT',
    cssVariables: {
      '--theme-bg': '#0b0a0e',
      '--theme-surface': '#141318',
      '--theme-surface-elevated': '#1a1921',
      '--theme-surface-subtle': 'rgba(255, 255, 255, 0.03)',
      '--theme-surface-overlay': 'rgba(11, 10, 14, 0.94)',
      '--theme-border': 'rgba(255, 255, 255, 0.08)',
      '--theme-border-subtle': 'rgba(255, 255, 255, 0.04)',
      '--theme-primary': '#06b6d4',
      '--theme-primary-hover': '#22d3ee',
      '--theme-text-primary': '#ffffff',
      '--theme-text-secondary': '#e4e4e7',
      '--theme-text-muted': '#a1a1aa',
      '--theme-focus-ring': 'rgba(6, 182, 212, 0.35)',
    },
  },
  {
    id: 'bg-[#380424]',
    slug: 'neon-rose',
    name: 'Neon Rose',
    color: '#380424',
    customColor: '#f43f5e',
    neutralColor: '#0b0a0e',
    colorVariant: 'EXPRESSIVE',
    cssVariables: {
      '--theme-bg': '#0b0a0e',
      '--theme-surface': '#141318',
      '--theme-surface-elevated': '#1a1921',
      '--theme-surface-subtle': 'rgba(255, 255, 255, 0.03)',
      '--theme-surface-overlay': 'rgba(11, 10, 14, 0.94)',
      '--theme-border': 'rgba(255, 255, 255, 0.08)',
      '--theme-border-subtle': 'rgba(255, 255, 255, 0.04)',
      '--theme-primary': '#f43f5e',
      '--theme-primary-hover': '#fb7185',
      '--theme-text-primary': '#ffffff',
      '--theme-text-secondary': '#e4e4e7',
      '--theme-text-muted': '#a1a1aa',
      '--theme-focus-ring': 'rgba(244, 63, 94, 0.35)',
    },
  },
  {
    id: 'bg-[#052e16]',
    slug: 'forest-moss',
    name: 'Forest Moss',
    color: '#052e16',
    customColor: '#22c55e',
    neutralColor: '#0b0a0e',
    colorVariant: 'TONAL_SPOT',
    cssVariables: {
      '--theme-bg': '#0b0a0e',
      '--theme-surface': '#141318',
      '--theme-surface-elevated': '#1a1921',
      '--theme-surface-subtle': 'rgba(255, 255, 255, 0.03)',
      '--theme-surface-overlay': 'rgba(11, 10, 14, 0.94)',
      '--theme-border': 'rgba(255, 255, 255, 0.08)',
      '--theme-border-subtle': 'rgba(255, 255, 255, 0.04)',
      '--theme-primary': '#22c55e',
      '--theme-primary-hover': '#4ade80',
      '--theme-text-primary': '#ffffff',
      '--theme-text-secondary': '#e4e4e7',
      '--theme-text-muted': '#a1a1aa',
      '--theme-focus-ring': 'rgba(34, 197, 94, 0.35)',
    },
  },
  {
    id: 'bg-[#1e1b4b]',
    slug: 'royal-indigo',
    name: 'Royal Indigo',
    color: '#1e1b4b',
    customColor: '#6366f1',
    neutralColor: '#0b0a0e',
    colorVariant: 'TONAL_SPOT',
    cssVariables: {
      '--theme-bg': '#0b0a0e',
      '--theme-surface': '#141318',
      '--theme-surface-elevated': '#1a1921',
      '--theme-surface-subtle': 'rgba(255, 255, 255, 0.03)',
      '--theme-surface-overlay': 'rgba(11, 10, 14, 0.94)',
      '--theme-border': 'rgba(255, 255, 255, 0.08)',
      '--theme-border-subtle': 'rgba(255, 255, 255, 0.04)',
      '--theme-primary': '#6366f1',
      '--theme-primary-hover': '#818cf8',
      '--theme-text-primary': '#ffffff',
      '--theme-text-secondary': '#e4e4e7',
      '--theme-text-muted': '#a1a1aa',
      '--theme-focus-ring': 'rgba(99, 102, 241, 0.35)',
    },
  },
  {
    id: 'bg-[#2e0854]',
    slug: 'deep-plum',
    name: 'Deep Plum',
    color: '#2e0854',
    customColor: '#c084fc',
    neutralColor: '#0b0a0e',
    colorVariant: 'VIBRANT',
    cssVariables: {
      '--theme-bg': '#0b0a0e',
      '--theme-surface': '#141318',
      '--theme-surface-elevated': '#1a1921',
      '--theme-surface-subtle': 'rgba(255, 255, 255, 0.03)',
      '--theme-surface-overlay': 'rgba(11, 10, 14, 0.94)',
      '--theme-border': 'rgba(255, 255, 255, 0.08)',
      '--theme-border-subtle': 'rgba(255, 255, 255, 0.04)',
      '--theme-primary': '#c084fc',
      '--theme-primary-hover': '#d8b4fe',
      '--theme-text-primary': '#ffffff',
      '--theme-text-secondary': '#e4e4e7',
      '--theme-text-muted': '#a1a1aa',
      '--theme-focus-ring': 'rgba(192, 132, 252, 0.35)',
    },
  },
  {
    id: 'bg-[#3c1605]',
    slug: 'burnt-bronze',
    name: 'Burnt Bronze',
    color: '#3c1605',
    customColor: '#f97316',
    neutralColor: '#0b0a0e',
    colorVariant: 'EXPRESSIVE',
    cssVariables: {
      '--theme-bg': '#0b0a0e',
      '--theme-surface': '#141318',
      '--theme-surface-elevated': '#1a1921',
      '--theme-surface-subtle': 'rgba(255, 255, 255, 0.03)',
      '--theme-surface-overlay': 'rgba(11, 10, 14, 0.94)',
      '--theme-border': 'rgba(255, 255, 255, 0.08)',
      '--theme-border-subtle': 'rgba(255, 255, 255, 0.04)',
      '--theme-primary': '#f97316',
      '--theme-primary-hover': '#fb923c',
      '--theme-text-primary': '#ffffff',
      '--theme-text-secondary': '#e4e4e7',
      '--theme-text-muted': '#a1a1aa',
      '--theme-focus-ring': 'rgba(249, 115, 22, 0.35)',
    },
  },
  {
    id: 'bg-[#0f172a]',
    slug: 'titanium-slate',
    name: 'Titanium Slate',
    color: '#0f172a',
    customColor: '#94a3b8',
    neutralColor: '#0b0a0e',
    colorVariant: 'NEUTRAL',
    cssVariables: {
      '--theme-bg': '#0b0a0e',
      '--theme-surface': '#141318',
      '--theme-surface-elevated': '#1a1921',
      '--theme-surface-subtle': 'rgba(255, 255, 255, 0.03)',
      '--theme-surface-overlay': 'rgba(11, 10, 14, 0.94)',
      '--theme-border': 'rgba(255, 255, 255, 0.08)',
      '--theme-border-subtle': 'rgba(255, 255, 255, 0.04)',
      '--theme-primary': '#94a3b8',
      '--theme-primary-hover': '#cbd5e1',
      '--theme-text-primary': '#ffffff',
      '--theme-text-secondary': '#e4e4e7',
      '--theme-text-muted': '#a1a1aa',
      '--theme-focus-ring': 'rgba(148, 163, 184, 0.35)',
    },
  },
  {
    id: 'bg-[#030712]',
    slug: 'obsidian-oled',
    name: 'Obsidian OLED',
    color: '#030712',
    customColor: '#e2e8f0',
    neutralColor: '#0b0a0e',
    colorVariant: 'MONOCHROME',
    cssVariables: {
      '--theme-bg': '#0b0a0e',
      '--theme-surface': '#141318',
      '--theme-surface-elevated': '#1a1921',
      '--theme-surface-subtle': 'rgba(255, 255, 255, 0.03)',
      '--theme-surface-overlay': 'rgba(11, 10, 14, 0.94)',
      '--theme-border': 'rgba(255, 255, 255, 0.08)',
      '--theme-border-subtle': 'rgba(255, 255, 255, 0.04)',
      '--theme-primary': '#e2e8f0',
      '--theme-primary-hover': '#f8fafc',
      '--theme-text-primary': '#ffffff',
      '--theme-text-secondary': '#e4e4e7',
      '--theme-text-muted': '#a1a1aa',
      '--theme-focus-ring': 'rgba(226, 232, 240, 0.35)',
    },
  },
  {
    id: 'bg-[#18181b]',
    slug: 'phantom-charcoal',
    name: 'Phantom Charcoal',
    color: '#18181b',
    customColor: '#a1a1aa',
    neutralColor: '#0b0a0e',
    colorVariant: 'NEUTRAL',
    cssVariables: {
      '--theme-bg': '#0b0a0e',
      '--theme-surface': '#141318',
      '--theme-surface-elevated': '#1a1921',
      '--theme-surface-subtle': 'rgba(255, 255, 255, 0.03)',
      '--theme-surface-overlay': 'rgba(11, 10, 14, 0.94)',
      '--theme-border': 'rgba(255, 255, 255, 0.08)',
      '--theme-border-subtle': 'rgba(255, 255, 255, 0.04)',
      '--theme-primary': '#a1a1aa',
      '--theme-primary-hover': '#d4d4d8',
      '--theme-text-primary': '#ffffff',
      '--theme-text-secondary': '#e4e4e7',
      '--theme-text-muted': '#a1a1aa',
      '--theme-focus-ring': 'rgba(161, 161, 170, 0.35)',
    },
  },
  {
    id: 'bg-[#3b0d2d]',
    slug: 'mystic-magenta',
    name: 'Mystic Magenta',
    color: '#3b0d2d',
    customColor: '#ec4899',
    neutralColor: '#0b0a0e',
    colorVariant: 'EXPRESSIVE',
    cssVariables: {
      '--theme-bg': '#0b0a0e',
      '--theme-surface': '#141318',
      '--theme-surface-elevated': '#1a1921',
      '--theme-surface-subtle': 'rgba(255, 255, 255, 0.03)',
      '--theme-surface-overlay': 'rgba(11, 10, 14, 0.94)',
      '--theme-border': 'rgba(255, 255, 255, 0.08)',
      '--theme-border-subtle': 'rgba(255, 255, 255, 0.04)',
      '--theme-primary': '#ec4899',
      '--theme-primary-hover': '#f472b6',
      '--theme-text-primary': '#ffffff',
      '--theme-text-secondary': '#e4e4e7',
      '--theme-text-muted': '#a1a1aa',
      '--theme-focus-ring': 'rgba(236, 72, 153, 0.35)',
    },
  },
  {
    id: 'bg-[#0c1a30]',
    slug: 'arctic-navy',
    name: 'Arctic Navy',
    color: '#0c1a30',
    customColor: '#38bdf8',
    neutralColor: '#0b0a0e',
    colorVariant: 'TONAL_SPOT',
    cssVariables: {
      '--theme-bg': '#0b0a0e',
      '--theme-surface': '#141318',
      '--theme-surface-elevated': '#1a1921',
      '--theme-surface-subtle': 'rgba(255, 255, 255, 0.03)',
      '--theme-surface-overlay': 'rgba(11, 10, 14, 0.94)',
      '--theme-border': 'rgba(255, 255, 255, 0.08)',
      '--theme-border-subtle': 'rgba(255, 255, 255, 0.04)',
      '--theme-primary': '#38bdf8',
      '--theme-primary-hover': '#7dd3fc',
      '--theme-text-primary': '#ffffff',
      '--theme-text-secondary': '#e4e4e7',
      '--theme-text-muted': '#a1a1aa',
      '--theme-focus-ring': 'rgba(56, 189, 248, 0.35)',
    },
  },
] as const;

/**
 * Fast lookup map for Stitch themes by ID or Slug.
 */
const THEME_MAP = new Map<string, StitchThemeToken>();
STITCH_THEMES.forEach(t => {
  THEME_MAP.set(t.id, t);
  THEME_MAP.set(t.slug, t);
  THEME_MAP.set(t.color.toLowerCase(), t);
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
export function getThemeVariables(identifier: string): ThemeCssVariables {
  return getThemeToken(identifier).cssVariables;
}
