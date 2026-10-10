'use client';

import React, { useState, useMemo } from 'react';
import { TYT_SUBJECTS, AYT_SAYISAL_SUBJECTS, ALL_AVAILABLE_SUBJECTS } from '@/data/seedData';
import { CASCADING_CURRICULUM } from '@/data/cascadingCurriculum';
import { Subject, Topic, TopicMasteryStatus, StudentTopicStatus } from '@/types';
import { StorageService } from '@/lib/storage';
import confetti from 'canvas-confetti';
import { 
  CheckSquare, 
  Square, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Sparkles, 
  BookOpen, 
  HelpCircle, 
  ShieldCheck, 
  Flame, 
  ArrowRight,
  Filter,
  Check,
  RefreshCw,
  Info,
  Layers,
  GraduationCap,
  RotateCcw,
  LayoutGrid,
  List,
  Search,
  ChevronDown,
  ChevronUp,
  FolderTree,
  Undo2
} from 'lucide-react';

interface TopicMasteryMatrixProps {
  studentId: string;
  onRefreshData?: () => void;
  onOpenTest?: (topicName: string) => void;
}

type ViewMode = 'CARDS' | 'TABLE' | 'CLASS_TREE';
type StatusFilter = 'ALL' | 'ACTIVE' | 'EXEMPTED' | 'STRUGGLING' | 'PENDING';

export const TopicMasteryMatrix: React.FC<TopicMasteryMatrixProps> = ({
  studentId,
  onRefreshData,
  onOpenTest
}) => {
  const [examType, setExamType] = useState<'TYT' | 'AYT' | 'ALL'>('AYT');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('ayt-matematik');
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [statusFeedback, setStatusFeedback] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);
  
  // Yeni arama, görünüm ve filtreleme state'leri
  const [viewMode, setViewMode] = useState<ViewMode>('CARDS');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedGrades, setExpandedGrades] = useState<Record<string, boolean>>({
    '9th': true,
    '10th': true,
    '11th': true,
    '12th': true
  });

  // Storage'dan anlık durumları çek
  const topicStatuses = useMemo(() => {
    return StorageService.getStudentTopicStatuses(studentId);
  }, [studentId, statusFeedback]);

  // Sınav türüne göre mevcut branşlar
  const availableSubjects = useMemo(() => {
    if (examType === 'TYT') {
      return TYT_SUBJECTS;
    }
    if (examType === 'AYT') {
      return AYT_SAYISAL_SUBJECTS;
    }
    return ALL_AVAILABLE_SUBJECTS;
  }, [examType]);

  // Seçili branş nesnesi
  const currentSubject = useMemo(() => {
    const found = availableSubjects.find(s => s.id === selectedBranchId);
    if (found) return found;
    return availableSubjects[0] || null;
  }, [availableSubjects, selectedBranchId]);

  // Durum haritası (Hızlı arama için)
  const statusMap = useMemo(() => {
    const map: Record<string, StudentTopicStatus> = {};
    topicStatuses.forEach(s => {
      map[s.topicId] = s;
    });
    return map;
  }, [topicStatuses]);

  // Sınav tipi değişimi
  const handleExamTypeChange = (type: 'TYT' | 'AYT' | 'ALL') => {
    setExamType(type);
    setSelectedTopicIds([]);
    if (type === 'TYT') {
      setSelectedBranchId('tyt-matematik');
    } else if (type === 'AYT') {
      setSelectedBranchId('ayt-matematik');
    } else {
      setSelectedBranchId('tyt-matematik');
    }
  };

  // Tekli konu seçimi toggle
  const handleToggleSelectTopic = (topicId: string) => {
    setSelectedTopicIds(prev => 
      prev.includes(topicId) ? prev.filter(id => id !== topicId) : [...prev, topicId]
    );
  };

  // Branştaki tümünü seç / seçimi kaldır
  const handleToggleSelectAll = (filteredTopicList?: { id: string }[]) => {
    const targets = filteredTopicList || (currentSubject ? currentSubject.topics : []);
    const targetIds = targets.map(t => t.id);
    const allSelected = targetIds.length > 0 && targetIds.every(id => selectedTopicIds.includes(id));
    if (allSelected) {
      setSelectedTopicIds(prev => prev.filter(id => !targetIds.includes(id)));
    } else {
      setSelectedTopicIds(prev => Array.from(new Set([...prev, ...targetIds])));
    }
  };

  // Toplu durum uygulama
  const handleApplyStatus = (status: TopicMasteryStatus) => {
    if (selectedTopicIds.length === 0) return;

    const result = StorageService.updateTopicStatuses(studentId, selectedTopicIds, status);
    
    if (status === 'pending_exemption') {
      setStatusFeedback({
        type: 'info',
        message: `${result.updatedCount} konu için Danışman Cen Hoca'ya "Muafiyet Talebi" gönderildi. Onaylandığında takvimden düşecektir.`
      });
    } else if (status === 'full_study') {
      setStatusFeedback({
        type: 'success',
        message: `${result.updatedCount} konu için 4 Aşamalı Sıfırdan Çalışma Döngüsü takvime bağlandı.`
      });
    } else if (status === 'practice_only') {
      setStatusFeedback({
        type: 'success',
        message: `${result.updatedCount} konu "Sadece Soru / Tekrar" olarak işaretlendi. Konu anlatımı atlanarak testler takvime alındı.`
      });
    } else if (status === 'struggling') {
      setStatusFeedback({
        type: 'error',
        message: `${result.updatedCount} konu "Zorlanıyorum / Kritik" olarak işaretlendi. AI Takip Koçuna öncelik uyarısı iletildi!`
      });
    }

    if (onRefreshData) onRefreshData();
    setTimeout(() => {
      setStatusFeedback(null);
    }, 5500);
  };

  // TEK KONU MUAFİYETİNİ GERİ AL / MÜFREDATA DÖNDÜR
  const handleSingleRevokeExemption = (topicId: string, topicName: string) => {
    const res = StorageService.revokeExemption(studentId, topicId);
    setStatusFeedback({
      type: 'success',
      message: `"${topicName}" konusunun muafiyeti kaldırıldı. Tekrar çalışma sorumluluğunuza eklendi.`
    });
    if (onRefreshData) onRefreshData();
    setTimeout(() => {
      setStatusFeedback(null);
    }, 4500);
  };

  // TOPLU MUAFİYETİ GERİ AL / ÇALIŞMAYA DÖNDÜR
  const handleBatchRevokeExemptions = () => {
    if (selectedTopicIds.length === 0) return;
    const res = StorageService.revertTopicsToStudy(studentId, selectedTopicIds);
    setStatusFeedback({
      type: 'success',
      message: `✅ Seçilen ${res.updatedCount} konunun muafiyeti kaldırıldı ve çalışma planınıza geri dahil edildi.`
    });
    setSelectedTopicIds([]);
    if (onRefreshData) onRefreshData();
    setTimeout(() => {
      setStatusFeedback(null);
    }, 4500);
  };

  // Takvim senkronizasyonu
  const handleSaveAndSyncCalendar = () => {
    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.8 }
      });
    } catch (e) {}

    setStatusFeedback({
      type: 'success',
      message: '✅ Konu Hakimiyet Matrisi ve Dinamik Çalışma Takvimi başarıyla güncellendi!'
    });
    setSelectedTopicIds([]);
    if (onRefreshData) onRefreshData();
    setTimeout(() => {
      setStatusFeedback(null);
    }, 4500);
  };

  // Durum rozeti ve görsel teması
  const getStatusBadge = (status?: TopicMasteryStatus) => {
    switch (status) {
      case 'exempted':
        return {
          label: 'Danışman Onaylı Muaf',
          bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          icon: ShieldCheck,
          isMuted: true
        };
      case 'pending_exemption':
        return {
          label: 'Muafiyet Onayı Bekliyor',
          bg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 animate-pulse',
          icon: Clock,
          isMuted: true
        };
      case 'full_study':
        return {
          label: 'Sıfırdan 4 Aşamalı Çalışma',
          bg: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
          icon: BookOpen,
          isMuted: false
        };
      case 'practice_only':
        return {
          label: 'Sadece Soru / Tekrar',
          bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          icon: RefreshCw,
          isMuted: false
        };
      case 'struggling':
        return {
          label: 'Zorlanıyorum / Kritik Eksik',
          bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          icon: Flame,
          isMuted: false
        };
      default:
        return {
          label: 'Çalışılacak (Sorumlu)',
          bg: 'bg-slate-800 text-slate-300 border-slate-700',
          icon: HelpCircle,
          isMuted: false
        };
    }
  };

  // Alt konu başlıkları üretici
  const getSubtopicsForTopic = (topic: Topic): string[] => {
    if (topic.subtopics && topic.subtopics.length > 0) return topic.subtopics;
    if (topic.name.includes('Türev')) return ['Türev Kuralları', 'Teğet Denklemi', 'Maksimum-Minimum', 'Artan-Azalan'];
    if (topic.name.includes('İntegral')) return ['Belirsiz İntegral', 'Değişken Değiştirme', 'Belirli İntegral', 'Alan Hesabı'];
    if (topic.name.includes('Polinom')) return ['Polinom Derecesi', 'Bölme ve Kalan', 'Katsayılar Toplamı', 'Sabit Terim'];
    if (topic.name.includes('Elektrik')) return ['Elektriksel Kuvvet', 'Potansiyel Enerji', 'Düzgün Manyetik Alan', 'İndüksiyon Akımı'];
    if (topic.name.includes('Hareket') || topic.name.includes('Kuvvet')) return ['Bağıl Hareket', 'Newton Yasaları', 'Eğik Düzlem', 'Sürtünme'];
    if (topic.name.includes('Atom') || topic.name.includes('Periyodik')) return ['Kuantum Sayıları', 'Elektron Dizilimleri', 'İyonlaşma Enerjisi', 'Elektronegatiflik'];
    if (topic.name.includes('Paragraf')) return ['Ana Düşünce', 'Yardımcı Fikirler', 'Paragraf Akışı', 'Çeldirici Analizi'];
    if (topic.name.includes('Problem')) return ['Sayı-Kesir', 'Yaş Problemleri', 'Yüzde-Kar-Zarar', 'Hız-Hareket'];
    return ['Temel Kavramlar & Tanımlar', 'Kritik Formüller & Özellikler', 'ÖSYM Çıkmış Soru Kalıpları'];
  };

  // Filtrelenmiş konular (Arama ve durum filtresine göre)
  const filteredTopics = useMemo(() => {
    if (!currentSubject) return [];
    return currentSubject.topics.filter(topic => {
      // 1. Arama sorgusu filtresi
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = topic.name.toLowerCase().includes(query);
        const matchSubtopics = getSubtopicsForTopic(topic).some(s => s.toLowerCase().includes(query));
        if (!matchName && !matchSubtopics) return false;
      }

      // 2. Durum filtresi
      const currentStatus = statusMap[topic.id]?.status || 'not_started';
      if (statusFilter === 'EXEMPTED') {
        return currentStatus === 'exempted' || currentStatus === 'pending_exemption';
      }
      if (statusFilter === 'ACTIVE') {
        return currentStatus === 'not_started' || currentStatus === 'full_study' || currentStatus === 'practice_only';
      }
      if (statusFilter === 'STRUGGLING') {
        return currentStatus === 'struggling';
      }
      if (statusFilter === 'PENDING') {
        return currentStatus === 'pending_exemption';
      }
      return true;
    });
  }, [currentSubject, searchQuery, statusFilter, statusMap]);

  // Seçilen konular içinde muaf olan var mı kontrolü
  const hasExemptedInSelection = useMemo(() => {
    return selectedTopicIds.some(id => {
      const st = statusMap[id]?.status;
      return st === 'exempted' || st === 'pending_exemption';
    });
  }, [selectedTopicIds, statusMap]);

  // Cascading Curriculum eşleşmesi (Sınıf sınıf görünüm için)
  const currentCascadingSubject = useMemo(() => {
    if (!currentSubject) return null;
    const nameLower = currentSubject.name.toLowerCase();
    return CASCADING_CURRICULUM.find(cs => {
      if (nameLower.includes('matematik') && cs.id === 'matematik') return true;
      if (nameLower.includes('geometri') && cs.id === 'geometri') return true;
      if (nameLower.includes('fizik') && cs.id === 'fizik') return true;
      if (nameLower.includes('kimya') && cs.id === 'kimya') return true;
      if (nameLower.includes('biyoloji') && cs.id === 'biyoloji') return true;
      if (nameLower.includes('türkçe') || nameLower.includes('edebiyat')) return cs.id === 'turkce';
      if (nameLower.includes('tarih')) return cs.id === 'tarih';
      if (nameLower.includes('coğrafya')) return cs.id === 'cografya';
      return false;
    });
  }, [currentSubject]);

  // Sınıf akordeonunu aç/kapat
  const toggleGrade = (gradeKey: string) => {
    setExpandedGrades(prev => ({
      ...prev,
      [gradeKey]: !prev[gradeKey]
    }));
  };

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6 relative pb-28">
      
      {/* ── 1. ÜST BAŞLIK VE ÇOKLU SEÇİCİLER ──────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <span>Müfredat Sorumluluk & Muafiyet Haritası</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Öğrencinin sorumlu olduğu tüm başlıklar. Muaf ve tamamlanan konular <span className="text-emerald-400 font-semibold">silik</span> olarak listelenir; dilediğiniz an tek tıkla çalışma havuzuna geri alabilirsiniz.
          </p>
        </div>

        {/* Kontroller: TYT / AYT + Görünüm Modu Seçici */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* TYT / AYT / TÜMÜ Sekmeleri */}
          <div className="topic-matrix-exam-switcher flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => handleExamTypeChange('TYT')}
              className={`topic-matrix-exam-btn px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                examType === 'TYT'
                  ? 'is-active bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>📘 TYT</span>
            </button>
            <button
              onClick={() => handleExamTypeChange('AYT')}
              className={`topic-matrix-exam-btn px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                examType === 'AYT'
                  ? 'is-active bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>📙 AYT Sayısal</span>
            </button>
            <button
              onClick={() => handleExamTypeChange('ALL')}
              className={`topic-matrix-exam-btn px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                examType === 'ALL'
                  ? 'is-active bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>📚 Tümü</span>
            </button>
          </div>

          {/* Görünüm Seçici (Kutu / Satır / Sınıf Şeması) */}
          <div className="topic-matrix-view-switcher flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => setViewMode('CARDS')}
              className={`topic-matrix-view-btn p-1.5 rounded-xl transition flex items-center gap-1 text-xs font-semibold ${
                viewMode === 'CARDS'
                  ? 'is-active bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Kutu / Kart Görünümü"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kutu</span>
            </button>
            <button
              onClick={() => setViewMode('TABLE')}
              className={`topic-matrix-view-btn p-1.5 rounded-xl transition flex items-center gap-1 text-xs font-semibold ${
                viewMode === 'TABLE'
                  ? 'is-active bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Alt Alta Satır / Liste Görünümü"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Satır</span>
            </button>
            <button
              onClick={() => setViewMode('CLASS_TREE')}
              className={`topic-matrix-view-btn p-1.5 rounded-xl transition flex items-center gap-1 text-xs font-semibold ${
                viewMode === 'CLASS_TREE'
                  ? 'is-active bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="9-10-11-12. Sınıf Müfredat Şeması"
            >
              <FolderTree className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sınıf Şeması</span>
            </button>
          </div>

        </div>
      </div>

      {/* ── 2. GERİ BİLDİRİM BİLGİLENDİRME KUTUSU ────────────────────────── */}
      {statusFeedback && (
        <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-3 shadow-lg transition-all animate-fadeIn ${
          statusFeedback.type === 'success' 
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' 
            : statusFeedback.type === 'error'
            ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
            : 'bg-indigo-950/40 border-indigo-500/40 text-indigo-200'
        }`}>
          <div className="flex items-center space-x-2.5">
            {statusFeedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            ) : statusFeedback.type === 'error' ? (
              <Flame className="w-5 h-5 text-rose-400 flex-shrink-0" />
            ) : (
              <Info className="w-5 h-5 text-indigo-400 flex-shrink-0" />
            )}
            <span className="font-medium">{statusFeedback.message}</span>
          </div>
          <button 
            onClick={() => setStatusFeedback(null)}
            className="text-slate-400 hover:text-white text-xs px-2.5 py-1 rounded-lg bg-slate-800"
          >
            Kapat
          </button>
        </div>
      )}

      {/* ── 3. ANA GÖVDE: SOL BRANŞ MENÜSÜ & SAĞ KONU ALANI ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* SOL MENÜ: BRANŞ LİSTESİ */}
        <div className="lg:col-span-1 space-y-2">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1 mb-2 flex items-center justify-between">
            <span>Ders Seçimi ({availableSubjects.length})</span>
          </div>

          <div className="space-y-1.5 flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-thin">
            {availableSubjects.map(subject => {
              const isSelected = subject.id === currentSubject?.id;
              
              // Count exempted / completed topics in this subject
              const subjectTopicIds = subject.topics.map(t => t.id);
              const exemptedCount = subjectTopicIds.filter(id => {
                const s = statusMap[id];
                return s && (s.status === 'exempted' || s.status === 'pending_exemption');
              }).length;

              return (
                <button
                  key={subject.id}
                  onClick={() => setSelectedBranchId(subject.id)}
                  className={`topic-matrix-subject-btn flex-shrink-0 w-full p-3 rounded-2xl border text-left transition flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'is-selected bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                      : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${subject.color}`} />
                    <span className="topic-matrix-subject-name font-semibold text-xs truncate max-w-[130px] sm:max-w-none">
                      {subject.name}
                    </span>
                  </div>

                  <span className={`topic-matrix-subject-badge text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                  }`} title={`${exemptedCount} konu muaf / ${subject.topics.length} toplam`}>
                    {exemptedCount > 0 ? `${exemptedCount} Muaf` : `${subject.topics.length} Konu`}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Muafiyet Özeti Kutusu */}
          <div className="topic-matrix-help-box hidden lg:block p-3.5 rounded-2xl bg-slate-950/40 border border-slate-800 text-xs space-y-2 mt-4">
            <div className="flex items-center space-x-2 text-slate-300 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Muafiyet Sistemi Nasıl Çalışır?</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Öğrenci bildiği konuları <span className="text-cyan-300 font-medium">&quot;Muaf Tut&quot;</span> seçeneğiyle danışman onayına gönderir. Onaylanan konular <span className="text-emerald-400 font-medium">silikleşir</span> ve takvimden düşer. Yanlışlıkla muaf edilenler buradan <span className="text-amber-300 font-medium">&quot;Muafiyeti Geri Al&quot;</span> butonuyla tek tıkla tekrar çalışma planına alınabilir.
            </p>
          </div>
        </div>

        {/* SAĞ ANA ALAN: SEÇİLEN BRANŞIN KONULARI */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Branş Üst Başlığı, Arama Çubuğu ve Filtreler */}
          {currentSubject && (
            <div className="space-y-3 pb-3 border-b border-slate-800">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{currentSubject.name}</span>
                    <span className="text-xs text-indigo-400 font-normal">
                      ({filteredTopics.length} / {currentSubject.topics.length} Konu &bull; Sınavda ~{currentSubject.totalQuestionCount} Soru)
                    </span>
                  </h3>
                </div>

                {/* Hızlı Arama Inputu */}
                <div className="relative min-w-[220px]">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Konu veya kazanım ara..."
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-white"
                    >
                      &times;
                    </button>
                  )}
                </div>
              </div>

              {/* Filtre Sekmeleri ve Toplu Seçim Butonu */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                  <button
                    onClick={() => setStatusFilter('ALL')}
                    className={`topic-matrix-filter-btn px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                      statusFilter === 'ALL'
                        ? 'is-active bg-slate-700 text-white'
                        : 'bg-slate-800/40 text-slate-400 hover:text-white'
                    }`}
                  >
                    Tümü ({currentSubject.topics.length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('ACTIVE')}
                    className={`topic-matrix-filter-btn px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                      statusFilter === 'ACTIVE'
                        ? 'is-active bg-blue-600/30 text-blue-300 border border-blue-500/40'
                        : 'bg-slate-800/40 text-slate-400 hover:text-white'
                    }`}
                  >
                    Sorumlu / Çalışılacak
                  </button>
                  <button
                    onClick={() => setStatusFilter('EXEMPTED')}
                    className={`topic-matrix-filter-btn px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                      statusFilter === 'EXEMPTED'
                        ? 'is-active bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800/40 text-slate-400 hover:text-white'
                    }`}
                  >
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>Muaf / Silik</span>
                  </button>
                  <button
                    onClick={() => setStatusFilter('STRUGGLING')}
                    className={`topic-matrix-filter-btn px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                      statusFilter === 'STRUGGLING'
                        ? 'is-active bg-rose-600/30 text-rose-300 border border-rose-500/40'
                        : 'bg-slate-800/40 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Flame className="w-3 h-3 text-rose-400" />
                    <span>Kritik / Zorlanılan</span>
                  </button>
                </div>

                <button
                  onClick={() => handleToggleSelectAll(filteredTopics)}
                  className="topic-matrix-select-all-btn px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition flex items-center gap-1.5 flex-shrink-0"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Listedekileri Seç ({filteredTopics.length})</span>
                </button>
              </div>

            </div>
          )}

          {/* =============================================================== */}
          {/* GÖRÜNÜM 1: KUTU / KART GÖRÜNÜMÜ                                 */}
          {/* =============================================================== */}
          {viewMode === 'CARDS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredTopics.map(topic => {
                const isSelected = selectedTopicIds.includes(topic.id);
                const currentStatus = statusMap[topic.id]?.status || 'not_started';
                const badge = getStatusBadge(currentStatus);
                const BadgeIcon = badge.icon;
                const subtopics = getSubtopicsForTopic(topic);
                const isExempt = currentStatus === 'exempted' || currentStatus === 'pending_exemption';

                return (
                  <div
                    key={topic.id}
                    onClick={() => handleToggleSelectTopic(topic.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer select-none flex flex-col justify-between gap-3 relative ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/40 shadow-lg'
                        : isExempt
                        ? 'bg-slate-950/40 border-emerald-500/30 opacity-60 hover:opacity-100'
                        : currentStatus === 'struggling'
                        ? 'bg-rose-950/15 border-rose-500/30'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Kart Üst: Checkbox, Başlık ve Öncelik */}
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start space-x-3">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleSelectTopic(topic.id);
                            }}
                            className="mt-0.5 text-slate-400 hover:text-indigo-400 transition"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-5 h-5 text-indigo-400" />
                            ) : (
                              <Square className="w-5 h-5 text-slate-500" />
                            )}
                          </button>

                          <div>
                            <div className={`font-bold text-sm leading-tight flex items-center gap-1.5 ${
                              isExempt ? 'text-slate-400 line-through' : 'text-white'
                            }`}>
                              <span>{topic.name}</span>
                              {isExempt && (
                                <span className="no-underline text-[10px] text-emerald-400 font-bold px-1.5 py-0.2 bg-emerald-500/10 rounded border border-emerald-500/30">
                                  Muaf
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                              <span>Tahmini: {topic.estimatedHours} saat</span>
                              <span>&bull;</span>
                              <span className={topic.priority === 'HIGH' ? 'text-amber-400 font-semibold' : 'text-slate-400'}>
                                {topic.priority === 'HIGH' ? 'Yüksek Önem' : 'Standart'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Durum Rozeti */}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border flex items-center gap-1 flex-shrink-0 ${badge.bg}`}>
                          <BadgeIcon className="w-3 h-3" />
                          <span>{badge.label}</span>
                        </span>
                      </div>

                      {/* Alt Konular (Kazanım Hapları) */}
                      <div className="flex flex-wrap gap-1.5 pt-1 pl-8">
                        {subtopics.map((sub, idx) => (
                          <span
                            key={idx}
                            className={`text-[10px] px-2 py-0.5 rounded-md border font-medium ${
                              isExempt 
                                ? 'bg-slate-950 border-slate-900 text-slate-500' 
                                : 'bg-slate-900 border-slate-800 text-slate-300'
                            }`}
                          >
                            {sub}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Kart Alt Çizgisi: Muafiyeti Geri Al / Test Aç */}
                    <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 truncate max-w-[210px]">
                        {currentStatus === 'exempted' && '✅ Danışman onaylı muaf'}
                        {currentStatus === 'pending_exemption' && '⏳ Onay bekleniyor'}
                        {currentStatus === 'full_study' && '📖 4 aşamalı plan aktif'}
                        {currentStatus === 'practice_only' && '📝 Soru & AI testi'}
                        {currentStatus === 'struggling' && '⚠️ Kritik eksik uyarısı'}
                        {currentStatus === 'not_started' && 'Sorumlu (Çalışılacak)'}
                      </span>

                      <div className="flex items-center space-x-2 flex-shrink-0">
                        {/* Muaf ise tek tıkla geri getirme butonu */}
                        {isExempt && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSingleRevokeExemption(topic.id, topic.name);
                            }}
                            className="text-[10px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition"
                            title="Muafiyeti kaldır ve konuyu çalışma sorumluluğuna geri döndür"
                          >
                            <Undo2 className="w-3 h-3" />
                            <span>Geri Getir</span>
                          </button>
                        )}

                        {onOpenTest && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenTest(topic.name);
                            }}
                            className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                          >
                            <span>Testi Aç</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

          {/* =============================================================== */}
          {/* GÖRÜNÜM 2: SATIR / LİSTE GÖRÜNÜMÜ                               */}
          {/* =============================================================== */}
          {viewMode === 'TABLE' && (
            <div className="space-y-2">
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/60">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase">
                    <tr>
                      <th className="p-3 w-10">#</th>
                      <th className="p-3">Konu Başlığı</th>
                      <th className="p-3 hidden md:table-cell">Önem / Süre</th>
                      <th className="p-3">Durum</th>
                      <th className="p-3 text-right">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredTopics.map(topic => {
                      const isSelected = selectedTopicIds.includes(topic.id);
                      const currentStatus = statusMap[topic.id]?.status || 'not_started';
                      const badge = getStatusBadge(currentStatus);
                      const isExempt = currentStatus === 'exempted' || currentStatus === 'pending_exemption';

                      return (
                        <tr
                          key={topic.id}
                          onClick={() => handleToggleSelectTopic(topic.id)}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-indigo-950/50'
                              : isExempt
                              ? 'bg-slate-950/30 opacity-60 hover:opacity-100 hover:bg-slate-900/40'
                              : 'hover:bg-slate-900/60'
                          }`}
                        >
                          <td className="p-3" onClick={e => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => handleToggleSelectTopic(topic.id)}
                              className="text-slate-400 hover:text-indigo-400 transition"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-indigo-400" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-600" />
                              )}
                            </button>
                          </td>
                          <td className="p-3">
                            <div className={`font-semibold ${isExempt ? 'line-through text-slate-400' : 'text-white'}`}>
                              {topic.name}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5 truncate max-w-sm">
                              {getSubtopicsForTopic(topic).join(', ')}
                            </div>
                          </td>
                          <td className="p-3 hidden md:table-cell text-slate-400">
                            <span>{topic.estimatedHours} saat &bull; </span>
                            <span className={topic.priority === 'HIGH' ? 'text-amber-400 font-semibold' : ''}>
                              {topic.priority === 'HIGH' ? 'Yüksek' : 'Standart'}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border inline-flex items-center gap-1 ${badge.bg}`}>
                              <span>{badge.label}</span>
                            </span>
                          </td>
                          <td className="p-3 text-right" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-end space-x-2">
                              {isExempt ? (
                                <button
                                  type="button"
                                  onClick={() => handleSingleRevokeExemption(topic.id, topic.name)}
                                  className="text-[10px] text-amber-400 hover:text-amber-300 font-bold px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition flex items-center gap-1"
                                >
                                  <Undo2 className="w-3 h-3" />
                                  <span>Geri Al</span>
                                </button>
                              ) : onOpenTest ? (
                                <button
                                  type="button"
                                  onClick={() => onOpenTest(topic.name)}
                                  className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 transition flex items-center gap-1"
                                >
                                  <span>Test</span>
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* GÖRÜNÜM 3: SINIF SINIF MÜFREDAT ŞEMASI (9 - 10 - 11 - 12)       */}
          {/* =============================================================== */}
          {viewMode === 'CLASS_TREE' && (
            <div className="space-y-4">
              {currentCascadingSubject ? (
                currentCascadingSubject.grades.map(gradeObj => {
                  const isExpanded = expandedGrades[gradeObj.grade] ?? true;

                  // Bu sınıfa ait konuları durum haritasıyla eşleştir
                  const gradeTopics = gradeObj.topics;
                  const gradeExemptCount = gradeTopics.filter(t => {
                    // ID veya isim benzerliği kontrolü
                    const st = statusMap[t.id]?.status;
                    return st === 'exempted' || st === 'pending_exemption';
                  }).length;

                  return (
                    <div
                      key={gradeObj.grade}
                      className="topic-matrix-grade-section rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden"
                    >
                      {/* Sınıf Başlığı Akordeonu */}
                      <button
                        onClick={() => toggleGrade(gradeObj.grade)}
                        className="topic-matrix-grade-header w-full p-3.5 bg-slate-900 hover:bg-slate-850 flex items-center justify-between text-left transition"
                      >
                        <div className="flex items-center space-x-2.5">
                          <FolderTree className="w-4 h-4 text-indigo-400" />
                          <span className="topic-matrix-grade-title font-bold text-sm text-white">
                            {gradeObj.gradeLabel}
                          </span>
                          <span className="topic-matrix-grade-count text-xs text-slate-400">
                            ({gradeTopics.length} Konu)
                          </span>
                        </div>

                        <div className="flex items-center space-x-3">
                          {gradeExemptCount > 0 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              {gradeExemptCount} Muaf
                            </span>
                          )}
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </button>

                      {/* Konu Kutucukları Izgarası */}
                      {isExpanded && (
                        <div className="p-3.5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                          {gradeTopics.map(t => {
                            const isSelected = selectedTopicIds.includes(t.id);
                            const currentStatus = statusMap[t.id]?.status || 'not_started';
                            const badge = getStatusBadge(currentStatus);
                            const isExempt = currentStatus === 'exempted' || currentStatus === 'pending_exemption';

                            return (
                              <div
                                key={t.id}
                                onClick={() => handleToggleSelectTopic(t.id)}
                                className={`topic-matrix-tree-card p-2.5 rounded-xl border text-xs cursor-pointer select-none transition flex flex-col justify-between gap-2 ${
                                  isSelected
                                    ? 'is-selected bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/40'
                                    : isExempt
                                    ? 'is-exempt bg-slate-950/40 border-emerald-500/30 opacity-60 hover:opacity-100'
                                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-1.5">
                                  <div className="flex items-start space-x-2">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleSelectTopic(t.id);
                                      }}
                                      className="text-slate-400 hover:text-indigo-400 mt-0.5"
                                    >
                                      {isSelected ? (
                                        <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                                      ) : (
                                        <Square className="w-3.5 h-3.5 text-slate-600" />
                                      )}
                                    </button>
                                    <span className={`topic-tree-card-name font-semibold ${isExempt ? 'line-through text-slate-400' : 'text-slate-200'}`}>
                                      {t.name}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px]">
                                  <span className={`topic-tree-card-badge ${badge.bg} px-1.5 py-0.2 rounded border font-medium`}>
                                    {badge.label}
                                  </span>

                                  {isExempt && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSingleRevokeExemption(t.id, t.name);
                                      }}
                                      className="text-amber-400 hover:text-amber-300 font-bold underline"
                                    >
                                      Geri Getir
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                  Bu ders için sınıf şeması kart görünümünde incelenebilir.
                </div>
              )}
            </div>
          )}

          {/* Konu bulunamadı durumu */}
          {filteredTopics.length === 0 && (
            <div className="p-10 text-center rounded-2xl border border-slate-800 bg-slate-950/40 text-slate-400 space-y-2">
              <Search className="w-8 h-8 mx-auto text-slate-600" />
              <div className="text-sm font-semibold text-slate-300">Filtreye uygun konu bulunamadı</div>
              <p className="text-xs text-slate-500">Arama terimini değiştirebilir veya &quot;Tümü&quot; filtresini seçebilirsiniz.</p>
            </div>
          )}

        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4. SABİT AKSİYON BARI (KONU SEÇİLİNCE ALTTAN AÇILAN PANEL)                */}
      {/* ========================================================================= */}
      {selectedTopicIds.length > 0 && (
        <div className="batch-action-toolbar fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-4xl z-50 bg-slate-950/95 backdrop-blur-md border border-indigo-500/50 rounded-3xl p-4 shadow-2xl shadow-indigo-950/80 animate-slideUp flex flex-col md:flex-row items-center justify-between gap-3 text-white">
          
          <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center space-x-2">
              <span className="batch-selected-count w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                {selectedTopicIds.length}
              </span>
              <span className="batch-selected-label text-xs font-bold text-white">Konu Seçildi</span>
            </div>

            <button
              onClick={() => setSelectedTopicIds([])}
              className="batch-clear-btn text-xs text-slate-400 hover:text-white underline font-semibold"
            >
              Seçimi Temizle
            </button>
          </div>

          {/* Aksiyon Butonları */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            
            {/* Muafiyet Geri Alma Butonu (Eğer seçilenler arasında muaf konu varsa) */}
            {hasExemptedInSelection && (
              <button
                onClick={handleBatchRevokeExemptions}
                className="batch-btn-revoke px-3 py-1.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/50 text-amber-300 text-xs font-bold transition flex items-center gap-1.5 shadow-md"
                title="Seçilen muaf konuları tekrar çalışma planına dahil eder"
              >
                <Undo2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Muafiyeti Geri Al (Çalışmaya Döndür)</span>
              </button>
            )}

            {/* 1. [Biliyorum / Muaf Tut] */}
            <button
              onClick={() => handleApplyStatus('pending_exemption')}
              className="batch-btn-exemption px-3 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 text-xs font-semibold transition flex items-center gap-1.5"
              title="Danışmana muafiyet talebi gönderir. Onaylanınca takvimden düşer ve silikleşir."
            >
              <GraduationCap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Biliyorum / Muaf Tut</span>
            </button>

            {/* 2. [Sıfırdan Çalışacağım] */}
            <button
              onClick={() => handleApplyStatus('full_study')}
              className="batch-btn-study px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 text-xs font-semibold transition flex items-center gap-1.5"
              title="4 aşamalı standart çalışma akışını takvime bağlar."
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-400" />
              <span>Sıfırdan Çalışacağım</span>
            </button>

            {/* 3. [Sadece Soru / Tekrar] */}
            <button
              onClick={() => handleApplyStatus('practice_only')}
              className="batch-btn-practice px-3 py-1.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 text-xs font-semibold transition flex items-center gap-1.5"
              title="Konu anlatımını atlayıp çıkmış soru + AI testini takvime atar."
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
              <span>Soru / Tekrar</span>
            </button>

            {/* 4. [Zorlanıyorum / Kritik] */}
            <button
              onClick={() => handleApplyStatus('struggling')}
              className="batch-btn-struggling px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 text-xs font-semibold transition flex items-center gap-1.5"
              title="AI takip botuna ve danışmana yüksek öncelik uyarısı verir."
            >
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span>Kritik / Zorlanıyorum</span>
            </button>

            {/* 5. [Kaydet ve Takvimi Güncelle] */}
            <button
              onClick={handleSaveAndSyncCalendar}
              className="batch-btn-save px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition shadow-lg flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Kaydet & Senkronize Et</span>
            </button>

          </div>

        </div>
      )}

    </div>
  );
};
