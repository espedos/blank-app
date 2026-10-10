'use client';

import React, { useState } from 'react';
import { User } from '@/types';
import { StorageService } from '@/lib/storage';
import { StudentOverviewCards } from './StudentOverviewCards';
import { StudentDetailModal } from './StudentDetailModal';
import { UploadExamModal } from '../UploadExamModal';
import { AvatarUploadModal } from '../AvatarUploadModal';
import { WeeklyHourlyCalendar } from '../student/WeeklyHourlyCalendar';
import { ExemptionApprovalPanel } from './ExemptionApprovalPanel';
import { ResetProgressModal } from './ResetProgressModal';
import { ArchiveStudentModal } from './ArchiveStudentModal';
import { CreateStudentModal } from './CreateStudentModal';
import { QuestionBankModal } from '../QuestionBankModal';
import { 
  Users, 
  Upload, 
  BookOpen, 
  Sparkles, 
  FileText, 
  FolderPlus,
  Shield,
  Layers,
  ArrowRight,
  Camera,
  Calendar,
  Archive,
  RotateCcw,
  Trash2,
  ArchiveRestore,
  UserPlus,
  Key,
  Copy,
  Check,
  UserCheck,
  Brain,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { UserProfileView } from '../profile/UserProfileView';
import { AiQuestionBankManager } from './AiQuestionBankManager';

interface CounselorDashboardProps {
  counselor: User;
  allUsers: User[];
  onRefreshAll: () => void;
}

export const CounselorDashboard: React.FC<CounselorDashboardProps> = ({
  counselor,
  allUsers,
  onRefreshAll
}) => {
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'STUDENTS' | 'CALENDAR' | 'LIBRARY' | 'EXEMPTIONS' | 'QUESTION_BANK'>('PROFILE');
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [calendarStudentId, setCalendarStudentId] = useState<string>('student-1');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [libraryFilter, setLibraryFilter] = useState<'ALL' | 'PDF' | 'IMAGE' | 'CRITICAL_TEST'>('ALL');
  const [studentTab, setStudentTab] = useState<'active' | 'archived'>('active');
  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<{ student: User; mode: 'archive' | 'delete' } | null>(null);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [isQuestionBankOpen, setIsQuestionBankOpen] = useState(false);
  const [copiedPasswordId, setCopiedPasswordId] = useState<string | null>(null);

  // Load students data
  const allStudents = allUsers.filter(u => u.role === 'STUDENT');
  const activeStudents = allStudents.filter(u => !u.is_archived);
  const archivedStudents = allStudents.filter(u => u.is_archived);
  const students = studentTab === 'active' ? activeStudents : archivedStudents;
  const currentCalendarTasks = StorageService.getTasks(calendarStudentId);
  const studentDataList = activeStudents.map(student => {
    const scoreProfile = StorageService.getStudentScoreProfile(student.id);
    const tasks = StorageService.getTasks(student.id);
    const exams = StorageService.getExams(student.id);
    const deficiencies = StorageService.getDeficiencies(student.id).filter(d => !d.isResolved);

    return {
      student,
      scoreProfile,
      totalTasksCount: tasks.length,
      completedTasksCount: tasks.filter(t => t.isCompleted).length,
      latestExam: exams[0] || null,
      activeDeficienciesCount: deficiencies.length
    };
  });

  const libraryResources = StorageService.getLibraryResources();
  const filteredLibrary = libraryFilter === 'ALL' 
    ? libraryResources 
    : libraryResources.filter(r => r.type === libraryFilter);

  const counselorAlerts = StorageService.getCounselorAlerts();
  const pendingApprovals = StorageService.getCalendarApprovalRequests().filter(r => r.status === 'PENDING');

  const handleApproveCalendarChange = (requestId: string) => {
    StorageService.updateCalendarApprovalStatus(requestId, 'APPROVED', counselor.name);
    onRefreshAll();
  };

  const handleRejectCalendarChange = (requestId: string) => {
    StorageService.updateCalendarApprovalStatus(requestId, 'REJECTED', counselor.name);
    onRefreshAll();
  };

  const handleDismissAlert = (alertId: string) => {
    StorageService.dismissCounselorAlert(alertId);
    onRefreshAll();
  };

  return (
    <div className="space-y-8">

      {/* Main Top Navigation Tabs (Pills - Görsel 1 Mantığı) */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 border-b border-slate-800">
        {[
          { id: 'PROFILE', label: 'Danışman Profili & Komuta Hub', icon: Shield },
          { id: 'STUDENTS', label: 'Öğrenci Yönetim Merkezi', icon: Users },
          { id: 'CALENDAR', label: `Haftalık Takvim${pendingApprovals.length > 0 ? ` (${pendingApprovals.length} Onay)` : ''}`, icon: Calendar },
          { id: 'QUESTION_BANK', label: 'AI Soru Havuzu & Ödevler', icon: Brain },
          { id: 'LIBRARY', label: 'Merkezi Kütüphane & Kaynaklar', icon: BookOpen },
          { id: 'EXEMPTIONS', label: 'Muafiyet Onay Masası', icon: FileText }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition border ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.id === 'CALENDAR' && pendingApprovals.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse ml-1" />
              )}
            </button>
          );
        })}
      </div>

      {/* Profil Görünümü (Varsayılan Açılış Ekranı - Görsel 1 & Görsel 2) */}
      {activeTab === 'PROFILE' && (
        <UserProfileView
          user={counselor}
          onNavigateToTab={(tabId) => {
            if (tabId === 'STUDENTS') setActiveTab('STUDENTS');
            else if (tabId === 'CALENDAR') setActiveTab('CALENDAR');
            else if (tabId === 'LIBRARY') setActiveTab('LIBRARY');
            else setActiveTab('STUDENTS');
          }}
          onOpenAddStudent={() => setIsAddStudentModalOpen(true)}
          onOpenAvatarModal={() => setIsAvatarModalOpen(true)}
          onProfileUpdated={onRefreshAll}
        />
      )}

      {/* Diğer Sekmelerde Gösterilecek Danışman Modülleri */}
      {activeTab !== 'PROFILE' && (
        <>
          {/* Şartname 7.A: Otomatik Yeniden Planlama Danışman Uyarıları */}
          {counselorAlerts.length > 0 && (
            <div className="space-y-2">
              {counselorAlerts.map(alert => (
                <div
                  key={alert.id}
                  className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-amber-500/5"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 flex-shrink-0 animate-pulse">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-amber-300 flex items-center gap-2">
                        <span>⚠️ Şartname 7.A: Görev Zamanında Tamamlanmadı & Telafi Bloğuna Taşındı</span>
                        <span className="text-[10px] bg-amber-500/30 text-amber-200 px-2 py-0.2 rounded font-mono">
                          {alert.studentName}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">
                        {alert.message}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-end sm:self-center">
                    <button
                      onClick={() => {
                        const st = students.find(s => s.id === alert.studentId);
                        if (st) {
                          setSelectedStudent(st);
                          setActiveTab('CALENDAR');
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
                    >
                      Öğrenci Takvimini Aç
                    </button>
                    <button
                      onClick={() => handleDismissAlert(alert.id)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs transition"
                    >
                      Kapat
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Consultant Welcome & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
            <div className="flex items-center space-x-4">
              <div 
                className="relative group cursor-pointer"
                onClick={() => setIsAvatarModalOpen(true)}
                title="Danışman profil resmini değiştirmek için tıklayın"
              >
                <img
                  src={counselor.avatar}
                  alt={counselor.name}
                  className="w-14 h-14 rounded-2xl object-cover ring-2 ring-indigo-500/40 shadow-lg group-hover:ring-indigo-400 group-hover:scale-105 transition"
                />
                <div className="absolute inset-0 rounded-2xl flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition">
                  <Camera className="w-5 h-5 text-white" />
                </div>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-white">{counselor.name}</h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5" /> Danışman Yönetici
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Barış Deniz (12. Sınıf) ve Efe Deniz (Mezun) YKS 2027 Koçluk & Müdahale Merkezi
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsAddStudentModalOpen(true)}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs transition shadow-lg shadow-emerald-600/25 active:scale-95"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Yeni Öğrenci Ekle</span>
              </button>
              <button
                onClick={() => setIsQuestionBankOpen(true)}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white font-bold text-xs transition shadow-lg shadow-purple-600/25"
                title="Tüm MEB müfredatı ve ÖSYM soru tiplerini çoklu çözümleriyle incele"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>📚 ÖSYM Soru Bankası</span>
              </button>

              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold text-xs transition shadow-lg shadow-indigo-600/25"
              >
                <Upload className="w-4 h-4" />
                <span>Soru & Deneme / Optik Yükle</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* 1. ÖĞRENCİ YÖNETİM MERKEZİ SEKME GÖRÜNÜMÜ */}
      {activeTab === 'STUDENTS' && (
        <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              Öğrenci Yönetim Merkezi
            </h2>
            <p className="text-xs text-slate-400">100 üzerinden Genel Skor, Plan Sadakati ve Müfredat Tamamlama Durumları</p>
          </div>
          {/* Tab toggle */}
          <div className="flex items-center gap-2 bg-slate-900 rounded-xl p-1 border border-slate-800">
            <button
              onClick={() => setStudentTab('active')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${studentTab === 'active' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Aktif ({activeStudents.length})
            </button>
            <button
              onClick={() => setStudentTab('archived')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${studentTab === 'archived' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <Archive className="w-3.5 h-3.5" /> Arşivlenen ({archivedStudents.length})
            </button>
          </div>
        </div>

        {/* Active students */}
        {studentTab === 'active' && (
          <div className="space-y-3">
            <StudentOverviewCards
              students={studentDataList}
              onSelectStudent={student => setSelectedStudent(student)}
              onRefreshAll={onRefreshAll}
            />
            {/* Per-student management actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              {activeStudents.map(st => {
                const rawFirst = st.first_name || st.name.split(' ')[0] || '';
                const cleanFirst = rawFirst.charAt(0).toLocaleUpperCase('tr-TR') + rawFirst.slice(1);
                const password = st.plain_password_display || `${cleanFirst}.123*`;
                const isSelectedForCalendar = calendarStudentId === st.id;

                const copyPassword = (e: React.MouseEvent) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(password);
                  setCopiedPasswordId(st.id);
                  setTimeout(() => setCopiedPasswordId(null), 2500);
                };

                return (
                  <div 
                    key={st.id} 
                    className={`p-4 rounded-2xl bg-slate-900 border transition ${
                      isSelectedForCalendar ? 'border-indigo-500 shadow-md shadow-indigo-500/10' : 'border-slate-800 hover:border-slate-700'
                    } flex flex-col sm:flex-row sm:items-center justify-between gap-3`}
                  >
                    <div className="flex items-center gap-3">
                      <img src={st.avatar} alt={st.name} className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-700" />
                      <div>
                        <div className="font-semibold text-white text-sm flex items-center gap-2">
                          <span>{st.name}</span>
                          {st.field_type && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                              {st.field_type}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                          <span>{st.education_level ? `${st.education_level}` : (st.grade === '12' ? '12. Sınıf' : 'Mezun')}</span>
                          <span>•</span>
                          {/* Şifre Rozeti */}
                          <div 
                            onClick={copyPassword}
                            title="Şifreyi panoya kopyala"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-mono cursor-pointer hover:bg-emerald-500/20 transition"
                          >
                            <Key className="w-3 h-3 text-emerald-400" />
                            <span>{password}</span>
                            {copiedPasswordId === st.id ? (
                              <Check className="w-3 h-3 text-emerald-300 ml-0.5" />
                            ) : (
                              <Copy className="w-3 h-3 text-emerald-500/80 ml-0.5" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-center">
                      <button
                        onClick={() => {
                          setCalendarStudentId(st.id);
                          const el = document.getElementById('counselor-calendar-section');
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition ${
                          isSelectedForCalendar 
                            ? 'bg-indigo-600 text-white' 
                            : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                        }`}
                        title="Takvimini Görüntüle"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Takvim</span>
                      </button>
                      <button
                        onClick={() => setResetTarget(st)}
                        title="Gelişimi Sıfırla"
                        className="p-2 rounded-xl bg-slate-800 hover:bg-amber-600/20 hover:text-amber-400 text-slate-400 transition text-xs flex items-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Sıfırla</span>
                      </button>
                      <button
                        onClick={() => setArchiveTarget({ student: st, mode: 'archive' })}
                        title="Arşivle"
                        className="p-2 rounded-xl bg-slate-800 hover:bg-amber-600/20 hover:text-amber-400 text-slate-400 transition text-xs flex items-center gap-1"
                      >
                        <Archive className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Arşivle</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Archived students */}
        {studentTab === 'archived' && (
          <div className="space-y-3">
            {archivedStudents.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 text-center text-slate-500 text-sm">
                Arşivlenmiş öğrenci yok.
              </div>
            ) : (
              archivedStudents.map(st => (
                <div key={st.id} className="p-4 rounded-2xl bg-slate-900 border border-amber-500/20 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img src={st.avatar} alt={st.name} className="w-9 h-9 rounded-xl object-cover opacity-50" />
                      <div className="absolute inset-0 rounded-xl bg-amber-900/40 flex items-center justify-center">
                        <Archive className="w-3.5 h-3.5 text-amber-400" />
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-slate-300 text-sm">{st.name}</div>
                      <span className="text-xs text-amber-400 font-medium">Arşivlendi · Giriş engelli</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { StorageService.unarchiveStudent(st.id); onRefreshAll(); }}
                      title="Arşivden Çıkar"
                      className="p-2 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/30 text-emerald-400 transition text-xs flex items-center gap-1"
                    >
                      <ArchiveRestore className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Geri Al</span>
                    </button>
                    <button
                      onClick={() => setArchiveTarget({ student: st, mode: 'delete' })}
                      title="Kalıcı Sil"
                      className="p-2 rounded-xl bg-rose-600/15 hover:bg-rose-600/30 text-rose-400 transition text-xs flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Kalıcı Sil</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      )}

      {/* 2. MUAFİYET ONAY MASASI SEKME GÖRÜNÜMÜ */}
      {activeTab === 'EXEMPTIONS' && (
        <ExemptionApprovalPanel onRefreshData={onRefreshAll} />
      )}

      {/* 3. DİNAMİK TAKVİM VE GÖREV MOTORU SEKME GÖRÜNÜMÜ */}
      {activeTab === 'CALENDAR' && (
        <div id="counselor-calendar-section" className="space-y-4">
          {/* Onay Bekleyen Öğrenci Takvim Değişiklikleri Bildirimi */}
          {pendingApprovals.length > 0 && (
            <div className="p-5 rounded-3xl bg-amber-950/30 border border-amber-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-amber-300 font-bold text-sm">
                  <Clock className="w-5 h-5 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
                  <span>Onay Bekleyen Öğrenci Takvim Değişiklikleri ({pendingApprovals.length})</span>
                </div>
                <span className="text-xs text-amber-400/80">Öğrencinin yaptığı güncellemeler onayınızla geçerli olur</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {pendingApprovals.map(req => (
                  <div key={req.id} className="p-3.5 rounded-2xl bg-slate-900/90 border border-amber-500/20 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                        <span>{req.studentName}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold">{req.taskTitle}</span>
                      </div>
                      <div className="text-[11px] text-slate-300 mt-1">
                        Eski: <span className="line-through text-slate-400">{req.previousSlot?.day || req.oldDate} {req.previousSlot?.time || req.oldStartTime}</span> &rarr; Yeni: <span className="text-amber-300 font-bold">{req.proposedSlot?.day || req.newDate} {req.proposedSlot?.time || req.newStartTime}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1.5 flex-shrink-0">
                      <button
                        onClick={() => handleApproveCalendarChange(req.id)}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1 transition shadow"
                        title="Değişikliği Onayla"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Onayla</span>
                      </button>
                      <button
                        onClick={() => handleRejectCalendarChange(req.id)}
                        className="px-2.5 py-1.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-bold flex items-center space-x-1 transition shadow"
                        title="Reddet & Eski Konuma Geri Al"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reddet</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-400" />
                Dinamik Haftalık Takvim ve Müdahale Masası
              </h2>
              <p className="text-xs text-slate-400">
                Tüm öğrenciler için haftalık saatlik çalışma blokları. Görevleri sürükleyip bırakarak yeniden planlayabilir veya yeni görevler ekleyebilirsiniz.
              </p>
            </div>
          </div>

          <WeeklyHourlyCalendar
            studentId={calendarStudentId}
            tasks={currentCalendarTasks}
            onTasksUpdated={onRefreshAll}
            onOpenCriticalTest={(topic) => alert(`${topic} konusu için 12 kritik soru testi.`)}
            isCounselor={true}
            selectedStudentId={calendarStudentId}
            onSelectStudent={(id) => setCalendarStudentId(id)}
            availableStudents={activeStudents}
          />
        </div>
      )}

      {/* 4. AI SORU HAVUZU & ÖZEL ÖDEV / DENEME MERKEZİ */}
      {activeTab === 'QUESTION_BANK' && (
        <AiQuestionBankManager
          counselor={counselor}
          students={activeStudents}
          onAssignmentCreated={onRefreshAll}
        />
      )}

      {/* 4. DANIŞMAN KÜTÜPHANESİ & DOKÜMAN YÖNETİMİ SEKME GÖRÜNÜMÜ */}
      {activeTab === 'LIBRARY' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-cyan-400" />
                Merkezi Kütüphane & Doküman Havuzu
              </h2>
              <p className="text-xs text-slate-400">Tüm öğrencilere açık PDF testler, geçmiş taramalar ve optik cevap anahtarları</p>
            </div>

            <div className="flex items-center space-x-2">
              {(['ALL', 'PDF', 'IMAGE', 'CRITICAL_TEST'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setLibraryFilter(type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    libraryFilter === type
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {type === 'ALL' ? 'Tümü' : type}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredLibrary.map(item => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-3 rounded-xl bg-slate-800 text-indigo-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-white truncate max-w-[280px]">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {item.subjectName} &bull; {item.sizeMb} MB &bull; Yükleyen: {item.uploadedBy}
                    </div>
                    {item.hasAnswerKey && (
                      <span className="inline-block mt-1 text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        Optik Cevap Anahtarı Tanımlı
                      </span>
                    )}
                  </div>
                </div>

                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-xl bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white transition text-xs flex-shrink-0"
                  title="Görüntüle / İndir"
                >
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Student Detail Modal */}
      {selectedStudent && (
        <StudentDetailModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
          onOpenUploadExam={() => setIsUploadModalOpen(true)}
          onRefreshData={onRefreshAll}
        />
      )}

      {/* Upload Exam / Questions Modal */}
      {isUploadModalOpen && (
        <UploadExamModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onSuccess={() => {
            setIsUploadModalOpen(false);
            onRefreshAll();
          }}
          students={activeStudents}
        />
      )}

      {/* Counselor Avatar Upload Modal */}
      <AvatarUploadModal
        isOpen={isAvatarModalOpen}
        user={counselor}
        onClose={() => setIsAvatarModalOpen(false)}
        onSuccess={() => {
          onRefreshAll();
        }}
      />

      {/* Reset Progress Modal (3-stage) */}
      {resetTarget && (
        <ResetProgressModal
          student={resetTarget}
          onClose={() => setResetTarget(null)}
          onSuccess={() => { setResetTarget(null); onRefreshAll(); }}
        />
      )}

      {/* Archive / Delete Student Modal */}
      {archiveTarget && (
        <ArchiveStudentModal
          student={archiveTarget.student}
          mode={archiveTarget.mode}
          onClose={() => setArchiveTarget(null)}
          onSuccess={() => { setArchiveTarget(null); onRefreshAll(); }}
        />
      )}

      {/* Create Student Wizard Modal */}
      {isAddStudentModalOpen && (
        <CreateStudentModal
          isOpen={isAddStudentModalOpen}
          onClose={() => setIsAddStudentModalOpen(false)}
          onSuccess={(newStudent) => {
            setIsAddStudentModalOpen(false);
            onRefreshAll();
            setCalendarStudentId(newStudent.id);
          }}
        />
      )}

      {/* MEB Müfredatı & ÖSYM Soru Bankası Modalı */}
      <QuestionBankModal
        isOpen={isQuestionBankOpen}
        onClose={() => setIsQuestionBankOpen(false)}
        studentId={selectedStudent?.id || 'student-1'}
        studentName={selectedStudent?.name || 'Öğrenci'}
        onLaunchLiveTest={topicName => {
          setIsQuestionBankOpen(false);
          const st = selectedStudent || students[0];
          if (st) {
            setSelectedStudent(st);
          }
        }}
        onRefreshData={onRefreshAll}
      />
    </div>
  );
};
