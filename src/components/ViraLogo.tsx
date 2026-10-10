'use client';

import React from 'react';

interface ViraLogoProps {
  size?: number;
  className?: string;
  /** full = logo + wordmark, icon = icon only */
  variant?: 'full' | 'icon';
}

export const ViraLogo: React.FC<ViraLogoProps> = ({ size = 42, className = '', variant = 'full' }) => {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Vira Kurumsal Pusula & İleri Ok Vektörel Monogramı */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Vira Kurumsal Pusula & İleri Ok Logosu"
        className="transition-transform duration-300 hover:scale-105"
      >
        <defs>
          {/* Arka plan zemin degrade */}
          <linearGradient id="vira-bg-grad" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="50%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>

          {/* İleri yön ok gradyanı */}
          <linearGradient id="arrow-grad" x1="22" y1="6" x2="22" y2="38" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#e0e7ff" />
          </linearGradient>

          {/* Altın / Pusula iğnesi aksanı */}
          <linearGradient id="compass-gold" x1="16" y1="16" x2="28" y2="28" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#818cf8" />
          </linearGradient>
        </defs>

        {/* Squircle Çerçeve */}
        <rect width="44" height="44" rx="12" fill="url(#vira-bg-grad)" />

        {/* Pusula Dış Dairesi (Halka) */}
        <circle cx="22" cy="22" r="15" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" strokeDasharray="2 3" />

        {/* Pusula 4 Ana Yön Noktası */}
        <circle cx="22" cy="7" r="1.5" fill="#ffffff" />
        <circle cx="37" cy="22" r="1.2" fill="rgba(255,255,255,0.4)" />
        <circle cx="22" cy="37" r="1.2" fill="rgba(255,255,255,0.4)" />
        <circle cx="7" cy="22" r="1.2" fill="rgba(255,255,255,0.4)" />

        {/* Geometrik 'V' ve İleri Yön Oku (Vira Monogramı) */}
        {/* Sol kanat */}
        <path
          d="M12 14L22 33L32 14"
          stroke="url(#arrow-grad)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Pusula İleri Ok Ucu (Kuzey / İleri Hedef Yönü) */}
        <path
          d="M22 9L26.5 18L22 16L17.5 18L22 9Z"
          fill="#ffffff"
          className="drop-shadow-[0_1px_3px_rgba(0,0,0,0.3)]"
        />

        {/* Merkez Odak Noktası */}
        <circle cx="22" cy="22" r="2.2" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.2" />
      </svg>

      {variant === 'full' && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-1.5">
            <span className="font-black text-white tracking-tight text-xl font-sans vira-logo-wordmark">
              VİRA
            </span>
            <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 uppercase tracking-wider vira-brand-badge">
              2027
            </span>
          </div>
          <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase vira-brand-sub">
            Eğitim & Danışmanlık
          </span>
        </div>
      )}
    </div>
  );
};
