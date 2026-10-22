import type { Metadata } from "next";
import { Geist, Geist_Mono, Caveat, Lemonada, Bricolage_Grotesque, Instrument_Serif, Plus_Jakarta_Sans, Cairo, Atkinson_Hyperlegible_Next, Atkinson_Hyperlegible_Mono, Charis_SIL } from "next/font/google";
import "./globals.css";
import "./design.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
});

const lemonada = Lemonada({
  variable: "--font-lemonada",
  subsets: ["arabic"],
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  weight: "400",
  subsets: ["latin"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

// Study fonts: Atkinson Hyperlegible (Braille Institute, built for legibility) for the interface and numbers, Charis SIL (an academic book face) for headings and reading
const uiFont = Atkinson_Hyperlegible_Next({ variable: "--font-ui", weight: ["400", "500", "600", "700"], subsets: ["latin"], display: "swap" });
const numFont = Atkinson_Hyperlegible_Mono({ variable: "--font-num", weight: ["400", "500"], subsets: ["latin"], display: "swap" });
const readFont = Charis_SIL({ variable: "--font-read", weight: ["400", "700"], subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Vibe Todos",
  description: "A premium AI-powered todo app.",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${bricolage.variable} ${instrumentSerif.variable} ${plusJakarta.variable} ${cairo.variable} ${lemonada.variable} ${uiFont.variable} ${numFont.variable} ${readFont.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <meta name="darkreader-lock" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                let theme = localStorage.getItem('vibe_bgTheme');
                for (let i = 0; !theme && i < localStorage.length; i++) {
                  const key = localStorage.key(i);
                  if (key && (key.startsWith('bloub_prefs_') || key.endsWith('_bgTheme') || key === 'vibe_bgTheme') && key.includes('bgTheme')) {
                    theme = localStorage.getItem(key);
                    break;
                  }
                }
                if (!theme || !localStorage.getItem('vt_paper_redesign_v1')) theme = 'bg-[#F3EEE3]';
                if (theme && theme !== 'minimal') {
                  document.documentElement.classList.add('dark');
                  document.documentElement.setAttribute('data-theme', theme);
                } else {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.removeAttribute('data-theme');
                }

                try {
                  const vars = JSON.parse(localStorage.getItem('vibe_theme_vars') || 'null');
                  if (vars && theme !== 'bg-[#F3EEE3]') for (const k in vars) document.documentElement.style.setProperty(k, vars[k]);
                } catch (e) {}

                let lang = localStorage.getItem('vibe_language');
                document.documentElement.setAttribute('dir', 'ltr');
                if (lang === 'ar' || (!lang && (navigator.language || '').toLowerCase().startsWith('ar'))) {
                  document.documentElement.setAttribute('lang', 'ar');
                  document.body && document.body.classList.add('font-arabic');
                } else {
                  document.documentElement.setAttribute('lang', 'en');
                  document.body && document.body.classList.remove('font-arabic');
                }
              } catch (e) {
                document.documentElement.classList.add('dark');
                document.documentElement.setAttribute('data-theme', 'bg-[#F3EEE3]');
              }
            `,
          }}
        />
      </head>
      <body className={`antialiased font-sans ${geistSans.variable} ${geistMono.variable} ${caveat.variable} ${lemonada.variable} bg-[#F8FAFC] text-slate-900 dark:bg-[var(--theme-bg,#080b14)] dark:text-gray-100 min-h-screen relative overflow-x-hidden`}>
        <svg aria-hidden="true" width="0" height="0" style={{ position: 'absolute' }}>
          <filter id="pn-rough"><feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="7" /><feDisplacementMap in="SourceGraphic" scale="2.2" /></filter>
          <filter id="pn-ink"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="3" result="n" /><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.6 1.25" result="m" /><feComposite in="SourceGraphic" in2="m" operator="in" result="c" /><feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="11" result="w" /><feDisplacementMap in="c" in2="w" scale="2" /></filter>
        </svg>
        {children}
      </body>
    </html>
  );
}
