'use client';

import React, { useState } from 'react';
import { User } from '@/types';
import { StorageService } from '@/lib/storage';
import { Archive, X, Lock, Trash2, AlertTriangle } from 'lucide-react';

interface ArchiveStudentModalProps {
  student: User;
  mode: 'archive' | 'delete';
  onClose: () => void;
  onSuccess: () => void;
}

export const ArchiveStudentModal: React.FC<ArchiveStudentModalProps> = ({ student, mode, onClose, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isDelete = mode === 'delete';

  const handleSubmit = () => {
    if (!password) { setError('Şifre boş bırakılamaz.'); return; }
    if (isDelete && password !== confirmPassword) { setError('Şifreler eşleşmiyor.'); return; }
    setIsLoading(true);
    setError('');
    setTimeout(() => {
      const result = isDelete
        ? StorageService.deleteStudentPermanently(student.id, password)
        : StorageService.archiveStudent(student.id, password);
      setIsLoading(false);
      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setError(result.message);
      }
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isDelete ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
              {isDelete ? <Trash2 className="w-5 h-5" /> : <Archive className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="font-bold text-white text-sm">
                {isDelete ? 'Kalıcı Olarak Sil' : 'Öğrenciyi Arşivle'}
              </h2>
              <p className="text-xs text-slate-400">{student.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {isDelete ? (
            <div className="p-4 rounded-xl bg-rose-950/60 border-2 border-rose-500 space-y-2">
              <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
                <AlertTriangle className="w-4 h-4" /> KALİCİ SİLME — GERİ ALINAMAZ
              </div>
              <p className="text-xs text-slate-300">
                <strong>{student.name}</strong>&apos;a ait tüm veriler (görevler, sınav sonuçları, konu durumları)
                kalıcı olarak silinecektir. Bu işlem geri alınamaz.
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 space-y-2">
              <p className="text-sm text-amber-200 font-semibold">Arşivleme Hakkında</p>
              <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                <li>Öğrencinin platform girişi engellenir</li>
                <li>Tüm veriler korunur, read-only olarak incelenebilir</li>
                <li>İstediğiniz zaman arşivden çıkarabilirsiniz</li>
              </ul>
            </div>
          )}

          <div className="space-y-3">
            <label className="block text-xs text-slate-400 font-medium flex items-center gap-2">
              <Lock className="w-3.5 h-3.5" /> Danışman Şifresi
            </label>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              placeholder="Danışman şifresi..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
            {isDelete && (
              <input
                type="password"
                value={confirmPassword}
                onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
                placeholder="Şifreyi tekrar girin..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            )}
          </div>

          {error && <p className="text-xs text-rose-400">{error}</p>}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition"
            >
              İptal
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading || !password}
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm text-white transition flex items-center justify-center gap-2 disabled:opacity-50 ${
                isDelete ? 'bg-rose-600 hover:bg-rose-500' : 'bg-amber-600 hover:bg-amber-500'
              }`}
            >
              {isDelete ? <Trash2 className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
              {isLoading ? 'İşleniyor...' : isDelete ? 'Kalıcı Sil' : 'Arşivle'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
