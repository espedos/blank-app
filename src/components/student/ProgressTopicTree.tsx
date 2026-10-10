'use client';

import React, { useState } from 'react';
import { TYT_SUBJECTS, AYT_SAYISAL_SUBJECTS } from '@/data/seedData';
import { Subject, Topic } from '@/types';
import { 
  ListTree, 
  CheckCircle2, 
  Circle, 
  Sparkles, 
  BookOpen, 
  Video, 
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Filter
} from 'lucide-react';

interface ProgressTopicTreeProps {
  onStartTopicTest?: (topicName: string) => void;
}

export const ProgressTopicTree: React.FC<ProgressTopicTreeProps> = ({ onStartTopicTest }) => {
  const [activeCategory, setActiveCategory] = useState<'AYT_SAYISAL' | 'TYT'>('AYT_SAYISAL');
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({
    'ayt-matematik': true,
    'ayt-fizik': true,
    'tyt-matematik': true
  });

  const subjects = activeCategory === 'AYT_SAYISAL' ? AYT_SAYISAL_SUBJECTS : TYT_SUBJECTS;

  const toggleSubject = (id: string) => {
    setExpandedSubjects(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <ListTree className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">
              Ders ve Konu Bazlı İlerleme Ağacı
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            TYT ve AYT Sayısal müfredatındaki tüm kazanımların çalışma ve kavrama durumu
          </p>
        </div>

        {/* Category switcher */}
        <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveCategory('AYT_SAYISAL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeCategory === 'AYT_SAYISAL'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            AYT Sayısal Konuları
          </button>
          <button
            onClick={() => setActiveCategory('TYT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeCategory === 'TYT'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            TYT Genel Konuları
          </button>
        </div>
      </div>

      {/* Subject Accordions */}
      <div className="space-y-4">
        {subjects.map(subject => {
          const isExpanded = !!expandedSubjects[subject.id];

          return (
            <div
              key={subject.id}
              className="rounded-2xl bg-slate-950/70 border border-slate-800 overflow-hidden transition"
            >
              {/* Accordion header */}
              <button
                onClick={() => toggleSubject(subject.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-slate-900/60 transition text-left"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${subject.color}`} />
                  <div>
                    <span className="font-bold text-sm text-white">{subject.name}</span>
                    <span className="text-[11px] text-slate-400 ml-2">
                      ({subject.topics.length} Konu &bull; Sınavda {subject.totalQuestionCount} Soru)
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="text-xs text-emerald-400 font-semibold hidden sm:inline">
                    %{Math.round(subject.topics.length * 7.5)} Tamamlandı
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </button>

              {/* Topics list */}
              {isExpanded && (
                <div className="p-4 pt-1 border-t border-slate-800/80 space-y-2">
                  {subject.topics.map((topic, idx) => {
                    const isCompleted = idx % 2 === 0;

                    return (
                      <div
                        key={topic.id}
                        className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center space-x-3">
                          {isCompleted ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          ) : (
                            <Circle className="w-4 h-4 text-slate-500 flex-shrink-0" />
                          )}
                          <div>
                            <div className="font-semibold text-slate-200">{topic.name}</div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span>Tahmini: {topic.estimatedHours} Saat</span>
                              <span>&bull;</span>
                              <span className={`font-semibold ${
                                topic.priority === 'HIGH' ? 'text-amber-400' : 'text-slate-400'
                              }`}>
                                {topic.priority === 'HIGH' ? 'Yüksek Önem' : 'Standart'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Badges / actions */}
                        <div className="flex items-center space-x-2 self-end sm:self-center">
                          <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                            isCompleted ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {isCompleted ? 'Tamamlandı' : 'Sırada'}
                          </span>

                          {onStartTopicTest && (
                            <button
                              onClick={() => onStartTopicTest(topic.name)}
                              className="px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 text-[11px] font-medium transition"
                            >
                              Test Çöz
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
        })}
      </div>

    </div>
  );
};
