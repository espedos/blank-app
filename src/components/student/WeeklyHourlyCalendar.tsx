'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { HourlyTask, TaskCategory, TaskLocation, User } from '@/types';
import { StorageService } from '@/lib/storage';
import confetti from 'canvas-confetti';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  Circle, 
  AlertTriangle, 
  ShieldCheck, 
  Sparkles,
  Filter,
  Lock,
  Unlock,
  RotateCw,
  MapPin,
  GraduationCap,
  BookOpen,
  CalendarDays,
  Columns,
  List,
  CheckCircle2,
  Move,
  Info,
  UserCheck,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  FastForward,
  Plus,
  Trash2,
  Save,
  X,
  Flame,
  Paperclip,
  Link2,
  Target,
  ExternalLink,
  Repeat,
  FileText
} from 'lucide-react';
import { ManualTaskModal } from '../counselor/ManualTaskModal';
import { AssignTaskToCalendarModal } from './AssignTaskToCalendarModal';

interface WeeklyHourlyCalendarProps {
  studentId: string;
  tasks: HourlyTask[];
  onTasksUpdated: () => void;
  onOpenCriticalTest: (topicName: string) => void;
  isCounselor?: boolean;
  selectedStudentId?: string;
  onSelectStudent?: (studentId: string) => void;
  availableStudents?: User[];
}

export const WeeklyHourlyCalendar: React.FC<WeeklyHourlyCalendarProps> = ({
  studentId,
  tasks,
  onTasksUpdated,
  onOpenCriticalTest,
  isCounselor = false,
  selectedStudentId,
  onSelectStudent,
  availableStudents
}) => {
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('weekly');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [hideCompleted, setHideCompleted] = useState<boolean>(false);

  const effectiveStudentId = isCounselor && selectedStudentId ? selectedStudentId : studentId;
  const currentStudentUser = StorageService.getUserById(effectiveStudentId);

  // Atanan Mentor Görevleri & Takvim Onay Talepleri
  const [isAssignTaskModalOpen, setIsAssignTaskModalOpen] = useState(false);
  const pendingAssignments = useMemo(() => {
    return StorageService.getTaskAssignments(effectiveStudentId).filter(
      a => a.status === 'ASSIGNED' || a.status === 'PENDING_SCHEDULE'
    );
  }, [effectiveStudentId, tasks]);

  const studentApprovals = useMemo(() => {
    return StorageService.getCalendarApprovalRequests().filter(r => r.studentId === effectiveStudentId);
  }, [effectiveStudentId, tasks]);

  const pendingApprovalReq = studentApprovals.find(r => r.status === 'PENDING');
  const rejectedApprovalReq = studentApprovals.find(r => r.status === 'REJECTED');

  const studentList = useMemo(() => {
    if (availableStudents && availableStudents.length > 0) return availableStudents;
    return StorageService.getUsers().filter(u => u.role === 'STUDENT' && !u.is_archived);
  }, [availableStudents]);
  
  // Drag & Drop State
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dropTargetDate, setDropTargetDate] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Evrensel Geri Al (Undo) Mekanizması State (Hem Silme Hem Tamamlama)
  type UndoAction = 
    | { type: 'DELETE'; task: HourlyTask; message: string }
    | { type: 'TOGGLE'; taskId: string; title: string; previousCompleted: boolean; message: string };

  const [undoStack, setUndoStack] = useState<UndoAction[]>([]);
  const [activeUndoToast, setActiveUndoToast] = useState<{ title: string; subtitle: string } | null>(null);
  const [toastTimer, setToastTimer] = useState<NodeJS.Timeout | null>(null);


  // Danışman Yeni Görev Modal State
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);

  // 6 Kritik Özellik: Öğrenci Soru Çözüm Doğrulama ve Tamamlama Modalı State
  const [verifyingTask, setVerifyingTask] = useState<HourlyTask | null>(null);
  const [verifySolvedCount, setVerifySolvedCount] = useState<number>(24);
  const [verifyCorrectCount, setVerifyCorrectCount] = useState<number>(20);
  const [verifyIncorrectCount, setVerifyIncorrectCount] = useState<number>(3);
  const [verifyEmptyCount, setVerifyEmptyCount] = useState<number>(1);

  // Aşama 5: Akıllı Takvim Kaydırma Motoru (Bulk Rescheduler) State
  const [shiftScope, setShiftScope] = useState<'uncompleted_only' | 'all_future'>('uncompleted_only');
  const [isExceededModalOpen, setIsExceededModalOpen] = useState(false);

  // Track screen scale level for responsive card fonts
  const [screenScale, setScreenScale] = useState<1 | 2 | 3>(1);

  // Listen to scale changes
  React.useEffect(() => {
    const handleScaleChange = () => {
      const scale = StorageService.getScreenScale();
      setScreenScale(scale);
    };

    // Initial load
    handleScaleChange();

    // Listen to storage changes
    window.addEventListener('storage', handleScaleChange);
    const interval = setInterval(handleScaleChange, 500);

    return () => {
      window.removeEventListener('storage', handleScaleChange);
      clearInterval(interval);
    };
  }, []);

  // Helper: Get responsive text size based on screen scale
  const getTextSize = (baseClass: string): string => {
    if (screenScale === 1) return baseClass;
    if (screenScale === 2) {
      // Scale 2x: text-xs → text-sm, text-sm → text-base, etc.
      if (baseClass === 'text-xs') return 'text-sm';
      if (baseClass === 'text-sm') return 'text-base';
      if (baseClass === 'text-base') return 'text-lg';
      if (baseClass === 'text-lg') return 'text-xl';
      return baseClass;
    }
    if (screenScale === 3) {
      // Scale 3x: text-xs → text-base, text-sm → text-lg, etc.
      if (baseClass === 'text-xs') return 'text-base';
      if (baseClass === 'text-sm') return 'text-lg';
      if (baseClass === 'text-base') return 'text-xl';
      if (baseClass === 'text-lg') return 'text-2xl';
      return baseClass;
    }
    return baseClass;
  };

  // Helper: Get custom pixel sizes scaled
  const getCustomPixelSize = (pixelValue: number): string => {
    const scaled = Math.round(pixelValue * (screenScale === 1 ? 1 : screenScale === 2 ? 1.4 : 1.8));
    return `text-[${scaled}px]`;
  };
  const [pendingShiftOffset, setPendingShiftOffset] = useState<number | null>(null);
  const [exceededInfo, setExceededInfo] = useState<{ message: string; latestTaskDate: string } | null>(null);

  const handleTriggerShift = (dayOffset: number, compressIfExceeded: boolean = false) => {
    const targetStudent = isCounselor && selectedStudentId ? selectedStudentId : studentId;
    const result = StorageService.shiftStudentSchedule(
      targetStudent,
      todayStr,
      dayOffset,
      shiftScope,
      compressIfExceeded
    );

    if (result.deadlineExceeded) {
      setPendingShiftOffset(dayOffset);
      setExceededInfo({
        message: result.message,
        latestTaskDate: result.latestTaskDate
      });
      setIsExceededModalOpen(true);
      return;
    }

    if (result.success) {
      setIsExceededModalOpen(false);
      setPendingShiftOffset(null);
      showNotification('success', result.message);
      try {
        confetti({ particleCount: 35, spread: 60, origin: { y: 0.7 } });
      } catch (e) {}
      onTasksUpdated();
    } else {
      showNotification('error', result.message);
    }
  };

  // ── Gerçek tarayıcı tarihinden bugünü al (hardcoded yok)
  const todayStr = useMemo(() => {
    const d = new Date();
    return d.toISOString().split('T')[0]; // 'YYYY-MM-DD'
  }, []);

  // ── Hafta Navigasyonu: weekOffset = 0 → bu hafta, +1 → gelecek hafta, -1 → geçen hafta
  const [weekOffset, setWeekOffset] = useState(0);

  // Seçilen haftanın Pazartesi gününü hesapla
  const weekMonday = useMemo(() => {
    const today = new Date(todayStr + 'T00:00:00');
    const dow = today.getDay(); // 0=Paz, 1=Pzt...
    const diffToMonday = dow === 0 ? -6 : 1 - dow;
    const monday = new Date(today);
    monday.setDate(monday.getDate() + diffToMonday + weekOffset * 7);
    return monday;
  }, [todayStr, weekOffset]);

  // 7 günlük dizi (Pzt–Paz) — YALNIZCA GÖRÜNTÜ, görev tarihleri değişmez
  const dates = useMemo(() => {
    const DAY_NAMES = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
    const SHORT_NAMES = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
    const MONTH_SHORT: Record<number, string> = {
      1: 'Oca', 2: 'Şub', 3: 'Mar', 4: 'Nis', 5: 'May', 6: 'Haz',
      7: 'Tem', 8: 'Ağu', 9: 'Eyl', 10: 'Eki', 11: 'Kas', 12: 'Ara'
    };
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekMonday);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const isToday = dateStr === todayStr;
      return {
        date: dateStr,
        dayName: isToday ? `${DAY_NAMES[i]} (Bugün)` : DAY_NAMES[i],
        label: `${SHORT_NAMES[i]} (${d.getDate()} ${MONTH_SHORT[d.getMonth() + 1]})`
      };
    });
  }, [weekMonday, todayStr]);

  // selectedDate: daily view için; hafta değişince o haftanın bugününe ya da Pazartesisine sıfırla
  const [selectedDate, setSelectedDate] = useState(todayStr);
  // weekOffset değişince selectedDate'i o haftanın ilk gününe çek
  const handleWeekNav = (delta: number) => {
    setWeekOffset(prev => {
      const next = prev + delta;
      // selectedDate'i yeni haftanın pazartesisine ayarla (günlük görünüm için)
      const today = new Date(todayStr + 'T00:00:00');
      const dow = today.getDay();
      const diffToMonday = dow === 0 ? -6 : 1 - dow;
      const newMonday = new Date(today);
      newMonday.setDate(newMonday.getDate() + diffToMonday + next * 7);
      setSelectedDate(newMonday.toISOString().split('T')[0]);
      return next;
    });
  };

  // Bugünün haftasına dön
  const handleGoToday = () => {
    setWeekOffset(0);
    setSelectedDate(todayStr);
  };

  // ── TYT 2027 Gerçek Geri Sayım
  const countdown = useMemo(() => {
    const today = new Date(todayStr + 'T00:00:00');
    const target = new Date('2027-06-05T00:00:00');
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    const diffWeeks = Math.floor(diffDays / 7);
    return { days: diffDays, weeks: diffWeeks };
  }, [todayStr]);

  // ── Bu görüntülenen haftanın istatistikleri
  const weeklyStats = useMemo(() => {
    const currentWeekDates = dates.map(d => d.date);
    const weekTasks = tasks.filter(t => currentWeekDates.includes(t.date));
    const completedCount = weekTasks.filter(t => t.isCompleted).length;
    const totalCount = weekTasks.length;
    const rate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    return { totalCount, completedCount, rate };
  }, [tasks, dates]);

  const filteredDailyTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesDate = task.date === selectedDate;
      const matchesType = filterType === 'ALL' || task.taskType === filterType;
      const matchesHide = !hideCompleted || !task.isCompleted;
      return matchesDate && matchesType && matchesHide;
    });
  }, [tasks, selectedDate, filterType, hideCompleted]);

  // Doğrudan Görev Tamamlama & Konfeti Efekti
  const handleToggleTask = (taskId: string, currentCompleted: boolean) => {
    const willBeCompleted = !currentCompleted;
    const target = tasks.find(t => t.id === taskId);
    const title = target?.title || 'Konu/Görev';

    if (willBeCompleted) {
      try {
        confetti({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch (e) {}
      showNotification('success', `Tebrikler! "${title}" tamamlandı 🎉`);
    } else {
      showNotification('info', `"${title}" tamamlanmadı durumuna alındı.`);
    }

    StorageService.batchSetTaskCompletions([{ taskId, isCompleted: willBeCompleted }]);

    // Evrensel Geri Al Yığınına Ekle
    const action: UndoAction = {
      type: 'TOGGLE',
      taskId,
      title,
      previousCompleted: currentCompleted,
      message: willBeCompleted ? `"${title}" tamamlandı olarak işaretlendi.` : `"${title}" tekrar aktif edildi.`
    };
    setUndoStack(prev => [...prev, action]);

    setActiveUndoToast({
      title: willBeCompleted ? 'Konu tamamlandı ✨' : 'Konu tekrar aktif edildi 🔄',
      subtitle: title
    });
    if (toastTimer) clearTimeout(toastTimer);
    const timer = setTimeout(() => setActiveUndoToast(null), 10000);
    setToastTimer(timer);

    onTasksUpdated();
  };

  // 6 Kritik Özellik: Öğrencinin Doğrulama ve Tamamlama Mekanizması
  const handleTaskCheckboxClick = (task: HourlyTask) => {
    if (task.isCompleted) {
      handleToggleTask(task.id, true);
      return;
    }

    const hasQuestionTarget = Boolean(task.target_question_count && task.target_question_count > 0);
    const isQuestionActivity = 
      task.action_type === 'question_bank' || 
      task.action_type === 'QUESTION_BANK' || 
      task.action_type === 'mini_quiz' || 
      task.action_type === 'MINI_QUIZ' || 
      task.action_type === 'past_questions' || 
      task.action_type === 'PAST_QUESTIONS' || 
      task.taskType === 'QUESTION_BANK' || 
      task.taskType === 'CRITICAL_12';

    if (hasQuestionTarget || isQuestionActivity) {
      const targetCnt = task.target_question_count || 24;
      setVerifyingTask(task);
      setVerifySolvedCount(targetCnt);
      const defaultCorrect = Math.max(0, targetCnt - 3);
      setVerifyCorrectCount(defaultCorrect);
      setVerifyIncorrectCount(Math.min(2, targetCnt - defaultCorrect));
      setVerifyEmptyCount(Math.max(0, targetCnt - defaultCorrect - 2));
    } else {
      handleToggleTask(task.id, false);
    }
  };

  const handleConfirmVerification = () => {
    if (!verifyingTask) return;
    
    StorageService.completeTaskWithStats(verifyingTask.id, {
      isCompleted: true,
      solved_question_count: verifySolvedCount,
      correct_count: verifyCorrectCount,
      incorrect_count: verifyIncorrectCount,
      empty_count: verifyEmptyCount
    });

    try {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 }
      });
    } catch (e) {}

    showNotification('success', `Tebrikler! "${verifyingTask.title}" tamamlandı (${verifyCorrectCount}D ${verifyIncorrectCount}Y ${verifyEmptyCount}B) 🎉`);
    
    const action: UndoAction = {
      type: 'TOGGLE',
      taskId: verifyingTask.id,
      title: verifyingTask.title,
      previousCompleted: false,
      message: `"${verifyingTask.title}" tamamlandı.`
    };
    setUndoStack(prev => [...prev, action]);

    setActiveUndoToast({
      title: 'Soru etüdü tamamlandı ✨',
      subtitle: `${verifyingTask.title} (${verifyCorrectCount}D ${verifyIncorrectCount}Y)`
    });

    setVerifyingTask(null);
    onTasksUpdated();
  };

  // Tamamlanmamış Kritik / Zorunlu Görevler (Bugün ve Öncesi) (Özellik 4)
  const pendingCriticalTasks = useMemo(() => {
    return tasks.filter(t => 
      t.priority_level === 'high_priority' && 
      !t.isCompleted &&
      t.date <= todayStr
    );
  }, [tasks, todayStr]);

  // Öğrenci Checkbox Değişimi
  const handleCheckboxChange = (taskId: string, currentCompleted: boolean) => {
    handleToggleTask(taskId, currentCompleted);
  };

  const handleToggle = (taskId: string, currentCompleted: boolean) => {
    handleToggleTask(taskId, currentCompleted);
  };

  // Danışman: Kilit Aç / Kapat
  const handleToggleLock = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = StorageService.toggleTaskLock(taskId);
    if (updated) {
      showNotification(
        'info',
        updated.is_locked ? '🔒 Görev kilitlendi (is_locked: true).' : '🔓 Görev kilidi açıldı (is_locked: false).'
      );
      onTasksUpdated();
    }
  };

  // Görev Silme / Programdan Kaldırma (Geri Alınabilir)
  const handleDeleteTask = (taskId: string, title: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    const targetTask = tasks.find(t => t.id === taskId);
    if (!targetTask) return;

    if (!isCounselor && targetTask.is_locked) {
      showNotification('error', '🔒 Bu görev kilitlidir, yalnızca danışmanınız tarafından kaldırılabilir.');
      return;
    }

    const deleted = StorageService.deleteTask(taskId);
    if (deleted) {
      const action: UndoAction = {
        type: 'DELETE',
        task: deleted,
        message: `"${title}" programdan silindi.`
      };
      setUndoStack(prev => [...prev, action]);

      setActiveUndoToast({
        title: 'Konu programdan kaldırıldı 🗑️',
        subtitle: title
      });
      if (toastTimer) clearTimeout(toastTimer);
      const timer = setTimeout(() => setActiveUndoToast(null), 12000);
      setToastTimer(timer);

      showNotification('info', `"${title}" programdan kaldırıldı.`);
      onTasksUpdated();
    }
  };

  // Evrensel Geri Al (Undo) Buton Tıklaması
  const handleUndo = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    if (undoStack.length === 0) {
      showNotification(
        'info',
        'ℹ️ Şu an geri alınacak bir işlem yok. Takvimden bir konuyu tamamladığınızda veya kaldırdığınızda bu butona basarak anında geri alabilirsiniz.'
      );
      return;
    }

    const lastAction = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    setActiveUndoToast(null);
    if (toastTimer) clearTimeout(toastTimer);

    if (lastAction.type === 'DELETE') {
      StorageService.restoreTask(lastAction.task);
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (err) {}
      showNotification('success', `"${lastAction.task.title}" başarıyla programa geri getirildi! 🎉`);
      onTasksUpdated();
    } else if (lastAction.type === 'TOGGLE') {
      StorageService.batchSetTaskCompletions([{ taskId: lastAction.taskId, isCompleted: lastAction.previousCompleted }]);
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch (err) {}
      showNotification('success', `"${lastAction.title}" önceki durumuna geri alındı! 🎉`);
      onTasksUpdated();
    }
  };



  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // Takvim Düzenlemesini Tamamen Geri Alma (Snapshot Restore)
  const handleRestoreCalendarSnapshot = () => {
    const ok = StorageService.restoreCalendarSnapshot(effectiveStudentId);
    if (ok) {
      try {
        confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
      } catch (e) {}
      showNotification('success', 'Takvim düzenlemesi başarıyla geri alındı, önceki haline getirildi! ⏪');
      onTasksUpdated();
    } else {
      showNotification('info', 'Geri alınacak kaydedilmiş takvim yedeği bulunamadı.');
    }
  };

  // Drag & Drop Handlers - Öğrenci ve Mentor Yetkilendirmesi
  const handleDragStart = (e: React.DragEvent, task: HourlyTask) => {
    if (!isCounselor && task.is_locked) {
      e.preventDefault();
      showNotification('error', '🔒 Bu görev danışmanınız tarafından kilitlenmiştir ve yeri değiştirilemez.');
      return;
    }
    setDraggedTaskId(task.id);
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, targetDate: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dropTargetDate !== targetDate) {
      setDropTargetDate(targetDate);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetDate: string) => {
    e.preventDefault();
    setDropTargetDate(null);
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    setDraggedTaskId(null);

    if (!taskId) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    if (task.date === targetDate) {
      return; // Already on this date
    }
    if (!isCounselor && task.is_locked) {
      showNotification('error', '🔒 Kilitli saat dilimleri öğrenci tarafından başka güne taşınamaz.');
      return;
    }

    // Öğrenci taşıma yapıyorsa önce takvim snapshot'ını yedekle
    if (!isCounselor) {
      StorageService.saveCalendarSnapshot(effectiveStudentId);
    }

    // Move task
    const prevDate = task.date;
    const prevSlot = task.timeSlot || `${task.startTime} - ${task.endTime}`;
    const result = StorageService.moveTask(taskId, targetDate);
    
    if (result.success) {
      if (!isCounselor) {
        // Mentor onayı için talep oluştur
        StorageService.createCalendarApprovalRequest({
          id: `req-${Date.now()}`,
          studentId: effectiveStudentId,
          studentName: currentStudentUser?.name || 'Öğrenci',
          taskId: task.id,
          taskTitle: task.title,
          oldDate: prevDate,
          oldStartTime: task.startTime,
          oldEndTime: task.endTime,
          newDate: targetDate,
          newStartTime: task.startTime,
          newEndTime: task.endTime,
          previousSlot: { day: prevDate, time: prevSlot },
          proposedSlot: { day: targetDate, time: prevSlot },
          status: 'PENDING',
          requestedAt: new Date().toISOString()
        });

        showNotification(
          'info', 
          `"${task.title}" yeni güne taşındı ve danışman onayına sunuldu. İstediğiniz an 'Takvim Düzenlemesini Geri Al' butonuyla eski yerine alabilirsiniz.`
        );
      } else {
        showNotification(
          'success', 
          `"${task.title}" görevi başarıyla ${dates.find(d => d.date === targetDate)?.label || targetDate} gününe taşındı.`
        );
      }
      onTasksUpdated();
    } else {
      showNotification('error', result.message || 'Görev taşınırken bir çakışma oluştu.');
    }
  };

  const getTaskTypeBadge = (type: string) => {
    switch (type) {
      case 'LECTURE': return { label: 'Konu Anlatımı', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
      case 'QUESTION_BANK': return { label: 'Soru Bankası', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' };
      case 'PAST_QUESTIONS': return { label: 'Çıkmış Sorular', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
      case 'CRITICAL_12': return { label: '12 Kritik Soru Testi', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' };
      case 'TRIAL_EXAM': return { label: 'Deneme Sınavı', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
      case 'COMPENSATORY': return { label: '🚨 AI Telafi Görevi', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
      default: return { label: 'Çalışma', color: 'bg-slate-700 text-slate-300 border-slate-600' };
    }
  };

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
      
      {/* ÜST BİLGİ & GERİ SAYIM ÇUBUĞU */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-indigo-400" />
              Dinamik Takvim ve Görev Motoru
            </h3>
            
            {/* TYT 2027 Geri Sayım Rozeti */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-sm">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              TYT 2027 Hedef: <span className="text-white">{countdown.days} Gün ({countdown.weeks} Hafta)</span>
            </span>

            {isCounselor && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                🛡️ Danışman Yönetim Modu (Sürükle & Bırak Aktif)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            {isCounselor 
              ? 'Görevleri farklı günlere sürükleyip bırakabilirsiniz. Kilitli saatler AI motoru tarafından ezilmez.'
              : 'Saat bloklarına göre atanmış görevler. Tamamladığınızda kutucuğu işaretleyin. Kilitli saatler değiştirilemez.'}
          </p>
        </div>

        {/* Görünüm ve Öğrenci Seçici Kontrolleri */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Danışman Öğrenci Değiştirici */}
          {isCounselor && onSelectStudent && (
            <div className="flex items-center gap-1 bg-slate-800/80 rounded-xl p-1 border border-slate-700 max-w-full overflow-x-auto">
              {studentList.map(st => {
                const label = st.grade === '12' 
                  ? '12. Sınıf' 
                  : st.grade === 'graduate' 
                    ? 'Mezun' 
                    : st.education_level || 'Öğrenci';
                const isSelected = (selectedStudentId || studentId) === st.id;
                return (
                  <button
                    key={st.id}
                    onClick={() => onSelectStudent(st.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {st.name} ({label})
                  </button>
                );
              })}
            </div>
          )}

          {/* Danışman Yeni Görev Ekle Butonu */}
          {isCounselor && (
            <button
              onClick={() => setIsAddTaskModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white text-xs font-bold shadow-md transition active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Yeni Görev Ekle</span>
            </button>
          )}

          {/* Atanan Mentor Görevlerini Boş Saate Ekle Butonu */}
          <button
            onClick={() => setIsAssignTaskModalOpen(true)}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition border active:scale-95 ${
              pendingAssignments.length > 0
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-400 shadow-lg shadow-purple-600/30 animate-pulse'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
            }`}
            title="Mentorunuzun atadığı görevleri boş saatlerinize ekleyin"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-300" />
            <span>Atanan Görevler {pendingAssignments.length > 0 ? `(${pendingAssignments.length})` : ''}</span>
          </button>

          {/* Öğrenci İçin Takvim Düzenlemesini Geri Al Butonu */}
          {!isCounselor && (
            <button
              onClick={handleRestoreCalendarSnapshot}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-white border border-amber-500/30 text-xs font-bold transition active:scale-95"
              title="Takvimde yaptığınız sürükle-bırak değişikliklerini eski orijinal haline geri yükleyin"
            >
              <RotateCw className="w-3.5 h-3.5 text-amber-400" />
              <span>Düzenlemeyi Geri Al</span>
            </button>
          )}

          {/* Günlük / Haftalık Toggle Butonları */}
          <div className="calendar-view-toggle-container flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700">
            <button
              onClick={() => setViewMode('weekly')}
              className={`calendar-view-toggle-btn flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'weekly'
                  ? 'calendar-view-toggle-btn-active bg-indigo-600 text-white shadow'
                  : 'calendar-view-toggle-btn-inactive text-slate-400 hover:text-white'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Haftalık Tablo</span>
            </button>
            <button
              onClick={() => setViewMode('daily')}
              className={`calendar-view-toggle-btn flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'daily'
                  ? 'calendar-view-toggle-btn-active bg-indigo-600 text-white shadow'
                  : 'calendar-view-toggle-btn-inactive text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Günlük Liste</span>
            </button>
          </div>

          {/* Tamamlananları Gizle / Yok Et Butonu */}
          <button
            onClick={() => setHideCompleted(prev => !prev)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
              hideCompleted
                ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50 shadow-sm'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
            title={hideCompleted ? 'Tamamlanan görevleri göster' : 'Tamamlanan görevleri gizle / yok et'}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{hideCompleted ? 'Tamamlananlar Gizli ✨' : 'Tamamlananları Gizle'}</span>
          </button>

          {/* Evrensel Geri Al Butonu (Her Zaman Tıklanabilir) */}
          <button
            onClick={handleUndo}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer active:scale-95 ${
              undoStack.length > 0
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 border-amber-300 shadow-lg shadow-amber-500/25 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
            }`}
            title={
              undoStack.length > 0
                ? `Son yapılan işlemi geri al (${undoStack.length} işlem bekliyor)`
                : 'Son tamamlanan veya silinen konuyu geri almak için tıklayın'
            }
          >
            <RotateCw className={`w-3.5 h-3.5 ${undoStack.length > 0 ? 'text-slate-950 font-bold' : 'text-slate-400'}`} />
            <span>↶ Geri Al {undoStack.length > 0 ? `(${undoStack.length})` : ''}</span>
          </button>
        </div>
      </div>

      {/* Onay Bekleyen veya Reddedilen Takvim Durum Bildirimleri */}
      {pendingApprovalReq && (
        <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center space-x-2.5">
            <Clock className="w-4 h-4 text-amber-400 animate-spin flex-shrink-0" style={{ animationDuration: '4s' }} />
            <span>
              Takvim düzenlemeniz danışman onayına sunuldu: <strong>{pendingApprovalReq.taskTitle}</strong> ({pendingApprovalReq.proposedSlot?.day || pendingApprovalReq.newDate}). Danışman onayından sonra kesinleşecektir.
            </span>
          </div>
          <button
            onClick={handleRestoreCalendarSnapshot}
            className="px-3 py-1.5 rounded-xl bg-amber-600/40 hover:bg-amber-600 text-white font-bold text-xs transition flex-shrink-0 shadow"
          >
            Hemen Geri Al
          </button>
        </div>
      )}
      {rejectedApprovalReq && (
        <div className="p-3.5 rounded-2xl bg-rose-950/50 border border-rose-500/50 text-rose-200 text-xs flex items-center justify-between gap-3 shadow-md">
          <span>⚠️ Danışmanınız son takvim düzenlemesini onaylamadı; programınız güvenle orijinal haline geri döndürüldü.</span>
          <button
            onClick={() => {
              StorageService.dismissCalendarApprovalRequest(rejectedApprovalReq.id);
              onTasksUpdated();
            }}
            className="px-2.5 py-1 rounded-xl bg-rose-800 hover:bg-rose-700 text-white text-xs font-semibold flex-shrink-0"
          >
            Anladım
          </button>
        </div>
      )}

      {/* HAFTALIK TAMAMLANMA ORANI + HAFTA NAVİGASYONU */}
      <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Sol: tamamlanma oranı */}
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-white">
              {weekOffset === 0 ? 'Bu Haftanın' : weekOffset > 0 ? `+${weekOffset}. Haftanın` : `${weekOffset}. Haftanın`} Görev Tamamlanma Oranı:
            </span>
            <span className="text-xs font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              %{weeklyStats.rate}
            </span>
            <span className="text-xs text-slate-400">
              ({weeklyStats.completedCount} / {weeklyStats.totalCount} Görev)
            </span>
          </div>
          <div className="w-full sm:w-80 bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-700/60 weekly-progress-track">
            <div 
              className="bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${weeklyStats.rate}%` }}
            />
          </div>
        </div>

        {/* Sağ: hafta gezinme butonları */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleWeekNav(-1)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition"
            title="Önceki haftayı görüntüle"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Önceki Hafta</span>
          </button>
          <button
            onClick={handleGoToday}
            disabled={weekOffset === 0}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
              weekOffset === 0
                ? 'bg-indigo-600/30 border-indigo-500/30 text-indigo-300 cursor-default'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-indigo-600 hover:text-white hover:border-indigo-500'
            }`}
            title="Bu haftaya dön"
          >
            {weekOffset === 0 ? '● Bu Hafta' : 'Bu Haftaya Dön'}
          </button>
          <button
            onClick={() => handleWeekNav(1)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition"
            title="Sonraki haftayı görüntüle"
          >
            <span className="hidden sm:inline">Sonraki Hafta</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Renk Açıklamaları (Legend) */}
      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 px-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>🔒 Kilitli Saatler</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            <span>📚 Özel Ders (48s Ödev)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>🔄 Telafi Blokları</span>
          </div>
      </div>


      {/* BİLDİRİM / GERİ BİLDİRİM KUTUSU */}
      {notification && (
        <div className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-2 shadow-lg transition-all animate-fadeIn ${
          notification.type === 'success' 
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' 
            : notification.type === 'error'
            ? 'bg-red-950/40 border-red-500/40 text-red-200'
            : 'bg-indigo-950/40 border-indigo-500/40 text-indigo-200'
        }`}>
          <div className="flex items-center space-x-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : notification.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button 
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-white text-[11px] px-2 py-0.5 rounded bg-slate-800"
          >
            Kapat
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* AŞAMA 5: AKILLI TAKVİM KAYDIRMA MOTORU (SADECE DANIŞMAN YÖNETİMİNDE) */}
      {/* ========================================================================= */}
      {isCounselor && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/70 border border-indigo-500/30 shadow-lg space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
            <div className="flex items-center space-x-2">
              <FastForward className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-white">
                Danışman Takvim Kaydırma Motoru (Bulk Rescheduler)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Kilitli Saat & 5 Haziran 2027 Koruma
              </span>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span>Başlangıç: <strong className="text-slate-200">{todayStr}</strong> (Bugün)</span>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Kapsam Seçici Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Kapsam:</span>
              <select
                value={shiftScope}
                onChange={e => setShiftScope(e.target.value as any)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
              >
                <option value="uncompleted_only">Sadece Tamamlanmamış (Boş) Görevleri Kaydır</option>
                <option value="all_future">Tüm Gelecek Programı Blok Olarak Kaydır</option>
              </select>
            </div>

            {/* Hızlı Kaydırma Butonları */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => handleTriggerShift(-7)}
                title="Tüm programı 1 hafta geriye çek (-7 gün)"
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm active:scale-95"
              >
                <ChevronsLeft className="w-3.5 h-3.5 text-indigo-400" />
                <span>&lt;&lt; 1 Hafta Geri</span>
              </button>

              <button
                onClick={() => handleTriggerShift(-1)}
                title="Tüm programı 1 gün geriye çek (-1 gün)"
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm active:scale-95"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-indigo-400" />
                <span>&lt; 1 Gün Geri</span>
              </button>

              <button
                onClick={() => handleTriggerShift(1)}
                title="Tüm programı 1 gün ileri ötele (+1 gün)"
                className="px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm active:scale-95"
              >
                <span>1 Gün İleri &gt;</span>
                <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />
              </button>

              <button
                onClick={() => handleTriggerShift(7)}
                title="Tüm programı 1 hafta ileri ötele (+7 gün)"
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:brightness-110 border border-indigo-400/40 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-md active:scale-95"
              >
                <span>1 Hafta İleri &gt;&gt;</span>
                <ChevronsRight className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. ÖZELLİK: AI ASİSTAN KRİTİK GÖREV UYARISI BANNER'I */}
      {pendingCriticalTasks.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/80 via-slate-900 to-amber-950/60 border border-rose-500/50 shadow-xl shadow-rose-950/30 flex items-center justify-between gap-3 text-xs animate-pulse">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex-shrink-0">
              <Flame className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <div className="text-white font-extrabold flex items-center gap-2">
                <span>🤖 AI Koç Asistan Uyarısı:</span>
                <span className="text-rose-300 font-bold bg-rose-500/20 px-2 py-0.5 rounded-full border border-rose-500/30">
                  {pendingCriticalTasks.length} Kritik / Zorunlu Etüt Tamamlanmadı!
                </span>
              </div>
              <p className="text-slate-300 mt-0.5">
                Danışmanınız tarafından zorunlu işaretlenen &ldquo;<strong>{pendingCriticalTasks[0].title}</strong>&rdquo; görevini tamamlamadan yeni program akışına geçmemelisiniz.
              </p>
            </div>
          </div>
          <button
            onClick={() => handleTaskCheckboxClick(pendingCriticalTasks[0])}
            className="flex-shrink-0 px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold transition shadow-lg shadow-rose-600/20 active:scale-95 flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Şimdi Tamamla</span>
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* GÖRÜNÜM 1: HAFTALIK 7 SÜTUNLU TABLO (SÜRÜKLE & BIRAK DESTEKLİ) */}
      {/* ========================================================================= */}
      {viewMode === 'weekly' ? (
        <div className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
            {dates.map(d => {
              const dayTasks = tasks
                .filter(t => t.date === d.date && (!hideCompleted || !t.isCompleted))
                .sort((a, b) => a.startTime.localeCompare(b.startTime));
              const isToday = d.date === todayStr;
              const isDropTarget = dropTargetDate === d.date;

              return (
                <div
                  key={d.date}
                  onDragOver={(e) => handleDragOver(e, d.date)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, d.date)}
                  className={`rounded-2xl border transition-all flex flex-col min-h-[460px] ${
                    isDropTarget
                      ? 'border-indigo-400 bg-indigo-950/30 ring-2 ring-indigo-500/40 shadow-xl'
                      : isToday
                      ? 'border-indigo-500/50 bg-slate-950/60 shadow-md'
                      : 'border-slate-800 bg-slate-950/30'
                  }`}
                >
                  {/* Gün Başlığı */}
                  <div className={`p-3 border-b rounded-t-2xl flex items-center justify-between day-column-header ${
                    isToday ? 'is-today-column bg-indigo-900/30 border-indigo-500/30' : 'bg-slate-900/60 border-slate-800'
                  }`}>
                    <div>
                      <div className={`day-column-title text-xs font-black ${isToday ? 'text-indigo-300' : 'text-slate-200'}`}>
                        {d.label}
                      </div>
                      <div className="text-slate-400 day-completion-badge font-bold mt-0.5" style={{ fontSize: screenScale === 1 ? '10px' : screenScale === 2 ? '14px' : '18px' }}>
                        {dayTasks.filter(t => t.isCompleted).length}/{dayTasks.length} Tamam
                      </div>
                    </div>
                    {isToday && (
                      <span className="uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-500 text-white font-extrabold shadow-sm" style={{ fontSize: screenScale === 1 ? '9px' : screenScale === 2 ? '13px' : '16px' }}>
                        Bugün
                      </span>
                    )}
                  </div>

                  {/* Görev Kartları Listesi */}
                  <div className="p-2 space-y-2 flex-1 overflow-y-auto max-h-[560px]">
                    {dayTasks.length === 0 ? (
                      <div className="h-36 flex flex-col items-center justify-center text-center p-2 text-slate-500 border border-dashed border-slate-800 rounded-xl">
                        <Clock className="w-5 h-5 mb-1 text-slate-600" />
                        <span style={{ fontSize: screenScale === 1 ? '11px' : screenScale === 2 ? '15px' : '20px' }}>Görev yok</span>
                        {isCounselor && (
                          <span className="text-indigo-400/80 mt-1" style={{ fontSize: screenScale === 1 ? '9px' : screenScale === 2 ? '13px' : '16px' }}>Buraya görev sürükleyin</span>
                        )}
                      </div>
                    ) : (
                      dayTasks.map(task => {
                        const isDraggable = isCounselor;
                        const isBeingDragged = draggedTaskId === task.id;
                        const isCompleted = task.isCompleted;

                        return (
                          <div
                            key={task.id}
                            draggable={isDraggable}
                            onDragStart={(e) => handleDragStart(e, task)}
                            className={`p-2.5 rounded-xl border ${getTextSize('text-xs')} space-y-1.5 transition-all duration-300 select-none ${
                              isBeingDragged
                                ? 'opacity-40 scale-95 border-dashed border-indigo-400'
                                : isCompleted
                                ? 'bg-emerald-950/30 border-emerald-500/40 text-slate-200 opacity-75 scale-[0.99] completed-task-card'
                                : task.is_locked
                                ? 'bg-amber-950/20 border-amber-500/40 text-slate-200 hover:border-amber-400'
                                : task.category === 'private_tutoring'
                                ? 'bg-purple-950/20 border-purple-500/40 text-slate-200'
                                : task.category === 'mentor_session'
                                ? 'bg-emerald-950/20 border-emerald-500/40 text-slate-200'
                                : task.isRescheduled
                                ? 'bg-cyan-950/20 border-cyan-500/40 text-slate-200'
                                : 'bg-slate-900/80 border-slate-750 hover:border-indigo-500/50 text-white'
                            } ${isDraggable ? 'cursor-grab active:cursor-grabbing hover:border-indigo-400' : 'cursor-default'}`}
                          >
                            {/* Kart Üst Başlık & Kontroller */}
                            <div className="flex items-start justify-between gap-1.5">
                              <span
                                className="font-mono text-indigo-300 font-bold"
                                style={{ fontSize: screenScale === 1 ? '10px' : screenScale === 2 ? '14px' : '18px' }}
                              >
                                {task.startTime} - {task.endTime}
                              </span>

                              {/* Öğrenci vs Danışman Aksiyonları */}
                              {!isCounselor ? (
                                <div className="flex items-center gap-1">
                                  {!task.is_locked && (
                                    <button
                                      onClick={(e) => handleDeleteTask(task.id, task.title, e)}
                                      className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition opacity-60 hover:opacity-100"
                                      title="Konuyu programdan kaldır"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleTaskCheckboxClick(task)}
                                    className="text-slate-400 hover:text-emerald-400 transition"
                                    title={task.isCompleted ? 'Tamamlandı işaretini kaldır' : 'Tamamlandı olarak işaretle (Doğrula & Konfeti 🎉)'}
                                  >
                                    {task.isCompleted ? (
                                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                                    ) : (
                                      <Circle className="w-4 h-4 text-slate-500 hover:text-emerald-400" />
                                    )}
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1">
                                  {/* Danışman Kilit Aç/Kapa Butonu */}
                                  <button
                                    onClick={(e) => handleToggleLock(task.id, e)}
                                    className={`p-1 rounded transition ${
                                      task.is_locked
                                        ? 'text-amber-400 hover:text-amber-300 bg-amber-500/10'
                                        : 'text-slate-400 hover:text-slate-200 bg-slate-800'
                                    }`}
                                    title={task.is_locked ? 'Kilitli (Kilidi aç)' : 'Kilitsiz (Kilitle)'}
                                  >
                                    {task.is_locked ? <Lock className="w-3 h-3 text-amber-400" /> : <Unlock className="w-3 h-3 text-slate-400" />}
                                  </button>

                                  {/* Danışman Silme Butonu */}
                                  <button
                                    onClick={(e) => handleDeleteTask(task.id, task.title, e)}
                                    className="p-1 rounded text-slate-400 hover:text-rose-400 bg-slate-800 transition"
                                    title="Görevi Takvimden Sil"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>

                                  {/* Danışman Tamamlama Toggle */}
                                  <button
                                    onClick={() => handleToggle(task.id, task.isCompleted)}
                                    className="text-slate-400 hover:text-emerald-400 transition ml-0.5"
                                    title={task.isCompleted ? 'Tamamlandı' : 'Tamamla'}
                                  >
                                    {task.isCompleted ? (
                                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                                    ) : (
                                      <Circle className="w-4 h-4 text-slate-500 hover:text-emerald-400" />
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Renkli Etiketler: [Ders - Sınıf], [Hedef: X Soru], [Kaynak: ...] */}
                            <div className="flex flex-wrap items-center gap-1 pt-0.5">
                              {task.priority_level === 'high_priority' && (
                                <span
                                  className="px-1.5 py-0.5 rounded bg-rose-600/30 text-rose-300 border border-rose-500/60 font-black flex items-center gap-0.5 animate-pulse shadow-sm"
                                  style={{ fontSize: screenScale === 1 ? '9px' : screenScale === 2 ? '13px' : '16px' }}
                                >
                                  <Flame className="w-2.5 h-2.5 text-rose-400" /> KRİTİK
                                </span>
                              )}

                              {/* [Ders - Sınıf] */}
                              <span
                                className="px-1.5 py-0.5 rounded font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                                style={{ fontSize: screenScale === 1 ? '9px' : screenScale === 2 ? '13px' : '16px' }}
                              >
                                [{task.subjectName} {task.grade_level ? `- ${task.grade_level}. Sınıf` : ''}]
                              </span>

                              {/* [Hedef: 24 Soru] */}
                              {task.target_question_count && !task.isCompleted && (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold font-mono flex items-center gap-0.5" style={{ fontSize: screenScale === 1 ? '9px' : screenScale === 2 ? '13px' : '16px' }}>
                                  <Target className="w-2.5 h-2.5 text-emerald-400" />
                                  [Hedef: {task.target_question_count} Soru]
                                </span>
                              )}

                              {/* [Kaynak: Kitap Adı] */}
                              {task.resource_book && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold truncate max-w-[170px]" title={task.resource_book} style={{ fontSize: screenScale === 1 ? '9px' : screenScale === 2 ? '13px' : '16px' }}>
                                  [Kaynak: {task.resource_book}]
                                </span>
                              )}

                              {/* Eylem Türü Rozeti */}
                              {task.action_type && (
                                <span className={`px-1.5 py-0.5 rounded font-bold border flex items-center gap-0.5 ${
                                  task.action_type === 'question_bank' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                  task.action_type === 'study' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                  task.action_type === 'past_questions' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                  task.action_type === 'mini_quiz' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                  'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                }`} style={{ fontSize: screenScale === 1 ? '9px' : screenScale === 2 ? '13px' : '16px' }}>
                                  {task.action_type === 'question_bank' ? '✍️ Soru Bankası' :
                                   task.action_type === 'study' ? '📖 Konu Çalışması' :
                                   task.action_type === 'past_questions' ? '🏛️ Çıkmış Sorular' :
                                   task.action_type === 'mini_quiz' ? '🎯 Mini Quiz' : '📕 Hata Analizi'}
                                </span>
                              )}

                              {task.is_recurring && (
                                <span className="px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 font-semibold flex items-center gap-0.5" style={{ fontSize: screenScale === 1 ? '9px' : screenScale === 2 ? '13px' : '16px' }}>
                                  <Repeat className="w-2.5 h-2.5 text-cyan-400" /> Rutin
                                </span>
                              )}
                            </div>

                            {/* Başlık */}
                            <div className={`font-semibold ${getTextSize('text-xs')} leading-snug ${task.isCompleted ? 'line-through text-slate-300 dark:text-slate-300' : 'text-slate-100'}`}>
                              {task.title}
                            </div>

                            {/* Tamamlanma Sonucu */}
                            {task.isCompleted && (
                              <div className="pt-0.5 space-y-1">
                                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 flex items-center gap-1 w-fit" style={{ fontSize: screenScale === 1 ? '9px' : screenScale === 2 ? '13px' : '16px' }}>
                                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" /> Tamamlandı ✨
                                </span>
                                {task.correct_count !== undefined && task.solved_question_count ? (
                                  <span className="px-1.5 py-0.5 rounded bg-emerald-900/40 text-emerald-200 border border-emerald-500/40 font-mono font-bold flex items-center gap-1 w-fit" style={{ fontSize: screenScale === 1 ? '9px' : screenScale === 2 ? '13px' : '16px' }}>
                                    📊 {task.correct_count}D {task.incorrect_count || 0}Y {task.empty_count || 0}B ({task.solved_question_count} Soru)
                                  </span>
                                ) : null}
                              </div>
                            )}

                            {/* Butonlar: [Ders Linkine Git ->] & Dosya Eki */}
                            {(task.resource_link || task.attachment_name) && (
                              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                                {task.resource_link && (
                                  <a
                                    href={task.resource_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border border-blue-400/40 font-extrabold shadow-sm transition hover:scale-105 active:scale-95"
                                    style={{ fontSize: screenScale === 1 ? '9px' : screenScale === 2 ? '13px' : '16px' }}
                                  >
                                    <ExternalLink className="w-2.5 h-2.5 text-white" />
                                    <span>[Ders Linkine Git &rarr;]</span>
                                  </a>
                                )}
                                {task.attachment_name && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (task.attachment_url && task.attachment_url !== '#sample-test-pdf') {
                                        const w = window.open();
                                        if (w) w.location.href = task.attachment_url;
                                      } else {
                                        showNotification('info', `📎 "${task.attachment_name}" eki başarıyla açıldı.`);
                                      }
                                    }}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 font-bold transition hover:scale-105 active:scale-95"
                                    style={{ fontSize: screenScale === 1 ? '9px' : screenScale === 2 ? '13px' : '16px' }}
                                    title="Dosya / Test Ekini Görüntüle"
                                  >
                                    <Paperclip className="w-2.5 h-2.5 text-purple-400" />
                                    <span className="truncate max-w-[110px]">{task.attachment_name}</span>
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Rozetler */}
                            <div className="flex flex-wrap items-center gap-1 pt-0.5">
                              {task.is_locked && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-0.5 font-bold" style={{ fontSize: screenScale === 1 ? '9px' : screenScale === 2 ? '13px' : '16px' }} title="Danışman Saati (is_locked=true)">
                                  <Lock className="w-2.5 h-2.5 text-amber-400" /> Kilitli
                                </span>
                              )}
                              {task.category === 'private_tutoring' && (
                                <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-0.5 font-bold" style={{ fontSize: screenScale === 1 ? '9px' : screenScale === 2 ? '13px' : '16px' }} title="48 saat içinde ödev oluşturur">
                                  <BookOpen className="w-2.5 h-2.5 text-purple-400" /> Özel Ders
                                </span>
                              )}
                              {task.category === 'mentor_session' && (
                                <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-0.5 font-bold" style={{ fontSize: screenScale === 1 ? '9px' : screenScale === 2 ? '13px' : '16px' }}>
                                  <GraduationCap className="w-2.5 h-2.5 text-emerald-400" /> Cen Hoca
                                </span>
                              )}
                              {task.location && (
                                <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-0.5" style={{ fontSize: screenScale === 1 ? '9px' : screenScale === 2 ? '13px' : '16px' }}>
                                  <MapPin className="w-2.5 h-2.5 text-cyan-400" />
                                  {task.location === 'library' ? 'Kütüphane' : task.location === 'school' ? 'Okul' : task.location === 'classroom' ? 'Sınıf' : 'Ev'}
                                </span>
                              )}
                              {task.isRescheduled && (
                                <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-0.5 font-bold" style={{ fontSize: screenScale === 1 ? '9px' : screenScale === 2 ? '13px' : '16px' }} title={task.rescheduledReason}>
                                  <RotateCw className="w-2.5 h-2.5 text-cyan-400" /> Telafi
                                </span>
                              )}
                            </div>

                            {/* 12 Kritik Test Düğmesi */}
                            {task.taskType === 'CRITICAL_12' && !task.isCompleted && (
                              <button
                                onClick={() => onOpenCriticalTest(task.topicName)}
                                className="w-full mt-1 px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center gap-1 shadow-sm transition"
                              >
                                <Sparkles className="w-3 h-3" />
                                <span>Testi Çöz</span>
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* GÖRÜNÜM 2: GÜNLÜK DETAYLI LİSTE */
        /* ========================================================================= */
        <div className="space-y-4">
          {/* Gün Seçici Hap Butonlar */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-2">
            {dates.map(d => {
              const isSelected = d.date === selectedDate;
              const countOnDay = tasks.filter(t => t.date === d.date).length;
              return (
                <button
                  key={d.date}
                  onClick={() => setSelectedDate(d.date)}
                  className={`flex-shrink-0 px-4 py-2 rounded-2xl text-xs font-semibold transition border flex flex-col items-center ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/30'
                      : 'bg-slate-800/60 text-slate-300 border-slate-700/60 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span>{d.label}</span>
                  <span className={`text-[10px] mt-0.5 ${isSelected ? 'text-indigo-200' : 'text-slate-500'}`}>
                    {countOnDay} görev
                  </span>
                </button>
              );
            })}
          </div>

          {/* Filtreleme */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
              >
                <option value="ALL">Tüm Görev Tipleri</option>
                <option value="LECTURE">Konu Anlatımı</option>
                <option value="QUESTION_BANK">Soru Bankası</option>
                <option value="PAST_QUESTIONS">Çıkmış Sorular</option>
                <option value="CRITICAL_12">12 Kritik Soru</option>
                <option value="TRIAL_EXAM">Deneme</option>
                <option value="COMPENSATORY">Telafi Görevi</option>
              </select>
            </div>
          </div>

          {/* Günlük Görevler Listesi */}
          <div className="space-y-3">
            {filteredDailyTasks.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-slate-950/40 border border-slate-800/80">
                <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <div className="text-sm font-semibold text-slate-400">Bu gün için atanmış görev bulunmuyor.</div>
                <p className="text-xs text-slate-500 mt-1">Danışmanınız veya AI koçunuz yeni görev atadığında burada listelenecektir.</p>
              </div>
            ) : (
              filteredDailyTasks.map(task => {
                const badge = getTaskTypeBadge(task.taskType);

                return (
                  <div
                    key={task.id}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      task.isCompleted
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-400 opacity-50 scale-[0.99]'
                        : task.isAiGeneratedCompensatory
                        ? 'bg-amber-950/20 border-amber-500/40 shadow-lg shadow-amber-500/5'
                        : 'bg-slate-950/80 border-slate-700/80 hover:border-indigo-500/40'
                    }`}
                  >
                    {/* Sol: Checkbox ve Detaylar */}
                    <div className="flex items-start space-x-3.5">
                      {!isCounselor ? (
                        <button
                          onClick={() => handleTaskCheckboxClick(task)}
                          className="mt-0.5 text-slate-400 hover:text-emerald-400 transition"
                          title={task.isCompleted ? 'İşareti kaldır' : 'Tamamla (Doğrula & Konfeti 🎉)'}
                        >
                          {task.isCompleted ? (
                            <CheckCircle className="w-6 h-6 text-emerald-400" />
                          ) : (
                            <Circle className="w-6 h-6 text-slate-500 hover:text-emerald-400" />
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggle(task.id, task.isCompleted)}
                          className="mt-0.5 text-slate-400 hover:text-indigo-400 transition"
                          title={task.isCompleted ? 'Tamamlandı olarak işaretlendi' : 'Tamamla'}
                        >
                          {task.isCompleted ? (
                            <CheckCircle className="w-6 h-6 text-emerald-400" />
                          ) : (
                            <Circle className="w-6 h-6 text-slate-500 hover:text-indigo-400" />
                          )}
                        </button>
                      )}

                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-sm font-bold ${task.isCompleted ? 'line-through text-slate-300' : 'text-white'}`}>
                            {task.title}
                          </span>
                          
                          {/* 4. ÖZELLİK: KRİTİK / ZORUNLU ETÜT */}
                          {task.priority_level === 'high_priority' && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-rose-600/30 text-rose-300 border border-rose-500/60 flex items-center gap-1 animate-pulse shadow-sm">
                              <Flame className="w-3 h-3 text-rose-400" /> KRİTİK ETÜT
                            </span>
                          )}

                          {/* [Ders - Sınıf Düzeyi] */}
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-200 border border-slate-700 font-bold">
                            [{task.subjectName} {task.grade_level ? `- ${task.grade_level}. Sınıf` : ''}]
                          </span>

                          {/* 1. ÖZELLİK: EYLEM TÜRÜ */}
                          {task.action_type && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border flex items-center gap-1 ${
                              task.action_type === 'question_bank' || task.action_type === 'QUESTION_BANK' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                              task.action_type === 'study' || task.action_type === 'LECTURE_VIDEO' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                              task.action_type === 'past_questions' || task.action_type === 'PAST_QUESTIONS' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                              task.action_type === 'mini_quiz' || task.action_type === 'MINI_QUIZ' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' :
                              'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            }`}>
                              {task.action_type === 'question_bank' || task.action_type === 'QUESTION_BANK' ? '✍️ Soru Bankası' :
                               task.action_type === 'study' || task.action_type === 'LECTURE_VIDEO' ? '📖 Konu Çalışması' :
                               task.action_type === 'past_questions' || task.action_type === 'PAST_QUESTIONS' ? '🏛️ Çıkmış Sorular' :
                               task.action_type === 'mini_quiz' || task.action_type === 'MINI_QUIZ' ? '🎯 Mini Quiz' : '📕 Hata Analizi'}
                            </span>
                          )}

                          {/* 2. ÖZELLİK: HEDEF VE DOĞRULAMA SKORU */}
                          {task.target_question_count && !task.isCompleted && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 font-mono font-bold flex items-center gap-1">
                              <Target className="w-3 h-3 text-emerald-400" />
                              [Hedef: {task.target_question_count} Soru]
                            </span>
                          )}

                          {/* [Kaynak: Kitap Adı] */}
                          {task.resource_book && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold flex items-center gap-1" title={task.resource_book}>
                              <BookOpen className="w-3 h-3 text-amber-400" />
                              [Kaynak: {task.resource_book}]
                            </span>
                          )}

                          {task.isCompleted && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Tamamlandı ✨
                            </span>
                          )}

                          {task.isCompleted && task.correct_count !== undefined && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-900/40 text-emerald-200 border border-emerald-500/40 font-mono font-bold flex items-center gap-1">
                              📊 {task.correct_count}D {task.incorrect_count || 0}Y {task.empty_count || 0}B ({task.solved_question_count || task.target_question_count} Soru)
                            </span>
                          )}

                          {task.is_recurring && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 font-semibold flex items-center gap-1">
                              <Repeat className="w-3 h-3 text-cyan-400" /> Rutin
                            </span>
                          )}

                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${badge.color}`}>
                            {badge.label}
                          </span>

                          {task.is_locked && (
                            <span className="text-[10px] text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold" title="Danışman tarafından kilitli saat. AI yeniden planlama algoritmaları bu saati ezemez.">
                              <Lock className="w-3 h-3 text-amber-400" /> Kilitli (is_locked)
                            </span>
                          )}
                          {task.isRescheduled && (
                            <span className="text-[10px] text-cyan-300 bg-cyan-500/20 border border-cyan-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold" title={task.rescheduledReason}>
                              <RotateCw className="w-3 h-3 text-cyan-400" /> Otomatik Telafi Bloğu
                            </span>
                          )}
                          {task.category === 'private_tutoring' && (
                            <span className="text-[10px] text-purple-300 bg-purple-500/20 border border-purple-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold" title="Tamamlandığında sonraki 48 saat içine otomatik ödev/tekrar etüdü oluşturur">
                              <BookOpen className="w-3 h-3 text-purple-400" /> Özel Ders (48s Ödev)
                            </span>
                          )}
                          {task.category === 'mentor_session' && (
                            <span className="text-[10px] text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                              <GraduationCap className="w-3 h-3 text-emerald-400" /> Cen Hoca Seansı
                            </span>
                          )}
                          {task.location && (
                            <span className="text-[10px] text-slate-300 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
                              <MapPin className="w-3 h-3 text-cyan-400" />
                              {task.location === 'library' ? 'Kütüphane' : task.location === 'school' ? 'Okul/Kurs' : task.location === 'classroom' ? 'Sınıf' : 'Ev'}
                            </span>
                          )}
                          {task.instructor && (
                            <span className="text-[10px] text-indigo-300 bg-indigo-950/40 border border-indigo-500/30 px-2 py-0.5 rounded-full font-medium">
                              {task.instructor === 'external_tutor' ? '👨‍🏫 Özel Ders' : task.instructor === 'mentor' ? '🎓 Cen Hoca' : '📖 Bireysel'}
                            </span>
                          )}
                          {task.counselorApproved && (
                            <span className="text-[10px] text-indigo-300 bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
                              <ShieldCheck className="w-3 h-3 text-indigo-400" /> Onaylı
                            </span>
                          )}
                        </div>

                        {/* 3 & 6. ÖZELLİK: [Ders Linkine Git ->] VE DOSYA EKİ BUTONLARI */}
                        {(task.resource_link || task.attachment_name) && (
                          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                            {task.resource_link && (
                              <a
                                href={task.resource_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border border-blue-400/40 text-xs font-extrabold shadow-sm transition hover:scale-105 active:scale-95"
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-white" />
                                <span>[Ders Linkine Git &rarr;]</span>
                              </a>
                            )}
                            {task.attachment_name && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (task.attachment_url && task.attachment_url !== '#sample-test-pdf') {
                                    const w = window.open();
                                    if (w) w.location.href = task.attachment_url;
                                  } else {
                                    showNotification('info', `📎 "${task.attachment_name}" eki başarıyla açıldı.`);
                                  }
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 text-[11px] font-bold transition hover:scale-105 active:scale-95"
                              >
                                <Paperclip className="w-3 h-3 text-purple-400" />
                                <span>Dosya Eki: {task.attachment_name}</span>
                              </button>
                            )}
                          </div>
                        )}

                        <div className="text-xs text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span>Ders: <strong className="text-slate-300">{task.subjectName}</strong></span>
                          <span>Konu: <strong className="text-slate-300">{task.topicName}</strong></span>
                          <span className="text-indigo-400 font-mono">
                            Ders: {task.startTime} - {task.endTime} ({task.lessonDurationMinutes || 45} dk)
                          </span>
                          <span className="text-emerald-400/90 text-[11px] font-mono">
                            + {task.breakDurationMinutes || 15} dk Mola
                          </span>
                        </div>

                        {task.rescheduledReason && (
                          <div className="text-[11px] text-cyan-300/90 bg-cyan-950/40 border border-cyan-500/20 rounded-lg p-2 mt-1">
                            ⚠️ <strong>Otomatik Yeniden Planlama:</strong> {task.rescheduledReason}
                          </div>
                        )}

                        {task.counselorNotes && (
                          <div className="text-xs text-indigo-300/90 italic bg-indigo-950/40 border border-indigo-500/20 rounded-lg p-2 mt-1.5">
                            Danışman Notu: &ldquo;{task.counselorNotes}&rdquo;
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Sağ: Aksiyonlar */}
                    <div className="flex items-center space-x-2 self-end sm:self-center">
                      {task.taskType === 'CRITICAL_12' && !task.isCompleted && (
                        <button
                          onClick={() => onOpenCriticalTest(task.topicName)}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md flex items-center space-x-1.5 transition"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Testi Çöz</span>
                        </button>
                      )}

                      {!isCounselor ? (
                        <div className="flex items-center gap-2">
                          {!task.is_locked && (
                            <button
                              onClick={(e) => handleDeleteTask(task.id, task.title, e)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 border border-slate-700 transition"
                              title="Konuyu programdan kaldır"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <span className={`text-xs px-2.5 py-1 rounded-lg border font-semibold ${
                            task.isCompleted 
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}>
                            {task.isCompleted ? '✓ Tamamlandı' : 'Bekliyor'}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1.5">
                          {/* Danışman Kilit Butonu */}
                          <button
                            onClick={(e) => handleToggleLock(task.id, e)}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition ${
                              task.is_locked
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
                            }`}
                            title={task.is_locked ? 'Kilidi Aç' : 'Kilitle'}
                          >
                            {task.is_locked ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Unlock className="w-3.5 h-3.5" />}
                            <span>{task.is_locked ? 'Kilitli' : 'Kilit Aç'}</span>
                          </button>

                          {/* Danışman Silme Butonu */}
                          <button
                            onClick={(e) => handleDeleteTask(task.id, task.title, e)}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 border border-slate-700 transition"
                            title="Görevi Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          {/* Danışman Tamamla Butonu */}
                          <button
                            onClick={() => handleToggle(task.id, task.isCompleted)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                              task.isCompleted
                                ? 'bg-slate-800 text-slate-400 hover:text-white'
                                : 'bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300'
                            }`}
                          >
                            {task.isCompleted ? 'Geri Al' : 'Tamamlandı'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* AŞAMA 5: SINAV BİTİŞ KONTROLÜ VE PROGRAM SIKIŞTIRMA MODALI (5 HAZİRAN 2027) */}
      {/* ========================================================================= */}
      {isExceededModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-amber-500/50 rounded-3xl shadow-2xl p-6 text-white space-y-4 animate-scaleUp">
            
            <div className="flex items-center gap-3 text-amber-400">
              <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/30">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Hedef Bitiş Tarihi Aşıldı!</h3>
                <p className="text-xs text-amber-300">YKS 2027 Müfredat Güvenlik Sınırı Uyarısı</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs space-y-2 text-slate-300">
              <p className="text-sm font-semibold text-white">
                Hedef bitiş tarihi aşıldı! Haftalık tempo artırılsın mı?
              </p>
              <p className="text-xs text-slate-400">
                İleri kaydırma sonucu son görev tarihi <strong className="text-rose-400 font-mono">{exceededInfo?.latestTaskDate}</strong> gününe taşıyor.
              </p>
              <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-[11px] text-indigo-200">
                🎯 <strong>Şartname Kuralı:</strong> TYT (19 Haziran) ve AYT (20 Haziran) sınavlarından 2 hafta önce (<strong>5 Haziran 2027</strong>) tüm müfredatın eksiksiz bitirilmesi zorunludur.
              </div>
              <p className="text-white font-medium text-[11px]">
                Program boş akşam ve hafta sonu etüt saatlerine sıkıştırılsın mı?
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsExceededModalOpen(false);
                  setPendingShiftOffset(null);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                İptal Et
              </button>

              <button
                type="button"
                onClick={() => {
                  if (pendingShiftOffset !== null) {
                    setIsExceededModalOpen(false);
                    handleTriggerShift(pendingShiftOffset, true);
                  }
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-white text-xs font-bold shadow-lg transition"
              >
                Haftalık Tempoyu Artır & Sıkıştır
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DANIŞMAN: KADEMELİ VE DİNAMİK YENİ GÖREV EKLEME MODALI */}
      {/* ========================================================================= */}
      <ManualTaskModal
        isOpen={isAddTaskModalOpen}
        onClose={() => setIsAddTaskModalOpen(false)}
        onSuccess={(targetStudentId) => {
          setIsAddTaskModalOpen(false);
          if (onSelectStudent && targetStudentId !== (selectedStudentId || studentId)) {
            onSelectStudent(targetStudentId);
          }
          showNotification('success', 'Danışman görevi başarıyla takvime eklendi ve kilitlendi 🔒');
          onTasksUpdated();
        }}
        initialStudentId={selectedStudentId || studentId}
        availableStudents={availableStudents}
      />

      {/* ========================================================================= */}
      {/* 2. ÖZELLİK: ÖĞRENCİ SORU ÇÖZÜM DOĞRULAMA & TAMAMLAMA MODALI */}
      {/* ========================================================================= */}
      {verifyingTask && (() => {
        const solvedNum = Number(verifySolvedCount) || 0;
        const correctNum = Number(verifyCorrectCount) || 0;
        const incorrectNum = Number(verifyIncorrectCount) || 0;
        const emptyNum = Number(verifyEmptyCount) || 0;
        const currentSum = correctNum + incorrectNum + emptyNum;
        const isSumValid = currentSum === solvedNum && solvedNum > 0;
        const netScore = Math.max(0, correctNum - (incorrectNum / 4));

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
            <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl p-6 text-white space-y-4 animate-scaleUp">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Target className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-white">Görev Tamamlama & Soru Doğrulama</h3>
                    <p className="text-[11px] text-slate-400">Gerçek soru çözüm verilerini girerek görevi tamamlayın</p>
                  </div>
                </div>
                <button
                  onClick={() => setVerifyingTask(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Referans Bilgi */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <div className="text-xs font-bold text-white truncate">{verifyingTask.title}</div>
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="text-indigo-400 font-semibold">{verifyingTask.subjectName}</span>
                  {verifyingTask.target_question_count && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                      🎯 Danışman Hedefi: {verifyingTask.target_question_count} Soru
                    </span>
                  )}
                  {verifyingTask.resource_book && (
                    <span className="text-slate-400 flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-amber-400" />
                      {verifyingTask.resource_book}
                    </span>
                  )}
                </div>
              </div>

              {/* İstatistik Giriş Kutucukları */}
              <div className="grid grid-cols-4 gap-2 text-center">
                {/* Çözülen Soru */}
                <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                  <label className="block text-[10px] text-slate-300 font-bold mb-1">Çözülen Soru</label>
                  <input
                    type="number"
                    min="1"
                    value={verifySolvedCount}
                    onChange={e => setVerifySolvedCount(Math.max(1, Number(e.target.value)))}
                    className="w-full text-center bg-slate-900 border border-slate-700 rounded-lg py-1.5 text-sm font-black text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                {/* Doğru */}
                <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40">
                  <label className="block text-[10px] text-emerald-400 font-bold mb-1">Doğru [D]</label>
                  <input
                    type="number"
                    min="0"
                    value={verifyCorrectCount}
                    onChange={e => setVerifyCorrectCount(Math.max(0, Number(e.target.value)))}
                    className="w-full text-center bg-slate-900 border border-emerald-500/50 rounded-lg py-1.5 text-sm font-black text-emerald-300 focus:outline-none focus:border-emerald-400 font-mono"
                  />
                </div>

                {/* Yanlış */}
                <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/40">
                  <label className="block text-[10px] text-rose-400 font-bold mb-1">Yanlış [Y]</label>
                  <input
                    type="number"
                    min="0"
                    value={verifyIncorrectCount}
                    onChange={e => setVerifyIncorrectCount(Math.max(0, Number(e.target.value)))}
                    className="w-full text-center bg-slate-900 border border-rose-500/50 rounded-lg py-1.5 text-sm font-black text-rose-300 focus:outline-none focus:border-rose-400 font-mono"
                  />
                </div>

                {/* Boş */}
                <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40">
                  <label className="block text-[10px] text-amber-400 font-bold mb-1">Boş [B]</label>
                  <input
                    type="number"
                    min="0"
                    value={verifyEmptyCount}
                    onChange={e => setVerifyEmptyCount(Math.max(0, Number(e.target.value)))}
                    className="w-full text-center bg-slate-900 border border-amber-500/50 rounded-lg py-1.5 text-sm font-black text-amber-300 focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              </div>

              {/* Doğrulama Kontrol Uyarısı (Doğru + Yanlış + Boş = Çözülen) */}
              <div className={`p-3 rounded-2xl border text-xs transition ${
                isSumValid
                  ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200'
                  : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
              }`}>
                <div className="flex items-center justify-between font-bold">
                  <span>Kontrol Durumu:</span>
                  <span>{correctNum} (D) + {incorrectNum} (Y) + {emptyNum} (B) = {currentSum} / {solvedNum}</span>
                </div>
                {!isSumValid ? (
                  <div className="mt-1 text-[11px] text-rose-300 flex items-center gap-1.5 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                    <span>
                      Doğru + Yanlış + Boş toplamı ({currentSum}), Çözülen Soru sayısı ({solvedNum}) ile eşit olmalıdır!
                    </span>
                  </div>
                ) : (
                  <div className="mt-1 flex items-center justify-between text-[11px] text-emerald-300 font-semibold">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Eşitlik doğrulandı
                    </span>
                    <span className="font-mono font-black text-sm text-emerald-300">
                      Net: {netScore.toFixed(2)} Net
                    </span>
                  </div>
                )}
              </div>

              {/* Butonlar */}
              <div className="flex items-center gap-2.5 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setVerifyingTask(null)}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  disabled={!isSumValid}
                  onClick={handleConfirmVerification}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-xs shadow-lg shadow-emerald-600/25 transition active:scale-95 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Kaydet ve Bitir 🎉</span>
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* Yüzen Geri Al (Undo) Bildirim Çubuğu */}
      {activeUndoToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3.5 px-4 py-3.5 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-amber-500/50 shadow-2xl shadow-amber-500/20 text-white animate-slideUp">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 flex-shrink-0">
            <RotateCw className="w-5 h-5 animate-spin" style={{ animationDuration: '4s' }} />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <span>{activeUndoToast.title}</span>
            </div>
            <div className="text-[11px] text-slate-300 truncate max-w-[220px]">
              {activeUndoToast.subtitle}
            </div>
          </div>
          <button
            onClick={handleUndo}
            className="ml-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95 whitespace-nowrap cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Geri Al</span>
          </button>
          <button
            onClick={() => setActiveUndoToast(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Atanan Mentor Görevlerini Boş Saate Ekle Modalı */}
      <AssignTaskToCalendarModal
        isOpen={isAssignTaskModalOpen}
        onClose={() => setIsAssignTaskModalOpen(false)}
        studentId={effectiveStudentId}
        onScheduled={() => {
          onTasksUpdated();
        }}
        onLaunchTaskTest={(assignment) => {
          setIsAssignTaskModalOpen(false);
          onOpenCriticalTest(assignment.topic || assignment.title);
        }}
      />

    </div>
  );
};
