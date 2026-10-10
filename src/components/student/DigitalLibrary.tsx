'use client';

import React, { useState } from 'react';
import { StorageService } from '@/lib/storage';
import { StudentLibraryResource, AiQuizSet, LibraryResourceType } from '@/types';
import { 
  BookOpen, 
  Search, 
  FileText, 
  Download, 
  Sparkles, 
  Filter, 
  CheckCircle2, 
  ExternalLink,
  Video,
  Pin,
  Globe,
  Layers,
  GraduationCap,
  Play,
  Calendar,
  Tag
} from 'lucide-react';
import { QuestionBankModal } from '../QuestionBankModal';

interface DigitalLibraryProps {
  studentId?: string;
  onOpenTestSolver: (topicName: string) => void;
}

export const DigitalLibrary: React.FC<DigitalLibraryProps> = ({ 
  studentId, 
  onOpenTestSolver 
}) => {
  const currentUserId = studentId || StorageService.getCurrentUser()?.id || 'student-1';
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'TYT' | 'AYT_SAYISAL'>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [subjectFilter, setSubjectFilter] = useState<string>('ALL');
  const [isQuestionBankOpen, setIsQuestionBankOpen] = useState(false);

  // Load custom student library resources
  const studentResources = StorageService.getStudentLibraryResources(currentUserId);
  
  // Load AI Quiz sets
  const aiQuizzes = StorageService.getQuizSets(currentUserId);

  // Load legacy library resources
  const legacyResources = StorageService.getLibraryResources();

  // Combine items into a unified library list
  interface UnifiedResourceItem {
    id: string;
    title: string;
    resourceType: 'pdf_test' | 'youtube_link' | 'web_link' | 'mentor_note' | 'ai_quiz';
    category: 'TYT' | 'AYT_SAYISAL' | 'ALL';
    subjectName: string;
    topicName?: string;
    urlOrContent: string;
    creatorName: string;
    createdAt?: string;
    isAiQuiz?: boolean;
    quizQuestionCount?: number;
    hasOpticSolver?: boolean;
  }

  const unifiedList: UnifiedResourceItem[] = [
    // 1. Student Library Resources (Danışman notları, YouTube linkleri, föyler)
    ...studentResources.map(r => ({
      id: r.id,
      title: r.title,
      resourceType: r.resource_type,
      category: r.category || 'ALL',
      subjectName: r.subject_name || 'Genel',
      topicName: r.topic_name,
      urlOrContent: r.url_or_content,
      creatorName: r.created_by_name || 'Danışman',
      createdAt: r.created_at,
      hasOpticSolver: r.resource_type === 'pdf_test'
    })),

    // 2. AI Quiz Sets (12 Kritik Soru Testleri)
    ...aiQuizzes.map(q => ({
      id: q.id,
      title: q.title,
      resourceType: 'ai_quiz' as const,
      category: 'AYT_SAYISAL' as const,
      subjectName: 'Fizik & Matematik',
      topicName: q.topic_id || 'Newton Yasaları',
      urlOrContent: 'AI 12 Kritik Soru & Optik Çözüm',
      creatorName: 'Vira AI Sınav Koçu',
      createdAt: q.created_at,
      isAiQuiz: true,
      quizQuestionCount: q.question_count || 12,
      hasOpticSolver: true
    })),

    // 3. Legacy Curated Resources
    ...legacyResources.map(l => ({
      id: l.id,
      title: l.title,
      resourceType: 'pdf_test' as const,
      category: l.category as any,
      subjectName: l.subjectName,
      topicName: l.topicName,
      urlOrContent: l.url,
      creatorName: l.uploadedBy,
      createdAt: '2026-09-25',
      hasOpticSolver: l.hasAnswerKey
    }))
  ];

  // Distinct subjects for filter
  const allSubjects = Array.from(new Set(unifiedList.map(item => item.subjectName).filter(Boolean)));

  // Filter items
  const filtered = unifiedList.filter(item => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.topicName && item.topicName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      item.urlOrContent.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter || item.category === 'ALL';
    const matchesType = typeFilter === 'ALL' || item.resourceType === typeFilter;
    const matchesSubject = subjectFilter === 'ALL' || item.subjectName === subjectFilter;

    return matchesSearch && matchesCategory && matchesType && matchesSubject;
  });

  return (
    <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">
              Dijital Kütüphane & Kaynak Arşivi
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Aşama 5 Kaynak Havuzu
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Danışman tavsiyeli YouTube konu anlatımları, 12 kritik AI testleri, PDF föyleri ve özel çalışma notları
          </p>
        </div>

        {/* SEARCH BAR & QUESTION BANK BUTTON */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => setIsQuestionBankOpen(true)}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:brightness-110 text-white font-bold text-xs shadow-lg transition hover:scale-105 active:scale-95 border border-cyan-400/30"
            title="Tüm MEB müfredatı ve ÖSYM soru tiplerini 3 farklı çözüm yoluyla incele"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>📚 ÖSYM Soru Bankası & Çoklu Çözüm</span>
          </button>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Ders, konu, video veya not ara..."
              className="w-full bg-slate-800/80 border border-slate-700 text-xs text-white rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-500"
            />
          </div>
        </div>
      </div>

      {/* FILTER TOOLBAR */}
      <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
        
        {/* Row 1: Sınav Kategorisi */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-indigo-400" /> Sınav:
          </span>

          {[
            { id: 'ALL', label: 'Tüm Sınavlar' },
            { id: 'TYT', label: 'TYT (Temel Yeterlilik)' },
            { id: 'AYT_SAYISAL', label: 'AYT Sayısal' }
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                categoryFilter === cat.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Row 2: Kaynak Tipi & Branş */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60">
          <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-cyan-400" /> Tür:
          </span>

          {[
            { id: 'ALL', label: 'Tüm Formatlar' },
            { id: 'youtube_link', label: '📺 YouTube Anlatımı' },
            { id: 'ai_quiz', label: '🤖 AI 12-Soru Testi' },
            { id: 'pdf_test', label: '📄 PDF Test & Föy' },
            { id: 'mentor_note', label: '📌 Danışman Özel Notu' },
            { id: 'web_link', label: '🌐 Web Linki' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTypeFilter(t.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                typeFilter === t.id
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}

          {/* Subject Dropdown */}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Ders:</span>
            <select
              value={subjectFilter}
              onChange={e => setSubjectFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs rounded-xl px-2.5 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">Tüm Dersler</option>
              {allSubjects.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>
        </div>

      </div>

      {/* RESOURCES GRID */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-950/40 border border-dashed border-slate-800 space-y-2">
          <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-400">Seçili filtrelere uygun kaynak bulunamadı.</p>
          <p className="text-xs text-slate-500">Arama terimini veya filtre seçimlerini temizleyerek tekrar deneyin.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(item => {
            
            // 1. YouTube Kaynağı
            if (item.resourceType === 'youtube_link') {
              return (
                <div
                  key={item.id}
                  className="p-5 rounded-3xl bg-slate-950/80 border border-red-500/30 hover:border-red-500/60 transition shadow-lg flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-2.5 rounded-2xl bg-red-600/20 text-red-400 border border-red-500/30">
                          <Video className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="text-xs font-black text-white block">
                            {item.title}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {item.subjectName} {item.topicName ? `&bull; ${item.topicName}` : ''}
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 flex-shrink-0">
                        YouTube Dersi
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 flex items-center justify-between">
                      <span className="truncate max-w-[280px] font-mono text-slate-400">
                        {item.urlOrContent}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                        <Play className="w-3 h-3 fill-current" /> Video
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs text-slate-400">
                    <span className="flex items-center gap-1.5 text-[11px]">
                      <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{item.creatorName}</span>
                    </span>

                    <a
                      href={item.urlOrContent}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow"
                    >
                      <span>YouTube&apos;da İzle</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              );
            }

            // 2. Danışman Özel Notu
            if (item.resourceType === 'mentor_note') {
              return (
                <div
                  key={item.id}
                  className="p-5 rounded-3xl bg-amber-950/20 border border-amber-500/40 hover:border-amber-500/70 transition shadow-lg flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          <Pin className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="text-xs font-black text-amber-200 block">
                            {item.title}
                          </span>
                          <span className="text-[11px] text-amber-300/80">
                            📌 Danışman Özel Hatırlatma Notu &bull; {item.subjectName}
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex-shrink-0">
                        Koç Notu
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-amber-500/20 text-xs text-amber-100/90 leading-relaxed font-sans whitespace-pre-wrap">
                      {item.urlOrContent}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-amber-500/20 text-xs text-amber-300/80">
                    <span className="flex items-center gap-1.5 text-[11px]">
                      <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                      <span>{item.creatorName}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString('tr-TR') : 'Kalıcı Not'}
                    </span>
                  </div>
                </div>
              );
            }

            // 3. AI 12-Soruluk Test
            if (item.resourceType === 'ai_quiz') {
              return (
                <div
                  key={item.id}
                  className="p-5 rounded-3xl bg-slate-950/80 border border-cyan-500/40 hover:border-cyan-500/70 transition shadow-lg flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                          <Sparkles className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="text-xs font-black text-white block">
                            {item.title}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {item.subjectName} &bull; {item.topicName}
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex-shrink-0">
                        12 Soru AI
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Optik Cevap Formu & Çözümlü PDF Hazır</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs text-slate-400">
                    <span className="text-[11px] text-cyan-300 font-mono">
                      12 Kritik Soru &bull; ÖSYM Tipi
                    </span>

                    <button
                      onClick={() => onOpenTestSolver(item.topicName || item.title)}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:brightness-110 text-white font-bold text-xs flex items-center gap-1.5 transition shadow"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Testi Çöz</span>
                    </button>
                  </div>
                </div>
              );
            }

            // 4. Standart PDF Testi & Web Linki
            return (
              <div
                key={item.id}
                className="p-5 rounded-3xl bg-slate-950/70 border border-slate-800 hover:border-indigo-500/40 transition shadow-lg flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-indigo-400">
                        {item.resourceType === 'web_link' ? <Globe className="w-6 h-6 text-cyan-400" /> : <FileText className="w-6 h-6" />}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">
                          {item.title}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {item.subjectName} {item.topicName ? `&bull; ${item.topicName}` : ''}
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex-shrink-0">
                      {item.category}
                    </span>
                  </div>

                  {item.hasOpticSolver && (
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Optik Cevap Anahtarı Mevcut</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs text-slate-400">
                  <span className="text-[11px]">{item.creatorName}</span>

                  <div className="flex items-center space-x-2">
                    {item.hasOpticSolver && (
                      <button
                        onClick={() => onOpenTestSolver(item.topicName || item.subjectName)}
                        className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1 transition"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Optik Çözücü</span>
                      </button>
                    )}

                    <a
                      href={item.urlOrContent}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                      title="İndir / Görüntüle"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MEB Müfredatı & ÖSYM Soru Bankası Modalı */}
      <QuestionBankModal
        isOpen={isQuestionBankOpen}
        onClose={() => setIsQuestionBankOpen(false)}
        studentId={currentUserId}
        onLaunchLiveTest={topicName => {
          setIsQuestionBankOpen(false);
          onOpenTestSolver(topicName);
        }}
      />

    </div>
  );
};
