'use client';

import React, { useState } from 'react';
import { ExemptionRequest } from '@/types';
import { StorageService } from '@/lib/storage';
import { 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  GraduationCap, 
  Sparkles, 
  AlertCircle,
  FileCheck2,
  Calendar,
  Layers
} from 'lucide-react';

interface ExemptionApprovalPanelProps {
  onRefreshData?: () => void;
}

export const ExemptionApprovalPanel: React.FC<ExemptionApprovalPanelProps> = ({ onRefreshData }) => {
  const [feedback, setFeedback] = useState<string | null>(null);
  const requests = StorageService.getExemptionRequests();
  const pendingRequests = requests.filter(r => r.status === 'pending');
  const pastRequests = requests.filter(r => r.status !== 'pending');

  const handleApprove = (reqId: string) => {
    const res = StorageService.approveExemption(reqId);
    setFeedback(res.message);
    if (onRefreshData) onRefreshData();
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleRejectWithTest = (reqId: string) => {
    const res = StorageService.rejectExemptionNeedsTest(reqId);
    setFeedback(res.message);
    if (onRefreshData) onRefreshData();
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5 text-white">
      
      {/* Başlık */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-cyan-400" />
            Öğrenci Konu Muafiyet İstekleri & Danışman Onay Masası
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Öğrencilerin &ldquo;Biliyorum / Muaf Tut&rdquo; talepleri. Onaylandığında takvimden düşer; reddedildiğinde 12 kritik soru seviye testi atanır.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            {pendingRequests.length} Bekleyen Talep
          </span>
        </div>
      </div>

      {/* Geri Bildirim */}
      {feedback && (
        <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 text-indigo-200 text-xs flex items-center space-x-2 shadow animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Bekleyen Talepler Listesi */}
      <div className="space-y-3">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          İnceleme Bekleyen Muafiyet Talepleri
        </div>

        {pendingRequests.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-950/40 border border-slate-800/80">
            <ShieldCheck className="w-8 h-8 text-emerald-500/60 mx-auto mb-2" />
            <div className="text-sm font-semibold text-slate-300">Bekleyen muafiyet isteği bulunmuyor.</div>
            <p className="text-xs text-slate-500 mt-1">Öğrenciler &ldquo;Biliyorum / Muaf Tut&rdquo; aksiyonu aldığında anlık olarak bu masaya düşecektir.</p>
          </div>
        ) : (
          pendingRequests.map(req => (
            <div
              key={req.id}
              className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-cyan-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg shadow-cyan-950/20"
            >
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-extrabold text-sm text-white">
                    {req.studentName}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
                    {req.examType} &bull; {req.subjectName}
                  </span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {req.requestedAt}
                  </span>
                </div>

                <div className="font-bold text-sm text-cyan-300">
                  Konu: {req.topicName}
                </div>

                {req.requestNotes && (
                  <p className="text-xs text-slate-300 italic bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                    Öğrenci Notu: &ldquo;{req.requestNotes}&rdquo;
                  </p>
                )}
              </div>

              {/* Danışman Karar Butonları */}
              <div className="flex flex-wrap items-center gap-2 self-end md:self-center flex-shrink-0">
                {/* Reddet & Test Ata */}
                <button
                  onClick={() => handleRejectWithTest(req.id)}
                  className="px-3.5 py-2 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 text-xs font-semibold transition flex items-center gap-1.5 shadow"
                  title="Doğrudan muafiyet verme; takvime 12 Kritik Soru seviye tespit testi planla"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Reddet (Önce Test Çözdür)</span>
                </button>

                {/* Onayla & Muaf Tut */}
                <button
                  onClick={() => handleApprove(req.id)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
                  title="Onayla: Konu takvimden düşer, öğrenci sıradaki konuya kaydırılır."
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Onayla (Muaf Tut)</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Geçmiş Kararlar Listesi (Akordeon / Mini Liste) */}
      {pastRequests.length > 0 && (
        <div className="pt-3 border-t border-slate-800/80 space-y-2">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Son Karara Bağlanan Talepler ({pastRequests.length})
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {pastRequests.slice(0, 4).map(req => (
              <div
                key={req.id}
                className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 text-xs flex items-center justify-between gap-2"
              >
                <div>
                  <div className="font-semibold text-slate-200">
                    {req.studentName} &bull; {req.topicName}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {req.subjectName} ({req.examType})
                  </div>
                </div>

                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border flex-shrink-0 ${
                  req.status === 'approved' 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}>
                  {req.status === 'approved' ? '✅ Onaylandı (Muaf)' : '🧪 Test Zorunlu Kılındı'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
