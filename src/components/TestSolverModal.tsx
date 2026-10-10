'use client';

import React, { useState } from 'react';
import { SAMPLE_CRITICAL_12_QUESTIONS } from '@/data/seedData';
import { CriticalQuestion, StudentCriticalDeficit } from '@/types';
import { PdfGenerator } from '@/lib/pdfGenerator';
import { StorageService } from '@/lib/storage';
import confetti from 'canvas-confetti';
import { 
  X, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  Download, 
  FileText, 
  Lightbulb, 
  AlertTriangle,
  RotateCcw,
  BookOpen,
  Lock,
  Unlock,
  Check,
  ChevronLeft,
  ChevronRight,
  Printer,
  Clock,
  Timer,
  Zap,
  Flame,
  Gauge
} from 'lucide-react';

interface TestSolverModalProps {
  isOpen: boolean;
  topicName: string;
  studentId?: string;
  studentName?: string;
  onClose: () => void;
  onFinishedTest?: (net: number, successRate: number) => void;
}

export const TestSolverModal: React.FC<TestSolverModalProps> = ({
  isOpen,
  topicName,
  studentId = 'student-1',
  studentName = 'Barış Deniz',
  onClose,
  onFinishedTest
}) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [showMultiSolution, setShowMultiSolution] = useState(false);
  const [viewTab, setViewTab] = useState<'INTERACTIVE' | 'OPTICAL_GRID'>('INTERACTIVE');

  // Soru Başına Süre & Zaman Yönetimi / Panik Analizi State'leri
  const [questionTimes, setQuestionTimes] = useState<Record<number, number>>({
    1: 45, 2: 52, 3: 40, 4: 65, 5: 38, 6: 70, 7: 85, 8: 45, 9: 60, 10: 95, 11: 50, 12: 55
  });
  const [currentQuestionSeconds, setCurrentQuestionSeconds] = useState(0);
  const [totalTimerSeconds, setTotalTimerSeconds] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(true);

  // Canlı Saniye Sayacı (Her soru için ve toplam test için)
  React.useEffect(() => {
    let interval: any = null;
    if (isOpen && !isSubmitted && isTimerActive) {
      interval = setInterval(() => {
        setTotalTimerSeconds(prev => prev + 1);
        setCurrentQuestionSeconds(prev => prev + 1);
        // Aktif soruya saniyeyi kaydet
        const qNum = activeQuestionIndex + 1;
        setQuestionTimes(prev => ({
          ...prev,
          [qNum]: (prev[qNum] || 0) + 1
        }));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, isSubmitted, isTimerActive, activeQuestionIndex]);

  // Soru değiştiğinde mevcut soru sayacını sıfırla
  const handleSwitchQuestion = (newIndex: number) => {
    setActiveQuestionIndex(newIndex);
    setCurrentQuestionSeconds(0);
  };

  if (!isOpen) return null;

  const questions = SAMPLE_CRITICAL_12_QUESTIONS;
  const currentQ = questions[activeQuestionIndex];

  // Şık seçimi (1..12 için 'A' | 'B' | 'C' | 'D' | 'E' | '')
  const handleSelectOption = (qNumber: number, optionKey: string) => {
    if (isSubmitted) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [qNumber]: prev[qNumber] === optionKey ? '' : optionKey
    }));
  };

  // 1. Temiz Soru Kitapçığı PDF İndir (Çözümsüz / Resmi Format)
  const handleDownloadQuestionPdf = () => {
    const html = PdfGenerator.generateQuestionBookletHtml({
      title: `${topicName} - 12 Kritik Soru Testi`,
      topicName,
      studentName,
      questions
    });
    PdfGenerator.openPrintablePdf(html);
  };

  // 2. Cevapları Onayla ve Kilit Aç
  const handleFinish = () => {
    setIsSubmitted(true);
    setShowMultiSolution(true);

    let correct = 0;
    let incorrect = 0;
    let empty = 0;
    const failedConcepts: string[] = [];

    questions.forEach(q => {
      const ans = selectedAnswers[q.number];
      if (!ans) {
        empty++;
      } else if (ans === q.correctAnswer) {
        correct++;
      } else {
        incorrect++;
        if (q.criticalTag) {
          failedConcepts.push(q.criticalTag);
          // Sistem öğrencinin panosuna aktif eksik kaydı atsın
          const newDeficit: StudentCriticalDeficit = {
            id: `deficit-${Date.now()}-${q.number}`,
            student_id: studentId,
            tag_id: `tag-${q.number}`,
            status: 'active_warning',
            critical_concept: q.criticalTag,
            common_student_pitfall: q.solutions.commonTrap,
            topic_name: topicName,
            subject_name: 'Fizik (AYT)',
            detected_at: new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
          };
          StorageService.addStudentCriticalDeficit(newDeficit);
        }
      }
    });

    const net = Math.max(0, correct - (incorrect * 0.25));
    const successRate = (net / questions.length) * 100;

    // Panik ve Süre Analizi Hesapla:
    // ÖSYM hedefi: Sayısal sorularda ortalama 75 saniye (1.25 dk). 120 saniyeyi aşanlar panik/tuzak adayıdır.
    const panicAlerts = questions.map(q => {
      const spent = questionTimes[q.number] || 45;
      const isCorrect = selectedAnswers[q.number] === q.correctAnswer;
      const targetSec = 75; // ÖSYM Sayısal Soru Başına Hedef Süre

      let analysisText = 'İdeal Çözüm Hızı';
      if (spent > 110 && !isCorrect) {
        analysisText = '⚠️ Panik Tuzağı: Süre 1.8x aşıldı ve çeldiriciye takılındı!';
      } else if (spent > 110 && isCorrect) {
        analysisText = '⏳ Aşırı Zaman Harcandı: Doğru çözüldü ancak 2+ soru süresi harcandı.';
      } else if (spent < 25 && !isCorrect) {
        analysisText = '⚡ Acele Hata: Çok hızlı işaretlendi, soru kökü dikkatsiz okunmuş olabilir.';
      } else if (spent <= 60 && isCorrect) {
        analysisText = '🚀 Mükemmel Hız: Hedef sürenin altında tam isabet!';
      }

      return {
        questionNumber: q.number,
        secondsSpent: spent,
        targetSeconds: targetSec,
        isCorrect,
        analysisText
      };
    });

    const totalSpent = Object.values(questionTimes).reduce((a, b) => a + b, 0) || totalTimerSeconds || 600;
    const avgSpent = Math.round(totalSpent / questions.length);

    try {
      confetti({
        particleCount: 80,
        spread: 90,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // ignore
    }

    // Submission kaydet (Zaman Analizli)
    StorageService.saveQuizSubmission({
      id: `sub-${Date.now()}`,
      quiz_id: 'quiz-newton-12',
      student_id: studentId,
      student_answers: selectedAnswers,
      correct_count: correct,
      incorrect_count: incorrect,
      empty_count: empty,
      net_count: Number(net.toFixed(2)),
      is_solution_unlocked: true,
      submitted_at: new Date().toISOString(),
      question_times_seconds: questionTimes,
      total_duration_seconds: totalSpent,
      average_seconds_per_question: avgSpent,
      panic_alerts: panicAlerts
    });

    if (onFinishedTest) {
      onFinishedTest(net, successRate);
    }
  };

  // 3. Detaylı Çözümlü Kitapçık PDF İndir (Sadece onaylandıktan sonra)
  const handleDownloadSolutionPdf = () => {
    let correct = 0;
    let incorrect = 0;
    let empty = 0;
    questions.forEach(q => {
      const ans = selectedAnswers[q.number];
      if (!ans) empty++;
      else if (ans === q.correctAnswer) correct++;
      else incorrect++;
    });
    const net = Math.max(0, correct - (incorrect * 0.25));

    const html = PdfGenerator.generateSolutionBookletHtml({
      title: `${topicName} - Detaylı Çözüm Rehberi`,
      topicName,
      studentName,
      scoreSummary: { correct, incorrect, empty, net },
      questions,
      studentAnswers: selectedAnswers
    });
    PdfGenerator.openPrintablePdf(html);
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setIsSubmitted(false);
    setShowMultiSolution(false);
    setActiveQuestionIndex(0);
  };

  // İstatistikler
  let correctCount = 0;
  let incorrectCount = 0;
  let emptyCount = 0;
  questions.forEach(q => {
    const ans = selectedAnswers[q.number];
    if (!ans) emptyCount++;
    else if (ans === q.correctAnswer) correctCount++;
    else incorrectCount++;
  });
  const netScore = Math.max(0, correctCount - (incorrectCount * 0.25));
  const successPercentage = ((netScore / questions.length) * 100).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col text-white">
        
        {/* Üst Bant: Vira Logo, Konu Adı, Soru Sayısı ve Temiz PDF İndir Butonu */}
        <div className="p-4 sm:p-5 bg-slate-950/90 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-md font-black text-sm tracking-wider">
              VİRA
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-base text-white">
                  {topicName}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  12 Soru (ÖSYM Formatı)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Kritik kavram tuzaklarını çözün; cevapları onaylayınca detaylı çözümlü kitapçık kilidi açılır.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 self-end sm:self-center">
            {/* Canlı Sayaç & Soru Başına Süre Göstergesi */}
            <div className="flex items-center space-x-2 bg-slate-900/90 border border-slate-700/80 px-3 py-1.5 rounded-xl shadow-inner text-xs">
              <div className="flex items-center space-x-1.5 text-cyan-400 font-mono font-bold">
                <Timer className="w-4 h-4 animate-spin text-cyan-400" style={{ animationDuration: '4s' }} />
                <span>
                  {Math.floor(totalTimerSeconds / 60)}:{(totalTimerSeconds % 60).toString().padStart(2, '0')}
                </span>
              </div>
              <div className="h-4 w-px bg-slate-700" />
              <div className="flex items-center space-x-1 text-[11px] text-slate-300 font-mono">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Bu Soru: <strong className={`${currentQuestionSeconds > 90 ? 'text-rose-400 font-bold' : 'text-amber-300'}`}>{currentQuestionSeconds}sn</strong></span>
              </div>
            </div>

            {/* Soru Kitapçığını İndir Butonu (Temiz Test PDF) */}
            <button
              onClick={handleDownloadQuestionPdf}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition hover:scale-105 active:scale-95"
              title="Cevapsız, sadece soruların yer aldığı resmi sınav kitapçığını yazdır veya PDF olarak kaydet"
            >
              <Printer className="w-3.5 h-3.5 text-cyan-400" />
              <span>Soru Kitapçığını İndir (PDF)</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Görünüm Geçiş Sekmeleri: Soru Görünümü vs Hızlı Optik Form */}
        <div className="px-5 pt-3 pb-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewTab('INTERACTIVE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                viewTab === 'INTERACTIVE'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              📖 Soru Soru Çözüm Ekranı
            </button>
            <button
              onClick={() => setViewTab('OPTICAL_GRID')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                viewTab === 'OPTICAL_GRID'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              ⚡ 12 Soruluk Optik Cevap Izgarası
            </button>
          </div>

          {/* Soru Durum Sayacı */}
          <div className="text-xs text-slate-400 font-mono hidden sm:block">
            İşaretlenen: <strong className="text-white">{Object.values(selectedAnswers).filter(Boolean).length}</strong> / 12
          </div>
        </div>

        {/* Ana İçerik */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* TAB 1: INTERAKTİF SORU GÖRÜNÜMÜ */}
          {viewTab === 'INTERACTIVE' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Sol: Soru Kartı */}
              <div className="lg:col-span-8 space-y-4">
                <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider">
                      Soru {currentQ.number} / {questions.length}
                    </span>
                    {currentQ.criticalTag && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                        Kavram: {currentQ.criticalTag}
                      </span>
                    )}
                  </div>

                  <p className="text-sm sm:text-base font-semibold text-slate-100 leading-relaxed mb-6 whitespace-pre-line">
                    {currentQ.questionText}
                  </p>

                  {/* Şıklar */}
                  <div className="space-y-2.5">
                    {Object.entries(currentQ.options).map(([key, val]) => {
                      const isSelected = selectedAnswers[currentQ.number] === key;
                      const isCorrect = currentQ.correctAnswer === key;

                      let btnStyle = "bg-slate-800/80 border-slate-700 hover:bg-slate-800 hover:border-slate-600 text-slate-200";
                      if (isSelected) {
                        btnStyle = "bg-indigo-600 text-white border-indigo-400 shadow-md";
                      }
                      if (isSubmitted) {
                        if (isCorrect) {
                          btnStyle = "bg-emerald-600/30 text-emerald-200 border-emerald-500 font-bold";
                        } else if (isSelected && !isCorrect) {
                          btnStyle = "bg-rose-600/30 text-rose-200 border-rose-500";
                        }
                      }

                      return (
                        <button
                          key={key}
                          onClick={() => handleSelectOption(currentQ.number, key)}
                          disabled={isSubmitted}
                          className={`w-full p-3.5 rounded-xl border text-left text-xs sm:text-sm font-medium transition flex items-center space-x-3 ${btnStyle}`}
                        >
                          <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                            isSelected ? 'bg-white text-indigo-700' : 'bg-slate-700 text-slate-200'
                          }`}>
                            {key}
                          </span>
                          <span className="flex-1">{val}</span>
                          {isSubmitted && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                          {isSubmitted && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Soru Gezinme Butonları */}
                <div className="flex items-center justify-between">
                  <button
                    disabled={activeQuestionIndex === 0}
                    onClick={() => handleSwitchQuestion(activeQuestionIndex - 1)}
                    className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 disabled:opacity-40 transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Önceki Soru</span>
                  </button>

                  <span className="text-xs text-slate-400 font-mono">
                    {activeQuestionIndex + 1} / {questions.length}
                  </span>

                  <button
                    disabled={activeQuestionIndex === questions.length - 1}
                    onClick={() => handleSwitchQuestion(activeQuestionIndex + 1)}
                    className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 disabled:opacity-40 transition"
                  >
                    <span>Sonraki Soru</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Sağ: Soru Numaratörü & Hızlı Seçim */}
              <div className="lg:col-span-4 space-y-4">
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                  <div className="text-xs font-bold text-slate-300 mb-3 flex items-center justify-between">
                    <span>Hızlı Soru Seçici</span>
                    <span className="text-[10px] text-cyan-400 font-mono">12 Soru</span>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {questions.map((q, idx) => {
                      const ans = selectedAnswers[q.number];
                      const isCurrent = activeQuestionIndex === idx;
                      let statusBg = "bg-slate-800 text-slate-400 border-slate-700";

                      if (ans) {
                        statusBg = "bg-indigo-600/40 text-indigo-300 border-indigo-500 font-bold";
                      }
                      if (isCurrent) {
                        statusBg += " ring-2 ring-cyan-400";
                      }
                      if (isSubmitted) {
                        if (ans === q.correctAnswer) statusBg = "bg-emerald-600/40 text-emerald-300 border-emerald-500";
                        else if (ans) statusBg = "bg-rose-600/40 text-rose-300 border-rose-500";
                        else statusBg = "bg-slate-800 text-slate-500 border-slate-700";
                      }

                      return (
                        <button
                          key={q.number}
                          onClick={() => handleSwitchQuestion(idx)}
                          className={`p-2 rounded-xl border text-xs font-mono transition flex flex-col items-center justify-center ${statusBg}`}
                        >
                          <span className="font-bold">{q.number}</span>
                          <span className="text-[10px] mt-0.5">{ans || '-'}</span>
                          <span className={`text-[9px] mt-0.5 font-sans ${
                            (questionTimes[q.number] || 0) > 100 
                              ? 'text-rose-400 font-bold' 
                              : (questionTimes[q.number] || 0) > 75 
                              ? 'text-amber-400' 
                              : 'text-slate-400'
                          }`}>
                            {questionTimes[q.number] || 0}s
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Soru İpucu veya Kritik Faktör */}
                {currentQ.criticalFactor && (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
                    <div className="flex items-center space-x-1.5 text-xs font-bold mb-1">
                      <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <span>ÖSYM Tuzak Analizi</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {currentQ.criticalFactor}
                    </p>
                  </div>
                )}
              </div>

            </div>
          ) : (
            /* TAB 2: OPTİK CEVAP GİRİŞ IZGARASI (12 SORULUK OPTİK FORM) */
            <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h4 className="font-bold text-sm text-white">12 Soruluk Optik Cevap Kağıdı</h4>
                  <p className="text-xs text-slate-400">PDF çıktısından çözdüğünüz şıkları tek tek veya hızlıca işaretleyin.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedAnswers({})}
                  disabled={isSubmitted}
                  className="text-xs text-slate-400 hover:text-rose-400 transition"
                >
                  Tümünü Temizle
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                {questions.map(q => {
                  const currentChoice = selectedAnswers[q.number] || '';
                  const isCorrect = q.correctAnswer === currentChoice;

                  return (
                    <div 
                      key={q.number}
                      className="flex items-center justify-between py-2 px-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:bg-slate-800/40 transition"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="w-6 font-mono font-bold text-xs text-slate-300">{q.number}.</span>
                        <span className="text-[11px] text-slate-400 truncate max-w-[120px]" title={q.criticalTag || q.topic}>
                          {q.criticalTag || `Soru ${q.number}`}
                        </span>
                      </div>

                      {/* Optik Şıklar A B C D E */}
                      <div className="flex items-center space-x-1.5">
                        {['A', 'B', 'C', 'D', 'E'].map(opt => {
                          const isSelected = currentChoice === opt;
                          let bubbleClass = "w-7 h-7 rounded-full border text-xs font-mono font-bold flex items-center justify-center transition";

                          if (isSelected) {
                            bubbleClass += " bg-indigo-600 text-white border-indigo-400 shadow-md scale-105";
                          } else {
                            bubbleClass += " bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white";
                          }

                          if (isSubmitted) {
                            if (q.correctAnswer === opt) {
                              bubbleClass = "w-7 h-7 rounded-full border text-xs font-mono font-bold flex items-center justify-center bg-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-500/50";
                            } else if (isSelected && q.correctAnswer !== opt) {
                              bubbleClass = "w-7 h-7 rounded-full border text-xs font-mono font-bold flex items-center justify-center bg-rose-600 text-white border-rose-400";
                            }
                          }

                          return (
                            <button
                              key={opt}
                              type="button"
                              disabled={isSubmitted}
                              onClick={() => handleSelectOption(q.number, opt)}
                              className={bubbleClass}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SONUÇ VE KİLİT AÇMA KARTI (Cevaplar Onaylanınca Açılır) */}
          {isSubmitted && (
            <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-emerald-500/40 shadow-xl space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-base text-white">
                      Test Tamamlandı! Skorunuz & Çözüm Kilidi Açıldı
                    </h4>
                    <p className="text-xs text-slate-400">
                      Doğru ve yanlışlarınız sistem tarafından analiz edildi. Detaylı çözümlü kitapçığı aşağıdan inceleyebilirsiniz.
                    </p>
                  </div>
                </div>

                {/* Skor Rozetleri */}
                <div className="flex items-center space-x-3 bg-slate-900 p-2 rounded-xl border border-slate-800">
                  <div className="text-center px-2">
                    <div className="text-[10px] text-slate-400 uppercase">Doğru</div>
                    <div className="text-base font-bold text-emerald-400">{correctCount}</div>
                  </div>
                  <div className="text-center px-2 border-l border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase">Yanlış</div>
                    <div className="text-base font-bold text-rose-400">{incorrectCount}</div>
                  </div>
                  <div className="text-center px-2 border-l border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase">Boş</div>
                    <div className="text-base font-bold text-slate-400">{emptyCount}</div>
                  </div>
                  <div className="text-center px-3 border-l border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase">Net</div>
                    <div className="text-lg font-black text-cyan-300 font-mono">{netScore.toFixed(2)}</div>
                  </div>
                </div>
              </div>

              {/* YENİ MODÜL: Soru Başına Süre & Zaman Yönetimi / Panik Analiz Kartı */}
              <div className="p-4 rounded-xl bg-slate-950/90 border border-cyan-500/30 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                  <div className="flex items-center space-x-2">
                    <Gauge className="w-5 h-5 text-cyan-400" />
                    <div>
                      <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>Zaman Yönetimi, Soru Hızı & Panik Analizi</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                          ÖSYM Sayısal Hedef: 75sn/Soru
                        </span>
                      </h5>
                      <p className="text-[11px] text-slate-400">
                        Hangi soruda gereksiz vakit kaybedildi veya aceleyle çeldiriciye düşüldü analizi.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block uppercase">Toplam Süre</span>
                      <span className="font-bold text-cyan-300">
                        {Math.floor(totalTimerSeconds / 60)} dk {totalTimerSeconds % 60} sn
                      </span>
                    </div>
                    <div className="h-6 w-px bg-slate-800" />
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block uppercase">Ortalama Hız</span>
                      <span className="font-bold text-emerald-400">
                        {Math.round(totalTimerSeconds / questions.length)} sn / soru
                      </span>
                    </div>
                  </div>
                </div>

                {/* Soru Başına Süre Dağılım Çizelgesi */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 pt-1">
                  {questions.map(q => {
                    const spent = questionTimes[q.number] || 45;
                    const ans = selectedAnswers[q.number];
                    const isCorrect = ans === q.correctAnswer;
                    
                    let speedBadge = "bg-emerald-500/10 text-emerald-300 border-emerald-500/30";
                    let speedText = "İdeal Hız";
                    if (spent > 100 && !isCorrect) {
                      speedBadge = "bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse";
                      speedText = "⚠️ Panik / Tuzak";
                    } else if (spent > 100 && isCorrect) {
                      speedBadge = "bg-amber-500/20 text-amber-300 border-amber-500/40";
                      speedText = "⏳ Yavaş Doğru";
                    } else if (spent < 30 && !isCorrect) {
                      speedBadge = "bg-purple-500/20 text-purple-300 border-purple-500/40";
                      speedText = "⚡ Acele Hata";
                    } else if (spent <= 60 && isCorrect) {
                      speedBadge = "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold";
                      speedText = "🚀 Seri Doğru";
                    }

                    return (
                      <div key={q.number} className={`p-2.5 rounded-xl border ${speedBadge} space-y-1`}>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono font-bold">Soru {q.number}</span>
                          <span className="font-mono font-black">{spent}sn</span>
                        </div>
                        <div className="text-[10px] font-semibold truncate" title={speedText}>
                          {speedText}
                        </div>
                        <div className="text-[9px] text-slate-400 flex items-center justify-between">
                          <span>{ans ? `Cevap: ${ans}` : 'Boş'}</span>
                          <span className={isCorrect ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                            {isCorrect ? '✓ Doğru' : '✗ Yanlış'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Çözümlü Belge Kilidi Butonu */}
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-2.5">
                  <Unlock className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-emerald-300">
                      Detaylı Çözümlü Kitapçık Kilidi Açıldı!
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Her sorunun formüllü standart çözümü, pratik kuralı ve ÖSYM çeldirici analizi hazırlanmıştır.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadSolutionPdf}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md transition hover:scale-105 active:scale-95 flex items-center justify-center space-x-2 flex-shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>Detaylı Çözümlü Kitapçığı Aç / İndir (PDF)</span>
                </button>
              </div>

              {/* Yanlış Yapılan Soruların Kritik Kavram Listesi */}
              {incorrectCount > 0 && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 space-y-2">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-rose-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Tespit Edilen Kritik Eksik Kavramlar (AI Radar Bildirimi Gönderildi):</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {questions.filter(q => selectedAnswers[q.number] && selectedAnswers[q.number] !== q.correctAnswer).map(q => (
                      <div key={q.number} className="p-2 rounded-lg bg-slate-900 border border-rose-500/30 flex items-start space-x-2">
                        <span className="font-mono font-bold text-rose-400">{q.number}.</span>
                        <div>
                          <div className="font-bold text-white text-[11px]">{q.criticalTag || q.topic}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{q.solutions.commonTrap}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Alt Footer & Aksiyon Butonları */}
        <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between flex-shrink-0">
          <div className="text-xs text-slate-400">
            {!isSubmitted ? (
              <span>12 soruyu çözüp onayladıktan sonra detaylı çözümler açılacaktır.</span>
            ) : (
              <span className="text-emerald-400 font-semibold">Çözümler aktif edildi. İstediğiniz zaman PDF olarak indirebilirsiniz.</span>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {isSubmitted ? (
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Testi Sıfırla</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:brightness-110 text-white font-bold text-xs transition shadow-lg shadow-indigo-600/30 active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>Cevaplarımı Onayla ve Netimi Gör</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
