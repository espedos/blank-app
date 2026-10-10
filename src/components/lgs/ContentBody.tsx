// Koçun editörde düz metin olarak yazdığı içeriği okunur biçime çevirir.
// Kurallar editördeki ipuçlarıyla aynıdır: paragraflar boş satırla ayrılır,
// kısa ilk satır başlık olur, "a | b | c" satırları tablo olur, her satır bir maddedir.

const COACH_MARKER = /\[Koç notu bekleniyor\]/g;

/** Öğrenciye gösterilmeyecek iç işaretleri temizler. */
export function cleanForStudent(text: string | null | undefined) {
  return (text ?? '').replace(COACH_MARKER, '').replace(/[ \t]+\n/g, '\n').trim();
}

function isHeading(line: string, hasMore: boolean) {
  const t = line.trim();
  if (!hasMore || t.length === 0 || t.length > 48) return false;
  if (/[.:?!;,]$/.test(t)) return false;
  if (/[=|→]/.test(t)) return false;
  if (/^(Soru|Çözüm)\s*:/i.test(t)) return false;
  return true;
}

const isTableLine = (line: string) => line.includes(' | ');

function Line({ text }: { text: string }) {
  const m = text.match(/^(Soru|Çözüm)\s*:\s*(.*)$/);
  if (m) {
    return (
      <p className="leading-relaxed">
        <span className="font-semibold text-lgs-mark">{m[1]}:</span> {m[2]}
      </p>
    );
  }
  return <p className="leading-relaxed">{text}</p>;
}

function Table({ lines }: { lines: string[] }) {
  const rows = lines.map((l) => l.split('|').map((c) => c.trim()));
  return (
    <div className="overflow-x-auto">
      <table className="border-collapse text-sm">
        <tbody>
          {rows.map((cells, i) => (
            <tr key={i}>
              {cells.map((c, j) =>
                j === 0 ? (
                  <th
                    key={j}
                    scope="row"
                    className="border border-lgs-line bg-lgs-raised px-3 py-1.5 text-left font-semibold"
                  >
                    {c}
                  </th>
                ) : (
                  <td key={j} className="border border-lgs-line px-3 py-1.5 text-center tabular-nums">
                    {c}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Block({ lines }: { lines: string[] }) {
  // Ardışık tablo satırlarını grupla
  const parts: ({ kind: 'table'; lines: string[] } | { kind: 'line'; text: string })[] = [];
  for (const l of lines) {
    const last = parts[parts.length - 1];
    if (isTableLine(l)) {
      if (last && last.kind === 'table') last.lines.push(l);
      else parts.push({ kind: 'table', lines: [l] });
    } else {
      parts.push({ kind: 'line', text: l });
    }
  }
  return (
    <div className="space-y-1.5">
      {parts.map((p, i) =>
        p.kind === 'table' && p.lines.length > 1 ? (
          <Table key={i} lines={p.lines} />
        ) : p.kind === 'table' ? (
          <Line key={i} text={p.lines[0]} />
        ) : (
          <Line key={i} text={p.text} />
        ),
      )}
    </div>
  );
}

export function ContentBody({ text }: { text: string }) {
  const paragraphs = cleanForStudent(text)
    .split(/\n\s*\n/)
    .map((p) => p.split('\n').map((l) => l.trim()).filter(Boolean))
    .filter((p) => p.length);

  return (
    <div className="space-y-6">
      {paragraphs.map((lines, i) => {
        const heading = isHeading(lines[0], lines.length > 1);
        const body = heading ? lines.slice(1) : lines;
        return (
          <div key={i}>
            {heading && <h3 className="mb-2 font-display text-lg font-bold">{lines[0]}</h3>}
            <Block lines={body} />
          </div>
        );
      })}
    </div>
  );
}

export function LineList({ text, marker = '•' }: { text: string; marker?: string }) {
  const items = cleanForStudent(text)
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5 leading-relaxed">
          <span aria-hidden className="flex-none font-bold">
            {marker}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
