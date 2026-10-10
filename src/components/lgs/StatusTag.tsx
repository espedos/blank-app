export type ContentState = 'none' | 'draft' | 'review' | 'approved' | 'archived';

const LABELS: Record<ContentState, string> = {
  none: 'İçerik yok',
  draft: 'Taslak',
  review: 'İncelemede',
  approved: 'Yayında',
  archived: 'Arşivde',
};

/** Durum etiketi: renk tek başına anlam taşımasın diye her zaman yazıyla. */
export function StatusTag({ state }: { state: ContentState }) {
  const tone =
    state === 'approved'
      ? 'border-lgs-ok text-lgs-ok'
      : state === 'none'
        ? 'border-lgs-line text-lgs-soft'
        : 'border-lgs-accent text-lgs-mark';
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold ${tone}`}>
      {LABELS[state]}
    </span>
  );
}
