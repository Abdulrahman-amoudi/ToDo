import type { Metadata } from "next";
import { Geist, Geist_Mono, Caveat, Lemonada, Bricolage_Grotesque, Instrument_Serif, Plus_Jakarta_Sans, Cairo, Shippori_Mincho, Zen_Kaku_Gothic_New, Klee_One } from "next/font/google";
import "./globals.css";

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

// Paper Notebook fonts: Japanese stationery faces (mincho titles, gothic body, pencil notes)
const shippori = Shippori_Mincho({ variable: "--font-shippori", weight: ["500", "700", "800"], subsets: ["latin"], display: "swap" });
const zenKaku = Zen_Kaku_Gothic_New({ variable: "--font-zenkaku", weight: ["400", "500", "700"], subsets: ["latin"], display: "swap" });
const klee = Klee_One({ variable: "--font-klee", weight: ["400", "600"], subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Vibe Todos",
  description: "A premium AI-powered todo app.",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${bricolage.variable} ${instrumentSerif.variable} ${plusJakarta.variable} ${cairo.variable} ${lemonada.variable} ${shippori.variable} ${zenKaku.variable} ${klee.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <meta name="darkreader-lock" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                let theme = null;
                for (let i = 0; i < localStorage.length; i++) {
                  const key = localStorage.key(i);
                  if (key && (key.startsWith('bloub_prefs_') || key.endsWith('_bgTheme') || key === 'vibe_bgTheme') && key.includes('bgTheme')) {
                    theme = localStorage.getItem(key);
                    break;
                  }
                }
                if (theme && theme !== 'minimal') {
                  document.documentElement.classList.add('dark');
                  document.documentElement.setAttribute('data-theme', theme);
                } else {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.removeAttribute('data-theme');
                }

                let lang = localStorage.getItem('vibe_language');
                document.documentElement.setAttribute('dir', 'ltr');
                if (lang === 'ar' || (!lang && (navigator.language || '').toLowerCase().startsWith('ar'))) {
                  document.documentElement.setAttribute('lang', 'ar');
                  document.body && document.body.classList.add('font-arabic');
                } else {
                  document.documentElement.setAttribute('lang', 'en');
                  document.body && document.body.classList.remove('font-arabic');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className={`antialiased font-sans ${geistSans.variable} ${geistMono.variable} ${caveat.variable} ${lemonada.variable} bg-[#F8FAFC] text-slate-900 dark:bg-[var(--theme-bg,#080b14)] dark:text-gray-100 min-h-screen relative overflow-x-hidden transition-colors duration-500`}>
        {children}
      </body>
    </html>
  );
}
