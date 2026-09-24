import { create } from 'zustand';

export type Theme = 'light' | 'dark';

const KEY = 'digstdio:theme';

function initial(): Theme {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // localStorage bloqueado: cai no tema do sistema.
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const apply = (theme: Theme) => {
  document.documentElement.dataset.theme = theme;
};

interface ThemeState {
  theme: Theme;
  toggle: () => void;
}

export const useTheme = create<ThemeState>((set, get) => ({
  theme: initial(),
  toggle: () => {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark';
    apply(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // sem persistência, vale só nesta sessão.
    }
    set({ theme: next });
  },
}));

// Aplica antes do primeiro render para não piscar o tema errado.
apply(useTheme.getState().theme);
