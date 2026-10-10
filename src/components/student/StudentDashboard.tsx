'use client';

import React, { useState } from 'react';
import { User, HourlyTask, ExamResult, StudentScoreProfile } from '@/types';
import { StorageService } from '@/lib/storage';
import { CountdownBanner } from '../CountdownBanner';
import { WeeklyHourlyCalendar } from './WeeklyHourlyCalendar';
import { StudyCycleWorkflow } from './StudyCycleWorkflow';
import { AnalyticsCharts } from './AnalyticsCharts';
import { ProgressTopicTree } from './ProgressTopicTree';
import { TopicMasteryMatrix } from './TopicMasteryMatrix';
import { DigitalLibrary } from './DigitalLibrary';
import { DeficiencyAlertBanner } from './DeficiencyAlertBanner';
import { TestSolverModal } from '../TestSolverModal';
import { AvatarUploadModal } from '../AvatarUploadModal';
import { UploadExamModal } from '../UploadExamModal';
import { 
  Calendar, 
  RotateCw, 
  TrendingUp, 
  ListTree, 
  BookOpen, 
  Sparkles, 
  CheckCircle2, 
  Brain,
  Award,
  Camera,
  Plus,
  Upload,
  UserCheck,
  MessageSquare
} from 'lucide-react';
import { UserProfileView } from '../profile/UserProfileView';
import { ParentReportModal } from '../ParentReportModal';
import { QuestionBankModal } from '../QuestionBankModal';

interface StudentDashboardProps {
  student: User;
  onRefreshAll: () => void;
  onOpenSocialChatWithSnapshot?: (snapshot: any) => void;
  activeTab?: 'PROFILE' | 'CALENDAR' | 'CYCLE' | 'ANALYTICS' | 'TREE' | 'LIBRARY';
  onTabChange?: (tab: 'PROFILE' | 'CALENDAR' | 'CYCLE' | 'ANALYTICS' | 'TREE' | 'LIBRARY') => void;
  externalTestTopic?: string | null;
  onClearExternalTestTopic?: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  student,
  onRefreshAll,
  onOpenSocialChatWithSnapshot,
  activeTab: controlledActiveTab,
  onTabChange,
  externalTestTopic,
  onClearExternalTestTopic
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState<'PROFILE' | 'CALENDAR' | 'CYCLE' | 'ANALYTICS' | 'TREE' | 'LIBRARY'>('PROFILE');
  const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab;
  const setActiveTab = (tab: 'PROFILE' | 'CALENDAR' | 'CYCLE' | 'ANALYTICS' | 'TREE' | 'LIBRARY') => {
    if (onTabChange) onTabChange(tab);
    setInternalActiveTab(tab);
  };

  const [isTestSolverOpen, setIsTestSolverOpen] = useState(false);
  const [activeTestTopic, setActiveTestTopic] = useState('Newton Yasaları ve Dinamik');
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isUploadExamOpen, setIsUploadExamOpen] = useState(false);
  const [isParentReportOpen, setIsParentReportOpen] = useState(false);
  const [isQuestionBankOpen, setIsQuestionBankOpen] = useState(false);

  // External test trigger from AI coach or guide
  React.useEffect(() => {
    if (externalTestTopic) {
      setActiveTestTopic(externalTestTopic);
      setIsTestSolverOpen(true);
      onClearExternalTestTopic?.();
    }
  }, [externalTestTopic, onClearExternalTestTopic]);

  // Load student-specific data
  const tasks = StorageService.getTasks(student.id);
  const exams = StorageService.getExams(student.id);
  const deficiencies = StorageService.getDeficiencies(student.id);
  const criticalDeficits = StorageService.getStudentCriticalDeficits(student.id);
  const scoreProfile = StorageService.getStudentScoreProfile(student.id);
  const latestWeeklyReport = StorageService.getLatestWeeklyReport(student.id);

  const handleOpenCriticalTest = (topic?: string) => {
    setActiveTestTopic(topic || 'Newton Yasaları ve Dinamik');
    setIsTestSolverOpen(true);
  };

  const handleTestFinished = (net: number, successRate: number) => {
    onRefreshAll();
  };

  const handleShareSnapshot = (snapshot: any) => {
    if (onOpenSocialChatWithSnapshot) {
      onOpenSocialChatWithSnapshot(snapshot);
    }
  };

  return (
    <div className="space-y-6">

      {/* Main Top Navigation Tabs (Pills - Görsel 1 Mantığı) */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 border-b border-slate-800">
        {[
          { id: 'PROFILE', label: 'Profilim & Ana Hub', icon: UserCheck },
          { id: 'CALENDAR', label: 'Saatlik Takvim & Kamplar', icon: Calendar },
          { id: 'ANALYTICS', label: 'Sınav Sonuçları & Netler', icon: TrendingUp },
          { id: 'CYCLE', label: '5 Adımlı Çalışma Döngüsü', icon: RotateCw },
          { id: 'TREE', label: 'Konu Hakimiyet Matrisi', icon: ListTree },
          { id: 'LIBRARY', label: 'Kitaplarım & Kütüphane', icon: BookOpen }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition border ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Profil Görünümü (Varsayılan Açılış Ekranı - Görsel 1 & Görsel 2) */}
      {activeTab === 'PROFILE' && (
        <UserProfileView
          user={student}
          onNavigateToTab={(tabId) => setActiveTab(tabId as any)}
          onOpenTestSolver={handleOpenCriticalTest}
          onOpenChat={() => onOpenSocialChatWithSnapshot?.(null)}
          onOpenAvatarModal={() => setIsAvatarModalOpen(true)}
          onProfileUpdated={onRefreshAll}
        />
      )}

      {/* Çalışma Modüllerine Geçildiğinde Görüntülenecek Başlıklar & Uyarılar */}
      {activeTab !== 'PROFILE' && (
        <>
          {/* 2027 Countdown Banner */}
          <CountdownBanner />

          {/* AI Deficiency & Compensatory Alerts */}
          <DeficiencyAlertBanner
            deficiencies={deficiencies}
            criticalDeficits={criticalDeficits}
            onOpenCalendar={() => setActiveTab('CALENDAR')}
            onOpenTestSolver={topic => handleOpenCriticalTest(topic)}
            onRefresh={onRefreshAll}
          />

          {/* Student Score Header Card */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center space-x-4">
              <div 
                className="relative group cursor-pointer"
                onClick={() => setIsAvatarModalOpen(true)}
                title="Profil resmini değiştirmek için tıklayın"
              >
                <img
                  src={student.avatar}
                  alt={student.name}
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-indigo-500/40 shadow-lg group-hover:ring-indigo-400 group-hover:scale-105 transition"
                />
                <div className="absolute inset-0 rounded-2xl flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-600 text-white shadow">
                  {student.grade === 'MEZUN' ? 'Mezun' : '12. Sınıf'}
                </span>
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl sm:text-2xl font-black text-white">{student.name}</h1>
                  <span className="text-xs text-indigo-300 font-mono bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md">
                    Öğrenci Çalışma Paneli
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Hedef: YKS 2027 Sayısal &bull; Son Güncelleme: Bugün 16:00
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* 100 Üzerinden Genel Öğrenci Skoru Kartı */}
              <div className="student-score-card flex items-center space-x-4 p-3.5 rounded-2xl bg-slate-950/70 border border-indigo-500/30">
                <div className="p-3 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white shadow-md">
                  <Award className="w-6 h-6" />
                </div>

                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    100 Üzerinden Genel Skor
                  </div>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-indigo-300 to-cyan-300 bg-clip-text text-transparent">
                      {scoreProfile.overallScore}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">/100</span>
                  </div>
                </div>

                <div className="hidden sm:block pl-4 border-l border-slate-800 text-[11px] text-slate-400 space-y-0.5">
                  <div>Sadakat: <strong className="text-indigo-300">%{scoreProfile.planFidelity}</strong></div>
                  <div>Deneme: <strong className="text-emerald-400">%{scoreProfile.trialAverage}</strong></div>
                </div>
              </div>

              {/* Sınav / Deneme Ekle Butonu */}
              <button
                onClick={() => setIsUploadExamOpen(true)}
                className="flex items-center space-x-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg transition hover:scale-105 active:scale-95 border border-cyan-500/30"
                title="Yeni Deneme veya Konu Tarama Sonucu Ekle"
              >
                <Upload className="w-4 h-4" />
                <span>+ Sınav / Deneme Ekle</span>
              </button>

              {/* Soru Bankası & Çoklu Çözüm Motoru Butonu */}
              <button
                onClick={() => setIsQuestionBankOpen(true)}
                className="flex items-center space-x-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg transition hover:scale-105 active:scale-95 border border-purple-500/30"
                title="MEB ve ÖSYM soru tiplerini 3 farklı çözüm yoluyla incele"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>📚 Soru Bankası & Çoklu Çözüm</span>
              </button>

              {/* Veli Raporu / Ailemle Paylaş Butonu */}
              <button
                onClick={() => setIsParentReportOpen(true)}
                className="flex items-center space-x-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg transition hover:scale-105 active:scale-95 border border-emerald-500/30"
                title="Haftalık gelişim özetini ve resmi PDF karneni ailenle paylaş"
              >
                <MessageSquare className="w-4 h-4" />
                <span>📱 Ailemle Paylaş (Veli Raporu)</span>
              </button>
            </div>
          </div>

          {/* Öğrenci Haftalık AI Gelişim Karnesi & Koç Tavsiyesi */}
          {latestWeeklyReport && (
            <div className="student-weekly-report-card p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-cyan-950/40 border border-indigo-500/30 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start space-x-3.5 flex-1">
                <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-300 flex-shrink-0 mt-0.5">
                  <Brain className="w-5 h-5 text-cyan-300" />
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center space-x-2 flex-wrap">
                    <span className="text-xs font-black text-cyan-300 uppercase tracking-wide">
                      Haftalık AI Gelişim Raporun
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      ({latestWeeklyReport.report_week_start} - {latestWeeklyReport.report_week_end})
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      Haftalık Skor: {latestWeeklyReport.overall_score}/100
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed font-sans">
                    {latestWeeklyReport.student_facing_tip || latestWeeklyReport.academic_summary}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-center text-xs font-mono text-slate-300 flex-shrink-0 flex-wrap">
                <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  Sadakat: <strong className="text-emerald-400">%{latestWeeklyReport.task_completion_rate || 88}</strong>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  Soru: <strong className="text-cyan-400">{latestWeeklyReport.total_questions_solved || 480}</strong>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  İsabet: <strong className="text-indigo-300">%{latestWeeklyReport.accuracy_rate || 82}</strong>
                </div>
                <button
                  onClick={() => setIsParentReportOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow"
                  title="Veliye WhatsApp gönder veya PDF karnesi aç"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Veli Raporu</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Tab Panels */}
      {activeTab === 'CALENDAR' && (
        <WeeklyHourlyCalendar
          studentId={student.id}
          tasks={tasks}
          onTasksUpdated={onRefreshAll}
          onOpenCriticalTest={handleOpenCriticalTest}
        />
      )}

      {activeTab === 'CYCLE' && (
        <StudyCycleWorkflow
          onStart12CriticalTest={handleOpenCriticalTest}
          onOpenOpticalEntry={() => setIsTestSolverOpen(true)}
        />
      )}

      {activeTab === 'ANALYTICS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
            <div className="text-xs text-slate-300">
              Kayıtlı <strong className="text-indigo-400 font-bold">{exams.length}</strong> deneme ve tarama analiziniz bulunmaktadır.
            </div>
            <button
              onClick={() => setIsUploadExamOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:brightness-110 text-white text-xs font-bold shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Deneme / Tarama Sonucu Gir</span>
            </button>
          </div>

          <AnalyticsCharts
            studentName={student.name}
            exams={exams}
            scoreProfile={scoreProfile}
            onShareWithPeer={handleShareSnapshot}
            student={student}
          />
        </div>
      )}

      {activeTab === 'TREE' && (
        <TopicMasteryMatrix
          studentId={student.id}
          onRefreshData={onRefreshAll}
          onOpenTest={handleOpenCriticalTest}
        />
      )}

      {activeTab === 'LIBRARY' && (
        <DigitalLibrary
          studentId={student.id}
          onOpenTestSolver={handleOpenCriticalTest}
        />
      )}

      {/* 12 Critical Question Solver Modal */}
      {isTestSolverOpen && (
        <TestSolverModal
          isOpen={isTestSolverOpen}
          topicName={activeTestTopic}
          studentId={student.id}
          studentName={student.name}
          onClose={() => setIsTestSolverOpen(false)}
          onFinishedTest={handleTestFinished}
        />
      )}

      {/* Profil Resmi Değiştirme Modalı */}
      <AvatarUploadModal
        isOpen={isAvatarModalOpen}
        user={student}
        onClose={() => setIsAvatarModalOpen(false)}
        onSuccess={() => {
          onRefreshAll();
        }}
      />

      {/* Sınav / Deneme Giriş Modalı */}
      {isUploadExamOpen && (
        <UploadExamModal
          isOpen={isUploadExamOpen}
          onClose={() => setIsUploadExamOpen(false)}
          onSuccess={() => {
            onRefreshAll();
          }}
          students={[student]}
          defaultStudentId={student.id}
        />
      )}

      {/* Haftalık Otomatik Veli WhatsApp / PDF Raporlayıcısı Modalı */}
      <ParentReportModal
        isOpen={isParentReportOpen}
        student={student}
        onClose={() => setIsParentReportOpen(false)}
        onRefreshStudentData={onRefreshAll}
      />

      {/* MEB Müfredatı & ÖSYM Soru Bankası Modalı */}
      <QuestionBankModal
        isOpen={isQuestionBankOpen}
        onClose={() => setIsQuestionBankOpen(false)}
        studentId={student.id}
        studentName={student.name}
        onLaunchLiveTest={topicName => {
          setIsQuestionBankOpen(false);
          handleOpenCriticalTest(topicName);
        }}
        onRefreshData={onRefreshAll}
      />

    </div>
  );
};
