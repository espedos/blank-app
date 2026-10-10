'use client';

import { useEffect, useState } from 'react';

/**
 * Tanıtım alanının arkasında kendiliğinden değişen, opaklığı azaltılmış
 * görseller. Görseller `public/arkaplan/` klasöründen okunur; yeni görsel
 * eklemek için dosyayı oraya koyup aşağıdaki listeye bir satır eklemek yeterli.
 *
 * Opaklık ve üstteki perde tema grubuna göre değişir (globals.css):
 * koyu temalarda görsel baskın, açık temalarda silik kalır ki koyu metin
 * okunur olsun. `tone="dark"` verilirse tema ne olursa olsun koyu ayar kullanılır
 * (zemini her hâlükârda koyu olan bölümler için).
 *
 * Sarmalayıcı öğe `relative` ve `overflow-hidden` olmalı; içerik de
 * `relative z-10` ile görselin üstünde kalmalı.
 */

const GORSELLER = ['/arkaplan/1.jpg', '/arkaplan/2.jpg', '/arkaplan/3.jpg'];
const GECIS_SURESI = 7000; // bir görselin ekranda kalma süresi (ms)

export function HeroBackdrop({ tone }: { tone?: 'dark' }) {
  const [sira, setSira] = useState(0);
  // İlk boyamayı hafif tutmak için diğer görseller biraz sonra eklenir.
  const [hepsi, setHepsi] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHepsi(true), 1200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (GORSELLER.length < 2) return;
    // Hareketi azaltılmış cihazlarda görsel değişmez, ilki sabit kalır.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const t = setInterval(() => {
      // Sekme arka plandayken boşuna görsel değiştirme
      if (document.hidden) return;
      setSira((n) => (n + 1) % GORSELLER.length);
    }, GECIS_SURESI);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="lgs-hero-backdrop" data-tone={tone} aria-hidden>
      <div className="lgs-hero-images">
        {GORSELLER.map((src, n) =>
          n === 0 || hepsi ? (
            <div
              key={src}
              className="lgs-hero-image"
              data-active={n === sira}
              style={{ backgroundImage: `url(${src})` }}
            />
          ) : null,
        )}
      </div>
      <div className="lgs-hero-veil" />
    </div>
  );
}
