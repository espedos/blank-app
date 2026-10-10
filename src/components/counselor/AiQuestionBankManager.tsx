'use client';

import React, { useState } from 'react';
import { AiQuestionBankItem, StudentTaskAssignment, User } from '@/types';
import { StorageService } from '@/lib/storage';
import { parseAndClassifyQuestion } from '@/lib/aiQuestionParser';
import { 
  Brain, 
  Plus, 
  Upload, 
  Sparkles, 
  Search, 
  Filter, 
  CheckCircle2, 
  BookOpen, 
  AlertTriangle, 
  Trash2, 
  Send, 
  Layers, 
  FileText, 
  HelpCircle,
  X,
  Check,
  Calendar,
  Clock
} from 'lucide-react';

interface AiQuestionBankManagerProps {
  counselor: User;
  students: User[];
  onAssignmentCreated?: () => void;
}

export const AiQuestionBankManager: React.FC<AiQuestionBankManagerProps> = ({
  counselor,
  students,
  onAssignmentCreated
}) => {
  const [questions, setQuestions] = useState<AiQuestionBankItem[]>(() => StorageService.getAiQuestions());
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Soru Ekleme Modalı & Formu
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [rawQuestionInput, setRawQuestionInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [previewParsedQuestion, setPreviewParsedQuestion] = useState<AiQuestionBankItem | null>(null);

  // Görev / Mini Deneme Oluşturma
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [targetStudentId, setTargetStudentId] = useState<string>(students[0]?.id || '');
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignmentType, setAssignmentType] = useState<'TOPIC_TEST' | 'CUMULATIVE_MIX' | 'BRANCH_MOCK'>('TOPIC_TEST');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Yapay Zeka ile Soruyu Analiz Et
  const handleAiAnalyze = () => {
    if (!rawQuestionInput.trim()) return;
    setIsAnalyzing(true);

    setTimeout(() => {
      const parsed = parseAndClassifyQuestion(
        rawQuestionInput, 
        'mentor', 
        counselor.name
      );
      setPreviewParsedQuestion(parsed);
      setIsAnalyzing(false);
    }, 600);
  };

  // 2. Analiz Edilen Soruyu Havuza Kaydet
  const handleSaveToBank = () => {
    if (!previewParsedQuestion) return;
    StorageService.saveAiQuestion(previewParsedQuestion);
    setQuestions(StorageService.getAiQuestions());
    setPreviewParsedQuestion(null);
    setRawQuestionInput('');
    setIsUploadModalOpen(false);
    showToast('✅ Soru yapay zeka tarafından kategorize edilip havuza eklendi!');
  };

  // 3. Soru Sil
  const handleDeleteQuestion = (id: string) => {
    if (confirm('Bu soruyu havuzdan silmek istediğinize emin misiniz?')) {
      StorageService.deleteAiQuestion(id);
      setQuestions(StorageService.getAiQuestions());
      setSelectedQuestionIds(prev => prev.filter(qId => qId !== id));
      showToast('Soru havuzdan kaldırıldı.');
    }
  };

  // 4. Soru Seçimi Toggle
  const toggleQuestionSelection = (id: string) => {
    setSelectedQuestionIds(prev => 
      prev.includes(id) ? prev.filter(qId => qId !== id) : [...prev, id]
    );
  };

  // 5. Öğrenciye Görev / Deneme Gönder
  const handleCreateAssignment = () => {
    if (!targetStudentId || selectedQuestionIds.length === 0) return;
    const targetStudent = students.find(s => s.id === targetStudentId);

    const firstQuestion = questions.find(q => q.id === selectedQuestionIds[0]);

    const newAssignment: StudentTaskAssignment = {
      id: `assign-${Date.now()}`,
      title: assignmentTitle.trim() || `${firstQuestion?.subject || 'Karma'} ${assignmentType === 'BRANCH_MOCK' ? 'Mini Deneme' : 'Ödev Testi'} (${selectedQuestionIds.length} Soru)`,
      mentorId: counselor.id,
      studentId: targetStudentId,
      questionIds: selectedQuestionIds,
      subject: firstQuestion?.subject || 'Karma',
      topic: firstQuestion?.topic || 'Çoklu Konu',
      assignmentType,
      status: 'PENDING_SCHEDULE',
      createdAt: new Date().toISOString()
    };

    StorageService.saveTaskAssignment(newAssignment);
    setIsAssignModalOpen(false);
    setSelectedQuestionIds([]);
    setAssignmentTitle('');
    showToast(`🚀 "${newAssignment.title}" başarıyla ${targetStudent?.name || 'öğrenciye'} görev olarak gönderildi!`);
    if (onAssignmentCreated) onAssignmentCreated();
  };

  // Filtrelenmiş Sorular
  const filteredQuestions = questions.filter(q => {
    const matchesSubject = selectedSubject === 'ALL' || q.subject === selectedSubject;
    const matchesDifficulty = selectedDifficulty === 'ALL' || q.difficulty === selectedDifficulty;
    const matchesSearch = !searchQuery.trim() || 
      q.questionText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.subject.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesDifficulty && matchesSearch;
  });

  const subjectsList = ['ALL', 'Matematik', 'Fizik', 'Kimya', 'Biyoloji', 'Türkçe', 'Geometri'];

  return (
    <div className="space-y-6">
      
      {/* Toast Bildirimi */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-indigo-600 text-white shadow-2xl font-bold text-xs animate-in slide-in-from-top-5">
          {toastMessage}
        </div>
      )}

      {/* Üst Bilgi Başlığı ve Hızlı İşlem Barı */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-indigo-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
            <Brain className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-black text-white">Mentor AI Soru Havuzu & Analiz Merkezi</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {questions.length} Soru Hafızada
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Karışık sorular yükleyin; yapay zeka ders, konu ve ÖSYM çeldiricilerini anında ayrıştırsın. İstediğiniz öğrenciye özel konu testi veya mini deneme derleyin.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {selectedQuestionIds.length > 0 && (
            <button
              onClick={() => setIsAssignModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition flex items-center space-x-2 active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>Öğrenciye Görev Gönder ({selectedQuestionIds.length})</span>
            </button>
          )}

          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:brightness-110 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center space-x-2 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Yeni Soru Yükle & AI Analizi</span>
          </button>
        </div>
      </div>

      {/* Filtre ve Arama Çubuğu */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Ders Filtreleri */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {subjectsList.map(subj => (
            <button
              key={subj}
              onClick={() => setSelectedSubject(subj)}
              className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap border ${
                selectedSubject === subj
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              {subj === 'ALL' ? 'Tüm Dersler' : subj}
            </button>
          ))}
        </div>

        {/* Zorluk & Arama */}
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <select
            value={selectedDifficulty}
            onChange={e => setSelectedDifficulty(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-semibold text-xs focus:outline-none"
          >
            <option value="ALL">Tüm Zorluklar</option>
            <option value="easy">Temel Seviye</option>
            <option value="medium">Orta Düzey</option>
            <option value="hard">İleri / Zor</option>
            <option value="osym_trap">⚠️ ÖSYM Çeldiricisi</option>
          </select>

          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Konu veya soru ara..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Soru Listesi Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredQuestions.length === 0 ? (
          <div className="col-span-2 p-12 text-center rounded-3xl bg-slate-900/60 border border-slate-800 text-slate-400 space-y-3">
            <HelpCircle className="w-10 h-10 mx-auto text-slate-500" />
            <h3 className="font-bold text-white text-sm">Eşleşen Soru Bulunamadı</h3>
            <p className="text-xs">Filtreleri sıfırlayabilir veya &quot;+ Yeni Soru Yükle&quot; butonundan yapay zekaya analiz ettirebilirsiniz.</p>
          </div>
        ) : (
          filteredQuestions.map(q => {
            const isSelected = selectedQuestionIds.includes(q.id);
            return (
              <div
                key={q.id}
                onClick={() => toggleQuestionSelection(q.id)}
                className={`p-5 rounded-3xl transition-all cursor-pointer border flex flex-col justify-between space-y-4 ${
                  isSelected
                    ? 'bg-indigo-950/40 border-indigo-500 shadow-xl shadow-indigo-500/10 ring-1 ring-indigo-500'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  {/* Başlık ve Rozetler */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {q.subject}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                        {q.topic}
                      </span>
                      {q.difficulty === 'osym_trap' ? (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                          <AlertTriangle className="w-2.5 h-2.5" /> ÖSYM Tuzağı
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-400 capitalize">
                          {q.difficulty === 'easy' ? 'Temel' : q.difficulty === 'medium' ? 'Orta' : 'Zor'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition ${
                        isSelected 
                          ? 'bg-indigo-600 border-indigo-500 text-white' 
                          : 'border-slate-700 bg-slate-800 text-transparent'
                      }`}>
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteQuestion(q.id);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        title="Soruyu Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Soru Metni */}
                  <p className="text-xs text-slate-200 mt-3 font-medium leading-relaxed whitespace-pre-wrap">
                    {q.questionText}
                  </p>

                  {/* Şıklar */}
                  {q.options && (
                    <div className="mt-3 grid grid-cols-2 gap-1.5 text-[11px]">
                      {Object.entries(q.options).map(([optKey, optVal]) => (
                        <div 
                          key={optKey}
                          className={`p-1.5 px-2 rounded-lg border font-mono ${
                            q.correctAnswer === optKey
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-bold'
                              : 'bg-slate-950/50 border-slate-800 text-slate-400'
                          }`}
                        >
                          <strong>{optKey})</strong> {String(optVal)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Alt Çözüm ve Bilgi Alanı */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="truncate max-w-[200px]">
                    Kaynak: <strong className="text-slate-300">{q.sourceExam || 'Mentor Arşivi'}</strong>
                  </span>
                  {q.correctAnswer && (
                    <span className="text-emerald-400 font-bold">
                      Doğru Cevap: ({q.correctAnswer})
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── MODAL 1: YENİ SORU YÜKLEME VE YAPAY ZEKA AYRIŞTIRMA MODALI ── */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Brain className="w-5 h-5 text-cyan-400" />
                <h3 className="font-extrabold text-white text-base">Yapay Zekaya Soru Yükle & Ayrıştır</h3>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Sorunun metnini doğrudan yapıştırın. Yapay zeka soruyu okuyup dersini, konusunu, zorluğunu, doğru şıkkını ve çözüm püf noktasını otomatik çıkaracaktır.
            </p>

            {/* Metin Giriş Alanı */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Soru Metni / Soru Şıkları:</label>
              <textarea
                rows={5}
                value={rawQuestionInput}
                onChange={e => setRawQuestionInput(e.target.value)}
                placeholder="Örnek: Eğim açısı 37 derece olan sürtünmeli eğik düzlemde 2 kg kütleli cisim kaymaktadır..."
                className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 text-xs focus:outline-none focus:border-cyan-500 font-mono leading-relaxed"
              />
            </div>

            {/* AI Analiz Tetikleme Butonu */}
            <div className="flex items-center justify-between">
              <div className="text-[11px] text-slate-500">
                💡 Şıklar ve cevap anahtarı varsa metne ekleyebilirsiniz (Örn: &quot;Cevap: C&quot;).
              </div>
              <button
                onClick={handleAiAnalyze}
                disabled={isAnalyzing || !rawQuestionInput.trim()}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:brightness-110 text-white font-bold text-xs shadow-md transition flex items-center space-x-2 disabled:opacity-40"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isAnalyzing ? 'Yapay Zeka İnceliyor...' : '🧠 Analiz Et & Sınıflandır'}</span>
              </button>
            </div>

            {/* Önizleme Kartı (AI Çıktısı) */}
            {previewParsedQuestion && (
              <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/40 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between text-xs font-bold text-cyan-300 border-b border-indigo-500/20 pb-2">
                  <span>Yapay Zeka Tarafından Çıkarılan Künye:</span>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-200 text-[10px]">
                    Otomatik Etiketlendi
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Ders</span>
                    <strong className="text-white">{previewParsedQuestion.subject}</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Konu</span>
                    <strong className="text-white">{previewParsedQuestion.topic}</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Tahmini Doğru Şık</span>
                    <strong className="text-emerald-400">({previewParsedQuestion.correctAnswer})</strong>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900 text-xs text-slate-300 space-y-1">
                  <div className="font-bold text-amber-400 text-[11px]">ÖSYM Püf Noktası:</div>
                  <p className="text-[11px] leading-relaxed text-slate-400">{previewParsedQuestion.osymTrapNote}</p>
                </div>

                <button
                  onClick={handleSaveToBank}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-bold text-xs shadow-lg transition flex items-center justify-center space-x-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Onayla ve Soru Havuzuna Ekle</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL 2: ÖĞRENCİYE GÖREV / MİNİ DENEME GÖNDERME MODALI ── */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Send className="w-5 h-5 text-emerald-400" />
                <h3 className="font-extrabold text-white text-base">Öğrenciye Görev / Deneme Gönder</h3>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Seçtiğiniz <strong className="text-emerald-400">{selectedQuestionIds.length} soru</strong> öğrencinin paneline görev olarak iletilecektir. Öğrenci bu görevi takvimindeki uygun boş bir saate kendisi yerleştirebilecektir.
            </p>

            {/* Öğrenci Seçici */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Hedef Öğrenci:</label>
              <select
                value={targetStudentId}
                onChange={e => setTargetStudentId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold focus:outline-none"
              >
                {students.map(st => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.grade === '12' ? '12. Sınıf' : 'Mezun'})
                  </option>
                ))}
              </select>
            </div>

            {/* Görev Başlığı */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Görev / Deneme Başlığı (Opsiyonel):</label>
              <input
                type="text"
                placeholder="Örn: Hafta Sonu Trigonometri & Türev Mini Denemesi"
                value={assignmentTitle}
                onChange={e => setAssignmentTitle(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Deneme / Ödev Türü */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Ödev Formatı:</label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {[
                  { id: 'TOPIC_TEST', label: 'Konu Testi' },
                  { id: 'CUMULATIVE_MIX', label: 'Kümülatif Karma' },
                  { id: 'BRANCH_MOCK', label: 'Mini Branş Denemesi' }
                ].map(type => (
                  <button
                    key={type.id}
                    onClick={() => setAssignmentType(type.id as any)}
                    className={`p-2 rounded-xl border text-center font-bold text-[11px] transition ${
                      assignmentType === type.id
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleCreateAssignment}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:brightness-110 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition flex items-center justify-center space-x-2 active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>Görevi Öğrenciye İlet ({selectedQuestionIds.length} Soru)</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
