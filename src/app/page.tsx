'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BloubMascot from '@/components/BloubMascot';
import { 
  CheckCircle2, Circle, Trash2, Mail, KeyRound, ShieldCheck, Plus, Settings, X, ChevronDown, ChevronRight, 
  Flag, Calendar, BarChart3, ListTodo, Edit2, MoreVertical, Palette, Shapes, 
  PaintBucket, LogOut, Download, Smartphone, Repeat, Bell, Monitor, Flame, 
  Cpu, AlertCircle, Mic, Camera, GraduationCap, BookOpen, Sparkles, Brain, 
  CheckSquare, Layers, FileText, Smile, ArrowLeft, Database, Target, Zap, 
  TrendingUp, Award, Clock, Copy, Check, Eye, EyeOff, Terminal, Crown, ExternalLink, Globe, Languages, Library as LibraryIcon 
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/useLanguage';
import {
  getLocalizedShape,
  getLocalizedExpression,
  getLocalizedThemeName,
  getLocalizedThemeCategory,
} from '@/lib/i18n/translations';
import { STATE_BY_ID, type StateId } from '@/lib/bot/states';
import type { ExpressionId } from '@/lib/bot/expressions';
import { normalizeExpression, normalizeShape, resolveShape, resolveExpression } from '@/constants/mascotRegistry';
import { COLORS } from '@/lib/bot/skins';
import { createClient } from '@/lib/supabase/client';
import { VAPID_PUBLIC_KEY } from '@/lib/push-config';
import type { Todo, Category, ListType, Subtask, Attachment } from '@/types/todo';
import NoteExplorer from '@/components/study/NoteExplorer';
import dynamic from 'next/dynamic';

const NoteViewer = dynamic(() => import('@/components/study/NoteViewer'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center p-8 text-zinc-400 font-mono text-sm animate-pulse">
      Loading Document...
    </div>
  ),
});
const QuizSession = dynamic(() => import('@/components/study/QuizSession'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center p-8 text-zinc-400 font-mono text-sm animate-pulse">
      Loading Quiz Session...
    </div>
  ),
});
const NoteGraph = dynamic(() => import('@/components/study/NoteGraph'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center p-8 text-zinc-400 font-mono text-sm animate-pulse">
      Loading Knowledge Graph...
    </div>
  ),
});
import type { ObsidianNoteSummary, ParsedObsidianNote } from '@/types/obsidian';
import { parseObsidianMarkdown } from '@/lib/obsidian/parser';
import { recordMutation, markMutationSynced, markMutationFailed, type MutationType } from '@/lib/storage/offline-wal';
import { THEMES, THEME_CATEGORIES, getThemeVariables, getThemeToken, type ThemeCategory } from '@/lib/theme/tokens';

const PRIORITY_COLOR = { high: '#ef4444', medium: '#f59e0b', low: '#3b82f6' };
const PRIORITY_LABEL = { high: 'High', medium: 'Medium', low: 'Low' };

const getListMascot = (cat: Category, settings: Record<string, {shape: string, color: string}>, defaultShape = 'squircle', defaultColor = 'bleu') => {
  if (cat.type === 'study') {
    return {
      shape: settings[cat.id]?.shape || 'livre',
      color: settings[cat.id]?.color || defaultColor
    };
  }
  return {
    shape: settings[cat.id]?.shape || defaultShape,
    color: settings[cat.id]?.color || defaultColor
  };
};

const getDynamicMascotProps = (shape: string, baseColor: string, pendingCount: number): { expr: ExpressionId, color: string } => {
  if (pendingCount === 0) {
    if (shape === 'soleil') return { expr: 'hilare', color: baseColor }; 
    if (shape === 'nuage') return { expr: 'heureux', color: baseColor }; 
    if (shape === 'goutte') return { expr: 'heureux', color: baseColor }; 
    return { expr: 'fier', color: baseColor }; // proud by default
  }
  
  if (pendingCount > 4) {
    if (shape === 'soleil') return { expr: 'effraye', color: 'rouge' }; // wide-eyed red sun (overheating!)
    if (shape === 'nuage') return { expr: 'colere', color: 'gris' }; // angry grey storm cloud
    if (shape === 'goutte') return { expr: 'triste', color: 'bleu' }; // crying
    if (shape === 'oeuf') return { expr: 'surpris', color: 'creme' }; // shocked / cracking egg
    return { expr: 'effraye', color: baseColor }; // stressed out
  }
  
  // Normal workload
  return { expr: 'attentif', color: baseColor };
};



const SHAPE_IDS = [
  'soleil',
  'cercle',
  'squircle',
  'galet',
  'capsule',
  'triangle',
  'hexagone',
  'nuage',
  'goutte',
  'livre',
];

const SHAPE_LABELS: Record<string, string> = {
  soleil: 'Sun',
  cercle: 'Circle',
  squircle: 'Squircle',
  galet: 'Pebble',
  capsule: 'Capsule',
  triangle: 'Triangle',
  hexagone: 'Hexagon',
  nuage: 'Cloud',
  goutte: 'Droplet',
  livre: 'Book',
};

const SETTINGS_EXPRESSIONS = [
  'neutral',
  'happy',
  'excited',
  'chill',
  'shy',
  'sleepy',
  'surprised',
  'angry',
  'sad',
  'proud',
] as const;

function isExprSelected(selectedExpr: string | undefined | null, btnExpr: string): boolean {
  const norm = (selectedExpr || '').toLowerCase().trim();
  if (norm === btnExpr) return true;
  if (btnExpr === 'neutral' && (norm === 'neutre' || norm === 'neutral' || norm === 'attentif')) return true;
  if (btnExpr === 'happy' && (norm === 'heureux' || norm === 'happy')) return true;
  if (btnExpr === 'excited' && (norm === 'excite' || norm === 'excited' || norm === 'hilare')) return true;
  if (btnExpr === 'chill' && (norm === 'chill' || norm === 'blase' || norm === 'mefiant')) return true;
  if (btnExpr === 'shy' && (norm === 'shy' || norm === 'timide')) return true;
  if (btnExpr === 'sleepy' && (norm === 'sleepy' || norm === 'somnolent')) return true;
  if (btnExpr === 'surprised' && (norm === 'surpris' || norm === 'surprised')) return true;
  if (btnExpr === 'angry' && (norm === 'colere' || norm === 'angry')) return true;
  if (btnExpr === 'sad' && (norm === 'triste' || norm === 'sad')) return true;
  if (btnExpr === 'proud' && (norm === 'fier' || norm === 'proud')) return true;
  return false;
}

export default function Home() {
  const { locale, setLocale, t: tLang, isRTL } = useLanguage();
  const supabase = createClient();
  const [session, setSession] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const [todos, setTodos] = useState<Todo[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState('default');
  const [activeTab, setActiveTab] = useState<'home' | 'library' | 'quizzes' | 'lists' | 'today' | 'stats' | 'settings'>('home');
  const [inputText, setInputText] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('todo_input_draft') || '';
    }
    return '';
  });
  const [pendingAttachments, setPendingAttachments] = useState<{file: File, type: 'image'|'video'|'audio', previewUrl?: string}[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [newCatText, setNewCatText] = useState('');
  const [newCatType, setNewCatType] = useState<ListType>('todo');
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [themeCategory, setThemeCategory] = useState<ThemeCategory | 'All'>('All');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showShapePicker, setShowShapePicker] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isListView, setIsListView] = useState(true);
  const [isHabit, setIsHabit] = useState(false);
  const [habitDays, setHabitDays] = useState<string[]>([]);
  const [habitFrequency, setHabitFrequency] = useState(1);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  
  // List Context Menu (Long press)
  const [listMenuId, setListMenuId] = useState<string | null>(null);
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editingListName, setEditingListName] = useState('');
  const [editingListType, setEditingListType] = useState<ListType>('todo');
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Study Workflow State
  const [showStudyExplorer, setShowStudyExplorer] = useState(false);
  const [showGraphView, setShowGraphView] = useState(false);
  const [showQuizSession, setShowQuizSession] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('vibe_geminiApiKey') || localStorage.getItem('guest_geminiApiKey') || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
    }
    return process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
  });
  // Email OTP / 2FA Login State & Remember Device
  const [authEmail, setAuthEmail] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('vibe_remembered_email') || '';
    }
    return '';
  });
  const [rememberDevice, setRememberDevice] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('vibe_remember_device') !== 'false';
    }
    return true;
  });
  const [authOtpCode, setAuthOtpCode] = useState('');
  const [authStep, setAuthStep] = useState<'email' | 'otp'>('email');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccessMsg, setAuthSuccessMsg] = useState<string | null>(null);
  const [authCooldown, setAuthCooldown] = useState(0);

  useEffect(() => {
    if (authCooldown <= 0) return;
    const timer = setTimeout(() => setAuthCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [authCooldown]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanEmail = authEmail.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setAuthError('Please enter a valid email address.');
      return;
    }
    setAuthLoading(true);
    setAuthError(null);
    setAuthSuccessMsg(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/api/auth/callback` : undefined
        }
      });
      if (error) throw error;
      setAuthStep('otp');
      setAuthCooldown(30);
      setAuthSuccessMsg(`A login code was sent to ${cleanEmail}.`);
      if (typeof window !== 'undefined') {
        if (rememberDevice) {
          localStorage.setItem('vibe_remembered_email', cleanEmail);
          localStorage.setItem('vibe_remember_device', 'true');
        } else {
          localStorage.removeItem('vibe_remembered_email');
          localStorage.setItem('vibe_remember_device', 'false');
        }
      }
    } catch (err: any) {
      const msg = String(err?.message || '');
      if (
        msg.toLowerCase().includes('rate limit') || 
        msg.toLowerCase().includes('over_email_send_rate_limit') ||
        err?.status === 429
      ) {
        setAuthError('Supabase email limit exceeded (free projects cap OTP emails at 3/hour). Please tap "Continue with Google" below for instant 1-click login without waiting!');
      } else {
        setAuthError(msg || 'Failed to send verification code. Please check your email.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const otpDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const verifyWithFallback = async (tokenToVerify: string) => {
    const cleanEmail = authEmail.trim();
    const token = tokenToVerify.trim();
    if (!token || token.length < 6 || token.length > 8) {
      setAuthError('Please enter the verification code sent to your email.');
      return;
    }
    setAuthLoading(true);
    setAuthError(null);
    try {
      // 1. Try 'email' (for confirmed / existing users)
      let { data, error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token,
        type: 'email'
      });

      // 2. Fallback to 'signup' (crucial: signInWithOtp creates unconfirmed users with 'signup' token type)
      if (error && (error.message?.toLowerCase().includes('invalid') || error.message?.toLowerCase().includes('expired') || error.status === 403 || error.status === 400)) {
        const signupRes = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token,
          type: 'signup'
        });
        if (!signupRes.error && signupRes.data?.session) {
          data = signupRes.data;
          error = null;
        }
      }

      // 3. Fallback to 'magiclink'
      if (error && (error.message?.toLowerCase().includes('invalid') || error.message?.toLowerCase().includes('expired') || error.status === 403 || error.status === 400)) {
        const magicRes = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token,
          type: 'magiclink'
        });
        if (!magicRes.error && magicRes.data?.session) {
          data = magicRes.data;
          error = null;
        }
      }

      if (error) throw error;
      if (data?.session) {
        setSession(data.session);
        if (typeof window !== 'undefined') {
          if (rememberDevice) {
            localStorage.setItem('vibe_remembered_email', cleanEmail);
            localStorage.setItem('vibe_remember_device', 'true');
            try {
              localStorage.setItem('vibe_persisted_session', JSON.stringify({
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token,
                user_id: data.session.user?.id,
                savedAt: Date.now(),
              }));
            } catch {}
          } else {
            localStorage.removeItem('vibe_remembered_email');
            localStorage.removeItem('vibe_persisted_session');
            localStorage.setItem('vibe_remember_device', 'false');
          }
        }
      }
    } catch (err: any) {
      setAuthError(err.message || 'Invalid or expired code. Please enter the full code or tap "Sign In Instantly" in your email.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (otpDebounceRef.current) clearTimeout(otpDebounceRef.current);
    await verifyWithFallback(authOtpCode);
  };

  const [selectedNote, setSelectedNote] = useState<ParsedObsidianNote | null>(null);
  const [isFetchingNote, setIsFetchingNote] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    let rafId: number | null = null;
    const handleScroll = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        if (currentScrollY > lastScrollY.current + 10) {
          setIsNavVisible(false);
        } else if (currentScrollY < lastScrollY.current - 10) {
          setIsNavVisible(true);
        }
        // Keep it visible if near the top
        if (currentScrollY < 50) {
          setIsNavVisible(true);
        }
        lastScrollY.current = currentScrollY;
        rafId = null;
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Auth Effect with bulletproof Remember This Device persistence
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }: any) => {
      const session = data?.session;
      if (!session && typeof window !== 'undefined' && localStorage.getItem('vibe_remember_device') !== 'false') {
        const cached = localStorage.getItem('vibe_persisted_session');
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed.refresh_token) {
              const { data: refreshedData } = await supabase.auth.setSession({
                access_token: parsed.access_token,
                refresh_token: parsed.refresh_token,
              });
              if (refreshedData?.session) {
                setSession(refreshedData.session);
                setLoadingAuth(false);
                return;
              }
            }
          } catch (e) {
            console.warn('Persisted session restore error:', e);
          }
        }
      }
      setSession(session);
      setLoadingAuth(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      setSession(session);
      if (typeof window !== 'undefined') {
        if (session && localStorage.getItem('vibe_remember_device') !== 'false') {
          try {
            localStorage.setItem('vibe_persisted_session', JSON.stringify({
              access_token: session.access_token,
              refresh_token: session.refresh_token,
              user_id: session.user?.id,
              savedAt: Date.now(),
            }));
          } catch {}
        } else if (event === 'SIGNED_OUT') {
          localStorage.removeItem('vibe_persisted_session');
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  // Gesture / Back Button Trap for PWAs
  const viewStateRef = useRef({ isListView, showSettings, showAddModal, activeTab });
  viewStateRef.current = { isListView, showSettings, showAddModal, activeTab };

  useEffect(() => {
    window.history.pushState('home', '');
    const handlePopState = () => {
      const s = viewStateRef.current;
      if (!s.isListView || s.showSettings || s.showAddModal || s.activeTab !== 'home') {
        setIsListView(true);
        setShowSettings(false);
        setShowAddModal(false);
        setSelectedNote(null);
        setShowQuizSession(false);
        setActiveTab('home');
        window.history.pushState('home', '');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Settings Target
  const [settingsTarget, setSettingsTarget] = useState<string>('global');

  // Settings
  const [bgTheme, setBgTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('vibe_bgTheme') || localStorage.getItem('guest_bgTheme') || 'bg-[#F3EEE3]';
    }
    return 'bg-[#F3EEE3]';
  });
  const [catSettings, setCatSettings] = useState<Record<string, {shape: string, color: string, expression?: string}>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('vibe_catSettings') || localStorage.getItem('guest_catSettings');
        return raw ? JSON.parse(raw) : {};
      } catch {}
    }
    return {};
  });

  // Global Mascot - Persistent Customization Settings (saved to storage)
  const [mascotShape, setMascotShape] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('vibe_mascotShape') || localStorage.getItem('guest_mascotShape') || 'soleil';
    }
    return 'soleil';
  });
  const [mascotColor, setMascotColor] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('vibe_mascotColor') || localStorage.getItem('guest_mascotColor') || 'ambre';
    }
    return 'ambre';
  });
  const [mascotExpression, setMascotExpression] = useState<ExpressionId>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('vibe_mascotExpression') || localStorage.getItem('guest_mascotExpression') || 'timide') as ExpressionId;
    }
    return 'timide';
  });
  const [mascotGaze, setMascotGaze] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('vibe_mascotGaze') || localStorage.getItem('guest_mascotGaze') || 'center';
    }
    return 'center';
  });
  const [settingsLoaded, setSettingsLoaded] = useState(true);

  // Settings UI transient states
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const [copiedCli, setCopiedCli] = useState(false);

  const handleCopyCli = useCallback(() => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText('.\\install-todo-skill.ps1');
      setCopiedCli(true);
      setTimeout(() => setCopiedCli(false), 2000);
    }
  }, []);

  const handleSaveApiKey = useCallback(() => {
    try {
      localStorage.setItem('vibe_geminiApiKey', geminiApiKey);
      localStorage.setItem('guest_geminiApiKey', geminiApiKey);
      if (session?.user?.id) {
        localStorage.setItem(`bloub_prefs_${session.user.id}_geminiApiKey`, geminiApiKey);
      }
    } catch {}
    if (session) {
      supabase.auth.updateUser({ data: { geminiApiKey } }).catch(console.error);
    }
    setApiKeySaved(true);
    setTimeout(() => setApiKeySaved(false), 2000);
  }, [geminiApiKey, session]);

  // Reactive Auto-Mood Engine & Stats Vault State
  const [autoMoodEnabled, setAutoMoodEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('vibe_autoMood');
      return stored !== null ? stored === 'true' : true;
    }
    return true;
  });
  const [vaultNotes, setVaultNotes] = useState<ObsidianNoteSummary[]>([]);
  const [hoveredHeatmapDay, setHoveredHeatmapDay] = useState<{ date: string; count: number; label: string } | null>(null);

  const updateAutoMood = useCallback((enabled: boolean) => {
    setAutoMoodEnabled(enabled);
    try {
      localStorage.setItem('vibe_autoMood', enabled ? 'true' : 'false');
      if (session?.user?.id) {
        localStorage.setItem(`bloub_prefs_${session.user.id}_autoMood`, enabled ? 'true' : 'false');
      }
    } catch {}
  }, [session?.user?.id]);

  // Transient Mascot Animation Reactions (ephemeral, never auto-saved)
  const [animState, setAnimState] = useState<StateId>('idle');
  const [animExpression, setAnimExpression] = useState<ExpressionId | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Backward compatibility alias
  const mascotState = animState;
  const setMascotState = setAnimState;

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstallPrompt(null);
      }
    } else {
      setShowInstallGuide(true);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && session) {
      navigator.serviceWorker.ready.then(async (registration) => {
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      }).catch(err => console.warn('SW Ready Error:', err));
    }
  }, [session]);

  const handlePushToggle = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Push notifications are not supported on this browser.');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      if (isSubscribed) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
          setIsSubscribed(false);
        }
      } else {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          alert('Notification permission denied.');
          return;
        }

        const urlBase64ToUint8Array = (base64String: string) => {
          const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
          const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
          const rawData = window.atob(base64);
          const outputArray = new Uint8Array(rawData.length);
          for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
          }
          return outputArray;
        };

        const subscribeOptions = {
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        };

        const subscription = await registration.pushManager.subscribe(subscribeOptions);
        
        const res = await fetch('/api/push-subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription })
        });

        if (res.ok) {
          setIsSubscribed(true);
          triggerMascot('wink', 'heureux');
        } else {
          alert('Failed to save subscription to server.');
        }
      }
    } catch (err: any) {
      console.error(err);
      alert('Error setting up push notifications: ' + err.message);
    }
  };

  const sendTestPush = async () => {
    try {
      const res = await fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Vibe Todos',
          body: 'Your mobile push notifications are fully configured!'
        })
      });
      if (res.ok) {
        triggerMascot('wink', 'heureux');
      } else {
        alert('Failed to send test push.');
      }
    } catch (err: any) {
      alert('Error sending test push: ' + err.message);
    }
  };

  // User-Scoped Preferences & Cloud Sync (0ms Optimistic UI + Write-Behind Sync)
  const hasHydratedRemoteSettingsRef = useRef(false);
  const isPrefsDirtyRef = useRef(false);
  const lastLocalPrefsUpdateRef = useRef(0);
  const pendingPrefsSyncRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!session) {
      hasHydratedRemoteSettingsRef.current = false;
      return;
    }
    // Prevent Stale Overwrites:
    // While isPrefsDirtyRef.current === true or within 2000ms of any local click,
    // ignore incoming Supabase session fetches so slow network never reverts user's fresh choice!
    if (isPrefsDirtyRef.current || (Date.now() - lastLocalPrefsUpdateRef.current < 2000)) {
      return;
    }

    const uid = session.user?.id;
    if (!uid) return;
    const prefKey = (key: string) => `bloub_prefs_${uid}_${key}`;
    const meta = session.user?.user_metadata || {};

    // 1. Remote Supabase metadata is the single source of truth across devices
    // Check remote first, fallback to user-scoped localStorage, fallback to initial default
    let effectiveTheme = meta.bgTheme || localStorage.getItem(prefKey('bgTheme')) || 'bg-[#F3EEE3]';
    // One-time switch to the 2026 Paper Notebook redesign (users can pick any old theme again in Settings)
    try {
      if (!localStorage.getItem('vt_paper_redesign_v1')) {
        effectiveTheme = 'bg-[#F3EEE3]';
        localStorage.setItem('vt_paper_redesign_v1', '1');
      }
    } catch {}
    const effectiveShape = meta.mascotShape || localStorage.getItem(prefKey('mascotShape')) || 'squircle';
    const effectiveColor = meta.mascotColor || localStorage.getItem(prefKey('mascotColor')) || 'bleu';
    const effectiveExpr = (meta.mascotExpression || localStorage.getItem(prefKey('mascotExpression')) || 'timide') as ExpressionId;
    const effectiveGaze = meta.mascotGaze || localStorage.getItem(prefKey('mascotGaze')) || 'center';

    let effectiveCat = {};
    if (meta.catSettings) {
      effectiveCat = typeof meta.catSettings === 'string' ? JSON.parse(meta.catSettings) : meta.catSettings;
    } else {
      try {
        const local = localStorage.getItem(prefKey('catSettings'));
        if (local) effectiveCat = JSON.parse(local);
      } catch {}
    }

    const effectiveApiKey = meta.geminiApiKey || localStorage.getItem(prefKey('geminiApiKey')) || '';

    // Apply to React state
    setBgTheme(effectiveTheme);
    setMascotShape(effectiveShape);
    setMascotColor(effectiveColor);
    setMascotExpression(effectiveExpr);
    setMascotGaze(effectiveGaze);
    if (Object.keys(effectiveCat).length > 0) setCatSettings(effectiveCat);
    if (effectiveApiKey) setGeminiApiKey(effectiveApiKey);

    // Save to user-scoped localStorage
    try {
      localStorage.setItem(prefKey('bgTheme'), effectiveTheme);
      localStorage.setItem(prefKey('mascotShape'), effectiveShape);
      localStorage.setItem(prefKey('mascotColor'), effectiveColor);
      localStorage.setItem(prefKey('mascotExpression'), effectiveExpr);
      localStorage.setItem(prefKey('mascotGaze'), effectiveGaze);
      localStorage.setItem(prefKey('catSettings'), JSON.stringify(effectiveCat));
      if (effectiveApiKey) localStorage.setItem(prefKey('geminiApiKey'), effectiveApiKey);
      localStorage.setItem(`bloub_prefs_${uid}`, JSON.stringify({
        bgTheme: effectiveTheme,
        mascotShape: effectiveShape,
        mascotColor: effectiveColor,
        mascotExpression: effectiveExpr,
        mascotGaze: effectiveGaze,
        catSettings: effectiveCat,
        updatedAt: Date.now()
      }));
    } catch {}

    // Mark hydrated so we don't accidentally overwrite remote preferences with blank defaults!
    hasHydratedRemoteSettingsRef.current = true;
  }, [session]);

  // Sync tab visibility without destructive network overwrites
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && session?.user?.id) {
        if (isPrefsDirtyRef.current || (Date.now() - lastLocalPrefsUpdateRef.current < 2000)) {
          return;
        }
        try {
          const uid = session.user.id;
          const prefKey = (key: string) => `bloub_prefs_${uid}_${key}`;
          const savedTheme = localStorage.getItem(prefKey('bgTheme'));
          if (savedTheme && savedTheme !== bgTheme) setBgTheme(savedTheme);
          const savedShape = localStorage.getItem(prefKey('mascotShape'));
          if (savedShape && savedShape !== mascotShape) setMascotShape(savedShape);
          const savedColor = localStorage.getItem(prefKey('mascotColor'));
          if (savedColor && savedColor !== mascotColor) setMascotColor(savedColor);
          const savedGaze = localStorage.getItem(prefKey('mascotGaze'));
          if (savedGaze && savedGaze !== mascotGaze) setMascotGaze(savedGaze);
        } catch {}
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [bgTheme, mascotShape, mascotColor, mascotGaze, session]);

  // Save persistent customization settings (0ms user-scoped localStorage + 400ms debounced Supabase sync)
  useEffect(() => {
    // 0. Synchronous guest / general localStorage write (0ms)
    try {
      localStorage.setItem('vibe_mascotExpression', mascotExpression);
      localStorage.setItem('vibe_mascotShape', mascotShape);
      localStorage.setItem('vibe_mascotColor', mascotColor);
      localStorage.setItem('vibe_mascotGaze', mascotGaze);
      localStorage.setItem('vibe_bgTheme', bgTheme);
      localStorage.setItem('vibe_catSettings', JSON.stringify(catSettings));
    } catch (e) {}

    if (!session || !hasHydratedRemoteSettingsRef.current) return;
    const uid = session.user?.id;
    if (!uid) return;
    const prefKey = (key: string) => `bloub_prefs_${uid}_${key}`;

    // 1. Immediate synchronous user-scoped localStorage write (0ms)
    try {
      localStorage.setItem(prefKey('mascotExpression'), mascotExpression);
      localStorage.setItem(prefKey('mascotShape'), mascotShape);
      localStorage.setItem(prefKey('mascotColor'), mascotColor);
      localStorage.setItem(prefKey('mascotGaze'), mascotGaze);
      localStorage.setItem(prefKey('bgTheme'), bgTheme);
      localStorage.setItem(prefKey('catSettings'), JSON.stringify(catSettings));
      if (geminiApiKey) localStorage.setItem(prefKey('geminiApiKey'), geminiApiKey);
      localStorage.setItem(`bloub_prefs_${uid}`, JSON.stringify({
        mascotExpression,
        mascotShape,
        mascotColor,
        mascotGaze,
        bgTheme,
        catSettings,
        geminiApiKey,
        updatedAt: Date.now()
      }));
    } catch (e) {
      console.warn('[Settings] localStorage write warning:', e);
    }
    
    // 2. Debounced background Supabase sync (400ms delay)
    if (pendingPrefsSyncRef.current) clearTimeout(pendingPrefsSyncRef.current);
    pendingPrefsSyncRef.current = setTimeout(async () => {
      try {
        await supabase.auth.updateUser({
          data: {
            mascotExpression,
            mascotShape,
            mascotColor,
            mascotGaze,
            bgTheme,
            catSettings,
            geminiApiKey,
            prefsUpdatedAt: Date.now()
          }
        });
        isPrefsDirtyRef.current = false;
      } catch (err) {
        console.warn('[Settings] Supabase sync error:', err);
      }
    }, 400);
  }, [mascotExpression, mascotShape, mascotColor, mascotGaze, bgTheme, catSettings, geminiApiKey, session]);

  useEffect(() => {
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      document.head.appendChild(meta);
    }
    const activeTheme = THEMES.find(t => t.id === bgTheme);
    const themeBg = activeTheme ? (activeTheme.bgColor || '#080b14') : '#080b14';
    meta.setAttribute('content', themeBg);
    
    if (bgTheme !== 'minimal') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', bgTheme);
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.removeAttribute('data-theme');
    }

    try {
      const vars = getThemeVariables(bgTheme);
      if (vars) {
        Object.entries(vars).forEach(([prop, val]) => {
          document.documentElement.style.setProperty(prop, val);
        });
        try { localStorage.setItem('vibe_theme_vars', JSON.stringify(vars)); } catch {}
      }
    } catch (e) {
      console.warn('Failed to set theme variables:', e);
    }
  }, [bgTheme, session]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const resetAFK = () => {
      clearTimeout(timeout);
      if (animState === 'sleep') {
        setAnimState('idle');
        setAnimExpression(null);
      }
      timeout = setTimeout(() => {
        setAnimState('sleep');
        setAnimExpression('somnolent');
      }, 15000);
    };
    window.addEventListener('mousemove', resetAFK);
    window.addEventListener('keydown', resetAFK);
    window.addEventListener('touchstart', resetAFK);
    resetAFK();
    return () => {
      window.removeEventListener('mousemove', resetAFK);
      window.removeEventListener('keydown', resetAFK);
      window.removeEventListener('touchstart', resetAFK);
      clearTimeout(timeout);
    };
  }, [animState]);

  const resetToIdle = useCallback((currentState?: StateId) => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    const targetState = currentState ?? animState;
    const durationSec = STATE_BY_ID.get(targetState)?.duration ?? 2.4;
    idleTimerRef.current = setTimeout(() => {
      setAnimState('idle');
      setAnimExpression(null);
    }, durationSec * 1000);
  }, [animState]);

  const triggerMascot = useCallback((state: StateId, expr: ExpressionId, persist?: boolean) => {
    setAnimState(state);
    setAnimExpression(expr);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

    if (!persist) {
      const durationSec = STATE_BY_ID.get(state)?.duration ?? 2.4;
      idleTimerRef.current = setTimeout(() => {
        setAnimState('idle');
        setAnimExpression(null);
      }, durationSec * 1000);
    }
  }, []);

  const handleSelectNote = async (noteSummary: ObsidianNoteSummary | { note: ObsidianNoteSummary }) => {
    const target = (noteSummary as any)?.note || noteSummary;
    const relPath = target?.relativePath || target?.path || target?.id;
    if (!relPath) {
      console.warn('Cannot select note without relative path:', noteSummary);
      setIsFetchingNote(false);
      return;
    }
    setIsFetchingNote(true);
    triggerMascot('thinking', 'curieux');
    try {
      const res = await fetch('/api/obsidian/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notePath: relPath })
      });
      const data = await res.json();
      if (res.ok && data.note) {
        setSelectedNote(data.note);
        triggerMascot('idle', 'heureux');
      } else {
        triggerMascot('alert', 'mefiant');
        alert('Failed to load note: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      triggerMascot('alert', 'triste');
    } finally {
      setIsFetchingNote(false);
    }
  };

  const handleUpdateNote = useCallback(async (updatedContent: string) => {
    if (!selectedNote) return;

    const parsed = parseObsidianMarkdown(
      updatedContent,
      selectedNote.relativePath || selectedNote.id,
      selectedNote.absolutePath
    );

    const updatedNote: ParsedObsidianNote = {
      ...selectedNote,
      ...parsed,
      id: selectedNote.id,
      title: parsed.title || selectedNote.title,
      folder: selectedNote.folder || parsed.folder,
      relativePath: selectedNote.relativePath || parsed.relativePath,
      rawContent: updatedContent,
      bodyContent: parsed.bodyContent
    };

    setSelectedNote(updatedNote);

    const notePayload = {
      userId: session?.user?.id,
      notes: [{
        title: updatedNote.title,
        path: (updatedNote as any).path || updatedNote.relativePath || updatedNote.id,
        content: updatedContent,
        folder: updatedNote.folder,
        tags: updatedNote.tags,
        word_count: updatedNote.wordCount || updatedContent.split(/\s+/).length
      }]
    };

    let walId: string | null = null;
    try {
      walId = await recordMutation({
        type: 'UPDATE_NOTE',
        payload: notePayload
      });
    } catch (walErr) {
      console.warn('[OfflineWAL] Failed to record note mutation in handleUpdateNote:', walErr);
    }

    try {
      const res = await fetch('/api/obsidian/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notePayload)
      });
      if (res.ok && walId) {
        await markMutationSynced(walId);
      } else if (!res.ok && walId) {
        await markMutationFailed(walId, `HTTP ${res.status}`);
      }
    } catch (e: any) {
      console.error('Failed to save note update', e);
      if (walId) {
        await markMutationFailed(walId, e?.message || 'Network error');
      }
    }
  }, [selectedNote, session?.user?.id]);

  const fetchTodos = async () => {
    if (!session) return;
    const res = await fetch('/api/data');
    if (res.status === 401) return;
    const data = await res.json();
    
    // Auto-clear logic: Clear completed tasks (non-habit) every 12 hours
    const uid = session.user.id;
    const lastClear = localStorage.getItem(`${uid}_lastClear`);
    const now = Date.now();
    const twelveHours = 12 * 60 * 60 * 1000;
    
    let currentTodos = data.todos;
    
    if (!lastClear || now - parseInt(lastClear) > twelveHours) {
      const hasCompleted = currentTodos.some((t: any) => t.completed && !t.isHabit);
      if (hasCompleted) {
        await fetch('/api/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'CLEAR_COMPLETED' })
        });
        currentTodos = currentTodos.filter((t: any) => !t.completed || t.isHabit);
      }
      localStorage.setItem(`${uid}_lastClear`, now.toString());
    }

    setTodos(currentTodos);
    
    let cats = data.categories || [];
    if (!cats.find((c: any) => c.id === 'default')) {
      cats = [{ id: 'default', name: 'General', type: 'todo' as ListType }, ...cats];
    }
    // Merge localStorage fallback types (for when DB column doesn't exist yet)
    const storedTypes = session?.user?.user_metadata?.listTypes || JSON.parse(localStorage.getItem(session?.user?.id + '_listTypes') || '{}');
    cats = cats.map((c: any) => {
      const dbType = c.type === 'study' ? 'study' : undefined;
      const localType = storedTypes[c.id];
      return { ...c, type: (dbType || localType || 'todo') as ListType };
    });
    setCategories(cats);
  };

  useEffect(() => {
    if (session) {
      fetchTodos();
    }
  }, [session]);

  const mutate = async (body: any) => {
    if (!session) return;

    // Durable Offline WAL logging before network fetch
    const mutationType: MutationType = body?.type?.includes('CATEGORY') ? 'MUTATE_CATEGORY' : 'MUTATE_TODO';
    let walId: string | null = null;
    try {
      walId = await recordMutation({
        type: mutationType,
        payload: body
      });
    } catch (walErr) {
      console.warn('[OfflineWAL] Failed to record mutation in mutate():', walErr);
    }

    try {
      const res = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.status === 401) return;
      if (!res.ok) {
        if (walId) await markMutationFailed(walId, `HTTP ${res.status}: ${res.statusText}`);
        return;
      }

      if (walId) {
        await markMutationSynced(walId);
      }

      const data = await res.json();
      setTodos(data.todos);
      
      let cats = data.categories || [];
      if (!cats.find((c: any) => c.id === 'default')) {
        cats = [{ id: 'default', name: 'General', type: 'todo' as ListType }, ...cats];
      }
      const storedTypes2 = session?.user?.user_metadata?.listTypes || JSON.parse(localStorage.getItem(session?.user?.id + '_listTypes') || '{}');
      cats = cats.map((c: any) => {
        const dbType = c.type === 'study' ? 'study' : undefined;
        const localType = storedTypes2[c.id];
        return { ...c, type: (dbType || localType || 'todo') as ListType };
      });
      setCategories(cats);
      
      return data;
    } catch (err: any) {
      console.warn('[mutate] Network request failed, mutation queued in offline WAL:', err);
      if (walId) {
        await markMutationFailed(walId, err?.message || 'Network error');
      }
    }
  };

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSubmitting) {
      triggerMascot('idle', 'mefiant');
      return;
    }
    setIsSubmitting(true);
    triggerMascot('wide', 'surpris');
    
    const uploadedAttachments: Attachment[] = [];
    if (pendingAttachments.length > 0) {
      for (const att of pendingAttachments) {
        const fileExt = att.file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { data, error } = await supabase.storage.from('media').upload(fileName, att.file);
        
        if (!error && data) {
          const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(fileName);
          uploadedAttachments.push({ type: att.type, url: publicUrl, name: att.file.name });
        }
      }
    }

    await mutate({ 
      type: 'ADD_TODO', 
      text: inputText, 
      categoryId: activeCategory,
      isHabit,
      habitFrequency,
      habitDays,
      attachments: uploadedAttachments
    });
    setInputText('');
    try {
      localStorage.removeItem('todo_input_draft');
    } catch {}
    setPendingAttachments([]);
    setIsHabit(false);
    setHabitDays([]);
    setHabitFrequency(1);
    setShowAddModal(false);
    setIsSubmitting(false);
  };

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      triggerMascot('idle', 'heureux');
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];
        
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };
        
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const file = new File([audioBlob], `voice-note-${Date.now()}.webm`, { type: 'audio/webm' });
          setPendingAttachments(prev => [...prev, { file, type: 'audio' }]);
          stream.getTracks().forEach(t => t.stop());
        };
        
        mediaRecorder.start();
        setIsRecording(true);
        triggerMascot('wide', 'surpris');
      } catch (err) {
        alert('Microphone permission denied.');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newAtts = files.map(file => ({
        file,
        type: file.type.startsWith('video/') ? 'video' as const : 'image' as const,
        previewUrl: URL.createObjectURL(file)
      }));
      setPendingAttachments(prev => [...prev, ...newAtts]);
    }
  };

  const addCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatText.trim() || isSubmitting) return;
    setIsSubmitting(true);
    triggerMascot('idle', 'heureux');
    const newId = Date.now().toString();
    // Optimistically add to local state with the correct type
    setCategories(prev => [...prev, { id: newId, name: newCatText.trim(), type: newCatType }]);
    // Persist type to localStorage as fallback
    const storedTypes = session?.user?.user_metadata?.listTypes || JSON.parse(localStorage.getItem(session?.user?.id + '_listTypes') || '{}');
    storedTypes[newId] = newCatType;
    localStorage.setItem(session?.user?.id + '_listTypes', JSON.stringify(storedTypes)); supabase.auth.updateUser({ data: { listTypes: storedTypes } }).catch(console.error);
    await mutate({ 
      type: 'ADD_CATEGORY', 
      name: newCatText.trim(),
      categoryType: newCatType,
      listType: newCatType
    });
    setNewCatText('');
    setNewCatType('todo');
    setIsSubmitting(false);
  };

  const deleteCategory = async (id: string) => {
    if (id === 'default') return;
    if (confirm('Delete this list?')) {
      triggerMascot('idle', 'triste');
      setCategories(categories.filter(c => c.id !== id));
      if (activeCategory === id) setActiveCategory('default');
      await mutate({ type: 'DELETE_CATEGORY', id });
    }
    setListMenuId(null);
  };
  
  const saveCategory = async (id: string) => {
    if (!editingListName.trim() || isSubmitting) return;
    setIsSubmitting(true);
    await mutate({ 
      type: 'UPDATE_CATEGORY', 
      id, 
      name: editingListName.trim(),
      categoryType: editingListType,
      listType: editingListType
    });
    setEditingListId(null);
    setListMenuId(null);
    setIsSubmitting(false);
  };

  const handleCategoryPressIn = (cat: Category) => {
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    pressTimerRef.current = setTimeout(() => {
      setListMenuId(cat.id);
      setEditingListType(cat.type || 'todo');
      triggerMascot('alert', 'curieux');
    }, 500); // 500ms long press
  };

  const handleCategoryPressOut = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  };

  const handleCategoryClick = (cat: Category) => {
    if (listMenuId === cat.id || editingListId === cat.id) return;
    setActiveCategory(cat.id);
    setIsListView(false);
    triggerMascot('alert', 'excite');
  };

  const incrementHabit = async (todo: Todo) => {
    const currentCount = todo.habitCompletedCount || 0;
    const freq = todo.habitFrequency || 1;
    const isNextCompleted = currentCount + 1 >= freq;
    
    // Optimistic UI updates
    const updatedTodos = todos.map(t => t.id === todo.id ? { 
      ...t, 
      habitCompletedCount: todo.completed ? 0 : currentCount + 1,
      completed: todo.completed ? false : isNextCompleted
    } : t);
    setTodos(updatedTodos);

    if (todo.completed) {
      triggerMascot('idle', 'neutre');
    } else if (isNextCompleted) {
      triggerMascot('idle', 'fier');
      setTimeout(() => triggerMascot('idle', 'heureux'), 2500);
    } else {
      triggerMascot('wink', 'heureux');
      resetToIdle();
    }

    await mutate({ 
      type: 'INCREMENT_HABIT', 
      id: todo.id,
      newCount: todo.completed ? 0 : currentCount + 1,
      isCompleted: todo.completed ? false : isNextCompleted
    });
  };

  const toggleTodo = async (id: string, completed: boolean) => {
    const newCompleted = !completed;
    const updatedTodos = todos.map(t => t.id === id ? { ...t, completed: newCompleted } : t);
    setTodos(updatedTodos);

    if (newCompleted) {
      const allDone = updatedTodos.filter(t => t.categoryId === activeCategory).every(t => t.completed);
      if (allDone) {
        triggerMascot('idle', 'fier');
        setTimeout(() => triggerMascot('idle', 'heureux'), 2500);
      } else {
        triggerMascot('wink', 'heureux');
        resetToIdle();
      }
    } else {
      triggerMascot('idle', 'neutre');
    }

    await mutate({ type: 'TOGGLE_TODO', id, completed: newCompleted });
  };

  const deleteTodo = async (id: string) => {
    triggerMascot('comet', 'triste');
    setTodos(todos.filter(t => t.id !== id));
    await mutate({ type: 'DELETE_TODO', id });
    setTimeout(() => triggerMascot('idle', 'neutre'), 2500);
  };

  const filteredTodos = todos.filter(t => {
    if (activeTab === 'lists') return t.categoryId === activeCategory;
    if (activeTab === 'today') {
      if (!t.dueDate) return false;
      const due = new Date(t.dueDate);
      const today = new Date();
      return due.toDateString() === today.toDateString() || due < today;
    }
    return false;
  });
  const completedCount = filteredTodos.filter(t => t.completed).length;
  const totalCount = filteredTodos.length;

  const activeCatObj: Category = categories.find(c => c.id === activeCategory) || { id: 'default', name: 'General', type: 'todo' };

  // Reactive Auto-Mood Engine: Adapts mood based on study mode, completion rates & pending tasks
  const computeReactiveMood = useCallback((): ExpressionId => {
    if (!autoMoodEnabled) {
      return (catSettings[activeCategory]?.expression as ExpressionId) || mascotExpression || 'neutre';
    }
    // 1. Inside PDF Reader or Study Workspace -> attentif (Focused)
    if (selectedNote || (!isListView && activeTab === 'lists' && activeCatObj?.type === 'study')) {
      return 'attentif';
    }
    const totalTasks = todos.length;
    const completedTasks = todos.filter(t => t.completed).length;
    const pendingTasks = totalTasks - completedTasks;

    // 2. 100% of Today's tasks completed -> fier (Proud)
    if (totalTasks > 0 && pendingTasks === 0) {
      return 'fier';
    }
    // 3. 0 tasks completed with pending tasks waiting -> curieux
    if (completedTasks === 0 && pendingTasks > 0) {
      return 'curieux';
    }
    // 4. In progress -> heureux / attentif
    if (completedTasks > 0 && pendingTasks > 0) {
      return completedTasks >= pendingTasks ? 'heureux' : 'attentif';
    }
    return 'neutre';
  }, [autoMoodEnabled, selectedNote, isListView, activeTab, activeCatObj?.type, todos, catSettings, activeCategory, mascotExpression]);

  // Fetch Vault Notes for Bento Stats & Study Breakdown
  useEffect(() => {
    if (!session?.user?.id) {
      setVaultNotes([]);
      return;
    }
    if (activeTab === 'stats' || activeTab === 'home' || activeTab === 'quizzes' || (activeTab === 'lists' && !isListView && activeCatObj?.type === 'study')) {
      const params = new URLSearchParams();
      params.set('userId', session.user.id);
      fetch(`/api/obsidian/notes?${params.toString()}`)
        .then(res => res.json())
        .then(data => {
          if (data?.notes && Array.isArray(data.notes)) {
            setVaultNotes(data.notes);
          } else {
            setVaultNotes([]);
          }
        })
        .catch(err => {
          console.warn('Vault notes fetch for stats/study:', err);
          setVaultNotes([]);
        });
    }
  }, [activeTab, isListView, activeCatObj?.type, session?.user?.id]);

  // Study Streak Calculation
  const studyStreak = useMemo(() => {
    const habitStreaks = todos.filter(t => t.isHabit && t.habitStreak).map(t => t.habitStreak || 0);
    const maxHabit = habitStreaks.length > 0 ? Math.max(...habitStreaks) : 0;
    
    const dates = new Set<string>();
    todos.forEach(t => {
      if (t.completed && t.created_at) dates.add(t.created_at.split('T')[0]);
      if (t.habitLastCompleted) dates.add(t.habitLastCompleted.split('T')[0]);
    });
    
    const today = new Date();
    let currentStreak = 0;
    for (let i = 0; i < 90; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const k = d.toISOString().split('T')[0];
      if (dates.has(k)) {
        currentStreak++;
      } else if (i === 0) {
        continue;
      } else {
        break;
      }
    }
    return Math.max(currentStreak, maxHabit);
  }, [todos]);

  // Focus Score (%)
  const focusScore = useMemo(() => {
    if (todos.length === 0) return 100;
    const completed = todos.filter(t => t.completed).length;
    return Math.min(100, Math.round((completed / todos.length) * 100));
  }, [todos]);

  // Vault words indexed
  const totalVaultWords = useMemo(() => {
    return vaultNotes.reduce((acc, n) => acc + (n.wordCount || 0), 0);
  }, [vaultNotes]);

  // Vault PDFs indexed
  const totalVaultPdfs = useMemo(() => {
    return vaultNotes.filter(n => n.title.toLowerCase().endsWith('.pdf') || n.relativePath?.toLowerCase().endsWith('.pdf')).length;
  }, [vaultNotes]);

  // 90-Day (12-Week) Activity Heatmap
  const heatmapData = useMemo(() => {
    const actMap = new Map<string, number>();
    todos.forEach(t => {
      if (t.completed) {
        const d = (t.created_at || new Date().toISOString()).split('T')[0];
        actMap.set(d, (actMap.get(d) || 0) + 1);
      }
      if (t.habitLastCompleted) {
        const d = t.habitLastCompleted.split('T')[0];
        actMap.set(d, (actMap.get(d) || 0) + 1);
      }
    });
    vaultNotes.forEach(n => {
      if (n.lastModifiedMs) {
        const d = new Date(n.lastModifiedMs).toISOString().split('T')[0];
        actMap.set(d, (actMap.get(d) || 0) + 2);
      }
    });

    const today = new Date();
    const days: { date: string; count: number; label: string }[] = [];
    const totalDays = 84; // 12 weeks * 7 days

    for (let i = totalDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      
      const count = actMap.get(dateKey) || 0;

      days.push({
        date: dateKey,
        count,
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      });
    }

    const weeks: { date: string; count: number; label: string }[][] = [];
    for (let w = 0; w < 12; w++) {
      weeks.push(days.slice(w * 7, (w + 1) * 7));
    }

    const totalContributions = days.reduce((acc, d) => acc + d.count, 0);
    let activeDays = 0;
    let currentStreak = 0;
    let bestStreak = 0;
    days.forEach(d => {
      if (d.count > 0) {
        activeDays++;
        currentStreak++;
        if (currentStreak > bestStreak) bestStreak = currentStreak;
      } else {
        currentStreak = 0;
      }
    });

    return { weeks, totalContributions, activeDays, bestStreak };
  }, [todos, vaultNotes]);

  // Real Vault Documents Progress mapping
  const studyDocs = useMemo(() => {
    if (vaultNotes.length > 0) {
      return vaultNotes.slice(0, 4).map((n) => {
        const words = n.wordCount || 0;
        const wordStr = words >= 1000 ? `${(words / 1000).toFixed(1)}k words` : `${words} words`;
        const pct = Math.min(100, Math.max(10, Math.round((Math.min(words, 2500) / 2500) * 100)));
        return {
          name: n.title.replace(/\.[^/.]+$/, ''),
          words: wordStr,
          pct,
        };
      });
    }
    return [];
  }, [vaultNotes]);

  // XP, Level & Rank
  const { xpTotal, level, levelProgress, xpInLevel } = useMemo(() => {
    const xp = (todos.filter(t => t.completed).length * 50) + (vaultNotes.length * 100) + (studyStreak * 35);
    const lvl = Math.floor(xp / 300) + 1;
    const currentInLevel = xp % 300;
    const progress = Math.round((currentInLevel / 300) * 100);
    return { xpTotal: xp, level: lvl, levelProgress: progress, xpInLevel: currentInLevel };
  }, [todos, vaultNotes, studyStreak]);

  // Motivational message
  const motivationalMessage = useMemo(() => {
    const completed = todos.filter(t => t.completed).length;
    const pending = todos.filter(t => !t.completed).length;
    if (todos.length > 0 && pending === 0) {
      return "All systems clear! You've conquered every objective today. Bloub is thrilled!";
    }
    if (completed > 0 && pending > 0) {
      return "Fantastic rhythm! Keep riding this momentum—your streak is strong!";
    }
    if (completed === 0 && pending > 0) {
      return "One micro-win sets the whole day in motion. Pick a task and let's roll!";
    }
    return "Ready to learn something new? Open your Cloud Vault and start your next session!";
  }, [todos]);
  
  const showListHero = !isListView && activeTab === 'lists';
  const heroShape = showListHero ? getListMascot(activeCatObj, catSettings, mascotShape, mascotColor).shape : mascotShape;
  const heroColor = showListHero ? getListMascot(activeCatObj, catSettings, mascotShape, mascotColor).color : mascotColor;
  
  const isGlobalTarget = settingsTarget === 'global';
  const targetCatObj: Category = categories.find(c => c.id === settingsTarget) || { id: 'default', name: 'General', type: 'todo' };
  const targetShape = isGlobalTarget ? mascotShape : (catSettings[settingsTarget]?.shape || getListMascot(targetCatObj, catSettings, mascotShape, mascotColor).shape);
  const targetColor = isGlobalTarget ? mascotColor : (catSettings[settingsTarget]?.color || getListMascot(targetCatObj, catSettings, mascotShape, mascotColor).color);
  const targetExpr = (isGlobalTarget ? mascotExpression : (catSettings[settingsTarget]?.expression as ExpressionId)) || 'neutral';

  const updateTargetShape = (s: string) => {
    isPrefsDirtyRef.current = true;
    lastLocalPrefsUpdateRef.current = Date.now();
    if (autoMoodEnabled) {
      updateAutoMood(false);
    }
    if (isGlobalTarget) {
      setMascotShape(s);
    } else {
      setCatSettings(prev => ({
        ...prev,
        [settingsTarget]: {
          ...prev[settingsTarget],
          shape: s,
          color: prev[settingsTarget]?.color || targetColor,
          expression: prev[settingsTarget]?.expression || 'neutral'
        }
      }));
    }
    triggerMascot('idle', targetExpr, true);
  };

  const updateTargetColor = (c: string) => {
    isPrefsDirtyRef.current = true;
    lastLocalPrefsUpdateRef.current = Date.now();
    if (autoMoodEnabled) {
      updateAutoMood(false);
    }
    if (isGlobalTarget) {
      setMascotColor(c);
    } else {
      setCatSettings(prev => ({
        ...prev,
        [settingsTarget]: {
          ...prev[settingsTarget],
          shape: prev[settingsTarget]?.shape || targetShape,
          color: c,
          expression: prev[settingsTarget]?.expression || 'neutral'
        }
      }));
    }
    triggerMascot('idle', targetExpr, true);
  };

  const updateTargetExpr = (expr: string) => {
    isPrefsDirtyRef.current = true;
    lastLocalPrefsUpdateRef.current = Date.now();
    if (autoMoodEnabled) {
      updateAutoMood(false);
    }
    if (isGlobalTarget) {
      setMascotExpression(expr as any);
    } else {
      setCatSettings(prev => ({
        ...prev,
        [settingsTarget]: {
          ...prev[settingsTarget],
          shape: prev[settingsTarget]?.shape || targetShape,
          color: prev[settingsTarget]?.color || targetColor,
          expression: expr
        }
      }));
    }
    triggerMascot('idle', expr as any, true);
  };

  const applyTheme = useCallback((themeId: string) => {
    isPrefsDirtyRef.current = true;
    lastLocalPrefsUpdateRef.current = Date.now();
    setBgTheme(themeId);
    try {
      localStorage.setItem('vibe_bgTheme', themeId);
      if (session?.user?.id) {
        localStorage.setItem(`bloub_prefs_${session.user.id}_bgTheme`, themeId);
        const bundleKey = `bloub_prefs_${session.user.id}`;
        const existing = localStorage.getItem(bundleKey);
        const parsed = existing ? JSON.parse(existing) : {};
        localStorage.setItem(bundleKey, JSON.stringify({ ...parsed, bgTheme: themeId, updatedAt: Date.now() }));
      }
      const vars = getThemeVariables(themeId);
      if (vars) {
        Object.entries(vars).forEach(([prop, val]) => {
          document.documentElement.style.setProperty(prop, val);
        });
      }
      const activeTheme = THEMES.find(t => t.id === themeId);
      if (activeTheme?.bgColor) {
        document.body.style.backgroundColor = activeTheme.bgColor;
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute('content', activeTheme.bgColor);
      }
      document.documentElement.setAttribute('data-theme', themeId);
    } catch (e) {
      console.warn('Failed to apply theme immediately:', e);
    }
  }, [session]);

  const filteredThemes = useMemo(() => {
    return THEMES.filter(t => themeCategory === 'All' || t.category === themeCategory);
  }, [themeCategory]);

  // Theme Logic
  // User requested ONLY dark themes. bgTheme is a hex color (e.g. bg-[#1e1e2e]), 
  // so we use generic dark glassy translucent styles that overlay nicely on ANY hex color.
  const isDark = true; 
    
    const tc = {
      card: 'bg-zinc-950/40 border border-white/10 hover:border-white/20 active:scale-[0.99] transition-all text-zinc-100',
      cardMuted: 'bg-zinc-950/20 border-white/5 text-zinc-400',
      nav: 'bg-zinc-950/80 border-t border-white/10 backdrop-blur-xl',
      input: 'bg-zinc-950/60 border-white/10 text-zinc-100 placeholder-zinc-500 focus:border-white/25'
    };

  const t = {
    textPrimary: 'text-zinc-100',
    textSecondary: 'text-zinc-400',
    textMuted: 'text-zinc-400',
    card: tc.card,
    cardMuted: tc.cardMuted,
    input: tc.input,
    nav: tc.nav,
    iconCircle: 'bg-zinc-900 border border-white/10 text-zinc-300',
    pillActive: 'bg-zinc-800 border-white/20 text-white shadow-sm',
    pillInactive: 'bg-zinc-900/60 border-white/10 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80'
  };

  if (loadingAuth) {
    return <div className={`min-h-screen ${bgTheme} flex flex-col items-center justify-center`}><BloubMascot size={96} state="idle" expression="heureux" shape={mascotShape} color={mascotColor} /><p className="mt-4 text-gray-500 text-sm font-medium animate-pulse">Loading...</p></div>;
  }

  if (!session) {
    return (
      <div className="pn-desk min-h-screen w-full bg-[#F8FAFC] text-[#0F172A] flex items-center justify-center p-4 relative overflow-hidden font-sans select-none">
        {/* Soft Ambient Radial Halo */}
        <div 
          className="fixed top-0 left-1/2 -translate-x-1/2 w-[650px] max-w-[100vw] h-[360px] rounded-full blur-[140px] pointer-events-none opacity-40 -z-0 bg-gradient-to-b from-indigo-100/70 to-transparent"
        />

        <motion.div 
          initial={{ y: 16, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          className="pn-cover w-full max-w-md bg-white border border-slate-200/80 shadow-[0_20px_50px_rgba(15,23,42,0.08)] rounded-3xl p-8 relative z-10 text-center flex flex-col items-center"
        >
          {/* Framed Mascot Hero - Sunflower mascot with vibrant blue fill & happy expression */}
          <div className="relative mb-5 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full blur-2xl bg-blue-500/20 scale-125 pointer-events-none" />
            <div className="pn-sticker w-32 h-32 rounded-3xl bg-blue-50/80 border border-blue-100/80 p-2 flex items-center justify-center shadow-md relative overflow-visible cursor-pointer hover:scale-105 active:scale-95 transition-transform duration-200">
              <BloubMascot size={120} state="idle" expression="happy" shape="soleil" color="#3b82f6" isStatic={false} isTyping={false} />
            </div>
          </div>

          <h1 className="pn-cover-title text-2xl font-bold tracking-tight text-slate-900 font-display">Vibe Todos</h1>
          
          {authStep === 'email' ? (
            <p className="text-sm text-slate-500 mt-1.5 mb-6 text-center leading-relaxed">
              Sign in to sync your study notes, tasks, and customized mascot across devices.
            </p>
          ) : (
            <div className="text-center mt-1.5 mb-5 space-y-1.5">
              <p className="text-xs text-slate-500">Enter the verification code sent to</p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-700">
                <span className="font-mono text-[11px] font-semibold">{authEmail}</span>
                <button 
                  type="button" 
                  onClick={() => { setAuthStep('email'); setAuthOtpCode(''); setAuthError(null); }} 
                  className="text-slate-400 hover:text-slate-700 transition-colors ml-0.5"
                  title="Change email"
                >
                  <Edit2 size={11} />
                </button>
              </div>
            </div>
          )}

          {/* Feedback Error Alert */}
          {authError && (
            <div className="w-full mb-4 px-3.5 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2 text-left animate-in fade-in duration-150">
              <AlertCircle size={15} className="shrink-0" />
              <span className="leading-snug">{authError}</span>
            </div>
          )}

          {authStep === 'email' ? (
            /* Step 1: Sleek Email Input Form */
            <form onSubmit={handleSendOtp} className="w-full space-y-3.5">
              <div className="relative w-full">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  disabled={authLoading}
                  className="pn-line w-full py-3.5 pl-10 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-600/20 outline-none text-sm placeholder:text-slate-400 transition-all font-sans"
                />
              </div>

              {/* Remember this device toggle */}
              <label className="flex items-center gap-2.5 px-1 py-0.5 cursor-pointer select-none group">
                <input
                  type="checkbox"
                  checked={rememberDevice}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setRememberDevice(val);
                    try {
                      localStorage.setItem('vibe_remember_device', val ? 'true' : 'false');
                      if (!val) localStorage.removeItem('vibe_remembered_email');
                    } catch {}
                  }}
                  className="sr-only"
                />
                <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                  rememberDevice 
                    ? 'bg-slate-900 border-slate-900 text-white' 
                    : 'bg-slate-50 border-slate-300 group-hover:border-slate-400 text-transparent'
                }`}>
                  <Check size={12} strokeWidth={3} />
                </div>
                <span className="text-xs text-slate-600 group-hover:text-slate-900 transition-colors">
                  Remember this device
                </span>
              </label>

              <button
                type="submit"
                disabled={authLoading || !authEmail.trim()}
                className="pn-stamp w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl shadow-sm transition-all duration-150 active:scale-[0.98] flex items-center justify-center gap-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <KeyRound size={16} />
                <span>{authLoading ? 'Sending Login Code...' : 'Send Login Code'}</span>
              </button>

              <div className="flex items-center gap-3 my-3">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">or</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <button 
                type="button"
                onClick={() => {
                  try {
                    localStorage.setItem('vibe_remember_device', rememberDevice ? 'true' : 'false');
                  } catch {}
                  supabase.auth.signInWithOAuth({ 
                    provider: 'google', 
                    options: { 
                      redirectTo: `${window.location.origin}/api/auth/callback`, 
                      queryParams: { prompt: 'select_account' } 
                    } 
                  });
                }} 
                className="pn-plain w-full py-3 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-medium py-3 rounded-xl flex items-center justify-center gap-2.5 text-sm transition-all duration-150 shadow-sm active:scale-[0.98]"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/><path fill="none" d="M1 1h22v22H1z"/></svg>
                Continue with Google
              </button>
            </form>
          ) : (
            /* Step 2: Segmented PIN Verification Form */
            <form onSubmit={handleVerifyOtp} className="w-full space-y-4 animate-in fade-in zoom-in-95 duration-200">
              {/* Segmented PIN Code Display (Supports 6 to 8 Digits) */}
              <div className="relative flex justify-center py-1">
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={8}
                  autoFocus
                  value={authOtpCode}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/[^0-9]/g, '').slice(0, 8);
                    setAuthOtpCode(clean);
                    if (otpDebounceRef.current) clearTimeout(otpDebounceRef.current);
                    if (clean.length === 6) {
                      otpDebounceRef.current = setTimeout(() => {
                        verifyWithFallback(clean);
                      }, 400);
                    } else if (clean.length === 8) {
                      verifyWithFallback(clean);
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-text z-10"
                  aria-label="verification code"
                />

                {/* Individual Segmented Digit Cells (Smoothly adapts 6 or 8 cells) */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {Array.from({ length: authOtpCode.length > 6 ? 8 : 6 }).map((_, idx) => {
                    const digit = authOtpCode[idx];
                    const isCurrent = idx === authOtpCode.length;
                    return (
                      <div
                        key={idx}
                        className={`${authOtpCode.length > 6 ? 'w-8 h-12 sm:w-10 sm:h-13 text-lg sm:text-xl' : 'w-10 h-13 sm:w-11 sm:h-14 text-xl sm:text-2xl'} rounded-xl border flex items-center justify-center font-mono font-bold transition-all ${
                          digit 
                            ? 'bg-slate-50 border-slate-300 text-slate-900 shadow-sm' 
                            : isCurrent 
                            ? 'bg-indigo-50/60 border-indigo-600 ring-2 ring-indigo-600/20 text-indigo-950' 
                            : 'bg-slate-50/40 border-slate-200 text-slate-300'
                        }`}
                      >
                        {digit || (isCurrent ? <span className="w-0.5 h-5 bg-indigo-600 animate-pulse rounded-full" /> : '·')}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Direct Magic Link Helper Note */}
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 pt-0.5">
                <ExternalLink size={13} className="text-indigo-600 shrink-0" />
                <span>Or click the direct sign-in link inside your email</span>
              </div>

              {/* Remember this device toggle */}
              <label className="flex items-center justify-center gap-2.5 py-0.5 cursor-pointer select-none group">
                <input
                  type="checkbox"
                  checked={rememberDevice}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setRememberDevice(val);
                    try {
                      localStorage.setItem('vibe_remember_device', val ? 'true' : 'false');
                      if (!val) localStorage.removeItem('vibe_remembered_email');
                    } catch {}
                  }}
                  className="sr-only"
                />
                <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                  rememberDevice 
                    ? 'bg-slate-900 border-slate-900 text-white' 
                    : 'bg-slate-50 border-slate-300 group-hover:border-slate-400 text-transparent'
                }`}>
                  <Check size={12} strokeWidth={3} />
                </div>
                <span className="text-xs text-slate-600 group-hover:text-slate-900 transition-colors">
                  Remember this device
                </span>
              </label>

              {/* Primary Verify Button */}
              <button
                type="submit"
                disabled={authLoading || authOtpCode.length < 6}
                className="pn-stamp w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl shadow-sm transition-all duration-150 active:scale-[0.98] flex items-center justify-center gap-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ShieldCheck size={16} />
                <span>{authLoading ? 'Verifying Code...' : 'Verify & Sign In'}</span>
              </button>

              {/* Footer Navigation */}
              <div className="flex items-center justify-between text-xs pt-1 px-1">
                <button
                  type="button"
                  onClick={() => {
                    setAuthStep('email');
                    setAuthOtpCode('');
                    setAuthError(null);
                  }}
                  className="text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1 font-medium"
                >
                  <ArrowLeft size={13} />
                  <span>Different email</span>
                </button>

                <button
                  type="button"
                  disabled={authCooldown > 0 || authLoading}
                  onClick={() => handleSendOtp()}
                  className="text-indigo-600 hover:text-indigo-700 hover:underline disabled:opacity-40 disabled:no-underline transition-colors font-medium"
                >
                  {authCooldown > 0 ? `Resend in ${authCooldown}s` : 'Resend code'}
                </button>
              </div>
            </form>
          )}

          <button 
            onClick={() => setShowDownloadMenu(true)} 
            className="mt-5 w-full py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 font-medium text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-slate-200 transition-all duration-150 active:scale-[0.98]"
          >
            <Download size={13} />
            <span>Download App (APK / Windows)</span>
          </button>
        </motion.div>

        {/* Download Menu Modal (Login Page) */}
        {showDownloadMenu && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 text-left"
            onClick={() => setShowDownloadMenu(false)}
          >
            <div 
              className="rounded-3xl p-7 max-w-sm w-full shadow-2xl animate-pop-in bg-zinc-950 border border-white/10 text-zinc-100"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-white">Download Vibe Todos</h2>
                <button 
                  onClick={() => setShowDownloadMenu(false)} 
                  className="p-1.5 rounded-full bg-white/5 text-zinc-400 hover:text-white"
                >
                  <X size={18}/>
                </button>
              </div>
              
              <div className="space-y-3 pt-2">
                {/* Android APK Download Option */}
                <a 
                  href="/downloads/Todos.apk" 
                  download="Todos.apk"
                  className="w-full flex items-center justify-between py-3 px-4 rounded-2xl border transition-all font-semibold text-sm bg-white/5 border-white/10 text-zinc-200 hover:bg-white/10"
                >
                  <span className="flex items-center gap-2">
                    <Smartphone size={18} className="text-emerald-400" />
                    Android Installer (APK)
                  </span>
                  <Download size={14} className="opacity-60" />
                </a>

                {/* Windows Setup Installer Option */}
                <a 
                  href="/downloads/VibeTodosSetup.exe" 
                  download="VibeTodosSetup.exe"
                  className="w-full flex items-center justify-between py-3 px-4 rounded-2xl border transition-all font-semibold text-sm bg-white/5 border-white/10 text-zinc-200 hover:bg-white/10"
                >
                  <span className="flex items-center gap-2">
                    <Monitor size={18} className="text-blue-400" />
                    <span className="text-left">
                      Windows Setup Installer (EXE)
                      <span className="block text-[10px] font-normal text-zinc-400">Installs app, creates desktop & start menu shortcuts</span>
                    </span>
                  </span>
                  <Download size={14} className="opacity-60" />
                </a>

                {/* Web App PWA Installer Option */}
                <button 
                  onClick={() => {
                    setShowDownloadMenu(false);
                    setShowInstallGuide(true);
                  }}
                  className="w-full flex items-center justify-between py-3 px-4 rounded-2xl border transition-all font-semibold text-sm text-left bg-white/5 border-white/10 text-zinc-200 hover:bg-white/10"
                >
                  <span className="flex items-center gap-2">
                    <Smartphone size={18} className="text-purple-400" />
                    Install Web App (PWA Guide)
                  </span>
                  <ChevronRight size={14} className="opacity-60" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PWA Install Guide Modal (Login Page) */}
        {showInstallGuide && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 text-left"
            onClick={() => setShowInstallGuide(false)}
          >
            <div 
              className="rounded-3xl p-7 max-w-sm w-full shadow-2xl animate-pop-in bg-zinc-950 border border-white/10 text-zinc-100"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-white">Install Web App (PWA)</h2>
                <button 
                  onClick={() => setShowInstallGuide(false)} 
                  className="p-1.5 rounded-full bg-white/5 text-zinc-400 hover:text-white"
                >
                  <X size={18}/>
                </button>
              </div>

              <div className="space-y-5">
                <div className="flex gap-3 items-start">
                  <Smartphone size={20} className="text-blue-400 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-zinc-200">iPhone & iPad (Safari)</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">Tap the share icon <span className="font-semibold text-white">&ldquo;Share&rdquo;</span> at the bottom of Safari, and select <span className="font-semibold text-white">&ldquo;Add to Home Screen&rdquo;</span>.</p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <Smartphone size={20} className="text-emerald-400 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-zinc-200">Android / Chrome / Brave</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">Tap the menu dots in the top-right and select <span className="font-semibold text-white">&ldquo;Install App&rdquo;</span> or <span className="font-semibold text-white">&ldquo;Add to Home Screen&rdquo;</span>.</p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <Monitor size={20} className="text-purple-400 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-zinc-200">Firefox / Other Browsers</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">Look for the install or download icon in the URL search bar, or use Chrome/Brave/Edge to install as a desktop shortcut.</p>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => setShowInstallGuide(false)} 
                className="mt-6 w-full bg-[var(--theme-primary,#3b82f6)] hover:brightness-110 text-white font-semibold py-3.5 rounded-2xl shadow-md transition-all active:scale-95"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const closeReader = () => { setShowQuizSession(false); setSelectedNote(null); };
  const studyReader = selectedNote ? (
    showQuizSession ? (
      <div className="vs-reader h-full flex flex-col flex-1 min-h-0 overflow-hidden border border-[var(--theme-border)] bg-[var(--theme-surface)] animate-in">
        <div className="px-4 py-3 border-b border-[var(--theme-border)] flex items-center gap-3 shrink-0">
          <button onClick={closeReader} className="vs-btn"><ArrowLeft size={14} /> {locale === 'ar' ? 'رجوع' : 'Back'}</button>
          <h3 className="text-sm font-semibold truncate">{selectedNote.title}</h3>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 w-full h-full min-h-0 divide-y lg:divide-y-0 lg:divide-x divide-[var(--theme-border)] overflow-hidden">
          <div className="lg:col-span-7 h-full flex flex-col p-2 sm:p-4 overflow-hidden min-h-0">
            <NoteViewer note={selectedNote} isDark={isDark} isLoading={isFetchingNote} hideTopHeader={true} apiKey={geminiApiKey} triggerMascot={triggerMascot} onUpdateNote={handleUpdateNote} mascotShape={mascotShape} mascotColor={mascotColor} />
          </div>
          <div className="lg:col-span-5 h-full flex flex-col overflow-hidden min-h-0">
            <QuizSession note={selectedNote} apiKey={geminiApiKey} isDark={isDark} onClose={() => setShowQuizSession(false)} triggerMascot={triggerMascot} />
          </div>
        </div>
      </div>
    ) : (
      <div className="animate-in h-full flex flex-col flex-1 min-h-0">
        <NoteViewer note={selectedNote} isDark={isDark} isLoading={isFetchingNote} apiKey={geminiApiKey} triggerMascot={triggerMascot} mascotShape={mascotShape} mascotColor={mascotColor}
          onClose={closeReader} onStartQuiz={() => setShowQuizSession(true)} onUpdateNote={handleUpdateNote}
          onWikilinkClick={async (target) => {
            try {
              setIsFetchingNote(true);
              const res = await fetch(`/api/obsidian/search?q=${encodeURIComponent(target)}`);
              const data = await res.json();
              if (data.results && data.results.length > 0) handleSelectNote(data.results[0].note || data.results[0]);
              else setIsFetchingNote(false);
            } catch { setIsFetchingNote(false); }
          }} />
      </div>
    )
  ) : null;

  const vsHour = new Date().getHours();
  const vsGreeting = locale === 'ar' ? (vsHour < 12 ? 'صباح الخير' : 'مساء الخير') : (vsHour < 12 ? 'Good morning' : vsHour < 18 ? 'Good afternoon' : 'Good evening');
  const vsToday = new Date().toISOString().split('T')[0];
  const vsDue = todos.filter(td => !td.completed && (td.isHabit || (td.dueDate && td.dueDate <= vsToday)))
    .sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999')).slice(0, 6);
  const vsOverdue = todos.filter(td => !td.completed && !td.isHabit && td.dueDate && td.dueDate < vsToday).length;
  const vsRecent = [...vaultNotes].sort((a, b) => (b.lastModifiedMs || 0) - (a.lastModifiedMs || 0)).slice(0, 4);
  const vsWeek = heatmapData.weeks.flat().slice(-7);
  const vsWeekMax = Math.max(1, ...vsWeek.map(d => d.count));
  const vsWords = vaultNotes.reduce((sum, n) => sum + (n.wordCount || 0), 0);
  const vsIsPdf = (n: { tags?: string[]; relativePath?: string }) => !!(n.tags?.includes('pdf') || n.relativePath?.toLowerCase().endsWith('.pdf'));
  const vsOpen = (n: ObsidianNoteSummary, tab: 'library' | 'quizzes', quiz = false) => { setActiveTab(tab); setShowQuizSession(quiz); handleSelectNote(n); };
  const vsCatName = (id?: string) => categories.find(c => c.id === id)?.name || '';
  const vsDocRow = (n: ObsidianNoteSummary, tab: 'library' | 'quizzes', quiz = false) => (
    <button key={n.id} className="vs-row" onClick={() => vsOpen(n, tab, quiz)}>
      <span className={`vs-doc ${vsIsPdf(n) ? 'is-pdf' : ''}`}>{vsIsPdf(n) ? 'PDF' : 'MD'}</span>
      <span className="vs-row-main"><span className="vs-row-title">{n.title}</span>
        <span className="vs-row-sub">{[n.folder, n.wordCount ? `${n.wordCount.toLocaleString()} words` : '', n.lastModifiedMs ? new Date(n.lastModifiedMs).toLocaleDateString(locale === 'ar' ? 'ar' : 'en-GB', { day: 'numeric', month: 'short' }) : ''].filter(Boolean).join(' · ')}</span></span>
      <span className="vs-row-act">{quiz ? (locale === 'ar' ? 'اختبرني' : 'Quiz me') : (locale === 'ar' ? 'فتح' : 'Open')}</span>
    </button>
  );

  return (
    <div className="min-h-screen w-full bg-[var(--theme-bg,#080b14)] transition-colors duration-500 font-sans text-white relative overflow-x-hidden">
      {/* Ambient Top Aura Glow */}
      <div 
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[720px] max-w-[100vw] h-[380px] rounded-full blur-[120px] pointer-events-none opacity-25 sm:opacity-35 transition-all duration-700 -z-0"
        style={{ background: 'radial-gradient(circle, var(--theme-primary,#3b82f6) 0%, transparent 70%)' }}
      />
      <main className={`w-full ${selectedNote ? 'max-w-[100vw] px-0 md:px-4' : (!isListView && activeTab === 'lists' && activeCatObj?.type === 'study') ? 'max-w-[100vw] px-2 sm:px-6' : (activeTab === 'home' || activeTab === 'library' || activeTab === 'quizzes') ? 'max-w-5xl px-4 pb-28' : (activeTab === 'settings' ? 'max-w-5xl px-4 pb-28' : activeTab === 'stats' ? 'max-w-5xl mx-auto px-4 md:px-8 pt-6 pb-28' : isListView ? 'max-w-md md:max-w-3xl lg:max-w-4xl px-4 sm:px-6' : 'max-w-md md:max-w-2xl px-4')} mx-auto ${selectedNote ? 'h-[100dvh] max-h-[100dvh] overflow-hidden' : 'min-h-[100dvh] pb-24'} flex flex-col relative transition-all duration-500`}>
        {/* Header */}
        {(activeTab === 'lists' || activeTab === 'today') && !selectedNote && (
          <header className="pt-6 pb-2 px-2 relative z-30 transition-colors duration-500">
            {activeTab === 'lists' && isListView ? (
              /* Hero Header Banner for My Lists */
              (() => {
                const pending = todos.filter(x => !x.completed).length;
                const done = todos.filter(x => x.completed).length;
                const total = pending + done;
                const pct = total ? Math.round((done / total) * 100) : 100;
                const now = new Date();
                const dateLine = now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
                                return (
                  <div className="vt-hero w-full flex items-end justify-between gap-4 px-5 pt-2 pb-3">
                    <div className="flex-1 min-w-0">
                      <p className="vt-eyebrow">{dateLine}</p>
                      <h1 className={`vt-hero-title font-display ${t.textPrimary}`}>My Lists</h1>
                      <div className="mt-3 flex items-center gap-3 flex-wrap">
                        <span className="vt-stat"><b>{categories.length}</b> lists</span>
                        <span className="vt-stat"><b>{pending}</b> pending</span>
                        <span className="vt-stat"><b>{done}</b> done</span>
                      </div>
                      <p className={`text-xs sm:text-sm mt-2 truncate ${t.textSecondary}`}>
                        {pending === 0 ? "Welcome back! All tasks completed." : `Welcome back! ${pending} pending tasks.`}
                      </p>
                      <div className="vt-ruler mt-4" role="img" aria-label={`${pct}% of all tasks done`}>
                        <div className="vt-ruler-body">
                          {Array.from({ length: 21 }).map((_, k) => <i key={k} className={k % 5 === 0 ? 'big' : ''} style={{ left: `${k * 5}%` }} />)}
                          <div className="vt-ruler-fill" style={{ width: `${pct}%` }} />
                          <div className="vt-ruler-mark" style={{ left: `${pct}%` }}><b>{pct}%</b></div>
                        </div>
                        <div className="vt-ruler-scale"><span>0</span><span>50</span><span>100</span></div>
                      </div>
                    </div>
                    <div className="relative flex-shrink-0 flex flex-col items-center gap-1">
                      <div
                        className="relative cursor-pointer hover:scale-105 transition-transform duration-200 overflow-visible"
                        onClick={() => triggerMascot('idle', 'heureux')}
                        title="Interact with Bloub"
                      >
                        {(() => {
                          const isAnim = animState !== 'idle';
                          const heroExpr = autoMoodEnabled ? computeReactiveMood() : (mascotExpression || 'heureux');
                          return (
                            <BloubMascot 
                              size={96}
                              state={animState} 
                              expression={isAnim ? (animExpression || mascotExpression) : (heroExpr as ExpressionId)} 
                              shape={heroShape} 
                              color={heroColor} 
                              onInteract={() => triggerMascot('idle', 'heureux')}
                            />
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              /* Regular Header for inside individual list or Today */
              <div className="flex justify-between items-center py-3 px-5 rounded-2xl bg-[var(--theme-bg,#080b14)]/95 backdrop-blur-md border border-[var(--theme-border-subtle,rgba(255,255,255,0.08))]">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    {!isListView && activeTab === 'lists' && (
                      <button 
                        onClick={() => { setIsListView(true); setShowStudyExplorer(false); }}
                        className="p-1.5 -ml-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                        title="Back to Lists"
                      >
                        <ArrowLeft size={18} />
                      </button>
                    )}
                    <div>
                      <h1 className={`text-2xl sm:text-3xl font-display font-bold tracking-tight transition-colors ${t.textPrimary}`}>
                        {activeTab === 'lists' ? activeCatObj?.name : 'Today'}
                      </h1>
                      <div className="flex items-center gap-2 mt-0.5">
                        {!isListView && activeTab === 'lists' && activeCatObj?.type === 'study' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--theme-primary,#3b82f6)]/15 text-[var(--theme-primary,#3b82f6)] border border-[var(--theme-primary,#3b82f6)]/20">
                            <GraduationCap size={12} /> Study
                          </span>
                        ) : (
                          <p className={`text-xs font-mono transition-colors ${t.textSecondary}`}>{completedCount} of {totalCount} completed</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Docked Mascot Companion in Ambient Header (Eliminates Center Screen Bloat) */}
                <div 
                  data-mascot-container="hero"
                  className="flex items-center justify-center relative cursor-pointer hover:scale-105 active:scale-95 transition-transform flex-shrink-0 ml-3"
                  onClick={() => triggerMascot('idle', 'heureux')}
                  title="Bloub Companion"
                >
                  <div className="absolute inset-0 rounded-full blur-md opacity-35 bg-[var(--theme-primary,#3b82f6)] pointer-events-none" />
                  <div className="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center relative z-10">
                    {(() => {
                      const isAnim = animState !== 'idle';
                      const catExpr = showListHero ? (catSettings[activeCategory]?.expression) : null;
                      const heroExpr = autoMoodEnabled ? computeReactiveMood() : (catExpr || mascotExpression || 'neutre');
                      return (
                        <BloubMascot 
                          size={46}
                          state={animState} 
                          expression={isAnim ? (animExpression || mascotExpression) : (heroExpr as ExpressionId)} 
                          shape={heroShape} 
                          color={heroColor} 
                          onInteract={() => triggerMascot('idle', 'heureux')}
                        />
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}
          </header>
        )}

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/15 z-50 flex items-end pb-36 justify-center sm:items-center sm:pb-6 p-4"
          onClick={() => setShowAddModal(false)}>
          <div className={`rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-md shadow-2xl animate-pop-in ${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}
            onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-lg font-semibold ${t.textPrimary}`}>New Task</h2>
              <button onClick={() => setShowAddModal(false)} className={`p-1.5 rounded-full ${isDark ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-gray-100 text-gray-400 hover:text-gray-700'}`}><X size={18}/></button>
            </div>
            
            <form onSubmit={addTodo}>
              <textarea
                dir="auto"
                autoFocus
                value={inputText}
                onChange={e => {
                  const val = e.target.value;
                  setInputText(val);
                  try {
                    localStorage.setItem('todo_input_draft', val);
                  } catch {}
                }}
                onFocus={(e) => {
                  if (heroShape === 'soleil') {
                    triggerMascot('idle', 'attentif', true);
                  } else {
                    triggerMascot('thinking', 'curieux', true);
                  }
                  e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                onBlur={() => {
                  triggerMascot('idle', 'neutre');
                }}
                placeholder="What needs to be done?"
                rows={3}
                className={`w-full rounded-2xl py-4 px-4 text-base font-medium transition-all mb-4 outline-none resize-none custom-scrollbar ${t.input}`}
              />

              {/* Attachments Preview */}
              {pendingAttachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4 px-1">
                  {pendingAttachments.map((att, i) => (
                    <div key={i} className="relative group rounded-xl overflow-hidden bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 h-16 w-16 flex items-center justify-center">
                      {att.type === 'image' && <img src={att.previewUrl} className="object-cover w-full h-full" alt="preview" />}
                      {att.type === 'video' && <video src={att.previewUrl} className="object-cover w-full h-full" />}
                      {att.type === 'audio' && <Mic size={24} className="text-blue-500" />}
                      <button type="button" onClick={() => setPendingAttachments(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-0 right-0 bg-red-500 text-white rounded-bl-xl p-1 opacity-80 hover:opacity-100 transition-opacity">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Media Controls */}
              <div className="flex items-center gap-3 mb-4 px-1">
                <button
                  type="button"
                  onClick={toggleRecording}
                  className={`p-3 rounded-full transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]' : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  <Mic size={20} />
                </button>
                <label className={`p-3 rounded-full cursor-pointer transition-all ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  <Camera size={20} />
                  <input type="file" className="hidden" accept="image/*,video/*" multiple onChange={handleFileSelect} />
                </label>
              </div>

              {/* Habit Toggle */}
              <div className="flex items-center justify-between mb-4 px-1">
                <span className={`text-sm font-semibold ${t.textPrimary}`}>Make it a Habit</span>
                <button
                  type="button"
                  onClick={() => setIsHabit(!isHabit)}
                  data-on={isHabit ? '1' : undefined} className={`pn-toggle w-11 h-6 rounded-full transition-all relative outline-none ${
                    isHabit ? 'bg-[var(--theme-primary,#3b82f6)]' : isDark ? 'bg-slate-800' : 'bg-gray-200'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all shadow-md ${
                    isHabit ? 'left-5.5' : 'left-0.5'
                  }`} />
                </button>
              </div>

              {/* Habit Details (Days & Frequency) */}
              <AnimatePresence>
                {isHabit && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }} 
                    exit={{ opacity: 0, height: 0 }} 
                    className="space-y-4 mb-5 overflow-hidden"
                  >
                    {/* Days Selector */}
                    <div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider block mb-2 ${t.textMuted}`}>Repeat Days (Leave empty for every day)</span>
                      <div className="flex justify-between gap-1">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                          const isSelected = habitDays.includes(day);
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setHabitDays(habitDays.filter(d => d !== day));
                                } else {
                                  setHabitDays([...habitDays, day]);
                                }
                              }}
                              className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all ${
                                isSelected 
                                  ? 'bg-[var(--theme-primary,#3b82f6)] text-white border-transparent' 
                                  : isDark 
                                    ? 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700' 
                                    : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                              }`}
                            >
                              {day[0]}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Frequency Selector */}
                    <div className="flex items-center justify-between border-t border-dashed border-gray-100 dark:border-slate-800 pt-3">
                      <span className={`text-xs font-bold uppercase tracking-wider ${t.textMuted}`}>Times per day</span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setHabitFrequency(Math.max(1, habitFrequency - 1))}
                          className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold border transition-all ${
                            isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-gray-50 border-gray-200 text-gray-700'
                          }`}
                        >
                          -
                        </button>
                        <span className={`font-bold text-sm w-4 text-center ${t.textPrimary}`}>{habitFrequency}</span>
                        <button
                          type="button"
                          onClick={() => setHabitFrequency(Math.min(10, habitFrequency + 1))}
                          className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold border transition-all ${
                            isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-gray-50 border-gray-200 text-gray-700'
                          }`}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={!inputText.trim() || isSubmitting}
                className="w-full bg-[var(--theme-primary,#3b82f6)] text-white font-semibold py-4 rounded-2xl shadow-md hover:brightness-110 disabled:opacity-50 transition-all active:scale-95"
              >
                {isSubmitting ? 'Saving...' : 'Save Task'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Main Content Area or Settings */}
      {activeTab === 'settings' ? (
          <div className="flex-1 w-full flex flex-col md:flex-row overflow-hidden animate-in fade-in zoom-in-95 duration-300 md:shadow-2xl md:my-6 md:rounded-3xl md:border md:border-white/10">
            {/* Left side: HUGE MASCOT */}
            <div className="hidden md:flex md:sticky md:top-0 md:h-screen md:w-1/2 lg:w-3/5 flex-col items-center justify-center p-8 select-none bg-slate-900/30 relative overflow-visible">
              <div className="pn-polaroid w-80 h-80 rounded-3xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl shadow-2xl flex flex-col items-center justify-center relative cursor-pointer hover:scale-105 active:scale-95 transition-all duration-300" onClick={() => triggerMascot('idle', targetExpr)}>
                <BloubMascot key={`settings-preview-lg-${settingsTarget}-${targetShape}-${targetExpr}-${targetColor}`} size={200} state={animState} expression={targetExpr} shape={targetShape} color={targetColor} isStatic={false} />
                <div className="pn-caption mt-2 inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-black/40 border border-white/10 text-[11px] font-mono uppercase tracking-wider text-slate-300">
                  <span className="font-bold text-white capitalize">{getLocalizedShape(resolveShape(targetShape), locale) || targetShape}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400 capitalize">{getLocalizedExpression(targetExpr, locale) || targetExpr}</span>
                </div>
              </div>
            </div>

            {/* Right side: Settings controls */}
            <div className="w-full md:w-1/2 lg:w-2/5 h-full overflow-y-auto custom-scrollbar pb-32 pt-6 px-6 bg-[var(--theme-surface,#101422)]/95 border-l border-[var(--theme-border-subtle,rgba(255,255,255,0.08))]">
              
              {/* Mascot Preview inside Settings */}
              <div className="bg-[var(--theme-surface-elevated,#171c2f)] rounded-3xl p-4 mb-6 border border-[var(--theme-border-subtle,rgba(255,255,255,0.08))] flex flex-col items-center">
                <div className="pn-polaroid pn-polaroid-sm md:hidden w-32 h-32 flex items-center justify-center mb-4 cursor-pointer hover:scale-105 transition-transform duration-300 overflow-visible" onClick={() => triggerMascot('idle', targetExpr)}>
                  <BloubMascot key={`settings-preview-sm-${settingsTarget}-${targetShape}-${targetExpr}-${targetColor}`} size={120} state={animState} expression={targetExpr} shape={targetShape} color={targetColor} isStatic={false} />
                </div>

                {/* Horizontal Category Scroller */}
                <div className="w-full flex gap-2.5 overflow-x-auto pb-4 pt-1 px-1 custom-scrollbar scroll-smooth border-t border-[var(--theme-border-subtle,rgba(255,255,255,0.08))]">
                  <button
                    type="button"
                    onClick={() => setSettingsTarget('global')}
                    data-on={settingsTarget === 'global' ? '1' : undefined}
                    className={`pn-opt flex-shrink-0 flex flex-col items-center py-2 px-3 rounded-2xl border transition-all ${
                      settingsTarget === 'global'
                        ? 'bg-[var(--theme-primary,#3b82f6)]/20 border-[var(--theme-primary,#3b82f6)] text-white shadow-md scale-105 ring-1 ring-[var(--theme-primary,#3b82f6)]/40'
                        : 'bg-white/5 border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10'
                    }`}
                  >
                    <div className="w-10 h-10 flex items-center justify-center pointer-events-none">
                      <BloubMascot size={36} state="idle" expression={mascotExpression} shape={mascotShape} color={mascotColor} isStatic={true} />
                    </div>
                    <span className="text-[10px] font-bold mt-1 tracking-wide uppercase">Global</span>
                  </button>
                  {categories.map(cat => {
                    const { shape: cShape, color: cColor } = getListMascot(cat, catSettings, mascotShape, mascotColor);
                    const cExpr = (catSettings[cat.id]?.expression as ExpressionId) || 'neutre';
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSettingsTarget(cat.id)}
                        data-on={settingsTarget === cat.id ? '1' : undefined}
                        className={`pn-opt flex-shrink-0 flex flex-col items-center py-2 px-3 rounded-2xl border transition-all ${
                          settingsTarget === cat.id
                            ? 'bg-[var(--theme-primary,#3b82f6)]/20 border-[var(--theme-primary,#3b82f6)] text-white shadow-md scale-105 ring-1 ring-[var(--theme-primary,#3b82f6)]/40'
                            : 'bg-white/5 border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10'
                        }`}
                      >
                        <div className="w-10 h-10 flex items-center justify-center pointer-events-none">
                          <BloubMascot size={36} state="idle" expression={cExpr} shape={cShape} color={cColor} isStatic={true} />
                        </div>
                        <span className="text-[10px] font-bold mt-1 tracking-wide uppercase truncate w-12 text-center">{cat.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Language Selection Section */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 mb-6 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe size={15} className="text-[var(--theme-primary,#3b82f6)]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      {tLang('language')}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[var(--theme-primary,#3b82f6)]/15 border border-[var(--theme-primary,#3b82f6)]/30 text-[var(--theme-primary,#3b82f6)]">
                    {locale === 'ar' ? 'العربية' : 'English'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLocale('en')}
                    data-on={locale === 'en' ? '1' : undefined}
                    className={`pn-seg flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold cursor-pointer select-none transition-all duration-150 active:scale-[0.98] ${
                      locale === 'en'
                        ? 'bg-[var(--theme-primary,#3b82f6)] text-white border-[var(--theme-primary,#3b82f6)] shadow-md shadow-[var(--theme-primary,#3b82f6)]/25'
                        : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span>🇬🇧 English</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocale('ar')}
                    data-on={locale === 'ar' ? '1' : undefined}
                    className={`pn-seg flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold cursor-pointer select-none transition-all duration-150 active:scale-[0.98] font-arabic ${
                      locale === 'ar'
                        ? 'bg-[var(--theme-primary,#3b82f6)] text-white border-[var(--theme-primary,#3b82f6)] shadow-md shadow-[var(--theme-primary,#3b82f6)]/25'
                        : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span>🇸🇦 العربية (فصحى عصرية)</span>
                  </button>
                </div>
                <p className="text-[10px] text-zinc-400 leading-relaxed">
                  {tLang('languageDesc')}
                </p>
              </div>

              {/* Shape Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    <Shapes size={14} /> {tLang('shape')}
                  </span>
                  <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider capitalize">
                    {getLocalizedShape(resolveShape(targetShape), locale) || targetShape}
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-2.5">
                  {SHAPE_IDS.map(s => {
                    const isSelected = targetShape === s || normalizeShape(targetShape) === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => updateTargetShape(s)}
                        data-on={isSelected ? '1' : undefined}
                        className={`pn-opt flex aspect-square flex-col items-center justify-center rounded-2xl border-2 cursor-pointer select-none transition-all duration-150 active:scale-95 p-1 ${
                          isSelected
                            ? 'bg-slate-800 border-blue-500 shadow-md ring-2 ring-blue-500/30 ring-offset-1 ring-offset-slate-900 scale-105'
                            : isDark
                              ? 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600'
                              : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}
                        title={getLocalizedShape(s, locale) || s}
                      >
                        <BloubMascot key={`shape-tile-${s}-${targetExpr}-${targetColor}`} size={36} state="idle" expression={targetExpr} shape={s} color={targetColor} isStatic={true} />
                        <span className="text-[9px] font-bold text-slate-400 capitalize truncate max-w-[50px] text-center mt-0.5">{getLocalizedShape(s, locale) || s}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reactive Auto-Mood Toggle */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 mb-6 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[var(--theme-primary,#3b82f6)]/15 text-[var(--theme-primary,#3b82f6)] flex items-center justify-center shrink-0">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white">{tLang('autoMood')}</span>
                      {autoMoodEnabled && (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[var(--theme-primary,#3b82f6)]/20 text-[var(--theme-primary,#3b82f6)] border border-[var(--theme-primary,#3b82f6)]/30">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight mt-0.5">
                      {tLang('autoMoodDesc')}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => updateAutoMood(!autoMoodEnabled)}
                  data-on={autoMoodEnabled ? '1' : undefined}
                  className={`pn-toggle w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 cursor-pointer select-none active:scale-95 duration-75 ${
                    autoMoodEnabled ? 'bg-[var(--theme-primary,#3b82f6)]' : 'bg-zinc-700'
                  }`}
                  aria-label="Toggle Auto-Mood Engine"
                >
                  <div 
                    className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
                      autoMoodEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`} 
                    />
                </button>
              </div>

              {/* Expression Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    <Smile size={14} /> {tLang('expression')}
                  </span>
                  <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider capitalize">
                    {getLocalizedExpression(targetExpr, locale) || targetExpr} {autoMoodEnabled && (locale === 'ar' ? '(تفاعلي تلقائي)' : '(Auto-Reactive)')}
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-2.5">
                  {SETTINGS_EXPRESSIONS.map(expr => {
                    const isSelected = isExprSelected(targetExpr, expr);
                    return (
                      <button
                        key={expr}
                        type="button"
                        onClick={() => updateTargetExpr(expr)}
                        data-on={isSelected ? '1' : undefined}
                        className={`pn-opt flex aspect-square flex-col items-center justify-center rounded-2xl border-2 cursor-pointer select-none transition-transform duration-75 active:scale-95 p-1 ${
                          isSelected
                            ? 'bg-slate-800 border-blue-500 shadow-md ring-2 ring-blue-500/30 ring-offset-1 ring-offset-slate-900 scale-105'
                            : isDark
                              ? 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600'
                              : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}
                        title={getLocalizedExpression(expr, locale) || expr}
                      >
                        <BloubMascot key={`expr-tile-${expr}-${targetShape}-${targetColor}`} size={36} state="idle" expression={expr} shape={targetShape} color={targetColor} isStatic={true} />
                        <span className="text-[9px] font-bold text-slate-400 capitalize truncate max-w-[50px] text-center mt-0.5">{getLocalizedExpression(expr, locale) || expr}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color Section */}
              <div className="mb-6">
                <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                  <PaintBucket size={14} /> {tLang('colour')}
                </span>
                <div className="flex flex-wrap gap-3">
                  {COLORS.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => updateTargetColor(c.id)}
                      data-on={targetColor === c.id ? '1' : undefined}
                      className={`pn-dot flex aspect-square items-center justify-center rounded-full cursor-pointer select-none transition-transform duration-75 active:scale-95 ${
                        targetColor === c.id
                          ? 'ring-2 ring-blue-500 ring-offset-[3px] ring-offset-[#0f172a] scale-110 shadow-md'
                          : 'hover:scale-110 hover:ring-2 hover:ring-slate-500 hover:ring-offset-[2px] hover:ring-offset-[#0f172a]'
                      }`}
                      aria-label={c.id}
                      title={c.id}
                    >
                      <span
                        className="block w-6 h-6 rounded-full ring-1 ring-black/20 ring-inset shadow-inner"
                        style={{ backgroundColor: c.hex }}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme Studio Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    <Palette size={14} className="text-[var(--theme-primary,#3b82f6)]" /> {tLang('themeStudio')}
                  </span>
                  <span className="text-[10px] font-mono text-[var(--theme-primary,#3b82f6)] uppercase tracking-wider font-bold">
                    {(() => { const tk = getThemeToken(bgTheme); const key = tk.slug || tk.id; const n = getLocalizedThemeName(key, locale); return (n && n !== key ? n : tk.name) || 'Default'; })()}
                  </span>
                </div>

                {/* Theme Category Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2.5 mb-3 custom-scrollbar">
                  {THEME_CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setThemeCategory(cat)}
                      data-on={themeCategory === cat ? '1' : undefined}
                      className={`pn-seg px-3 py-1 rounded-xl text-xs font-semibold cursor-pointer select-none flex-shrink-0 transition-transform duration-75 active:scale-95 ${
                        themeCategory === cat
                          ? 'bg-[var(--theme-primary,#3b82f6)] text-white shadow-sm'
                          : 'bg-white/5 border border-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {getLocalizedThemeCategory(cat, locale)}
                    </button>
                  ))}
                </div>

                {/* Theme Cards Grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  {filteredThemes.map(theme => {
                    const isSelected = bgTheme === theme.id;
                    const themeKey = theme.slug || theme.id; const ln = getLocalizedThemeName(themeKey, locale); const localizedName = ln && ln !== themeKey ? ln : theme.name;
                    const localizedCategory = getLocalizedThemeCategory(theme.category, locale);
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => applyTheme(theme.id)}
                        data-on={isSelected ? '1' : undefined}
                        className={`pn-theme group relative flex items-center justify-between px-2.5 py-2.5 gap-2.5 rounded-xl border cursor-pointer select-none text-left transition-all duration-150 overflow-hidden active:scale-[0.98] ${
                          isSelected
                            ? 'bg-white/[0.08] border-[var(--theme-primary,#3b82f6)] shadow-sm shadow-[var(--theme-primary,#3b82f6)]/20 ring-1 ring-[var(--theme-primary,#3b82f6)]/40 text-white'
                            : 'bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.05] hover:border-white/15 text-zinc-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          {/* Compact Dual-Tone Swatch Preview */}
                          <div 
                            className="pn-chip w-7 h-7 rounded-lg flex items-center justify-center relative flex-shrink-0 bg-black/40 border border-white/10 overflow-hidden shadow-inner"
                            style={{ backgroundColor: theme.bgColor }}
                          >
                            <div 
                              className="w-3.5 h-3.5 rounded-full shadow-md transition-transform group-hover:scale-110"
                              style={{ 
                                backgroundColor: theme.accentColor, 
                                boxShadow: `0 0 6px ${theme.accentColor}90` 
                              }}
                            />
                          </div>
                          
                          <div className="min-w-0 flex-1">
                            <span className={`text-[13px] font-medium block whitespace-nowrap overflow-hidden text-ellipsis leading-tight tracking-tight ${isSelected ? 'text-[var(--theme-primary,#3b82f6)]' : 'text-zinc-100'}`}>
                              {localizedName}
                            </span>
                            <span className="text-[9px] font-semibold text-zinc-400 uppercase tracking-wider block mt-0.5">
                              {localizedCategory}
                            </span>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-[var(--theme-primary,#3b82f6)] text-white flex items-center justify-center flex-shrink-0 shadow-sm ml-auto">
                            <CheckCircle2 size={12} className="text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>


              {/* Push Notifications Section */}
              <div className="pt-2">
                <div className="p-3.5 rounded-2xl border border-white/[0.08] bg-white/[0.02] flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-zinc-300 shrink-0">
                      <Bell size={16} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-semibold text-white tracking-tight block">{tLang('pushNotifications')}</span>
                      <span className="text-xs text-zinc-400 truncate block">{tLang('pushNotificationsDesc')}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handlePushToggle}
                    data-on={isSubscribed ? '1' : undefined}
                    className={`pn-toggle w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 p-0.5 ${
                      isSubscribed ? 'bg-[var(--theme-primary,#3b82f6)]' : 'bg-zinc-800'
                    }`}
                    aria-label="Toggle Push Notifications"
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
                        isSubscribed ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                {isSubscribed && (
                  <button
                    type="button"
                    onClick={sendTestPush}
                    className="w-full mt-2 py-2 text-xs font-semibold text-[var(--theme-primary,#3b82f6)] hover:opacity-80 transition-opacity flex items-center justify-center gap-1.5"
                  >
                    <Smartphone size={12} />
                    {tLang('sendTestPush')}
                  </button>
                )}
              </div>
  
              {/* AI & CLI Configuration Section */}
              <div className="mt-5 flex flex-col gap-4 relative">
                
                {/* NotebookLM API */}
                <div className="p-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-300">
                      <Sparkles size={14} className="text-[var(--theme-primary,#3b82f6)]" /> {tLang('notebookLmApi')}
                    </span>
                    {geminiApiKey ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        {tLang('keyActive')}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-white/5 border border-white/10 text-zinc-400">
                        {tLang('noKey')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showApiKey ? "text" : "password"}
                        placeholder={tLang('apiKeyPlaceholder')}
                        value={geminiApiKey}
                        onChange={(e) => {
                          const val = e.target.value;
                          setGeminiApiKey(val);
                          try {
                            localStorage.setItem('vibe_geminiApiKey', val);
                            localStorage.setItem('guest_geminiApiKey', val);
                          } catch {}
                        }}
                        className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl bg-black/40 border border-white/10 text-zinc-200 focus:outline-none focus:border-[var(--theme-primary,#3b82f6)]/60 placeholder:text-zinc-600 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors p-1"
                        title={showApiKey ? "Hide Key" : "Show Key"}
                      >
                        {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={handleSaveApiKey}
                      className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold shrink-0 transition-all active:scale-95 ${
                        apiKeySaved
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-[var(--theme-primary,#3b82f6)] text-white hover:opacity-90'
                      }`}
                    >
                      {apiKeySaved ? tLang('saved') : tLang('save')}
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-400 font-medium leading-relaxed">
                    {tLang('apiKeyDesc')}
                  </p>
                </div>
    
                {/* Antigravity CLI Skill Option */}
                <div className="p-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                      <Terminal size={14} className="text-[var(--theme-primary,#3b82f6)]" /> ANTIGRAVITY /TODO SKILL
                    </span>
                    <a 
                      href="/downloads/install-todo-skill.ps1" 
                      download="install-todo-skill.ps1"
                      className="text-[10px] font-semibold uppercase tracking-wider text-zinc-300 hover:text-white flex items-center gap-1 bg-white/5 hover:bg-white/10 border border-white/10 px-2.5 py-1 rounded-lg transition-colors"
                    >
                      Download <Download size={11} />
                    </a>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Control your tasks from any terminal with <code className="font-mono text-zinc-200 bg-white/5 px-1 py-0.5 rounded">/todo</code> inside Antigravity. Run in PowerShell:
                  </p>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/50 border border-white/10 font-mono text-xs text-zinc-300">
                    <code>.\install-todo-skill.ps1</code>
                    <button
                      type="button"
                      onClick={handleCopyCli}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition-all flex items-center gap-1.5 active:scale-95"
                    >
                      {copiedCli ? (
                        <>
                          <Check size={12} className="text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Sign Out Button */}
                <div className="pt-2">
                  <button
                    onClick={async () => {
                      hasHydratedRemoteSettingsRef.current = false;
                      document.documentElement.classList.remove('dark');
                      document.documentElement.removeAttribute('data-theme');
                      document.documentElement.style.removeProperty('--theme-bg');
                      document.documentElement.style.removeProperty('--theme-surface');
                      document.documentElement.style.removeProperty('--theme-surface-elevated');
                      document.documentElement.style.removeProperty('--theme-primary');
                      document.documentElement.style.removeProperty('--theme-border');
                      document.body.style.backgroundColor = '#F8FAFC';
                      let meta = document.querySelector('meta[name="theme-color"]');
                      if (meta) meta.setAttribute('content', '#FFFFFF');
                      try {
                        localStorage.removeItem('vibe_persisted_session');
                        if (localStorage.getItem('vibe_remember_device') === 'false') {
                          localStorage.removeItem('vibe_remembered_email');
                        }
                      } catch {}
                      await supabase.auth.signOut();
                      setSession(null);
                      setTodos([]);
                      setCategories([]);
                      setShowSettings(false);
                    }}
                    className="w-full py-3 px-4 font-semibold text-xs tracking-wider uppercase rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 bg-red-500/[0.06] hover:bg-red-500/[0.12] border border-red-500/20 text-red-400"
                  >
                    <LogOut size={14} />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>

        ) : (
          /* Main Content Area */
        <div className={`flex-1 relative flex flex-col min-h-0 ${selectedNote ? 'p-0 h-full' : 'px-6 py-6'}`}>
        
        {/* Floating Mascot removed from list views in favor of sleek header docking (preserves: showAddModal ? 96 : 160) */}

        {/* Study home, Library and Quizzes */}
        {activeTab === 'home' ? (
          <div className="vs-page space-y-8">
            <header className="vs-head">
              <div className="min-w-0">
                <p className="vs-date">{new Date().toLocaleDateString(locale === 'ar' ? 'ar' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}{studyStreak > 0 ? ` · ${studyStreak}-day streak` : ''}</p>
                <h1 className="vs-h1">{vsGreeting}.</h1>
                <p className="vs-lede">
                  {vsOverdue > 0 ? <><b className="vs-late">{vsOverdue} overdue</b>, </> : null}
                  <b>{todos.filter(td => !td.completed).length}</b> open tasks and <b>{vaultNotes.length}</b> documents in your library.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button className="vs-mascot" onClick={() => triggerMascot('idle', 'heureux')} aria-label="Bloub">
                  <BloubMascot size={52} state={animState} expression={animState !== 'idle' ? (animExpression || mascotExpression) : mascotExpression} shape={mascotShape} color={mascotColor} isStatic={false} />
                </button>
                <button className="vs-icon" onClick={() => setActiveTab('settings')} aria-label="Settings"><Settings size={18} /></button>
              </div>
            </header>
            <div className="vs-grid">
              <div className="vs-col">
                <section>
                  <div className="vs-sec"><h2>Pick up where you left off</h2><button onClick={() => setActiveTab('library')}>Library →</button></div>
                  <div className="vs-panel">
                    {vsRecent.length ? vsRecent.map(n => vsDocRow(n, 'library')) : (
                      <div className="vs-empty">No documents yet. Open <button onClick={() => setActiveTab('library')}>Library</button> to upload a PDF or sync your vault.</div>
                    )}
                  </div>
                </section>
                <section>
                  <div className="vs-sec"><h2>Quiz yourself</h2><button onClick={() => setActiveTab('quizzes')}>All quizzes →</button></div>
                  {vsRecent[0] ? (
                    <div className="vs-panel vs-quizcard">
                      <div className="min-w-0">
                        <p className="vs-row-sub">From <b>{vsRecent[0].title}</b> · questions written by Gemini</p>
                        <p className="vs-quizq">Test yourself on what you read last, then check the explanations.</p>
                      </div>
                      <button className="vs-btn is-primary" onClick={() => vsOpen(vsRecent[0], 'quizzes', true)}>Start quiz</button>
                    </div>
                  ) : <div className="vs-panel"><div className="vs-empty">Add a note or PDF to make your first quiz.</div></div>}
                </section>
              </div>
              <div className="vs-col">
                <section>
                  <div className="vs-sec"><h2>Due</h2><button onClick={() => setActiveTab('today')}>All due →</button></div>
                  <div className="vs-panel">
                    {vsDue.length ? vsDue.map(td => {
                      const late = !!(td.dueDate && td.dueDate < vsToday);
                      return (
                        <div key={td.id} className="vs-row is-static">
                          <button className="pn-check" data-late={late ? '1' : undefined} aria-label="Mark as done" onClick={() => td.isHabit ? incrementHabit(td) : toggleTodo(td.id, td.completed)} />
                          <span className="vs-row-main"><span className="vs-row-title">{td.text}</span>
                            <span className={`vs-row-sub ${late ? 'vs-late' : ''}`}>{[td.isHabit ? 'Habit' : late ? 'Overdue' : 'Today', vsCatName(td.categoryId)].filter(Boolean).join(' · ')}</span></span>
                        </div>
                      );
                    }) : <div className="vs-empty">Nothing due today.</div>}
                  </div>
                </section>
                <section>
                  <div className="vs-sec"><h2>This week</h2><button onClick={() => setActiveTab('stats')}>Progress →</button></div>
                  <div className="vs-panel">
                    <div className="vs-week">{vsWeek.map((d, i) => <div key={d.date} className="vs-bar-col"><div className={`vs-bar ${i === vsWeek.length - 1 ? 'is-today' : ''}`} style={{ height: `${Math.max(4, (d.count / vsWeekMax) * 100)}%` }} title={`${d.count} on ${d.label}`} /><span>{new Date(d.date).toLocaleDateString(locale === 'ar' ? 'ar' : 'en-GB', { weekday: 'narrow' })}</span></div>)}</div>
                    <div className="vs-stats">
                      <div><b>{todos.filter(td => td.completed).length}</b><span>tasks done</span></div>
                      <div><b>{vsWords >= 1000 ? `${(vsWords / 1000).toFixed(1)}k` : vsWords}</b><span>words in vault</span></div>
                      <div><b>{studyStreak}</b><span>day streak</span></div>
                    </div>
                  </div>
                </section>
                <section>
                  <div className="vs-sec"><h2>Subjects</h2><button onClick={() => { setActiveTab('lists'); setIsListView(true); }}>All →</button></div>
                  <div className="vs-panel">
                    {categories.map(c => (
                      <button key={c.id} className="vs-row" onClick={() => { setActiveTab('lists'); handleCategoryClick(c); }}>
                        <span className={`vs-dot ${c.type === 'study' ? 'is-study' : ''}`} />
                        <span className="vs-row-main"><span className="vs-row-title">{c.name}</span><span className="vs-row-sub">{c.type === 'study' ? 'Study' : `${todos.filter(td => td.categoryId === c.id && !td.completed).length} open`}</span></span>
                        <ChevronRight size={16} className="vs-chev" />
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </div>
        ) : activeTab === 'library' ? (
          studyReader || (
            <div className="vs-page space-y-6">
              <header className="vs-head"><div><h1 className="vs-h1">Library</h1><p className="vs-lede">Your PDFs and notes, synced from your vault. Open one to read it or quiz yourself on it.</p></div></header>
              <div className="vs-panel vs-explorer"><NoteExplorer userId={session?.user?.id} onSelectNote={(n) => { setShowQuizSession(false); handleSelectNote(n); }} isDark={isDark} /></div>
            </div>
          )
        ) : activeTab === 'quizzes' ? (
          studyReader || (
            <div className="vs-page space-y-6">
              <header className="vs-head"><div><h1 className="vs-h1">Quizzes</h1><p className="vs-lede">Pick a note or PDF. Gemini writes the questions, you answer, and every answer comes with an explanation.</p></div></header>
              {!geminiApiKey && <div className="vs-panel"><div className="vs-empty">Add your Gemini API key in <button onClick={() => setActiveTab('settings')}>Settings</button> to make quizzes.</div></div>}
              <div className="vs-panel">{vaultNotes.length ? [...vaultNotes].sort((a, b) => (b.lastModifiedMs || 0) - (a.lastModifiedMs || 0)).map(n => vsDocRow(n, 'quizzes', true)) : <div className="vs-empty">No documents yet. Add some in <button onClick={() => setActiveTab('library')}>Library</button>.</div>}</div>
            </div>
          )
        ) : activeTab === 'lists' && isListView ? (
          <div className="space-y-4">
            <div className="vt-section-head flex items-center justify-between px-1">
              <h2 className={`text-xs font-semibold uppercase tracking-wider ${t.textMuted}`}>Collections</h2>
              <span className="text-[11px] font-mono text-zinc-500">{categories.length} lists</span>
            </div>
            <ul className="vt-grid grid grid-cols-1 sm:grid-cols-2 gap-3.5 relative">
              <AnimatePresence mode="popLayout">
              {categories.map(cat => {
                const count = todos.filter(t => t.categoryId === cat.id && !t.completed).length;
                const { shape: catShape, color: catColor } = getListMascot(cat, catSettings);
                const isMenuOpen = listMenuId === cat.id;
                const isEditing = editingListId === cat.id;
                const dynCat = getDynamicMascotProps(catShape, catColor, count);
                const isStudyList = cat.type === 'study';
                const listTotal = todos.filter(t => t.categoryId === cat.id).length;
                const listDone = listTotal - count;
                const listPct = listTotal ? Math.round((listDone / listTotal) * 100) : 0;

                return (
                  <motion.li 
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -24, rotate: -1.5 }}
                    transition={{ duration: 0.2 }}
                    key={cat.id} 
                    className="relative"
                  >
                    <div 
                      className={`vt-card group flex flex-col justify-between rounded-2xl p-4 cursor-pointer transition-all ${t.card}`}
                      data-type={isStudyList ? 'study' : 'todo'}
                      onPointerDown={() => handleCategoryPressIn(cat)}
                      onPointerUp={handleCategoryPressOut}
                      onPointerLeave={handleCategoryPressOut}
                      onClick={() => handleCategoryClick(cat)}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-12 drop-shadow-sm flex items-center justify-center flex-shrink-0">
                            <BloubMascot size={42} state="idle" expression={dynCat.expr} shape={catShape} color={dynCat.color} isStatic={true} />
                          </div>
                          <div className="flex flex-col">
                            {isEditing ? (
                              <form onSubmit={(e) => { e.preventDefault(); saveCategory(cat.id); }} onClick={e => e.stopPropagation()}>
                                <input 
                                  type="text" 
                                  autoFocus 
                                  value={editingListName} 
                                  onChange={e => setEditingListName(e.target.value)} 
                                  onBlur={() => saveCategory(cat.id)} 
                                  onFocus={e => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })} 
                                  className={`bg-transparent outline-none font-semibold text-lg ${t.textPrimary} border-b ${isDark ? 'border-slate-500' : 'border-gray-300'}`} 
                                />
                              </form>
                            ) : (
                              <span className={`font-semibold text-lg leading-snug ${t.textPrimary}`}>{cat.name}</span>
                            )}
                            <div className="flex items-center gap-1.5 mt-1">
                              {isStudyList ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-[var(--theme-text-muted,#94a3b8)] border border-white/10">
                                  <GraduationCap size={11} /> Study
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--theme-primary,#3b82f6)]/15 text-[var(--theme-primary,#3b82f6)] border border-[var(--theme-primary,#3b82f6)]/25">
                                  <CheckSquare size={11} /> ToDo
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isStudyList ? (
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-300">
                              Workspace
                            </span>
                          ) : (
                            <span className="vt-count" title={`${count} pending`}>
                              {count}
                              <small>left</small>
                            </span>
                          )}
                        </div>
                      </div>

                      {!isStudyList && (
                        <div className="vt-progress mt-4" aria-label={`${listPct}% done`}>
                          <div className="vt-progress-track"><div className="vt-progress-fill" style={{ width: `${listPct}%` }} /></div>
                          <span>{listDone}/{listTotal}</span>
                        </div>
                      )}

                      {/* Context Menu (Revealed on long press) */}
                      <AnimatePresence>
                        {isMenuOpen && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1, marginTop: 12 }}
                            exit={{ height: 0, opacity: 0, marginTop: 0 }}
                            className="overflow-hidden"
                          >
                            <div className={`flex flex-wrap gap-2 pt-3 border-t ${isDark ? 'border-slate-700' : 'border-gray-100'}`} onClick={e => e.stopPropagation()}>
                              <button 
                                onClick={() => { 
                                  setEditingListId(cat.id); 
                                  setEditingListName(cat.name); 
                                  setEditingListType(cat.type || 'todo');
                                  setListMenuId(null); 
                                }} 
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-colors ${isDark ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                              >
                                <Edit2 size={14}/> Rename
                              </button>
                              
                              <button 
                                onClick={async () => {
                                  const nextType: ListType = cat.type === 'study' ? 'todo' : 'study';
                                  // Optimistically update local state
                                  setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, type: nextType } : c));
                                  // Persist to localStorage as fallback
                                  const storedTypes = session?.user?.user_metadata?.listTypes || JSON.parse(localStorage.getItem(session?.user?.id + '_listTypes') || '{}');
                                  storedTypes[cat.id] = nextType;
                                  localStorage.setItem(session?.user?.id + '_listTypes', JSON.stringify(storedTypes)); supabase.auth.updateUser({ data: { listTypes: storedTypes } }).catch(console.error);
                                  await mutate({ 
                                    type: 'UPDATE_CATEGORY', 
                                    id: cat.id, 
                                    categoryType: nextType,
                                    listType: nextType
                                  });
                                  setListMenuId(null);
                                }} 
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-colors ${
                                  cat.type === 'study'
                                    ? isDark ? 'bg-blue-950/40 text-blue-300 hover:bg-blue-950/60' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                                    : isDark ? 'bg-purple-950/40 text-purple-300 hover:bg-purple-950/60' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                                }`}
                              >
                                {cat.type === 'study' ? (
                                  <><CheckSquare size={14} /> To ToDo</>
                                ) : (
                                  <><GraduationCap size={14} /> To Study</>
                                )}
                              </button>

                              {cat.id !== 'default' && (
                                <button 
                                  onClick={() => deleteCategory(cat.id)} 
                                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                                >
                                  <Trash2 size={14}/> Delete
                                </button>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.li>
                );
              })}
              </AnimatePresence>
            </ul>

            {/* Create Category Form with List Type Selector */}
            <div className={`p-4 rounded-2xl border transition-all ${t.card} mt-6`}>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[11px] font-bold uppercase tracking-wider ${t.textMuted}`}>Create New List</span>
                <div className="flex items-center gap-1 bg-zinc-900 border border-white/10 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setNewCatType('todo')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      newCatType === 'todo'
                        ? 'bg-[var(--theme-primary,#3b82f6)] text-white shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <CheckSquare size={13} />
                    ToDo
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewCatType('study')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      newCatType === 'study'
                        ? 'bg-[var(--theme-primary,#3b82f6)] text-white shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <GraduationCap size={13} />
                    Study
                  </button>
                </div>
              </div>
              <form onSubmit={addCategory} className="flex items-center gap-2">
                <input 
                  type="text" 
                  value={newCatText} 
                  onChange={e => setNewCatText(e.target.value)}
                  onFocus={(e) => {
                    if (heroShape === 'soleil') {
                      triggerMascot('idle', 'attentif', true);
                    } else {
                      triggerMascot('thinking', 'curieux', true);
                    }
                    e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                  onBlur={() => {
                    triggerMascot('idle', 'neutre');
                  }}
                  placeholder={newCatType === 'study' ? 'New Study List (e.g. AI Concepts, Exam Prep)...' : 'New ToDo List (e.g. Work, Gym)...'} 
                  className={`flex-1 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all ${t.input}`} 
                />
                <button 
                  type="submit" 
                  disabled={!newCatText.trim() || isSubmitting} 
                  className="p-2.5 rounded-xl text-white font-semibold shadow-md transition-all disabled:opacity-50 active:scale-95 bg-[var(--theme-primary,#3b82f6)] hover:brightness-110"
                >
                  <Plus size={18}/>
                </button>
              </form>
            </div>
          </div>
        ) : activeTab === 'stats' ? (
          /* Bento Grid Stats Dashboard */
          <div className="w-full space-y-5 py-2 animate-in fade-in zoom-in-95 duration-300">
            {/* Clean Page Header Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-display">
                  Your progress
                </h1>
                <p className="text-sm text-zinc-400 mt-0.5">
                  Everything you've ticked off, across all your lists.
                </p>
              </div>
              <div className="flex items-center gap-2.5 self-start sm:self-auto bg-white/[0.03] border border-white/[0.08] rounded-full px-3.5 py-1.5 text-xs text-zinc-300">
                <span className="flex items-center gap-1.5 font-medium">
                  <Flame size={13} className="text-amber-400 shrink-0 fill-amber-400/20" />
                  <span>{studyStreak} Day Streak</span>
                </span>
                <span className="text-zinc-600">•</span>
                <span className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Sync Online
                </span>
              </div>
            </div>

            {/* Top Row: 4 Metric Cards */}
            <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-3.5">
              {/* Card 1: Completed Tasks */}
              <div className={`p-5 rounded-2xl ${t.card} flex flex-col justify-between relative overflow-hidden group border`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${t.textMuted}`}>Completed</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 size={16} />
                  </div>
                </div>
                <div>
                  <div className={`text-3xl sm:text-4xl font-extrabold tracking-tight mb-1 ${t.textPrimary}`}>
                    {todos.filter(t => t.completed).length}
                  </div>
                  <p className={`text-[11px] ${t.textSecondary}`}>
                    {todos.length > 0 ? `${Math.round((todos.filter(t => t.completed).length / todos.length) * 100)}% of all tasks` : '0 total tasks'}
                  </p>
                </div>
              </div>

              {/* Card 2: Pending Tasks */}
              <div className={`p-5 rounded-2xl ${t.card} flex flex-col justify-between relative overflow-hidden group border`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${t.textMuted}`}>Pending</span>
                  <div className="w-8 h-8 rounded-xl bg-[var(--theme-primary,#3b82f6)]/15 text-[var(--theme-primary,#3b82f6)] flex items-center justify-center">
                    <Clock size={16} />
                  </div>
                </div>
                <div>
                  <div className={`text-3xl sm:text-4xl font-extrabold tracking-tight mb-1 ${t.textPrimary}`}>
                    {todos.filter(t => !t.completed).length}
                  </div>
                  <p className={`text-[11px] ${t.textSecondary}`}>
                    Across {categories.length} active lists
                  </p>
                </div>
              </div>

              {/* Card 3: Current Study Streak */}
              <div className={`p-5 rounded-2xl ${t.card} flex flex-col justify-between relative overflow-hidden group border`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${t.textMuted}`}>Study Streak</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
                    <Flame size={16} className="text-amber-400 fill-amber-400/20" />
                  </div>
                </div>
                <div>
                  <div className="flex items-baseline gap-1.5 mb-1">
                    <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-amber-400">
                      {studyStreak}
                    </span>
                    <span className="text-sm font-bold text-amber-400/80">Days</span>
                    <Flame size={16} className="text-amber-400 fill-amber-400/20 shrink-0 ml-0.5" />
                  </div>
                  <p className={`text-[11px] ${t.textSecondary}`}>
                    Daily momentum active
                  </p>
                </div>
              </div>

              {/* Card 4: Focus Score */}
              <div className={`p-5 rounded-2xl ${t.card} flex flex-col justify-between relative overflow-hidden group border`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${t.textMuted}`}>Focus Score</span>
                  <div className="w-8 h-8 rounded-xl bg-[var(--theme-primary,#3b82f6)]/15 text-[var(--theme-primary,#3b82f6)] flex items-center justify-center">
                    <Target size={16} />
                  </div>
                </div>
                <div>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${t.textPrimary}`}>
                      {focusScore}
                    </span>
                    <span className={`text-lg font-bold ${t.textMuted}`}>%</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mt-1.5">
                    <div 
                      className="h-full bg-[var(--theme-primary,#3b82f6)] rounded-full transition-all duration-500" 
                      style={{ width: `${focusScore}%` }} 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Middle Row: 90-Day Activity & Study Heatmap (Wide Expansive Layout) */}
            <div className={`p-5 sm:p-6 rounded-2xl border transition-all ${t.card} relative overflow-hidden`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Calendar size={17} className="text-[var(--theme-primary,#3b82f6)]" />
                    <h3 className={`text-sm sm:text-base font-bold ${t.textPrimary}`}>
                      90-Day Activity & Study Heatmap
                    </h3>
                  </div>
                  <p className={`text-xs mt-0.5 ${t.textSecondary}`}>
                    Daily task completions and study sessions over the last 12 weeks
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {hoveredHeatmapDay && (
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white/10 text-white animate-in fade-in duration-150">
                      {hoveredHeatmapDay.count} activities • {hoveredHeatmapDay.label}
                    </span>
                  )}
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-white/5 border border-white/10 text-[var(--theme-primary,#3b82f6)]">
                    {heatmapData.totalContributions} Contributions
                  </span>
                </div>
              </div>

              {/* Heatmap Grid (Wide & Expansive) */}
              <div className="overflow-x-auto pb-2 custom-scrollbar">
                {/* Month Labels on top */}
                <div className="min-w-[560px] flex justify-between text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-500 mb-2 px-1">
                  <span>JUL</span>
                  <span>AUG</span>
                  <span>SEP</span>
                  <span>OCT</span>
                </div>

                <div className="pn-graph min-w-[560px] flex items-center justify-between gap-1.5 pt-1 pb-1">
                  {heatmapData.weeks.map((week, wIndex) => (
                    <div key={`week-${wIndex}`} className="flex flex-col gap-1.5 flex-1">
                      {week.map((day) => {
                        const count = day.count;
                        let cellBg = 'bg-white/[0.04] border border-white/[0.05]';
                        if (count === 1) cellBg = 'bg-[var(--theme-primary,#3b82f6)]/25 border border-[var(--theme-primary,#3b82f6)]/35';
                        else if (count === 2) cellBg = 'bg-[var(--theme-primary,#3b82f6)]/50 border border-[var(--theme-primary,#3b82f6)]/60';
                        else if (count === 3) cellBg = 'bg-[var(--theme-primary,#3b82f6)]/75 border border-[var(--theme-primary,#3b82f6)]/80 shadow-sm shadow-[var(--theme-primary,#3b82f6)]/20';
                        else if (count >= 4) cellBg = 'bg-[var(--theme-primary,#3b82f6)] border border-white/20 shadow-sm shadow-[var(--theme-primary,#3b82f6)]/40';

                        return (
                          <div
                            key={day.date}
                            onMouseEnter={() => setHoveredHeatmapDay(day)}
                            onMouseLeave={() => setHoveredHeatmapDay(null)}
                            data-level={Math.min(4, count)} className={`pn-cell w-full aspect-square rounded-[4px] transition-all duration-150 cursor-pointer hover:scale-125 hover:z-20 ${cellBg}`}
                            title={`${day.count} activities on ${day.label}`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Heatmap Legend with Fire Icon */}
              <div className="flex items-center justify-between pt-3 mt-1 border-t border-white/[0.06] text-[11px] text-zinc-400">
                <span className="flex items-center gap-1.5 font-medium">
                  <Flame size={14} className="text-amber-400 shrink-0 fill-amber-400/20" />
                  <span>Consistency Score: {Math.min(100, Math.round((heatmapData.totalContributions / 84) * 100))}%</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-zinc-500">Less</span>
                  <div className="w-2.5 h-2.5 rounded-[2px] bg-white/[0.04] border border-white/[0.05]" />
                  <div className="w-2.5 h-2.5 rounded-[2px] bg-[var(--theme-primary,#3b82f6)]/25" />
                  <div className="w-2.5 h-2.5 rounded-[2px] bg-[var(--theme-primary,#3b82f6)]/50" />
                  <div className="w-2.5 h-2.5 rounded-[2px] bg-[var(--theme-primary,#3b82f6)]/75" />
                  <div className="w-2.5 h-2.5 rounded-[2px] bg-[var(--theme-primary,#3b82f6)]" />
                  <span className="text-[10px] text-zinc-500">More</span>
                </div>
              </div>
            </div>

            {/* Bottom Row: 2 Split Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              {/* Left Card: Vault & Study Breakdown (lg:col-span-7) */}
              <div className={`lg:col-span-7 p-5 rounded-2xl border transition-all ${t.card} flex flex-col justify-between space-y-4`}>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-[var(--theme-primary,#3b82f6)]/15 text-[var(--theme-primary,#3b82f6)] flex items-center justify-center">
                        <BookOpen size={16} />
                      </div>
                      <h4 className={`text-sm font-bold ${t.textPrimary}`}>Vault & Study Breakdown</h4>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[var(--theme-primary,#3b82f6)]">
                      {totalVaultPdfs} Documents
                    </span>
                  </div>

                  <p className={`text-xs ${t.textSecondary} mb-4`}>
                    ~{totalVaultWords >= 1000 ? (totalVaultWords / 1000).toFixed(1) + 'k' : totalVaultWords} words indexed across your Cloud Vault
                  </p>

                  {/* Real Study Document Progress Bars */}
                  {studyDocs.length > 0 ? (
                    <div className="space-y-3">
                      {studyDocs.map((item, idx) => (
                        <div key={idx} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className={`font-semibold truncate max-w-[220px] ${t.textPrimary}`}>{item.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-zinc-400">{item.words}</span>
                              <span className="text-[11px] font-bold text-[var(--theme-primary,#3b82f6)]">{item.pct}%</span>
                            </div>
                          </div>
                          <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-[var(--theme-primary,#3b82f6)] rounded-full transition-all duration-500" 
                              style={{ width: `${item.pct}%` }} 
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 px-4 text-center rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-2">
                      <BookOpen size={22} className="mx-auto text-zinc-500 opacity-60" />
                      <p className="text-xs text-zinc-300 font-medium">No Vault Documents Yet</p>
                      <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">
                        Add PDFs or notes in your Study lists to track learning metrics here.
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <Database size={13} className="text-[var(--theme-primary,#3b82f6)]" />
                    <span>Supabase Realtime Sync</span>
                  </span>
                  <span className="font-mono text-[11px] text-[var(--theme-primary,#3b82f6)]">Online</span>
                </div>
              </div>

              {/* Right Card: Bloub Companion Status (lg:col-span-5) */}
              <div className={`lg:col-span-5 p-5 rounded-2xl border transition-all ${t.card} flex flex-col justify-between space-y-3`}>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-[var(--theme-primary,#3b82f6)]/15 text-[var(--theme-primary,#3b82f6)] flex items-center justify-center">
                        <Sparkles size={16} />
                      </div>
                      <h4 className={`text-sm font-bold ${t.textPrimary}`}>Bloub Companion Status</h4>
                    </div>
                    {autoMoodEnabled ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--theme-primary,#3b82f6)]/15 text-[var(--theme-primary,#3b82f6)] border border-[var(--theme-primary,#3b82f6)]/25">
                        Auto-Mood Active
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-zinc-400 border border-white/10">
                        Manual Mood
                      </span>
                    )}
                  </div>

                  {/* Mascot Preview & XP Bar */}
                  <div className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] mb-2">
                    <div 
                      className="w-20 h-20 flex items-center justify-center flex-shrink-0 cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => triggerMascot('idle', 'heureux')}
                    >
                      <BloubMascot 
                        size={80} 
                        state={animState} 
                        expression={animState !== 'idle' ? (animExpression || mascotExpression) : (autoMoodEnabled ? computeReactiveMood() : mascotExpression)} 
                        shape={mascotShape} 
                        color={mascotColor} 
                        onInteract={() => triggerMascot('idle', 'heureux')}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold uppercase tracking-wider ${t.textPrimary}`}>
                          Mood: {autoMoodEnabled ? computeReactiveMood() : mascotExpression}
                        </span>
                        <span className="text-xs flex items-center">
                          {computeReactiveMood() === 'fier' ? (
                            <Crown size={14} className="text-amber-400" />
                          ) : computeReactiveMood() === 'attentif' ? (
                            <Target size={14} className="text-[var(--theme-primary,#3b82f6)]" />
                          ) : computeReactiveMood() === 'heureux' ? (
                            <Sparkles size={14} className="text-emerald-400" />
                          ) : (
                            <Smile size={14} className="text-[var(--theme-primary,#3b82f6)]" />
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-semibold text-[var(--theme-primary,#3b82f6)]">Level {level} Explorer</span>
                        <span className="font-mono text-zinc-400">{xpInLevel} / 300 XP</span>
                      </div>
                      <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[var(--theme-primary,#3b82f6)] rounded-full transition-all duration-500" 
                          style={{ width: `${levelProgress}%` }} 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3-Column Mini Attribute Grid (Eliminates dead vertical space) */}
                <div className="grid grid-cols-3 gap-2.5 my-1">
                  <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-2.5 text-center flex flex-col items-center justify-center">
                    <CheckCircle2 size={15} className="text-emerald-400 mb-1" />
                    <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">Cleared</span>
                    <span className="text-base font-mono font-bold text-white mt-0.5">{todos.filter(t => t.completed).length}</span>
                  </div>
                  <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-2.5 text-center flex flex-col items-center justify-center">
                    <BookOpen size={15} className="text-[var(--theme-primary,#3b82f6)] mb-1" />
                    <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">Studied</span>
                    <span className="text-base font-mono font-bold text-white mt-0.5">{totalVaultPdfs}</span>
                  </div>
                  <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-2.5 text-center flex flex-col items-center justify-center">
                    <Zap size={15} className="text-amber-400 mb-1" />
                    <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">Next Lv</span>
                    <span className="text-xs font-mono font-bold text-amber-300 mt-1">{300 - xpInLevel} XP</span>
                  </div>
                </div>

                {/* Motivational Speech Bubble */}
                <div className="p-3 rounded-xl bg-[var(--theme-primary,#3b82f6)]/10 border border-[var(--theme-primary,#3b82f6)]/20 text-xs leading-relaxed text-[var(--theme-text-primary)] relative">
                  <p className="font-medium">
                    &ldquo;{motivationalMessage}&rdquo;
                  </p>
                </div>
              </div>
            </div>
          </div>
          ) : activeTab === 'lists' && !isListView ? (
            /* Main Workspace View: Branching based on List Type (Study vs ToDo) */
            <div className={selectedNote ? "h-full flex flex-col min-h-0 flex-1" : ""}>
            {!selectedNote && activeTab === "lists" && !isListView && (
               <div className="mb-4 flex items-center gap-2 text-xs font-medium text-[var(--theme-text-muted)]">
                 <button 
                   onClick={() => { setIsListView(true); setShowStudyExplorer(false); }} 
                   className="hover:text-[var(--theme-text-primary)] transition-colors"
                 >
                   <span>Lists</span>
                 </button>
                 <span>/</span>
                 <button 
                   onClick={() => setShowStudyExplorer(false)} 
                   className={`transition-colors ${showStudyExplorer ? 'hover:text-[var(--theme-text-primary)] text-[var(--theme-text-muted)]' : 'text-[var(--theme-primary,#3b82f6)] font-semibold'}`}
                 >
                   {activeCatObj.name || 'Brain'}
                 </button>
                 {showStudyExplorer && (
                   <>
                     <span>/</span>
                     <span className="text-[var(--theme-primary,#3b82f6)] font-semibold">Cloud Vault</span>
                   </>
                 )}
               </div>
            )}

            {/* Study Workspace Scaffold for categories with type === 'study' */}
            {activeTab === 'lists' && activeCatObj.type === 'study' ? (
              <div className={selectedNote ? "h-full flex flex-col min-h-0 flex-1" : "space-y-5"}>
                {/* Study Hub Hero Card - Hide when deep inside a view */}
                {!selectedNote && !showStudyExplorer && !showGraphView && (
                  <div className={`p-5 rounded-2xl border transition-all ${t.card} relative overflow-hidden`}>
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-18 h-18 flex items-center justify-center flex-shrink-0 cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => triggerMascot('idle', 'heureux')}
                      >
                        <BloubMascot 
                          size={72} 
                          state={animState} 
                          expression={animState !== 'idle' ? (animExpression || mascotExpression) : ((catSettings[activeCategory]?.expression || mascotExpression || 'neutre') as ExpressionId)} 
                          shape={catSettings[activeCategory]?.shape || mascotShape || 'squircle'} 
                          color={catSettings[activeCategory]?.color || mascotColor || '#3b82f6'} 
                          onInteract={() => triggerMascot('idle', 'heureux')}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className={`text-lg font-bold truncate ${t.textPrimary}`}>{activeCatObj.name}</h3>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-[var(--theme-text-muted,#94a3b8)] border border-white/10">
                            Cloud Vault
                          </span>
                        </div>
                        <p className={`text-xs mt-1 leading-relaxed ${t.textSecondary}`}>
                          Interactive study workspace & AI quiz generator
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Study UI: Side-by-Side Dual-Pane Study View (PDF on Left, Quiz on Right) */}
                {selectedNote && showQuizSession ? (
                  <div className={`h-full flex flex-col flex-1 min-h-0 rounded-3xl overflow-hidden border shadow-2xl transition-all animate-in fade-in zoom-in-95 duration-500 relative ${
                    isDark ? 'border-[var(--theme-border)] bg-[var(--theme-surface)] backdrop-blur-xl' : 'border-purple-200 bg-white'
                  }`}>
                    {/* Dual-Pane Header */}
                    <div className={`px-4 py-3 border-b flex items-center justify-between shrink-0 ${
                      isDark ? 'border-[var(--theme-border)] bg-[var(--theme-surface-elevated)]' : 'border-gray-100 bg-gray-50'
                    }`}>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setShowQuizSession(false)}
                          className={`p-2 rounded-xl transition-all active:scale-95 text-xs font-bold flex items-center gap-1.5 ${
                            isDark ? 'bg-[var(--theme-surface-subtle)] text-[var(--theme-text-primary)] hover:bg-[var(--theme-surface)] border border-[var(--theme-border)]' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          <ArrowLeft size={14} />
                          <span>Exit Quiz</span>
                        </button>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-[var(--theme-primary)]/20 text-[var(--theme-primary)] border border-[var(--theme-primary)]/30">
                            Study Mode
                          </span>
                          <h3 className={`text-sm font-bold truncate max-w-xs sm:max-w-md ${isDark ? 'text-[var(--theme-text-primary)]' : 'text-gray-900'}`}>
                            {selectedNote.title}
                          </h3>
                        </div>
                      </div>
                    </div>

                    {/* Responsive Dual-Pane Container */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 w-full h-full min-h-0 divide-y lg:divide-y-0 lg:divide-x divide-[var(--theme-border)] overflow-hidden">
                      {/* Left Pane: Visual PDF Document Viewer (58% width on desktop) */}
                      <div className="lg:col-span-7 h-full flex flex-col p-2 sm:p-4 overflow-hidden min-h-0">
                        <NoteViewer
                          note={selectedNote}
                          isDark={isDark}
                          isLoading={isFetchingNote}
                          hideTopHeader={true}
                          apiKey={geminiApiKey}
                          triggerMascot={triggerMascot}
                          onUpdateNote={handleUpdateNote}
                          mascotShape={heroShape}
                          mascotColor={heroColor}
                        />
                      </div>

                      {/* Right Pane: AI Interactive Quiz (42% width on desktop) */}
                      <div className="lg:col-span-5 h-full flex flex-col overflow-hidden min-h-0 bg-[var(--theme-surface-subtle)]">
                        <QuizSession
                          note={selectedNote}
                          apiKey={geminiApiKey}
                          isDark={isDark}
                          onClose={() => setShowQuizSession(false)}
                          triggerMascot={triggerMascot}
                        />
                      </div>
                    </div>
                  </div>
                ) : selectedNote ? (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col flex-1 min-h-0">
                    <NoteViewer 
                      note={selectedNote} 
                      isDark={isDark} 
                      isLoading={isFetchingNote}
                      apiKey={geminiApiKey}
                      triggerMascot={triggerMascot}
                      mascotShape={heroShape}
                      mascotColor={heroColor}
                      onClose={() => setSelectedNote(null)}
                      onStartQuiz={() => setShowQuizSession(true)}
                      onWikilinkClick={async (target) => {
                        // Quick search for the wikilink target
                        try {
                          setIsFetchingNote(true);
                          const res = await fetch(`/api/obsidian/search?q=${encodeURIComponent(target)}`);
                          const data = await res.json();
                          if (data.results && data.results.length > 0) {
                            handleSelectNote(data.results[0].note || data.results[0]);
                          } else {
                            alert(`Could not find note: ${target}`);
                            setIsFetchingNote(false);
                          }
                        } catch (e) {
                          setIsFetchingNote(false);
                        }
                      }}
                      onUpdateNote={handleUpdateNote}
                    />
                  </div>
                ) : showGraphView ? (
                  <div className={`h-[600px] rounded-3xl overflow-hidden border transition-all animate-in fade-in zoom-in-95 duration-500 relative ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
                    <button onClick={() => setShowGraphView(false)} className="absolute top-4 left-4 z-50 bg-black/60 hover:bg-black/80 px-3 py-1.5 flex items-center gap-2 rounded-xl text-white text-xs font-bold  transition-all shadow-xl">
                      <ChevronRight className="rotate-180" size={14} /> Back to Hub
                    </button>
                    <NoteGraph 
                      userId={session?.user?.id} 
                      isDark={isDark} 
                      onNodeClick={(n) => { 
                        setShowGraphView(false); 
                        setShowStudyExplorer(true); 
                        handleSelectNote({ id: n.id, title: n.name, relativePath: n.id, folder: n.folder, tags: [], wordCount: 0 }); 
                      }} 
                    />
                  </div>
                ) : showStudyExplorer ? (
                  <div className={`flex flex-col h-[600px] border rounded-3xl overflow-hidden transition-all animate-in fade-in zoom-in-95 duration-500 ${t.card}`}>
                    <div className="p-3 border-b flex items-center justify-between border-[var(--theme-border-subtle)] bg-[var(--theme-surface-subtle)]">
                      <div className="flex items-center gap-2">
                        <Database size={15} className="text-[var(--theme-primary,#3b82f6)]" />
                        <span className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-primary)]">Cloud Vault Documents</span>
                      </div>
                      <span className="text-[11px] font-medium text-[var(--theme-text-muted)]">Supabase Brain</span>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <NoteExplorer 
                        userId={session?.user?.id}
                        scopedFolder={activeCatObj?.vaultFolder}
                        scopedTags={activeCatObj?.studyTags}
                        onSelectNote={handleSelectNote}
                        isDark={isDark}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Vault Notes Tile */}
                    <button 
                      onClick={() => setShowStudyExplorer(true)}
                      className={`pn-bookmark text-left p-4 rounded-2xl border transition-all hover:scale-[1.02] active:scale-95 cursor-pointer ${t.card} flex flex-col justify-between group`}
                    >
                      <div>
                        <div className="w-9 h-9 rounded-xl bg-[var(--theme-primary,#3b82f6)]/10 text-[var(--theme-primary,#3b82f6)] flex items-center justify-center mb-2.5 transition-transform group-hover:scale-110 group-hover:rotate-3">
                          <Brain size={18} />
                        </div>
                        <h4 className={`text-sm font-bold mb-1 ${t.textPrimary}`}>Vault Notes</h4>
                        <p className={`text-[11px] leading-relaxed ${t.textMuted}`}>
                          Scan and browse Markdown notes, frontmatter tags, and wikilinks.
                        </p>
                      </div>
                      <div className="mt-3 w-full pt-2.5 border-t border-dashed border-gray-200 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-[var(--theme-primary,#3b82f6)]">
                        <span>Cloud Vault</span>
                        <ChevronRight size={14} className="transition-transform group-hover:translate-x-1" />
                      </div>
                    </button>

                    {/* AI Quizzing Tile */}
                    <button 
                      onClick={() => setShowStudyExplorer(true)}
                      className={`pn-bookmark text-left p-4 rounded-2xl border transition-all hover:scale-[1.02] active:scale-95 cursor-pointer ${t.card} flex flex-col justify-between group`}
                    >
                      <div>
                        <div className="w-9 h-9 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center mb-2.5 transition-transform group-hover:scale-110 group-hover:-rotate-3">
                          <Sparkles size={18} />
                        </div>
                        <h4 className={`text-sm font-bold mb-1 ${t.textPrimary}`}>NotebookLM AI Quiz</h4>
                        <p className={`text-[11px] leading-relaxed ${t.textMuted}`}>
                          Generate interactive multi-choice quizzes and flashcards with Gemini.
                        </p>
                      </div>
                      <div className="mt-3 w-full pt-2.5 border-t border-dashed border-gray-200 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-[var(--theme-text-muted)] group-hover:text-[var(--theme-primary,#3b82f6)] transition-colors">
                        <span>Select a Note First</span>
                        <ChevronRight size={14} className="transition-transform group-hover:translate-x-1" />
                      </div>
                    </button>

                    {/* Upload Book Tile */}
                    <label className={`pn-bookmark text-left p-4 rounded-2xl border transition-all hover:scale-[1.02] active:scale-95 cursor-pointer ${t.card} flex flex-col justify-between group`}>
                      <input 
                        type="file" 
                        accept=".txt,.md,.csv" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          triggerMascot('thinking', 'curieux', true);
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            const text = ev.target?.result as string;
                            setSelectedNote({
                              id: file.name,
                              title: file.name.replace(/\.[^/.]+$/, ""),
                              relativePath: file.name,
                              absolutePath: file.name,
                              folder: "Uploads",
                              frontmatter: {},
                              tags: [],
                              headings: [],
                              wikilinks: [],
                              rawContent: text,
                              bodyContent: text,
                              wordCount: text.split(/\s+/).length,
                              lastModifiedMs: file.lastModified
                            });
                            setShowStudyExplorer(false);
                            triggerMascot('idle', 'heureux');
                          };
                          reader.readAsText(file);
                        }} 
                      />
                      <div>
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 group-hover:rotate-3 mb-2.5">
                          <FileText size={18} />
                        </div>
                        <div>
                          <h4 className={`text-sm font-bold mb-1 ${t.textPrimary}`}>Upload Book</h4>
                          <p className={`text-[11px] leading-relaxed ${t.textMuted}`}>
                            Upload any .txt or .md book.
                          </p>
                        </div>
                      </div>
                    </label>

                    {/* Visual Graph Tile */}
                    <button 
                      onClick={() => setShowGraphView(true)}
                      className={`pn-bookmark text-left p-4 rounded-2xl border transition-all hover:scale-[1.02] active:scale-95 cursor-pointer ${t.card} flex flex-col justify-between group`}
                    >
                      <div>
                        <div className="w-9 h-9 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 group-hover:rotate-3 mb-2.5">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg>
                        </div>
                        <div>
                          <h4 className={`text-sm font-bold mb-1 ${t.textPrimary}`}>Visual Graph</h4>
                          <p className={`text-[11px] leading-relaxed ${t.textMuted}`}>
                            2D map of your Brain.
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>
                )}

                {(!selectedNote && !showGraphView && !showQuizSession && !showStudyExplorer) && (
                  <div className={`p-8 rounded-3xl border border-dashed text-center flex flex-col items-center justify-center ${isDark ? 'border-slate-800 bg-slate-900/30' : 'border-gray-200 bg-gray-50/50'}`}>
                    <div className="w-14 h-14 rounded-full bg-[var(--theme-primary,#3b82f6)]/10 text-[var(--theme-primary,#3b82f6)] flex items-center justify-center mb-3.5">
                      <GraduationCap size={28} />
                    </div>
                    <h3 className={`text-sm font-bold mb-1 ${t.textPrimary}`}>Ready for Study Session</h3>
                    <p className={`text-xs max-w-xs mb-4 leading-relaxed ${t.textMuted}`}>
                       Explore your cloud Obsidian notes or launch an AI quiz session to test your retention and master concepts.
                    </p>
                    <button 
                      type="button" 
                      onClick={() => {
                        setShowStudyExplorer(true);
                        triggerMascot('idle', 'fier');
                      }} 
                      className="px-4 py-2 rounded-xl bg-[var(--theme-primary,#3b82f6)] text-white text-xs font-semibold hover:brightness-110 shadow-md shadow-[var(--theme-primary,#3b82f6)]/25 transition-all active:scale-95 flex items-center gap-1.5"
                    >
                      <Sparkles size={13} />
                      Study with Bloub
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Classic ToDo Task List View */
              <div>
                {/* Add Task FAB */}
                <button
                  onClick={() => setShowAddModal(true)}
                  className="pn-fab fixed bottom-24 right-6 sm:right-[calc(50%-13rem)] w-14 h-14 bg-[var(--theme-primary,#3b82f6)] text-white rounded-full shadow-xl shadow-[var(--theme-primary,#3b82f6)]/30 flex items-center justify-center hover:brightness-110 transition-all hover:scale-105 active:scale-95 z-40"
                >
                  <Plus size={28} />
                </button>

                <ul className="space-y-3 pb-8 relative">
                  <AnimatePresence mode="popLayout">
                  {filteredTodos.length === 0 && (
                    <motion.li layout initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="py-6">
                      <div className={`p-6 rounded-2xl border border-dashed text-center flex flex-col items-center justify-center transition-all ${isDark ? 'border-zinc-800 bg-zinc-900/20' : 'border-gray-200 bg-gray-50/50'}`}>
                        <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 mb-2.5">
                          <CheckCircle2 size={18} className="text-emerald-400" />
                        </div>
                        <h4 className={`text-sm font-semibold mb-0.5 ${t.textPrimary}`}>No tasks remaining</h4>
                        <p className={`text-xs ${t.textMuted}`}>You&apos;re clear for today — all caught up!</p>
                      </div>
                    </motion.li>
                  )}
                  {filteredTodos
                    .slice()
                    .sort((a, b) => Number(b.id) - Number(a.id))
                    .map(todo => {
                      const isExpanded = expandedTask === todo.id;
                      const isOverdue = !todo.completed && todo.dueDate && new Date(todo.dueDate) < new Date();

                      return (
                        <motion.li 
                          layout
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -24, rotate: -1.5 }}
                          transition={{ duration: 0.2 }}
                          key={todo.id}
                          data-late={isOverdue && !todo.completed ? '1' : undefined} className={`pn-task rounded-2xl border transition-all duration-200 overflow-hidden ${todo.completed ? t.cardMuted + ' opacity-60' : isOverdue ? (isDark ? 'bg-red-950/30 border-red-900 shadow-red-900/20' : 'bg-red-50 border-red-200 shadow-red-100') : t.card}`}
                        >
                          <div className="flex items-center gap-3 px-4 py-3.5">
                            {todo.isHabit ? (
                              <button onClick={() => incrementHabit(todo)} className="flex-shrink-0">
                                {todo.completed ? (
                                  <CheckCircle2 size={22} className={isDark ? "text-slate-500" : "text-gray-800"} />
                                ) : (
                                  <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-[10px] font-black transition-all active:scale-90 ${
                                    isDark ? 'border-slate-700 bg-slate-800 text-slate-300' : 'border-gray-200 bg-gray-50 text-gray-700'
                                  }`}>
                                    {(todo.habitCompletedCount || 0)}/{(todo.habitFrequency || 1)}
                                  </div>
                                )}
                              </button>
                            ) : (
                              <button onClick={() => toggleTodo(todo.id, todo.completed)} data-on={todo.completed ? '1' : undefined} data-late={isOverdue ? '1' : undefined} aria-label={todo.completed ? 'Mark as not done' : 'Mark as done'} className="pn-check flex-shrink-0">
                                {todo.completed
                                  ? <CheckCircle2 size={22} className={isDark ? "text-slate-500" : "text-gray-800"} />
                                  : <Circle size={22} className={isOverdue ? 'text-red-400' : isDark ? 'text-slate-600' : 'text-gray-300'} />
                                }
                              </button>
                            )}

                            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpandedTask(isExpanded ? null : todo.id)}>
                              <div className="flex items-center gap-2 flex-wrap">
                                <p dir="auto" className={`text-sm font-medium ${isExpanded ? 'break-words whitespace-normal' : 'truncate'} ${todo.completed ? 'line-through ' + t.textMuted : isOverdue ? 'text-red-500' : t.textPrimary}`}>
                                  {todo.text}
                                </p>
                                {todo.attachments && todo.attachments.length > 0 && (
                                  <div className="flex gap-2 w-full mt-2 overflow-x-auto custom-scrollbar pb-1">
                                    {todo.attachments.map((att, i) => (
                                      <div key={i} className="flex-shrink-0 relative rounded-xl overflow-hidden bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 h-24 w-24 flex items-center justify-center">
                                        {att.type === 'image' && <img src={att.url} className="object-cover w-full h-full" alt="attachment" />}
                                        {att.type === 'video' && <video src={att.url} controls className="object-cover w-full h-full" />}
                                        {att.type === 'audio' && (
                                          <div className="flex flex-col items-center justify-center gap-1 w-full h-full">
                                            <Mic size={24} className="text-blue-500" />
                                            <audio src={att.url} controls className="h-6 w-20 scale-75 transform origin-center" />
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {todo.isHabit && (todo.habitStreak || 0) > 0 && (
                                  <span className="flex-shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400">
                                    <Flame size={10} className="fill-current text-orange-500" />
                                    {todo.habitStreak}d
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                {todo.isHabit ? (
                                  <span className={`text-[10px] flex items-center gap-1 ${t.textMuted}`}>
                                    <Repeat size={10} />
                                    {todo.habitDays && todo.habitDays.length > 0 ? todo.habitDays.join(', ') : 'Every day'}
                                  </span>
                                ) : (
                                  todo.dueDate && (
                                    <span className={`text-xs flex items-center gap-1 ${isOverdue ? 'text-red-400 font-semibold' : t.textMuted}`}>
                                      {isOverdue && <AlertCircle size={12} className="text-red-400" />}
                                      {isOverdue ? 'Overdue ' : ''}
                                      {new Date(todo.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </span>
                                  )
                                )}
                              </div>
                            </div>

                            {todo.priority && (
                              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: PRIORITY_COLOR[todo.priority] }} />
                            )}

                            <button onClick={() => setExpandedTask(isExpanded ? null : todo.id)} className={`transition-colors flex-shrink-0 ${isDark ? 'text-slate-500 hover:text-slate-300' : 'text-gray-300 hover:text-gray-500'}`}>
                              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </button>

                            <button onClick={() => deleteTodo(todo.id)} className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0">
                              <Trash2 size={16} />
                            </button>
                          </div>

                          {isExpanded && (
                            <div className={`border-t px-4 py-3 space-y-3 ${isDark ? 'border-slate-700/50' : 'border-gray-100'}`}>
                              <div className="flex items-center gap-2">
                                <Flag size={14} className={t.textMuted} />
                                <span className={`text-xs mr-1 ${t.textMuted}`}>Priority:</span>
                                {(['high', 'medium', 'low'] as const).map(p => (
                                  <button key={p}
                                    data-on={todo.priority === p ? '1' : undefined}
                                    data-p={p}
                                    onClick={() => mutate({ type: 'SET_PRIORITY', id: todo.id, priority: p }).then(d => { if (d) { setTodos(d.todos); setCategories(d.categories); } })}
                                    className={`pn-prio px-2 py-0.5 rounded-full text-xs font-medium transition-all border ${
                                      todo.priority === p ? 'text-white border-transparent' : isDark ? 'text-slate-400 border-slate-700' : 'text-gray-500 border-gray-200'
                                    }`}
                                    style={todo.priority === p ? { backgroundColor: PRIORITY_COLOR[p] } : {}}
                                  >
                                    {PRIORITY_LABEL[p]}
                                  </button>
                                ))}
                              </div>

                              <div className="flex items-center gap-2">
                                <Calendar size={14} className={t.textMuted} />
                                <span className={`text-xs ${t.textMuted}`}>Due:</span>
                                <input type="date"
                                  value={todo.dueDate ? todo.dueDate.split('T')[0] : ''}
                                  onChange={e => mutate({ type: 'SET_DUE_DATE', id: todo.id, dueDate: e.target.value }).then(d => { if (d) { setTodos(d.todos); setCategories(d.categories); } })}
                                  className={`text-xs rounded-lg px-2 py-1 outline-none ${t.input}`}
                                />
                                {todo.dueDate && (
                                  <button onClick={() => mutate({ type: 'SET_DUE_DATE', id: todo.id, dueDate: null }).then(d => { if (d) { setTodos(d.todos); setCategories(d.categories); } })}
                                    className={`hover:text-red-400 ${t.textMuted}`}><X size={12} /></button>
                                )}
                              </div>
                            </div>
                          )}
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </ul>
              </div>
            )}
          </div>
        ) : null}
      </div>
      )}
      
      {/* Bottom Navigation */}
      {(() => {
        const activeColorHex = COLORS.find(c => c.id === mascotColor)?.hex;
        return (
          <nav className={`vt-dock fixed left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] max-w-md z-40 transition-all duration-300 ${isNavVisible && !selectedNote ? "bottom-4" : "-bottom-24"}`}>
            <div className="flex justify-between items-center text-xs font-medium">
              {([
                ['home', <Clock key="i" size={18} />, locale === 'ar' ? 'اليوم' : 'Today', () => { setActiveTab('home'); setSelectedNote(null); setShowQuizSession(false); }],
                ['library', <LibraryIcon key="i" size={18} />, locale === 'ar' ? 'المكتبة' : 'Library', () => { setActiveTab('library'); setSelectedNote(null); setShowQuizSession(false); }],
                ['quizzes', <Brain key="i" size={18} />, locale === 'ar' ? 'اختبارات' : 'Quizzes', () => { setActiveTab('quizzes'); setSelectedNote(null); setShowQuizSession(false); }],
                ['lists', <ListTodo key="i" size={18} />, locale === 'ar' ? 'المهام' : 'Tasks', () => { setActiveTab('lists'); setIsListView(true); setSelectedNote(null); }],
                ['stats', <BarChart3 key="i" size={18} />, locale === 'ar' ? 'التقدم' : 'Progress', () => setActiveTab('stats')],
              ] as const).map(([id, icon, label, go]) => {
                const on = activeTab === id || (id === 'lists' && activeTab === 'today');
                return (
                  <button key={id} onClick={go as () => void} aria-current={on ? 'page' : undefined}
                    className={`vt-dock-btn relative flex-1 flex flex-col items-center gap-1 py-1.5 px-1 rounded-xl transition-colors active:scale-90 ${on ? 'is-on' : ''}`}
>
                    {on && <motion.span layoutId="vt-dock-pill" className="vt-dock-pill" transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }} />}
                    <span className="relative">{icon}</span>
                    <span className="relative text-[10px] font-mono tracking-wider">{label}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        );
      })()}
      
      {/* Padding for bottom nav */}
      {!selectedNote && <div className="h-20" />}

      {/* Install Guide Modal */}
      {showInstallGuide && (
        <div className="fixed inset-0 bg-black/40  z-50 flex items-center justify-center p-6"
          onClick={() => setShowInstallGuide(false)}>
          <div className={`rounded-3xl p-7 max-w-sm w-full shadow-2xl animate-pop-in ${isDark ? 'bg-slate-900 border border-slate-800 text-slate-100' : 'bg-white text-gray-900'}`}
            onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Install Guide</h2>
              <button onClick={() => setShowInstallGuide(false)} className={`p-1.5 rounded-full ${isDark ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-gray-100 text-gray-400 hover:text-gray-700'}`}><X size={18}/></button>
            </div>
            <div className="space-y-4 text-sm">
              <p className={isDark ? 'text-slate-300' : 'text-gray-600'}>To add this app to your home screen so it behaves like a native app:</p>
              
              <div className="space-y-3 pt-2">
                <div className="flex gap-3 items-start">
                  <Smartphone size={20} className="text-blue-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Safari on iPhone / iPad</h4>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Tap the share button in the browser menu, then scroll down and select <span className="font-semibold">"Add to Home Screen"</span>.</p>
                  </div>
                </div>
                
                <div className="flex gap-3 items-start">
                  <Smartphone size={20} className="text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Android / Chrome / Brave</h4>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Tap the menu dots in the top-right and select <span className="font-semibold">"Install App"</span> or <span className="font-semibold">"Add to Home Screen"</span>.</p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <Monitor size={20} className="text-purple-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Firefox / Other Browsers</h4>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Look for the install or download icon in the URL search bar, or use Chrome/Brave/Edge to install as a desktop shortcut.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <button onClick={() => setShowInstallGuide(false)} className="mt-6 w-full bg-blue-600 text-white font-semibold py-3.5 rounded-2xl shadow-md hover:bg-blue-700 transition-all active:scale-95">
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Download Menu Modal */}
      {showDownloadMenu && (
        <div className="fixed inset-0 bg-black/40  z-50 flex items-center justify-center p-6"
          onClick={() => setShowDownloadMenu(false)}>
          <div className={`rounded-3xl p-7 max-w-sm w-full shadow-2xl animate-pop-in ${isDark ? 'bg-slate-900 border border-slate-800 text-slate-100' : 'bg-white text-gray-900'}`}
            onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Download Vibe Todos</h2>
              <button onClick={() => setShowDownloadMenu(false)} className={`p-1.5 rounded-full ${isDark ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-gray-100 text-gray-400 hover:text-gray-700'}`}><X size={18}/></button>
            </div>
            
            <div className="space-y-3 pt-2">
              {/* Android APK Download Option */}
              <a 
                href="/downloads/Todos.apk" 
                download="Todos.apk"
                className={`w-full flex items-center justify-between py-3 px-4 rounded-2xl border transition-all font-semibold text-sm ${
                  isDark 
                    ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' 
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Smartphone size={18} className="text-green-500" />
                  Android Installer (APK)
                </span>
                <Download size={14} className="opacity-60" />
              </a>

              {/* Windows Setup Installer Option */}
              <a 
                href="/downloads/VibeTodosSetup.exe" 
                download="VibeTodosSetup.exe"
                className={`w-full flex items-center justify-between py-3 px-4 rounded-2xl border transition-all font-semibold text-sm ${
                  isDark 
                    ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' 
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Monitor size={18} className="text-blue-500" />
                  <span className="text-left">
                    Windows Setup Installer (EXE)
                    <span className="block text-[10px] font-normal opacity-60">Installs app, creates desktop & start menu shortcuts</span>
                  </span>
                </span>
                <Download size={14} className="opacity-60" />
              </a>

              {/* Web App PWA Installer Option */}
              <button 
                onClick={() => {
                  setShowDownloadMenu(false);
                  handleInstallClick();
                }}
                className={`w-full flex items-center justify-between py-3 px-4 rounded-2xl border transition-all font-semibold text-sm text-left ${
                  isDark 
                    ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' 
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Smartphone size={18} className="text-indigo-500" />
                  Install Web App (PWA Guide)
                </span>
                <ChevronRight size={14} className="opacity-60" />
              </button>

            </div>
          </div>
        </div>
      )}
      </main>
    </div>
  );
}
