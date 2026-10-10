'use client';

import React, { useState } from 'react';
import { 
  User, 
  HourlyTask, 
  ExamResult, 
  CounselorNote, 
  AiDeficiency,
  TaskType,
  TaskCategory,
  TaskLocation,
  TaskInstructor,
  StudentCriticalDeficit,
  AiQuizSubmission,
  StudentLibraryResource,
  LibraryResourceType
} from '@/types';
import { TYT_SUBJECTS, AYT_SAYISAL_SUBJECTS } from '@/data/seedData';
import { StorageService } from '@/lib/storage';
import { generateCounselorAiReport, generateAutoCompensatoryTask, generateCriticalDeficitCompensatoryTask } from '@/lib/aiCoach';
import { WeeklyHourlyCalendar } from '../student/WeeklyHourlyCalendar';
import { TopicMasteryMatrix } from '../student/TopicMasteryMatrix';
import { AnalyticsCharts } from '../student/AnalyticsCharts';
import { ExemptionApprovalPanel } from './ExemptionApprovalPanel';
import { TestSolverModal } from '../TestSolverModal';
import { 
  X, 
  Calendar, 
  ListTree, 
  TrendingUp, 
  FileText, 
  Brain, 
  Plus, 
  Check, 
  Clock, 
  Trash2, 
  Upload, 
  ExternalLink, 
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  FileCheck2,
  ShieldCheck,
  Lock,
  RotateCw,
  MapPin,
  GraduationCap,
  BookOpen,
  Camera,
  Award,
  Video,
  Pin,
  Globe,
  Share2,
  MessageSquare
} from 'lucide-react';
import { AvatarUploadModal } from '../AvatarUploadModal';
import { ParentReportModal } from '../ParentReportModal';
import { QuestionBankModal } from '../QuestionBankModal';

interface StudentDetailModalProps {
  student: User;
  onClose: () => void;
  onOpenUploadExam: () => void;
  onRefreshData: () => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  student,
  onClose,
  onOpenUploadExam,
  onRefreshData
}) => {
  const [activeTab, setActiveTab] = useState<'CALENDAR' | 'TREE' | 'EXAMS' | 'NOTES' | 'AI_REPORT'>('CALENDAR');
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  // Load state
  const tasks = StorageService.getTasks(student.id);
  const exams = StorageService.getExams(student.id);
  const notes = StorageService.getNotes(student.id);
  const deficiencies = StorageService.getDeficiencies(student.id);
  const criticalDeficits = StorageService.getStudentCriticalDeficits(student.id);
  const quizSubmissions = StorageService.getQuizSubmissions(student.id);
  const scoreProfile = StorageService.getStudentScoreProfile(student.id);
  const weeklyReports = StorageService.getWeeklyReports(student.id);
  const latestWeeklyReport = StorageService.getLatestWeeklyReport(student.id) || (weeklyReports.length > 0 ? weeklyReports[0] : null);
  const [isAiQuizModalOpen, setIsAiQuizModalOpen] = useState(false);
  const [isParentReportModalOpen, setIsParentReportModalOpen] = useState(false);
  const [isQuestionBankOpen, setIsQuestionBankOpen] = useState(false);
  const [selectedQuizTopic, setSelectedQuizTopic] = useState("Newton'un Hareket Yasaları");
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const handleGenerateWeeklyReport = async () => {
    setIsGeneratingReport(true);
    try {
      const res = await fetch('/api/generate-weekly-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: student.id })
      });
      if (res.ok) {
        onRefreshData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleAddCriticalCompensatory = (deficit: StudentCriticalDeficit) => {
    const existingTasks = StorageService.getTasks(deficit.student_id);
    const task = generateCriticalDeficitCompensatoryTask(deficit, existingTasks);
    StorageService.saveTask(task);
    deficit.status = 'in_progress';
    onRefreshData();
    alert(`"${deficit.critical_concept || deficit.topic_name}" için takvime telafi etüdü eklendi! (${task.date} ${task.startTime}-${task.endTime})`);
  };

  const handleResolveCriticalDeficit = (deficitId: string) => {
    StorageService.resolveStudentCriticalDeficit(deficitId);
    onRefreshData();
  };

  const handleLaunchQuizForStudent = (topicName: string) => {
    setSelectedQuizTopic(topicName);
    setIsAiQuizModalOpen(true);
  };

  // New task form state
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskSubject, setNewTaskSubject] = useState('İleri Matematik (AYT)');
  const [newTaskTopic, setNewTaskTopic] = useState('Türev ve Türevin Uygulamaları');
  const [newTaskType, setNewTaskType] = useState<TaskType>('LECTURE');
  const [newTaskCategory, setNewTaskCategory] = useState<TaskCategory>('standard');
  const [newTaskLocation, setNewTaskLocation] = useState<TaskLocation>(student.id === 'student-2' ? 'library' : 'home');
  const [newTaskInstructor, setNewTaskInstructor] = useState<TaskInstructor>('mentor');
  const [newTaskDate, setNewTaskDate] = useState('2026-09-29');
  const [newTaskStartTime, setNewTaskStartTime] = useState('14:00');
  const [newTaskEndTime, setNewTaskEndTime] = useState('14:45');
  const [newTaskIsLocked, setNewTaskIsLocked] = useState(true);
  const [newTaskCounselorNote, setNewTaskCounselorNote] = useState('');
  const [taskError, setTaskError] = useState('');

  // New note form state
  const [showNewNoteForm, setShowNewNoteForm] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteLink, setNewNoteLink] = useState('');

  // Aşama 5: Kütüphane Kaynak Yönetimi
  const libraryResources = StorageService.getStudentLibraryResources(student.id);
  const [showNewResourceModal, setShowNewResourceModal] = useState(false);
  const [newResTitle, setNewResTitle] = useState('');
  const [newResType, setNewResType] = useState<LibraryResourceType>('youtube_link');
  const [newResSubject, setNewResSubject] = useState('Kimya (AYT)');
  const [newResTopic, setNewResTopic] = useState('Organik Kimyaya Giriş');
  const [newResCategory, setNewResCategory] = useState<'TYT' | 'AYT_SAYISAL' | 'ALL'>('AYT_SAYISAL');
  const [newResUrlOrContent, setNewResUrlOrContent] = useState('');

  const handleCreateLibraryResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResTitle || !newResUrlOrContent) return;

    const newRes: StudentLibraryResource = {
      id: 'res-' + Date.now(),
      student_id: student.id,
      title: newResTitle,
      resource_type: newResType,
      subject_name: newResSubject,
      topic_name: newResTopic,
      category: newResCategory,
      url_or_content: newResUrlOrContent,
      created_by: 'counselor-1',
      created_by_name: 'Cen Hoca (Danışman)',
      created_at: new Date().toISOString()
    };

    StorageService.saveStudentLibraryResource(newRes);
    setShowNewResourceModal(false);
    setNewResTitle('');
    setNewResUrlOrContent('');
    onRefreshData();
  };

  const handleDeleteLibraryResource = (resId: string) => {
    if (confirm('Bu kütüphane kaynağını kaldırmak istediğinize emin misiniz?')) {
      StorageService.deleteStudentLibraryResource(resId);
      onRefreshData();
    }
  };

  // AI report generation
  const aiReport = generateCounselorAiReport(
    student.name,
    student.grade || '12',
    scoreProfile.planFidelity,
    exams,
    deficiencies
  );

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle) return;
    setTaskError('');

    const task: HourlyTask = {
      id: `task-${Date.now()}`,
      studentId: student.id,
      title: newTaskTitle,
      subjectName: newTaskSubject,
      topicName: newTaskTopic,
      taskType: newTaskType,
      category: newTaskCategory,
      location: newTaskLocation,
      instructor: newTaskInstructor,
      date: newTaskDate,
      startTime: newTaskStartTime,
      endTime: newTaskEndTime,
      lessonDurationMinutes: 45,
      breakDurationMinutes: 15,
      isCompleted: false,
      counselorApproved: true,
      is_locked: newTaskIsLocked,
      counselorNotes: newTaskCounselorNote || undefined
    };

    const result = StorageService.saveTask(task);
    if (!result.success) {
      setTaskError(result.message || 'Saat çakışması veya kilit engeli!');
      return;
    }

    setNewTaskTitle('');
    setNewTaskCounselorNote('');
    setShowNewTaskForm(false);
    onRefreshData();
  };

  const handleDeleteTask = (taskId: string) => {
    StorageService.deleteTask(taskId);
    onRefreshData();
  };

  const handleApproveTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      task.counselorApproved = true;
      StorageService.saveTask(task);
      onRefreshData();
    }
  };

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle || !newNoteContent) return;

    const note: CounselorNote = {
      id: `note-${Date.now()}`,
      studentId: student.id,
      counselorId: 'counselor-1',
      counselorName: 'Cen Danışman',
      title: newNoteTitle,
      content: newNoteContent,
      tags: ['Koçluk Tavsiyesi', 'Birebir'],
      externalLinks: newNoteLink ? [{ label: 'Kaynak Bağlantısı', url: newNoteLink, type: 'WEB' }] : [],
      createdAt: new Date().toISOString().split('T')[0]
    };

    StorageService.saveNote(note);
    setNewNoteTitle('');
    setNewNoteContent('');
    setNewNoteLink('');
    setShowNewNoteForm(false);
    onRefreshData();
  };

  const handleAutoCompensate = (def: AiDeficiency) => {
    const task = generateAutoCompensatoryTask(def);
    StorageService.saveTask(task);
    def.autoTaskCreated = true;
    StorageService.saveDeficiency(def);
    onRefreshData();
    alert(`"${def.topicName}" için takvime otomatik Telafi Görevi eklendi!`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col text-white">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3.5">
            <div 
              className="relative group cursor-pointer"
              onClick={() => setIsAvatarModalOpen(true)}
              title="Öğrencinin profil resmini değiştirmek için tıklayın"
            >
              <img
                src={student.avatar}
                alt={student.name}
                className="w-12 h-12 rounded-2xl object-cover ring-2 ring-indigo-500/40 group-hover:ring-indigo-400 group-hover:scale-105 transition"
              />
              <div className="absolute inset-0 rounded-2xl flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition">
                <Camera className="w-4 h-4 text-white" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-white">{student.name}</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                  {student.grade === 'MEZUN' ? 'Mezun' : '12. Sınıf'} Danışman Yönetim Masası
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Genel Öğrenci Skoru: <span className="font-bold text-indigo-300">{scoreProfile.overallScore}/100</span> | Müfredat Tamamlama: <span className="font-bold text-emerald-400">%{scoreProfile.curriculumCompletionRate}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsParentReportModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-xs font-bold text-white shadow-md transition"
              title="Veliye tek tıkla WhatsApp mesajı gönder veya resmi PDF karnesi oluştur"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>📱 Veli Raporu (WhatsApp / PDF)</span>
            </button>

            <button
              onClick={() => setIsQuestionBankOpen(true)}
              className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-xs font-bold text-white shadow-md transition"
              title="MEB ve ÖSYM soru tiplerini incele, çoklu çözümleri gör veya etüt ata"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-300" />
              <span>📚 Soru Bankası & Çoklu Çözüm</span>
            </button>

            <button
              onClick={onOpenUploadExam}
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-md transition"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Soru / Deneme Yükle</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-1 px-4 sm:px-6 pt-3 bg-slate-900 border-b border-slate-800 overflow-x-auto flex-shrink-0">
          {[
            { id: 'CALENDAR', label: 'Dinamik Takvim & Müdahale', icon: Calendar },
            { id: 'TREE', label: 'Ders & Konu Ağacı', icon: ListTree },
            { id: 'EXAMS', label: 'Deneme & Tarama Sonuçları', icon: TrendingUp },
            { id: 'NOTES', label: 'Danışman Notları & Kaynaklar', icon: FileText },
            { id: 'AI_REPORT', label: 'Yapay Zeka Haftalık Analiz Raporu', icon: Brain }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-3 px-3.5 border-b-2 text-xs font-semibold whitespace-nowrap transition ${
                  isActive
                    ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10 rounded-t-lg'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* TAB 1: CALENDAR & INTERVENTION */}
          {activeTab === 'CALENDAR' && (
            <div className="space-y-6">
              {/* Dinamik Haftalık/Günlük Takvim */}
              <WeeklyHourlyCalendar
                studentId={student.id}
                tasks={tasks}
                onTasksUpdated={onRefreshData}
                onOpenCriticalTest={(topic) => alert(`${topic} için kritik test modülü`)}
                isCounselor={true}
              />

              <div className="flex items-center justify-between pt-2">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-400" />
                    Saatlik Görev Listesi & Hızlı Müdahale
                  </h3>
                  <p className="text-xs text-slate-400">Danışman olarak saatleri ve görevleri elle düzenleyebilir, onaylayabilir veya silebilirsiniz.</p>
                </div>
                <button
                  onClick={() => setShowNewTaskForm(!showNewTaskForm)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition shadow"
                >
                  <Plus className="w-4 h-4" />
                  <span>Yeni Görev Ata</span>
                </button>
              </div>

              {/* New Task Inline Form */}
              {showNewTaskForm && (
                <form onSubmit={handleCreateTask} className="p-4 rounded-2xl bg-slate-950/70 border border-indigo-500/40 space-y-3">
                  <div className="text-xs font-bold text-indigo-300">Öğrenciye Yeni Saatlik Görev Tanımla</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="col-span-1 sm:col-span-2">
                      <label className="text-[11px] text-slate-400">Görev Başlığı</label>
                      <input
                        type="text"
                        required
                        value={newTaskTitle}
                        onChange={e => setNewTaskTitle(e.target.value)}
                        placeholder="Örn: Newton Yasaları & Eğik Düzlem Çözümleri"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400">Ders</label>
                      <input
                        type="text"
                        value={newTaskSubject}
                        onChange={e => setNewTaskSubject(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400">Konu</label>
                      <input
                        type="text"
                        value={newTaskTopic}
                        onChange={e => setNewTaskTopic(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400">Görev Tipi</label>
                      <select
                        value={newTaskType}
                        onChange={e => setNewTaskType(e.target.value as any)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                      >
                        <option value="LECTURE">Konu Anlatımı / Video</option>
                        <option value="QUESTION_BANK">Soru Bankası Testi</option>
                        <option value="PAST_QUESTIONS">Çıkmış Sorular</option>
                        <option value="CRITICAL_12">AI 12 Kritik Soru Testi</option>
                        <option value="TRIAL_EXAM">Deneme Sınavı</option>
                        <option value="COMPENSATORY">Telafi Görevi</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] text-indigo-300 font-medium">Kategori (Şartname D)</label>
                      <select
                        value={newTaskCategory}
                        onChange={e => {
                          const cat = e.target.value as TaskCategory;
                          setNewTaskCategory(cat);
                          if (cat === 'private_tutoring') {
                            setNewTaskInstructor('external_tutor');
                            setNewTaskIsLocked(true);
                          } else if (cat === 'mentor_session') {
                            setNewTaskInstructor('mentor');
                            setNewTaskIsLocked(true);
                          }
                        }}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                      >
                        <option value="standard">Standart Çalışma / Etüt</option>
                        <option value="private_tutoring">📚 Özel Ders (48s Ödev Üretir)</option>
                        <option value="mentor_session">🎓 Danışman Dersi (Cen Hoca)</option>
                        <option value="trial_exam">🏛️ Deneme Sınavı</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400">Lokasyon</label>
                      <select
                        value={newTaskLocation}
                        onChange={e => setNewTaskLocation(e.target.value as TaskLocation)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                      >
                        <option value="home">🏠 Ev</option>
                        <option value="library">📍 Kütüphane</option>
                        <option value="school">🏫 Okul / Dershane</option>
                        <option value="classroom">🏢 Sınıf / Kurs</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400">Eğitmen / Yönetici</label>
                      <select
                        value={newTaskInstructor}
                        onChange={e => setNewTaskInstructor(e.target.value as TaskInstructor)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                      >
                        <option value="mentor">🎓 Danışman (Cen Hoca)</option>
                        <option value="external_tutor">👨‍🏫 Harici Özel Ders Öğretmeni</option>
                        <option value="self_study">📖 Bireysel Çalışma</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400">Tarih</label>
                      <input
                        type="date"
                        value={newTaskDate}
                        onChange={e => setNewTaskDate(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400">Başlangıç Saati</label>
                      <input
                        type="time"
                        value={newTaskStartTime}
                        onChange={e => setNewTaskStartTime(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400">Bitiş Saati</label>
                      <input
                        type="time"
                        value={newTaskEndTime}
                        onChange={e => setNewTaskEndTime(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                      />
                    </div>
                  </div>

                  {taskError && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-400" />
                      <span>{taskError}</span>
                    </div>
                  )}

                  <div>
                    <label className="text-[11px] text-slate-400">Danışman Özel Notu / Yönergesi</label>
                    <input
                      type="text"
                      value={newTaskCounselorNote}
                      onChange={e => setNewTaskCounselorNote(e.target.value)}
                      placeholder="Öğrenci bu görevi açtığında göreceği koçluk notu..."
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                    />
                  </div>

                  <div className="pt-1">
                    <label className="flex items-center space-x-2 text-xs text-amber-300 font-medium cursor-pointer p-2 rounded-xl bg-amber-950/30 border border-amber-500/30">
                      <input
                        type="checkbox"
                        checked={newTaskIsLocked}
                        onChange={e => setNewTaskIsLocked(e.target.checked)}
                        className="rounded text-amber-500 focus:ring-amber-400"
                      />
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Danışman Saati Olarak Kilitle (is_locked=true — AI algoritmaları bu saati ezemez)</span>
                    </label>
                  </div>

                  <div className="flex justify-end space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowNewTaskForm(false)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-xs"
                    >
                      Vazgeç
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white"
                    >
                      Görevi Kaydet & Takvime Ekle
                    </button>
                  </div>
                </form>
              )}

              {/* Task list */}
              <div className="space-y-2.5">
                {tasks.map(task => (
                  <div
                    key={task.id}
                    className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      task.isCompleted
                        ? 'bg-slate-900/60 border-slate-800 text-slate-400'
                        : task.isAiGeneratedCompensatory
                        ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                        : 'bg-slate-850 border-slate-750 text-white'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`mt-0.5 p-1.5 rounded-lg ${
                        task.isCompleted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-indigo-400'
                      }`}>
                        {task.isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-xs text-white">{task.title}</span>
                          {task.is_locked && (
                            <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-bold flex items-center gap-0.5" title="Kilitli saat: AI ezemez">
                              <Lock className="w-3 h-3 text-amber-400" /> is_locked
                            </span>
                          )}
                          {task.isRescheduled && (
                            <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.2 rounded font-bold flex items-center gap-0.5">
                              <RotateCw className="w-3 h-3 text-cyan-400" /> Telafi Bloğuna Taşındı
                            </span>
                          )}
                          {task.isAiGeneratedCompensatory && (
                            <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-bold">
                              AI Telafi
                            </span>
                          )}
                          {task.category === 'private_tutoring' && (
                            <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.2 rounded font-bold flex items-center gap-0.5">
                              <BookOpen className="w-3 h-3 text-purple-400" /> Özel Ders (48s Ödev)
                            </span>
                          )}
                          {task.category === 'mentor_session' && (
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded font-bold flex items-center gap-0.5">
                              <GraduationCap className="w-3 h-3 text-emerald-400" /> Danışman Dersi
                            </span>
                          )}
                          {task.location && (
                            <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-750 px-1.5 py-0.2 rounded flex items-center gap-0.5 font-medium">
                              <MapPin className="w-3 h-3 text-cyan-400" />
                              {task.location === 'library' ? 'Kütüphane' : task.location === 'school' ? 'Okul/Kurs' : task.location === 'classroom' ? 'Sınıf' : 'Ev'}
                            </span>
                          )}
                          {task.instructor && (
                            <span className="text-[10px] bg-indigo-950/40 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.2 rounded font-medium">
                              {task.instructor === 'external_tutor' ? '👨‍🏫 Özel Ders' : task.instructor === 'mentor' ? '🎓 Cen Hoca' : '📖 Bireysel'}
                            </span>
                          )}
                          {task.counselorApproved && (
                            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded font-medium flex items-center gap-0.5">
                              <ShieldCheck className="w-3 h-3 text-indigo-400" /> Onaylı
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {task.subjectName} &bull; {task.topicName} &bull; <strong className="text-slate-300">{task.date}</strong> ({task.startTime} - {task.endTime})
                        </div>
                        {task.counselorNotes && (
                          <div className="text-[11px] text-indigo-300/90 mt-1 italic">
                            Koç Notu: &ldquo;{task.counselorNotes}&rdquo;
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 self-end sm:self-center">
                      {!task.counselorApproved && (
                        <button
                          onClick={() => handleApproveTask(task.id)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-300 text-xs font-medium"
                        >
                          Onayla
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
                        title="Görevi Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: TOPIC MASTERY MATRIX & EXEMPTION APPROVALS */}
          {activeTab === 'TREE' && (
            <div className="space-y-6">
              {/* Danışman Muafiyet Onay Masası */}
              <ExemptionApprovalPanel onRefreshData={onRefreshData} />

              {/* Öğrencinin Canlı Konu Hakimiyet Matrisi */}
              <TopicMasteryMatrix
                studentId={student.id}
                onRefreshData={onRefreshData}
              />
            </div>
          )}

          {/* TAB 3: EXAM RESULTS */}
          {activeTab === 'EXAMS' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    Deneme ve Tarama Sınav Sonuçları
                  </h3>
                  <p className="text-xs text-slate-400">Normalize edilmiş başarı yüzdeleri ve tahmini ÖSYM puanı</p>
                </div>
                <button
                  onClick={onOpenUploadExam}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition shadow"
                >
                  <Plus className="w-4 h-4" />
                  <span>Yeni Deneme Sonucu Ekle</span>
                </button>
              </div>

              {/* Recharts Analytics & Normalized Comparisons */}
              <AnalyticsCharts
                studentName={student.name}
                exams={exams}
                scoreProfile={scoreProfile}
                onShareWithPeer={() => {}}
              />

              <div className="pt-3 border-t border-slate-800">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                  Sınav Kayıtları ve Ders Bazlı Net Tablosu ({exams.length} Deneme)
                </h4>
              </div>

              <div className="space-y-4">
                {exams.map(exam => (
                  <div key={exam.id} className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-slate-800 gap-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-sm text-white">{exam.title}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                            {exam.examType}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">Tarih: {exam.date}</div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-[10px] text-slate-400 uppercase font-semibold">Toplam Net</div>
                          <div className="text-lg font-bold text-white">{exam.totalNet} / {exam.totalQuestions}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-slate-400 uppercase font-semibold">Normalize Başarı</div>
                          <div className="text-lg font-bold text-emerald-400">%{exam.overallSuccessPercentage.toFixed(1)}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-slate-400 uppercase font-semibold">Tahmini ÖSYM</div>
                          <div className="text-lg font-bold text-cyan-300">{exam.estimatedOsymScore}</div>
                        </div>
                      </div>
                    </div>

                    {/* Subject breakdowns */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {exam.subjectResults.map((sub, i) => (
                        <div key={i} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                          <div className="font-semibold text-slate-300 truncate">{sub.subjectName}</div>
                          <div className="flex items-baseline justify-between mt-1">
                            <span className="text-white font-bold">{sub.net} Net</span>
                            <span className="text-[11px] text-emerald-400">%{sub.normalizedPercentage.toFixed(0)}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {sub.correct} D / {sub.incorrect} Y ({sub.totalQuestions} S)
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: COUNSELOR NOTES */}
          {activeTab === 'NOTES' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    Danışman Hatırlatma Notları & Tavsiye Kaynaklar
                  </h3>
                  <p className="text-xs text-slate-400">Öğrenci profiline özel motivasyon, link ve video önerileri</p>
                </div>
                <button
                  onClick={() => setShowNewNoteForm(!showNewNoteForm)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition shadow"
                >
                  <Plus className="w-4 h-4" />
                  <span>Not Ekle</span>
                </button>
              </div>

              {showNewNoteForm && (
                <form onSubmit={handleCreateNote} className="p-4 rounded-2xl bg-slate-950/70 border border-indigo-500/40 space-y-3">
                  <div className="text-xs font-bold text-indigo-300">Yeni Koçluk Notu / Kaynak Tavsiyesi</div>
                  <div>
                    <input
                      type="text"
                      required
                      value={newNoteTitle}
                      onChange={e => setNewNoteTitle(e.target.value)}
                      placeholder="Not Başlığı (Örn: Bu Haftaki Fizik Stratejisi)"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <textarea
                      required
                      rows={3}
                      value={newNoteContent}
                      onChange={e => setNewNoteContent(e.target.value)}
                      placeholder="Öğrenciye pedagojik yönlendirme, taktikler, dikkat edilmesi gerekenler..."
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <input
                      type="url"
                      value={newNoteLink}
                      onChange={e => setNewNoteLink(e.target.value)}
                      placeholder="Web / YouTube Kaynak Linki (Opsiyonel)"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowNewNoteForm(false)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-xs"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white"
                    >
                      Notu Kaydet
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                {notes.map(note => (
                  <div key={note.id} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white">{note.title}</span>
                      <span className="text-[11px] text-slate-500">{note.createdAt}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{note.content}</p>
                    {note.externalLinks && note.externalLinks.length > 0 && (
                      <div className="pt-2 flex flex-wrap gap-2">
                        {note.externalLinks.map((l, idx) => (
                          <a
                            key={idx}
                            href={l.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1.5 text-[11px] px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 transition"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>{l.label}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* AŞAMA 5: DİJİTAL KÜTÜPHANE VE TAVSİYE KAYNAK HAVUZU */}
              <div className="pt-6 border-t border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <BookOpen className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-sm font-bold text-white">
                        {student.name} Dijital Kütüphanesine Kaynak & Video Tanımlama
                      </h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                        Aşama 5 Arşiv
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Öğrencinin kütüphane ekranında görünecek YouTube video dersleri, PDF testleri veya kalıcı notlar ekleyin.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowNewResourceModal(!showNewResourceModal)}
                    className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white text-xs font-bold shadow transition self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Kütüphaneye Kaynak Ekle</span>
                  </button>
                </div>

                {/* Form to define a new library resource */}
                {showNewResourceModal && (
                  <form onSubmit={handleCreateLibraryResource} className="p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/40 space-y-3">
                    <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      Öğrenci Kütüphanesine Yeni Kaynak Tanımla
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Kaynak Tipi</label>
                        <select
                          value={newResType}
                          onChange={e => setNewResType(e.target.value as any)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        >
                          <option value="youtube_link">📺 YouTube Video Dersi</option>
                          <option value="pdf_test">📄 PDF Test / Föy</option>
                          <option value="web_link">🌐 Web / Soru Bankası Linki</option>
                          <option value="mentor_note">📌 Danışman Özel Notu</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Sınav Düzeyi</label>
                        <select
                          value={newResCategory}
                          onChange={e => setNewResCategory(e.target.value as any)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        >
                          <option value="AYT_SAYISAL">AYT Sayısal</option>
                          <option value="TYT">TYT</option>
                          <option value="ALL">Tüm Sınavlar</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Ders / Alan</label>
                        <input
                          type="text"
                          required
                          value={newResSubject}
                          onChange={e => setNewResSubject(e.target.value)}
                          placeholder="Örn: Kimya (AYT)"
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Konu Başlığı</label>
                        <input
                          type="text"
                          value={newResTopic}
                          onChange={e => setNewResTopic(e.target.value)}
                          placeholder="Örn: Organik Kimyaya Giriş & Hibritleşme"
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Kaynak Başlığı</label>
                        <input
                          type="text"
                          required
                          value={newResTitle}
                          onChange={e => setNewResTitle(e.target.value)}
                          placeholder="Örn: Görkem Şahin - Hibritleşme ve Molekül Geometrisi"
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">
                        {newResType === 'mentor_note' ? 'Özel Not Metni' : 'URL Linki veya Doküman Yolu'}
                      </label>
                      {newResType === 'mentor_note' ? (
                        <textarea
                          required
                          rows={3}
                          value={newResUrlOrContent}
                          onChange={e => setNewResUrlOrContent(e.target.value)}
                          placeholder="Öğrencinin kütüphanesinde sürekli göreceği pedagojik taktik veya hatırlatma..."
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      ) : (
                        <input
                          type="url"
                          required
                          value={newResUrlOrContent}
                          onChange={e => setNewResUrlOrContent(e.target.value)}
                          placeholder="https://www.youtube.com/watch?v=... veya PDF linki"
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      )}
                    </div>

                    <div className="flex justify-end space-x-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowNewResourceModal(false)}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold"
                      >
                        İptal
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow"
                      >
                        Kaynağı Kütüphaneye Ekle
                      </button>
                    </div>
                  </form>
                )}

                {/* List of library resources */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {libraryResources.length === 0 ? (
                    <div className="col-span-2 p-6 rounded-2xl bg-slate-950/40 border border-dashed border-slate-800 text-center text-xs text-slate-500">
                      Öğrenciye tanımlanmış özel kütüphane kaynağı bulunmuyor.
                    </div>
                  ) : (
                    libraryResources.map(res => (
                      <div
                        key={res.id}
                        className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="flex items-start space-x-2.5">
                          <div className={`p-2 rounded-xl mt-0.5 ${
                            res.resource_type === 'youtube_link'
                              ? 'bg-red-500/20 text-red-400'
                              : res.resource_type === 'mentor_note'
                              ? 'bg-amber-500/20 text-amber-400'
                              : res.resource_type === 'pdf_test'
                              ? 'bg-indigo-500/20 text-indigo-400'
                              : 'bg-cyan-500/20 text-cyan-400'
                          }`}>
                            {res.resource_type === 'youtube_link' && <Video className="w-4 h-4" />}
                            {res.resource_type === 'mentor_note' && <Pin className="w-4 h-4" />}
                            {res.resource_type === 'pdf_test' && <FileText className="w-4 h-4" />}
                            {res.resource_type === 'web_link' && <Globe className="w-4 h-4" />}
                          </div>

                          <div>
                            <div className="font-bold text-white text-xs leading-snug">{res.title}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {res.subject_name} {res.topic_name ? `&bull; ${res.topic_name}` : ''}
                            </div>
                            {res.resource_type !== 'mentor_note' ? (
                              <a
                                href={res.url_or_content}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-indigo-400 hover:text-indigo-300 underline truncate max-w-[200px] block mt-1"
                              >
                                {res.url_or_content}
                              </a>
                            ) : (
                              <div className="text-[11px] text-amber-200/90 italic mt-1 line-clamp-2">
                                &ldquo;{res.url_or_content}&rdquo;
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteLibraryResource(res.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                          title="Kaynağı Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 5: AI PEDAGOGICAL REPORT */}
          {activeTab === 'AI_REPORT' && (
            <div className="space-y-6">
              {/* AŞAMA 4: HAFTALIK DANIŞMAN RAPORU (LLM MOTORU) */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-950 border-2 border-indigo-500/40 shadow-xl space-y-4">
                
                {/* Rapor Başlığı & Yenileme Butonu */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-400 text-white shadow-md">
                      <Brain className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-black text-sm text-white">
                          Haftalık Öğrenci Gelişim & Pedagojik Analiz Raporu
                        </h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          Otomatik AI
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Dönem: <strong className="text-slate-200">{latestWeeklyReport?.report_week_start || '22.09.2026'} - {latestWeeklyReport?.report_week_end || '28.09.2026'}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => setIsParentReportModalOpen(true)}
                      className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow transition hover:scale-105 active:scale-95 border border-emerald-400/30"
                      title="Veliye WhatsApp mesajı gönder veya resmi PDF karnesi oluştur"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>📱 Veli WhatsApp / PDF Gönder</span>
                    </button>

                    {/* Raporu Yenile Butonu */}
                    <button
                      disabled={isGeneratingReport}
                      onClick={handleGenerateWeeklyReport}
                      className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 disabled:opacity-50 text-white text-xs font-bold shadow transition hover:scale-105 active:scale-95 border border-cyan-400/30"
                      title="Bu haftaki tüm soru çözümlerini, etütleri ve denemeleri analiz edip yeni rapor üret"
                    >
                      <RotateCw className={`w-3.5 h-3.5 ${isGeneratingReport ? 'animate-spin' : ''}`} />
                      <span>{isGeneratingReport ? 'Analiz Ediliyor...' : 'Raporu Yenile (AI)'}</span>
                    </button>
                  </div>
                </div>

                {/* 100 Üzerinden Haftalık Skor ve Özet Metrikler */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-indigo-500/30 flex items-center space-x-3 sm:col-span-1">
                    <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Haftalık Puan</div>
                      <div className="text-2xl font-black text-cyan-300">
                        {latestWeeklyReport?.overall_score || 86.5}
                        <span className="text-xs text-slate-400 font-semibold">/100</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-center flex flex-col justify-center">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Etüt Sadakati</div>
                    <div className="text-lg font-black text-emerald-400">
                      %{latestWeeklyReport?.task_completion_rate || 88.0}
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-center flex flex-col justify-center">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Çözülen Soru</div>
                    <div className="text-lg font-black text-indigo-300">
                      {latestWeeklyReport?.total_questions_solved || 480} Soru
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-center flex flex-col justify-center">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">İsabet Oranı</div>
                    <div className="text-lg font-black text-cyan-400">
                      %{latestWeeklyReport?.accuracy_rate || 82.5}
                    </div>
                  </div>
                </div>

                {/* Pedagojik Teşhis */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-indigo-500/20 space-y-1.5">
                  <div className="flex items-center space-x-2 text-indigo-300 font-bold text-xs uppercase tracking-wide">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Pedagojik Teşhis (Akademik Gelişim Özeti)</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed font-sans">
                    {latestWeeklyReport?.academic_summary || `${student.name} bu hafta Matematik türev fasikülünde %88 sadakat gösterdi, ancak Fizik itme-momentum testlerinde boş bırakma oranı yüksek. Tepki kuvveti yanılgısı devam ediyor.`}
                  </p>
                </div>

                {/* Danışmana Aksiyon Tavsiyesi */}
                <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 text-xs space-y-1.5">
                  <div className="flex items-center space-x-2 text-amber-300 font-black uppercase tracking-wide text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Danışmana Özel Aksiyon Tavsiyesi:</span>
                  </div>
                  <p className="text-amber-200/90 leading-relaxed font-medium">
                    {latestWeeklyReport?.action_recommendations || 'Önümüzdeki hafta Fizik dersinde momentum konusuna 2 ek etüt açılması ve 12 soruluk pekiştirme testi tanımlanması önerilir.'}
                  </p>
                </div>

              </div>

                {/* AŞAMA 3: AI Radar & Kritik Eksik Takip Botu */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-red-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 rounded-lg bg-red-500/20 text-red-400">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="font-bold text-xs text-red-300">
                          AI Radar & Kritik Eksik Takip Botu ({criticalDeficits.length})
                        </h5>
                        <p className="text-[11px] text-slate-400">
                          Öğrencinin 12 soruluk test veya denemelerde yanlış yaptığı kritik kavramlar
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleLaunchQuizForStudent("Newton'un Hareket Yasaları")}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>+ 12 Kritik AI Testi Başlat</span>
                    </button>
                  </div>

                  {criticalDeficits.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-400 bg-slate-900/60 rounded-xl">
                      Öğrencinin şu anda aktif bir kritik eksik uyarısı bulunmamaktadır.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {criticalDeficits.map(cd => (
                        <div key={cd.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white">[{cd.subject_name || 'Fizik'}] {cd.topic_name}</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                cd.status === 'active_warning' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                                cd.status === 'in_progress' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                                'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              }`}>
                                {cd.status === 'active_warning' ? 'Aktif Uyarı' : cd.status === 'in_progress' ? 'Telafi Atandı' : 'Çözüldü'}
                              </span>
                            </div>
                            <div className="text-amber-300 font-medium">
                              Kritik Kavram: {cd.critical_concept}
                            </div>
                            {cd.common_student_pitfall && (
                              <div className="text-[11px] text-slate-400">
                                <span className="text-slate-500">ÖSYM Tuzağı:</span> {cd.common_student_pitfall}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center space-x-2 flex-shrink-0 self-end sm:self-center">
                            {cd.status === 'active_warning' && (
                              <button
                                onClick={() => handleAddCriticalCompensatory(cd)}
                                className="px-2.5 py-1.5 rounded-lg bg-red-600/30 hover:bg-red-600/50 text-red-200 border border-red-500/40 text-xs font-semibold transition"
                              >
                                Takvime Telafi Ata
                              </button>
                            )}
                            <button
                              onClick={() => handleLaunchQuizForStudent(cd.topic_name || "Newton'un Hareket Yasaları")}
                              className="px-2.5 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-xs font-semibold transition"
                            >
                              Testi Aç &rarr;
                            </button>
                            {cd.status !== 'resolved' && (
                              <button
                                onClick={() => handleResolveCriticalDeficit(cd.id)}
                                className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                                title="Eksiği çözüldü olarak işaretle"
                              >
                                ✓ Kapat
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* AŞAMA 3: 12 Soruluk AI Test Sonuçları & Karneler */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-cyan-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="font-bold text-xs text-cyan-300">
                          12 Soruluk AI Test Karneleri & Çözümlü PDF Durumu ({quizSubmissions.length})
                        </h5>
                        <p className="text-[11px] text-slate-400">
                          Öğrencinin çözdüğü 12 soruluk testler, netleri ve kilit durumları
                        </p>
                      </div>
                    </div>
                  </div>

                  {quizSubmissions.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-400 bg-slate-900/60 rounded-xl">
                      Öğrenci henüz bir AI testini tamamlamadı.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {quizSubmissions.map(sub => (
                        <div key={sub.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                          <div>
                            <div className="font-bold text-white flex items-center gap-2">
                              <span>AI Test Karnesi</span>
                              <span className="text-[10px] text-cyan-300 font-mono">
                                {sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString('tr-TR') : 'Bugün'}
                              </span>
                            </div>
                            <div className="text-slate-400 text-[11px] mt-0.5">
                              Doğru: <strong className="text-emerald-400">{sub.correct_count}</strong> | Yanlış: <strong className="text-red-400">{sub.incorrect_count}</strong> | Boş: <strong className="text-slate-300">{sub.empty_count}</strong>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            <div className="text-right">
                              <span className="text-sm font-black text-emerald-400">{sub.net_count}</span>
                              <span className="text-[10px] text-slate-400 ml-1">Net</span>
                            </div>

                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                              <FileCheck2 className="w-3 h-3" />
                              <span>Çözümlü PDF Açık</span>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Critical deficiencies list */}
                <div>
                  <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    En Kritik Kazanım Eksikleri & Telafi İhtiyaçları
                  </div>
                  <div className="space-y-2">
                    {deficiencies.map(d => (
                      <div key={d.id} className="p-3 rounded-xl bg-slate-900/80 border border-amber-500/20 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-semibold text-white flex items-center gap-2">
                            <span>[{d.subjectName}] {d.topicName}</span>
                            <span className="text-[10px] text-amber-300 bg-amber-500/20 px-1.5 py-0.2 rounded">
                              {d.severity}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{d.identifiedReason}</div>
                        </div>

                        {!d.autoTaskCreated ? (
                          <button
                            onClick={() => handleAutoCompensate(d)}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-semibold text-xs whitespace-nowrap"
                          >
                            Telafi Görevi Ata
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Takvimde Atandı
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Counselor recommendations */}
                <div>
                  <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    Danışmana Özel Pedagojik Öneriler
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {aiReport.pedagogicalRecommendations.map((rec, i) => (
                      <li key={i} className="flex items-start space-x-2">
                        <span className="text-indigo-400 font-bold">&bull;</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
          )}

        </div>

        {/* Profil Resmi Değiştirme Modalı */}
        <AvatarUploadModal
          isOpen={isAvatarModalOpen}
          user={student}
          onClose={() => setIsAvatarModalOpen(false)}
          onSuccess={() => {
            onRefreshData();
          }}
        />

        {/* Danışman Tarafından Açılan 12 Soruluk AI Testi */}
        {isAiQuizModalOpen && (
          <TestSolverModal
            isOpen={isAiQuizModalOpen}
            topicName={selectedQuizTopic}
            studentId={student.id}
            studentName={student.name}
            onClose={() => setIsAiQuizModalOpen(false)}
            onFinishedTest={() => {
              onRefreshData();
            }}
          />
        )}

        {/* Haftalık Otomatik Veli WhatsApp / PDF Raporlayıcısı Modalı */}
        <ParentReportModal
          isOpen={isParentReportModalOpen}
          student={student}
          onClose={() => setIsParentReportModalOpen(false)}
          onRefreshStudentData={() => {
            onRefreshData();
          }}
        />

        {/* MEB Müfredatı & ÖSYM Soru Bankası Modalı */}
        <QuestionBankModal
          isOpen={isQuestionBankOpen}
          onClose={() => setIsQuestionBankOpen(false)}
          studentId={student.id}
          studentName={student.name}
          onLaunchLiveTest={topicName => {
            setIsQuestionBankOpen(false);
            handleLaunchQuizForStudent(topicName);
          }}
          onRefreshData={onRefreshData}
        />

      </div>
    </div>
  );
};
