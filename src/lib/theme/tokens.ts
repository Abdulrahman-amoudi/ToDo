/**
 * Google Stitch Design Token Matrix & Universal Theme Definitions
 * 
 * Formal design token system adhering to the calibrated 85/10/5 Rule:
 * - 85% Tonal Obsidian Canvas (--theme-bg, near-black with 3-5% atmospheric tint)
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
    surfaceColor: '#101422',
    neutralColor: '#080b14',
    colorVariant: 'TONAL_SPOT',
    cssVariables: {
      '--theme-bg': '#080b14',
      '--theme-surface': '#101422',
      '--theme-surface-elevated': '#171c2f',
      '--theme-surface-subtle': 'rgba(59, 130, 246, 0.06)',
      '--theme-surface-overlay': 'rgba(8, 11, 20, 0.94)',
      '--theme-border': 'rgba(59, 130, 246, 0.14)',
      '--theme-border-subtle': 'rgba(255, 255, 255, 0.05)',
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
    surfaceColor: '#180e22',
    neutralColor: '#0e0714',
    colorVariant: 'VIBRANT',
    cssVariables: {
      '--theme-bg': '#0e0714',
      '--theme-surface': '#180e22',
      '--theme-surface-elevated': '#221430',
      '--theme-surface-subtle': 'rgba(168, 85, 247, 0.06)',
      '--theme-surface-overlay': 'rgba(14, 7, 20, 0.94)',
      '--theme-border': 'rgba(168, 85, 247, 0.16)',
      '--theme-border-subtle': 'rgba(255, 255, 255, 0.05)',
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
    surfaceColor: '#0c1912',
    neutralColor: '#050e09',
    colorVariant: 'TONAL_SPOT',
    cssVariables: {
      '--theme-bg': '#050e09',
      '--theme-surface': '#0c1912',
      '--theme-surface-elevated': '#12241b',
      '--theme-surface-subtle': 'rgba(16, 185, 129, 0.06)',
      '--theme-surface-overlay': 'rgba(5, 14, 9, 0.94)',
      '--theme-border': 'rgba(16, 185, 129, 0.15)',
      '--theme-border-subtle': 'rgba(255, 255, 255, 0.05)',
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
    surfaceColor: '#1c0d12',
    neutralColor: '#12070a',
    colorVariant: 'EXPRESSIVE',
    cssVariables: {
      '--theme-bg': '#12070a',
      '--theme-surface': '#1c0d12',
      '--theme-surface-elevated': '#28141b',
      '--theme-surface-subtle': 'rgba(244, 63, 94, 0.06)',
      '--theme-surface-overlay': 'rgba(18, 7, 10, 0.94)',
      '--theme-border': 'rgba(244, 63, 94, 0.16)',
      '--theme-border-subtle': 'rgba(255, 255, 255, 0.05)',
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
    surfaceColor: '#1a1309',
    neutralColor: '#100b05',
    colorVariant: 'VIBRANT',
    cssVariables: {
      '--theme-bg': '#100b05',
      '--theme-surface': '#1a1309',
      '--theme-surface-elevated': '#261c0d',
      '--theme-surface-subtle': 'rgba(245, 158, 11, 0.06)',
      '--theme-surface-overlay': 'rgba(16, 11, 5, 0.94)',
      '--theme-border': 'rgba(245, 158, 11, 0.16)',
      '--theme-border-subtle': 'rgba(255, 255, 255, 0.05)',
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
    surfaceColor: '#0a1721',
    neutralColor: '#050d13',
    colorVariant: 'EXPRESSIVE',
    cssVariables: {
      '--theme-bg': '#050d13',
      '--theme-surface': '#0a1721',
      '--theme-surface-elevated': '#0f212f',
      '--theme-surface-subtle': 'rgba(6, 182, 212, 0.06)',
      '--theme-surface-overlay': 'rgba(5, 13, 19, 0.94)',
      '--theme-border': 'rgba(6, 182, 212, 0.16)',
      '--theme-border-subtle': 'rgba(255, 255, 255, 0.05)',
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
    surfaceColor: '#1d0c1b',
    neutralColor: '#120710',
    colorVariant: 'VIBRANT',
    cssVariables: {
      '--theme-bg': '#120710',
      '--theme-surface': '#1d0c1b',
      '--theme-surface-elevated': '#291226',
      '--theme-surface-subtle': 'rgba(251, 113, 133, 0.06)',
      '--theme-surface-overlay': 'rgba(18, 7, 16, 0.94)',
      '--theme-border': 'rgba(251, 113, 133, 0.16)',
      '--theme-border-subtle': 'rgba(255, 255, 255, 0.05)',
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
    surfaceColor: '#11190d',
    neutralColor: '#080d06',
    colorVariant: 'TONAL_SPOT',
    cssVariables: {
      '--theme-bg': '#080d06',
      '--theme-surface': '#11190d',
      '--theme-surface-elevated': '#182413',
      '--theme-surface-subtle': 'rgba(132, 204, 22, 0.06)',
      '--theme-surface-overlay': 'rgba(8, 13, 6, 0.94)',
      '--theme-border': 'rgba(132, 204, 22, 0.15)',
      '--theme-border-subtle': 'rgba(255, 255, 255, 0.05)',
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
    surfaceColor: '#131322',
    neutralColor: '#090914',
    colorVariant: 'TONAL_SPOT',
    cssVariables: {
      '--theme-bg': '#090914',
      '--theme-surface': '#131322',
      '--theme-surface-elevated': '#1a1a30',
      '--theme-surface-subtle': 'rgba(99, 102, 241, 0.06)',
      '--theme-surface-overlay': 'rgba(9, 9, 20, 0.94)',
      '--theme-border': 'rgba(99, 102, 241, 0.16)',
      '--theme-border-subtle': 'rgba(255, 255, 255, 0.05)',
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
    surfaceColor: '#190a1f',
    neutralColor: '#0f0612',
    colorVariant: 'EXPRESSIVE',
    cssVariables: {
      '--theme-bg': '#0f0612',
      '--theme-surface': '#190a1f',
      '--theme-surface-elevated': '#240e2b',
      '--theme-surface-subtle': 'rgba(192, 132, 252, 0.06)',
      '--theme-surface-overlay': 'rgba(15, 6, 18, 0.94)',
      '--theme-border': 'rgba(192, 132, 252, 0.16)',
      '--theme-border-subtle': 'rgba(255, 255, 255, 0.05)',
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
    surfaceColor: '#1c1109',
    neutralColor: '#110a05',
    colorVariant: 'TONAL_SPOT',
    cssVariables: {
      '--theme-bg': '#110a05',
      '--theme-surface': '#1c1109',
      '--theme-surface-elevated': '#28190d',
      '--theme-surface-subtle': 'rgba(217, 119, 6, 0.06)',
      '--theme-surface-overlay': 'rgba(17, 10, 5, 0.94)',
      '--theme-border': 'rgba(217, 119, 6, 0.16)',
      '--theme-border-subtle': 'rgba(255, 255, 255, 0.05)',
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
    surfaceColor: '#121419',
    neutralColor: '#0a0b0e',
    colorVariant: 'NEUTRAL',
    cssVariables: {
      '--theme-bg': '#0a0b0e',
      '--theme-surface': '#121419',
      '--theme-surface-elevated': '#1a1d24',
      '--theme-surface-subtle': 'rgba(148, 163, 184, 0.06)',
      '--theme-surface-overlay': 'rgba(10, 11, 14, 0.94)',
      '--theme-border': 'rgba(148, 163, 184, 0.14)',
      '--theme-border-subtle': 'rgba(255, 255, 255, 0.05)',
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
    surfaceColor: '#0a0a0a',
    neutralColor: '#000000',
    colorVariant: 'MONOCHROME',
    cssVariables: {
      '--theme-bg': '#000000',
      '--theme-surface': '#0a0a0a',
      '--theme-surface-elevated': '#141414',
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
    surfaceColor: '#151518',
    neutralColor: '#0c0c0e',
    colorVariant: 'NEUTRAL',
    cssVariables: {
      '--theme-bg': '#0c0c0e',
      '--theme-surface': '#151518',
      '--theme-surface-elevated': '#1e1e23',
      '--theme-surface-subtle': 'rgba(212, 212, 216, 0.06)',
      '--theme-surface-overlay': 'rgba(12, 12, 14, 0.94)',
      '--theme-border': 'rgba(255, 255, 255, 0.10)',
      '--theme-border-subtle': 'rgba(255, 255, 255, 0.04)',
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
    surfaceColor: '#1c0a1e',
    neutralColor: '#110612',
    colorVariant: 'EXPRESSIVE',
    cssVariables: {
      '--theme-bg': '#110612',
      '--theme-surface': '#1c0a1e',
      '--theme-surface-elevated': '#280f2b',
      '--theme-surface-subtle': 'rgba(236, 72, 153, 0.06)',
      '--theme-surface-overlay': 'rgba(17, 6, 18, 0.94)',
      '--theme-border': 'rgba(236, 72, 153, 0.16)',
      '--theme-border-subtle': 'rgba(255, 255, 255, 0.05)',
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
    surfaceColor: '#0c1523',
    neutralColor: '#060c14',
    colorVariant: 'TONAL_SPOT',
    cssVariables: {
      '--theme-bg': '#060c14',
      '--theme-surface': '#0c1523',
      '--theme-surface-elevated': '#121e31',
      '--theme-surface-subtle': 'rgba(56, 189, 248, 0.06)',
      '--theme-surface-overlay': 'rgba(6, 12, 20, 0.94)',
      '--theme-border': 'rgba(56, 189, 248, 0.16)',
      '--theme-border-subtle': 'rgba(255, 255, 255, 0.05)',
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
export function getThemeVariables(identifier: string): ThemeCssVariables {
  return getThemeToken(identifier).cssVariables;
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
