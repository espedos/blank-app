'use client';

import React, { useState, useMemo } from 'react';
import { QUESTION_BANK_ITEMS, BankQuestion, QuestionTypeFilter, QuestionDifficultyFilter } from '@/data/questionBankData';
import { StorageService } from '@/lib/storage';
import { PdfGenerator } from '@/lib/pdfGenerator';
import { 
  X, 
  Search, 
  Filter, 
  BookOpen, 
  Sparkles, 
  Zap, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Printer, 
  Play, 
  Plus, 
  Check, 
  Layers, 
  ChevronDown, 
  ChevronUp,
  Tag,
  Target
} from 'lucide-react';

interface QuestionBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId?: string;
  studentName?: string;
  initialSubject?: string;
  onLaunchLiveTest?: (topicName: string) => void;
  onRefreshData?: () => void;
}

export const QuestionBankModal: React.FC<QuestionBankModalProps> = ({
  isOpen,
  onClose,
  studentId = 'student-1',
  studentName = 'Öğrenci',
  initialSubject = 'all',
  onLaunchLiveTest,
  onRefreshData
}) => {
  const [selectedSubject, setSelectedSubject] = useState<string>(initialSubject);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'TYT' | 'AYT'>('all');
  const [selectedType, setSelectedType] = useState<QuestionTypeFilter>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<QuestionDifficultyFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Soru bazlı kullanıcı etkileşim state'leri
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [expandedSolutions, setExpandedSolutions] = useState<Record<string, boolean>>({});
  const [activeSolutionTab, setActiveSolutionTab] = useState<Record<string, 'all' | 'approach1' | 'approach2' | 'trap'>>({});
  const [addedTasksFeedback, setAddedTasksFeedback] = useState<Record<string, boolean>>({});

  // Filtreleme mantığı
  const filteredQuestions = useMemo(() => {
    return QUESTION_BANK_ITEMS.filter(q => {
      // Branş Filtresi
      if (selectedSubject !== 'all' && q.subjectId !== selectedSubject) {
        return false;
      }
      // Kategori Filtresi (TYT/AYT)
      if (selectedCategory !== 'all' && q.examCategory !== selectedCategory) {
        return false;
      }
      // Soru Tipi Filtresi
      if (selectedType !== 'all' && q.questionType !== selectedType) {
        return false;
      }
      // Zorluk Filtresi
      if (selectedDifficulty !== 'all' && q.difficulty !== selectedDifficulty) {
        return false;
      }
      // Arama Metni
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const inText = q.questionText.toLowerCase().includes(query);
        const inTopic = q.topicName.toLowerCase().includes(query);
        const inSubject = q.subjectName.toLowerCase().includes(query);
        const inConcept = (q.criticalConcept || q.criticalTag || '').toLowerCase().includes(query);
        if (!inText && !inTopic && !inSubject && !inConcept) {
          return false;
        }
      }
      return true;
    });
  }, [selectedSubject, selectedCategory, selectedType, selectedDifficulty, searchQuery]);

  if (!isOpen) return null;

  // Şık İşaretleme
  const handleSelectOption = (questionId: string, optionKey: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionKey
    }));
    // Otomatik olarak çözümü de genişlet
    setExpandedSolutions(prev => ({
      ...prev,
      [questionId]: true
    }));
  };

  // Çözüm Akordeonunu Aç / Kapa
  const toggleSolution = (questionId: string) => {
    setExpandedSolutions(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  // Çözüm Sekmesi Değiştir
  const setSolutionTab = (questionId: string, tab: 'all' | 'approach1' | 'approach2' | 'trap') => {
    setActiveSolutionTab(prev => ({
      ...prev,
      [questionId]: tab
    }));
  };

  // Soruyu Öğrencinin Takvimine Etüt Olarak Ekle
  const handleAddTaskToCalendar = (q: BankQuestion) => {
    const today = new Date().toISOString().split('T')[0];
    const newTask = {
      id: `task-qb-${Date.now()}`,
      studentId,
      title: `[Soru Bankası] ${q.topicName} Pekiştirme`,
      subjectName: q.subjectName,
      topicName: q.topicName,
      taskType: 'QUESTION_BANK' as const,
      date: today,
      startTime: '16:00',
      endTime: '16:45',
      lessonDurationMinutes: 45,
      breakDurationMinutes: 15,
      isCompleted: false,
      counselorApproved: true,
      counselorNotes: `ÖSYM Soru Bankası: "${q.criticalConcept || q.criticalTag}" kavramı ve çoklu çözüm yolları incelenecek.`,
      target_question_count: 24,
      priority_level: 'high_priority' as const
    };

    StorageService.saveTask(newTask as any);
    setAddedTasksFeedback(prev => ({ ...prev, [q.id]: true }));
    if (onRefreshData) onRefreshData();
    setTimeout(() => {
      setAddedTasksFeedback(prev => ({ ...prev, [q.id]: false }));
    }, 3000);
  };

  // Filtrelenen Soruları ve Çözümleri A4 PDF Olarak Aç
  const handlePrintPdfBooklet = () => {
    const questionsToPrint = filteredQuestions.map((q, idx) => ({
      ...q,
      number: idx + 1
    }));

    const subjectLabel = selectedSubject === 'all' ? 'YKS Genel Soru Bankası' : filteredQuestions[0]?.subjectName || 'Soru Havuzu';

    const html = PdfGenerator.generateSolutionBookletHtml({
      title: `${subjectLabel} - ÖSYM Çoklu Çözüm Föyü`,
      topicName: searchQuery ? `Filtre: "${searchQuery}"` : 'ÖSYM & MEB Standartlarında Kritik Soru Tipleri',
      studentName,
      questions: questionsToPrint
    });

    PdfGenerator.openPrintablePdf(html);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-5 overflow-y-auto animate-fadeIn">
      <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden my-auto">
        
        {/* MODAL ÜST BAŞLIK */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-indigo-950/80 via-slate-900 to-purple-950/70 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white shadow-lg shadow-indigo-600/30">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-white">
                  MEB Müfredatı & ÖSYM Soru Bankası
                </h3>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold uppercase">
                  Çoklu Çözüm Motoru
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Klasik Analitik &bull; ⚡ 30sn Pratik Kural &bull; ⚠️ ÖSYM Çeldirici ve Tuzak Analizi
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrintPdfBooklet}
              className="hidden sm:flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
              title="Filtrelenen soruları ve çoklu çözümleri PDF olarak kaydet"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-400" />
              <span>PDF Föyü İndir</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* FİLTRELEME & ARAMA KONTROL PANELİ */}
        <div className="p-4 bg-slate-950/70 border-b border-slate-800 space-y-3">
          
          {/* Arama & Hızlı Filtre Butonları */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Konu, MEB kazanımı veya kavram ara (örn: Teğet, Sürtünme, Le Chatelier, Fotosentez)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              {/* Sınav Kategorisi Filtresi (TYT / AYT) */}
              <div className="flex rounded-xl bg-slate-900 p-0.5 border border-slate-800">
                {(['all', 'TYT', 'AYT'] as const).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      selectedCategory === cat
                        ? 'bg-indigo-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat === 'all' ? 'Tüm Sınavlar' : cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Branş, Soru Tipi ve Zorluk Seçicileri */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            
            {/* 1. Branş Seçici */}
            <div>
              <select
                value={selectedSubject}
                onChange={e => setSelectedSubject(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">📚 Tüm Branşlar (Matematik, Fen, Türkçe)</option>
                <option value="matematik">📐 İleri Matematik (AYT)</option>
                <option value="geometri">📏 Geometri (TYT-AYT)</option>
                <option value="fizik">⚡ Fizik (AYT)</option>
                <option value="kimya">🧪 Kimya (AYT)</option>
                <option value="biyoloji">🧬 Biyoloji (AYT)</option>
                <option value="turkce">📖 Türkçe & Paragraf (TYT)</option>
              </select>
            </div>

            {/* 2. Soru Tipi Seçici */}
            <div>
              <select
                value={selectedType}
                onChange={e => setSelectedType(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">🎯 Tüm Soru Tipleri</option>
                <option value="osym_cikmis_benzeri">🏛️ ÖSYM Çıkmış Benzeri</option>
                <option value="oncullu_kesinlik">⚖️ Öncüllü (I-II-III) Kesinlik</option>
                <option value="yeni_nesil_hikayeli">🧩 Yeni Nesil & Hikayeli Modelleme</option>
                <option value="grafik_yorumlama">📊 Grafik & Şekil Yorumlama</option>
                <option value="kavram_yanilgisi_tuzak">⚠️ Kavram Yanılgısı & Çeldirici Tuzağı</option>
              </select>
            </div>

            {/* 3. Zorluk Seviyesi Seçici */}
            <div>
              <select
                value={selectedDifficulty}
                onChange={e => setSelectedDifficulty(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">🔥 Tüm Zorluk Seviyeleri</option>
                <option value="temel">🟢 Temel Seviye (Kazanım Kavrama)</option>
                <option value="osym_tipi">🟡 ÖSYM Standart Seviye</option>
                <option value="zor_tuzak">🔴 İleri Düzey & Çeldirici Tuzak</option>
              </select>
            </div>

          </div>

          {/* Sonuç Sayacı */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span>
              Filtrelenen Soru Sayısı: <strong className="text-cyan-300 font-mono">{filteredQuestions.length} Soru</strong>
            </span>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-slate-400">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span> 1. Yol: Analitik
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> 2. Yol: Pratik
              </span>
              <span className="flex items-center gap-1 text-rose-400">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span> 3. Yol: ÖSYM Tuzağı
              </span>
            </div>
          </div>

        </div>

        {/* SORU LİSTESİ VE ÇOKLU ÇÖZÜMLER (SCROLLABLE GÖVDE) */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-slate-950/40">
          
          {filteredQuestions.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-slate-900/60 border border-dashed border-slate-800 space-y-3">
              <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
              <div className="text-sm font-bold text-slate-300">
                Seçtiğiniz filtrelere uygun soru bulunamadı.
              </div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Farklı bir ders, soru tipi seçebilir veya arama kutusunu temizleyerek soru havuzunu genişletebilirsiniz.
              </p>
              <button
                onClick={() => {
                  setSelectedSubject('all');
                  setSelectedCategory('all');
                  setSelectedType('all');
                  setSelectedDifficulty('all');
                  setSearchQuery('');
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-xs font-semibold transition"
              >
                Tüm Filtreleri Sıfırla
              </button>
            </div>
          ) : (
            filteredQuestions.map((q, idx) => {
              const selectedOpt = selectedAnswers[q.id];
              const isAnswered = Boolean(selectedOpt);
              const isCorrect = selectedOpt === q.correctAnswer;
              const isExpanded = expandedSolutions[q.id];
              const currentTab = activeSolutionTab[q.id] || 'all';
              const taskAdded = addedTasksFeedback[q.id];

              return (
                <div
                  key={q.id}
                  className="rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 p-5 sm:p-6 shadow-xl space-y-4 transition"
                >
                  
                  {/* Soru Üst Bilgi Rozetleri */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-800/80">
                    <div className="flex items-center space-x-2 flex-wrap">
                      <span className="w-7 h-7 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-bold text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-xs text-white">
                        {q.subjectName}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        &bull; {q.topicName}
                      </span>
                      {q.mebOutcomeCode && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                          MEB {q.mebOutcomeCode}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 self-start sm:self-auto flex-wrap">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        {q.questionTypeLabel}
                      </span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-400" />
                        {q.targetTimeSeconds} sn
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase ${
                        q.difficulty === 'temel'
                          ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                          : q.difficulty === 'zor_tuzak'
                          ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                          : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
                      }`}>
                        {q.difficulty === 'temel' ? 'Temel' : q.difficulty === 'zor_tuzak' ? 'Tuzak / İleri' : 'ÖSYM Tipi'}
                      </span>
                    </div>
                  </div>

                  {/* Soru Metni */}
                  <div className="text-xs sm:text-sm text-slate-100 font-medium leading-relaxed whitespace-pre-wrap">
                    {q.questionText}
                  </div>

                  {/* Şıklar Grid'i (Etkileşimli Seçim) */}
                  <div className="space-y-2 pt-1">
                    {Object.entries(q.options).map(([optKey, optVal]) => {
                      const isOptionSelected = selectedOpt === optKey;
                      const isOptionCorrect = optKey === q.correctAnswer;
                      
                      let optionStyle = 'bg-slate-950/70 border-slate-800 text-slate-200 hover:border-slate-700 hover:bg-slate-950';
                      
                      if (isAnswered) {
                        if (isOptionCorrect) {
                          optionStyle = 'bg-emerald-500/15 border-emerald-500/50 text-emerald-200 font-semibold';
                        } else if (isOptionSelected && !isOptionCorrect) {
                          optionStyle = 'bg-rose-500/15 border-rose-500/50 text-rose-200 font-semibold';
                        }
                      }

                      return (
                        <button
                          key={optKey}
                          onClick={() => handleSelectOption(q.id, optKey)}
                          className={`w-full text-left p-3 rounded-2xl border transition flex items-center space-x-3 text-xs ${optionStyle}`}
                        >
                          <span className={`w-6 h-6 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                            isAnswered && isOptionCorrect
                              ? 'bg-emerald-500 text-white'
                              : isAnswered && isOptionSelected
                              ? 'bg-rose-500 text-white'
                              : 'bg-slate-800 text-slate-300'
                          }`}>
                            {optKey}
                          </span>
                          <span className="flex-1">{optVal}</span>
                          {isAnswered && isOptionCorrect && (
                            <span className="text-[10px] text-emerald-400 font-bold px-2 py-0.5 rounded-full bg-emerald-500/20">
                              ✓ Doğru Cevap
                            </span>
                          )}
                          {isAnswered && isOptionSelected && !isOptionCorrect && (
                            <span className="text-[10px] text-rose-400 font-bold px-2 py-0.5 rounded-full bg-rose-500/20">
                              ✗ Seçilen Çeldirici
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Alt Kontrol Barı: Çözümü Aç / Kapa & Hızlı Aksiyonlar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleSolution(q.id)}
                        className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                          isExpanded
                            ? 'bg-indigo-600 text-white shadow'
                            : 'bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30'
                        }`}
                      >
                        <Sparkles className="w-4 h-4 text-cyan-300" />
                        <span>{isExpanded ? 'Çözüm Motorunu Gizle' : 'Çoklu Çözüm Motorunu Aç (3 Yol)'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {q.criticalTag && (
                        <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-amber-300 font-medium px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20">
                          <Target className="w-3 h-3 text-amber-400" />
                          <span>Kazanım: {q.criticalTag}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 self-end sm:self-auto">
                      <button
                        onClick={() => handleAddTaskToCalendar(q)}
                        disabled={taskAdded}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition"
                        title="Bu konuyu öğrencinin haftalık takvimine etüt görevi olarak tanımla"
                      >
                        {taskAdded ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Plus className="w-3.5 h-3.5 text-indigo-400" />}
                        <span>{taskAdded ? 'Takvime Eklendi ✓' : '+ Takvime Ata'}</span>
                      </button>

                      {onLaunchLiveTest && (
                        <button
                          onClick={() => onLaunchLiveTest(q.topicName)}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:brightness-110 text-white text-xs font-bold flex items-center space-x-1.5 shadow transition"
                          title="Bu konuda kronometreli 12 kritik AI testini başlat"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>12 Kritik Test Başlat &rarr;</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ÇOKLU ÇÖZÜM MOTORU (AKORDEON AÇILDIĞINDA) */}
                  {isExpanded && (
                    <div className="pt-3 space-y-3 animate-fadeIn">
                      
                      {/* Çözüm Yolu Sekmeleri */}
                      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 overflow-x-auto text-xs">
                        <button
                          onClick={() => setSolutionTab(q.id, 'all')}
                          className={`px-3 py-1.5 rounded-lg font-bold transition ${
                            currentTab === 'all'
                              ? 'bg-slate-800 text-white border border-slate-700'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Tüm Yolları Göster (1 + 2 + 3)
                        </button>
                        <button
                          onClick={() => setSolutionTab(q.id, 'approach1')}
                          className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                            currentTab === 'approach1'
                              ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                              : 'text-slate-400 hover:text-indigo-300'
                          }`}
                        >
                          <span>📘 1. Yol: Analitik Çözüm</span>
                        </button>
                        <button
                          onClick={() => setSolutionTab(q.id, 'approach2')}
                          className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                            currentTab === 'approach2'
                              ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                              : 'text-slate-400 hover:text-emerald-300'
                          }`}
                        >
                          <span>⚡ 2. Yol: Pratik Kural</span>
                        </button>
                        <button
                          onClick={() => setSolutionTab(q.id, 'trap')}
                          className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                            currentTab === 'trap'
                              ? 'bg-rose-600/30 text-rose-300 border border-rose-500/40'
                              : 'text-slate-400 hover:text-rose-300'
                          }`}
                        >
                          <span>⚠️ 3. Yol: ÖSYM Çeldiricisi</span>
                        </button>
                      </div>

                      {/* 1. YOL: STANDART ANALİTİK ÇÖZÜM */}
                      {(currentTab === 'all' || currentTab === 'approach1') && (
                        <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-1.5 text-xs">
                          <div className="font-bold text-indigo-300 flex items-center gap-2">
                            <span>📘 1. Yol: Standart Analitik ve Formüllü Akademik Çözüm</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                              Adım Adım
                            </span>
                          </div>
                          <div className="text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                            {q.solutions.approach1}
                          </div>
                        </div>
                      )}

                      {/* 2. YOL: PRATİK KURAL & SINAV KESTİRMESİ */}
                      {(currentTab === 'all' || currentTab === 'approach2') && (
                        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 space-y-1.5 text-xs">
                          <div className="font-bold text-emerald-300 flex items-center gap-2">
                            <span>⚡ 2. Yol: Pratik Kural & Süre Kurtaran Sınav Kestirmesi</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                              30 Saniye Kuralı
                            </span>
                          </div>
                          <div className="text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                            {q.solutions.approach2}
                          </div>
                        </div>
                      )}

                      {/* 3. YOL: ÖSYM ÇELDİRİCİSİ VE KAVRAM YANILGISI TUZAĞI */}
                      {(currentTab === 'all' || currentTab === 'trap') && (
                        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 space-y-1.5 text-xs">
                          <div className="font-bold text-rose-300 flex items-center gap-2">
                            <span>⚠️ 3. Yol: ÖSYM Çeldirici Analizi & Sık Düşülen Kavram Yanılgısı</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">
                              Kritik Uyarı
                            </span>
                          </div>
                          <div className="text-rose-200/90 leading-relaxed whitespace-pre-wrap font-sans">
                            {q.solutions.commonTrap}
                          </div>
                        </div>
                      )}

                    </div>
                  )}

                </div>
              );
            })
          )}

        </div>

        {/* MODAL ALT ÇUBUK */}
        <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center text-xs text-slate-500">
          <div>
            Vira Akademi &bull; MEB Müfredatı Destekli ÖSYM Soru Bankası Motoru
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
          >
            Kapat
          </button>
        </div>

      </div>
    </div>
  );
};
