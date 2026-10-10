'use client';

import React, { useState } from 'react';
import { AiDeficiency, StudentCriticalDeficit } from '@/types';
import { AlertTriangle, Clock, CheckCircle2, ArrowRight, Sparkles, Calendar, ShieldAlert, X } from 'lucide-react';
import { StorageService } from '@/lib/storage';
import { generateCriticalDeficitCompensatoryTask } from '@/lib/aiCoach';
import { STANDARD_HOURLY_SLOTS, checkSlotConflict } from '@/lib/calendarEngine';

const DAY_NAMES = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

function buildNext7Days() {
  const days: { label: string; dateStr: string }[] = [];
  const today = new Date();
  for (let i = 1; i <= 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = DAY_NAMES[d.getDay()];
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    days.push({
      label: i === 1 ? `Yarın (${dayName})` : `${dd}.${mm} ${dayName}`,
      dateStr
    });
  }
  return days;
}

interface DeficiencyAlertBannerProps {
  deficiencies?: AiDeficiency[];
  criticalDeficits?: StudentCriticalDeficit[];
  onOpenCalendar: () => void;
  onOpenTestSolver: (topicName: string) => void;
  onRefresh?: () => void;
}

export const DeficiencyAlertBanner: React.FC<DeficiencyAlertBannerProps> = ({
  deficiencies = [],
  criticalDeficits = [],
  onOpenCalendar,
  onOpenTestSolver,
  onRefresh
}) => {
  const [scheduledDeficitIds, setScheduledDeficitIds] = useState<string[]>([]);
  const [scheduledSlots, setScheduledSlots] = useState<Record<string, { taskId: string; date: string; startTime: string; endTime: string }>>({});
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);
  const [rescheduleForDeficitId, setRescheduleForDeficitId] = useState<string | null>(null);
  const [rescheduleDay, setRescheduleDay] = useState<string>('');

  // Aktif kritik eksikler (active_warning durumunda olanlar)
  const activeCritical = criticalDeficits.filter(d => d.status === 'active_warning');
  // Genel deneme eksikleri (henüz çözülmemiş olanlar)
  const unresolvedGeneral = deficiencies.filter(d => !d.isResolved);

  if (activeCritical.length === 0 && unresolvedGeneral.length === 0) return null;

  const formatSlotLabel = (date: string, startTime: string, endTime: string) => {
    const d = new Date(date);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}.${mm} ${DAY_NAMES[d.getDay()]}, ${startTime}-${endTime}`;
  };

  const handleAddRemedyToCalendar = (deficit: StudentCriticalDeficit) => {
    // 1. Görevi, takvimde GERÇEKTEN boş olan ilk telafi slotuna otomatik yerleştir
    const existingTasks = StorageService.getTasks(deficit.student_id);
    const compensatoryTask = generateCriticalDeficitCompensatoryTask(deficit, existingTasks);
    StorageService.saveTask(compensatoryTask);

    // 2. Eksik durumunu remedy_assigned yap veya güncelle
    setScheduledDeficitIds(prev => [...prev, deficit.id]);
    setScheduledSlots(prev => ({
      ...prev,
      [deficit.id]: {
        taskId: compensatoryTask.id,
        date: compensatoryTask.date,
        startTime: compensatoryTask.startTime,
        endTime: compensatoryTask.endTime
      }
    }));
    setNotificationMsg(`"${deficit.critical_concept}" telafi etüdü ${formatSlotLabel(compensatoryTask.date, compensatoryTask.startTime, compensatoryTask.endTime)} saatine takviminize eklendi!`);
    setTimeout(() => setNotificationMsg(null), 4500);

    if (onRefresh) {
      onRefresh();
    }
  };

  // "Değiştir" linkiyle açılan lightbox'tan farklı bir boş saat seçildiğinde
  // zaten oluşturulmuş görevi oraya taşır (yeni görev oluşturmaz).
  const handleMoveToSlot = (deficit: StudentCriticalDeficit, date: string, startTime: string, endTime: string) => {
    const current = scheduledSlots[deficit.id];
    if (!current) return;
    const result = StorageService.moveTask(current.taskId, date, startTime, endTime);
    if (result.success) {
      setScheduledSlots(prev => ({
        ...prev,
        [deficit.id]: { ...current, date, startTime, endTime }
      }));
      setNotificationMsg(`"${deficit.critical_concept}" telafi etüdü ${formatSlotLabel(date, startTime, endTime)} saatine taşındı.`);
      setTimeout(() => setNotificationMsg(null), 4500);
    } else {
      setNotificationMsg(result.message || 'Bu saat taşınamadı.');
      setTimeout(() => setNotificationMsg(null), 4500);
    }
    setRescheduleForDeficitId(null);
    if (onRefresh) onRefresh();
  };

  const rescheduleDeficit = rescheduleForDeficitId
    ? activeCritical.find(d => d.id === rescheduleForDeficitId)
    : null;
  const rescheduleTasksForStudent = rescheduleDeficit ? StorageService.getTasks(rescheduleDeficit.student_id) : [];
  const next7Days = buildNext7Days();

  return (
    <>
    <div className="deficiency-alert-card mb-6 rounded-3xl bg-gradient-to-r from-red-950/70 via-slate-900 to-amber-950/60 border-2 border-red-500/50 p-5 sm:p-6 text-white shadow-2xl relative overflow-hidden">
      
      {/* Arka plan ışık vurgusu */}
      <div className="absolute -right-10 -top-10 w-44 h-44 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

      {notificationMsg && (
        <div className="mb-3 p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center space-x-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notificationMsg}</span>
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
        
        <div className="flex items-start space-x-4 flex-1">
          <div className="p-3 rounded-2xl bg-red-500/20 text-red-400 mt-1 flex-shrink-0 animate-pulse border border-red-500/30">
            <ShieldAlert className="w-6 h-6" />
          </div>

          <div className="space-y-3 flex-1">
            <div className="flex items-center flex-wrap gap-2">
              <h3 className="font-black text-sm sm:text-base text-red-200 flex items-center gap-2">
                <span>AI Radar & Eksik Takipçisi</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/30 text-red-300 border border-red-500/50 uppercase">
                  {activeCritical.length + unresolvedGeneral.length} Kritik Uyarı
                </span>
              </h3>
              <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/40">
                Sabitlenmiş Pedagojik Uyarı
              </span>
            </div>

            {/* Kritik Eksikler Listesi (student_critical_deficits) */}
            {activeCritical.length > 0 && (
              <div className="space-y-2.5">
                {activeCritical.map(d => {
                  const isScheduled = scheduledDeficitIds.includes(d.id) || d.status === 'in_progress';
                  return (
                    <div 
                      key={d.id}
                      className="p-3.5 rounded-2xl bg-slate-950/80 border border-red-500/30 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="text-xs sm:text-sm font-semibold text-slate-100 flex items-center gap-1.5 flex-wrap">
                          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                          <span className="text-red-200">
                            {d.subject_name || 'Fizik'}: {d.topic_name || 'Newton Yasaları'} - <strong className="text-amber-300">{d.critical_concept}</strong> kavramında eksiğin var!
                          </span>
                        </div>
                        <p className="text-[11px] text-red-300/80 italic pl-5">
                          &bull; Telafi etüdünü tamamlayana kadar bu uyarı kalkmayacaktır.
                        </p>
                        {d.common_student_pitfall && (
                          <p className="text-[11px] text-slate-400 pl-5">
                            <span className="text-slate-500 font-medium">ÖSYM Tuzağı:</span> {d.common_student_pitfall}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 self-end sm:self-center flex-shrink-0">
                        {!isScheduled ? (
                          <button
                            onClick={() => handleAddRemedyToCalendar(d)}
                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs shadow transition hover:scale-105 active:scale-95 flex items-center space-x-1.5"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Telafi Etüdünü Takvime Ekle</span>
                          </button>
                        ) : (
                          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold text-xs flex items-center space-x-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>
                              Takvime Eklendi
                              {scheduledSlots[d.id] && (
                                <> &bull; {formatSlotLabel(scheduledSlots[d.id].date, scheduledSlots[d.id].startTime, scheduledSlots[d.id].endTime)}</>
                              )}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setRescheduleForDeficitId(d.id);
                                setRescheduleDay(buildNext7Days()[0]?.dateStr || '');
                              }}
                              className="ml-1.5 underline decoration-dotted hover:text-white transition"
                              title="Başka bir boş saate taşı"
                            >
                              Değiştir
                            </button>
                          </span>
                        )}

                        <button
                          onClick={() => onOpenTestSolver(d.topic_name || 'Newton Yasaları')}
                          className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition hover:scale-105 active:scale-95 whitespace-nowrap flex items-center space-x-1"
                        >
                          <span>12 Kritik Testi Çöz &rarr;</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Genel Deneme Eksikleri */}
            {unresolvedGeneral.length > 0 && activeCritical.length === 0 && (
              <div className="space-y-2">
                <p className="text-xs text-slate-300">
                  Son denemenizdeki soru analizlerine göre eksik tespit edilen konular takviminize otomatik telafi görevi olarak işlendi.
                </p>
                {unresolvedGeneral.map(item => (
                  <div key={item.id} className="text-xs bg-slate-900/80 border border-amber-500/20 px-3 py-2 rounded-xl flex items-center justify-between">
                    <span className="text-slate-200">
                      <strong className="text-amber-300">[{item.subjectName}] {item.topicName}:</strong> {item.identifiedReason}
                    </span>
                    <button
                      onClick={() => onOpenTestSolver(item.topicName)}
                      className="text-xs px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold ml-2 whitespace-nowrap transition shadow-sm"
                    >
                      12 Kritik Testi Çöz &rarr;
                    </button>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>

        <button
          onClick={onOpenCalendar}
          className="self-end lg:self-center px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-xl transition flex items-center space-x-1.5 flex-shrink-0 hover:scale-105 active:scale-95"
        >
          <span>Takvimdeki Telafiyi Aç</span>
          <ArrowRight className="w-4 h-4" />
        </button>

      </div>
    </div>

    {/* "Değiştir" Lightbox: Haftanın SADECE boş saatlerini gösterir, dolu
        slotlar hiç listelenmez — kafa karıştıran "dolu" yazılarıyla değil. */}
    {rescheduleDeficit && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
        <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-amber-500/30 p-6 shadow-2xl text-slate-100 max-h-[85vh] flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 flex-shrink-0">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-400" />
                Telafi Etüdünü Taşı
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                &ldquo;{rescheduleDeficit.critical_concept}&rdquo; için sadece BOŞ saatler gösteriliyor.
              </p>
            </div>
            <button
              onClick={() => setRescheduleForDeficitId(null)}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="overflow-y-auto py-4 space-y-4 flex-1 pr-1">
            {/* Gün Seçimi */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {next7Days.map(day => (
                <button
                  key={day.dateStr}
                  type="button"
                  onClick={() => setRescheduleDay(day.dateStr)}
                  className={`p-2 rounded-xl border text-center text-[11px] font-semibold transition ${
                    rescheduleDay === day.dateStr
                      ? 'bg-amber-500 border-amber-400 text-slate-950'
                      : 'bg-slate-950/50 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>

            {/* Sadece boş saatler — dolu slotlar bu listeye hiç girmiyor */}
            <div className="grid grid-cols-2 gap-2">
              {STANDARD_HOURLY_SLOTS.filter(slot => {
                if (!rescheduleDay) return false;
                const conflict = checkSlotConflict(
                  rescheduleTasksForStudent,
                  rescheduleDeficit.student_id,
                  rescheduleDay,
                  slot.startTime,
                  slot.endTime,
                  scheduledSlots[rescheduleDeficit.id]?.taskId
                );
                return !conflict.hasConflict;
              }).map(slot => (
                <button
                  key={slot.startTime}
                  type="button"
                  onClick={() => handleMoveToSlot(rescheduleDeficit, rescheduleDay, slot.startTime, slot.endTime)}
                  className="p-3 rounded-xl border border-emerald-600/40 bg-emerald-950/40 text-emerald-300 text-xs font-bold hover:bg-emerald-900/60 hover:border-emerald-500 transition flex items-center justify-center gap-1.5"
                >
                  <Clock className="w-3.5 h-3.5" />
                  {slot.startTime} - {slot.endTime}
                </button>
              ))}
              {rescheduleDay && STANDARD_HOURLY_SLOTS.every(slot => {
                const conflict = checkSlotConflict(
                  rescheduleTasksForStudent,
                  rescheduleDeficit.student_id,
                  rescheduleDay,
                  slot.startTime,
                  slot.endTime,
                  scheduledSlots[rescheduleDeficit.id]?.taskId
                );
                return conflict.hasConflict;
              }) && (
                <p className="col-span-2 text-center text-xs text-slate-400 py-4">
                  Bu günde boş saat kalmadı, başka bir gün seçin.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
};
