// Ders kodu → tema değişkeni (renkler globals.css'te temaya göre ayarlı)
export const SUBJECT_COLOR: Record<string, string> = {
  TUR: 'var(--lgs-sub-tur)',
  MAT: 'var(--lgs-sub-mat)',
  FEN: 'var(--lgs-sub-fen)',
  INK: 'var(--lgs-sub-ink)',
  DIN: 'var(--lgs-sub-din)',
  YDL: 'var(--lgs-sub-ydl)',
};

export type SubjectRow = {
  code: string;
  name: string;
  question_count: number;
  coefficient: number;
  sort_order: number;
};

// Veritabanına ulaşılamazsa tanıtım sayfası yine de doğru bilgiyi göstersin.
export const FALLBACK_SUBJECTS: SubjectRow[] = [
  { code: 'TUR', name: 'Türkçe', question_count: 20, coefficient: 4, sort_order: 1 },
  { code: 'MAT', name: 'Matematik', question_count: 20, coefficient: 4, sort_order: 2 },
  { code: 'FEN', name: 'Fen Bilimleri', question_count: 20, coefficient: 4, sort_order: 3 },
  { code: 'INK', name: 'T.C. İnkılap Tarihi ve Atatürkçülük', question_count: 10, coefficient: 1, sort_order: 4 },
  { code: 'DIN', name: 'Din Kültürü ve Ahlak Bilgisi', question_count: 10, coefficient: 1, sort_order: 5 },
  { code: 'YDL', name: 'Yabancı Dil', question_count: 10, coefficient: 1, sort_order: 6 },
];
