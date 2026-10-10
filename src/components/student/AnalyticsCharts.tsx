'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ExamResult, StudentScoreProfile } from '@/types';
import { calculateYksSayisalScore, calculateObpContribution, estimateYksRanking, YksRankingResult } from '@/lib/scoreCalculator';
import { 
  TrendingUp, 
  BarChart3, 
  Share2, 
  Sparkles, 
  CheckCircle2, 
  HelpCircle,
  Award,
  Layers,
  Calculator,
  Calendar,
  Eye,
  EyeOff,
  Target,
  Maximize2,
  GraduationCap
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';

interface AnalyticsChartsProps {
  studentName: string;
  exams: ExamResult[];
  scoreProfile: StudentScoreProfile;
  onShareWithPeer: (snapshot: any) => void;
  student?: any;
}

const SUBJECT_COLORS: Record<string, string> = {
  'Matematik': '#3b82f6',              // Mavi
  'Temel Matematik': '#3b82f6',        // Mavi
  'İleri Matematik (AYT)': '#2563eb',  // Koyu Mavi
  'Fizik': '#ef4444',                  // Kırmızı
  'Fizik (TYT)': '#ef4444',            // Kırmızı
  'Fizik (AYT)': '#dc2626',            // Kırmızı
  'Kimya': '#eab308',                  // Sarı
  'Kimya (TYT)': '#eab308',            // Sarı
  'Kimya (AYT)': '#ca8a04',            // Sarı
  'Biyoloji': '#10b981',               // Yeşil
  'Biyoloji (TYT)': '#10b981',         // Yeşil
  'Biyoloji (AYT)': '#059669',         // Yeşil
  'Türkçe': '#8b5cf6',                 // Mor
  'Geometri': '#f97316',               // Turuncu
  'Geometri (AYT)': '#ea580c',         // Koyu Turuncu
  'Sosyal Bilimler': '#ec4899',        // Pembe
  'Genel Ortalama': '#06b6d4'          // Camgöbeği
};

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  studentName,
  exams,
  scoreProfile,
  onShareWithPeer,
  student
}) => {
  const [mounted, setMounted] = useState(false);
  const [activeView, setActiveView] = useState<'NORMALIZED' | 'OSYM_SCORE' | 'FORMULA' | 'SAYISAL_ENGINE'>('NORMALIZED');
  const [selectedExamId, setSelectedExamId] = useState<string>(exams[0]?.id || '');
  const [chartType, setChartType] = useState<'line' | 'area'>('line');

  // Interactive Legend Toggles for Normalized Chart
  const [visibleSubjects, setVisibleSubjects] = useState<Record<string, boolean>>({
    'Türkçe': true,
    'Temel Matematik': true,
    'İleri Matematik (AYT)': true,
    'Fizik (TYT)': true,
    'Fizik (AYT)': true,
    'Kimya (TYT)': true,
    'Kimya (AYT)': true,
    'Biyoloji (TYT)': true,
    'Biyoloji (AYT)': true,
    'Geometri': true,
    'Sosyal Bilimler': true,
    'Genel Ortalama': true
  });

  // Interactive comparison toggles for OSYM & Ranking chart
  const [showPreviousExam, setShowPreviousExam] = useState<boolean>(true);
  const [showTargetLines, setShowTargetLines] = useState<boolean>(true);

  // Client mounting for Recharts hydration safety
  useEffect(() => {
    setMounted(true);
  }, []);

  // Section 7.B Interactive Calculator State
  const [simNets, setSimNets] = useState({
    tytTurkceNet: 35.25,
    tytMatematikNet: 28.5,
    tytFenNet: 16.0,
    tytSosyalNet: 14.5,
    aytMatematikNet: 27.5,
    aytFizikNet: 11.25,
    aytKimyaNet: 11.0,
    aytBiyolojiNet: 10.75
  });

  const sayisalDetail = calculateYksSayisalScore(simNets);
  const activeExam = exams.find(e => e.id === selectedExamId) || exams[0];

  // Sort exams chronologically
  const sortedExams = useMemo(() => {
    return [...exams].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [exams]);

  // Transform data for Normalized Multi-Branch Chart
  const normalizedTimeSeriesData = useMemo(() => {
    return sortedExams.map(ex => {
      const point: any = {
        id: ex.id,
        date: ex.date,
        shortDate: ex.date.split('-').slice(1).join('/'),
        title: ex.title,
        examType: ex.examType,
        source: ex.source_type === 'institutional' ? 'Kurumsal' : 'Bireysel',
        institutionOrPublisher: ex.institution_name || ex.publisher_name || 'Deneme',
        ranking: ex.ranking,
        'Genel Ortalama': Number(ex.overallSuccessPercentage.toFixed(1))
      };

      ex.subjectResults.forEach(sub => {
        point[sub.subjectName] = Number(sub.normalizedPercentage.toFixed(1));
      });

      return point;
    });
  }, [sortedExams]);

  // Extract all distinct subject names across exams
  const allSubjectNames = useMemo(() => {
    const set = new Set<string>();
    exams.forEach(ex => {
      ex.subjectResults.forEach(sub => set.add(sub.subjectName));
    });
    return Array.from(set);
  }, [exams]);

  // Student OBP calculation
  const diplomaGrade = student?.diploma_grade || 90.0;
  const isBrokenObp = student?.is_broken_obp || false;
  const obpContribution = calculateObpContribution(diplomaGrade, isBrokenObp);

  // Transform data for Chronological 500-Point Target Chart
  const osymTimeSeriesData = useMemo(() => {
    return sortedExams.map((ex, index) => {
      const placementScore = Number((ex.estimatedOsymScore + obpContribution.placementContribution).toFixed(2));
      const rankingEst = estimateYksRanking(placementScore, 'SAYISAL');
      const rawRankingEst = estimateYksRanking(ex.estimatedOsymScore, 'TYT');

      return {
        id: ex.id,
        index: index + 1,
        date: ex.date,
        shortDate: ex.date.split('-').slice(1).join('/'),
        title: ex.title,
        examType: ex.examType,
        score: ex.estimatedOsymScore,
        placementScore,
        targetGap: Math.max(0, 500 - ex.estimatedOsymScore),
        successRate: Number(ex.overallSuccessPercentage.toFixed(1)),
        net: ex.totalNet,
        source: ex.source_type === 'institutional' ? 'Kurumsal' : 'Bireysel',
        publisher: ex.institution_name || ex.publisher_name || 'Deneme',
        ranking: ex.ranking,
        estimatedRank: rankingEst,
        rawEstimatedRank: rawRankingEst
      };
    });
  }, [sortedExams, obpContribution.placementContribution]);

  const toggleSubject = (name: string) => {
    setVisibleSubjects(prev => ({
      ...prev,
      [name]: prev[name] === undefined ? false : !prev[name]
    }));
  };

  const handleShare = () => {
    const tytExam = exams.find(e => e.examType === 'TYT');
    const aytExam = exams.find(e => e.examType === 'AYT');

    const branchSuccess: Record<string, number> = {
      'Matematik': 86.4,
      'Fizik': 78.2,
      'Kimya': 85.0,
      'Biyoloji': 92.0,
      'Türkçe': 87.5
    };

    const snapshot = {
      studentName: studentName || 'Öğrenci',
      overallScore: scoreProfile.overallScore,
      planFidelity: scoreProfile.planFidelity,
      testSuccess: scoreProfile.testSuccess,
      trialAverage: scoreProfile.trialAverage,
      tytNet: tytExam ? tytExam.totalNet : 94.75,
      aytNet: aytExam ? aytExam.totalNet : 58.0,
      branchSuccess,
      calculatedAt: new Date().toISOString()
    };
    onShareWithPeer(snapshot);
  };

  // Custom Tooltip for Normalized Comparison Chart
  const CustomNormalizedTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-slate-950/95 border border-slate-700/80 p-3.5 rounded-2xl shadow-2xl backdrop-blur-md text-xs text-white max-w-xs space-y-2">
          <div className="border-b border-slate-800 pb-1.5">
            <div className="font-bold text-cyan-300 truncate">{dataPoint.title}</div>
            <div className="text-[10px] text-slate-400 flex items-center justify-between mt-0.5">
              <span>{dataPoint.date} &bull; {dataPoint.examType}</span>
              <span className="font-semibold text-indigo-300">{dataPoint.source}</span>
            </div>
            {dataPoint.ranking && (
              <div className="text-[10px] text-amber-300 font-bold mt-0.5">
                🏆 Sınav Sıralaması: #{dataPoint.ranking}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400">Ders Başarı Yüzdeleri:</div>
            {payload.map((item: any, i: number) => {
              if (item.value === undefined || item.value === null) return null;
              return (
                <div key={i} className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 text-slate-300 truncate max-w-[170px]">
                    <span 
                      className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span>{item.name}:</span>
                  </span>
                  <span className="font-mono font-bold text-white">%{item.value}</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for 500-Point Target Chronology & YKS Ranking Simulation
  const CustomOsymTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      const rankInfo: YksRankingResult = dataPoint.estimatedRank;

      return (
        <div className="bg-slate-950/95 border border-cyan-500/50 p-4 rounded-2xl shadow-2xl backdrop-blur-md text-xs text-white space-y-2.5 min-w-[240px]">
          <div className="border-b border-slate-800 pb-1.5">
            <div className="font-bold text-white truncate">{dataPoint.title}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {dataPoint.date} &bull; {dataPoint.examType} ({dataPoint.publisher})
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">ÖSYM Ham Puan:</span>
              <span className="font-black text-cyan-300 font-mono text-sm">{dataPoint.score}</span>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">OÖBP Katkısı (+{obpContribution.placementContribution}):</span>
              <span className="font-black text-amber-300 font-mono">
                {dataPoint.placementScore} Y-Puan
              </span>
            </div>

            {/* Estimated National Ranking Badge */}
            <div className="bg-gradient-to-r from-amber-500/15 to-indigo-500/15 border border-amber-500/30 p-2 rounded-xl mt-1">
              <div className="text-[10px] text-amber-300/90 uppercase font-semibold flex items-center justify-between">
                <span>🇹🇷 Tahmini YKS Sıralaması</span>
                <span className="text-[9px] text-slate-400 font-mono">2024 Yığılım</span>
              </div>
              <div className="text-base font-black text-white font-mono mt-0.5">
                {rankInfo?.formattedRank || 'İlk 50.000'}
              </div>
              <div className="text-[10px] text-indigo-300 font-medium mt-0.5">
                Dilim: {rankInfo?.percentileText || '%3-5 Dilimi'} &bull; {rankInfo?.tier || 'Hedef Segment'}
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1">
              <span className="text-slate-400">500 Zirvesine Kalan:</span>
              <span className="font-bold text-rose-400 font-mono">-{dataPoint.targetGap.toFixed(1)} Puan</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Toplam Net:</span>
              <span className="font-bold text-emerald-300 font-mono">{dataPoint.net} Net</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Genel Başarı:</span>
              <span className="font-bold text-indigo-300 font-mono">%{dataPoint.successRate}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">
              Grafik, Puanlama ve Performans Analiz Motoru
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Aşama 2 Normalizasyon
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Farklı soru sayısındaki dersler <strong className="text-emerald-400 font-semibold">% Normalize Başarı</strong> ile tek koordinat düzleminde kıyaslanır.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Share button */}
          <button
            onClick={handleShare}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md transition hover:scale-105 active:scale-95 border border-emerald-400/40"
            title="Grafik kartını arkadaşına mesaj olarak gönder"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Gelişim Grafiğini Arkadaşına Gönder</span>
          </button>
        </div>
      </div>

      {/* Switcher Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setActiveView('NORMALIZED')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
            activeView === 'NORMALIZED'
              ? 'bg-indigo-600 text-white shadow'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Normalize Branş Karşılaştırma Grafiği (%)</span>
        </button>

        <button
          onClick={() => setActiveView('OSYM_SCORE')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
            activeView === 'OSYM_SCORE'
              ? 'bg-indigo-600 text-white shadow'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          <span>TYT / AYT Puan Kronolojisi (500 Hedefi)</span>
        </button>

        <button
          onClick={() => setActiveView('FORMULA')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
            activeView === 'FORMULA'
              ? 'bg-indigo-600 text-white shadow'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          100 Üzerinden Genel Öğrenci Skoru
        </button>

        <button
          onClick={() => setActiveView('SAYISAL_ENGINE')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 ${
            activeView === 'SAYISAL_ENGINE'
              ? 'bg-cyan-600 text-white shadow'
              : 'bg-slate-800 text-cyan-300 hover:text-white'
          }`}
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>YKS Sayısal Puan Motoru (Şartname 7.B)</span>
        </button>
      </div>

      {/* VIEW 1: NORMALIZED COMPARISON (RECHARTS TIME-SERIES & INTERACTIVE LEGENDS) */}
      {activeView === 'NORMALIZED' && (
        <div className="space-y-4">
          
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Normalizasyon Kuralı:</span>
              <code className="text-indigo-300 font-mono font-bold bg-indigo-950/50 px-2 py-0.5 rounded border border-indigo-500/30">
                (Net / Toplam Soru) &times; 100
              </code>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400">Grafik Modu:</span>
              <button
                onClick={() => setChartType('line')}
                className={`px-2 py-1 rounded-lg font-semibold transition ${chartType === 'line' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}
              >
                Çizgi (Trend)
              </button>
              <button
                onClick={() => setChartType('area')}
                className={`px-2 py-1 rounded-lg font-semibold transition ${chartType === 'area' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}
              >
                Alan (Yoğunluk)
              </button>
            </div>
          </div>

          {/* Interactive Legend Toggles */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2 chart-legend-container">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-semibold text-slate-300 chart-legend-title">
                👁️ Ders Lejantı (Grafikte gizlemek/göstermek için branşa tıklayın):
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const allTrue: Record<string, boolean> = {};
                    allSubjectNames.forEach(s => allTrue[s] = true);
                    allTrue['Genel Ortalama'] = true;
                    setVisibleSubjects(allTrue);
                  }}
                  className="text-xs text-indigo-400 hover:underline font-semibold"
                >
                  Tümünü Aç
                </button>
                <span>&bull;</span>
                <button
                  onClick={() => {
                    const allFalse: Record<string, boolean> = {};
                    allSubjectNames.forEach(s => allFalse[s] = false);
                    allFalse['Genel Ortalama'] = true; // keep overall
                    setVisibleSubjects(allFalse);
                  }}
                  className="text-xs text-slate-400 hover:underline font-semibold"
                >
                  Sadece Genel
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {/* Overall Average */}
              <button
                onClick={() => toggleSubject('Genel Ortalama')}
                className={`chart-legend-overall px-2.5 py-1 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                  visibleSubjects['Genel Ortalama'] !== false
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 is-active'
                    : 'bg-slate-800/40 text-slate-500 border-slate-700 line-through is-inactive'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                <span>Genel Sınav Ortalaması</span>
              </button>

              {/* Dynamic subjects */}
              {allSubjectNames.map(name => {
                const isVisible = visibleSubjects[name] !== false;
                const color = SUBJECT_COLORS[name] || '#94a3b8';
                return (
                  <button
                    key={name}
                    onClick={() => toggleSubject(name)}
                    className={`chart-legend-btn px-2.5 py-1 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 ${
                      isVisible
                        ? 'bg-slate-800/90 text-white border-slate-700 shadow-sm is-active'
                        : 'bg-slate-900/40 text-slate-500 border-slate-800 line-through opacity-60 is-inactive'
                    }`}
                  >
                    <span 
                      className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="subject-name">{name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recharts Coordinate Plane (0-100%) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-2">
                <span>Derslerin Eşit Koordinat Zamansal Gelişimi (0 - 100%)</span>
                <span className="text-[10px] text-slate-400">({normalizedTimeSeriesData.length} Deneme)</span>
              </span>
              <span className="text-slate-400 text-[11px]">
                Hedef Başarı Bandı: <strong className="text-emerald-400 font-mono">%80+</strong>
              </span>
            </div>

            {mounted && normalizedTimeSeriesData.length > 0 ? (
              <div className="w-full h-80 sm:h-96">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'line' ? (
                    <LineChart data={normalizedTimeSeriesData} margin={{ top: 10, right: 20, left: -10, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                      <XAxis 
                        dataKey="shortDate" 
                        stroke="#94a3b8" 
                        fontSize={11}
                        tickLine={false}
                        dy={8}
                      />
                      <YAxis 
                        domain={[0, 100]} 
                        stroke="#94a3b8" 
                        fontSize={11}
                        tickFormatter={(v) => `%${v}`}
                        tickLine={false}
                        dx={-4}
                      />
                      <Tooltip content={<CustomNormalizedTooltip />} />
                      
                      {/* 80% Excellence Threshold */}
                      <ReferenceLine 
                        y={80} 
                        stroke="#10b981" 
                        strokeDasharray="4 4" 
                        label={{ value: '%80 Hedef Eşiği', fill: '#10b981', fontSize: 10, position: 'right' }} 
                      />

                      {/* Overall Average Line */}
                      {visibleSubjects['Genel Ortalama'] !== false && (
                        <Line
                          type="monotone"
                          dataKey="Genel Ortalama"
                          stroke="#38bdf8"
                          strokeWidth={3}
                          dot={{ r: 5, fill: '#38bdf8', stroke: '#0284c7', strokeWidth: 2 }}
                          activeDot={{ r: 7 }}
                          name="Genel Ortalama"
                        />
                      )}

                      {/* Subject Lines */}
                      {allSubjectNames.map(name => {
                        if (visibleSubjects[name] === false) return null;
                        const color = SUBJECT_COLORS[name] || '#a855f7';
                        return (
                          <Line
                            key={name}
                            type="monotone"
                            dataKey={name}
                            stroke={color}
                            strokeWidth={2}
                            dot={{ r: 3.5, fill: color }}
                            activeDot={{ r: 6 }}
                            connectNulls
                            name={name}
                          />
                        );
                      })}
                    </LineChart>
                  ) : (
                    <AreaChart data={normalizedTimeSeriesData} margin={{ top: 10, right: 20, left: -10, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                      <XAxis dataKey="shortDate" stroke="#94a3b8" fontSize={11} dy={8} />
                      <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `%${v}`} dx={-4} />
                      <Tooltip content={<CustomNormalizedTooltip />} />
                      <ReferenceLine y={80} stroke="#10b981" strokeDasharray="4 4" />
                      
                      {visibleSubjects['Genel Ortalama'] !== false && (
                        <Area
                          type="monotone"
                          dataKey="Genel Ortalama"
                          stroke="#38bdf8"
                          fill="#38bdf8"
                          fillOpacity={0.2}
                          strokeWidth={3}
                          name="Genel Ortalama"
                        />
                      )}

                      {allSubjectNames.map(name => {
                        if (visibleSubjects[name] === false) return null;
                        const color = SUBJECT_COLORS[name] || '#a855f7';
                        return (
                          <Area
                            key={name}
                            type="monotone"
                            dataKey={name}
                            stroke={color}
                            fill={color}
                            fillOpacity={0.12}
                            strokeWidth={2}
                            connectNulls
                            name={name}
                          />
                        );
                      })}
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-xs text-slate-500">
                Grafik verisi yükleniyor veya kayıtlı deneme bulunmuyor...
              </div>
            )}
          </div>

          {/* Detailed Single Exam Inspection Breakdown */}
          {activeExam && (
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">İncelenen Deneme:</span>
                  <select
                    value={selectedExamId}
                    onChange={e => setSelectedExamId(e.target.value)}
                    className="bg-slate-800 border border-slate-700 text-xs text-white rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500 font-semibold"
                  >
                    {exams.map(ex => (
                      <option key={ex.id} value={ex.id}>
                        {ex.title} ({ex.examType} - {ex.date})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold border ${
                    activeExam.source_type === 'institutional'
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  }`}>
                    {activeExam.source_type === 'institutional' ? '🏛️ Kurumsal Sınav' : '🏠 Bireysel / Yayın'}
                  </span>
                  {activeExam.ranking && (
                    <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      🏆 Sıralama: #{activeExam.ranking}
                    </span>
                  )}
                </div>
              </div>

              {/* Horizontal Bar Breakdown for Selected Exam */}
              <div className="space-y-3 pt-1">
                {activeExam.subjectResults.map((sub, i) => {
                  const percent = sub.normalizedPercentage;
                  const barColor = 
                    percent >= 80 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' :
                    percent >= 65 ? 'bg-gradient-to-r from-indigo-500 to-cyan-400' :
                    percent >= 50 ? 'bg-gradient-to-r from-amber-500 to-orange-400' :
                    'bg-gradient-to-r from-red-500 to-rose-400';

                  // Eski sınav neti var mı kontrol et
                  const prevNets = student?.previous_exam_history?.nets;
                  let prevNetVal: number | undefined;
                  const totalQuestionsForSubject = sub.totalQuestions || 40;

                  if (prevNets) {
                    const sName = sub.subjectName.toLowerCase();
                    if (sName.includes('türkçe')) prevNetVal = prevNets.tytTurkce;
                    else if (sName.includes('temel matematik') || (sName.includes('matematik') && activeExam.examType === 'TYT')) prevNetVal = prevNets.tytMatematik;
                    else if (sName.includes('fen')) prevNetVal = prevNets.tytFen;
                    else if (sName.includes('sosyal')) prevNetVal = prevNets.tytSosyal;
                    else if (sName.includes('ileri matematik') || (sName.includes('matematik') && activeExam.examType === 'AYT')) prevNetVal = prevNets.aytMatematik;
                    else if (sName.includes('fizik')) prevNetVal = prevNets.aytFizik;
                    else if (sName.includes('kimya')) prevNetVal = prevNets.aytKimya;
                    else if (sName.includes('biyoloji')) prevNetVal = prevNets.aytBiyoloji;
                  }

                  const prevPercent = prevNetVal !== undefined ? (prevNetVal / totalQuestionsForSubject) * 100 : undefined;
                  const deltaNet = prevNetVal !== undefined ? Number((sub.net - prevNetVal).toFixed(2)) : undefined;

                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-200 flex items-center gap-2">
                          <span>{sub.subjectName}</span>
                          <span className="text-[10px] text-slate-500 font-normal">
                            ({sub.net} Net &bull; {sub.correct} D / {sub.incorrect} Y)
                          </span>
                          {deltaNet !== undefined && (
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                              deltaNet > 0 
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                : deltaNet < 0 
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                                : 'bg-slate-800 text-slate-400'
                            }`}>
                              {deltaNet > 0 ? `+${deltaNet} Net` : `${deltaNet} Net`} (Eski Sınava Göre)
                            </span>
                          )}
                        </span>
                        <div className="flex items-center gap-3">
                          {prevPercent !== undefined && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              Eski: %{prevPercent.toFixed(1)}
                            </span>
                          )}
                          <span className="font-mono font-bold text-white">
                            %{percent.toFixed(1)}
                          </span>
                        </div>
                      </div>

                      <div className="relative w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5">
                        <div
                          className={`h-full rounded-full ${barColor} transition-all duration-700 shadow-sm`}
                          style={{ width: `${percent}%` }}
                        />
                        {/* Eski Sınav İğnesi / İmleci */}
                        {prevPercent !== undefined && (
                          <div 
                            className="absolute top-0 bottom-0 w-1 bg-rose-400 shadow z-10"
                            style={{ left: `${Math.min(100, Math.max(0, prevPercent))}%` }}
                            title={`Önceki Sınav Başarısı: %${prevPercent.toFixed(1)}`}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: TYT / AYT PUAN KRONOLOJİSİ (500 HEDEFİ) */}
      {activeView === 'OSYM_SCORE' && (
        <div className="space-y-5">
          
          {/* Target Milestone Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-cyan-950/60 border border-cyan-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-cyan-400" />
                <h4 className="text-sm font-bold text-white">
                  500 Tam Puan Zirvesine Doğru Kronolojik İlerleme
                </h4>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Her denemenin simüle edilmiş ÖSYM ham puanı zaman çizgisinde izlenir. Tıp & İlk 1000 hedef eşiği (400+) kıyaslamalıdır.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase">Son Deneme Puanı</span>
                <div className="text-2xl font-black text-cyan-300 font-mono">
                  {osymTimeSeriesData[osymTimeSeriesData.length - 1]?.score || 0}
                </div>
              </div>
              <div className="h-8 w-px bg-slate-800" />
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase">500 Farkı</span>
                <div className="text-2xl font-black text-emerald-400 font-mono">
                  -{(500 - (osymTimeSeriesData[osymTimeSeriesData.length - 1]?.score || 0)).toFixed(1)}
                </div>
              </div>
            </div>
          </div>

          {/* Recharts Area Chart for 500-Point Target */}
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-white block">
                  Denemeler Boyunca ÖSYM Puanı Zaman Serisi (100 - 500)
                </span>
                <span className="text-[11px] text-slate-400">
                  Önceki sınav geçmişinizi ve 2027 hedefinizi karşılaştırmalı izleyin.
                </span>
              </div>

              {/* Opsiyonel Kıyaslama Seçenekleri (Tik Kutuları) */}
              <div className="flex flex-wrap items-center gap-2">
                {student?.previous_exam_history?.has_taken_before && (
                  <label className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer text-[11px] transition">
                    <input
                      type="checkbox"
                      checked={showPreviousExam}
                      onChange={e => setShowPreviousExam(e.target.checked)}
                      className="rounded text-rose-500 focus:ring-rose-500 w-3.5 h-3.5 bg-slate-950 border-slate-700"
                    />
                    <span className="text-rose-300 font-semibold select-none">
                      📌 Eski Sınav ({student.previous_exam_history.exam_year})
                    </span>
                  </label>
                )}

                <label className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer text-[11px] transition">
                  <input
                    type="checkbox"
                    checked={showTargetLines}
                    onChange={e => setShowTargetLines(e.target.checked)}
                    className="rounded text-emerald-500 focus:ring-emerald-500 w-3.5 h-3.5 bg-slate-950 border-slate-700"
                  />
                  <span className="text-emerald-300 font-semibold select-none">
                    🎯 Hedef Kıyaslama
                  </span>
                </label>
              </div>
            </div>

            {mounted && osymTimeSeriesData.length > 0 ? (
              <div className="w-full h-80 sm:h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={osymTimeSeriesData} margin={{ top: 15, right: 30, left: 0, bottom: 20 }}>
                    <defs>
                      <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                    <XAxis dataKey="shortDate" stroke="#94a3b8" fontSize={11} dy={8} />
                    <YAxis domain={[100, 560]} stroke="#94a3b8" fontSize={11} dx={-4} />
                    <Tooltip content={<CustomOsymTooltip />} />
                    
                    {/* 500 Target Ceiling Reference Line */}
                    <ReferenceLine 
                      y={500} 
                      stroke="#10b981" 
                      strokeWidth={1.5} 
                      strokeDasharray="4 4"
                      label={{ value: '🎯 500 ZİRVE', fill: '#10b981', fontSize: 10, position: 'insideTopRight' }}
                    />

                    {/* Hedef Çizgisi (Kullanıcının Belirlediği Hedef AYT / TYT Puanı) */}
                    {showTargetLines && (student?.target_ayt_score || student?.target_tyt_score) && (
                      <ReferenceLine 
                        y={student?.target_ayt_score || student?.target_tyt_score || 460} 
                        stroke="#34d399" 
                        strokeWidth={2}
                        label={{ 
                          value: `🎯 HEDEF: ${student?.target_ayt_score || student?.target_tyt_score} Puan (${student?.target_ranking ? `İlk ${student.target_ranking.toLocaleString('tr-TR')}` : 'Derece'})`, 
                          fill: '#34d399', 
                          fontSize: 10, 
                          position: 'insideBottomRight' 
                        }}
                      />
                    )}

                    {/* Eski Sınav Ham Puan Çizgisi */}
                    {showPreviousExam && student?.previous_exam_history?.has_taken_before && (
                      <ReferenceLine 
                        y={student.previous_exam_history.ayt_score || student.previous_exam_history.tyt_score || 380} 
                        stroke="#f43f5e" 
                        strokeWidth={2} 
                        strokeDasharray="6 3"
                        label={{ 
                          value: `📍 ${student.previous_exam_history.exam_year} YKS: ${student.previous_exam_history.ayt_score || student.previous_exam_history.tyt_score} Puan (#${student.previous_exam_history.placement_rank || student.previous_exam_history.ayt_rank || 'Eski'})`, 
                          fill: '#f43f5e', 
                          fontSize: 10, 
                          position: 'insideBottomLeft' 
                        }}
                      />
                    )}

                    {/* 400 Top Tier Milestone Reference Line */}
                    <ReferenceLine 
                      y={400} 
                      stroke="#f59e0b" 
                      strokeDasharray="3 3"
                      label={{ value: '⭐ 400.00 Derece Eşiği', fill: '#f59e0b', fontSize: 10, position: 'insideTopLeft' }}
                    />

                    <Area 
                      type="monotone" 
                      dataKey="placementScore" 
                      stroke="#f59e0b" 
                      strokeWidth={2} 
                      strokeDasharray="5 5"
                      fillOpacity={0}
                      dot={{ r: 4, fill: '#f59e0b', stroke: '#d97706', strokeWidth: 1.5 }}
                      activeDot={{ r: 7 }}
                      name="OÖBP Ekli Yerleştirme Puanı"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#06b6d4" 
                      strokeWidth={3} 
                      fill="url(#scoreGradient)" 
                      dot={{ r: 5, fill: '#06b6d4', stroke: '#0891b2', strokeWidth: 2 }}
                      activeDot={{ r: 8 }}
                      name="ÖSYM Ham Puanı"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : null}

            {/* OBP & Ranking Info Legend */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-1 bg-cyan-400 rounded-full inline-block" />
                  <span className="text-slate-300">ÖSYM Ham Puan</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-1 border-t-2 border-dashed border-amber-400 inline-block" />
                  <span className="text-amber-300">OÖBP&apos;li Yerleştirme Puanı (+{obpContribution.placementContribution.toFixed(1)})</span>
                </div>
                {student?.previous_exam_history?.has_taken_before && showPreviousExam && (
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-1 border-t-2 border-dashed border-rose-500 inline-block" />
                    <span className="text-rose-300">{student.previous_exam_history.exam_year} Eski Sonuç ({student.previous_exam_history.ayt_score || student.previous_exam_history.tyt_score} Puan)</span>
                  </div>
                )}
                {showTargetLines && (
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-1 bg-emerald-400 rounded-full inline-block" />
                    <span className="text-emerald-300">Hedef: {student?.target_ayt_score || 480} Puan</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800">
                <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                <span>Diploma: <strong className="text-white font-mono">{diplomaGrade}</strong> &bull; OBP: <strong className="text-amber-400 font-mono">{obpContribution.obpScore}</strong></span>
              </div>
            </div>
          </div>

          {/* OÖBP & YKS Tahmini Sıralama Simülasyon Kartı */}
          {osymTimeSeriesData.length > 0 && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/60 border border-amber-500/30 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <Award className="w-5 h-5 text-amber-400" />
                  <div>
                    <h5 className="text-xs font-bold text-white">
                      Öğrenci OÖBP Sıralama Etki Analizi & Tahmin Motoru
                    </h5>
                    <p className="text-[11px] text-slate-400">
                      Son deneme verileri ve güncel OBP katsayıları ile ÖSYM yığılım projeksiyonu
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold font-mono">
                    ÖSYM 2024 YKS Sayısal Bazlı
                  </span>
                </div>
              </div>

              {/* 3 Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Son Sınav Ham Puanı</div>
                  <div className="text-2xl font-black text-cyan-300 font-mono">
                    {osymTimeSeriesData[osymTimeSeriesData.length - 1]?.score || 0}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Ham Sıralama Projeksiyonu: <strong className="text-slate-300 font-mono">{osymTimeSeriesData[osymTimeSeriesData.length - 1]?.rawEstimatedRank?.formattedRank}</strong>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-amber-500/30 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-amber-400 flex items-center justify-between">
                    <span>OÖBP Yerleştirme Puanı</span>
                    <span className="text-[9px] text-slate-400">+{obpContribution.placementContribution.toFixed(1)} Ek Puan</span>
                  </div>
                  <div className="text-2xl font-black text-amber-300 font-mono">
                    {osymTimeSeriesData[osymTimeSeriesData.length - 1]?.placementScore || 0}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    OBP ({obpContribution.obpScore}) &times; {isBrokenObp ? '0.06 (Kırık)' : '0.12'}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-gradient-to-br from-indigo-950/60 to-purple-950/40 border border-indigo-500/40 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-indigo-300 flex items-center justify-between">
                    <span>🇹🇷 Tahmini Türkiye Sıralaması</span>
                    <span className="text-[9px] text-emerald-400 font-bold">2027 Projeksiyon</span>
                  </div>
                  <div className="text-2xl font-black text-white font-mono">
                    {osymTimeSeriesData[osymTimeSeriesData.length - 1]?.estimatedRank?.formattedRank || 'İlk 25.000'}
                  </div>
                  <div className="text-[10px] text-indigo-300 font-medium">
                    Segment: <strong className="text-white">{osymTimeSeriesData[osymTimeSeriesData.length - 1]?.estimatedRank?.tier}</strong> ({osymTimeSeriesData[osymTimeSeriesData.length - 1]?.estimatedRank?.percentileText})
                  </div>
                </div>
              </div>

              {/* Eski Sınav ile Karşılaştırma & Gelişim İlerleme Çubuğu */}
              {student?.previous_exam_history?.has_taken_before && (
                <div className="p-4 rounded-xl bg-slate-950/90 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 font-bold">
                      {student.previous_exam_history.exam_year} YKS
                    </div>
                    <div>
                      <div className="font-bold text-white flex items-center gap-2">
                        <span>Eski Sınav Puanı: <strong className="text-rose-300 font-mono">{student.previous_exam_history.ayt_score || student.previous_exam_history.tyt_score} Puan</strong></span>
                        <span className="text-slate-500">&bull;</span>
                        <span>Eski Sıralama: <strong className="text-amber-300 font-mono">#{student.previous_exam_history.placement_rank || student.previous_exam_history.ayt_rank || 'Bilinmiyor'}</strong></span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Güncel deneme puanına göre net değişim: <strong className="text-emerald-400 font-mono">
                          +{Math.max(0, (osymTimeSeriesData[osymTimeSeriesData.length - 1]?.score || 0) - (student.previous_exam_history.ayt_score || student.previous_exam_history.tyt_score || 0)).toFixed(1)} Puan Artış
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-[11px]">
                      🚀 Gelişim Trendi Pozitif
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Exam History Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {exams.map((ex) => (
              <div key={ex.id} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between gap-3 hover:border-slate-700 transition">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-xs text-white">{ex.title}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {ex.date} &bull; {ex.examType} ({ex.totalNet} Net)
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-black text-cyan-300 font-mono">{ex.estimatedOsymScore}</div>
                    <div className="text-[10px] text-emerald-400 font-semibold font-mono">
                      %{ex.overallSuccessPercentage.toFixed(1)} Başarı
                    </div>
                  </div>
                </div>

                {/* Metadata tags */}
                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/80 text-[10px]">
                  <span className={`px-2 py-0.5 rounded font-semibold border ${
                    ex.source_type === 'institutional'
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  }`}>
                    {ex.source_type === 'institutional' ? '🏛️ Kurumsal' : '🏠 Bireysel / Yayın'}
                  </span>
                  {ex.institution_name && (
                    <span className="text-slate-400 truncate max-w-[130px]" title={ex.institution_name}>
                      🏢 {ex.institution_name}
                    </span>
                  )}
                  {ex.publisher_name && (
                    <span className="text-slate-400">
                      📖 {ex.publisher_name}
                    </span>
                  )}
                  {ex.booklet_type && (
                    <span className="text-cyan-300 font-mono font-bold">
                      [{ex.booklet_type}]
                    </span>
                  )}
                  {ex.ranking && (
                    <span className="text-amber-300 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                      #{ex.ranking}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* VIEW 3: SCORE FORMULA BREAKDOWN */}
      {activeView === 'FORMULA' && (
        <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
          <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs">
            <span className="font-bold text-indigo-300 block mb-1">
              📐 100 Üzerinden Genel Öğrenci Skoru Formülü:
            </span>
            <code className="text-white font-mono block bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-xs">
              Skor = (Plan Sadakati &times; 0.30) + (Test & Tarama Başarısı &times; 0.25) + (Deneme Ortalaması &times; 0.35) + (AI Eksik Tamamlama Hızı &times; 0.10)
            </code>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-[11px] text-slate-400">Plan Sadakati (%30)</div>
              <div className="text-xl font-bold text-indigo-300 mt-1 font-mono">{scoreProfile.planFidelity}%</div>
              <div className="text-[10px] text-slate-500 mt-1 font-mono">+{(scoreProfile.planFidelity * 0.3).toFixed(1)} Puan</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-[11px] text-slate-400">Test & Tarama (%25)</div>
              <div className="text-xl font-bold text-cyan-300 mt-1 font-mono">{scoreProfile.testSuccess}%</div>
              <div className="text-[10px] text-slate-500 mt-1 font-mono">+{(scoreProfile.testSuccess * 0.25).toFixed(1)} Puan</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-[11px] text-slate-400">Deneme Ortalaması (%35)</div>
              <div className="text-xl font-bold text-emerald-300 mt-1 font-mono">{scoreProfile.trialAverage}%</div>
              <div className="text-[10px] text-slate-500 mt-1 font-mono">+{(scoreProfile.trialAverage * 0.35).toFixed(1)} Puan</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-[11px] text-slate-400">AI Eksik Hızı (%10)</div>
              <div className="text-xl font-bold text-amber-300 mt-1 font-mono">{scoreProfile.aiDeficiencySpeed}%</div>
              <div className="text-[10px] text-slate-500 mt-1 font-mono">+{(scoreProfile.aiDeficiencySpeed * 0.1).toFixed(1)} Puan</div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-900/60 to-slate-900 border border-indigo-500/40 flex items-center justify-between">
            <div>
              <span className="text-xs text-indigo-300 font-semibold uppercase">Toplam Genel Öğrenci Başarı Skoru</span>
              <div className="text-2xl font-black text-white font-mono">{scoreProfile.overallScore} / 100</div>
            </div>
            <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
              {scoreProfile.overallScore >= 80 ? 'Yüksek Başarı Performansı' : 'İyi Gelişim Seyri'}
            </span>
          </div>
        </div>
      )}

      {/* VIEW 4: ŞARTNAME 7.B YKS SAYISAL PUAN VE NET HESAPLAMA MOTORU */}
      {activeView === 'SAYISAL_ENGINE' && (
        <div className="sayisal-engine-container p-5 rounded-2xl bg-slate-950/80 border border-cyan-500/40 space-y-6">
          
          {/* Formula Specification Banner */}
          <div className="sayisal-banner p-4 rounded-xl bg-gradient-to-r from-cyan-950/50 via-slate-900 to-indigo-950/50 border border-cyan-500/30 text-xs space-y-2">
            <div className="sayisal-banner-header flex items-center space-x-2 text-cyan-300 font-bold">
              <Calculator className="w-4 h-4 text-cyan-400 sayisal-banner-icon" />
              <span>Şartname 7.B Resmi Net ve Puan Hesaplama Standartları:</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
              <div className="sayisal-formula-box bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-slate-300">
                <strong className="sayisal-formula-title text-white">1. Net Formülü:</strong><br/>
                <code className="sayisal-formula-code">Net = Doğru - (Yanlış / 4)</code>
              </div>
              <div className="sayisal-formula-box bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-slate-300">
                <strong className="sayisal-formula-title text-white">2. Normalizasyon Formülü:</strong><br/>
                <code className="sayisal-formula-code">Başarı Grafiği = (Ders Neti / Toplam Soru) &times; 100</code>
              </div>
            </div>
            <div className="sayisal-formula-box sayisal-formula-box-main bg-slate-900 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-200">
              <strong className="sayisal-formula-title-accent text-cyan-300">3. YKS Sayısal Puan Formülü:</strong><br/>
              <code className="sayisal-formula-code">TYT Katkısı (%40) + AYT Sayısal Katkısı (%60) + 100 Taban Puan</code>
            </div>
          </div>

          {/* Coefficient Breakdown Table */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-center">
            <div className="sayisal-coeff-card p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="sayisal-coeff-label text-[10px] text-slate-400">TYT Türkçe / Mat</div>
              <div className="sayisal-coeff-val text-sm font-bold text-cyan-300 font-mono">3.3 Katsayı</div>
            </div>
            <div className="sayisal-coeff-card p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="sayisal-coeff-label text-[10px] text-slate-400">TYT Fen / Sosyal</div>
              <div className="sayisal-coeff-val text-sm font-bold text-cyan-300 font-mono">1.7 Katsayı</div>
            </div>
            <div className="sayisal-coeff-card p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="sayisal-coeff-label text-[10px] text-slate-400">AYT Matematik</div>
              <div className="sayisal-coeff-val-indigo text-sm font-bold text-indigo-300 font-mono">3.0 Katsayı</div>
            </div>
            <div className="sayisal-coeff-card p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="sayisal-coeff-label text-[10px] text-slate-400">AYT Fizik / Kimya / Biyo</div>
              <div className="sayisal-coeff-val-emerald text-sm font-bold text-emerald-300 font-mono">2.85 / 3.07</div>
            </div>
          </div>

          {/* Interactive Simulation Sliders / Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* TYT Inputs */}
            <div className="sayisal-input-card p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="sayisal-input-header flex items-center justify-between text-xs font-bold text-cyan-300 border-b border-slate-800 pb-2">
                <span className="sayisal-input-title">TYT Sınavı Netleri (Katkı: %40)</span>
                <span className="sayisal-input-sub font-mono text-[10px] text-slate-400">120 Soru</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="sayisal-field-label text-slate-300">Türkçe (x3.3):</span>
                  <input
                    type="number"
                    step="0.25"
                    max={40}
                    min={0}
                    value={simNets.tytTurkceNet}
                    onChange={e => setSimNets(p => ({ ...p, tytTurkceNet: parseFloat(e.target.value) || 0 }))}
                    className="sayisal-field-input w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right font-mono text-white"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="sayisal-field-label text-slate-300">Temel Matematik (x3.3):</span>
                  <input
                    type="number"
                    step="0.25"
                    max={40}
                    min={0}
                    value={simNets.tytMatematikNet}
                    onChange={e => setSimNets(p => ({ ...p, tytMatematikNet: parseFloat(e.target.value) || 0 }))}
                    className="sayisal-field-input w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right font-mono text-white"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="sayisal-field-label text-slate-300">Fen Bilimleri (x1.7):</span>
                  <input
                    type="number"
                    step="0.25"
                    max={20}
                    min={0}
                    value={simNets.tytFenNet}
                    onChange={e => setSimNets(p => ({ ...p, tytFenNet: parseFloat(e.target.value) || 0 }))}
                    className="sayisal-field-input w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right font-mono text-white"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="sayisal-field-label text-slate-300">Sosyal Bilimler (x1.7):</span>
                  <input
                    type="number"
                    step="0.25"
                    max={20}
                    min={0}
                    value={simNets.tytSosyalNet}
                    onChange={e => setSimNets(p => ({ ...p, tytSosyalNet: parseFloat(e.target.value) || 0 }))}
                    className="sayisal-field-input w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right font-mono text-white"
                  />
                </div>
              </div>
            </div>

            {/* AYT Sayısal Inputs */}
            <div className="sayisal-input-card p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="sayisal-input-header-ayt flex items-center justify-between text-xs font-bold text-emerald-400 border-b border-slate-800 pb-2">
                <span className="sayisal-input-title-ayt">AYT Sayısal Netleri (Katkı: %60)</span>
                <span className="sayisal-input-sub font-mono text-[10px] text-slate-400">80 Soru</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="sayisal-field-label text-slate-300">İleri Matematik (x3.0):</span>
                  <input
                    type="number"
                    step="0.25"
                    max={40}
                    min={0}
                    value={simNets.aytMatematikNet}
                    onChange={e => setSimNets(p => ({ ...p, aytMatematikNet: parseFloat(e.target.value) || 0 }))}
                    className="sayisal-field-input w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right font-mono text-white"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="sayisal-field-label text-slate-300">Fizik (x2.85):</span>
                  <input
                    type="number"
                    step="0.25"
                    max={14}
                    min={0}
                    value={simNets.aytFizikNet}
                    onChange={e => setSimNets(p => ({ ...p, aytFizikNet: parseFloat(e.target.value) || 0 }))}
                    className="sayisal-field-input w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right font-mono text-white"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="sayisal-field-label text-slate-300">Kimya (x3.07):</span>
                  <input
                    type="number"
                    step="0.25"
                    max={13}
                    min={0}
                    value={simNets.aytKimyaNet}
                    onChange={e => setSimNets(p => ({ ...p, aytKimyaNet: parseFloat(e.target.value) || 0 }))}
                    className="sayisal-field-input w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right font-mono text-white"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="sayisal-field-label text-slate-300">Biyoloji (x3.07):</span>
                  <input
                    type="number"
                    step="0.25"
                    max={13}
                    min={0}
                    value={simNets.aytBiyolojiNet}
                    onChange={e => setSimNets(p => ({ ...p, aytBiyolojiNet: parseFloat(e.target.value) || 0 }))}
                    className="sayisal-field-input w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right font-mono text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Results Card */}
          <div className="sayisal-results-card p-5 rounded-2xl bg-gradient-to-r from-cyan-950 via-slate-900 to-indigo-950 border border-cyan-500/50 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="sayisal-results-badge text-[11px] uppercase tracking-wider text-cyan-300 font-bold">
                Hesaplanan YKS Sayısal Puanı (500 Tabanında)
              </span>
              <div className="flex items-baseline space-x-2">
                <span className="sayisal-results-score text-3xl sm:text-4xl font-black bg-gradient-to-r from-cyan-300 via-white to-emerald-300 bg-clip-text text-transparent">
                  {sayisalDetail.totalSayisalScore}
                </span>
                <span className="sayisal-results-max text-xs text-slate-400">/ 500 Puan</span>
              </div>
            </div>

            {/* Sub-breakdown */}
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="sayisal-breakdown-box bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <div className="sayisal-breakdown-label text-[10px] text-slate-400">TYT Katkısı (%40)</div>
                <div className="sayisal-breakdown-val-cyan text-sm font-bold text-cyan-300 font-mono">+{sayisalDetail.tytContribution}</div>
              </div>
              <div className="sayisal-breakdown-box bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <div className="sayisal-breakdown-label text-[10px] text-slate-400">AYT Katkısı (%60)</div>
                <div className="sayisal-breakdown-val-emerald text-sm font-bold text-emerald-300 font-mono">+{sayisalDetail.aytContribution}</div>
              </div>
              <div className="sayisal-breakdown-box bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <div className="sayisal-breakdown-label text-[10px] text-slate-400">Taban Puan</div>
                <div className="sayisal-breakdown-val-indigo text-sm font-bold text-indigo-300 font-mono">+100.00</div>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
