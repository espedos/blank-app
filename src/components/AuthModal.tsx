'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/types';
import { StorageService } from '@/lib/storage';
import { Lock, KeyRound, AlertCircle, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const pwdToTry = password.trim();
    setError('');
    setLoading(true);

    try {
      // Şifre doğrulaması artık SADECE sunucuda yapılır; sunucu başarılı
      // girişte imzalı, httpOnly oturum çerezini kendisi set eder.
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwdToTry })
      });
      const data = await res.json();

      if (data.success && data.user) {
        const user: User = data.user;
        // Sadece yerel UI önbelleği için — yetkilendirme artık buna bağlı değil.
        StorageService.setCurrentUser(user);

        if (onSuccess) onSuccess(user);

        onClose();
        setPassword('');

        if (user.role === 'CONSULTANT') {
          router.push('/mentor');
        } else {
          router.push(`/student/${user.id}`);
        }
      } else {
        setError(data.message || 'Geçersiz giriş şifresi!');
      }
    } catch {
      setError('Giriş sırasında bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl p-6 sm:p-8 text-white relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-1/2 translate-x-1/2 -mt-12 w-64 h-32 bg-indigo-500/20 blur-3xl pointer-events-none" />

        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
            Vira Platformu Giriş
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Girdiğiniz şifreye göre ilgili öğrenci veya danışman paneline otomatik yönlendirilirsiniz.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-500/15 border border-red-500/40 text-red-200 text-xs font-semibold flex items-center space-x-2 animate-shake">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Password Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Sistem Giriş Şifresi</span>
              <span className="text-[10px] text-slate-500 font-normal">Yetkili Giriş</span>
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Giriş şifrenizi giriniz..."
                autoComplete="current-password"
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 tracking-wider focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                autoFocus
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:brightness-110 disabled:opacity-50 text-white font-bold text-sm transition shadow-lg shadow-indigo-600/25 flex items-center justify-center space-x-2"
          >
            <span>{loading ? 'Doğrulanıyor...' : 'Giriş Yap'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-500 hover:text-slate-300 transition"
          >
            Vazgeç ve Kapat
          </button>
        </div>

      </div>
    </div>
  );
};
