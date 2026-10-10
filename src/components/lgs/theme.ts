// LGS sayfaları sitenin geri kalanıyla aynı tema tercihini kullanır
// (localStorage 'vira_theme'), böylece YKS'de seçilen tema burada da geçerli.
export const THEMES = ['light', 'sky', 'anthracite', 'wine', 'mint', 'dark', 'sapphire'] as const;
export type LgsTheme = (typeof THEMES)[number];
export const THEME_STORAGE_KEY = 'vira_theme';

export const THEME_NAMES: Record<LgsTheme, string> = {
  light: 'Klasik açık',
  sky: 'Gök mavisi',
  anthracite: 'Antrasit',
  wine: 'Gül kurusu',
  mint: 'Koyu su yeşili',
  dark: 'Derin gece',
  sapphire: 'Gece safiri',
};

/** Sayfa boyanmadan önce temayı uygulayan küçük betik (renk sıçramasını önler). */
export const themeInitScript = `
(function () {
  try {
    var raw = localStorage.getItem('${THEME_STORAGE_KEY}');
    var t = raw ? JSON.parse(raw) : 'dark';
    var ok = ${JSON.stringify(THEMES)};
    if (ok.indexOf(t) === -1) t = 'dark';
    var b = document.body;
    ok.forEach(function (n) { b.classList.remove('theme-' + n); });
    b.classList.add('theme-' + t);
  } catch (e) {}
})();`;

export function readTheme(): LgsTheme {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    const t = raw ? JSON.parse(raw) : 'dark';
    return (THEMES as readonly string[]).includes(t) ? (t as LgsTheme) : 'dark';
  } catch {
    return 'dark';
  }
}

export function applyTheme(t: LgsTheme) {
  const b = document.body;
  THEMES.forEach((n) => b.classList.remove(`theme-${n}`));
  b.classList.add(`theme-${t}`);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(t));
  } catch {
    /* gizli sekmede depolama kapalı olabilir */
  }
}
