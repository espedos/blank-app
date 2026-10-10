'use client';

import React, { useState } from 'react';
import { 
  Video, 
  BookOpen, 
  Award, 
  Sparkles, 
  CheckCircle, 
  ArrowRight, 
  Check, 
  HelpCircle,
  FileCheck2,
  ExternalLink
} from 'lucide-react';

interface StudyCycleWorkflowProps {
  onStart12CriticalTest: (topicName: string) => void;
  onOpenOpticalEntry: () => void;
}

export const StudyCycleWorkflow: React.FC<StudyCycleWorkflowProps> = ({
  onStart12CriticalTest,
  onOpenOpticalEntry
}) => {
  const [selectedTopic, setSelectedTopic] = useState('Newton Yasaları ve Dinamik');
  const [stepStates, setStepStates] = useState({
    step1: true,
    step2: true,
    step3: false,
    step4: false,
    step5: false
  });

  const toggleStep = (key: keyof typeof stepStates) => {
    setStepStates(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const steps = [
    {
      num: 1,
      id: 'step1' as const,
      title: 'Konu Anlatımı / Video',
      desc: 'Ders föyü veya YouTube konu anlatım videosunu eksiksiz izleyin ve kavram haritası çıkarın.',
      icon: Video,
      color: 'from-blue-500 to-indigo-600',
      actionLabel: 'Video Kaynaklarını Aç'
    },
    {
      num: 2,
      id: 'step2' as const,
      title: 'Soru Bankası Testleri',
      desc: 'En az 2 farklı soru bankasından temel ve kavrama düzeyindeki en az 4 testi tamamlayın.',
      icon: BookOpen,
      color: 'from-indigo-500 to-purple-600',
      actionLabel: 'Soru Bankası Notları'
    },
    {
      num: 3,
      id: 'step3' as const,
      title: 'ÖSYM Çıkmış Sorular',
      desc: 'Son 10 yılın TYT-AYT sınavlarında bu konudan çıkmış tüm orijinal soruları tarayın.',
      icon: Award,
      color: 'from-amber-500 to-orange-600',
      actionLabel: 'Çıkmış Sorular PDF'
    },
    {
      num: 4,
      id: 'step4' as const,
      title: 'AI 12 Kritik Soru Testi',
      desc: 'Çıkmış sorulardan ve kritik öğrenci hatalarından esinlenen yapay zeka denemesini çözün.',
      icon: Sparkles,
      color: 'from-cyan-500 to-blue-600',
      actionLabel: '12 Kritik Testi Başlat',
      isPrimaryAction: true
    },
    {
      num: 5,
      id: 'step5' as const,
      title: 'Optik Giriş & Çoklu Çözümler',
      desc: 'Cevap şıklarınızı girin, anında netinizi görün ve çoklu analitik çözüm yollarını inceleyin.',
      icon: FileCheck2,
      color: 'from-emerald-500 to-teal-600',
      actionLabel: 'Optik Cevapları Gir',
      isOpticalAction: true
    }
  ];

  return (
    <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse" />
            <h3 className="text-base font-bold text-white">
              Vira 5 Adımlı Kusursuz Çalışma Döngüsü
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Aktif Konu: <strong className="text-indigo-300">{selectedTopic}</strong>. Her adımı sırayla tamamlayarak kalıcı öğrenme sağlayın.
          </p>
        </div>

        <select
          value={selectedTopic}
          onChange={e => setSelectedTopic(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none"
        >
          <option value="Newton Yasaları ve Dinamik">Fizik: Newton Yasaları ve Dinamik</option>
          <option value="Türev ve Türevin Uygulamaları">Matematik: Türev ve Uygulamaları</option>
          <option value="İnsan Fizyolojisi - Sindirim Sistemi">Biyoloji: Sindirim Sistemi</option>
          <option value="Modern Atom Teorisi">Kimya: Modern Atom Teorisi</option>
        </select>
      </div>

      {/* 5-Step Horizontal Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {steps.map(step => {
          const Icon = step.icon;
          const isDone = stepStates[step.id];

          return (
            <div
              key={step.num}
              className={`relative rounded-2xl p-4 border transition-all flex flex-col justify-between ${
                isDone
                  ? 'bg-slate-950/70 border-emerald-500/40'
                  : 'bg-slate-950/50 border-slate-800 hover:border-indigo-500/40'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${step.color} flex items-center justify-center text-white font-bold text-xs shadow-md`}>
                    {step.num}
                  </div>

                  <button
                    onClick={() => toggleStep(step.id)}
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition border ${
                      isDone
                        ? 'bg-emerald-500 text-white border-emerald-400'
                        : 'border-slate-700 text-transparent hover:border-slate-500'
                    }`}
                    title={isDone ? 'Tamamlandı (Geri Al)' : 'Tamamlandı Olarak İşaretle'}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h4 className="font-bold text-xs text-white mb-1.5 flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 text-indigo-400" />
                  {step.title}
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                  {step.desc}
                </p>
              </div>

              {/* Action buttons */}
              <div>
                {step.isPrimaryAction ? (
                  <button
                    onClick={() => onStart12CriticalTest(selectedTopic)}
                    className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold text-xs transition shadow-md flex items-center justify-center space-x-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{step.actionLabel}</span>
                  </button>
                ) : step.isOpticalAction ? (
                  <button
                    onClick={onOpenOpticalEntry}
                    className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs transition shadow-md flex items-center justify-center space-x-1.5"
                  >
                    <FileCheck2 className="w-3.5 h-3.5" />
                    <span>{step.actionLabel}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => toggleStep(step.id)}
                    className="w-full py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-[11px] font-medium transition"
                  >
                    {isDone ? '✓ Adım Tamam' : 'Tamamlandı İşaretle'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
