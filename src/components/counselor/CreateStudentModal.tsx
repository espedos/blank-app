'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  UserPlus, 
  CheckCircle2, 
  BookOpen, 
  Calendar, 
  Shield, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  Copy, 
  Check, 
  GraduationCap, 
  MapPin, 
  Phone, 
  Mail, 
  Award,
  Layers
} from 'lucide-react';
import { EducationLevel, TargetExam, FieldType, User } from '@/types';
import { StorageService } from '@/lib/storage';
import { 
  TYT_SUBJECTS, 
  AYT_SAYISAL_SUBJECTS, 
  AYT_EA_SUBJECTS, 
  AYT_SOZEL_SUBJECTS 
} from '@/data/seedData';
import confetti from 'canvas-confetti';

interface CreateStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStudentCreated?: (newStudent: User) => void;
  onSuccess?: (newStudent: User) => void;
}

export const CreateStudentModal: React.FC<CreateStudentModalProps> = ({
  isOpen,
  onClose,
  onStudentCreated,
  onSuccess
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [copiedPassword, setCopiedPassword] = useState(false);

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState<number | ''>(17);
  const [educationLevel, setEducationLevel] = useState<EducationLevel>('12th');
  const [targetExam, setTargetExam] = useState<TargetExam>('TYT_AYT');
  const [fieldType, setFieldType] = useState<FieldType>('SAYISAL');
  const [city, setCity] = useState('İstanbul');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [parentName, setParentName] = useState('');
  const [referenceName, setReferenceName] = useState('');
  const [programStartDate, setProgramStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [examTargetDate, setExamTargetDate] = useState('2027-06-05');

  // Adım 2: Seçili Ders ID'leri
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);

  // Sonuç State
  const [resultData, setResultData] = useState<{
    student: User;
    taskCount: number;
    generatedPassword: string;
    totalWeeks: number;
  } | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Branşa göre varsayılan dersleri otomatik seç
  useEffect(() => {
    const tytIds = TYT_SUBJECTS.map(s => s.id);
    let aytIds: string[] = [];

    if (fieldType === 'SAYISAL') {
      aytIds = AYT_SAYISAL_SUBJECTS.map(s => s.id);
    } else if (fieldType === 'ESIT_AGIRLIK') {
      aytIds = AYT_EA_SUBJECTS.map(s => s.id);
    } else if (fieldType === 'SOZEL') {
      aytIds = AYT_SOZEL_SUBJECTS.map(s => s.id);
    }

    setSelectedSubjectIds([...tytIds, ...aytIds]);
  }, [fieldType, targetExam]);

  if (!isOpen) return null;

  // Adım 1 Doğrulama
  const handleProceedToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!firstName.trim()) {
      setFormError('Lütfen öğrencinin adını giriniz.');
      return;
    }
    if (!lastName.trim()) {
      setFormError('Lütfen öğrencinin soyadını giriniz.');
      return;
    }
    if (!programStartDate) {
      setFormError('Lütfen program başlangıç tarihini seçiniz.');
      return;
    }

    setStep(2);
  };

  // Ders Seçimi Toggle
  const toggleSubject = (subjectId: string) => {
    setSelectedSubjectIds(prev =>
      prev.includes(subjectId) ? prev.filter(id => id !== subjectId) : [...prev, subjectId]
    );
  };

  // Toplu Seçim Butonları
  const handleSelectAll = (category: 'TYT' | 'AYT') => {
    if (category === 'TYT') {
      const tytIds = TYT_SUBJECTS.map(s => s.id);
      setSelectedSubjectIds(prev => Array.from(new Set([...prev, ...tytIds])));
    } else {
      let aytIds: string[] = [];
      if (fieldType === 'SAYISAL') aytIds = AYT_SAYISAL_SUBJECTS.map(s => s.id);
      else if (fieldType === 'ESIT_AGIRLIK') aytIds = AYT_EA_SUBJECTS.map(s => s.id);
      else aytIds = AYT_SOZEL_SUBJECTS.map(s => s.id);
      setSelectedSubjectIds(prev => Array.from(new Set([...prev, ...aytIds])));
    }
  };

  const handleClearCategory = (category: 'TYT' | 'AYT') => {
    if (category === 'TYT') {
      const tytIds = new Set(TYT_SUBJECTS.map(s => s.id));
      setSelectedSubjectIds(prev => prev.filter(id => !tytIds.has(id)));
    } else {
      const aytIds = new Set([
        ...AYT_SAYISAL_SUBJECTS.map(s => s.id),
        ...AYT_EA_SUBJECTS.map(s => s.id),
        ...AYT_SOZEL_SUBJECTS.map(s => s.id)
      ]);
      setSelectedSubjectIds(prev => prev.filter(id => !aytIds.has(id)));
    }
  };

  // Kaydet ve Müfredatı Oluştur
  const handleSaveAndGenerate = () => {
    if (selectedSubjectIds.length === 0) {
      setFormError('Lütfen programa dahil edilecek en az 1 ders seçiniz.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const res = StorageService.registerStudent({
        first_name: firstName,
        last_name: lastName,
        age: typeof age === 'number' ? age : undefined,
        education_level: educationLevel,
        target_exam: targetExam,
        field_type: targetExam === 'TYT_AYT' ? fieldType : null,
        city,
        address,
        email,
        phone,
        parent_name: parentName,
        reference_name: referenceName,
        program_start_date: programStartDate,
        exam_target_date: examTargetDate,
        selected_subjects: selectedSubjectIds
      });

      setResultData(res);
      setStep(3);

      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.5 }
        });
      } catch (e) {}

      if (onStudentCreated) onStudentCreated(res.student);
      if (onSuccess) onSuccess(res.student);
    } catch (err: any) {
      setFormError(err?.message || 'Öğrenci kaydedilirken bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyPassword = () => {
    if (resultData) {
      navigator.clipboard.writeText(resultData.generatedPassword);
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[92vh]">
        
        {/* Modal Üst Başlık & İlerleme Göstergesi */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                <span>Yeni Öğrenci Kaydı & Müfredat Dağıtım Sihirbazı</span>
              </h2>
              <p className="text-xs text-slate-400">
                {step === 1 && 'Adım 1/2: Öğrenci ve Sınav Hedef Bilgileri'}
                {step === 2 && 'Adım 2/2: Branşa Göre Akıllı Ders Seçimi & Planlama'}
                {step === 3 && 'Kayıt Başarılı: Şifre ve Program Hazır'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* İlerleme Çubuğu */}
        <div className="w-full bg-slate-800 h-1">
          <div
            className="bg-gradient-to-r from-emerald-500 to-indigo-500 h-1 transition-all duration-300"
            style={{ width: step === 1 ? '33%' : step === 2 ? '66%' : '100%' }}
          />
        </div>

        {/* Modal Gövdesi */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {formError && (
            <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
              <span className="font-bold">Hata:</span> {formError}
            </div>
          )}

          {/* ================================================================= */}
          {/* ADIM 1: ÖĞRENCİ VE SINAV BİLGİLERİ */}
          {/* ================================================================= */}
          {step === 1 && (
            <form onSubmit={handleProceedToStep2} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Öğrenci Adı <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Ahmet Barış"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
                  />
                  <span className="text-[10px] text-slate-500">Giriş şifresi bu isimden üretilecektir (Örn: Ahmet.123*).</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Öğrenci Soyadı <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Yılmaz"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Yaşı
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={40}
                    value={age}
                    onChange={e => setAge(e.target.value === '' ? '' : parseInt(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Öğrenim Durumu <span className="text-emerald-400">*</span>
                  </label>
                  <select
                    value={educationLevel}
                    onChange={e => setEducationLevel(e.target.value as EducationLevel)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
                  >
                    <option value="12th">12. Sınıf (YKS Hazırlık)</option>
                    <option value="graduate">Mezun (YKS Hazırlık)</option>
                    <option value="11th">11. Sınıf</option>
                    <option value="10th">10. Sınıf</option>
                    <option value="9th">9. Sınıf</option>
                    <option value="8th">8. Sınıf (LGS Hazırlık)</option>
                    <option value="7th">7. Sınıf</option>
                    <option value="6th">6. Sınıf</option>
                    <option value="5th">5. Sınıf</option>
                    <option value="university">Üniversite Öğrencisi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Hedef Sınav <span className="text-emerald-400">*</span>
                  </label>
                  <select
                    value={targetExam}
                    onChange={e => setTargetExam(e.target.value as TargetExam)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500 transition font-bold text-emerald-400"
                  >
                    <option value="TYT_AYT">YKS (TYT / AYT)</option>
                    <option value="LGS">LGS</option>
                    <option value="KPSS">KPSS</option>
                    <option value="AGS">AGS (Akademi Giriş Sınavı)</option>
                    <option value="ALES">ALES</option>
                    <option value="YDS">YDS</option>
                  </select>
                </div>
              </div>

              {/* Sınav Türü / Branş (Sadece TYT/AYT için) */}
              {targetExam === 'TYT_AYT' && (
                <div className="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-2">
                  <label className="block text-xs font-bold text-indigo-300">
                    AYT Sayısal / Eşit Ağırlık / Sözel Branş Seçimi:
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { id: 'SAYISAL', label: 'Sayısal (MF)', desc: 'Mat, Fiz, Kim, Biyo' },
                      { id: 'ESIT_AGIRLIK', label: 'Eşit Ağırlık (TM)', desc: 'Mat, Edeb, Tar-1, Coğ-1' },
                      { id: 'SOZEL', label: 'Sözel (TS)', desc: 'Edeb, Tar-2, Coğ-2, Fels' }
                    ].map(f => (
                      <button
                        type="button"
                        key={f.id}
                        onClick={() => setFieldType(f.id as FieldType)}
                        className={`p-3 rounded-xl border text-left transition ${
                          fieldType === f.id
                            ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
                            : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <div className="font-bold text-xs">{f.label}</div>
                        <div className={`text-[10px] mt-0.5 ${fieldType === f.id ? 'text-indigo-200' : 'text-slate-500'}`}>
                          {f.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tarih Seçimi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Program Başlangıç Tarihi (1. Gün) <span className="text-emerald-400">*</span></span>
                  </label>
                  <input
                    type="date"
                    required
                    value={programStartDate}
                    onChange={e => setProgramStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500 transition font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <span>Müfredat Bitiş & Sınav Hedefi</span>
                  </label>
                  <input
                    type="date"
                    value={examTargetDate}
                    onChange={e => setExamTargetDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500 transition font-mono"
                  />
                  <span className="text-[10px] text-slate-500">Varsayılan: 5 Haziran 2027 (Sınavdan 2 hafta önce)</span>
                </div>
              </div>

              {/* İletişim & Ek Bilgiler */}
              <div className="pt-2 border-t border-slate-800 space-y-3">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">İletişim ve Veli Bilgileri (İsteğe Bağlı)</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Telefon Numarası</label>
                    <input
                      type="tel"
                      placeholder="05XX XXX XX XX"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">E-Posta Adresi</label>
                    <input
                      type="email"
                      placeholder="ogrenci@eposta.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Veli Adı Soyadı</label>
                    <input
                      type="text"
                      placeholder="Örn: Mehmet Yılmaz (Baba)"
                      value={parentName}
                      onChange={e => setParentName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Referans (Öneren Kişi / Kurum)</label>
                    <input
                      type="text"
                      placeholder="Örn: X Fen Lisesi / Zeynep Hoca"
                      value={referenceName}
                      onChange={e => setReferenceName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* İleri Butonu */}
              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition active:scale-95"
                >
                  <span>Devam Et: Ders Seçimi</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* ================================================================= */}
          {/* ADIM 2: BRANŞA GÖRE DERS SEÇİMİ */}
          {/* ================================================================= */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400">Seçilen Öğrenci: </span>
                  <strong className="text-white">{firstName} {lastName}</strong>
                  <span className="mx-2 text-slate-600">|</span>
                  <span className="text-emerald-400 font-semibold">{fieldType} - {targetExam}</span>
                </div>
                <div className="text-[11px] text-indigo-300 font-mono">
                  {selectedSubjectIds.length} ders seçili
                </div>
              </div>

              {/* 1. TYT Grubu */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">TYT Grubu Dersleri</h3>
                    <span className="text-[10px] text-slate-500">(Tüm adaylar için zorunlu temel)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <button
                      type="button"
                      onClick={() => handleSelectAll('TYT')}
                      className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white"
                    >
                      Tümünü Seç
                    </button>
                    <button
                      type="button"
                      onClick={() => handleClearCategory('TYT')}
                      className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 hover:text-rose-300"
                    >
                      Kaldır
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {TYT_SUBJECTS.map(sub => {
                    const isChecked = selectedSubjectIds.includes(sub.id);
                    return (
                      <label
                        key={sub.id}
                        className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer select-none transition ${
                          isChecked
                            ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSubject(sub.id)}
                          className="w-4 h-4 rounded text-amber-500 bg-slate-800 border-slate-700 focus:ring-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold truncate">{sub.name}</div>
                          <div className="text-[10px] opacity-75">{sub.topics.length} Konu</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* 2. AYT Grubu */}
              <div className="space-y-2.5 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      AYT {fieldType} Grubu Dersleri
                    </h3>
                    <span className="text-[10px] text-slate-500">(Branşa göre otomatik seçildi)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <button
                      type="button"
                      onClick={() => handleSelectAll('AYT')}
                      className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white"
                    >
                      Tümünü Seç
                    </button>
                    <button
                      type="button"
                      onClick={() => handleClearCategory('AYT')}
                      className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 hover:text-rose-300"
                    >
                      Kaldır
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(fieldType === 'SAYISAL'
                    ? AYT_SAYISAL_SUBJECTS
                    : fieldType === 'ESIT_AGIRLIK'
                    ? AYT_EA_SUBJECTS
                    : AYT_SOZEL_SUBJECTS
                  ).map(sub => {
                    const isChecked = selectedSubjectIds.includes(sub.id);
                    return (
                      <label
                        key={sub.id}
                        className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer select-none transition ${
                          isChecked
                            ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-200'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSubject(sub.id)}
                          className="w-4 h-4 rounded text-indigo-500 bg-slate-800 border-slate-700 focus:ring-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold truncate">{sub.name}</div>
                          <div className="text-[10px] opacity-75">{sub.topics.length} Konu</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Alt Butonlar */}
              <div className="pt-4 flex items-center justify-between border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Bilgileri Düzenle</span>
                </button>

                <button
                  type="button"
                  disabled={isSubmitting || selectedSubjectIds.length === 0}
                  onClick={handleSaveAndGenerate}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 disabled:opacity-50 text-white font-extrabold text-xs shadow-xl shadow-emerald-500/30 flex items-center gap-2 transition active:scale-95"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isSubmitting ? 'Müfredat Dağıtılıyor...' : 'Öğrenciyi Kaydet ve Programı Oluştur'}</span>
                </button>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* ADIM 3: BAŞARI KARTI */}
          {/* ================================================================= */}
          {step === 3 && resultData && (
            <div className="p-6 text-center space-y-5 animate-fadeIn">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-xl">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-white">Öğrenci Başarıyla Eklendi!</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Müfredat konuları pedagojik sırayla ve haftalık ritme göre takvime işlendi.
                </p>
              </div>

              {/* Şifre ve Bilgi Kutusu */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/40 text-left space-y-3 max-w-md mx-auto shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs text-slate-400">Öğrenci Adı:</span>
                  <span className="text-sm font-bold text-white">{resultData.student.name}</span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs text-slate-400">Giriş Şifresi:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono font-extrabold text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                      {resultData.generatedPassword}
                    </span>
                    <button
                      onClick={handleCopyPassword}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                      title="Şifreyi Kopyala"
                    >
                      {copiedPassword ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs text-slate-400">Planlanan Hafta Sayısı:</span>
                  <span className="text-xs font-bold text-indigo-300">{resultData.totalWeeks} Hafta (5 Haziran 2027 Hedefi)</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Oluşturulan Takvim Görevi:</span>
                  <span className="text-xs font-bold text-cyan-300">{resultData.taskCount} Adet Görev</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-xs text-indigo-300 text-left max-w-md mx-auto">
                💡 <strong>Önemli Not:</strong> Öğrenci sisteme <strong className="text-white">{resultData.generatedPassword}</strong> şifresiyle hemen giriş yapabilir. Takvimini dilediğiniz zaman Danışman panelinden düzenleyebilirsiniz.
              </div>

              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs shadow-lg transition"
                >
                  Öğrenci Listesine Dön ve İncele
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
