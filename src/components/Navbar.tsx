'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, ThemeMode, ScreenScaleLevel } from '@/types';
import { 
  Sparkles, 
  MessageSquare, 
  Bot, 
  AlertTriangle, 
  LogOut, 
  GraduationCap, 
  ShieldCheck, 
  UserCheck,
  Sun,
  Moon,
  CloudSun,
  Leaf,
  Camera,
  Wine,
  Palette,
  Gem,
  Maximize2,
  ZoomIn,
  Expand,
  BookOpen
} from 'lucide-react';
import { AvatarUploadModal } from './AvatarUploadModal';
import { StorageService } from '@/lib/storage';

interface NavbarProps {
  currentUser: User;
  onSwitchUser: (user: User) => void;
  allUsers: User[];
  onOpenChat: () => void;
  onOpenAiCoach: () => void;
  onOpenLogin: () => void;
  onOpenSystemGuide?: () => void;
  deficiencyCount: number;
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  screenScale?: ScreenScaleLevel;
  onScreenScaleChange?: (scale: ScreenScaleLevel) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onSwitchUser,
  allUsers,
  onOpenChat,
  onOpenAiCoach,
  onOpenLogin,
  onOpenSystemGuide,
  deficiencyCount,
  theme,
  onThemeChange,
  screenScale,
  onScreenScaleChange
}) => {
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [hasUnreadChat, setHasUnreadChat] = useState(false);
  const [internalScale, setInternalScale] = useState<ScreenScaleLevel>(() => {
    return StorageService.getScreenScale();
  });

  const activeScale = screenScale !== undefined ? screenScale : internalScale;

  React.useEffect(() => {
    const savedScale = StorageService.getScreenScale();
    setInternalScale(savedScale);
    StorageService.applyThemeAndScale(theme, savedScale);
  }, [theme]);

  React.useEffect(() => {
    if (currentUser?.id) {
      setHasUnreadChat(StorageService.hasUnreadPeerMessages(currentUser.id));
    }
  }, [currentUser]);

  // Periodic check or window focus check for unread messages
  React.useEffect(() => {
    const checkUnread = () => {
      if (currentUser?.id) {
        setHasUnreadChat(StorageService.hasUnreadPeerMessages(currentUser.id));
      }
    };
    window.addEventListener('focus', checkUnread);
    const interval = setInterval(checkUnread, 3000);
    return () => {
      window.removeEventListener('focus', checkUnread);
      clearInterval(interval);
    };
  }, [currentUser]);

  const THEMES: ThemeMode[] = ['light', 'sky', 'anthracite', 'wine', 'mint', 'dark', 'sapphire'];

  const cycleTheme = () => {
    const currentIndex = THEMES.indexOf(theme);
    const nextIndex = (currentIndex + 1) % THEMES.length;
    const nextTheme = THEMES[nextIndex];
    StorageService.applyThemeAndScale(nextTheme, activeScale);
    onThemeChange(nextTheme);
  };

  const cycleScale = () => {
    const nextScale: ScreenScaleLevel = ((activeScale % 3) + 1) as ScreenScaleLevel;
    StorageService.setScreenScale(nextScale);
    StorageService.applyThemeAndScale(theme, nextScale);
    setInternalScale(nextScale);
    if (onScreenScaleChange) {
      onScreenScaleChange(nextScale);
    }
  };

  const themeConfig: Record<string, { name: string; next: string; icon: React.ReactNode }> = {
    light: {
      name: 'Klasik Açık Tema',
      next: 'Açık Gök Mavisi',
      icon: <Sun className="w-4 h-4 text-amber-500 hover:rotate-45 transition-transform" />
    },
    sky: {
      name: 'Açık Gök Mavisi',
      next: 'Antrasit (Platin Gri)',
      icon: <CloudSun className="w-4 h-4 text-sky-500 hover:scale-110 transition-transform" />
    },
    anthracite: {
      name: 'Antrasit (Platin Gri)',
      next: 'Şarap Rengi (Bordo)',
      icon: <Palette className="w-4 h-4 text-slate-600 hover:scale-110 transition-transform" />
    },
    wine: {
      name: 'Şarap Rengi (Gül Kurusu/Bordo)',
      next: 'Koyu Su Yeşili',
      icon: <Wine className="w-4 h-4 text-rose-500 hover:rotate-12 transition-transform" />
    },
    mint: {
      name: 'Koyu Su Yeşili',
      next: 'Derin Gece',
      icon: <Leaf className="w-4 h-4 text-emerald-500 hover:scale-110 transition-transform" />
    },
    dark: {
      name: 'Derin Gece (Dark)',
      next: 'Gece Safiri & Altın',
      icon: <Moon className="w-4 h-4 text-indigo-400 hover:-rotate-12 transition-transform" />
    },
    sapphire: {
      name: 'Gece Safiri & Altın (Özel Tasarım)',
      next: 'Klasik Açık Tema',
      icon: <Gem className="w-4 h-4 text-sky-400 hover:rotate-12 hover:scale-110 transition-transform drop-shadow-[0_0_8px_rgba(56,189,248,0.7)]" />
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand: Vira yazısına tıklayınca öğrenci / danışman profili ana sayfasına gider */}
        <Link
          href={
            currentUser?.role === 'CONSULTANT'
              ? '/mentor'
              : currentUser?.role === 'STUDENT'
                ? `/student/${currentUser.id}`
                : '/'
          }
          className="group flex items-center space-x-3 transition-transform hover:scale-[1.02] active:scale-[0.98]"
          title="Vira Profil & Ana Sayfası"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-2 ring-indigo-400/20 group-hover:shadow-indigo-500/40 transition">
            <Sparkles className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent vira-logo-wordmark group-hover:from-indigo-200 group-hover:to-cyan-200 transition">
                VİRA
              </span>
              <span className="text-[10px] font-bold tracking-widest uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full vira-brand-badge">
                YKS 2027 KOÇLUK
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium vira-brand-sub">Yapay Zeka Destekli Takip & Çalışma Sistemi</p>
          </div>
        </Link>

        {/* Action Widgets & User Profile */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          
          {/* Sistem Kullanma Kılavuzu Butonu */}
          {onOpenSystemGuide && (
            <button
              onClick={onOpenSystemGuide}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white transition text-xs font-semibold shadow-sm"
              title="Vira YKS Koçluk Platform Rehberi & Kullanma Kılavuzu"
            >
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">Kılavuz</span>
            </button>
          )}

          {/* AI Coach Button */}
          <button
            onClick={onOpenAiCoach}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 hover:text-white transition text-xs font-semibold shadow-inner"
            title="AI Asistanı Aç"
          >
            <Bot className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">AI Koç Asistanı</span>
          </button>

          {/* Social Chat Button */}
          <button
            onClick={() => {
              onOpenChat();
              setHasUnreadChat(false);
            }}
            className="relative flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white transition text-xs font-medium"
            title="Öğrenci Sohbeti & Grafik Paylaşımı"
          >
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Sohbet</span>
            {hasUnreadChat && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-900 animate-ping" />
            )}
          </button>

          {/* Active Deficiency Indicator */}
          {deficiencyCount > 0 && (
            <div 
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium"
              title={`${deficiencyCount} aktif telafi bekleyen eksik konu`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
              <span>{deficiencyCount} Telafi</span>
            </div>
          )}

          {/* Single-Button Cyclical Theme Switcher - Icon Only */}
          <button
            onClick={cycleTheme}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/70 transition shadow-sm flex items-center justify-center"
            title={`Aktif: ${themeConfig[theme]?.name || 'Tema'} (Tıklayarak "${themeConfig[theme]?.next}" temasına geç)`}
            aria-label="Tema Değiştir"
          >
            {themeConfig[theme]?.icon || <Sun className="w-4 h-4 text-amber-500" />}
          </button>

          {/* 3-Tier Layout & Font Zoom Scaler Button */}
          <button
            onClick={cycleScale}
            className={`relative p-2 rounded-xl transition shadow-sm flex items-center justify-center group ${
              activeScale === 3
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50 hover:bg-indigo-600/40'
                : activeScale === 2
                ? 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-600/30'
                : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/70 hover:bg-slate-700/80'
            }`}
            title={
              activeScale === 1
                ? 'Görünüm: Standart (1x) • Tıklayarak "Konforlu Geniş (2x)" moduna geç'
                : activeScale === 2
                ? 'Görünüm: Konforlu Geniş (2x) • Tıklayarak "Ultra Geniş (3x)" moduna geç'
                : 'Görünüm: Ultra Geniş (3x) • Tıklayarak "Standart (1x)" moduna dön'
            }
            aria-label="Ekran ve Yazı Boyutu Kademesi"
          >
            {activeScale === 1 && <Maximize2 className="w-4 h-4 transition-transform group-hover:scale-110" />}
            {activeScale === 2 && <ZoomIn className="w-4 h-4 transition-transform group-hover:scale-110" />}
            {activeScale === 3 && <Expand className="w-4 h-4 transition-transform group-hover:scale-110" />}

            {/* Minik Seviye Rozeti */}
            <span className={`absolute -top-1 -right-1 text-[9px] font-black px-1 rounded-full leading-none border shadow-sm ${
              activeScale === 3
                ? 'bg-indigo-500 text-white border-indigo-400'
                : activeScale === 2
                ? 'bg-cyan-500 text-slate-950 border-cyan-300 font-extrabold'
                : 'bg-slate-700 text-slate-300 border-slate-600'
            }`}>
              {activeScale}x
            </span>
          </button>

          {/* Role & Switcher Dropdown */}
          <div className="flex items-center space-x-2 bg-slate-800/80 border border-slate-700/70 rounded-xl p-1 pl-2">
            <div className="flex items-center space-x-2">
              <div 
                className="relative group cursor-pointer"
                onClick={() => setIsAvatarModalOpen(true)}
                title="Profil resmini değiştirmek için tıklayın"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-full object-cover ring-2 ring-indigo-500/40 group-hover:ring-indigo-400 group-hover:scale-105 transition"
                />
                <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition">
                  <Camera className="w-3 h-3 text-white" />
                </div>
                <span className={`absolute bottom-0 right-0 w-2 h-2 rounded-full ring-1 ring-slate-900 ${
                  currentUser.role === 'CONSULTANT' ? 'bg-amber-400' : 'bg-emerald-400'
                }`} />
              </div>
              <div className="hidden md:block text-left text-xs leading-tight pr-1">
                <div className="font-semibold text-white truncate max-w-[100px]">{currentUser.name}</div>
                <div className="text-[10px] text-slate-400">
                  {currentUser.role === 'CONSULTANT' ? 'Danışman' : `${currentUser.grade === 'MEZUN' ? 'Mezun' : '12. Sınıf'}`}
                </div>
              </div>
            </div>

            {/* Quick Demo Switchers */}
            <div className="flex items-center space-x-1 pl-1 border-l border-slate-700">
              {allUsers.map(u => (
                <button
                  key={u.id}
                  onClick={() => onSwitchUser(u)}
                  title={`${u.name} paneline geç`}
                  className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
                    currentUser.id === u.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {u.role === 'CONSULTANT' ? 'Cen' : u.name.split(' ')[0]}
                </button>
              ))}

              <button
                onClick={onOpenLogin}
                title="Şifreli Giriş Ekranı"
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Profil Resmi Değiştirme Modalı */}
      <AvatarUploadModal
        isOpen={isAvatarModalOpen}
        user={currentUser}
        onClose={() => setIsAvatarModalOpen(false)}
        onSuccess={(updatedUser) => {
          onSwitchUser(updatedUser);
        }}
      />
    </header>
  );
};
