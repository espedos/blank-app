'use client';

import React, { useState, useEffect } from 'react';
import { User, AiWeeklyReport } from '@/types';
import { StorageService } from '@/lib/storage';
import { PdfGenerator } from '@/lib/pdfGenerator';
import { 
  X, 
  Send, 
  Copy, 
  Check, 
  Printer, 
  RotateCw, 
  Phone, 
  User as UserIcon, 
  Sparkles, 
  FileText, 
  Share2, 
  Award, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  MessageSquare
} from 'lucide-react';

interface ParentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: User;
  onRefreshStudentData?: () => void;
}

export const ParentReportModal: React.FC<ParentReportModalProps> = ({
  isOpen,
  onClose,
  student,
  onRefreshStudentData
}) => {
  const [weeklyReport, setWeeklyReport] = useState<AiWeeklyReport | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [parentName, setParentName] = useState(student.parent_name || '');
  const [parentPhone, setParentPhone] = useState(student.parent_phone || '');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Öğrencinin mevcut raporunu yükle veya yoksa oluştur
  const loadReport = () => {
    const reports = StorageService.getWeeklyReports(student.id);
    if (reports.length > 0) {
      setWeeklyReport(reports[0]);
    } else {
      generateReport();
    }
  };

  useEffect(() => {
    if (isOpen) {
      setParentName(student.parent_name || '');
      setParentPhone(student.parent_phone || '');
      loadReport();
    }
  }, [isOpen, student.id]);

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-weekly-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: student.id })
      });
      const data = await res.json();
      if (data.success && data.report) {
        setWeeklyReport(data.report);
        if (onRefreshStudentData) onRefreshStudentData();
      }
    } catch (err) {
      console.error('Error generating parent report:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  // Veli İletişim Bilgilerini Kaydet
  const handleSaveContact = () => {
    const updated = StorageService.updateUserProfile(student.id, {
      parent_name: parentName.trim(),
      parent_phone: parentPhone.trim()
    });
    if (updated) {
      setSaveStatus('✅ Veli iletişim bilgileri güncellendi.');
      setIsEditingContact(false);
      if (onRefreshStudentData) onRefreshStudentData();
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  // WhatsApp Mesaj Metnini Panoya Kopyala
  const handleCopyWhatsAppText = () => {
    const textToCopy = weeklyReport?.parent_whatsapp_text || generateDefaultWhatsAppText();
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // WhatsApp Sohbetini Aç
  const handleOpenWhatsApp = () => {
    const textToSend = weeklyReport?.parent_whatsapp_text || generateDefaultWhatsAppText();
    let cleanPhone = (parentPhone || student.parent_phone || '').replace(/[^0-9]/g, '');
    
    // Türkiye numarası formatlama (0532 -> 90532)
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '90' + cleanPhone.slice(1);
    } else if (cleanPhone.length === 10 && !cleanPhone.startsWith('90')) {
      cleanPhone = '90' + cleanPhone;
    }

    const encodedText = encodeURIComponent(textToSend);
    const whatsappUrl = cleanPhone 
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`
      : `https://api.whatsapp.com/send?text=${encodedText}`;

    window.open(whatsappUrl, '_blank');
  };

  // Resmi PDF Raporunu Aç / Yazdır
  const handleOpenPdfReport = () => {
    const reportData = weeklyReport;
    const studentTasks = StorageService.getTasks(student.id);
    const studentExams = StorageService.getExams(student.id);

    const html = PdfGenerator.generateParentWeeklyReportHtml({
      studentName: student.name,
      studentGrade: student.grade === 'MEZUN' ? 'Mezun' : `${student.grade || 12}. Sınıf`,
      studentField: student.field_type === 'ESIT_AGIRLIK' ? 'Eşit Ağırlık (EA)' : student.field_type === 'SOZEL' ? 'Sözel' : 'Sayısal (SAY)',
      parentName: parentName || student.parent_name || 'Sayın Velimiz',
      counselorName: 'Cengiz Deniz (Eğitim Koçu)',
      reportPeriod: `${reportData?.report_week_start || '22.09.2026'} - ${reportData?.report_week_end || '28.09.2026'}`,
      overallScore: reportData?.overall_score || 88,
      taskCompletionRate: reportData?.task_completion_rate || 92,
      totalQuestionsSolved: reportData?.total_questions_solved || 540,
      accuracyRate: reportData?.accuracy_rate || 84,
      academicSummary: reportData?.academic_summary || `${student.name} bu hafta planlanan etüt programında üstün sadakat gösterdi. Soru çözüm hedeflerini tamamladı.`,
      parentFacingNotes: reportData?.parent_facing_notes || 'Öğrencimizin haftalık çalışma disiplini hedeflenen düzeydedir. Ev ortamında dinlenme saatlerine özen gösterilmesi motivasyonunu artıracaktır.',
      weeklyHighlights: reportData?.weekly_highlights || [
        'Haftalık etüt tamamlama oranı %90 üzerinde gerçekleşti.',
        'Soru çözüm hedefleri eksiksiz uygulandı.',
        'Son denemede hedef puan bandı korundu.'
      ],
      examSummary: reportData?.exam_summary || {
        tytNet: 94.5,
        aytNet: 68.25,
        estimatedRank: 'İlk 1.200 - 2.800',
        lastExamTitle: 'Özdebir Türkiye Geneli TYT Denemesi'
      },
      subjectBreakdown: reportData?.subject_breakdown || [
        { subject: 'Matematik', questionCount: 180, correctCount: 154, accuracy: 85.5 },
        { subject: 'Fizik', questionCount: 120, correctCount: 96, accuracy: 80.0 },
        { subject: 'Kimya', questionCount: 90, correctCount: 76, accuracy: 84.4 },
        { subject: 'Biyoloji', questionCount: 90, correctCount: 78, accuracy: 86.6 }
      ]
    });

    PdfGenerator.openPrintablePdf(html);
  };

  // Varsayılan WhatsApp Metni (Eğer rapor henüz yoksa)
  const generateDefaultWhatsAppText = () => {
    return `🌟 *VİRA AKADEMİ - HAFTALIK ÖĞRENCİ GELİŞİM RAPORU* 🌟

👤 *Öğrenci:* ${student.name}
👨‍🏫 *Danışman:* Cengiz Deniz

📊 *HAFTALIK PERFORMANS ÖZETİ*
• *Genel Başarı Puanı:* 88 / 100
• *Etüt Sadakati:* %92
• *Çözülen Soru:* 540 Soru
• *Soru İsabet Oranı:* %84

📝 *SON DENEME VE SIRALAMA TAHMİNİ*
• *TYT Net:* 94.50 Net
• *AYT Net:* 68.25 Net
• *Tahmini Sıralama:* İlk 1.200 - 2.800

💡 *KOÇ DEĞERLENDİRMESİ*
${student.name} bu hafta etüt programını disiplinle tamamladı. Gösterdiği kararlılık hedeflediği üniversite yolunda büyük bir adımdır.

🔗 *Öğrenci Portalı:* http://localhost:3000/student/${student.id}

_Vira Akademi YKS Koçluk Sistemi_`;
  };

  const displayText = weeklyReport?.parent_whatsapp_text || generateDefaultWhatsAppText();

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn">
      <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto">
        
        {/* ÜST BAŞLIK */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-indigo-950/60 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-lg shadow-emerald-500/20">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  Haftalık Otomatik Veli Raporlayıcısı
                </h3>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold uppercase">
                  WhatsApp &bull; PDF
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                <strong className="text-slate-200">{student.name}</strong> &bull; Haftalık netler, çözülen sorular ve koç değerlendirmesi
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={generateReport}
              disabled={isGenerating}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition text-xs flex items-center gap-1.5"
              title="Yapay zeka ile raporu yeniden analiz et"
            >
              <RotateCw className={`w-4 h-4 ${isGenerating ? 'animate-spin text-emerald-400' : ''}`} />
              <span className="hidden sm:inline">Raporu Yenile</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* İÇERİK GÖVDESİ */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">

          {/* VELİ İLETİŞİM VE TELEFON BİLGİ KARTI */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-300">
                <Phone className="w-4 h-4 text-emerald-400" />
                <span>Kayıtlı Veli İletişim Bilgileri</span>
                {saveStatus && (
                  <span className="text-[11px] text-emerald-400 font-medium ml-2 animate-fadeIn">
                    {saveStatus}
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsEditingContact(!isEditingContact)}
                className="text-xs text-indigo-400 hover:text-indigo-300 underline font-medium self-start sm:self-auto"
              >
                {isEditingContact ? 'Düzenlemeyi İptal Et' : 'Veli Bilgilerini Değiştir'}
              </button>
            </div>

            {isEditingContact ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 animate-fadeIn">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Veli Adı Soyadı</label>
                  <input
                    type="text"
                    value={parentName}
                    onChange={e => setParentName(e.target.value)}
                    placeholder="Örn: Ayşe Deniz (Anne)"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Veli Telefonu (WhatsApp)</label>
                  <input
                    type="tel"
                    value={parentPhone}
                    onChange={e => setParentPhone(e.target.value)}
                    placeholder="0532 555 12 34"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleSaveContact}
                    className="w-full px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition"
                  >
                    Bilgileri Kaydet
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <div className="flex items-center space-x-2 text-slate-300">
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>Veli: <strong className="text-white">{parentName || 'Belirtilmedi'}</strong></span>
                </div>
                <div className="flex items-center space-x-2 text-slate-300">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>WhatsApp: <strong className="text-emerald-400">{parentPhone || 'Belirtilmedi'}</strong></span>
                </div>
              </div>
            )}
          </div>

          {/* 4 BÜYÜK KPI GÖSTERGESİ */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-indigo-500/20 text-center">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Haftalık Skor</div>
              <div className="text-xl sm:text-2xl font-black text-cyan-300 mt-0.5">
                {weeklyReport?.overall_score || 88} <span className="text-xs text-slate-500">/100</span>
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-emerald-500/20 text-center">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Etüt Sadakati</div>
              <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-0.5">
                %{weeklyReport?.task_completion_rate || 92}
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-cyan-500/20 text-center">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Çözülen Soru</div>
              <div className="text-xl sm:text-2xl font-black text-indigo-300 mt-0.5">
                {weeklyReport?.total_questions_solved || 540}
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-amber-500/20 text-center">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Soru İsabeti</div>
              <div className="text-xl sm:text-2xl font-black text-amber-300 mt-0.5">
                %{weeklyReport?.accuracy_rate || 84}
              </div>
            </div>
          </div>

          {/* 2 SÜTUNLU AKSİYON & ÖNİZLEME ALANI */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

            {/* SOL SÜTUN: HIZLI PAYLAŞIM VE PDF BUTONLARI (5 Sütun) */}
            <div className="lg:col-span-5 space-y-4">
              
              {/* WhatsApp Gönder Kartı */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/30 space-y-3">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs uppercase tracking-wide">
                  <Send className="w-4 h-4" />
                  <span>Tek Tıkla WhatsApp Gönder</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Hazırlanan haftalık gelişim özetini velinin WhatsApp numarasına doğrudan gönderin veya panoya kopyalayın.
                </p>

                <div className="flex flex-col gap-2 pt-1">
                  <button
                    onClick={handleOpenWhatsApp}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <Send className="w-4 h-4" />
                    <span>WhatsApp Web / Uygulamada Gönder</span>
                  </button>

                  <button
                    onClick={handleCopyWhatsAppText}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                    <span>{copied ? 'Metin Kopyalandı! ✓' : 'WhatsApp Metnini Kopyala'}</span>
                  </button>
                </div>
              </div>

              {/* Resmi PDF İndir Kartı */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 border border-indigo-500/30 space-y-3">
                <div className="flex items-center space-x-2 text-indigo-400 font-bold text-xs uppercase tracking-wide">
                  <Printer className="w-4 h-4" />
                  <span>Resmi A4 PDF Karnesi</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Vira Akademi antetli, ders dağılımlı ve koç imzalı kurumsal haftalık karne oluşturun.
                </p>

                <button
                  onClick={handleOpenPdfReport}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 transition hover:scale-[1.01] active:scale-[0.99]"
                >
                  <Printer className="w-4 h-4" />
                  <span>Resmi PDF Raporu Aç & Yazdır</span>
                </button>
              </div>

              {/* Koç Tavsiye Notu */}
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs space-y-1">
                <div className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Koçluk İpucu:</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Velilerle haftalık düzenli rapor paylaşmak, öğrenci üzerindeki ev içi sınav baskısını %65 oranında azaltmakta ve motivasyonu artırmaktadır.
                </p>
              </div>

            </div>

            {/* SAĞ SÜTUN: CANLI WHATSAPP MESAJ SOHBET BALONU ÖNİZLEMESİ (7 Sütun) */}
            <div className="lg:col-span-7 flex flex-col">
              <div className="text-xs font-bold text-slate-400 mb-2 flex items-center justify-between">
                <span>💬 WhatsApp Mesaj Önizlemesi</span>
                <span className="text-[11px] text-slate-500">Canlı Formatlı Görünüm</span>
              </div>

              {/* WhatsApp Tarzı Sohbet Penceresi */}
              <div className="rounded-2xl border border-slate-800 bg-[#0b141a] p-4 flex flex-col flex-1 shadow-inner relative overflow-hidden">
                {/* Sohbet Üst Başlığı */}
                <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-800 mb-3 text-xs">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white text-xs">
                    VA
                  </div>
                  <div>
                    <div className="font-bold text-slate-200">Vira Akademi Veli Hattı</div>
                    <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Çevrimiçi
                    </div>
                  </div>
                </div>

                {/* Mesaj Balonu */}
                <div className="bg-[#005c4b]/80 border border-[#005c4b] rounded-2xl rounded-tl-sm p-4 text-xs text-slate-100 font-sans shadow-md max-w-full overflow-x-auto whitespace-pre-wrap leading-relaxed select-text">
                  {displayText}
                  
                  <div className="flex items-center justify-end space-x-1 text-[10px] text-emerald-200/60 mt-2">
                    <span>{new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="text-cyan-300 font-bold">✓✓</span>
                  </div>
                </div>

                <div className="mt-3 flex justify-end">
                  <button
                    onClick={handleCopyWhatsAppText}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Kopyalandı' : 'Mesajı Kopyala'}</span>
                  </button>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* ALT KAPATMA ÇUBUĞU */}
        <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center text-xs text-slate-500">
          <div>
            Vira Akademi &bull; Akıllı Veli Bilgilendirme ve Koordinasyon Modülü
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
