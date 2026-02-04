/**
 * useTheme — custom hook for toggling light/dark mode
 *
 * Syncs theme to <html> class and localStorage.
 * Uses system preference as default if no saved preference.
 */

import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'app-theme';

function getInitialTheme(): Theme {
  // Check localStorage for saved preference
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;

  // Check system preference
  if (window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';

  // Default to dark
  return 'dark';
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  return { theme, toggleTheme } as const;
}
