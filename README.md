# Vira Koç - Online Coaching Platform

YKS (Üniversite Giriş Sınavı) ve LGS (Liselere Giriş Sınavı) için çevrimiçi koçluk platformu.

## Özellikler

- **YKS TYT Sistemi**: Türkçe, Matematik, Fen (3 ders, paralel karışık program)
- **Günlük Program**: Öğrenci iyileştirmesi ve bellek temelli program üretimi
- **Soru Çözümü**: Google Gemini AI ile entegre yapay zeka destekli çözümler
- **Öğrenci Takibi**: İlerleme raporları ve ustalık seviyeleri
- **Esnek Takvim**: MEB okul takvimi entegrasyonu ile yoğunluk ayarlaması

## Başlamak

### Ön Koşullar

- Node.js 18+ ve npm 9+
- Supabase hesabı (database ve auth)
- Google Gemini API anahtarı

### Kurulum

1. Bağımlılıkları yükleyin:
```bash
npm install
```

2. Ortam değişkenlerini ayarlayın:
```bash
cp .env.local.example .env.local
```

Gerekli değerleri `.env.local` dosyasına ekleyin:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GOOGLE_GEMINI_API_KEY`

3. Geliştirme sunucusunu başlatın:
```bash
npm run dev
```

Tarayıcıda `http://localhost:3000` adresine gidin.

### Üretim Derleme

```bash
npm run build
npm start
```

## Vercel'e Dağıtma

1. Vercel'e bağlayın:
```bash
vercel link
```

2. Ortam değişkenlerini ayarlayın:
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add GOOGLE_GEMINI_API_KEY
```

3. Dağıtın:
```bash
vercel deploy --prod
```

## Proje Yapısı

```
src/
├── pages/
│   ├── index.tsx              # Ana sayfa (yönlendirme)
│   ├── yks/
│   │   ├── register/
│   │   │   ├── quickstart.tsx  # Hızlı kayıt
│   │   │   └── detay/[id].tsx  # Profil detayları
│   │   └── panel.tsx           # YKS kontrol paneli
│   ├── api/
│   │   └── ai/
│   │       └── solve.ts        # Soru çözümü API
├── components/                # React bileşenleri
├── lib/                       # Yardımcı fonksiyonlar
└── styles/                    # Stil dosyaları
```

## Tasarım Felsefesi

- **Bölge 1**: Günlük Görevler ve Program Arayüzü (KIRMIZI/TURUNCU/YEŞİL kodlama)
- **Bölge 2**: YZ Hafızası ve Bot Sistemi
- **Bölge 3**: Konu Anlatımı Platformu (rahat, görsel)
- **Bölge 4**: Soru Çözümü Platformu (hızlı, disiplinli)
- **Bölge 5**: Rem Tabanlı Yazı Sistemi
- **Bölge 6**: Sınav Takvimi ve Program Görünümü

## İletişim

Cengiz Bey - Vira Koç Kurucusu
Email: espedos@gmail.com
