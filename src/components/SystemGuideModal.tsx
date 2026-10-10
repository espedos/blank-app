'use client';

import React, { useState } from 'react';
import { 
  X, 
  BookOpen, 
  UserCheck, 
  Calendar, 
  RotateCw, 
  TrendingUp, 
  ListTree, 
  Library, 
  Bot, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Sparkles,
  Zap,
  Target,
  Compass,
  Flame,
  Award,
  ChevronRight,
  Brain,
  Camera
} from 'lucide-react';

interface SystemGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab?: (tabId: string) => void;
  onOpenAiCoach?: () => void;
}

interface GuideStep {
  id: string;
  tabKey?: string;
  stepNumber: number;
  title: string;
  shortTitle: string;
  badge: string;
  icon: React.ReactNode;
  summary: string;
  details: {
    title: string;
    description: string;
    tip: string;
  }[];
  keyFeatures: string[];
  actionLabel?: string;
}

export const SystemGuideModal: React.FC<SystemGuideModalProps> = ({
  isOpen,
  onClose,
  onNavigateToTab,
  onOpenAiCoach
}) => {
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  if (!isOpen) return null;

  const STEPS: GuideStep[] = [
    {
      id: 'profile',
      tabKey: 'PROFILE',
      stepNumber: 1,
      title: 'Kişisel Profil & Hedef Kokpiti',
      shortTitle: 'Profil & Hedef',
      badge: 'Giriş & Strateji',
      icon: <Target className="w-5 h-5 text-amber-400" />,
      summary: 'YKS maratonundaki canlı durumunuzu, geri sayımı, diploma (OÖBP) puan katkınızı ve hedef sıralamanızla son denemeniz arasındaki Net Gap farkını gösteren ana kontrol merkezidir.',
      details: [
        {
          title: 'Canlı YKS Geri Sayım Sayacı',
          description: 'Sınav gününe kalan gün, saat, dakika ve saniyeyi canlı senkronize eder.',
          tip: 'Zaman algınızı diri tutar ve saatlik çalışma disiplini sağlar.'
        },
        {
          title: 'OÖBP & Diploma Puanı Gücü',
          description: 'Lise diploma notunuzun (250–500 arası) yerleştirme puanınıza ekleyeceği net katkıyı ve kırık OBP durumunu anında hesaplar.',
          tip: 'Diploma notunuz sınavda binlerce kişi öne geçmenizi sağlayan en somut avantajdır.'
        },
        {
          title: '2027 Hedef Sıralama & Net Gap Projeksiyonu',
          description: 'Hedeflediğiniz üniversite ve bölüm (Örn: İlk 1.000) için gereken TYT/AYT netleri ile mevcut denemeniz arasındaki farkı analiz eder.',
          tip: 'Hedefe kalan net miktarını haftalık kaç etütle kapatabileceğinizi projekte eder.'
        }
      ],
      keyFeatures: [
        '🔥 Günlük Soru Hedefi İlerleme Çubuğu',
        '⚡ Aktif Canlı Etüt / Önümüzdeki İlk Etüt Bildirimi',
        '🧠 AI Koç Haftalık Stratejik Odak & Zayıf Halka Kartı'
      ],
      actionLabel: 'Profil & Hedef Kokpitine Git'
    },
    {
      id: 'calendar',
      tabKey: 'CALENDAR',
      stepNumber: 2,
      title: 'Dinamik Takvim & Saatlik Görev Motoru',
      shortTitle: 'Saatlik Takvim',
      badge: 'Zaman Yönetimi',
      icon: <Calendar className="w-5 h-5 text-indigo-400" />,
      summary: 'Günün her saatini verimli planlayan, etüt başlangıç/bitişlerini takip eden ve kaçırılan dersleri otomatik telafi eden yapay zeka destekli ajandadır.',
      details: [
        {
          title: 'Haftalık ve Günlük Saatlik Çizelge',
          description: 'Pazartesiden Pazara saat bazında planlanan etütler, soru bankası çözümleri ve deneme sınavları.',
          tip: 'Tamamlanan görevler tek tıkla yeşile döner ve çalışma serinize (+1 Gün) eklenir.'
        },
        {
          title: 'Çakışma Önleyici & Otomatik Telafi Motoru',
          description: 'Yapılamayan veya ertelenen görevler için takvimdeki en uygun boş zaman aralığını bularak telafi görevi önerir.',
          tip: 'Asla hiçbir konu geride bırakılmaz; eksikler zincirleme birikmez.'
        },
        {
          title: 'Görev Türleri ve Renk Kodları',
          description: 'Konu Anlatımı (Mavi), Soru Bankası (Mor), Çıkmış Sorular (Turuncu), 12 Kritik Soru (Sarı), Deneme (Kırmızı).',
          tip: 'Görsel renk kodlaması ile günün yoğunluğunu bir bakışta kavrayabilirsiniz.'
        }
      ],
      keyFeatures: [
        '⏱️ Canlı Etüt Sayacı ve Zaman Takibi',
        '➕ Hızlı Saatlik Etüt Ekleme & Düzenleme',
        '🔄 Kaçırılan Etütler İçin Akıllı Telafi Sistemi'
      ],
      actionLabel: 'Haftalık Takvimi Aç'
    },
    {
      id: 'cycle',
      tabKey: 'CYCLE',
      stepNumber: 3,
      title: 'Çalışma Döngüsü & 12 Kritik Soru',
      shortTitle: 'Çalışma Döngüsü',
      badge: 'Verimli Öğrenme',
      icon: <RotateCw className="w-5 h-5 text-cyan-400" />,
      summary: 'Konuyu sadece dinleyip bırakmak yerine; soru çözümü, çıkmış soru taraması ve 12 kritik zayıf halka sorusuyla tam pekiştirmeyi sağlayan 4 aşamalı bilimsel öğrenme metodudur.',
      details: [
        {
          title: '4 Aşamalı Döngü Metodolojisi',
          description: '1. Aşama: Konu Anlatımı ➔ 2. Aşama: Soru Bankası ➔ 3. Aşama: Çıkmış Sorular ➔ 4. Aşama: 12 Kritik Zayıf Halka Testi.',
          tip: 'Tüm aşamaları yeşile dönmeyen bir konu "tamamlandı" sayılmaz.'
        },
        {
          title: '12 Kritik Soru (Zayıf Halka Avcısı)',
          description: 'ÖSYM tuzaklarını ve en çok hata yapılan püf noktalarını içeren özel 12 soruluk akıllı mikro sınav.',
          tip: '%70 başarı altına düşülen konular sistem tarafından anında "Acil Telafi" listesine alınır.'
        },
        {
          title: 'Etüt İlerleme Çubukları',
          description: 'Her ders ve branş için döngü tamamlama yüzdesi canlı olarak takip edilir.',
          tip: 'Eksik kaldığınız aşamayı doğrudan tıklayarak ilgili çalışma modülüne bağlanabilirsiniz.'
        }
      ],
      keyFeatures: [
        '🎯 Zayıf Halka Tespiti & Hata Analizi',
        '⚡ Tek Tıkla 12\'li Sınav Çözücüyü Başlatma',
        '📈 Branş Bazlı Döngü Bitirme Yüzdeleri'
      ],
      actionLabel: 'Çalışma Döngüsüne Git'
    },
    {
      id: 'analytics',
      tabKey: 'ANALYTICS',
      stepNumber: 4,
      title: 'Analiz & Gelişim Grafikleri (Şartname 7.B)',
      shortTitle: 'Net Analizleri',
      badge: 'Performans & Puan',
      icon: <TrendingUp className="w-5 h-5 text-emerald-400" />,
      summary: 'Resmi ÖSYM katsayılarına göre çalışan Şartname 7.B puan motoru ile netlerinizin gelişimini, ders başarı yüzdelerini ve 500 tabanındaki YKS Sayısal puanınızı hesaplar.',
      details: [
        {
          title: 'Şartname 7.B Resmi Sayısal Puan Motoru',
          description: 'TYT Katkısı (%40) + AYT Sayısal Katkısı (%60) + 100 Taban Puan formülüyle net puanınızı simüle eder.',
          tip: 'Hangi dersten 1 net artırmanın puanınıza kaç katsayı katacağını net görürsünüz.'
        },
        {
          title: 'Net Formülü & Normalizasyon',
          description: 'Net = Doğru - (Yanlış / 4) kuralı ve (Ders Neti / Toplam Soru) x 100 formülüyle normalize edilmiş başarı grafiği.',
          tip: 'Farklı soru sayılı dersleri eşit skalada objektif kıyaslayabilmenizi sağlar.'
        },
        {
          title: 'Etkileşimli Puan Simülatörü',
          description: 'Branş netlerinizi kaydırarak veya girerek hedef puanınıza ne kadar yaklaştığınızı anında test edin.',
          tip: 'Deneme öncesi ulaşmak istediğiniz gerçekçi barajları belirleyin.'
        }
      ],
      keyFeatures: [
        '📊 TYT & AYT Ayrıntılı Ders Dağılım Grafikleri',
        '🏆 500 Puan Üzerinden Anlık YKS Projeksiyonu',
        '⚖️ 3.3 TYT ve 3.0/3.07 AYT Resmi Katsayı Tablosu'
      ],
      actionLabel: 'Net ve Puan Motorunu Aç'
    },
    {
      id: 'tree',
      tabKey: 'TREE',
      stepNumber: 5,
      title: 'Müfredat Sorumluluk & Muafiyet Haritası',
      shortTitle: 'Müfredat Haritası',
      badge: 'Konu Hakimiyeti',
      icon: <ListTree className="w-5 h-5 text-purple-400" />,
      summary: 'Tüm TYT ve AYT konularının hiyerarşik ağacıdır. Hangi konudan sorumlu olduğunuzu, hangisinde uzmanlaştığınızı ve hangi konudan muafiyet talep ettiğinizi yönetir.',
      details: [
        {
          title: 'Kapsamlı Konu Ağacı',
          description: 'Fizik, Kimya, Biyoloji, Matematik ve Geometri ünitelerinin alt kazanım seviyesinde listesi.',
          tip: 'Tamamlanan, eksik olan veya çalışılmakta olan konular farklı renk rozetleriyle ayrılır.'
        },
        {
          title: 'Muafiyet Talep Sistemi',
          description: 'Zaten %100 bildiğiniz ve zaman kaybetmek istemediğiniz konular için danışmanınıza tek tıkla muafiyet bildirimi gönderin.',
          tip: 'Danışman onayladığında bu konu takviminizden çıkarılarak eksik konularınıza daha fazla zaman ayrılır.'
        },
        {
          title: 'Kritik Konu Etiketleri',
          description: 'ÖSYM\'nin her yıl kesin soru sorduğu "Banko / Kritik" konular altın yıldızla işaretlenmiştir.',
          tip: 'Bu konuları asla atlamamalı ve deneme öncesi mutlaka tekrar etmelisiniz.'
        }
      ],
      keyFeatures: [
        '🌿 İnteraktif Açılır-Kapanır Ünite Ağacı',
        '📝 Danışmana Muafiyet Başvurusu Gönderme',
        '⭐ Banko ÖSYM Konuları Öncelik Rozeti'
      ],
      actionLabel: 'Müfredat Haritasını İncele'
    },
    {
      id: 'library',
      tabKey: 'LIBRARY',
      stepNumber: 6,
      title: 'Dijital Kütüphane & Kaynak Yönetimi',
      shortTitle: 'Kütüphane',
      badge: 'Materyal & Kitap',
      icon: <Library className="w-5 h-5 text-rose-400" />,
      summary: 'Kullandığınız soru bankalarını, konu anlatım föylerini, video serilerini ve deneme arşivlerini tek bir merkezden takip etmenizi sağlar.',
      details: [
        {
          title: 'Kaynak Kitap İlerleme Çubukları',
          description: 'Hangi soru bankasının yüzde kaçını bitirdiğinizi sayfa ve test bazında takip edin.',
          tip: 'Yarım bırakılan kaynakların sınav öncesi bitirilmesini garanti altına alır.'
        },
        {
          title: 'Önerilen YouTube Video Oynatma Listeleri',
          description: 'Zorlandığınız konular için danışmanınızın atadığı en kaliteli konu anlatım ve soru çözüm videoları.',
          tip: 'Vakit kaybetmeden doğrudan hedefe yönelik anlatımlara ulaşırsınız.'
        },
        {
          title: 'Özel Notlar & Formül Kağıtları',
          description: 'Ders bazında kaydedilmiş hap formüller, özet tablolar ve kritik notlar.',
          tip: 'Deneme sınavlarından hemen önce hızlı tekrar için paha biçilemez bir kaynaktır.'
        }
      ],
      keyFeatures: [
        '📚 Soru Bankası Bitirme Oranı Takibi',
        '🎥 YouTube Video Ders Entegrasyonu',
        '📌 Kaynak Ekleme, Düzenleme ve Arşivleme'
      ],
      actionLabel: 'Dijital Kütüphaneye Geç'
    },
    {
      id: 'ai_coach',
      tabKey: undefined,
      stepNumber: 7,
      title: 'Vira AI Koç & Akıllı Asistan',
      shortTitle: 'Vira AI Koç',
      badge: '7/24 Rehberlik',
      icon: <Bot className="w-5 h-5 text-cyan-400" />,
      summary: 'Sadece ders sorularını yanıtlamakla kalmayan; görsel/belge soru çözebilen, platform içi yönlendirmeler yapan, zayıf halkalarınızı analiz eden ve 7/24 yanınızda olan akıllı koçunuzdur.',
      details: [
        {
          title: '📷 Fotoğraflı / Belgeli Soru Çözümü & Hafıza Analizi',
          description: 'Çözemediğiniz sorunun fotoğrafını veya PDF belgesini yükleyin. AI Koç soruyu anında analiz eder, doğru şıkkı, adım adım çözümü ve ÖSYM tuzağını gösterir.',
          tip: 'Yüklenen tüm sorular yapay zeka hafızasına alınır ve sistem kendini eğiterek size benzer seviyede yeni sorular önerir.'
        },
        {
          title: 'Tıklanabilir Sayfa Yönlendirme Linkleri (Deep-Linking)',
          description: 'AI Koç\'a "haftalık programım", "netlerim" veya "türev testi" yazdığınızda cevabın altına doğrudan o sayfayı açan butonlar koyar.',
          tip: 'Menülerde aramak yerine AI Koç\'a söyleyin, sizi anında o modüle götürsün.'
        },
        {
          title: 'ÖSYM Tuzakları & Zihin Haritası Formatı',
          description: 'Sorduğunuz her konu için 4 parçalı analiz: Özet, Kritik Maddeler, ASCII Zihin Haritası ve ÖSYM Tuzak Uyarısı.',
          tip: 'Sınavda en çok düşülen çeldiricileri önceden öğrenerek hata payınızı sıfırlayın.'
        }
      ],
      keyFeatures: [
        '📷 Tek Tıkla Fotoğraflı Soru Çözümü',
        '🧠 Kendi Kendini Eğiten Akıllı Soru Hafızası',
        '🔗 Tıklanabilir Modül Yönlendirme Butonları'
      ],
      actionLabel: 'Vira AI Koça Soru Sor'
    },
    {
      id: 'question_bank_flow',
      tabKey: 'CALENDAR',
      stepNumber: 8,
      title: 'Mentor AI Soru Havuzu, Görev Atama & Karşılıklı Takvim Onayı',
      shortTitle: 'Soru Havuzu & Onay',
      badge: 'Mentor-Öğrenci Bağı',
      icon: <Brain className="w-5 h-5 text-pink-400" />,
      summary: 'Danışmanların karışık sorular yükleyip AI ile ayrıştırdığı, öğrenciye özel görev/deneme atadığı; öğrencinin ise boş saat seçip takvimine eklediği ve çift taraflı onay/geri alma korumalı interaktif ekosistemdir.',
      details: [
        {
          title: 'Karışık Soru Yükleme & Otomatik AI Ayrıştırma',
          description: 'Danışman metin veya görsel formatta toplu soru yükler. Yapay zeka soruları ders, konu, zorluk derecesi ve ÖSYM çeldiricisine göre anında sınıflandırıp havuza depolar.',
          tip: 'Danışman tek tıkla belirli konulardan veya karma ünitelerden mini deneme derleyebilir.'
        },
        {
          title: 'Öğrencinin Boş Saate Görev Yerleştirmesi',
          description: 'Öğrenci kendisine atanan görevleri takviminde görerek haftanın boş saat slotlarından istediğini seçer ve tek tıkla etüt olarak planlar.',
          tip: 'Hiçbir görev zorla ders çakışması yaratmaz; öğrenci kendi çalışma ritmine göre uygun saate yerleştirir.'
        },
        {
          title: 'Sürükle-Bırak Takvim Düzenleme & Mentor Onay / Geri Alma Koruması',
          description: 'Öğrenci ders kutularının yerini değiştirdiğinde değişiklik danışman onayına gider. Hatalı düzenlemeler için "Takvim Düzenlemesini Geri Al" butonu mevcuttur. Danışman reddederse program otomatik eski haline döner.',
          tip: 'Hem öğrenciye özgürlük hem de mentora tam denetim ve geri alma güvenliği sağlar.'
        }
      ],
      keyFeatures: [
        '⚡ AI Otomatik Soru Ayrıştırma ve Havuz Yönetimi',
        '📅 Takvimdeki Boş Saate Tek Tıkla Görev Planlama',
        '🛡️ Çift Taraflı Mentor Onayı ve Anında Geri Al (Undo) Koruması'
      ],
      actionLabel: 'Haftalık Takvime Git'
    },
    {
      id: 'lgs',
      tabKey: undefined,
      stepNumber: 9,
      title: 'Yeni: LGS Bölümü (8. Sınıf)',
      shortTitle: 'LGS Bölümü',
      badge: 'Yeni Sınav',
      icon: <Compass className="w-5 h-5 text-pink-400" />,
      summary: 'Vira artık LGS için de çalışıyor. LGS bölümü kendi adresinde (/lgs) ayrı bir giriş, ayrı öğrenci ve veli hesaplarıyla çalışır; YKS hesaplarınız ve verileriniz bundan etkilenmez.',
      details: [
        {
          title: 'Ayrı Giriş, Aynı Site',
          description: 'LGS öğrencileri ve velileri /lgs adresinden hesap açar ve giriş yapar. Ana sayfadaki "LGS" düğmesi doğrudan oraya götürür.',
          tip: 'YKS girişi ve paneli eskisi gibi çalışmaya devam eder.'
        },
        {
          title: 'Öğrenci ve Veli Hesapları',
          description: 'Kayıt sırasında öğrenci ya da veli seçilir. Öğrenci hesapları velinin bilgisi ve izniyle açılır.',
          tip: 'Veli ile öğrenci hesabını bağlama adımı hazırlanıyor.'
        },
        {
          title: 'Ayrı Kullanma Kılavuzu',
          description: 'LGS bölümünün kendi kılavuzu vardır ve her yeni özellik eklendiğinde güncellenir.',
          tip: 'Aşağıdaki düğme LGS kılavuzunu açar.'
        }
      ],
      keyFeatures: [
        '🎯 Kazanım bazlı LGS hazırlığı',
        '👨‍👩‍👧 Ayrı öğrenci ve veli hesapları',
        '🔒 Her öğrencinin verisi yalnızca kendisine, velisine ve koçuna açık'
      ],
      actionLabel: 'LGS Kılavuzunu Aç'
    }
  ];

  const currentStep = STEPS[activeStepIndex];

  const handleNext = () => {
    if (activeStepIndex < STEPS.length - 1) {
      setActiveStepIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (activeStepIndex > 0) {
      setActiveStepIndex(prev => prev - 1);
    }
  };

  const handleAction = () => {
    onClose();
    if (currentStep.id === 'lgs') {
      window.location.href = '/lgs/kilavuz';
      return;
    }
    if (currentStep.id === 'ai_coach') {
      if (onOpenAiCoach) onOpenAiCoach();
    } else if (currentStep.tabKey && onNavigateToTab) {
      onNavigateToTab(currentStep.tabKey);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="system-guide-modal-card relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden text-slate-100">
        
        {/* Üst Başlık Şeridi */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white system-guide-title">
                  Vira YKS Koçluk Platform Rehberi
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  Kullanma Kılavuzu
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium hidden sm:block system-guide-sub">
                Tüm modülleri, takvim motorunu, puan hesaplama sistemini ve AI Koçu adım adım keşfedin.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="chat-close-btn p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition"
            title="Kılavuzu Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Adım Sekmeleri Şeridi (7 Adım Yatay Gezinti) */}
        <div className="guide-steps-tab-bar px-4 py-2.5 bg-slate-950/40 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {STEPS.map((step, idx) => {
            const isActive = idx === activeStepIndex;
            return (
              <button
                key={step.id}
                onClick={() => setActiveStepIndex(idx)}
                className={`guide-step-tab-btn flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex-shrink-0 ${
                  isActive
                    ? 'guide-step-tab-active bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md shadow-indigo-600/25 border border-indigo-400/40'
                    : 'guide-step-tab-inactive bg-slate-800/70 text-slate-400 hover:text-slate-200 border border-slate-700/60 hover:bg-slate-800'
                }`}
              >
                <span className={`guide-step-number-badge w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-mono ${
                  isActive ? 'bg-white text-indigo-900 font-black' : 'bg-slate-700 text-slate-300'
                }`}>
                  {step.stepNumber}
                </span>
                <span className="guide-step-title-text">{step.shortTitle}</span>
              </button>
            );
          })}
        </div>

        {/* Gövde / İçerik Alanı */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          
          {/* Adım Başlığı & Rozeti */}
          <div className="guide-hero-banner flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-slate-900 to-cyan-950/40 border border-indigo-500/30">
            <div className="flex items-start sm:items-center space-x-3.5">
              <div className="guide-hero-icon-box p-3 rounded-2xl bg-slate-800 border border-slate-700 shadow-md flex-shrink-0">
                {currentStep.icon}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="guide-step-badge-step text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Adım {currentStep.stepNumber} / {STEPS.length}
                  </span>
                  <span className="guide-step-badge-tag text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {currentStep.badge}
                  </span>
                </div>
                <h3 className="guide-step-main-title text-lg sm:text-xl font-black text-white system-guide-step-title">
                  {currentStep.title}
                </h3>
              </div>
            </div>

            {currentStep.actionLabel && (
              <button
                onClick={handleAction}
                className="guide-hero-action-btn self-start sm:self-center px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center space-x-1.5 hover:scale-105 active:scale-95 flex-shrink-0"
              >
                <span>{currentStep.actionLabel}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Adım Özeti */}
          <div className="system-guide-summary p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 text-sm text-slate-300 font-medium leading-relaxed">
            {currentStep.summary}
          </div>

          {/* 3 Detay Kartı Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {currentStep.details.map((detail, dIdx) => (
              <div 
                key={dIdx}
                className="guide-detail-card p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5">
                  <h4 className="guide-detail-title text-xs font-black text-white flex items-center gap-1.5 system-guide-detail-title">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>{detail.title}</span>
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-normal">
                    {detail.description}
                  </p>
                </div>
                <div className="guide-coach-tip-box p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/60 text-[11px] text-amber-300/90 font-medium">
                  <strong className="guide-coach-tip-label text-amber-400 font-bold">💡 Koç Tavsiyesi:</strong> {detail.tip}
                </div>
              </div>
            ))}
          </div>

          {/* Öne Çıkan Özellikler Şeridi */}
          <div className="guide-key-features-container p-4 rounded-2xl bg-slate-950/70 border border-indigo-500/20 space-y-2">
            <span className="guide-key-features-title text-[10px] font-black uppercase tracking-wider text-indigo-400">
              Bu Modülde Öne Çıkan Süper Özellikler:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-bold text-slate-200">
              {currentStep.keyFeatures.map((feat, fIdx) => (
                <div key={fIdx} className="guide-key-feature-chip flex items-center space-x-1.5 p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Alt Navigasyon Çubuğu (Önceki - Sonraki Adım) */}
        <div className="guide-footer-bar flex items-center justify-between px-6 py-3.5 border-t border-slate-800 bg-slate-950/80">
          <button
            onClick={handlePrev}
            disabled={activeStepIndex === 0}
            className={`guide-nav-prev-btn px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
              activeStepIndex === 0
                ? 'opacity-40 cursor-not-allowed text-slate-500 bg-slate-800/40'
                : 'text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Önceki Adım</span>
          </button>

          <div className="guide-footer-counter text-xs text-slate-400 font-mono font-bold">
            {activeStepIndex + 1} / {STEPS.length}
          </div>

          {activeStepIndex < STEPS.length - 1 ? (
            <button
              onClick={handleNext}
              className="guide-nav-next-btn px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-black text-xs shadow-md shadow-indigo-600/20 transition flex items-center space-x-1.5"
            >
              <span>Sonraki Adım</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleAction}
              className="guide-nav-next-btn px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-md shadow-emerald-600/20 transition flex items-center space-x-1.5"
            >
              <span>{currentStep.actionLabel || 'Başlayalım'}</span>
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
