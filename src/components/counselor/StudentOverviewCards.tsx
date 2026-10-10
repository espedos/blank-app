'use client';

import React, { useState } from 'react';
import { User, StudentScoreProfile, ExamResult } from '@/types';
import { getCountdown } from '@/lib/scoreCalculator';
import { AvatarUploadModal } from '../AvatarUploadModal';
import { 
  Award, 
  CheckCircle2, 
  TrendingUp, 
  AlertCircle, 
  Calendar, 
  ArrowUpRight, 
  ChevronRight,
  BookOpen,
  Brain,
  Camera,
  MessageSquare
} from 'lucide-react';
import { ParentReportModal } from '../ParentReportModal';

interface StudentOverviewProps {
  students: {
    student: User;
    scoreProfile: StudentScoreProfile;
    completedTasksCount: number;
    totalTasksCount: number;
    latestExam: ExamResult | null;
    activeDeficienciesCount: number;
  }[];
  onSelectStudent: (student: User) => void;
  onRefreshAll?: () => void;
}

export const StudentOverviewCards: React.FC<StudentOverviewProps> = ({
  students,
  onSelectStudent,
  onRefreshAll
}) => {
  const [avatarTargetStudent, setAvatarTargetStudent] = useState<User | null>(null);
  const [parentReportTargetStudent, setParentReportTargetStudent] = useState<User | null>(null);
  const countdown = getCountdown();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {students.map(({ student, scoreProfile, completedTasksCount, totalTasksCount, latestExam, activeDeficienciesCount }) => {
        const isGrade12 = student.grade === '12';

        return (
          <div
            key={student.id}
            className="group relative rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 p-6 sm:p-7 shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col justify-between"
          >
            {/* Ambient subtle glow */}
            <div className={`absolute top-0 right-0 w-44 h-44 rounded-full blur-3xl pointer-events-none transition ${
              isGrade12 ? 'bg-indigo-500/10 group-hover:bg-indigo-500/20' : 'bg-emerald-500/10 group-hover:bg-emerald-500/20'
            }`} />

            <div>
              {/* Header: Student Info & Badges */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center space-x-3.5">
                  <div 
                    className="relative group/avatar cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAvatarTargetStudent(student);
                    }}
                    title="Öğrencinin profil resmini değiştirmek için tıklayın"
                  >
                    <img
                      src={student.avatar}
                      alt={student.name}
                      className="w-14 h-14 rounded-2xl object-cover ring-2 ring-indigo-500/30 shadow-md group-hover/avatar:ring-indigo-400 group-hover/avatar:scale-105 transition"
                    />
                    <div className="absolute inset-0 rounded-2xl flex items-center justify-center bg-black/60 opacity-0 group-hover/avatar:opacity-100 transition">
                      <Camera className="w-5 h-5 text-white" />
                    </div>
                    <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-indigo-600 text-white shadow">
                      {isGrade12 ? '12. Sınıf' : 'Mezun'}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-xl font-bold text-white group-hover:text-indigo-200 transition">
                        {student.name}
                      </h3>
                      <span className="text-xs text-slate-400 font-mono">@{student.username.split('.')[0]}</span>
                    </div>
                    <p className="text-xs text-slate-400">YKS 2027 Hedef: Sayısal İlk 5.000</p>
                  </div>
                </div>

                {/* Overall Score Badge (100 üzerinden) */}
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Genel Skor</div>
                  <div className="flex items-baseline space-x-0.5 justify-end">
                    <span className="text-3xl font-black bg-gradient-to-r from-indigo-400 to-cyan-300 bg-clip-text text-transparent">
                      {scoreProfile.overallScore}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">/100</span>
                  </div>
                </div>
              </div>

              {/* ŞARTNAME AŞAMA 2: 3 TEMEL DANIŞMAN GÖSTERGESİ */}
              <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-indigo-500/30 mb-4 shadow-inner">
                {/* 1. Genel Skor */}
                <div className="text-center border-r border-slate-800 pr-1">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Genel Skor</div>
                  <div className="flex items-baseline justify-center gap-0.5 mt-0.5">
                    <span className="text-xl font-black bg-gradient-to-r from-indigo-400 to-cyan-300 bg-clip-text text-transparent">
                      {scoreProfile.overallScore}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">/100</span>
                  </div>
                </div>

                {/* 2. Son Deneme Puanı */}
                <div className="text-center border-r border-slate-800 px-1">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Son Deneme</div>
                  <div className="mt-0.5">
                    {latestExam ? (
                      <span className="text-sm font-black font-mono text-cyan-300">
                        {latestExam.simulated_score || latestExam.estimatedOsymScore} <span className="text-[10px] font-normal text-cyan-400">P</span>
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500 font-mono">-</span>
                    )}
                  </div>
                </div>

                {/* 3. En Çok Zorlandığı Branş */}
                <div className="text-center pl-1">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-rose-400">En Çok Zorlandığı</div>
                  <div className="mt-0.5 truncate" title={scoreProfile.weakestSubject?.name}>
                    <span className="text-xs font-bold text-rose-300 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                      {scoreProfile.weakestSubject ? `${scoreProfile.weakestSubject.name} (%${scoreProfile.weakestSubject.percentage})` : 'Fizik (%58)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Formula Breakdown Pills (%30 + %25 + %35 + %10) */}
              <div className="grid grid-cols-4 gap-2 py-2 px-3 rounded-xl bg-slate-950/60 border border-slate-800/80 mb-5 text-center">
                <div>
                  <div className="text-[9px] text-slate-400 font-medium truncate">Plan Sadakati (%30)</div>
                  <div className="text-xs font-bold text-indigo-300">%{scoreProfile.planFidelity}</div>
                </div>
                <div>
                  <div className="text-[9px] text-slate-400 font-medium truncate">Test & Tarama (%25)</div>
                  <div className="text-xs font-bold text-cyan-300">%{scoreProfile.testSuccess}</div>
                </div>
                <div>
                  <div className="text-[9px] text-slate-400 font-medium truncate">Son 4 Deneme (%35)</div>
                  <div className="text-xs font-bold text-emerald-300">%{scoreProfile.trialAverage}</div>
                </div>
                <div>
                  <div className="text-[9px] text-slate-400 font-medium truncate">AI Eksik Hızı (%10)</div>
                  <div className="text-xs font-bold text-amber-300">%{scoreProfile.aiDeficiencySpeed}</div>
                </div>
              </div>

              {/* Progress & Countdown Bar */}
              <div className="space-y-4 mb-5">
                <div>
                  <div className="flex items-center justify-between text-xs font-medium mb-1.5">
                    <span className="text-slate-300 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                      Genel Müfredat Tamamlama
                    </span>
                    <span className="text-indigo-400 font-bold">{scoreProfile.curriculumCompletionRate}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-indigo-400 to-cyan-400 transition-all duration-500 shadow-sm"
                      style={{ width: `${scoreProfile.curriculumCompletionRate}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                    <span>Tamamlanan Müfredat</span>
                    <span>Hedef: 5 Haziran 2027 (%100 Bitiş)</span>
                  </div>
                </div>

                {/* Sub metrics: Tasks and Exams */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                    <div className="text-slate-400 text-[11px] mb-0.5 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Haftalık Görevler
                    </div>
                    <div className="font-semibold text-white">
                      {completedTasksCount} / {totalTasksCount} tamamlandı
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-slate-400 flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                        Son Deneme / Analiz
                      </span>
                      {latestExam && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          {latestExam.estimatedOsymScore} Puan
                        </span>
                      )}
                    </div>
                    {latestExam ? (
                      <div>
                        <div className="flex items-baseline justify-between">
                          <span className="font-bold text-white text-xs">
                            {latestExam.totalNet} Net ({latestExam.examType})
                          </span>
                          <span className="font-mono text-emerald-400 text-xs font-bold">
                            %{latestExam.overallSuccessPercentage.toFixed(1)} Başarı
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5 flex items-center gap-1.5">
                          <span>{latestExam.institution_name || latestExam.publisher_name || latestExam.title}</span>
                          {latestExam.ranking && (
                            <span className="text-amber-300 font-semibold font-mono">#{latestExam.ranking}</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-slate-500 text-xs">Henüz girilmedi</div>
                    )}
                  </div>
                </div>

                {/* AI Deficiencies warning if any */}
                {activeDeficienciesCount > 0 && (
                  <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <span className="font-medium">
                        {activeDeficienciesCount} adet telafi bekleyen kritik eksik konu!
                      </span>
                    </div>
                    <span className="text-[10px] font-bold uppercase bg-amber-500/20 px-2 py-0.5 rounded">
                      Müdahale Et
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons: Opens detailed modal & Veli WhatsApp Raporu */}
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={() => onSelectStudent(student)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-indigo-600 border border-slate-700 hover:border-indigo-500 text-slate-200 hover:text-white font-semibold text-xs transition duration-200 flex items-center justify-center space-x-1.5 shadow-md"
              >
                <span>Detaylı Yönetim</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setParentReportTargetStudent(student);
                }}
                className="py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-bold text-xs transition shadow-md flex items-center space-x-1.5"
                title="Veliye WhatsApp raporu gönder veya PDF karnesi oluştur"
              >
                <MessageSquare className="w-4 h-4" />
                <span>📱 Veli Raporu</span>
              </button>
            </div>
          </div>
        );
      })}

      {avatarTargetStudent && (
        <AvatarUploadModal
          isOpen={!!avatarTargetStudent}
          user={avatarTargetStudent}
          onClose={() => setAvatarTargetStudent(null)}
          onSuccess={() => {
            if (onRefreshAll) onRefreshAll();
          }}
        />
      )}

      {parentReportTargetStudent && (
        <ParentReportModal
          isOpen={!!parentReportTargetStudent}
          student={parentReportTargetStudent}
          onClose={() => setParentReportTargetStudent(null)}
          onRefreshStudentData={() => {
            if (onRefreshAll) onRefreshAll();
          }}
        />
      )}
    </div>
  );
};
