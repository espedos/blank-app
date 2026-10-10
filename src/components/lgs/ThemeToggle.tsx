'use client';

import { useEffect, useState } from 'react';
import { Sun, CloudSun, Palette, Wine, Leaf, Moon, Gem } from 'lucide-react';
import { THEMES, THEME_NAMES, readTheme, applyTheme, type LgsTheme } from './theme';

const ICONS: Record<LgsTheme, typeof Sun> = {
  light: Sun, sky: CloudSun, anthracite: Palette, wine: Wine, mint: Leaf, dark: Moon, sapphire: Gem,
};

/** Sadece ikon: her tıklamada sıradaki temaya geçer (sitenin geri kalanıyla aynı). */
export function ThemeToggle() {
  const [theme, setTheme] = useState<LgsTheme>('dark');

  useEffect(() => {
    setTheme(readTheme());
  }, []);

  const next = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
  const Icon = ICONS[theme];

  return (
    <button
      type="button"
      onClick={() => {
        applyTheme(next);
        setTheme(next);
      }}
      title={`Tema: ${THEME_NAMES[theme]} (sıradaki: ${THEME_NAMES[next]})`}
      aria-label={`Temayı değiştir. Şu an: ${THEME_NAMES[theme]}`}
      className="h-10 w-10 inline-flex items-center justify-center rounded-full border border-lgs-line bg-lgs-surface text-lgs-ink hover:bg-lgs-raised transition-colors"
    >
      <Icon className="h-[18px] w-[18px]" aria-hidden />
    </button>
  );
}
