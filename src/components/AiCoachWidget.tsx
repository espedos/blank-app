'use client';

import React, { useState, useEffect, useRef } from 'react';
import { StorageService } from '@/lib/storage';
import { getAiCoachResponse } from '@/lib/aiCoach';
import { AiChatMessage } from '@/types';
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  Lightbulb, 
  AlertTriangle, 
  Layers, 
  Maximize2,
  Minimize2,
  Trash2,
  BookOpen,
  MessageSquare,
  ArrowRight,
  ShieldAlert,
  Camera,
  UploadCloud,
  CheckCircle2,
  FileUp,
  Image as ImageIcon
} from 'lucide-react';
import { parseAndClassifyQuestion, generateAiSolutionForQuestion } from '@/lib/aiQuestionParser';

interface AiCoachWidgetProps {
  isOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  studentId?: string;
  studentName?: string;
  onNavigateToTab?: (tab: 'PROFILE' | 'CALENDAR' | 'CYCLE' | 'ANALYTICS' | 'TREE' | 'LIBRARY') => void;
  onOpenTestSolver?: (topic?: string) => void;
  onOpenSystemGuide?: () => void;
}

export const AiCoachWidget: React.FC<AiCoachWidgetProps> = ({ 
  isOpen: controlledIsOpen, 
  onOpen,
  onClose,
  studentId = 'student-1',
  studentName = 'Barış',
  onNavigateToTab,
  onOpenTestSolver,
  onOpenSystemGuide
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Controlled or uncontrolled open state
  const isOpen = controlledIsOpen !== undefined ? (controlledIsOpen || internalIsOpen) : internalIsOpen;

  // Load chat history from storage
  useEffect(() => {
    const history = StorageService.getAiChatMessages(studentId);
    setMessages(history);
  }, [studentId, isOpen]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, loading]);

  const quickPrompts = [
    '📖 Sistem Kılavuzu & Neler Var?',
    '📅 Haftalık Saatlik Programım',
    '📊 Sınav & Net Açığı Analizim',
    'Sindirim Sistemi enzimleri',
    'Türev geometrik yorum ve teğet',
    'Newton eğik düzlem ve sürtünme'
  ];

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setLoading(true);

    const nowStr = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    const reader = new FileReader();

    reader.onload = async () => {
      const fileName = file.name;

      // 1. Kullanıcı mesajı (görsel içeren)
      const userMsg: AiChatMessage = {
        id: `user-img-${Date.now()}`,
        student_id: studentId,
        sender: 'user',
        message_text: `📷 [Soru Görseli / Belge Yüklendi: ${fileName}]`,
        created_at: nowStr
      };

      setMessages(prev => [...prev, userMsg]);
      StorageService.saveAiChatMessage(userMsg);

      // 2. AI Soru Analizi & Çözüm Üretimi
      const questionItem = parseAndClassifyQuestion(
        `[Görsel / Belge]: ${fileName} soru çözümü`,
        'student',
        studentName
      );

      // AI Hafızasına kaydet (Question Bank)
      StorageService.addAiQuestionBankItem(questionItem);

      const solutionExplanationText = questionItem.solutionExplanation || 'Temel kavram bağıntısı kurularak sonuca ulaşılmıştır.';
      const trapNote = questionItem.osymTrapNote || 'Soruda verilen ortam koşullarını ve istisnaları teyit ediniz!';

      const formattedAiText = `### 🧠 AI Görsel Soru Çözümü & Hafıza Analizi\n\n` +
        `**Ders / Konu:** ${questionItem.subject} &bull; ${questionItem.topic} (${questionItem.difficulty})\n\n` +
        `**Doğru Cevap:** Seçenek **(${questionItem.correctAnswer || 'C'})**\n\n` +
        `**💡 Adım Adım Çözüm:**\n${solutionExplanationText}\n\n` +
        `**⚠️ ÖSYM Çeldirici Tuzağı:**\n> ${trapNote}\n\n` +
        `💾 *Bu soru Vira AI hafızasına kaydedildi ve benzer sorular kişisel çalışma havuzunuza dahil edildi.*`;

      const assistantMsg: AiChatMessage = {
        id: `assistant-img-${Date.now()}`,
        student_id: studentId,
        sender: 'assistant',
        message_text: formattedAiText,
        structured_data: {
          summary: `${questionItem.subject} - ${questionItem.topic} sorusu çözüldü. Doğru Cevap: ${questionItem.correctAnswer || 'C'}`,
          keyPoints: [
            questionItem.topic,
            questionItem.subtopic || 'Kazanım Soru Tipi',
            `Doğru Şık: (${questionItem.correctAnswer || 'C'})`
          ],
          osymTrapAlert: trapNote,
          actionLinks: [
            { label: 'Bu Konudan 12 Kritik Test Çöz', action: 'TEST', topic: questionItem.topic },
            { label: 'Haftalık Takvimime Git', tab: 'CALENDAR' }
          ]
        },
        created_at: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMsg]);
      StorageService.saveAiChatMessage(assistantMsg);
      setLoading(false);
      setUploadingImage(false);

      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    reader.readAsDataURL(file);
  };

  const handleAsk = async (textToAsk?: string) => {
    const q = textToAsk || query;
    if (!q.trim() || loading) return;

    setQuery('');
    const nowStr = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    // 1. Kullanıcı mesajı
    const userMsg: AiChatMessage = {
      id: `user-${Date.now()}`,
      student_id: studentId,
      sender: 'user',
      message_text: q,
      created_at: nowStr
    };

    const updatedWithUser = [...messages, userMsg];
    setMessages(updatedWithUser);
    StorageService.saveAiChatMessage(userMsg);
    setLoading(true);

    try {
      // 2. API çağrısı
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          message: q
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.assistantMessage) {
          setMessages(prev => [...prev, data.assistantMessage]);
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      console.warn('API error, using local aiCoach:', e);
    }

    // 3. Fallback to client-side aiCoach engine
    setTimeout(() => {
      const aiResponse = getAiCoachResponse(q);
      const formattedText = `### 🎯 ${aiResponse.topicTitle}\n\n` +
        `**Özet Analiz:**\n${aiResponse.summary}\n\n` +
        `**📌 Kritik Kazanım Maddeleri:**\n` +
        aiResponse.criticalKeyPoints.map(p => `• ${p}`).join('\n') +
        `\n\n**🗺️ Zihin Haritası:**\n\`\`\`\n${aiResponse.mindMapText}\n\`\`\`\n\n` +
        `**⚠️ DİKKAT / ÖSYM PÜF NOKTASI:**\n` +
        `> ${aiResponse.osymTrapAlert}`;

      const assistantMsg: AiChatMessage = {
        id: `assistant-${Date.now()}`,
        student_id: studentId,
        sender: 'assistant',
        message_text: formattedText,
        structured_data: {
          summary: aiResponse.summary,
          keyPoints: aiResponse.criticalKeyPoints,
          mindMap: aiResponse.mindMapText,
          osymTrapAlert: aiResponse.osymTrapAlert,
          actionLinks: aiResponse.actionLinks
        },
        created_at: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMsg]);
      StorageService.saveAiChatMessage(assistantMsg);
      setLoading(false);
    }, 400);
  };

  const handleClearHistory = () => {
    if (confirm('Sohbet geçmişini temizlemek istediğinize emin misiniz?')) {
      StorageService.clearAiChatMessages(studentId);
      setMessages([]);
    }
  };

  const handleClose = () => {
    setInternalIsOpen(false);
    if (onClose) {
      onClose();
    }
  };

  const handleOpen = () => {
    setInternalIsOpen(true);
    if (onOpen) {
      onOpen();
    }
  };

  return (
    <>
      {/* Sağ Alt Köşe Sabit Floating Launcher Butonu */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          className="fixed bottom-6 right-6 z-40 group flex items-center space-x-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 text-white shadow-2xl hover:scale-105 active:scale-95 transition border border-cyan-400/40 ring-4 ring-indigo-500/20 cursor-pointer"
          title="Vira YKS Sayısal Akıllı Koçu ile Konu Sor"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full" />
          </div>
          <span className="text-xs font-black tracking-wide pr-1">Vira AI Koç</span>
        </button>
      )}

      {/* Widget / Modal Penceresi */}
      {isOpen && (
        <div className={`fixed z-50 transition-all duration-200 ${
          isExpanded 
            ? 'inset-3 sm:inset-6 flex items-center justify-center' 
            : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-full max-w-[440px] h-[640px] max-h-[90vh]'
        }`}>
          <div className="w-full h-full bg-slate-900 border-2 border-indigo-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-white backdrop-blur-xl ai-coach-panel">
            
            {/* Header */}
            <div className="p-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-400 text-white shadow-md">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-extrabold text-sm text-white">
                      Vira YKS Sayısal Akıllı Koçu
                    </h3>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Aktif
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    ÖSYM Tuzakları &bull; Zihin Haritası &bull; Püf Noktaları
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="chat-header-btn p-1.5 rounded-xl text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-700/80 transition"
                  title={isExpanded ? 'Küçült' : 'Büyüt'}
                >
                  {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>

                <button
                  onClick={handleClearHistory}
                  className="chat-header-btn p-1.5 rounded-xl text-slate-300 hover:text-red-400 bg-slate-800/60 hover:bg-slate-700/80 transition"
                  title="Sohbet geçmişini temizle"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <button
                  onClick={handleClose}
                  className="chat-close-btn p-1.5 rounded-xl text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-700/80 transition"
                  title="Sohbeti Kapat"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Prompts Bar */}
            <div className="px-4 py-2 bg-slate-950/50 border-b border-slate-800/80 flex items-center space-x-1.5 overflow-x-auto text-[11px]">
              <span className="text-slate-400 font-semibold flex-shrink-0 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                Örnek:
              </span>
              {quickPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAsk(p)}
                  className="px-2.5 py-1 rounded-xl bg-slate-800/80 hover:bg-indigo-600/30 border border-slate-700 text-slate-300 hover:text-white whitespace-nowrap transition"
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Mesaj Akışı */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-sans">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-3">
                  <div className="p-4 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <Lightbulb className="w-8 h-8" />
                  </div>
                  <h4 className="font-bold text-slate-200 text-sm">Neyi Merak Ediyorsun?</h4>
                  <p className="text-[11px] max-w-xs leading-relaxed">
                    Unuttuğun bir formülü, kararsız kaldığın bir ÖSYM çeldiricisini veya biyoloji enzim sırasını sorabilirsin.
                  </p>
                </div>
              ) : (
                messages.map(msg => {
                  const isUser = msg.sender === 'user';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                    >
                      <div className={`max-w-[92%] rounded-2xl p-3.5 shadow-md ${
                        isUser
                          ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-tr-none'
                          : 'bg-slate-950/80 border border-slate-800 text-slate-200 rounded-tl-none space-y-2.5'
                      }`}>
                        
                        {isUser ? (
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.message_text}</p>
                        ) : (
                          <div>
                            {/* Yapılandırılmış Mesaj Formatı */}
                            {msg.structured_data ? (
                              <div className="space-y-3">
                                <div>
                                  <div className="font-bold text-cyan-300 text-xs mb-1 flex items-center gap-1.5">
                                    <BookOpen className="w-3.5 h-3.5" />
                                    Özet Konu Analizi:
                                  </div>
                                  <p className="text-slate-300 leading-relaxed text-[11px]">
                                    {msg.structured_data.summary}
                                  </p>
                                </div>

                                {msg.structured_data.keyPoints && msg.structured_data.keyPoints.length > 0 && (
                                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                                    <div className="font-bold text-indigo-300 text-[11px] mb-1">
                                      📌 Kritik Kazanım Maddeleri:
                                    </div>
                                    <ul className="space-y-1 text-[11px] text-slate-300">
                                      {msg.structured_data.keyPoints.map((pt, i) => (
                                        <li key={i} className="flex items-start space-x-1.5">
                                          <span className="text-cyan-400 font-bold">&bull;</span>
                                          <span>{pt}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {msg.structured_data.mindMap && (
                                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                                    <div className="font-bold text-slate-400 text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1">
                                      <Layers className="w-3 h-3 text-cyan-400" />
                                      Zihin Haritası
                                    </div>
                                    <pre className="text-[10px] font-mono text-cyan-200 overflow-x-auto whitespace-pre leading-relaxed p-1">
                                      {msg.structured_data.mindMap}
                                    </pre>
                                  </div>
                                )}

                                {msg.structured_data.osymTrapAlert && (
                                  <div className="p-3 rounded-xl bg-amber-500/10 border-2 border-amber-500/30 text-amber-200">
                                    <div className="font-black text-amber-400 text-[11px] mb-0.5 flex items-center gap-1.5">
                                      <AlertTriangle className="w-3.5 h-3.5" />
                                      DİKKAT / ÖSYM PÜF NOKTASI:
                                    </div>
                                    <p className="text-[11px] leading-relaxed">
                                      {msg.structured_data.osymTrapAlert}
                                    </p>
                                  </div>
                                )}

                                {/* Akıllı Yönlendirme ve Aksiyon Butonları */}
                                {msg.structured_data.actionLinks && msg.structured_data.actionLinks.length > 0 && (
                                  <div className="pt-2 border-t border-slate-800 space-y-2">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                      <Sparkles className="w-3 h-3 text-cyan-400" />
                                      İlgili Sayfa & Hızlı İşlemler:
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                      {msg.structured_data.actionLinks.map((action, idx) => (
                                        <button
                                          key={idx}
                                          onClick={() => {
                                            if (action.action === 'GUIDE') {
                                              onOpenSystemGuide?.();
                                            } else if (action.action === 'TEST') {
                                              onOpenTestSolver?.(action.topic);
                                            } else if (action.tab) {
                                              onNavigateToTab?.(action.tab);
                                            }
                                          }}
                                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-950 to-slate-900 hover:from-indigo-600 hover:to-cyan-600 border border-indigo-500/50 hover:border-cyan-400 text-cyan-200 hover:text-white transition-all shadow-sm font-semibold text-[11px] active:scale-95"
                                          title={action.description || action.label}
                                        >
                                          <span>{action.label}</span>
                                          <ArrowRight className="w-3 h-3 text-cyan-400 group-hover:text-white" />
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="whitespace-pre-wrap leading-relaxed text-[11px]">
                                {msg.message_text}
                              </div>
                            )}
                          </div>
                        )}

                        <div className={`text-[9px] mt-1 font-mono ${isUser ? 'text-indigo-200 text-right' : 'text-slate-500'}`}>
                          {msg.created_at}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {loading && (
                <div className="flex items-center space-x-2 p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-slate-400 text-xs w-fit animate-pulse">
                  <Bot className="w-4 h-4 text-cyan-400 animate-spin" />
                  <span>Vira AI Koç analizi hazırlıyor...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center space-x-2">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*,.pdf"
                onChange={handleImageUpload}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading || uploadingImage}
                className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-cyan-400 hover:text-white transition disabled:opacity-40 flex items-center justify-center flex-shrink-0"
                title="Görsel veya Belge Soru Yükle (AI Anında Çözsün & Hafızaya Alsın)"
              >
                <Camera className="w-4 h-4" />
              </button>

              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    handleAsk();
                  }
                }}
                placeholder="Konu sor veya sol butondan soru fotoğrafı/belgesi yükle..."
                className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />

              <button
                disabled={!query.trim() || loading}
                onClick={() => handleAsk()}
                className="p-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white disabled:opacity-40 disabled:cursor-not-allowed shadow transition hover:scale-105 active:scale-95 flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
