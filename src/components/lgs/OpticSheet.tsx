import { SUBJECT_COLOR, type SubjectRow } from './subjects';

/**
 * LGS'nin 90 sorusu, derslere göre gruplanmış optik form baloncukları.
 * `filled` verilirse her dersin o kadar baloncuğu dolu gösterilir
 * (ileride öğrencinin kazanım ilerlemesi buraya bağlanacak).
 */
export function OpticSheet({
  subjects,
  filled,
  animate = false,
}: {
  subjects: SubjectRow[];
  filled?: Record<string, number>;
  animate?: boolean;
}) {
  let delay = 0;
  return (
    <div className="rounded-2xl border border-lgs-line bg-lgs-surface p-5 sm:p-6">
      <ul className="space-y-4">
        {subjects.map((s) => {
          const n = filled ? Math.min(filled[s.code] ?? 0, s.question_count) : s.question_count;
          return (
            <li key={s.code}>
              <div className="flex items-baseline justify-between gap-3 mb-2">
                <span className="text-sm font-semibold text-lgs-ink">{s.name}</span>
                <span className="text-xs text-lgs-soft whitespace-nowrap">
                  {s.question_count} soru, katsayı {s.coefficient}
                </span>
              </div>
              <div
                className="flex flex-wrap gap-[5px]"
                style={{ color: SUBJECT_COLOR[s.code] ?? 'var(--lgs-accent)' }}
                aria-hidden
              >
                {Array.from({ length: s.question_count }).map((_, i) => {
                  const d = delay++;
                  return (
                    <span
                      key={i}
                      className={`lgs-bubble ${animate && i < n ? 'lgs-bubble-anim' : ''}`}
                      data-filled={i < n}
                      style={animate ? { animationDelay: `${d * 18}ms` } : undefined}
                    />
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
