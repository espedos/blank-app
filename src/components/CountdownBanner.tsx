'use client';

import React from 'react';
import { getCountdown } from '@/lib/scoreCalculator';
import { Calendar, Target, Clock } from 'lucide-react';

export const CountdownBanner: React.FC = () => {
  const countdown = getCountdown();

  return (
    <div 
      className="countdown-banner-card relative overflow-hidden rounded-2xl border shadow-2xl p-5 mb-6 text-white"
      style={{
        background: 'linear-gradient(135deg, #090e1a 0%, #151d38 50%, #090e1a 100%)',
        borderColor: 'rgba(99, 102, 241, 0.4)',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 20px -3px rgba(99, 102, 241, 0.25)'
      }}
    >
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-10 w-48 h-48 bg-cyan-500/15 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        
        {/* Left: Info */}
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center space-x-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50" />
            <h2 
              className="text-base sm:text-lg font-bold tracking-tight flex items-center gap-2"
              style={{ color: '#ffffff' }}
            >
              <Target className="w-5 h-5 text-indigo-400" />
              YKS 2027 Geri Sayım & Hedef Takvimi
            </h2>
          </div>
          <p 
            className="text-xs sm:text-sm leading-relaxed"
            style={{ color: '#f1f5f9' }}
          >
            Müfredat, TYT (19 Haziran 2027) ve AYT (20 Haziran 2027) sınavlarından tam{' '}
            <strong 
              className="font-bold underline decoration-indigo-400 underline-offset-2"
              style={{ color: '#38bdf8' }}
            >
              2 hafta önce (5 Haziran 2027)
            </strong>{' '}
            eksiksiz tamamlanacak şekilde kurgulanmıştır.
          </p>
        </div>

        {/* Right: Counter Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          
          {/* Müfredat Bitiş Hedefi */}
          <div 
            className="rounded-xl p-3 flex items-center space-x-3 shadow-inner border transition hover:border-indigo-400"
            style={{
              backgroundColor: 'rgba(30, 27, 75, 0.75)',
              borderColor: 'rgba(129, 140, 248, 0.4)'
            }}
          >
            <div className="p-2 rounded-lg bg-indigo-500/30 text-indigo-200">
              <Clock className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <div 
                className="text-[11px] font-bold uppercase tracking-wider"
                style={{ color: '#c7d2fe' }}
              >
                Müfredat Bitiş
              </div>
              <div 
                className="text-lg sm:text-xl font-extrabold flex items-baseline gap-1"
                style={{ color: '#ffffff' }}
              >
                <span>{countdown.curriculumDeadlineDaysLeft}</span>
                <span className="text-xs font-semibold" style={{ color: '#e2e8f0' }}>gün</span>
              </div>
              <div 
                className="text-[10px] font-semibold"
                style={{ color: '#a5b4fc' }}
              >
                ({countdown.curriculumDeadlineWeeksLeft} hafta kaldı)
              </div>
            </div>
          </div>

          {/* TYT 2027 */}
          <div 
            className="rounded-xl p-3 flex items-center space-x-3 border transition hover:border-cyan-400"
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              borderColor: 'rgba(56, 189, 248, 0.35)'
            }}
          >
            <div className="p-2 rounded-lg bg-cyan-500/25 text-cyan-200">
              <Calendar className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <div 
                className="text-[11px] font-bold uppercase tracking-wider"
                style={{ color: '#bae6fd' }}
              >
                TYT Sınavı
              </div>
              <div 
                className="text-lg sm:text-xl font-extrabold flex items-baseline gap-1"
                style={{ color: '#38bdf8' }}
              >
                <span>{countdown.tytDaysLeft}</span>
                <span className="text-xs font-semibold" style={{ color: '#e2e8f0' }}>gün</span>
              </div>
              <div 
                className="text-[10px] font-medium"
                style={{ color: '#cbd5e1' }}
              >
                19 Haziran 2027
              </div>
            </div>
          </div>

          {/* AYT 2027 */}
          <div 
            className="col-span-2 sm:col-span-1 rounded-xl p-3 flex items-center space-x-3 border transition hover:border-emerald-400"
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              borderColor: 'rgba(52, 211, 153, 0.35)'
            }}
          >
            <div className="p-2 rounded-lg bg-emerald-500/25 text-emerald-200">
              <Calendar className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div 
                className="text-[11px] font-bold uppercase tracking-wider"
                style={{ color: '#a7f3d0' }}
              >
                AYT Sınavı
              </div>
              <div 
                className="text-lg sm:text-xl font-extrabold flex items-baseline gap-1"
                style={{ color: '#34d399' }}
              >
                <span>{countdown.aytDaysLeft}</span>
                <span className="text-xs font-semibold" style={{ color: '#e2e8f0' }}>gün</span>
              </div>
              <div 
                className="text-[10px] font-medium"
                style={{ color: '#cbd5e1' }}
              >
                20 Haziran 2027
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
