'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  BookOpen, 
  Sparkles, 
  Lock, 
  User as UserIcon, 
  FileText,
  AlertCircle,
  CheckCircle2,
  Layers,
  Flame,
  Repeat,
  Link2,
  Paperclip,
  Target,
  Video,
  Upload,
  Trash2,
  HelpCircle
} from 'lucide-react';
import { User, HourlyTask, TaskCategory, TaskLocation, ActionType, TaskPriorityLevel } from '@/types';
import { StorageService } from '@/lib/storage';
import { CASCADING_CURRICULUM } from '@/data/cascadingCurriculum';
import confetti from 'canvas-confetti';

interface ManualTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (targetStudentId: string) => void;
  initialStudentId?: string;
  availableStudents?: User[];
}

const POPULAR_PUBLISHERS = [
  'Bilgi Sarmal',
  '3D Yayınları',
  'Karakök Yayınları',
  'Apotemi',
  'Orijinal Yayınları',
  'Limit Yayınları',
  'Palme Yayınları',
  'Çap Yayınları',
  'Hız ve Renk',
  'MEB / OGM Materyal',
  'Özel Fasikül / Deneme'
];

export const ManualTaskModal: React.FC<ManualTaskModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialStudentId,
  availableStudents
}) => {
  // Aktif öğrenci listesi
  const students = useMemo(() => {
    if (availableStudents && availableStudents.length > 0) return availableStudents;
    return StorageService.getUsers().filter(u => u.role === 'STUDENT' && !u.is_archived);
  }, [availableStudents]);

  // Form State: 1. Öğrenci & Tarih
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    initialStudentId || (students[0]?.id ?? 'student-1')
  );

  const [date, setDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [startTime, setStartTime] = useState<string>('17:30');
  const [endTime, setEndTime] = useState<string>('18:15');

  // Kademeli Seçim State
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(CASCADING_CURRICULUM[0].id);
  const [selectedGrade, setSelectedGrade] = useState<'9th' | '10th' | '11th' | '12th'>('12th');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');

  // 1. Özellik: Eylem Türü (Action Type)
  const [actionType, setActionType] = useState<ActionType>('question_bank');

  // 2. Özellik: Sayısal Hedef (Soru Sayısı)
  const [targetQuestionCount, setTargetQuestionCount] = useState<number | ''>(24);

  // 3. Özellik: Kaynak Kitap & Link
  const [resourceBook, setResourceBook] = useState<string>('3D AYT Fizik Soru Bankası Test 4-5');
  const [resourceLink, setResourceLink] = useState<string>('');

  // 4. Özellik: Öncelik & Kritiklik Düzeyi
  const [priorityLevel, setPriorityLevel] = useState<TaskPriorityLevel>('normal');

  // 5. Özellik: Tekrarlayan Görev (Rutin)
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [recurrenceDays, setRecurrenceDays] = useState<number>(7);

  // 6. Özellik: Dosya / PDF Eki
  const [attachmentName, setAttachmentName] = useState<string>('');
  const [attachmentUrl, setAttachmentUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Genel Başlık & Not & Kilit
  const [customTitle, setCustomTitle] = useState<string>('');
  const [counselorNotes, setCounselorNotes] = useState<string>('');
  const [location, setLocation] = useState<TaskLocation>('home');
  const [isLocked, setIsLocked] = useState<boolean>(true); // Danışman eklediği için kilitli

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Initial student id değiştiğinde senkronize et
  useEffect(() => {
    if (initialStudentId) {
      setSelectedStudentId(initialStudentId);
    } else if (students.length > 0 && !selectedStudentId) {
      setSelectedStudentId(students[0].id);
    }
  }, [initialStudentId, students]);

  // Seçili derse göre mevcut sınıf düzeyleri
  const currentSubject = useMemo(() => {
    return CASCADING_CURRICULUM.find(s => s.id === selectedSubjectId) || CASCADING_CURRICULUM[0];
  }, [selectedSubjectId]);

  const availableGradesForSubject = useMemo(() => {
    return currentSubject.grades;
  }, [currentSubject]);

  // Sınıf düzeyi derse göre değişirse geçerli bir sınıfa çek
  useEffect(() => {
    const hasGrade = availableGradesForSubject.some(g => g.grade === selectedGrade);
    if (!hasGrade && availableGradesForSubject.length > 0) {
      setSelectedGrade(availableGradesForSubject[0].grade);
    }
  }, [selectedSubjectId, availableGradesForSubject, selectedGrade]);

  // Seçili ders ve sınıfa göre filtrelenmiş konular
  const currentTopics = useMemo(() => {
    const gradeObj = availableGradesForSubject.find(g => g.grade === selectedGrade);
    return gradeObj ? gradeObj.topics : [];
  }, [availableGradesForSubject, selectedGrade]);

  // Konu listesi değişince ilk konuyu seç
  useEffect(() => {
    if (currentTopics.length > 0) {
      const firstTopic = currentTopics[0];
      setSelectedTopicId(firstTopic.id);
    } else {
      setSelectedTopicId('');
    }
  }, [currentTopics]);

  // Konu veya Eylem Türü değişince önerilen başlığı otomatik oluştur
  useEffect(() => {
    const topicObj = currentTopics.find(t => t.id === selectedTopicId);
    if (topicObj) {
      let actionLabel = 'Soru Bankası';
      if (actionType === 'study') actionLabel = 'Konu Çalışması';
      else if (actionType === 'past_questions') actionLabel = 'Çıkmış Sorular';
      else if (actionType === 'mini_quiz') actionLabel = 'Mini Quiz';
      else if (actionType === 'error_review') actionLabel = 'Hata Analizi';

      const targetText = targetQuestionCount ? ` (${targetQuestionCount} Soru)` : '';
      setCustomTitle(`${currentSubject.name}: ${topicObj.name} - [${actionLabel}]${targetText}`);
    }
  }, [selectedTopicId, actionType, targetQuestionCount, currentSubject.name, currentTopics]);

  // Başlangıç saati değişince otomatik +45 dk hesapla
  const handleStartTimeChange = (newStart: string) => {
    setStartTime(newStart);
    try {
      const [h, m] = newStart.split(':').map(Number);
      const totalMin = h * 60 + m + 45;
      const endH = Math.floor(totalMin / 60) % 24;
      const endM = totalMin % 60;
      const formatted = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
      setEndTime(formatted);
    } catch (e) {}
  };

  // Dosya Yükleme İşlemi (FileReader ile Base64 / Data URL)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Maksimum 5MB kontrolü
    if (file.size > 5 * 1024 * 1024) {
      setFormError('Yüklenen dosya boyutu 5 MB\'dan küçük olmalıdır.');
      return;
    }

    setAttachmentName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setAttachmentUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAttachment = () => {
    setAttachmentName('');
    setAttachmentUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedStudentId) {
      setFormError('Lütfen bir öğrenci seçiniz.');
      return;
    }
    if (!date) {
      setFormError('Lütfen görev tarihini seçiniz.');
      return;
    }
    if (!startTime || !endTime) {
      setFormError('Lütfen başlangıç ve bitiş saatlerini belirleyiniz.');
      return;
    }
    if (startTime >= endTime) {
      setFormError('Bitiş saati başlangıç saatinden sonra olmalıdır.');
      return;
    }
    if (!customTitle.trim()) {
      setFormError('Lütfen görev başlığı giriniz.');
      return;
    }

    const topicObj = currentTopics.find(t => t.id === selectedTopicId);
    const topicName = topicObj ? topicObj.name : customTitle.trim();

    setIsSubmitting(true);

    try {
      // Görev kategorisi ve taskType eşleme
      let category: TaskCategory = 'study';
      let taskTypeConverted: HourlyTask['taskType'] = 'LECTURE';

      if (actionType === 'question_bank') {
        category = 'test';
        taskTypeConverted = 'QUESTION_BANK';
      } else if (actionType === 'past_questions') {
        category = 'library_study';
        taskTypeConverted = 'PAST_QUESTIONS';
      } else if (actionType === 'mini_quiz') {
        category = 'ai_quiz';
        taskTypeConverted = 'CRITICAL_12';
      } else if (actionType === 'error_review') {
        category = 'study';
        taskTypeConverted = 'QUESTION_BANK';
      } else if (actionType === 'study') {
        category = 'study';
        taskTypeConverted = 'LECTURE';
      }

      const parsedTargetQuestions = targetQuestionCount ? Number(targetQuestionCount) : undefined;
      const cleanGrade = (selectedGrade.replace('th', '') || '12') as any;

      const baseTask: HourlyTask = {
        id: `task-${Date.now()}`,
        studentId: selectedStudentId,
        title: customTitle.trim(),
        subjectName: currentSubject.name,
        topicName: topicName,
        taskType: taskTypeConverted,
        date: date,
        startTime: startTime,
        endTime: endTime,
        lessonDurationMinutes: 45,
        breakDurationMinutes: 15,
        isCompleted: false,
        counselorApproved: true,
        is_locked: true, // Şartname 2.Kayıt: is_locked = true olarak yazılır
        category: category,
        location: location,
        counselorNotes: counselorNotes.trim() ? counselorNotes.trim() : undefined,

        // Veritabanı ve Şartname Alanları:
        action_type: actionType,
        grade_level: cleanGrade,
        target_question_count: parsedTargetQuestions,
        solved_question_count: 0,
        correct_count: 0,
        incorrect_count: 0,
        empty_count: 0,
        resource_book: resourceBook.trim() ? resourceBook.trim() : undefined,
        resource_link: resourceLink.trim() ? resourceLink.trim() : undefined,
        priority_level: priorityLevel,
        is_recurring: isRecurring,
        recurrence_days_count: isRecurring ? recurrenceDays : undefined,
        attachment_name: attachmentName || undefined,
        attachment_url: attachmentUrl || undefined
      };

      if (isRecurring && recurrenceDays > 1) {
        // Tekrarlayan rutin kaydı
        const res = StorageService.saveRecurringTasks(baseTask, recurrenceDays);
        if (res.success) {
          try {
            confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
          } catch (e) {}
          onSuccess(selectedStudentId);
          onClose();
        } else {
          setFormError('Tekrarlayan görevler kaydedilirken bir hata oluştu.');
        }
      } else {
        // Tekil kayıt
        const result = StorageService.saveTask(baseTask);
        if (result.success) {
          try {
            confetti({ particleCount: 75, spread: 70, origin: { y: 0.6 } });
          } catch (e) {}
          onSuccess(selectedStudentId);
          onClose();
        } else {
          setFormError(result.message || 'Görev kaydedilirken çakışma oluştu.');
        }
      }
    } catch (err: any) {
      setFormError(err?.message || 'Görev kaydedilirken beklenmeyen bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-4 flex flex-col max-h-[94vh]">
        
        {/* Üst Başlık */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-400 border border-indigo-500/30 shadow-inner">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  Danışman Nokta Atışı Görev ve Etüt Merkezi
                </h2>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-400" />
                  Kilitli Saat
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Hedef soru, kaynak linki, acil eksik bayrağı ve dosya ekiyle profesyonel koçluk ataması yapın.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Gövdesi */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-5">
          {formError && (
            <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* 1. ÖĞRENCİ SEÇİMİ */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5 text-indigo-400" />
              <span>Hedef Öğrenci</span>
              <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {students.map(st => {
                const isSelected = selectedStudentId === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSelectedStudentId(st.id)}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition ${
                      isSelected
                        ? 'bg-indigo-600/25 border-indigo-500 text-white shadow-md ring-1 ring-indigo-500/50'
                        : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <img src={st.avatar} alt={st.name} className="w-7 h-7 rounded-lg object-cover" />
                    <div className="truncate">
                      <div className="text-xs font-bold truncate">{st.name}</div>
                      <div className="text-[10px] text-slate-400">
                        {st.grade === '12' ? '12. Sınıf' : st.grade === 'graduate' ? 'Mezun' : st.education_level || 'Öğrenci'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. ÖZELLİK 1: EYLEM TÜRÜ (ACTION TYPE) */}
          <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800 space-y-2.5">
            <label className="block text-xs font-bold text-white flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-indigo-400" />
                1. Görev Tipi / Eylem Türü (Action Type)
              </span>
              <span className="text-[10px] text-slate-400">Öğrenci takviminde renkli rozetle gösterilir</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { 
                  type: 'study', 
                  label: 'Konu Çalışması', 
                  desc: 'Konu Kavrama & Video', 
                  color: 'border-blue-500/50 bg-blue-500/10 text-blue-300',
                  icon: '📖'
                },
                { 
                  type: 'question_bank', 
                  label: 'Soru Bankası', 
                  desc: 'Test / Soru Çözümü', 
                  color: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300',
                  icon: '✍️'
                },
                { 
                  type: 'past_questions', 
                  label: 'Çıkmış Sorular', 
                  desc: 'ÖSYM Çıkmış Sorular', 
                  color: 'border-amber-500/50 bg-amber-500/10 text-amber-300',
                  icon: '🏛️'
                },
                { 
                  type: 'mini_quiz', 
                  label: 'Mini Quiz', 
                  desc: '12 Kritik Soru & Tarama', 
                  color: 'border-purple-500/50 bg-purple-500/10 text-purple-300',
                  icon: '🎯'
                },
                { 
                  type: 'error_review', 
                  label: 'Hata Analizi', 
                  desc: 'Yanlış Soru Tekrarı', 
                  color: 'border-rose-500/50 bg-rose-500/10 text-rose-300',
                  icon: '📕'
                }
              ].map(item => {
                const isSelected = actionType === item.type;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setActionType(item.type as ActionType)}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                      isSelected
                        ? `${item.color} ring-1 ring-white/20 shadow-md font-bold scale-[1.02]`
                        : 'bg-slate-800/40 border-slate-700/70 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs">
                      <span>{item.icon}</span>
                      <span className="truncate">{item.label}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 truncate">{item.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. KADEMELİ SEÇİM: DERS -> SINIF -> DİNAMİK KONU */}
          <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 space-y-3.5">
            <div className="text-xs font-bold text-indigo-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>Kademeli Müfredat ve Konu Eşleştirme</span>
              </span>
              <span className="text-[10px] text-indigo-400/80">MEB / ÖSYM Müfredatı</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* 1. DERS SEÇİMİ */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Ders / Alan Seçimi
                </label>
                <select
                  value={selectedSubjectId}
                  onChange={e => setSelectedSubjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {CASCADING_CURRICULUM.map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>

              {/* 2. SINIF DÜZEYİ */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Sınıf Düzeyi
                </label>
                <select
                  value={selectedGrade}
                  onChange={e => setSelectedGrade(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {availableGradesForSubject.map(g => (
                    <option key={g.grade} value={g.grade}>{g.gradeLabel}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 3. DİNAMİK KONU SEÇİMİ */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center justify-between">
                <span>Müfredat Konusu ({currentTopics.length} Konu)</span>
                <span className="text-[10px] text-indigo-400 font-mono">Ders ve sınıfa göre filtrelendi</span>
              </label>
              <select
                value={selectedTopicId}
                onChange={e => setSelectedTopicId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-indigo-500/50 text-xs text-white font-medium focus:outline-none focus:border-indigo-400"
              >
                {currentTopics.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 4. ÖZELLİK 2: SAYISAL HEDEF (SORU / SAYFA SAYISI) */}
          <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-emerald-400" />
                <span>2. Sayısal Hedef (Hedef Soru / Sayfa Sayısı)</span>
              </label>
              <span className="text-[10px] text-slate-400">
                Öğrenci tick atarken [D / Y / B] kutularını dolduracaktır
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-32">
                <input
                  type="number"
                  min="0"
                  max="500"
                  value={targetQuestionCount}
                  onChange={e => setTargetQuestionCount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Örn: 24"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-emerald-500/50 text-xs text-white font-bold font-mono focus:outline-none focus:border-emerald-400"
                />
              </div>

              {/* Hızlı Soru Seçim Butonları */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {[15, 20, 24, 30, 40, 50].map(cnt => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setTargetQuestionCount(cnt)}
                    className={`px-2.5 py-1 rounded-lg border text-xs font-mono font-bold transition ${
                      targetQuestionCount === cnt
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                        : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:text-white'
                    }`}
                  >
                    {cnt} Soru
                  </button>
                ))}
                {targetQuestionCount !== '' && (
                  <button
                    type="button"
                    onClick={() => setTargetQuestionCount('')}
                    className="text-[11px] text-slate-400 hover:text-rose-400 underline ml-2"
                  >
                    Hedefi Kaldır
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 5. ÖZELLİK 3: KAYNAK KİTAP & VİDEO/WEB LİNKİ */}
          <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800 space-y-3">
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span>3. Kaynak / Yayın ve Web / Video Linki Bağlama</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Kaynak Kitap */}
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Kaynak Kitap / Fasikül / Sayfa Aralığı
                </label>
                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={resourceBook}
                    onChange={e => setResourceBook(e.target.value)}
                    placeholder="Örn: Bilgi Sarmal TYT Fizik SF 45-48"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  {/* Hızlı Yayın Seçici */}
                  <div className="flex gap-1 overflow-x-auto pb-1 text-[10px] text-slate-400 scrollbar-none">
                    {POPULAR_PUBLISHERS.slice(0, 5).map(pub => (
                      <button
                        key={pub}
                        type="button"
                        onClick={() => setResourceBook(`${pub} ${currentSubject.name}`)}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 whitespace-nowrap border border-slate-700/60"
                      >
                        {pub}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Video / Web Linki */}
              <div>
                <label className="block text-[11px] text-slate-400 mb-1 flex items-center gap-1">
                  <Video className="w-3 h-3 text-red-400" />
                  <span>YouTube / Konu Anlatımı veya Soru Çözüm Linki</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-500">
                    <Link2 className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="url"
                    value={resourceLink}
                    onChange={e => setResourceLink(e.target.value)}
                    placeholder="https://youtube.com/watch?v=... veya çözüm linki"
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Öğrenci takvimde göreve tıklayarak doğrudan videoya veya kaynağa gidecektir.
                </span>
              </div>
            </div>
          </div>

          {/* 6. ÖZELLİK 4 & 5: ÖNCELİK (KRİTİK/FLAG) VE TEKRARLAYAN RUTİN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 4. ÖNCELİK / KRİTİKLİK DÜZEYİ */}
            <div className={`p-4 rounded-2xl border transition ${
              priorityLevel === 'high_priority'
                ? 'bg-rose-950/30 border-rose-500/50 shadow-md ring-1 ring-rose-500/30'
                : 'bg-slate-950/50 border-slate-800'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Flame className={`w-3.5 h-3.5 ${priorityLevel === 'high_priority' ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`} />
                  4. Öncelik & Kritiklik Düzeyi
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPriorityLevel('normal')}
                  className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                    priorityLevel === 'normal'
                      ? 'bg-slate-800 border-indigo-500 text-white shadow-sm'
                      : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  Standart Etüt
                </button>
                <button
                  type="button"
                  onClick={() => setPriorityLevel('high_priority')}
                  className={`flex-1 py-2 px-3 rounded-xl border text-xs font-extrabold transition flex items-center justify-center gap-1.5 ${
                    priorityLevel === 'high_priority'
                      ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-600/30'
                      : 'bg-slate-900/60 border-slate-700 text-rose-400 hover:bg-rose-950/20'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  Kritik / Zorunlu Etüt
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-2">
                {priorityLevel === 'high_priority'
                  ? '⚠️ Öğrenci bunu tamamlamadan günü bitirirse AI Koç takvimde acil uyarı verecektir.'
                  : 'Normal program akışında yer alır.'}
              </p>
            </div>

            {/* 5. TEKRARLAYAN GÖREV (RUTİN) */}
            <div className={`p-4 rounded-2xl border transition ${
              isRecurring
                ? 'bg-cyan-950/30 border-cyan-500/50 shadow-md ring-1 ring-cyan-500/30'
                : 'bg-slate-950/50 border-slate-800'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Repeat className="w-3.5 h-3.5 text-cyan-400" />
                  5. Tekrarlayan Rutin Görev
                </span>
                <input
                  type="checkbox"
                  id="is_recurring_toggle"
                  checked={isRecurring}
                  onChange={e => setIsRecurring(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0 w-4 h-4 cursor-pointer"
                />
              </div>

              {isRecurring ? (
                <div className="space-y-2 animate-fadeIn">
                  <label className="block text-[11px] text-cyan-300">
                    Bu görevi belirtilen gün sayısı boyunca her gün aynı saatte oluştur:
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[3, 5, 7, 14].map(days => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => setRecurrenceDays(days)}
                        className={`px-2.5 py-1 rounded-lg border text-xs font-mono font-bold transition ${
                          recurrenceDays === days
                            ? 'bg-cyan-600 text-white border-cyan-500'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                        }`}
                      >
                        {days} Gün
                      </button>
                    ))}
                  </div>
                  <span className="text-[10px] text-cyan-400/80 block">
                    (Örn: Her gün 20 Paragraf sorusu veya Geometri etüdü)
                  </span>
                </div>
              ) : (
                <p className="text-[10px] text-slate-400 mt-2">
                  Aktif ederseniz seçilen saatte her gün otomatik olarak takvime kilitlenir.
                </p>
              )}
            </div>
          </div>

          {/* 7. ÖZELLİK 6: ÖĞRENCİYE ÖZEL DOSYA / PDF EKİ */}
          <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-indigo-400" />
                6. Öğrenciye Özel Dosya / Test / PDF Eki
              </span>
              <span className="text-[10px] text-slate-400">PDF, JPG, PNG (Maks 5 MB)</span>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
              className="hidden"
              id="task_file_upload"
            />

            {attachmentName ? (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/40 text-xs">
                <div className="flex items-center gap-2 truncate">
                  <FileText className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <span className="text-white font-medium truncate">{attachmentName}</span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Eklendi
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveAttachment}
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                  title="Dosyayı Kaldır"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <label
                  htmlFor="task_file_upload"
                  className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
                >
                  <Upload className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Bilgisayardan Dosya / Test Ekle</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setAttachmentName('TYT_Matematik_Temel_Kavramlar_Calisma_Fasikulu.pdf');
                    setAttachmentUrl('#sample-test-pdf');
                  }}
                  className="text-[11px] text-indigo-400 hover:underline"
                >
                  (Örnek Test PDF Ekle)
                </button>
              </div>
            )}
          </div>

          {/* 8. TARİH VE SAAT DİLİMİ */}
          <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                Tarih ve Saat Dilimi
              </span>
              {/* Hızlı Saat Butonları */}
              <div className="flex items-center gap-1 text-[11px]">
                {[
                  { label: '09:00', start: '09:00', end: '09:45' },
                  { label: '14:00', start: '14:00', end: '14:45' },
                  { label: '17:30', start: '17:30', end: '18:15' },
                  { label: '19:30', start: '19:30', end: '20:15' }
                ].map(slot => (
                  <button
                    key={slot.label}
                    type="button"
                    onClick={() => {
                      setStartTime(slot.start);
                      setEndTime(slot.end);
                    }}
                    className={`px-2 py-0.5 rounded-lg border font-mono transition ${
                      startTime === slot.start && endTime === slot.end
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-800 text-slate-400 hover:text-white border-slate-700'
                    }`}
                  >
                    {slot.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Görev Tarihi</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Başlangıç Saati</label>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={e => handleStartTimeChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Bitiş Saati (45 dk)</label>
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* 9. GÖREV BAŞLIĞI VE DANIŞMAN NOTU */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Takvimde Görünecek Görev Başlığı
              </label>
              <input
                type="text"
                required
                value={customTitle}
                onChange={e => setCustomTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                placeholder="Örn: AYT Matematik: Türev Alma Kuralları Soru Çözümü"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                <span>Danışman Notu / Görev Detayı (Opsiyonel)</span>
                <span className="text-[10px] text-slate-500">Öğrenci kartında ve AI asistanında görüntülenir</span>
              </label>
              <textarea
                rows={2}
                value={counselorNotes}
                onChange={e => setCounselorNotes(e.target.value)}
                placeholder="Örn: 24 adet yeni nesil soru çözülecek. Takıldığın soruları hata defterine ekleyip AI koça sor."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* 10. KİLİT KORUMASI VE ÇALIŞMA YERİ */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 text-xs">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="task_is_locked_modal"
                checked={isLocked}
                onChange={e => setIsLocked(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0 w-4 h-4 cursor-pointer"
              />
              <label htmlFor="task_is_locked_modal" className="text-amber-300 font-semibold cursor-pointer flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Bu saati takvime kilitle (is_locked: true)</span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400">Çalışma Yeri:</span>
              <select
                value={location}
                onChange={e => setLocation(e.target.value as any)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-white text-xs"
              >
                <option value="home">Ev</option>
                <option value="library">Kütüphane</option>
                <option value="school">Okul</option>
                <option value="classroom">Dershane / Ofis</option>
              </select>
            </div>
          </div>

          {/* MODAL AKSİYON BUTONLARI */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 transition active:scale-95 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Kaydediliyor...' : isRecurring ? `${recurrenceDays} Günlük Rutini Takvime Ekle` : 'Görevi Takvime Ekle ve Kilitle'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
