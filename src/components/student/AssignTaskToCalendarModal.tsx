'use client';

import React, { useState, useMemo } from 'react';
import { StudentTaskAssignment, HourlyTask } from '@/types';
import { StorageService } from '@/lib/storage';
import { 
  X, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  BookOpen, 
  AlertCircle,
  CalendarPlus,
  Play
} from 'lucide-react';

interface AssignTaskToCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  onScheduled: () => void;
  onLaunchTaskTest?: (assignment: StudentTaskAssignment) => void;
}

export const AssignTaskToCalendarModal: React.FC<AssignTaskToCalendarModalProps> = ({
  isOpen,
  onClose,
  studentId,
  onScheduled,
  onLaunchTaskTest
}) => {
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [isSuccessMessage, setIsSuccessMessage] = useState<string | null>(null);

  const assignments = useMemo(() => {
    return StorageService.getTaskAssignments(studentId).filter(
      a => a.status === 'ASSIGNED' || a.status === 'PENDING_SCHEDULE'
    );
  }, [studentId, isOpen]);

  const existingTasks = useMemo(() => {
    return StorageService.getTasks(studentId);
  }, [studentId, isOpen]);

  // Önümüzdeki 7 gün
  const next7Days = useMemo(() => {
    const days: { label: string; dateStr: string; dayName: string }[] = [];
    const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const dayName = dayNames[d.getDay()];
      days.push({
        label: i === 0 ? `Bugün (${dayName})` : i === 1 ? `Yarın (${dayName})` : `${dd}.${mm} ${dayName}`,
        dateStr,
        dayName
      });
    }
    return days;
  }, []);

  // Varsayılan ilk gün
  React.useEffect(() => {
    if (next7Days.length > 0 && !selectedDay) {
      setSelectedDay(next7Days[0].dateStr);
    }
    if (assignments.length > 0 && !selectedAssignmentId) {
      setSelectedAssignmentId(assignments[0].id);
    }
  }, [next7Days, assignments, selectedDay, selectedAssignmentId]);

  // Saat slotları (08:00 - 22:00)
  const timeSlots = [
    '08:00 - 09:00', '09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00',
    '13:00 - 14:00', '14:00 - 15:00', '15:00 - 16:00', '16:00 - 17:00',
    '17:00 - 18:00', '19:00 - 20:00', '20:00 - 21:00', '21:00 - 22:00'
  ];

  // Seçilen günde dolu olan saatler
  const occupiedSlots = useMemo(() => {
    if (!selectedDay) return new Set<string>();
    const tasksOnDay = existingTasks.filter(t => (t.scheduledDate || t.date) === selectedDay);
    const occupied = new Set<string>();
    tasksOnDay.forEach(t => {
      const slot = t.timeSlot || `${t.startTime} - ${t.endTime}`;
      occupied.add(slot);
    });
    return occupied;
  }, [existingTasks, selectedDay]);

  const selectedAssignment = assignments.find(a => a.id === selectedAssignmentId);

  const handleAssign = () => {
    if (!selectedAssignment || !selectedDay || !selectedTimeSlot) return;

    StorageService.assignTaskToCalendarSlot(selectedAssignment.id, selectedDay, selectedTimeSlot);
    setIsSuccessMessage(`"${selectedAssignment.title}" görevi ${selectedDay} ${selectedTimeSlot} saatine takviminize eklendi!`);
    
    setTimeout(() => {
      setIsSuccessMessage(null);
      onScheduled();
      onClose();
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-indigo-500/30 p-6 shadow-2xl overflow-hidden text-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <CalendarPlus className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Mentor Görevlerini Boş Saate Planla
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
                  {assignments.length} Görev Bekliyor
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Danışmanınızın gönderdiği soru setlerini haftalık takviminizdeki boş saatlere yerleştirin.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto py-4 space-y-6 flex-1 pr-1">
          {isSuccessMessage && (
            <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 flex items-center space-x-2 text-sm">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
              <span>{isSuccessMessage}</span>
            </div>
          )}

          {assignments.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400">
                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              </div>
              <h4 className="text-base font-bold text-white">Bekleyen Yeni Görev Bulunmuyor</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Mentorunuzun size atadığı tüm görevler takviminize yerleştirilmiş veya tamamlanmış durumda.
              </p>
            </div>
          ) : (
            <>
              {/* 1. Görev Seçimi */}
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 block">
                  1. Planlanacak Görevi Seçin:
                </label>
                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {assignments.map(ass => {
                    const isSelected = selectedAssignmentId === ass.id;
                    return (
                      <div
                        key={ass.id}
                        onClick={() => setSelectedAssignmentId(ass.id)}
                        className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-indigo-950/40 border-indigo-500 text-white shadow-md shadow-indigo-600/10'
                            : 'bg-slate-950/50 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white truncate">{ass.title}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
                              {ass.subject} &bull; {ass.topic}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                            <span>{ass.questionIds.length} Soru</span>
                            <span>&bull;</span>
                            <span>Tahmini {ass.estimatedMinutes || (ass.questionIds.length * 2)} dk</span>
                            <span>&bull;</span>
                            <span className="text-indigo-400">Gönderen: {ass.assignedBy || 'Danışman'}</span>
                          </div>
                        </div>

                        {onLaunchTaskTest && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onLaunchTaskTest(ass);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600 text-purple-200 text-xs font-bold flex items-center space-x-1 transition"
                            title="Şimdi Doğrudan Çöz"
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span>Hemen Çöz</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. Gün Seçimi */}
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 block">
                  2. Çalışma Gününü Seçin:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {next7Days.map(day => {
                    const isSelected = selectedDay === day.dateStr;
                    return (
                      <button
                        key={day.dateStr}
                        type="button"
                        onClick={() => {
                          setSelectedDay(day.dateStr);
                          setSelectedTimeSlot('');
                        }}
                        className={`p-2.5 rounded-xl border text-center transition ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-400 text-white font-bold shadow'
                            : 'bg-slate-950/50 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="text-xs">{day.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Boş Saat Seçimi */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    3. Takvimdeki Boş Saati Seçin:
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Koyu gri: Dolu etüt &bull; Mavi/Yeşil: Boş Slot
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-44 overflow-y-auto pr-1">
                  {timeSlots.map(slot => {
                    const isOccupied = occupiedSlots.has(slot);
                    const isSelected = selectedTimeSlot === slot;

                    return (
                      <button
                        key={slot}
                        type="button"
                        disabled={isOccupied}
                        onClick={() => setSelectedTimeSlot(slot)}
                        className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition ${
                          isOccupied
                            ? 'bg-slate-950/40 border-slate-900 text-slate-600 cursor-not-allowed line-through'
                            : isSelected
                            ? 'bg-emerald-600 border-emerald-400 text-white shadow'
                            : 'bg-slate-950/60 border-slate-800 text-slate-200 hover:border-indigo-500 hover:text-white'
                        }`}
                      >
                        <span>{slot}</span>
                        {isOccupied ? (
                          <span className="text-[10px] text-rose-400/60">Dolu</span>
                        ) : isSelected ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        ) : (
                          <span className="text-[10px] text-emerald-400">Boş</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {assignments.length > 0 && (
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition"
            >
              Vazgeç
            </button>
            <button
              type="button"
              disabled={!selectedAssignmentId || !selectedDay || !selectedTimeSlot}
              onClick={handleAssign}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center space-x-2 transition ${
                selectedAssignmentId && selectedDay && selectedTimeSlot
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:brightness-110 shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <CalendarPlus className="w-4 h-4" />
              <span>Seçilen Saate Takvime Ekle</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
