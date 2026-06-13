import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

// ── Font catalogue ────────────────────────────────────────────────────────────

export interface FontOption {
  id: string;
  label: string;
  css: string;
  googleFamily?: string;
  googleWeights?: string;
  category: 'system' | 'modern' | 'professional' | 'gaming' | 'mono' | 'display' | 'editorial';
}

export const FONT_CATEGORIES: Record<string, string> = {
  system:       'System',
  modern:       'Modern / Clean',
  professional: 'Professional / SaaS',
  gaming:       'Gaming / Tech',
  mono:         'Monospace',
  display:      'Display / Elegant',
  editorial:    'Editorial / Serif',
};

export const FONTS: FontOption[] = [
  // ── System ────────────────────────────────────────────────────────────────
  { id: 'system',        label: 'Default (System)',    css: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",   category: 'system' },
  { id: 'mono-system',   label: 'System Mono',         css: "ui-monospace, 'Cascadia Code', Consolas, monospace",                 category: 'system' },
  { id: 'serif-system',  label: 'System Serif',        css: "ui-serif, Georgia, 'Times New Roman', serif",                       category: 'system' },

  // ── Modern / Clean ────────────────────────────────────────────────────────
  { id: 'inter',         label: 'Inter',               css: "'Inter', sans-serif",               googleFamily: 'Inter',               googleWeights: '300;400;500;600;700',     category: 'modern' },
  { id: 'roboto',        label: 'Roboto',              css: "'Roboto', sans-serif",              googleFamily: 'Roboto',              googleWeights: '300;400;500;700',         category: 'modern' },
  { id: 'openSans',      label: 'Open Sans',           css: "'Open Sans', sans-serif",           googleFamily: 'Open Sans',           googleWeights: '300;400;500;600;700',     category: 'modern' },
  { id: 'lato',          label: 'Lato',                css: "'Lato', sans-serif",                googleFamily: 'Lato',                googleWeights: '300;400;700',             category: 'modern' },
  { id: 'poppins',       label: 'Poppins',             css: "'Poppins', sans-serif",             googleFamily: 'Poppins',             googleWeights: '300;400;500;600;700',     category: 'modern' },
  { id: 'nunito',        label: 'Nunito',              css: "'Nunito', sans-serif",              googleFamily: 'Nunito',              googleWeights: '300;400;500;600;700;800', category: 'modern' },
  { id: 'workSans',      label: 'Work Sans',           css: "'Work Sans', sans-serif",           googleFamily: 'Work Sans',           googleWeights: '300;400;500;600;700',     category: 'modern' },
  { id: 'dmSans',        label: 'DM Sans',             css: "'DM Sans', sans-serif",             googleFamily: 'DM Sans',             googleWeights: '300;400;500;600;700',     category: 'modern' },
  { id: 'manrope',       label: 'Manrope',             css: "'Manrope', sans-serif",             googleFamily: 'Manrope',             googleWeights: '300;400;500;600;700;800', category: 'modern' },
  { id: 'outfit',        label: 'Outfit',              css: "'Outfit', sans-serif",              googleFamily: 'Outfit',              googleWeights: '300;400;500;600;700',     category: 'modern' },
  { id: 'figtree',       label: 'Figtree',             css: "'Figtree', sans-serif",             googleFamily: 'Figtree',             googleWeights: '300;400;500;600;700;800', category: 'modern' },
  { id: 'plusJakarta',   label: 'Plus Jakarta Sans',   css: "'Plus Jakarta Sans', sans-serif",   googleFamily: 'Plus Jakarta Sans',   googleWeights: '300;400;500;600;700;800', category: 'modern' },
  { id: 'urbanist',      label: 'Urbanist',            css: "'Urbanist', sans-serif",            googleFamily: 'Urbanist',            googleWeights: '300;400;500;600;700',     category: 'modern' },
  { id: 'quicksand',     label: 'Quicksand',           css: "'Quicksand', sans-serif",           googleFamily: 'Quicksand',           googleWeights: '300;400;500;600;700',     category: 'modern' },
  { id: 'epilogue',      label: 'Epilogue',            css: "'Epilogue', sans-serif",            googleFamily: 'Epilogue',            googleWeights: '300;400;500;600;700',     category: 'modern' },

  // ── Professional / SaaS ───────────────────────────────────────────────────
  { id: 'lexend',        label: 'Lexend',              css: "'Lexend', sans-serif",              googleFamily: 'Lexend',              googleWeights: '300;400;500;600;700',     category: 'professional' },
  { id: 'sourceSans3',   label: 'Source Sans 3',       css: "'Source Sans 3', sans-serif",       googleFamily: 'Source Sans 3',       googleWeights: '300;400;500;600;700',     category: 'professional' },
  { id: 'ibmPlexSans',   label: 'IBM Plex Sans',       css: "'IBM Plex Sans', sans-serif",       googleFamily: 'IBM Plex Sans',       googleWeights: '300;400;500;600;700',     category: 'professional' },
  { id: 'mulish',        label: 'Mulish',              css: "'Mulish', sans-serif",              googleFamily: 'Mulish',              googleWeights: '300;400;500;600;700;800', category: 'professional' },
  { id: 'karla',         label: 'Karla',               css: "'Karla', sans-serif",               googleFamily: 'Karla',               googleWeights: '400;500;600;700',         category: 'professional' },
  { id: 'nunitoSans',    label: 'Nunito Sans',         css: "'Nunito Sans', sans-serif",         googleFamily: 'Nunito Sans',         googleWeights: '300;400;500;600;700;800', category: 'professional' },
  { id: 'instrumentSans',label: 'Instrument Sans',     css: "'Instrument Sans', sans-serif",     googleFamily: 'Instrument Sans',     googleWeights: '400;500;600;700',         category: 'professional' },
  { id: 'onest',         label: 'Onest',               css: "'Onest', sans-serif",               googleFamily: 'Onest',               googleWeights: '300;400;500;600;700',     category: 'professional' },

  // ── Gaming / Tech ─────────────────────────────────────────────────────────
  { id: 'spaceGrotesk',  label: 'Space Grotesk',       css: "'Space Grotesk', sans-serif",       googleFamily: 'Space Grotesk',       googleWeights: '300;400;500;600;700',     category: 'gaming' },
  { id: 'orbitron',      label: 'Orbitron',            css: "'Orbitron', sans-serif",            googleFamily: 'Orbitron',            googleWeights: '400;500;600;700;800;900', category: 'gaming' },
  { id: 'oxanium',       label: 'Oxanium',             css: "'Oxanium', sans-serif",             googleFamily: 'Oxanium',             googleWeights: '300;400;500;600;700;800', category: 'gaming' },
  { id: 'exo2',          label: 'Exo 2',               css: "'Exo 2', sans-serif",               googleFamily: 'Exo 2',               googleWeights: '300;400;500;600;700',     category: 'gaming' },
  { id: 'rajdhani',      label: 'Rajdhani',            css: "'Rajdhani', sans-serif",            googleFamily: 'Rajdhani',            googleWeights: '300;400;500;600;700',     category: 'gaming' },
  { id: 'syncopate',     label: 'Syncopate',           css: "'Syncopate', sans-serif",           googleFamily: 'Syncopate',           googleWeights: '400;700',                 category: 'gaming' },
  { id: 'audiowide',     label: 'Audiowide',           css: "'Audiowide', sans-serif",           googleFamily: 'Audiowide',           googleWeights: '400',                     category: 'gaming' },
  { id: 'chakraPetch',   label: 'Chakra Petch',        css: "'Chakra Petch', sans-serif",        googleFamily: 'Chakra Petch',        googleWeights: '300;400;500;600;700',     category: 'gaming' },
  { id: 'russoOne',      label: 'Russo One',           css: "'Russo One', sans-serif",           googleFamily: 'Russo One',           googleWeights: '400',                     category: 'gaming' },
  { id: 'teko',          label: 'Teko',                css: "'Teko', sans-serif",                googleFamily: 'Teko',                googleWeights: '300;400;500;600;700',     category: 'gaming' },
  { id: 'shareTech',     label: 'Share Tech',          css: "'Share Tech', sans-serif",          googleFamily: 'Share Tech',          googleWeights: '400',                     category: 'gaming' },

  // ── Monospace ─────────────────────────────────────────────────────────────
  { id: 'jetbrainsMono', label: 'JetBrains Mono',      css: "'JetBrains Mono', monospace",       googleFamily: 'JetBrains Mono',      googleWeights: '300;400;500;600;700',     category: 'mono' },
  { id: 'firaCode',      label: 'Fira Code',           css: "'Fira Code', monospace",            googleFamily: 'Fira Code',           googleWeights: '300;400;500;600;700',     category: 'mono' },
  { id: 'sourceCode',    label: 'Source Code Pro',     css: "'Source Code Pro', monospace",      googleFamily: 'Source Code Pro',     googleWeights: '300;400;500;600;700',     category: 'mono' },
  { id: 'ibmPlex',       label: 'IBM Plex Mono',       css: "'IBM Plex Mono', monospace",        googleFamily: 'IBM Plex Mono',       googleWeights: '300;400;500;600;700',     category: 'mono' },
  { id: 'spaceMono',     label: 'Space Mono',          css: "'Space Mono', monospace",           googleFamily: 'Space Mono',          googleWeights: '400;700',                 category: 'mono' },
  { id: 'courierPrime',  label: 'Courier Prime',       css: "'Courier Prime', monospace",        googleFamily: 'Courier Prime',       googleWeights: '400;700',                 category: 'mono' },
  { id: 'shareTechMono', label: 'Share Tech Mono',     css: "'Share Tech Mono', monospace",      googleFamily: 'Share Tech Mono',     googleWeights: '400',                     category: 'mono' },

  // ── Display / Elegant ─────────────────────────────────────────────────────
  { id: 'raleway',       label: 'Raleway',             css: "'Raleway', sans-serif",             googleFamily: 'Raleway',             googleWeights: '300;400;500;600;700;800', category: 'display' },
  { id: 'cinzel',        label: 'Cinzel',              css: "'Cinzel', serif",                   googleFamily: 'Cinzel',              googleWeights: '400;500;600;700;800;900', category: 'display' },
  { id: 'playfair',      label: 'Playfair Display',    css: "'Playfair Display', serif",         googleFamily: 'Playfair Display',    googleWeights: '400;500;600;700;800',     category: 'display' },
  { id: 'josefinSans',   label: 'Josefin Sans',        css: "'Josefin Sans', sans-serif",        googleFamily: 'Josefin Sans',        googleWeights: '100;300;400;600;700',     category: 'display' },
  { id: 'cormorant',     label: 'Cormorant Garamond',  css: "'Cormorant Garamond', serif",       googleFamily: 'Cormorant Garamond',  googleWeights: '300;400;500;600;700',     category: 'display' },
  { id: 'sora',          label: 'Sora',                css: "'Sora', sans-serif",                googleFamily: 'Sora',                googleWeights: '300;400;500;600;700;800', category: 'display' },
  { id: 'dmSerifDisplay',label: 'DM Serif Display',    css: "'DM Serif Display', serif",         googleFamily: 'DM Serif Display',    googleWeights: '400',                     category: 'display' },
  { id: 'fraunces',      label: 'Fraunces',            css: "'Fraunces', serif",                 googleFamily: 'Fraunces',            googleWeights: '300;400;500;600;700;800', category: 'display' },
  { id: 'lobster',       label: 'Lobster',             css: "'Lobster', cursive",                googleFamily: 'Lobster',             googleWeights: '400',                     category: 'display' },

  // ── Editorial / Serif ─────────────────────────────────────────────────────
  { id: 'libreFranklin', label: 'Libre Franklin',      css: "'Libre Franklin', sans-serif",      googleFamily: 'Libre Franklin',      googleWeights: '300;400;500;600;700',     category: 'editorial' },
  { id: 'libreBaskerville',label:'Libre Baskerville',  css: "'Libre Baskerville', serif",        googleFamily: 'Libre Baskerville',   googleWeights: '400;700',                 category: 'editorial' },
  { id: 'merriweather',  label: 'Merriweather',        css: "'Merriweather', serif",             googleFamily: 'Merriweather',        googleWeights: '300;400;700',             category: 'editorial' },
  { id: 'ebGaramond',    label: 'EB Garamond',         css: "'EB Garamond', serif",              googleFamily: 'EB Garamond',         googleWeights: '400;500;600;700;800',     category: 'editorial' },
  { id: 'lora',          label: 'Lora',                css: "'Lora', serif",                     googleFamily: 'Lora',                googleWeights: '400;500;600;700',         category: 'editorial' },
  { id: 'crimsonPro',    label: 'Crimson Pro',         css: "'Crimson Pro', serif",              googleFamily: 'Crimson Pro',         googleWeights: '300;400;500;600;700',     category: 'editorial' },
];

// ── Presets ───────────────────────────────────────────────────────────────────

export const PRESETS = [
  { name: 'Neon',     accent: '#9EFF00', bgColor: '#0C0C0C' },
  { name: 'Cyber',    accent: '#0EA5E9', bgColor: '#040D1A' },
  { name: 'Crimson',  accent: '#EF4444', bgColor: '#130808' },
  { name: 'Violet',   accent: '#A855F7', bgColor: '#0D0812' },
  { name: 'Amber',    accent: '#F59E0B', bgColor: '#0A0600' },
  { name: 'Teal',     accent: '#14B8A6', bgColor: '#020E0D' },
  { name: 'Rose',     accent: '#F43F5E', bgColor: '#0D0208' },
  { name: 'Emerald',  accent: '#10B981', bgColor: '#021208' },
];

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ThemeSave {
  name: string;
  accent: string;
  bgColor: string;
  fontId: string;
  compactMode: boolean;
  glowMode?: boolean;
}

interface Theme {
  accent: string;
  bgColor: string;
  fontId: string;
  compactMode: boolean;
  glowMode: boolean;
}

const DEFAULT: Theme = {
  accent: '#9B77FF',
  bgColor: '#0C0C0C',
  fontId: 'system',
  compactMode: false,
  glowMode: false,
};

const SAVES_KEY = 'ram_theme_configs';

interface Ctx {
  theme: Theme;
  setAccent: (c: string) => void;
  setBgColor: (c: string) => void;
  setFontId: (id: string) => void;
  setCompactMode: (v: boolean) => void;
  setGlowMode: (v: boolean) => void;
  applyPreset: (p: { accent: string; bgColor: string }) => void;
  resetTheme: () => void;
  savedConfigs: ThemeSave[];
  saveConfig: (name: string) => void;
  loadConfig: (config: ThemeSave) => void;
  deleteConfig: (name: string) => void;
  hideUsernames: boolean;
  setHideUsernames: (v: boolean) => void;
  hideNotes: boolean;
  setHideNotes: (v: boolean) => void;
}

const ThemeCtx = createContext<Ctx | null>(null);

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error('useTheme outside ThemeProvider');
  return ctx;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? `${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}` : '155, 119, 255';
}

export function loadGoogleFont(family: string, weights = '300;400;500;600;700') {
  const id = `gf-${family.replace(/\s+/g, '-').toLowerCase()}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}:wght@${weights}&display=swap`;
  document.head.appendChild(link);
}

function loadSaves(): ThemeSave[] {
  try {
    const raw = localStorage.getItem(SAVES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const s = localStorage.getItem('ram_theme');
      if (s) return { ...DEFAULT, ...JSON.parse(s) };
    } catch { /* */ }
    return DEFAULT;
  });

  const [savedConfigs, setSavedConfigs] = useState<ThemeSave[]>(loadSaves);
  const [hideUsernames, setHideUsernamesState] = useState<boolean>(() => {
    try { return localStorage.getItem('ram_hide_usernames') === 'true'; } catch { return false; }
  });
  const setHideUsernames = (v: boolean) => {
    setHideUsernamesState(v);
    try { localStorage.setItem('ram_hide_usernames', String(v)); } catch {}
  };

  const [hideNotes, setHideNotesState] = useState<boolean>(() => {
    try { return localStorage.getItem('ram_hide_notes') === 'true'; } catch { return false; }
  });
  const setHideNotes = (v: boolean) => {
    setHideNotesState(v);
    try { localStorage.setItem('ram_hide_notes', String(v)); } catch {}
  };

  useEffect(() => {
    const r = document.documentElement;
    r.style.setProperty('--accent', theme.accent);
    r.style.setProperty('--accent-rgb', hexToRgb(theme.accent));
    r.style.setProperty('--bg', theme.bgColor);

    document.body.style.background = theme.bgColor;
    document.documentElement.style.background = theme.bgColor;

    const fontOpt = FONTS.find(f => f.id === theme.fontId) ?? FONTS[0];
    if (fontOpt.googleFamily) loadGoogleFont(fontOpt.googleFamily, fontOpt.googleWeights);
    const fontCss = fontOpt.css;
    r.style.setProperty('--font', fontCss);
    document.body.style.fontFamily = fontCss;

    if (theme.compactMode) {
      r.setAttribute('data-compact', 'true');
    } else {
      r.removeAttribute('data-compact');
    }

    if (theme.glowMode) {
      r.setAttribute('data-glow', 'true');
    } else {
      r.removeAttribute('data-glow');
    }

    localStorage.setItem('ram_theme', JSON.stringify(theme));
  }, [theme]);

  const setAccent      = (accent: string)       => setTheme(t => ({ ...t, accent }));
  const setBgColor     = (bgColor: string)      => setTheme(t => ({ ...t, bgColor }));
  const setFontId      = (fontId: string)       => setTheme(t => ({ ...t, fontId }));
  const setCompactMode = (compactMode: boolean) => setTheme(t => ({ ...t, compactMode }));
  const setGlowMode    = (glowMode: boolean)    => setTheme(t => ({ ...t, glowMode }));
  const applyPreset    = (p: { accent: string; bgColor: string }) => setTheme(t => ({ ...t, ...p }));
  const resetTheme     = () => setTheme(DEFAULT);

  const saveConfig = (name: string) => {
    if (!name.trim()) return;
    const config: ThemeSave = { name: name.trim(), ...theme };
    const updated = [config, ...savedConfigs.filter(c => c.name !== name.trim())];
    setSavedConfigs(updated);
    localStorage.setItem(SAVES_KEY, JSON.stringify(updated));
  };

  const loadConfig = (config: ThemeSave) => {
    const { name: _n, ...themeData } = config;
    setTheme({ ...DEFAULT, ...themeData });
  };

  const deleteConfig = (name: string) => {
    const updated = savedConfigs.filter(c => c.name !== name);
    setSavedConfigs(updated);
    localStorage.setItem(SAVES_KEY, JSON.stringify(updated));
  };

  return (
    <ThemeCtx.Provider value={{
      theme,
      setAccent, setBgColor, setFontId, setCompactMode, setGlowMode,
      applyPreset, resetTheme,
      savedConfigs, saveConfig, loadConfig, deleteConfig,
      hideUsernames, setHideUsernames,
      hideNotes, setHideNotes,
    }}>
      {children}
    </ThemeCtx.Provider>
  );
}
