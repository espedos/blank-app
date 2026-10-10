'use client';

import React, { useState, useEffect } from 'react';
import { User, StudentScoreProfile, HourlyTask, ExamResult } from '@/types';
import { StorageService } from '@/lib/storage';
import { 
  Award, 
  BookOpen, 
  Calendar, 
  CheckCircle2, 
  Flame, 
  HelpCircle, 
  Lock, 
  LogOut, 
  MessageCircle, 
  RotateCw, 
  Settings, 
  Shield, 
  Sparkles, 
  Target, 
  TrendingUp, 
  UserCheck, 
  UserPlus, 
  Users, 
  Zap,
  ArrowRight,
  Camera,
  Check,
  AlertCircle,
  Brain,
  Share2,
  BookmarkCheck,
  Compass,
  FileCheck2,
  GraduationCap,
  KeyRound,
  MessageSquare,
  Clock,
  BarChart3,
  Timer
} from 'lucide-react';
import { ParentReportModal } from '../ParentReportModal';

interface UserProfileViewProps {
  user: User;
  onNavigateToTab?: (tabId: string) => void;
  onOpenTestSolver?: (topic?: string) => void;
  onOpenChat?: () => void;
  onOpenAiCoach?: () => void;
  onOpenAvatarModal?: () => void;
  onOpenAddStudent?: () => void;
  onLogout?: () => void;
  onProfileUpdated?: () => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  user,
  onNavigateToTab,
  onOpenTestSolver,
  onOpenChat,
  onOpenAiCoach,
  onOpenAvatarModal,
  onOpenAddStudent,
  onLogout,
  onProfileUpdated
}) => {
  const isStudent = user.role === 'STUDENT';

  // Profil Form State
  const [firstName, setFirstName] = useState(user.first_name || user.name.split(' ')[0] || '');
  const [lastName, setLastName] = useState(user.last_name || user.name.split(' ').slice(1).join(' ') || '');
  const [email, setEmail] = useState(user.email || `${user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}@virakoc.com`);
  const [phone, setPhone] = useState(user.phone || '0555 123 45 67');
  const [parentName, setParentName] = useState(user.parent_name || (isStudent ? 'Ayşe Deniz (Anne)' : ''));
  const [parentPhone, setParentPhone] = useState(user.parent_phone || (isStudent ? '0533 111 22 33' : ''));
  const [city, setCity] = useState(user.city || 'İstanbul');
  const [district, setDistrict] = useState(user.district || 'Kadıköy');
  const [targetSchool, setTargetSchool] = useState(user.target_school || (isStudent ? 'Boğaziçi Üniversitesi Bilgisayar Müh. (Hedef: İlk 500)' : 'Vira Koçluk Yönetim Merkezi'));
  const [address, setAddress] = useState(user.address || '');
  const [grade, setGrade] = useState(user.grade || '12');
  const [diplomaGrade, setDiplomaGrade] = useState<number>(user.diploma_grade || 88.0);
  const [isBrokenObp, setIsBrokenObp] = useState<boolean>(user.is_broken_obp || false);

  // Eski Sınav Geçmişi State
  const [hasTakenBefore, setHasTakenBefore] = useState<boolean>(user.previous_exam_history?.has_taken_before || false);
  const [prevExamYear, setPrevExamYear] = useState<number>(user.previous_exam_history?.exam_year || 2025);
  const [prevScoreType, setPrevScoreType] = useState<'SAYISAL' | 'ESIT_AGIRLIK' | 'SOZEL' | 'DIL'>(user.previous_exam_history?.score_type || 'SAYISAL');
  const [prevTytScore, setPrevTytScore] = useState<number>(user.previous_exam_history?.tyt_score || 0);
  const [prevTytRank, setPrevTytRank] = useState<number>(user.previous_exam_history?.tyt_rank || 0);
  const [prevAytScore, setPrevAytScore] = useState<number>(user.previous_exam_history?.ayt_score || 0);
  const [prevAytRank, setPrevAytRank] = useState<number>(user.previous_exam_history?.ayt_rank || 0);
  const [prevPlacementScore, setPrevPlacementScore] = useState<number>(user.previous_exam_history?.placement_score || 0);
  const [prevPlacementRank, setPrevPlacementRank] = useState<number>(user.previous_exam_history?.placement_rank || 0);

  // Eski Sınav Branş Netleri State
  const [showNetDetails, setShowNetDetails] = useState<boolean>(Boolean(user.previous_exam_history?.nets));
  const [prevTytTurkceNet, setPrevTytTurkceNet] = useState<number>(user.previous_exam_history?.nets?.tytTurkce || 0);
  const [prevTytMatNet, setPrevTytMatNet] = useState<number>(user.previous_exam_history?.nets?.tytMatematik || 0);
  const [prevTytFenNet, setPrevTytFenNet] = useState<number>(user.previous_exam_history?.nets?.tytFen || 0);
  const [prevTytSosyalNet, setPrevTytSosyalNet] = useState<number>(user.previous_exam_history?.nets?.tytSosyal || 0);
  const [prevAytMatNet, setPrevAytMatNet] = useState<number>(user.previous_exam_history?.nets?.aytMatematik || 0);
  const [prevAytFizikNet, setPrevAytFizikNet] = useState<number>(user.previous_exam_history?.nets?.aytFizik || 0);
  const [prevAytKimyaNet, setPrevAytKimyaNet] = useState<number>(user.previous_exam_history?.nets?.aytKimya || 0);
  const [prevAytBiyoNet, setPrevAytBiyoNet] = useState<number>(user.previous_exam_history?.nets?.aytBiyoloji || 0);

  // Hedefler
  const [targetTytScore, setTargetTytScore] = useState<number>(user.target_tyt_score || 450);
  const [targetAytScore, setTargetAytScore] = useState<number>(user.target_ayt_score || 480);
  const [targetRanking, setTargetRanking] = useState<number>(user.target_ranking || 1000);

  // Güvenlik State
  const [is2FA, setIs2FA] = useState(user.is_2fa_enabled || false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Bildirim ve durum
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isParentReportModalOpen, setIsParentReportModalOpen] = useState(false);

  // İstatistikleri hesapla
  const studentTasks: HourlyTask[] = isStudent ? StorageService.getTasks(user.id) : [];
  const studentExams: ExamResult[] = isStudent ? StorageService.getExams(user.id) : [];
  const scoreProfile: StudentScoreProfile = isStudent 
    ? StorageService.getStudentScoreProfile(user.id) 
    : {
        studentId: user.id,
        overallScore: 88,
        planFidelity: 92,
        testSuccess: 84,
        trialAverage: 85,
        aiDeficiencySpeed: 90,
        curriculumCompletionRate: 80
      };
  
  const totalSolvedQuestions = studentTasks.reduce((acc, t) => acc + (t.solved_question_count || 0), 0) || (isStudent ? 1420 : 4250);
  const totalTasksCount = isStudent ? studentTasks.length : StorageService.getTasks().length;
  const completedTasksCount = isStudent 
    ? studentTasks.filter(t => t.isCompleted).length 
    : StorageService.getTasks().filter(t => t.isCompleted).length;

  const allStudents = StorageService.getUsers().filter(u => u.role === 'STUDENT' && !u.is_archived);

  // Aktif veya Önümüzdeki İlk Görev Bilgisi (Dashboard Hero Widget)
  const activeOrNextTaskInfo = React.useMemo(() => {
    if (!isStudent || !studentTasks.length) return null;

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const currentHoursMinutes = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

    // 1. ŞU ANDA DEVAM EDEN GÖREV: Bugün, başlangıç <= şimdi <= bitiş, henüz bitmemiş
    const ongoing = studentTasks.find(t => 
      !t.isCompleted && 
      t.date === todayStr && 
      t.startTime <= currentHoursMinutes && 
      t.endTime >= currentHoursMinutes
    );
    if (ongoing) {
      return { 
        task: ongoing, 
        type: 'ongoing' as const, 
        badge: 'ŞU ANDA DEVAM EDİYOR • CANLI ETÜT',
        isToday: true
      };
    }

    // 2. BUGÜNÜN SIRADAKİ İLK GÖREVİ (Başlangıç saati şu andan sonra)
    const upcomingToday = studentTasks
      .filter(t => !t.isCompleted && t.date === todayStr && t.startTime > currentHoursMinutes)
      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))[0];
    if (upcomingToday) {
      return { 
        task: upcomingToday, 
        type: 'upcoming_today' as const, 
        badge: 'BUGÜNKÜ SIRADAKİ ETÜT',
        isToday: true
      };
    }

    // 3. GELECEK GÜNLERDEKİ EN YAKIN GÖREV
    const upcomingFuture = studentTasks
      .filter(t => !t.isCompleted && t.date > todayStr)
      .sort((a, b) => (a.date || '').localeCompare(b.date || '') || (a.startTime || '').localeCompare(b.startTime || ''))[0];
    if (upcomingFuture) {
      return { 
        task: upcomingFuture, 
        type: 'upcoming_future' as const, 
        badge: 'ÖNÜMÜZDEKİ İLK ETÜT',
        isToday: false
      };
    }

    // 4. BUGÜNÜN BEKLEYEN DİĞER GÖREVLERİ (Saati geçmiş olsa da tamamlanmamış)
    const pendingToday = studentTasks
      .filter(t => !t.isCompleted && t.date === todayStr)
      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))[0];
    if (pendingToday) {
      return { 
        task: pendingToday, 
        type: 'pending_today' as const, 
        badge: 'BUGÜNÜN BEKLEYEN GÖREVİ',
        isToday: true
      };
    }

    // 5. HERHANGİ BİR TAMAMLANMAMIŞ GÖREV (Tarih bağımsız)
    const anyPending = studentTasks
      .filter(t => !t.isCompleted)
      .sort((a, b) => (a.date || '').localeCompare(b.date || '') || (a.startTime || '').localeCompare(b.startTime || ''))[0];
    if (anyPending) {
      return { 
        task: anyPending, 
        type: 'pending_any' as const, 
        badge: 'SIRADAKİ ÇALIŞMA GÖREVİ',
        isToday: anyPending.date === todayStr
      };
    }

    // 6. TÜM GÖREVLER TAMAMLANDI
    return { 
      task: null, 
      type: 'all_completed' as const, 
      badge: 'TÜM GÖREVLER TAMAMLANDI',
      isToday: false
    };
  }, [isStudent, studentTasks]);

  // 1. Canlı YKS Geri Sayım Sayacı (TYT & AYT)
  const [countdown, setCountdown] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const targetYear = user.targetExamYear || 2027;
    // YKS Haziran 3. haftası cumartesi 10:15
    const targetDate = new Date(`${targetYear}-06-19T10:15:00`).getTime();

    const updateTimer = () => {
      const nowMs = new Date().getTime();
      const diff = Math.max(0, targetDate - nowMs);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setCountdown({ days, hours, minutes, seconds });
    };

    updateTimer();
    const timerId = setInterval(updateTimer, 1000);
    return () => clearInterval(timerId);
  }, [user.targetExamYear]);

  // 2. Günlük Soru Hedefi & İlerleme
  const currentDate = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const todayDateStr = `${currentDate.getFullYear()}-${pad(currentDate.getMonth() + 1)}-${pad(currentDate.getDate())}`;

  const todayTasks = studentTasks.filter(t => t.date === todayDateStr);
  const todayTargetQuestions = todayTasks.reduce((acc, t) => acc + (t.target_question_count || 0), 0) || 120;
  const todaySolvedQuestions = todayTasks.reduce((acc, t) => acc + (t.solved_question_count || 0), 0) || 75;
  const todayProgressPercent = Math.min(100, Math.round((todaySolvedQuestions / todayTargetQuestions) * 100));

  // 3. Çalışma Serisi (Streak)
  const streakDays = (user as any).studyStreak || 14;
  const daysOfWeek = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
  const todayDayIndex = (currentDate.getDay() + 6) % 7; // Pazartesi = 0, Pazar = 6

  // 4. Hedef Sıralama & Net Gap Projeksiyonu
  const tytExams = studentExams.filter(e => e.examType === 'TYT');
  const aytExams = studentExams.filter(e => e.examType === 'AYT');

  const latestTytNet = tytExams.length > 0 && tytExams[0].totalNet 
    ? tytExams[0].totalNet 
    : 88.5;
  const latestAytNet = aytExams.length > 0 && aytExams[0].totalNet 
    ? aytExams[0].totalNet 
    : 58.0;

  const targetTytNeededNet = 98.0;
  const targetAytNeededNet = 68.0;
  const tytNetGap = Math.max(0, +(targetTytNeededNet - latestTytNet).toFixed(1));
  const aytNetGap = Math.max(0, +(targetAytNeededNet - latestAytNet).toFixed(1));
  const tytProgressPercent = Math.min(100, Math.round((latestTytNet / targetTytNeededNet) * 100));
  const aytProgressPercent = Math.min(100, Math.round((latestAytNet / targetAytNeededNet) * 100));

  // 5. AI Zayıf Halka Odak Konusu
  const aiFocusTopic = {
    subject: 'AYT Fizik',
    topic: 'İndüksiyon ve Manyetizma',
    failureRate: 38,
    potentialNetGain: '+2.25 Net',
    tip: 'Son 2 denemede manyetik akı ve indüksiyon akımı yönü sorularında takıldın. Bu hafta 12 kritik soru testini çözerek netlerini anında toparlayabilirsin.'
  };

  // Profil Formunu Kaydet
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);

    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      const updated = StorageService.updateUserProfile(user.id, {
        name: fullName || user.name,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        parent_name: parentName.trim(),
        parent_phone: parentPhone.trim(),
        city: city.trim(),
        district: district.trim(),
        target_school: targetSchool.trim(),
        address: address.trim(),
        grade: grade,
        diploma_grade: Number(diplomaGrade),
        obp_score: Number((Number(diplomaGrade) * 5).toFixed(2)),
        is_broken_obp: isBrokenObp,
        target_tyt_score: Number(targetTytScore),
        target_ayt_score: Number(targetAytScore),
        target_ranking: Number(targetRanking),
        previous_exam_history: {
          has_taken_before: hasTakenBefore,
          exam_year: Number(prevExamYear),
          score_type: prevScoreType,
          tyt_score: Number(prevTytScore),
          tyt_rank: Number(prevTytRank),
          ayt_score: Number(prevAytScore),
          ayt_rank: Number(prevAytRank),
          placement_score: Number(prevPlacementScore),
          placement_rank: Number(prevPlacementRank),
          nets: showNetDetails ? {
            tytTurkce: Number(prevTytTurkceNet),
            tytMatematik: Number(prevTytMatNet),
            tytFen: Number(prevTytFenNet),
            tytSosyal: Number(prevTytSosyalNet),
            aytMatematik: Number(prevAytMatNet),
            aytFizik: Number(prevAytFizikNet),
            aytKimya: Number(prevAytKimyaNet),
            aytBiyoloji: Number(prevAytBiyoNet)
          } : undefined
        }
      });

      if (updated) {
        setStatusMessage({ type: 'success', text: '✅ Profil bilgileriniz başarıyla güncellendi!' });
        if (onProfileUpdated) onProfileUpdated();
      } else {
        setStatusMessage({ type: 'error', text: 'Profil güncellenirken bir hata oluştu.' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Güncelleme başarısız.' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  // 2FA Değiştir
  const handleToggle2FA = () => {
    const nextState = !is2FA;
    setIs2FA(nextState);
    StorageService.toggle2FA(user.id, nextState);
    setStatusMessage({
      type: 'success',
      text: nextState ? '🔒 İki Adımlı Doğrulama (2FA) Aktifleştirildi.' : '⚠️ İki Adımlı Doğrulama Devre Dışı Bırakıldı.'
    });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // Şifre Değiştir
  // Not: Şifre değiştirme artık sunucuda yapılıyor (oturum çerezinden
  // doğrulanan kullanıcı üzerinde). Eskiden bu işlem sadece tarayıcının
  // localStorage'ını güncelliyordu; giriş (login) sunucu tarafına
  // taşındıktan sonra bu, "başarılı" mesajı görünse de yeni şifreyle giriş
  // yapılamaması sorununa yol açıyordu.
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      setStatusMessage({ type: 'error', text: 'Lütfen mevcut ve yeni şifrenizi girin.' });
      setTimeout(() => setStatusMessage(null), 4000);
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatusMessage({ type: 'error', text: 'Yeni şifre ile şifre tekrarı uyuşmuyor.' });
      setTimeout(() => setStatusMessage(null), 4000);
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword })
      });
      const data = await res.json();

      if (data.success) {
        setStatusMessage({ type: 'success', text: '🎉 ' + data.message });
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setStatusMessage({ type: 'error', text: '❌ ' + (data.message || 'Şifre değiştirilemedi.') });
      }
    } catch {
      setStatusMessage({ type: 'error', text: '❌ Şifre değiştirme sırasında bir bağlantı hatası oluştu.' });
    } finally {
      setIsChangingPassword(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  // Forma yumuşak kaydırma
  const scrollToProfileForm = () => {
    const el = document.getElementById('profile-edit-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const displayName = firstName ? `${firstName} ${lastName}` : user.name;
  const initialLetter = displayName.charAt(0).toUpperCase();

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto pb-12">
      
      {/* 1. Üst Başlık Karşılama Alanı (Görsel 1) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-100 flex items-center gap-2">
            Merhaba, {firstName || user.name.split(' ')[0]}! <span className="animate-bounce inline-block">👋</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1 font-medium">
            {isStudent 
              ? 'YKS çalışma alanını, hedeflerini ve hesabını buradan yönet' 
              : 'Danışman komuta merkezini, öğrenci takvimlerini ve sistemini yönet'}
          </p>
        </div>

        {/* Hızlı Aksiyon & Canlı Geri Sayım Rozetleri */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* 1. Canlı YKS Geri Sayım Sayacı */}
          {isStudent && (
            <div className="profile-countdown-pill flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-slate-900 border border-amber-500/30 text-amber-300 text-xs font-bold shadow-md hover:border-amber-400 transition cursor-default">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span className="font-extrabold text-amber-400 flex items-center gap-1">
                <Timer className="w-3.5 h-3.5" />
                <span>YKS {user.targetExamYear || 2027}:</span>
              </span>
              <span className="font-mono text-slate-100 bg-slate-800 px-1.5 py-0.5 rounded-lg border border-slate-700">
                {countdown.days} Gün
              </span>
              <span className="font-mono text-slate-100 bg-slate-800 px-1.5 py-0.5 rounded-lg border border-slate-700">
                {countdown.hours} Sa
              </span>
              <span className="font-mono text-slate-100 bg-slate-800 px-1.5 py-0.5 rounded-lg border border-slate-700">
                {countdown.minutes} Dk
              </span>
              <span className="font-mono text-amber-400 bg-slate-800 px-1.5 py-0.5 rounded-lg border border-slate-700 hidden sm:inline">
                {countdown.seconds} Sn
              </span>
            </div>
          )}

          <div className="profile-target-badge px-3 py-1.5 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1.5 shadow-sm">
            <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>Hedef: {targetRanking ? `İlk ${targetRanking.toLocaleString('tr-TR')}` : 'İlk 1.000'}</span>
          </div>

          <div className="px-3 py-1.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
            {isStudent ? (grade === 'MEZUN' ? '🎓 Mezun Grubu' : '📚 12. Sınıf') : '👑 Baş Danışman'}
          </div>
        </div>
      </div>

      {/* 2. Ana Profil Kimlik Kartı (Görsel 1) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-5 transition hover:border-slate-700">
        <div className="flex items-center space-x-4">
          {/* Avatar Dairesi */}
          <div 
            onClick={onOpenAvatarModal}
            className="relative group cursor-pointer"
            title="Profil fotoğrafını değiştirmek için tıkla"
          >
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={displayName}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-2 ring-indigo-500/40 shadow-lg group-hover:scale-105 transition"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white font-black text-2xl shadow-lg ring-2 ring-indigo-400/40 group-hover:scale-105 transition">
                {initialLetter}
              </div>
            )}
            <div className="absolute inset-0 rounded-2xl flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition">
              <Camera className="w-5 h-5 text-white" />
            </div>
          </div>

          {/* İsim ve E-posta */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-100">{displayName}</h2>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {isStudent ? 'Öğrenci' : 'Danışman'}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
              <span>{email}</span>
              <span className="text-slate-600">&bull;</span>
              <span>{phone}</span>
            </p>
            {targetSchool && (
              <p className="text-xs text-indigo-300/90 font-medium flex items-center gap-1">
                <Target className="w-3 h-3 text-indigo-400" />
                <span>{targetSchool}</span>
              </p>
            )}
          </div>
        </div>

        {/* Sağ Taraf: Düzenle & Çıkış Yap Butonları */}
        <div className="flex items-center gap-2.5 self-end sm:self-center">
          {isStudent && (
            <button
              onClick={() => setIsParentReportModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white text-xs font-bold shadow-md transition hover:scale-105 active:scale-95"
              title="Haftalık gelişim özetini ve resmi PDF karneni ailenle paylaş"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>📱 Veli Raporu</span>
            </button>
          )}

          <button
            onClick={scrollToProfileForm}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 transition hover:border-indigo-500/50"
          >
            <Settings className="w-3.5 h-3.5 text-indigo-400" />
            <span>Profili Düzenle</span>
          </button>

          {onLogout && (
            <button
              onClick={onLogout}
              className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition hover:scale-105"
              title="Güvenli Çıkış Yap"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2.5. AKTİF / SIRADAKİ GÖREV HERO WIDGET'I (Öğrencinin Anlık Komuta Merkezi) */}
      {isStudent && (
        <div 
          onClick={() => onNavigateToTab?.('CALENDAR')}
          className="profile-hero-task-card group relative overflow-hidden rounded-3xl p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-indigo-500/30 hover:border-indigo-400 shadow-xl hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 cursor-pointer"
        >
          {/* Arka Plan Glow Efekti */}
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition duration-500" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
            {/* Sol: Görev Durumu ve Detayları */}
            <div className="flex items-start sm:items-center space-x-4">
              <div className={`p-3.5 sm:p-4 rounded-2xl border flex-shrink-0 transition-transform duration-300 group-hover:scale-105 shadow-md ${
                activeOrNextTaskInfo?.type === 'ongoing'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                  : activeOrNextTaskInfo?.type === 'all_completed'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
              }`}>
                {activeOrNextTaskInfo?.type === 'ongoing' ? (
                  <Zap className="w-7 h-7 text-rose-400" />
                ) : activeOrNextTaskInfo?.type === 'all_completed' ? (
                  <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                ) : (
                  <Clock className="w-7 h-7 text-indigo-400" />
                )}
              </div>

              <div className="space-y-1.5 flex-1 min-w-0">
                {/* Rozet Şeridi */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`profile-hero-task-badge text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${
                    activeOrNextTaskInfo?.type === 'ongoing'
                      ? 'badge-ongoing bg-rose-500/20 text-rose-400 border-rose-500/40'
                      : activeOrNextTaskInfo?.type === 'all_completed'
                      ? 'badge-completed bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : 'badge-upcoming bg-indigo-500/20 text-indigo-400 border-indigo-500/40'
                  }`}>
                    {activeOrNextTaskInfo?.type === 'ongoing' && (
                      <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping badge-ping" />
                    )}
                    <span>{activeOrNextTaskInfo?.badge || 'SAATLİK ÇALIŞMA PLANI'}</span>
                  </span>

                  {activeOrNextTaskInfo?.task?.taskType && (
                    <span className="profile-hero-tasktype-badge text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {activeOrNextTaskInfo.task.taskType === 'QUESTION_BANK' ? '📚 Soru Bankası'
                        : activeOrNextTaskInfo.task.taskType === 'LECTURE' ? '🎥 Konu Anlatımı'
                        : activeOrNextTaskInfo.task.taskType === 'PAST_QUESTIONS' ? '📝 Çıkmış Sorular'
                        : activeOrNextTaskInfo.task.taskType === 'CRITICAL_12' ? '⚡ 12 Kritik Soru'
                        : activeOrNextTaskInfo.task.taskType === 'TRIAL_EXAM' ? '🏆 Deneme Sınavı'
                        : '📖 Etüt'}
                    </span>
                  )}
                </div>

                {/* Başlık ve Konu */}
                {activeOrNextTaskInfo?.task ? (
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white group-hover:text-indigo-200 transition truncate">
                      <span className="text-indigo-300 mr-2">{activeOrNextTaskInfo.task.subjectName}:</span>
                      {activeOrNextTaskInfo.task.topicName || activeOrNextTaskInfo.task.title}
                    </h3>
                    
                    <div className="flex items-center gap-3 sm:gap-4 text-xs text-slate-300 mt-1 flex-wrap">
                      <span className="flex items-center gap-1 text-slate-200 font-semibold">
                        <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                        {activeOrNextTaskInfo.isToday ? 'Bugün' : activeOrNextTaskInfo.task.date}
                      </span>
                      <span className="flex items-center gap-1 text-slate-200 font-semibold font-mono">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                        {activeOrNextTaskInfo.task.startTime} - {activeOrNextTaskInfo.task.endTime} ({activeOrNextTaskInfo.task.lessonDurationMinutes || 45} dk)
                      </span>
                      {activeOrNextTaskInfo.task.target_question_count ? (
                        <span className="flex items-center gap-1 text-amber-300 font-semibold">
                          <Target className="w-3.5 h-3.5 text-amber-400" />
                          Hedef: {activeOrNextTaskInfo.task.target_question_count} Soru
                        </span>
                      ) : null}
                    </div>
                  </div>
                ) : activeOrNextTaskInfo?.type === 'all_completed' ? (
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-emerald-400">
                      Harika İlerleme! Bu Haftaki Tüm Görevlerini Tamamladın 🎉
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Dinamik takvimden yeni etüt veya deneme sınavı ekleyebilir, AI soru asistanıyla zayıf konularını tarayabilirsin.
                    </p>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white">
                      Henüz Planlanmış Saatlik Çalışma Görevin Bulunmuyor
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Haftalık hedeflerini belirlemek ve saatlik etüt ajandana görev eklemek için tıkla.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Sağ: Aksiyon Butonu */}
            <div className="flex items-center justify-end flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 group-hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition-all duration-300 group-hover:translate-x-1">
                <span>Dinamik Takvim ve Görev Motoru</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2.6. GÜNLÜK HEDEF & ÇALIŞMA SERİSİ BANDI (Özellik 2 & Özellik 3) */}
      {isStudent && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Sol Kart: Günlük Soru Hedefi ve İlerleme Çubuğu (Özellik 2) */}
          <div className="profile-daily-target-card p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between space-y-4 hover:border-slate-700 transition">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                    <Target className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-100 flex items-center gap-1.5">
                      <span>Bugünkü Soru Hedefi</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 font-bold">
                        Günlük İlerleme
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Haftalık etüt ajandana göre bugünkü soru tamamlama oranı
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xl sm:text-2xl font-black text-orange-400 font-mono">
                    %{todayProgressPercent}
                  </span>
                  <p className="text-[10px] text-slate-400 font-mono">Tamamlandı</p>
                </div>
              </div>

              {/* İlerleme Çubuğu */}
              <div className="space-y-1.5 pt-1">
                <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden p-0.5 border border-slate-700">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500 transition-all duration-700 shadow-sm"
                    style={{ width: `${todayProgressPercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono font-medium pt-0.5">
                  <span className="text-slate-200 font-bold">
                    ✅ {todaySolvedQuestions} Çözüldü
                  </span>
                  <span className="text-slate-400">
                    🎯 Hedef: {todayTargetQuestions} Soru
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-xs text-amber-300 font-semibold flex items-center gap-1">
                <span>⚡ Hedefe Kalan:</span>
                <span className="font-bold font-mono">{Math.max(0, todayTargetQuestions - todaySolvedQuestions)} Soru</span>
              </span>
              <button
                onClick={() => onNavigateToTab?.('CALENDAR')}
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1 group/btn"
              >
                <span>Ajandayı Aç</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition" />
              </button>
            </div>
          </div>

          {/* Sağ Kart: Çalışma Serisi / Alev Sayacı (🔥 Study Streak) (Özellik 3) */}
          <div className="profile-streak-card p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between space-y-4 hover:border-slate-700 transition">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    <Flame className="w-5 h-5 text-rose-500 fill-rose-500 animate-bounce" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-100 flex items-center gap-1.5">
                      <span>Çalışma Serisi (Streak)</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">
                        Zinciri Kırma
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Aralıksız sürdürülen günlük çalışma disiplini
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xl sm:text-2xl font-black text-rose-400 font-mono flex items-center justify-end gap-1">
                    <span>🔥 {streakDays}</span>
                    <span className="text-xs text-slate-400 font-normal">Gün</span>
                  </span>
                  <p className="text-[10px] text-emerald-400 font-mono font-bold">Aktif Seri!</p>
                </div>
              </div>

              {/* Haftalık 7 Günlük Aktivite Çetelesi */}
              <div className="space-y-1.5 pt-1">
                <div className="grid grid-cols-7 gap-1.5">
                  {daysOfWeek.map((dayName, idx) => {
                    const isPassedOrToday = idx <= todayDayIndex;
                    const isToday = idx === todayDayIndex;
                    return (
                      <div 
                        key={dayName}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition ${
                          isToday 
                            ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 ring-2 ring-rose-500/30 font-bold'
                            : isPassedOrToday
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : 'bg-slate-800/60 border-slate-700/60 text-slate-500'
                        }`}
                      >
                        <span className="text-[10px] font-mono">{dayName}</span>
                        <div className="mt-1">
                          {isPassedOrToday ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-slate-600 my-0.5" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-300">
                🎉 Harika Disiplin! Bu hafta <strong className="text-emerald-400">{todayDayIndex + 1}/7 gün</strong> aktiftin.
              </span>
              <span className="text-[11px] text-slate-400 font-mono">Hedef: 7/7</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. AI KOÇ HAFTALIK STRATEJİK ODAK & ZAYIF HALKA KARTI (Özellik 5) */}
      {isStudent ? (
        <div className="profile-ai-focus-card relative overflow-hidden rounded-3xl p-6 sm:p-7 bg-gradient-to-r from-purple-950/70 via-slate-900 to-indigo-950/70 text-white shadow-xl shadow-indigo-950/20 border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-5 group hover:border-purple-400 transition">
          {/* Dekoratif Glow */}
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-purple-500/15 rounded-full blur-2xl group-hover:scale-125 transition duration-700 pointer-events-none" />

          <div className="flex items-start sm:items-center space-x-4 relative z-10">
            <div className="p-3.5 sm:p-4 rounded-2xl bg-purple-500/20 backdrop-blur-md border border-purple-500/30 text-purple-300 shadow-md flex-shrink-0 group-hover:scale-105 transition">
              <Brain className="w-7 h-7 sm:w-8 sm:h-8 text-purple-300" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="profile-ai-badge-focus text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-purple-300 ai-sparkle-icon" />
                  <span>AI KOÇ HAFTALIK STRATEJİK ODAK</span>
                </span>
                <span className="profile-ai-badge-error text-xs px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 font-bold">
                  Hata Oranı: %{aiFocusTopic.failureRate}
                </span>
                <span className="profile-ai-badge-potential text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold">
                  Potansiyel: {aiFocusTopic.potentialNetGain}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white">
                <span className="profile-ai-subject-prefix text-purple-300">{aiFocusTopic.subject}:</span> {aiFocusTopic.topic}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl font-medium leading-relaxed">
                {aiFocusTopic.tip}
              </p>
            </div>
          </div>

          <div className="relative z-10 self-start sm:self-center flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-shrink-0">
            <button
              onClick={() => onOpenTestSolver ? onOpenTestSolver(aiFocusTopic.topic) : onNavigateToTab?.('CALENDAR')}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm shadow-xl shadow-purple-600/30 transition hover:scale-105 active:scale-95 flex items-center justify-center space-x-2"
            >
              <span>12&apos;li Testi Çöz</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenAiCoach}
              className="profile-ai-coach-btn px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-750 text-purple-300 border border-purple-500/30 hover:border-purple-400 font-bold text-xs sm:text-sm transition flex items-center justify-center space-x-1.5"
            >
              <Brain className="w-4 h-4 text-purple-400 ai-brain-icon" />
              <span>AI Koça Sor</span>
            </button>
          </div>
        </div>
      ) : (
        /* Danışman Komuta Merkezi Banner */
        <div className="relative overflow-hidden rounded-3xl p-6 sm:p-7 bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white shadow-xl shadow-indigo-950/20 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-5 group">
          <div className="flex items-center space-x-4 relative z-10">
            <div className="p-3.5 sm:p-4 rounded-2xl bg-indigo-500/20 backdrop-blur-md border border-indigo-500/30 text-indigo-300 shadow-md flex-shrink-0">
              <Users className="w-7 h-7 sm:w-8 sm:h-8 text-indigo-300" />
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                DANIŞMAN KOMUTA MERKEZİ
              </span>
              <h3 className="text-lg sm:text-2xl font-black text-white">
                Öğrenci Gelişim Karneleri &amp; Haftalık AI Analizleri
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl font-medium">
                Öğrencilerinin haftalık soru, deneme ve etüt sadakatini yapay zeka ile otomatik raporla.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateToTab?.('STUDENTS')}
            className="relative z-10 px-5 py-3 rounded-2xl bg-white text-indigo-900 hover:bg-indigo-50 font-black text-xs sm:text-sm shadow-xl transition hover:scale-105 active:scale-95 flex items-center space-x-2"
          >
            <span>Öğrenci Takip Masası</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4. İstatistik Şeritleri (KPI Özeti - Görsel 2) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {isStudent ? (
          <>
            {/* Toplam Çözülen Soru */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex items-center space-x-3.5">
              <div className="p-3 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                <BookmarkCheck className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Toplam Çözülen Soru</p>
                <p className="text-xl sm:text-2xl font-black text-slate-100">{totalSolvedQuestions.toLocaleString('tr-TR')}</p>
                <p className="text-[10px] text-emerald-400 font-mono mt-0.5">+48 soru bu hafta</p>
              </div>
            </div>

            {/* Deneme & Tarama Sayısı */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex items-center space-x-3.5">
              <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <FileCheck2 className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Kayıtlı Deneme Sayısı</p>
                <p className="text-xl sm:text-2xl font-black text-slate-100">{studentExams.length || 6}</p>
                <p className="text-[10px] text-cyan-400 font-mono mt-0.5">TYT / AYT Simülasyonu</p>
              </div>
            </div>

            {/* 100 Üzerinden Genel Skor */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex items-center space-x-3.5">
              <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Award className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Genel Başarı Skoru</p>
                <div className="flex items-baseline space-x-1">
                  <span className="text-xl sm:text-2xl font-black text-indigo-300">{scoreProfile.overallScore}</span>
                  <span className="text-xs text-slate-500 font-semibold">/100</span>
                </div>
                <p className="text-[10px] text-indigo-400 font-mono mt-0.5">Ağırlıklı Algoritma</p>
              </div>
            </div>

            {/* Plan Sadakati */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex items-center space-x-3.5">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Haftalık Plan Sadakati</p>
                <p className="text-xl sm:text-2xl font-black text-emerald-400">%{scoreProfile.planFidelity || 88}</p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">{completedTasksCount}/{totalTasksCount} etüt tamam</p>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Danışman İstatistikleri */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex items-center space-x-3.5">
              <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Users className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Aktif Öğrenci</p>
                <p className="text-xl sm:text-2xl font-black text-slate-100">{allStudents.length} Öğrenci</p>
                <p className="text-[10px] text-indigo-400 font-mono mt-0.5">Barış, Efe ve diğerleri</p>
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex items-center space-x-3.5">
              <div className="p-3 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Haftalık Toplam Görev</p>
                <p className="text-xl sm:text-2xl font-black text-slate-100">{totalTasksCount}</p>
                <p className="text-[10px] text-orange-400 font-mono mt-0.5">Aktif saatlik planlama</p>
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex items-center space-x-3.5">
              <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Brain className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">AI Gelişim Raporu</p>
                <p className="text-xl sm:text-2xl font-black text-slate-100">4 Rapor</p>
                <p className="text-[10px] text-cyan-400 font-mono mt-0.5">Haftalık otomatik karne</p>
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex items-center space-x-3.5">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Ortalama Öğrenci Skoru</p>
                <p className="text-xl sm:text-2xl font-black text-emerald-400">84.5 / 100</p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">Yüksek Başarı Seviyesi</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 4.5. HEDEF SIRALAMA VE NET FARKI PROJEKSİYONU (NET GAP KOKPİTİ - Özellik 4) */}
      {isStudent && (
        <div className="profile-netgap-card p-6 sm:p-7 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5 hover:border-slate-700 transition">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
            <div>
              <div className="flex items-center space-x-2.5">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-100 flex items-center gap-2">
                    <span>2027 Hedef Sıralama &amp; Kalan Net Projeksiyonu (Net Gap)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold">
                      Canlı Hedef Simülasyonu
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Hedeflediğin bölüm ({targetSchool || 'İlk 1.000 Hedefi'}) için gereken netler ile son deneme performansın arasındaki mesafe
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigateToTab?.('ANALYTICS')}
              className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition flex items-center gap-1.5 self-start sm:self-center px-3.5 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 group/btn"
            >
              <span>Deneme Analizlerine Git</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* TYT Net Sütunu */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-cyan-400 uppercase tracking-wider">TYT Genel Neti</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 font-mono">
                  %{tytProgressPercent} Tamamlandı
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-black text-slate-100 font-mono">{latestTytNet}</span>
                  <span className="text-xs text-slate-400 font-mono"> / {targetTytNeededNet} Net</span>
                </div>
                <div className="text-right">
                  <span className="profile-netgap-remaining-val text-xs font-bold text-amber-400 font-mono">+{tytNetGap} Net</span>
                  <p className="profile-netgap-remaining-sub text-[10px] text-slate-500 font-mono">Hedefe Kalan</p>
                </div>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden p-0.5 border border-slate-700">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-700" 
                  style={{ width: `${tytProgressPercent}%` }}
                />
              </div>
            </div>

            {/* AYT Net Sütunu */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">AYT Genel Neti</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 font-mono">
                  %{aytProgressPercent} Tamamlandı
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-black text-slate-100 font-mono">{latestAytNet}</span>
                  <span className="text-xs text-slate-400 font-mono"> / {targetAytNeededNet} Net</span>
                </div>
                <div className="text-right">
                  <span className="profile-netgap-remaining-val text-xs font-bold text-amber-400 font-mono">+{aytNetGap} Net</span>
                  <p className="profile-netgap-remaining-sub text-[10px] text-slate-500 font-mono">Hedefe Kalan</p>
                </div>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden p-0.5 border border-slate-700">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-700" 
                  style={{ width: `${aytProgressPercent}%` }}
                />
              </div>
            </div>

            {/* OBP ve Hedef Sıralama Gücü */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-indigo-400 uppercase tracking-wider">OÖBP &amp; Sıralama</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 font-mono">
                    Yerleştirme
                  </span>
                </div>
                <div className="mt-2 space-y-1">
                  <p className="profile-netgap-target-p text-sm font-black text-slate-100 flex items-center gap-1.5">
                    <span>Hedef:</span>
                    <span className="profile-netgap-target-val text-amber-400 font-mono font-bold">İlk {targetRanking?.toLocaleString('tr-TR') || '1.000'}</span>
                  </p>
                  <p className="text-xs text-slate-400">
                    Diploma Katkısı: <strong className="text-emerald-400 font-mono">+{(Number(diplomaGrade) * 5 * (isBrokenObp ? 0.06 : 0.12)).toFixed(2)} Puan</strong>
                  </p>
                </div>
              </div>
              <p className="profile-netgap-tip text-[11px] text-indigo-300 font-medium">
                ⚡ Haftalık ek 2 etüt ile TYT &amp; AYT net açığını 6 haftada kapatabilirsin.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 5. Kutular Grid'i (Kullanıcının Görsellerindeki Şık Grid Kutuları) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-black text-slate-100 flex items-center gap-2">
            <span>Çalışma Modülleri &amp; Hızlı Menü</span>
          </h3>
          <span className="text-xs text-slate-400">Tıklayarak doğrudan modüle geçiş yap</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {isStudent ? (
            <>
              {/* Kutu 1: Kamplarım & Saatlik Takvim */}
              <div
                onClick={() => onNavigateToTab?.('CALENDAR')}
                className="group p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-orange-500/40 hover:bg-slate-850/60 transition cursor-pointer shadow-sm hover:shadow-lg hover:shadow-orange-500/5 hover:-translate-y-0.5 flex items-start space-x-4"
              >
                <div className="p-3 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 group-hover:scale-110 group-hover:bg-orange-500/20 transition flex-shrink-0">
                  <Calendar className="w-6 h-6" />
                </div>
                <div className="space-y-1 flex-1">
                  <h4 className="text-sm font-black text-slate-100 group-hover:text-orange-300 transition">
                    Kamplarım &amp; Saatlik Takvim
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Haftalık etüt planı, soru hedefleri ve saatlik çalışma ajandan.
                  </p>
                </div>
              </div>

              {/* Kutu 2: Sınav Sonuçlarım & Netler */}
              <div
                onClick={() => onNavigateToTab?.('ANALYTICS')}
                className="group p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 hover:bg-slate-850/60 transition cursor-pointer shadow-sm hover:shadow-lg hover:shadow-cyan-500/5 hover:-translate-y-0.5 flex items-start space-x-4"
              >
                <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:scale-110 group-hover:bg-cyan-500/20 transition flex-shrink-0">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div className="space-y-1 flex-1">
                  <h4 className="text-sm font-black text-slate-100 group-hover:text-cyan-300 transition">
                    Sınav Sonuçlarım &amp; Netler
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Geçmiş TYT-AYT denemeleri, ÖSYM simülasyonu ve başarı grafikleri.
                  </p>
                </div>
              </div>

              {/* Kutu 3: Kitaplarım & Dijital Kütüphane */}
              <div
                onClick={() => onNavigateToTab?.('LIBRARY')}
                className="group p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 hover:bg-slate-850/60 transition cursor-pointer shadow-sm hover:shadow-lg hover:shadow-amber-500/5 hover:-translate-y-0.5 flex items-start space-x-4"
              >
                <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-110 group-hover:bg-amber-500/20 transition flex-shrink-0">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div className="space-y-1 flex-1">
                  <h4 className="text-sm font-black text-slate-100 group-hover:text-amber-300 transition">
                    Kitaplarım &amp; Kütüphane
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Danışman tavsiyeli kaynaklar, konu özetli PDF&apos;ler ve arşiv.
                  </p>
                </div>
              </div>

              {/* Kutu 4: AI Soru Motoru & 12'li Test */}
              <div
                onClick={() => onOpenTestSolver ? onOpenTestSolver('Newton Yasaları ve Dinamik') : onNavigateToTab?.('CALENDAR')}
                className="group p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-850/60 transition cursor-pointer shadow-sm hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-0.5 flex items-start space-x-4"
              >
                <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:scale-110 group-hover:bg-indigo-500/20 transition flex-shrink-0">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="space-y-1 flex-1">
                  <h4 className="text-sm font-black text-slate-100 group-hover:text-indigo-300 transition">
                    AI Soru Üretici &amp; 12&apos;li Test
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Eksik konulardan 12 kritik soru üret, aşamalı çözümlü PDF indir.
                  </p>
                </div>
              </div>

              {/* Kutu 5: 5 Adımlı Çalışma Döngüsü */}
              <div
                onClick={() => onNavigateToTab?.('CYCLE')}
                className="group p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 hover:bg-slate-850/60 transition cursor-pointer shadow-sm hover:shadow-lg hover:shadow-emerald-500/5 hover:-translate-y-0.5 flex items-start space-x-4"
              >
                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-110 group-hover:bg-emerald-500/20 transition flex-shrink-0">
                  <RotateCw className="w-6 h-6" />
                </div>
                <div className="space-y-1 flex-1">
                  <h4 className="text-sm font-black text-slate-100 group-hover:text-emerald-300 transition">
                    5 Adımlı Çalışma Döngüsü
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Konu, Tarama, Soru Bankası, Hata Defteri ve Deneme aşamaları.
                  </p>
                </div>
              </div>

              {/* Kutu 6: Konu Hakimiyet Matrisi */}
              <div
                onClick={() => onNavigateToTab?.('TREE')}
                className="group p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-purple-500/40 hover:bg-slate-850/60 transition cursor-pointer shadow-sm hover:shadow-lg hover:shadow-purple-500/5 hover:-translate-y-0.5 flex items-start space-x-4"
              >
                <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 group-hover:scale-110 group-hover:bg-purple-500/20 transition flex-shrink-0">
                  <Compass className="w-6 h-6" />
                </div>
                <div className="space-y-1 flex-1">
                  <h4 className="text-sm font-black text-slate-100 group-hover:text-purple-300 transition">
                    Konu Hakimiyet Matrisi
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Tüm YKS müfredatında konu bazlı ustalık ve eksik ağacı.
                  </p>
                </div>
              </div>

              {/* Kutu 7: Tercih & Hedef Raporu */}
              <div
                onClick={scrollToProfileForm}
                className="group p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-pink-500/40 hover:bg-slate-850/60 transition cursor-pointer shadow-sm hover:shadow-lg hover:shadow-pink-500/5 hover:-translate-y-0.5 flex items-start space-x-4"
              >
                <div className="p-3 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20 group-hover:scale-110 group-hover:bg-pink-500/20 transition flex-shrink-0">
                  <Target className="w-6 h-6" />
                </div>
                <div className="space-y-1 flex-1">
                  <h4 className="text-sm font-black text-slate-100 group-hover:text-pink-300 transition">
                    Tercih &amp; Hedef Raporu
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Hedef üniversite, sıralama ve ÖSYM puan projeksiyonu.
                  </p>
                </div>
              </div>

              {/* Kutu 8: Mesajlaşma & Sosyal Akış */}
              <div
                onClick={onOpenChat}
                className="group p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-teal-500/40 hover:bg-slate-850/60 transition cursor-pointer shadow-sm hover:shadow-lg hover:shadow-teal-500/5 hover:-translate-y-0.5 flex items-start space-x-4"
              >
                <div className="p-3 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 group-hover:scale-110 group-hover:bg-teal-500/20 transition flex-shrink-0">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div className="space-y-1 flex-1">
                  <h4 className="text-sm font-black text-slate-100 group-hover:text-teal-300 transition">
                    Mesajlaşma &amp; Sosyal Akış
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Danışmanın ve arkadaşlarınla soru ve gelişim kartı paylaşımı.
                  </p>
                </div>
              </div>

              {/* Kutu 9: AI Koç & Soru Asistanı */}
              <div
                onClick={onOpenAiCoach}
                className="group p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-violet-500/40 hover:bg-slate-850/60 transition cursor-pointer shadow-sm hover:shadow-lg hover:shadow-violet-500/5 hover:-translate-y-0.5 flex items-start space-x-4"
              >
                <div className="p-3 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20 group-hover:scale-110 group-hover:bg-violet-500/20 transition flex-shrink-0">
                  <Brain className="w-6 h-6" />
                </div>
                <div className="space-y-1 flex-1">
                  <h4 className="text-sm font-black text-slate-100 group-hover:text-violet-300 transition">
                    AI Koç &amp; Soru Asistanı
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    7/24 YKS rehberlik, motivasyon ve takıldığın soruların anında çözümü.
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Danışman Kutuları */}
              <div
                onClick={() => onNavigateToTab?.('STUDENTS')}
                className="group p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-850/60 transition cursor-pointer shadow-sm hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-0.5 flex items-start space-x-4"
              >
                <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:scale-110 group-hover:bg-indigo-500/20 transition flex-shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div className="space-y-1 flex-1">
                  <h4 className="text-sm font-black text-slate-100 group-hover:text-indigo-300 transition">
                    Öğrenci Takip Masası
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Barış, Efe ve tüm öğrencilerin anlık ilerleme durumu ve karneleri.
                  </p>
                </div>
              </div>

              <div
                onClick={() => onNavigateToTab?.('CALENDAR')}
                className="group p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-orange-500/40 hover:bg-slate-850/60 transition cursor-pointer shadow-sm hover:shadow-lg hover:shadow-orange-500/5 hover:-translate-y-0.5 flex items-start space-x-4"
              >
                <div className="p-3 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 group-hover:scale-110 group-hover:bg-orange-500/20 transition flex-shrink-0">
                  <Calendar className="w-6 h-6" />
                </div>
                <div className="space-y-1 flex-1">
                  <h4 className="text-sm font-black text-slate-100 group-hover:text-orange-300 transition">
                    Haftalık Görev Dağıtımı
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Öğrencilere hedef soru, kaynak kitap ve YouTube video etütleri ata.
                  </p>
                </div>
              </div>

              <div
                onClick={() => onNavigateToTab?.('LIBRARY')}
                className="group p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 hover:bg-slate-850/60 transition cursor-pointer shadow-sm hover:shadow-lg hover:shadow-amber-500/5 hover:-translate-y-0.5 flex items-start space-x-4"
              >
                <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-110 group-hover:bg-amber-500/20 transition flex-shrink-0">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div className="space-y-1 flex-1">
                  <h4 className="text-sm font-black text-slate-100 group-hover:text-amber-300 transition">
                    Kütüphane &amp; Kaynak Arşivi
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Öğrencilere tavsiye kitap ve dijital PDF kaynakları yükle ve yönet.
                  </p>
                </div>
              </div>

              <div
                onClick={onOpenChat}
                className="group p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-teal-500/40 hover:bg-slate-850/60 transition cursor-pointer shadow-sm hover:shadow-lg hover:shadow-teal-500/5 hover:-translate-y-0.5 flex items-start space-x-4"
              >
                <div className="p-3 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 group-hover:scale-110 group-hover:bg-teal-500/20 transition flex-shrink-0">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div className="space-y-1 flex-1">
                  <h4 className="text-sm font-black text-slate-100 group-hover:text-teal-300 transition">
                    Rehberlik Mesajlaşma Merkezi
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Öğrencilerle birebir sohbet, karne ve soru inceleme odası.
                  </p>
                </div>
              </div>

              {onOpenAddStudent && (
                <div
                  onClick={onOpenAddStudent}
                  className="group p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 hover:bg-slate-850/60 transition cursor-pointer shadow-sm hover:shadow-lg hover:shadow-emerald-500/5 hover:-translate-y-0.5 flex items-start space-x-4"
                >
                  <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-110 group-hover:bg-emerald-500/20 transition flex-shrink-0">
                    <UserPlus className="w-6 h-6" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <h4 className="text-sm font-black text-slate-100 group-hover:text-emerald-300 transition">
                      + Yeni Öğrenci Tanımla
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Sisteme yeni öğrenci kaydet ve otomatik haftalık müfredat dağıt.
                    </p>
                  </div>
                </div>
              )}

              <div
                onClick={scrollToProfileForm}
                className="group p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-violet-500/40 hover:bg-slate-850/60 transition cursor-pointer shadow-sm hover:shadow-lg hover:shadow-violet-500/5 hover:-translate-y-0.5 flex items-start space-x-4"
              >
                <div className="p-3 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20 group-hover:scale-110 group-hover:bg-violet-500/20 transition flex-shrink-0">
                  <Settings className="w-6 h-6" />
                </div>
                <div className="space-y-1 flex-1">
                  <h4 className="text-sm font-black text-slate-100 group-hover:text-violet-300 transition">
                    Danışman Profil &amp; Güvenlik
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    İletişim bilgileri, şifre değiştirme ve 2FA güvenlik ayarları.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 6. Profil Bilgileri & Düzenleme Formu (Görsel 2) */}
      <div id="profile-edit-section" className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <h3 className="text-lg sm:text-xl font-black text-slate-100 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-indigo-400" />
              <span>Profil Bilgileri</span>
            </h3>
            <p className="text-xs text-slate-400">
              Kişisel bilgilerini, iletişim kanallarını ve hedef tercihlerini güncelle
            </p>
          </div>

          {statusMessage && (
            <div className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn ${
              statusMessage.type === 'success' 
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
            }`}>
              {statusMessage.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{statusMessage.text}</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Ad */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Ad</label>
              <input
                type="text"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="Adınız"
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            {/* Soyad */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Soyad</label>
              <input
                type="text"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="Soyadınız"
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            {/* E-posta */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">E-posta</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ornek@virakoc.com"
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            {/* Telefon */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Telefon</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="0555 123 45 67"
                className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            {/* Öğrenci İse: Veli Adı ve Veli Telefonu (WhatsApp Raporları İçin) */}
            {isStudent && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>Veli Adı Soyadı (Anne / Baba)</span>
                    <span className="text-[10px] text-emerald-400 font-normal">Haftalık Rapor</span>
                  </label>
                  <input
                    type="text"
                    value={parentName}
                    onChange={e => setParentName(e.target.value)}
                    placeholder="Örn: Ayşe Deniz (Anne)"
                    className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>Veli Telefonu (WhatsApp)</span>
                    <span className="text-[10px] text-emerald-400 font-mono font-normal">Tek Tıkla İletim</span>
                  </label>
                  <input
                    type="tel"
                    value={parentPhone}
                    onChange={e => setParentPhone(e.target.value)}
                    placeholder="Örn: 0533 111 22 33"
                    className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-emerald-300 font-mono text-sm focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </>
            )}

            {/* İl */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">İl</label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="Örn: İstanbul"
                className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            {/* İlçe */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">İlçe</label>
              <input
                type="text"
                value={district}
                onChange={e => setDistrict(e.target.value)}
                placeholder="Örn: Kadıköy"
                className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            {/* Hedef Üniversite / Bölüm */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>{isStudent ? '🎯 Hedef Üniversite & Bölüm' : '🏢 Kurum / Danışmanlık Ünvanı'}</span>
                <span className="text-[10px] text-indigo-400 font-normal">YKS 2027 Projeksiyonu</span>
              </label>
              <input
                type="text"
                value={targetSchool}
                onChange={e => setTargetSchool(e.target.value)}
                placeholder="Örn: Boğaziçi Üniversitesi Bilgisayar Mühendisliği (Hedef: İlk 500)"
                className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            {/* OÖBP (Ortaöğretim Başarı Puanı) ve Diploma Notu Kartı */}
            {isStudent && (
              <div className="profile-oobp-card sm:col-span-2 p-5 rounded-2xl bg-gradient-to-r from-indigo-950/50 via-slate-900 to-purple-950/40 border border-indigo-500/30 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      <GraduationCap className="w-5 h-5 text-cyan-300" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white flex items-center gap-2">
                        <span className="profile-card-header-title">Ortaöğretim Başarı Puanı (OÖBP)</span>
                        <span className="profile-oobp-badge-tag text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          YKS Sıralamasını Doğrudan Belirler
                        </span>
                      </h4>
                      <p className="profile-card-header-desc text-xs text-slate-400 mt-0.5">
                        Lise diploma notunuz yerleştirme puanınıza ve ÖSYM Türkiye sıralamanıza eklenir.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="profile-oobp-score-pill text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      OÖBP: {(Number(diplomaGrade) * 5).toFixed(1)} / 500
                    </span>
                    <span className="profile-oobp-contrib-pill text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Yerleştirme Katkısı: +{(Number(diplomaGrade) * 5 * (isBrokenObp ? 0.06 : 0.12)).toFixed(2)} Puan
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="profile-oobp-label text-xs font-bold text-slate-300 flex items-center justify-between">
                      <span>Lise Mezuniyet / Diploma Notu (50.0 - 100.0)</span>
                      <span className="profile-oobp-sublabel text-[10px] text-slate-400 font-mono">100 Üzerinden</span>
                    </label>
                    <input
                      type="number"
                      min={50}
                      max={100}
                      step={0.01}
                      value={diplomaGrade}
                      onChange={e => setDiplomaGrade(Number(e.target.value))}
                      placeholder="Örn: 92.50"
                      className="profile-oobp-input w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-cyan-300 text-sm font-mono font-bold focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>

                  <div className="space-y-1.5 flex flex-col justify-end">
                    <label className="profile-oobp-checkbox-box flex items-center space-x-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800 cursor-pointer hover:border-slate-700 transition">
                      <input
                        type="checkbox"
                        checked={isBrokenObp}
                        onChange={e => setIsBrokenObp(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 bg-slate-900 border-slate-700"
                      />
                      <div className="text-left leading-tight">
                        <span className="profile-oobp-checkbox-title text-xs text-slate-200 font-bold block select-none">
                          Kırık OBP (Önceki Yıl Yerleştim)
                        </span>
                        <span className="profile-oobp-checkbox-desc text-[10px] text-slate-400 block select-none">
                          OBP katkısı %50 kesintiyle (katsayı 0.06) hesaplanır
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* ÖNCEKİ YIL SINAV GEÇMİŞİ & HEDEF KARŞILAŞTIRMA (OPSİYONEL) */}
            {isStudent && (
              <div className="profile-exam-history-card sm:col-span-2 p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 border border-cyan-500/30 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="profile-exam-history-icon p-2.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      <Target className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white flex items-center gap-2">
                        <span className="profile-card-header-title">Önceki Sınav Geçmişi ve Hedef Karşılaştırma</span>
                        <span className="profile-exam-history-badge text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
                          Grafikte Kıyaslama Seçeneği
                        </span>
                      </h4>
                      <p className="profile-card-header-desc text-xs text-slate-400 mt-0.5">
                        Daha önce girdiğiniz TYT/AYT sonuçları ve 2027 hedeflerinizle denemelerinizi izleyin.
                      </p>
                    </div>
                  </div>

                  {/* Daha önce girdim checkbox */}
                  <label className="profile-exam-history-checkbox-box flex items-center space-x-2.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 cursor-pointer hover:border-cyan-500/50 transition">
                    <input
                      type="checkbox"
                      checked={hasTakenBefore}
                      onChange={e => setHasTakenBefore(e.target.checked)}
                      className="rounded text-cyan-500 focus:ring-cyan-500 w-4 h-4 bg-slate-950 border-slate-700"
                    />
                    <span className="profile-exam-history-checkbox-text text-xs font-bold text-slate-200 select-none">
                      Daha önce YKS&apos;ye girdim
                    </span>
                  </label>
                </div>

                {/* Eğer daha önce girdiyse açılan form */}
                {hasTakenBefore && (
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-4 animate-fadeIn">
                    <div className="text-xs font-bold text-cyan-300 flex items-center gap-2">
                      <span>📋 Önceki Sınav Detayları (Gerçek Sonuçlar)</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-400">Sınav Yılı</label>
                        <select
                          value={prevExamYear}
                          onChange={e => setPrevExamYear(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-cyan-500"
                        >
                          <option value={2026}>2026 YKS</option>
                          <option value={2025}>2025 YKS</option>
                          <option value={2024}>2024 YKS</option>
                          <option value={2023}>2023 YKS</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-400">Puan Türü</label>
                        <select
                          value={prevScoreType}
                          onChange={e => setPrevScoreType(e.target.value as any)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-cyan-500"
                        >
                          <option value="SAYISAL">Sayısal (SAY)</option>
                          <option value="ESIT_AGIRLIK">Eşit Ağırlık (EA)</option>
                          <option value="SOZEL">Sözel (SÖZ)</option>
                          <option value="DIL">Yabancı Dil (DİL)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-400">Yerleştirme Sıralaması</label>
                        <input
                          type="number"
                          value={prevPlacementRank || ''}
                          onChange={e => setPrevPlacementRank(Number(e.target.value))}
                          placeholder="Örn: 24200"
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-amber-300 font-mono text-xs font-bold focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 uppercase font-semibold">TYT Ham Puanı</label>
                        <input
                          type="number"
                          step={0.1}
                          value={prevTytScore || ''}
                          onChange={e => setPrevTytScore(Number(e.target.value))}
                          placeholder="382.5"
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-cyan-300 font-mono text-xs font-bold focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 uppercase font-semibold">TYT Sıralaması</label>
                        <input
                          type="number"
                          value={prevTytRank || ''}
                          onChange={e => setPrevTytRank(Number(e.target.value))}
                          placeholder="34500"
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-xs focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 uppercase font-semibold">AYT Ham Puanı</label>
                        <input
                          type="number"
                          step={0.1}
                          value={prevAytScore || ''}
                          onChange={e => setPrevAytScore(Number(e.target.value))}
                          placeholder="395.0"
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-cyan-300 font-mono text-xs font-bold focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 uppercase font-semibold">AYT Sıralaması</label>
                        <input
                          type="number"
                          value={prevAytRank || ''}
                          onChange={e => setPrevAytRank(Number(e.target.value))}
                          placeholder="28400"
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-xs focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Detaylı Ders Netleri Girişi (Opsiyonel / Akıllı Mod) */}
                    <div className="pt-2 border-t border-slate-800/80">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="profile-exam-net-details-label text-[11px] font-semibold text-slate-300">
                          🎯 Ders Bazlı Eski Netleri Detaylandır (Grafikte branş kıyası için önerilir)
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowNetDetails(!showNetDetails)}
                          className="profile-exam-net-details-btn px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-600/30 text-indigo-300 hover:bg-indigo-600/50 border border-indigo-500/30 transition shadow-sm"
                        >
                          {showNetDetails ? '▲ Netleri Gizle' : '▼ 8 Branş Netini Gir'}
                        </button>
                      </div>

                      {showNetDetails && (
                        <div className="profile-exam-net-details-panel mt-3 p-3.5 rounded-xl bg-slate-900/90 border border-indigo-500/20 space-y-3 animate-fadeIn">
                          <div>
                            <div className="profile-exam-subheading text-[10px] uppercase font-bold text-cyan-400 mb-1.5">TYT Branş Netleri:</div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                              <div>
                                <label className="text-[10px] text-slate-400">Türkçe (40S)</label>
                                <input
                                  type="number"
                                  step={0.25}
                                  max={40}
                                  value={prevTytTurkceNet || ''}
                                  onChange={e => setPrevTytTurkceNet(Number(e.target.value))}
                                  placeholder="Örn: 32.5"
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-cyan-300 font-mono text-xs font-bold"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-400">Temel Mat (40S)</label>
                                <input
                                  type="number"
                                  step={0.25}
                                  max={40}
                                  value={prevTytMatNet || ''}
                                  onChange={e => setPrevTytMatNet(Number(e.target.value))}
                                  placeholder="Örn: 28.0"
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-cyan-300 font-mono text-xs font-bold"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-400">Fen Bilimleri (20S)</label>
                                <input
                                  type="number"
                                  step={0.25}
                                  max={20}
                                  value={prevTytFenNet || ''}
                                  onChange={e => setPrevTytFenNet(Number(e.target.value))}
                                  placeholder="Örn: 14.5"
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-cyan-300 font-mono text-xs font-bold"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-400">Sosyal Bilimler (20S)</label>
                                <input
                                  type="number"
                                  step={0.25}
                                  max={20}
                                  value={prevTytSosyalNet || ''}
                                  onChange={e => setPrevTytSosyalNet(Number(e.target.value))}
                                  placeholder="Örn: 13.0"
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-cyan-300 font-mono text-xs font-bold"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-800">
                            <div className="text-[10px] uppercase font-bold text-emerald-400 mb-1.5">AYT Branş Netleri:</div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                              <div>
                                <label className="text-[10px] text-slate-400">Matematik (40S)</label>
                                <input
                                  type="number"
                                  step={0.25}
                                  max={40}
                                  value={prevAytMatNet || ''}
                                  onChange={e => setPrevAytMatNet(Number(e.target.value))}
                                  placeholder="Örn: 27.5"
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-emerald-300 font-mono text-xs font-bold"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-400">Fizik (14S)</label>
                                <input
                                  type="number"
                                  step={0.25}
                                  max={14}
                                  value={prevAytFizikNet || ''}
                                  onChange={e => setPrevAytFizikNet(Number(e.target.value))}
                                  placeholder="Örn: 7.25"
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-emerald-300 font-mono text-xs font-bold"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-400">Kimya (13S)</label>
                                <input
                                  type="number"
                                  step={0.25}
                                  max={13}
                                  value={prevAytKimyaNet || ''}
                                  onChange={e => setPrevAytKimyaNet(Number(e.target.value))}
                                  placeholder="Örn: 9.5"
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-emerald-300 font-mono text-xs font-bold"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-400">Biyoloji (13S)</label>
                                <input
                                  type="number"
                                  step={0.25}
                                  max={13}
                                  value={prevAytBiyoNet || ''}
                                  onChange={e => setPrevAytBiyoNet(Number(e.target.value))}
                                  placeholder="Örn: 8.75"
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-emerald-300 font-mono text-xs font-bold"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 2027 Hedef Belirleme Alanı */}
                <div className="profile-target-scores-card p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="profile-target-title text-xs font-bold text-amber-300">
                      🎯 2027 YKS Hedef Puan ve Sıralama (Kıyaslama Çizgisi)
                    </span>
                    <span className="profile-target-subtitle text-[10px] text-slate-400">
                      Grafikte hedef çizgisi olarak gösterilir
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="profile-target-label text-[11px] text-slate-400 font-semibold block">Hedef TYT Puanı (Maks 500)</label>
                      <input
                        type="number"
                        min={100}
                        max={500}
                        step={1}
                        value={targetTytScore}
                        onChange={e => setTargetTytScore(Number(e.target.value))}
                        placeholder="450"
                        className="profile-target-input w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-cyan-300 font-mono text-xs font-bold focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="profile-target-label text-[11px] text-slate-400 font-semibold block">Hedef AYT Puanı (Maks 500)</label>
                      <input
                        type="number"
                        min={100}
                        max={500}
                        step={1}
                        value={targetAytScore}
                        onChange={e => setTargetAytScore(Number(e.target.value))}
                        placeholder="480"
                        className="profile-target-input w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-emerald-300 font-mono text-xs font-bold focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="profile-target-label text-[11px] text-slate-400 font-semibold block">Hedef Türkiye Sıralaması</label>
                      <input
                        type="number"
                        min={1}
                        max={500000}
                        value={targetRanking}
                        onChange={e => setTargetRanking(Number(e.target.value))}
                        placeholder="Örn: 500 veya 1000"
                        className="profile-target-input w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-amber-300 font-mono text-xs font-bold focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Adres (Opsiyonel) */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-300">Adres (Opsiyonel)</label>
              <textarea
                value={address}
                onChange={e => setAddress(e.target.value)}
                rows={2}
                placeholder="Açık adres veya çalışma lokasyonu"
                className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition resize-none"
              />
            </div>
          </div>

          {/* Güncelle Butonu (Görsel 2'deki Canlı Renkli Buton) */}
          <div className="pt-2 flex justify-start">
            <button
              type="submit"
              disabled={isSaving}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm shadow-xl shadow-pink-600/20 transition hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center space-x-2"
            >
              <span>{isSaving ? 'Kaydediliyor...' : 'Güncelle'}</span>
              <Check className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* 7. İki Adımlı Doğrulama (2FA) & Şifre Değiştirme Kartı (Görsel 2) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Sol Kart: İki Adımlı Doğrulama (2FA) */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-100">İki Adımlı Doğrulama (2FA)</h4>
                  <p className="text-[11px] text-slate-400">Hesap oturum güvenliği</p>
                </div>
              </div>

              {/* Rozet */}
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                is2FA 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}>
                {is2FA ? 'AKTİF' : 'KAPALI'}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Hesabınıza giriş sırasında e-posta veya telefonunuza onay kodu göndererek hesabınızı yabancı kişilere karşı korur.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={handleToggle2FA}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 border ${
                is2FA
                  ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30'
                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{is2FA ? '2FA Korumasını Kapat' : '2FA Korumasını Aç (Tavsiye Edilir)'}</span>
            </button>
          </div>
        </div>

        {/* Sağ Kart: Şifre Değiştirme Formu */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-100">Giriş Şifresini Değiştir</h4>
              <p className="text-[11px] text-slate-400">En az 6 karakterli güçlü şifre</p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-3">
            <div>
              <input
                type="password"
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
                placeholder="Mevcut Şifreniz"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-purple-500 transition"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Yeni Şifre"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-purple-500 transition"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Yeni Şifre (Tekrar)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-purple-500 transition"
              />
            </div>
            <button
              type="submit"
              disabled={isChangingPassword}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-purple-300 border border-purple-500/30 text-xs font-bold transition hover:border-purple-500 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isChangingPassword ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}</span>
            </button>
          </form>
        </div>

      </div>

      {/* Veli WhatsApp & PDF Raporlayıcısı Modalı */}
      {isStudent && (
        <ParentReportModal
          isOpen={isParentReportModalOpen}
          student={user}
          onClose={() => setIsParentReportModalOpen(false)}
          onRefreshStudentData={onProfileUpdated}
        />
      )}

    </div>
  );
};
