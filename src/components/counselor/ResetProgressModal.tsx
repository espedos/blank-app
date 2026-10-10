'use client';

import React, { useState } from 'react';
import { User } from '@/types';
import { StorageService } from '@/lib/storage';
import { AlertTriangle, X, CheckSquare, Lock, Trash2 } from 'lucide-react';

interface ResetProgressModalProps {
  student: User;
  onClose: () => void;
  onSuccess: () => void;
}

type Stage = 1 | 2 | 3;

export const ResetProgressModal: React.FC<ResetProgressModalProps> = ({ student, onClose, onSuccess }) => {
  const [stage, setStage] = useState<Stage>(1);
  const [checkboxConfirmed, setCheckboxConfirmed] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleStage1Next = () => {
    if (!checkboxConfirmed) {
      setError('Lütfen onay kutusunu işaretleyin.');
      return;
    }
    setError('');
    setStage(2);
  };

  const handleStage3Submit = () => {
    setIsLoading(true);
    setError('');
    setTimeout(() => {
      const result = StorageService.resetStudentProgress(student.id, password);
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
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-white text-sm">Gelişimi Sıfırla</h2>
              <p className="text-xs text-slate-400">{student.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Stage indicator */}
          <div className="flex items-center gap-2">
            {([1, 2, 3] as Stage[]).map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  stage >= s ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-500'
                }`}>{s}</div>
                {s < 3 && <div className={`flex-1 h-0.5 w-8 ${stage > s ? 'bg-rose-600' : 'bg-slate-800'}`} />}
              </div>
            ))}
            <span className="text-xs text-slate-400 ml-2">
              {stage === 1 && 'Onay'}
              {stage === 2 && 'Uyarı'}
              {stage === 3 && 'Şifre Doğrulama'}
            </span>
          </div>

          {/* STAGE 1: Checkbox onayı */}
          {stage === 1 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 text-sm text-slate-300 space-y-2">
                <p className="font-semibold text-white">Bu işlem aşağıdakileri sıfırlayacak:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-400 text-xs">
                  <li>Tüm görev tamamlanma durumları (is_completed = false)</li>
                  <li>Konu hakimiyet durumları (topic statuses)</li>
                  <li>Tespit edilen eksiklikler (deficiencies)</li>
                </ul>
                <p className="font-semibold text-emerald-400 text-xs mt-3">✓ Müfredat ağacı ve konu tanımları KORUNUR.</p>
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checkboxConfirmed}
                  onChange={e => { setCheckboxConfirmed(e.target.checked); setError(''); }}
                  className="mt-0.5 w-4 h-4 rounded accent-rose-500"
                />
                <span className="text-sm text-slate-300">
                  <strong>{student.name}</strong>&apos;ın tüm tamamlanma verilerinin sıfırlanacağını anlıyor ve onaylıyorum.
                </span>
              </label>
              {error && <p className="text-xs text-rose-400">{error}</p>}
              <button
                onClick={handleStage1Next}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm transition"
              >
                Devam Et →
              </button>
            </div>
          )}

          {/* STAGE 2: Kırmızı uyarı modalı */}
          {stage === 2 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-rose-950/60 border-2 border-rose-500 text-center space-y-3">
                <div className="text-4xl">⚠️</div>
                <p className="text-rose-300 font-bold text-sm">BU İŞLEM GERİ ALINAMAZ!</p>
                <p className="text-slate-300 text-xs leading-relaxed">
                  <strong>{student.name}</strong>&apos;ın tüm tamamlanma kayıtları kalıcı olarak temizlenecektir.
                  Eğer emin değilseniz bu işlemi iptal edin.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition"
                >
                  İptal
                </button>
                <button
                  onClick={() => setStage(3)}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm transition"
                >
                  Evet, Devam Et
                </button>
              </div>
            </div>
          )}

          {/* STAGE 3: Danışman şifresi */}
          {stage === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-slate-300 text-sm">
                <Lock className="w-4 h-4 text-rose-400" />
                <span>Danışman şifrenizi girerek işlemi onaylayın:</span>
              </div>
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                placeholder="Danışman şifresi..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-rose-500"
                onKeyDown={e => e.key === 'Enter' && handleStage3Submit()}
              />
              {error && <p className="text-xs text-rose-400">{error}</p>}
              <button
                onClick={handleStage3Submit}
                disabled={isLoading || !password}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-sm transition flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {isLoading ? 'Sıfırlanıyor...' : 'Gelişimi Sıfırla'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
