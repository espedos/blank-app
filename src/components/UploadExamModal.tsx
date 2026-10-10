'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { User, ExamResult, LibraryResource, ExamType, ExamSource, SubjectNetResult } from '@/types';
import { StorageService } from '@/lib/storage';
import { calculateExamNet, calculateNormalizedSuccess, estimateOsymScore, calculateSimulatedOsymScore } from '@/lib/scoreCalculator';
import { 
  X, 
  Upload, 
  FileText, 
  CheckCircle2, 
  Sparkles, 
  BookOpen,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Percent,
  Check,
  AlertTriangle
} from 'lucide-react';

interface UploadExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  students: User[];
  defaultStudentId?: string;
}

interface SubjectEntry {
  name: string;
  totalQuestions: number;
  correct: number;
  incorrect: number;
}

const DEFAULT_TYT_SUBJECTS: SubjectEntry[] = [
  { name: 'Türkçe', totalQuestions: 40, correct: 0, incorrect: 0 },
  { name: 'Temel Matematik', totalQuestions: 30, correct: 0, incorrect: 0 },
  { name: 'Geometri', totalQuestions: 10, correct: 0, incorrect: 0 },
  { name: 'Fizik (TYT)', totalQuestions: 7, correct: 0, incorrect: 0 },
  { name: 'Kimya (TYT)', totalQuestions: 7, correct: 0, incorrect: 0 },
  { name: 'Biyoloji (TYT)', totalQuestions: 6, correct: 0, incorrect: 0 },
  { name: 'Sosyal Bilimler', totalQuestions: 20, correct: 0, incorrect: 0 },
];

const DEFAULT_AYT_SUBJECTS: SubjectEntry[] = [
  { name: 'İleri Matematik (AYT)', totalQuestions: 30, correct: 0, incorrect: 0 },
  { name: 'Geometri (AYT)', totalQuestions: 10, correct: 0, incorrect: 0 },
  { name: 'Fizik (AYT)', totalQuestions: 14, correct: 0, incorrect: 0 },
  { name: 'Kimya (AYT)', totalQuestions: 13, correct: 0, incorrect: 0 },
  { name: 'Biyoloji (AYT)', totalQuestions: 13, correct: 0, incorrect: 0 },
];

export const UploadExamModal: React.FC<UploadExamModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  students,
  defaultStudentId
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState(defaultStudentId || students[0]?.id || 'student-1');
  const [uploadType, setUploadType] = useState<'EXAM_RESULT' | 'LIBRARY_PDF'>('EXAM_RESULT');

  // Selected student details
  const currentStudent = students.find(s => s.id === selectedStudentId) || students[0];
  const isBaris = selectedStudentId === 'student-1'; // Barış Deniz: 12. Sınıf -> Kurumsal
  const isEfe = selectedStudentId === 'student-2'; // Efe Deniz: Mezun -> Bireysel

  // Exam Meta Form
  const [examTitle, setExamTitle] = useState('');
  const [examType, setExamType] = useState<ExamType>('TYT');
  const [examSource, setExamSource] = useState<ExamSource>(isBaris ? 'institutional' : 'individual');
  const [publisherOrInstitution, setPublisherOrInstitution] = useState(isBaris ? 'Özdebir Kurs Merkezi' : '3D Yayınları');
  const [examDate, setExamDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Kurumsal detaylar
  const [ranking, setRanking] = useState('');
  const [bookletType, setBookletType] = useState('A');
  const [subjectScanName, setSubjectScanName] = useState('Fizik');
  const [subjectScanTotal, setSubjectScanTotal] = useState(20);

  // Subject Results state
  const [subjects, setSubjects] = useState<SubjectEntry[]>(DEFAULT_TYT_SUBJECTS);

  // Sync examSource and publisher default when student changes
  useEffect(() => {
    const isB = selectedStudentId === 'student-1';
    const isE = selectedStudentId === 'student-2';
    if (isB) {
      setExamSource('institutional');
      setPublisherOrInstitution('Özdebir Kurs Merkezi');
    } else if (isE) {
      setExamSource('individual');
      setPublisherOrInstitution('3D Yayınları');
    }
  }, [selectedStudentId]);

  // Reset or initialize when examType changes
  useEffect(() => {
    if (examType === 'TYT') {
      setSubjects(DEFAULT_TYT_SUBJECTS.map(s => ({ ...s, correct: 0, incorrect: 0 })));
    } else if (examType === 'AYT') {
      setSubjects(DEFAULT_AYT_SUBJECTS.map(s => ({ ...s, correct: 0, incorrect: 0 })));
    } else {
      setSubjects([
        { name: `${subjectScanName} Taraması`, totalQuestions: subjectScanTotal, correct: 0, incorrect: 0 }
      ]);
    }
  }, [examType]);

  // Library Resource Form
  const [resTitle, setResTitle] = useState('');
  const [resSubject, setResSubject] = useState('İleri Matematik (AYT)');
  const [resFileName, setResFileName] = useState('');
  const [resAnswerKey, setResAnswerKey] = useState('1:A, 2:C, 3:D, 4:B, 5:E');

  // Handle D / Y change
  const handleScoreChange = (index: number, field: 'correct' | 'incorrect', value: string) => {
    const num = Math.max(0, parseInt(value || '0', 10));
    setSubjects(prev => {
      const copy = [...prev];
      const target = { ...copy[index] };
      if (field === 'correct') {
        target.correct = Math.min(target.totalQuestions, num);
        if (target.correct + target.incorrect > target.totalQuestions) {
          target.incorrect = target.totalQuestions - target.correct;
        }
      } else {
        target.incorrect = Math.min(target.totalQuestions - target.correct, num);
      }
      copy[index] = target;
      return copy;
    });
  };

  // Aggregated totals
  const totals = useMemo(() => {
    let totalQuestions = 0;
    let totalCorrect = 0;
    let totalIncorrect = 0;
    let totalNet = 0;

    const netsList = subjects.map(s => {
      const net = calculateExamNet(s.correct, s.incorrect);
      totalQuestions += s.totalQuestions;
      totalCorrect += s.correct;
      totalIncorrect += s.incorrect;
      totalNet += net;
      return { name: s.name, net };
    });

    const totalBlank = Math.max(0, totalQuestions - (totalCorrect + totalIncorrect));
    const overallSuccess = calculateNormalizedSuccess(totalNet, totalQuestions);
    
    // Aşama 2 Simülasyon Puanı
    const sim = calculateSimulatedOsymScore(examType, netsList);

    return {
      totalQuestions,
      totalCorrect,
      totalIncorrect,
      totalBlank,
      totalNet: Number(totalNet.toFixed(2)),
      overallSuccess,
      estimatedOsym: sim.simulatedScore,
      simDetail: sim
    };
  }, [subjects, examType]);

  if (!isOpen) return null;

  const handleSubmitExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examTitle.trim()) {
      alert('Lütfen bir sınav adı giriniz.');
      return;
    }

    const calculatedSubjectResults: SubjectNetResult[] = subjects.map(s => {
      const net = calculateExamNet(s.correct, s.incorrect);
      const normalizedPercentage = calculateNormalizedSuccess(net, s.totalQuestions);
      return {
        subjectName: s.name,
        totalQuestions: s.totalQuestions,
        correct: s.correct,
        incorrect: s.incorrect,
        net,
        normalizedPercentage
      };
    });

    const newExam: ExamResult = {
      id: `exam-${Date.now()}`,
      studentId: selectedStudentId,
      title: examTitle.trim() || `${publisherOrInstitution} (${examType})`,
      examType,
      date: examDate,
      totalQuestions: totals.totalQuestions,
      totalNet: totals.totalNet,
      overallSuccessPercentage: totals.overallSuccess,
      estimatedOsymScore: totals.estimatedOsym,
      simulated_score: totals.estimatedOsym,
      subjectResults: calculatedSubjectResults,
      notes: notes.trim() || undefined,
      source_type: examSource,
      exam_source: examSource,
      publisher_or_institution: publisherOrInstitution,
      publisher_name: examSource === 'individual' ? publisherOrInstitution : undefined,
      institution_name: examSource === 'institutional' ? publisherOrInstitution : undefined,
      exam_environment: examSource === 'institutional' ? 'institutional' : 'home_library',
      booklet_type: bookletType,
      ranking: (examSource === 'institutional' && ranking) ? parseInt(ranking, 10) : null
    };

    StorageService.saveExam(newExam);
    onSuccess();
    onClose();
  };

  const handleSubmitResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resTitle.trim()) return;

    const resource: LibraryResource = {
      id: `lib-${Date.now()}`,
      title: resTitle.trim(),
      category: examType === 'TYT' ? 'TYT' : 'AYT_SAYISAL',
      subjectName: resSubject,
      type: 'PDF',
      url: '/docs/ornek-deneme-fasikul.pdf',
      uploadedBy: 'Cen Danışman',
      uploadDate: new Date().toISOString().split('T')[0],
      sizeMb: 4.2,
      hasAnswerKey: true,
      answerKey: { 1: 'A', 2: 'C', 3: 'D', 4: 'B', 5: 'E' }
    };

    StorageService.saveLibraryResource(resource);
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col text-white">
        
        {/* Header */}
        <div className="p-5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white shadow-md">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">
                  Sınav, Deneme ve Tarama Sonuç Giriş Paneli
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Aşama 2 Analiz Motoru
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Doğru ve Yanlışları girin; Boş, Net ve % Normalize Başarı anlık hesaplanır. Tab ile hızlı geçiş desteklenir.
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

        {/* Tab Selector */}
        <div className="flex items-center p-2 bg-slate-950/60 border-b border-slate-800 gap-2">
          <button
            type="button"
            onClick={() => setUploadType('EXAM_RESULT')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
              uploadType === 'EXAM_RESULT'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Deneme & Tarama Optik Sonuç Girişi</span>
          </button>
          <button
            type="button"
            onClick={() => setUploadType('LIBRARY_PDF')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
              uploadType === 'LIBRARY_PDF'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Kütüphaneye Test / Fasikül Yükle</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1">
          {uploadType === 'EXAM_RESULT' ? (
            <form onSubmit={handleSubmitExam} className="space-y-5">
              
              {/* Top Row: Öğrenci, Sınav Türü, Kaynak Türü, Tarih */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs text-slate-400 font-semibold mb-1 block">Öğrenci</label>
                  <select
                    value={selectedStudentId}
                    onChange={e => setSelectedStudentId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                  >
                    {students.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.id === 'student-1' ? 'Barış - 12. Sınıf' : 'Efe - Mezun'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-semibold mb-1 block">Sınav Türü</label>
                  <select
                    value={examType}
                    onChange={e => setExamType(e.target.value as ExamType)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-bold text-cyan-300"
                  >
                    <option value="TYT">TYT (120 Soru)</option>
                    <option value="AYT">AYT (80 Soru Sayısal)</option>
                    <option value="TARAMA">Konu / Branş Taraması</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-semibold mb-1 block">Kaynak Türü</label>
                  <select
                    value={examSource}
                    onChange={e => setExamSource(e.target.value as ExamSource)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                  >
                    <option value="institutional">🏛️ Kurumsal Deneme</option>
                    <option value="individual">📖 Bireysel Deneme</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-semibold mb-1 block">Sınav Tarihi</label>
                  <input
                    type="date"
                    value={examDate}
                    onChange={e => setExamDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* Title & Publisher / Institution Name */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs text-slate-400 font-semibold mb-1 block">
                    Yayın / Kurum Adı <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    tabIndex={1}
                    value={publisherOrInstitution}
                    onChange={e => setPublisherOrInstitution(e.target.value)}
                    placeholder="Örn: 3D Yayınları, Özdebir Kurs Merkezi, A Dershanesi"
                    className="w-full bg-slate-800 border border-indigo-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </div>

                <div>
                  {examSource === 'institutional' ? (
                    <div>
                      <label className="text-xs text-amber-300 font-semibold mb-1 block truncate">
                        Kurum / İl Sıralaması
                      </label>
                      <input
                        type="number"
                        tabIndex={2}
                        value={ranking}
                        onChange={e => setRanking(e.target.value)}
                        placeholder="Örn: 142"
                        className="w-full bg-slate-800 border border-amber-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono font-bold text-center"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="text-xs text-slate-400 font-semibold mb-1 block">Kitapçık Türü</label>
                      <select
                        value={bookletType}
                        onChange={e => setBookletType(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold text-center"
                      >
                        <option value="A">A Kitapçığı</option>
                        <option value="B">B Kitapçığı</option>
                        <option value="C">C Kitapçığı</option>
                        <option value="D">D Kitapçığı</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Subject Scan Configuration */}
              {examType === 'SUBJECT_SCAN' && (
                <div className="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-500/40 grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-indigo-300 font-semibold mb-1 block">Tarama Yapılan Ders</label>
                    <input
                      type="text"
                      value={subjectScanName}
                      onChange={e => {
                        setSubjectScanName(e.target.value);
                        setSubjects([{ name: `${e.target.value} Taraması`, totalQuestions: subjectScanTotal, correct: 0, incorrect: 0 }]);
                      }}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                      placeholder="Örn: AYT Fizik (Elektrik)"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-indigo-300 font-semibold mb-1 block">Toplam Soru Sayısı</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={subjectScanTotal}
                      onChange={e => {
                        const val = parseInt(e.target.value || '20', 10);
                        setSubjectScanTotal(val);
                        setSubjects([{ name: `${subjectScanName} Taraması`, totalQuestions: val, correct: 0, incorrect: 0 }]);
                      }}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>
              )}

              {/* D / Y Grid Table with Tab Cycling */}
              <div className="border border-slate-800 rounded-2xl bg-slate-950/60 overflow-hidden shadow-inner">
                <div className="bg-slate-950/90 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <span>⚡ Ders Bazlı Doğru / Yanlış / Boş Giriş Matrisi</span>
                    <span className="text-[10px] text-indigo-400 font-normal">(Tab tuşuna basarak hızlıca geçin)</span>
                  </span>
                  <span className="text-[11px] text-emerald-400 font-mono">
                    Net = D - (Y / 4) &bull; % = (Net/Soru)&times;100
                  </span>
                </div>

                <div className="divide-y divide-slate-800/80">
                  {subjects.map((sub, index) => {
                    const currentNet = calculateExamNet(sub.correct, sub.incorrect);
                    const currentBlank = Math.max(0, sub.totalQuestions - (sub.correct + sub.incorrect));
                    const currentPercent = calculateNormalizedSuccess(currentNet, sub.totalQuestions);
                    
                    const tabIndexCorrect = 10 + index * 2;
                    const tabIndexIncorrect = 11 + index * 2;

                    const percentBadgeColor = 
                      currentPercent >= 80 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                      currentPercent >= 65 ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' :
                      currentPercent >= 50 ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                      'text-rose-400 bg-rose-500/10 border-rose-500/20';

                    return (
                      <div 
                        key={sub.name}
                        className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/30 transition"
                      >
                        {/* Subject info */}
                        <div className="w-48 flex-shrink-0">
                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>{sub.name}</span>
                            <span className="text-[10px] text-slate-400 font-normal">({sub.totalQuestions} Soru)</span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Boş: <strong className="text-slate-300">{currentBlank}</strong>
                          </div>
                        </div>

                        {/* D and Y Inputs */}
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold text-emerald-400">D:</span>
                            <input
                              type="number"
                              min={0}
                              max={sub.totalQuestions}
                              tabIndex={tabIndexCorrect}
                              value={sub.correct === 0 ? '' : sub.correct}
                              onChange={e => handleScoreChange(index, 'correct', e.target.value)}
                              placeholder="0"
                              className="w-14 bg-slate-800 border border-emerald-600/40 rounded-lg px-2 py-1 text-xs text-white font-bold text-center focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold text-rose-400">Y:</span>
                            <input
                              type="number"
                              min={0}
                              max={sub.totalQuestions}
                              tabIndex={tabIndexIncorrect}
                              value={sub.incorrect === 0 ? '' : sub.incorrect}
                              onChange={e => handleScoreChange(index, 'incorrect', e.target.value)}
                              placeholder="0"
                              className="w-14 bg-slate-800 border border-rose-600/40 rounded-lg px-2 py-1 text-xs text-white font-bold text-center focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500"
                            />
                          </div>
                        </div>

                        {/* Calculated Net and % Badge */}
                        <div className="flex items-center justify-end gap-3 flex-1">
                          <div className="text-right">
                            <div className="text-xs font-mono font-bold text-cyan-300">
                              {currentNet.toFixed(2)} Net
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {sub.correct} D - {sub.incorrect} Y
                            </div>
                          </div>

                          <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${percentBadgeColor} min-w-[70px] text-center`}>
                            %{currentPercent.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Instant Summary Footer */}
                <div className="bg-slate-950 px-4 py-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-4 text-slate-300">
                    <span>Toplam Soru: <strong className="text-white">{totals.totalQuestions}</strong></span>
                    <span>Doğru: <strong className="text-emerald-400">{totals.totalCorrect}</strong></span>
                    <span>Yanlış: <strong className="text-rose-400">{totals.totalIncorrect}</strong></span>
                    <span>Boş: <strong className="text-slate-400">{totals.totalBlank}</strong></span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400">Toplam Net:</span>
                      <strong className="text-cyan-300 text-sm font-mono">{totals.totalNet.toFixed(2)}</strong>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-slate-400">Normalize Başarı:</span>
                      <strong className="text-emerald-400 text-sm font-mono">%{totals.overallSuccess.toFixed(1)}</strong>
                    </div>

                    <div className="px-2 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold font-mono">
                      Tahmini ÖSYM: {totals.estimatedOsym}
                    </div>
                  </div>
                </div>
              </div>

              {/* Danışman Notu */}
              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1 block">
                  Danışman / Öğrenci Sınav Değerlendirme Notu
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Zaman yönetimi, özellikle zorlanılan dersler veya soru tuzakları hakkında notlar..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:brightness-110 text-white font-bold text-xs transition shadow-lg flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Sınavı Kaydet & Grafikleri Güncelle</span>
                </button>
              </div>

            </form>
          ) : (
            /* Tab 2: Library Resource Upload */
            <form onSubmit={handleSubmitResource} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1 block">Doküman / Test Başlığı</label>
                <input
                  type="text"
                  required
                  value={resTitle}
                  onChange={e => setResTitle(e.target.value)}
                  placeholder="Örn: Limit ve Süreklilik ÖSYM Çıkmış & Özel Sorular"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 font-semibold mb-1 block">Ders</label>
                  <input
                    type="text"
                    value={resSubject}
                    onChange={e => setResSubject(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-semibold mb-1 block">Dosya Seç (PDF / JPG)</label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={e => setResFileName(e.target.files?.[0]?.name || '')}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1 block flex items-center justify-between">
                  <span>Optik Cevap Anahtarı (Otomatik Okuma İçin)</span>
                  <span className="text-[10px] text-indigo-400">Ör: 1:A, 2:B, 3:E</span>
                </label>
                <input
                  type="text"
                  value={resAnswerKey}
                  onChange={e => setResAnswerKey(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold text-xs transition shadow-lg flex items-center justify-center gap-2"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Kütüphaneye Yükle & Öğrencilere Yayınla</span>
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
