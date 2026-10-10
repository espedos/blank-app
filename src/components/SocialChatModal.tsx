'use client';

import React, { useState, useEffect, useRef } from 'react';
import { User, PeerMessage, ProgressCardPayload, AttachmentType } from '@/types';
import { StorageService } from '@/lib/storage';
import { 
  X, 
  Send, 
  Paperclip, 
  Image as ImageIcon, 
  TrendingUp, 
  Sparkles, 
  CheckCheck,
  FileText,
  Download,
  Eye,
  ShieldCheck,
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface SocialChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  allUsers: User[];
  initialSharedSnapshot?: ProgressCardPayload | null;
}

function normalizeBranchSuccess(branchSuccess?: any): { subject: string; percentage: number }[] {
  if (!branchSuccess) return [];
  if (Array.isArray(branchSuccess)) {
    return branchSuccess;
  }
  return Object.entries(branchSuccess).map(([subject, percentage]) => ({
    subject,
    percentage: Number(percentage)
  }));
}

export const SocialChatModal: React.FC<SocialChatModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  allUsers,
  initialSharedSnapshot
}) => {
  const [messages, setMessages] = useState<PeerMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [targetStudentId, setTargetStudentId] = useState<string>('');
  
  // Attachments modal state
  const [isAttachModalOpen, setIsAttachModalOpen] = useState(false);
  const [activeCardPreview, setActiveCardPreview] = useState<ProgressCardPayload | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // List eligible chat partners:
  // If student: only sees other students (privacy-preserving: only name, grade, avatar).
  // If counselor: can choose any student to view or chat with.
  const eligiblePartners = allUsers.filter(u => {
    if (currentUser.role === 'CONSULTANT') {
      return u.role === 'STUDENT';
    }
    return u.role === 'STUDENT' && u.id !== currentUser.id;
  });

  // Default partner assignment
  useEffect(() => {
    if (!targetStudentId && eligiblePartners.length > 0) {
      if (currentUser.id === 'student-1') {
        const p = eligiblePartners.find(u => u.id === 'student-2') || eligiblePartners[0];
        setTargetStudentId(p.id);
      } else if (currentUser.id === 'student-2') {
        const p = eligiblePartners.find(u => u.id === 'student-1') || eligiblePartners[0];
        setTargetStudentId(p.id);
      } else {
        setTargetStudentId(eligiblePartners[0].id);
      }
    }
  }, [currentUser, targetStudentId, eligiblePartners]);

  // Load messages whenever target or modal opens
  const loadMessages = () => {
    if (targetStudentId) {
      const msgs = StorageService.getPeerMessages(currentUser.id, targetStudentId);
      setMessages(msgs);
      StorageService.markPeerMessagesAsRead(targetStudentId, currentUser.id);
    }
  };

  useEffect(() => {
    if (isOpen) {
      StorageService.markAllPeerMessagesAsRead(currentUser.id);
      if (targetStudentId) {
        loadMessages();
      }
    }
  }, [isOpen, currentUser.id, targetStudentId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle incoming shared snapshot from AnalyticsCharts
  useEffect(() => {
    if (initialSharedSnapshot && targetStudentId && isOpen) {
      handleSendProgressCard(initialSharedSnapshot);
    }
  }, [initialSharedSnapshot, targetStudentId, isOpen]);

  if (!isOpen) return null;

  const targetUser = allUsers.find(u => u.id === targetStudentId);

  // Send plain text message
  const handleSendText = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !targetStudentId) return;

    const newMsg: PeerMessage = {
      id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      sender_id: currentUser.id,
      receiver_id: targetStudentId,
      sender_name: currentUser.name,
      message_text: inputText.trim(),
      attachment_url: null,
      attachment_type: null,
      progress_card_payload: null,
      is_read: false,
      created_at: new Date().toISOString()
    };

    StorageService.savePeerMessage(newMsg);
    setMessages(prev => [...prev, newMsg]);
    setInputText('');
  };

  // Send Progress Card Snapshot
  const handleSendProgressCard = (customPayload?: ProgressCardPayload) => {
    let payload = customPayload;
    if (!payload) {
      const scoreProfile = StorageService.getStudentScoreProfile(currentUser.id);
      const exams = StorageService.getExams(currentUser.id);
      const tytExam = exams.find(e => e.examType === 'TYT');
      const aytExam = exams.find(e => e.examType === 'AYT');

      payload = {
        studentId: currentUser.id,
        studentName: currentUser.name,
        overallScore: scoreProfile.overallScore,
        planFidelity: scoreProfile.planFidelity,
        testSuccess: scoreProfile.testSuccess,
        trialAverage: scoreProfile.trialAverage,
        tytNet: tytExam ? tytExam.totalNet : 94.75,
        aytNet: aytExam ? aytExam.totalNet : 58.0,
        branchSuccess: {
          'Matematik': 86.4,
          'Fizik': 78.2,
          'Kimya': 85.0,
          'Biyoloji': 92.0,
          'Türkçe': 87.5
        },
        calculatedAt: new Date().toISOString()
      };
    }

    const newMsg: PeerMessage = {
      id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      sender_id: currentUser.id,
      receiver_id: targetStudentId,
      sender_name: currentUser.name,
      message_text: `🚀 ${currentUser.name} anlık YKS Başarı ve Gelişim Karnesini paylaştı:`,
      attachment_url: null,
      attachment_type: 'progress_card',
      progress_card_payload: payload,
      is_read: false,
      created_at: new Date().toISOString()
    };

    StorageService.savePeerMessage(newMsg);
    setMessages(prev => [...prev, newMsg]);
    setIsAttachModalOpen(false);
  };

  // Simulate file upload (Image / Document)
  const handleSimulateAttachment = (type: 'image' | 'document') => {
    let newMsg: PeerMessage;
    if (type === 'image') {
      newMsg = {
        id: 'msg-' + Date.now(),
        sender_id: currentUser.id,
        receiver_id: targetStudentId,
        sender_name: currentUser.name,
        message_text: '📸 Bir soru görseli paylaştı:',
        attachment_url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80',
        attachment_type: 'image',
        progress_card_payload: null,
        is_read: false,
        created_at: new Date().toISOString()
      };
    } else {
      newMsg = {
        id: 'msg-' + Date.now(),
        sender_id: currentUser.id,
        receiver_id: targetStudentId,
        sender_name: currentUser.name,
        message_text: '📄 AYT Fizik Kritik 12 Soru Formül ve Çözüm Föyünü paylaştı:',
        attachment_url: 'https://example.com/ayt_fizik_kritik_cozumler.pdf',
        attachment_type: 'document',
        progress_card_payload: null,
        is_read: false,
        created_at: new Date().toISOString()
      };
    }

    StorageService.savePeerMessage(newMsg);
    setMessages(prev => [...prev, newMsg]);
    setIsAttachModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-auto h-[84vh] flex flex-col text-white peer-chat-modal">
        
        {/* HEADER */}
        <div className="p-4 sm:p-5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3.5">
            <div className="relative">
              <img
                src={targetUser?.avatar || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=256&q=80'}
                alt="Partner"
                className="w-11 h-11 rounded-2xl object-cover ring-2 ring-emerald-500/40"
              />
              <span className="w-3 h-3 rounded-full bg-emerald-400 absolute -bottom-0.5 -right-0.5 ring-2 ring-slate-900" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm sm:text-base text-white">{targetUser?.name || 'Öğrenci'}</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                  {targetUser?.grade === 'MEZUN' ? 'Mezun Grubu' : '12. Sınıf'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Gizli & Güvenli Akran İletişimi (Özel takvimler gizlidir)</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Partner Switcher if multiple students */}
            {eligiblePartners.length > 1 && (
              <select
                value={targetStudentId}
                onChange={e => setTargetStudentId(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-xs rounded-xl px-2.5 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {eligiblePartners.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.grade === 'MEZUN' ? 'Mezun' : '12. Sınıf'})
                  </option>
                ))}
              </select>
            )}

            {/* Quick Share Chart Button */}
            {currentUser.role === 'STUDENT' && (
              <button
                onClick={() => handleSendProgressCard()}
                className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border border-emerald-400/40 text-white text-xs font-bold transition shadow"
                title="Gelişim grafiğini ve netlerini arkadaşına gönder"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Grafiğimi Gönder</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="chat-close-btn p-2 rounded-xl text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-700/80 transition"
              title="Sohbeti Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRIVACY BANNER */}
        <div className="px-4 py-2 bg-slate-950/40 border-b border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Aktif Sohbet: <strong>{currentUser.name}</strong> &harr; <strong>{targetUser?.name}</strong></span>
          </div>
          <span className="text-[10px] text-slate-500">Müfredat ve çalışma saatleri karşı tarafa yansıtılmaz.</span>
        </div>

        {/* MESSAGE THREAD */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 bg-slate-900/60">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <Sparkles className="w-10 h-10 text-indigo-400/60 mb-2" />
              <p className="text-sm font-semibold text-slate-300">Henüz bir mesajlaşma yok</p>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Arkadaşına soru sorabilir, fotoğraf veya PDF föyü paylaşabilir, ya da gelişim grafiğini göndererek durumunuzu kıyaslayabilirsiniz.
              </p>
            </div>
          ) : (
            messages.map(msg => {
              const isMe = msg.sender_id === currentUser.id;
              const formattedTime = msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div className="text-[10px] text-slate-400 mb-1 px-1 flex items-center gap-1">
                    <span>{msg.sender_name || (isMe ? currentUser.name : targetUser?.name)}</span>
                    <span>&bull;</span>
                    <span>{formattedTime}</span>
                    {isMe && (
                      <CheckCheck className={`w-3.5 h-3.5 ml-1 ${msg.is_read ? 'text-cyan-400' : 'text-slate-500'}`} />
                    )}
                  </div>

                  <div
                    className={`max-w-[88%] sm:max-w-[75%] p-4 rounded-2xl text-xs space-y-2.5 shadow-lg ${
                      isMe
                        ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-br-none'
                        : 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700/80'
                    }`}
                  >
                    {msg.message_text && (
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.message_text}</p>
                    )}

                    {/* ATTACHMENT: IMAGE */}
                    {msg.attachment_type === 'image' && msg.attachment_url && (
                      <div className="rounded-xl overflow-hidden border border-white/20 mt-2 bg-black/40">
                        <img
                          src={msg.attachment_url}
                          alt="Paylaşılan Soru / Belge"
                          className="w-full max-h-60 object-cover cursor-pointer hover:opacity-90 transition"
                          onClick={() => setZoomedImage(msg.attachment_url!)}
                        />
                        <div className="p-2 bg-black/60 flex items-center justify-between text-[11px]">
                          <span className="flex items-center gap-1 text-slate-300">
                            <ImageIcon className="w-3.5 h-3.5 text-cyan-400" /> Soru Görseli
                          </span>
                          <button
                            onClick={() => setZoomedImage(msg.attachment_url!)}
                            className="text-cyan-300 hover:text-white flex items-center gap-1 font-semibold"
                          >
                            <Eye className="w-3 h-3" /> Büyüt
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ATTACHMENT: DOCUMENT / PDF */}
                    {msg.attachment_type === 'document' && (
                      <div className="p-3 rounded-xl bg-slate-950/80 border border-indigo-400/30 flex items-center justify-between gap-3 mt-2 text-white">
                        <div className="flex items-center space-x-2.5">
                          <div className="p-2 rounded-lg bg-red-500/20 text-red-400">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-bold text-xs text-slate-100">Kritik Çözüm & Soru Föyü.pdf</div>
                            <div className="text-[10px] text-slate-400">PDF Dokümanı &bull; 2.4 MB</div>
                          </div>
                        </div>

                        <a
                          href={msg.attachment_url || '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1 transition shadow"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Görüntüle</span>
                        </a>
                      </div>
                    )}

                    {/* ATTACHMENT: PROGRESS CARD (SNAPSHOT) */}
                    {msg.attachment_type === 'progress_card' && msg.progress_card_payload && (
                      <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-emerald-500/40 text-white space-y-3 mt-2 shadow-xl">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                              <Award className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-bold text-xs text-emerald-300 flex items-center gap-1">
                                <span>YKS Gelişim Karnesi</span>
                                <span className="text-[9px] bg-indigo-500/30 text-indigo-300 px-1.5 py-0.2 rounded font-mono">
                                  {msg.progress_card_payload.studentName}
                                </span>
                              </div>
                              <div className="text-[9px] text-slate-400">
                                {msg.progress_card_payload.calculatedAt ? new Date(msg.progress_card_payload.calculatedAt).toLocaleDateString('tr-TR') : 'Güncel Snapshot'}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-[9px] text-slate-400">Genel Skor</div>
                            <div className="text-base font-black text-cyan-300 font-mono">
                              {msg.progress_card_payload.overallScore}/100
                            </div>
                          </div>
                        </div>

                        {/* Metric Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                            <div className="text-[9px] text-slate-400 font-semibold uppercase">TYT Net</div>
                            <div className="text-sm font-black text-cyan-400 font-mono">
                              {msg.progress_card_payload.tytNet}
                            </div>
                          </div>

                          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                            <div className="text-[9px] text-slate-400 font-semibold uppercase">AYT Net</div>
                            <div className="text-sm font-black text-emerald-400 font-mono">
                              {msg.progress_card_payload.aytNet}
                            </div>
                          </div>

                          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                            <div className="text-[9px] text-slate-400 font-semibold uppercase">Plan Sadakati</div>
                            <div className="text-sm font-black text-indigo-300 font-mono">
                              %{msg.progress_card_payload.planFidelity}
                            </div>
                          </div>

                          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                            <div className="text-[9px] text-slate-400 font-semibold uppercase">Test Başarısı</div>
                            <div className="text-sm font-black text-amber-300 font-mono">
                              %{msg.progress_card_payload.testSuccess}
                            </div>
                          </div>
                        </div>

                        {/* Branch Success Bars */}
                        {msg.progress_card_payload.branchSuccess && (
                          <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
                            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
                              <span>Branş Dağılımı:</span>
                              <span className="text-[9px] text-indigo-400">Normalize Başarı</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-[10px]">
                              {normalizeBranchSuccess(msg.progress_card_payload.branchSuccess).map(b => (
                                <div key={b.subject} className="flex items-center justify-between bg-slate-900/80 px-2 py-1 rounded-lg">
                                  <span className="text-slate-300">{b.subject}:</span>
                                  <span className="font-bold text-cyan-300 font-mono">%{b.percentage}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Detail Modal Trigger */}
                        <button
                          onClick={() => setActiveCardPreview(msg.progress_card_payload!)}
                          className="w-full py-1.5 rounded-xl bg-indigo-600/40 hover:bg-indigo-600/60 border border-indigo-400/30 text-indigo-200 text-xs font-bold transition flex items-center justify-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Karnenin Detaylı Kıyaslamasını Gör</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT BAR */}
        <div className="p-3 sm:p-4 bg-slate-950/95 border-t border-slate-800 flex-shrink-0">
          <form onSubmit={handleSendText} className="flex items-center space-x-2">
            
            {/* Attachments Menu Button */}
            <button
              type="button"
              onClick={() => setIsAttachModalOpen(!isAttachModalOpen)}
              className="p-2.5 rounded-xl text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition"
              title="Dosya, Görsel veya Gelişim Grafiği Ekle"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            {currentUser.role === 'STUDENT' && (
              <button
                type="button"
                onClick={() => handleSendProgressCard()}
                className="p-2.5 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition"
                title="Hızlı Gelişim Grafiği Gönder"
              >
                <TrendingUp className="w-5 h-5" />
              </button>
            )}

            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Arkadaşına bir soru sor veya mesaj yaz..."
              className="flex-1 bg-slate-800/90 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />

            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:brightness-110 disabled:opacity-40 text-white transition shadow"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>

      {/* ATTACHMENT POPUP MODAL */}
      {isAttachModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-sm font-bold flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-cyan-400" />
                Paylaşım Eki Seç
              </h4>
              <button
                onClick={() => setIsAttachModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => handleSimulateAttachment('image')}
                className="w-full p-3 rounded-2xl bg-slate-800 hover:bg-slate-750 border border-slate-700 flex items-center space-x-3 text-left transition"
              >
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs">Soru Görseli / Fotoğraf</div>
                  <div className="text-[10px] text-slate-400">Çözemediğin sorunun görüntüsünü arkadaşına sor</div>
                </div>
              </button>

              <button
                onClick={() => handleSimulateAttachment('document')}
                className="w-full p-3 rounded-2xl bg-slate-800 hover:bg-slate-750 border border-slate-700 flex items-center space-x-3 text-left transition"
              >
                <div className="p-2 rounded-xl bg-red-500/20 text-red-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs">PDF Testi / Konu Föyü</div>
                  <div className="text-[10px] text-slate-400">12 soruluk test veya özet föy dokümanı paylaş</div>
                </div>
              </button>

              {currentUser.role === 'STUDENT' && (
                <button
                  onClick={() => handleSendProgressCard()}
                  className="w-full p-3 rounded-2xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/40 flex items-center space-x-3 text-left transition"
                >
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-emerald-300">Gelişim Grafiği Kartı</div>
                    <div className="text-[10px] text-slate-400">TYT/AYT netlerini ve plan sadakatini karne olarak gönder</div>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL FOR PROGRESS CARD SNAPSHOT */}
      {activeCardPreview && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 shadow-2xl space-y-4 text-white peer-chat-modal">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-400" />
                <h4 className="font-bold text-sm">
                  {activeCardPreview.studentName} — YKS Performans Özeti
                </h4>
              </div>
              <button
                onClick={() => setActiveCardPreview(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-1">
                <div className="text-[11px] text-slate-400 font-semibold uppercase">Genel Ağırlıklı Öğrenci Skoru</div>
                <div className="text-3xl font-black text-cyan-300 font-mono">
                  {activeCardPreview.overallScore} <span className="text-sm text-slate-400 font-normal">/ 100</span>
                </div>
                <p className="text-[10px] text-slate-500">
                  (Plan Sadakati %25 + Test Başarısı %25 + Deneme Ortalaması %25 + AI Skoru %25)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                  <div className="text-[10px] text-slate-400">Son TYT Neti</div>
                  <div className="text-lg font-black text-cyan-300 font-mono">{activeCardPreview.tytNet}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                  <div className="text-[10px] text-slate-400">Son AYT Neti</div>
                  <div className="text-lg font-black text-emerald-300 font-mono">{activeCardPreview.aytNet}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                  <div className="text-[10px] text-slate-400">Plan Sadakat Oranı</div>
                  <div className="text-lg font-black text-indigo-300 font-mono">%{activeCardPreview.planFidelity}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                  <div className="text-[10px] text-slate-400">Soru Bankası İsabeti</div>
                  <div className="text-lg font-black text-amber-300 font-mono">%{activeCardPreview.testSuccess}</div>
                </div>
              </div>

              {activeCardPreview.branchSuccess && (
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="text-[11px] font-bold text-slate-300">Normalize Branş Başarı Dağılımı</div>
                  <div className="space-y-1.5">
                    {normalizeBranchSuccess(activeCardPreview.branchSuccess).map(b => (
                      <div key={b.subject} className="space-y-0.5">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-slate-400">{b.subject}</span>
                          <span className="font-bold text-cyan-300">%{b.percentage}</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full"
                            style={{ width: `${b.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setActiveCardPreview(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
            >
              Kapat
            </button>
          </div>
        </div>
      )}

      {/* IMAGE ZOOM MODAL */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={zoomedImage}
              alt="Büyük Görsel"
              className="rounded-2xl max-w-full max-h-[85vh] object-contain shadow-2xl"
            />
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute -top-3 -right-3 p-2 rounded-full bg-slate-800 text-white hover:bg-slate-700 shadow-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
