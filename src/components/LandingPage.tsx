'use client';

import React, { useState } from 'react';
import { ViraLogo } from './ViraLogo';
import {
  Brain,
  Calendar,
  BarChart2,
  Target,
  MessageCircle,
  ChevronRight,
  Phone,
  Mail,
  Send,
  Sparkles,
  X,
  CheckCircle2,
  TrendingUp,
  BookOpen,
  ShieldCheck
} from 'lucide-react';

interface LandingPageProps {
  onOpenStudentLogin: () => void;
  onOpenCounselorLogin: () => void;
}

const features = [
  {
    icon: Calendar,
    color: 'from-indigo-500 to-violet-600',
    title: 'Dinamik Takvim Motoru',
    desc: 'Haftalık saatlik görev planı, otomatik telafi blokları ve akıllı kaydırma sistemi.'
  },
  {
    icon: BarChart2,
    color: 'from-cyan-500 to-blue-600',
    title: 'Normalize Deneme Analizi',
    desc: 'TYT/AYT sınav sonuçlarından simüle ÖSYM puanı ve karşılaştırmalı grafik analizi.'
  },
  {
    icon: Brain,
    color: 'from-violet-500 to-purple-600',
    title: 'Yapay Zeka Koçluğu',
    desc: 'Anlık eksik tespiti, kişisel öneriler ve AI destekli haftalık hedef belirleme.'
  },
  {
    icon: Target,
    color: 'from-rose-500 to-pink-600',
    title: 'Konu Hakimiyet Matrisi',
    desc: 'TYT & AYT tüm ders/konu durumları, danışman onay mekanizması ve muafiyet sistemi.'
  },
  {
    icon: TrendingUp,
    color: 'from-emerald-500 to-teal-600',
    title: 'Anlık İlerleme Takibi',
    desc: 'Plan sadakati, tamamlanma oranı ve genel performans skoru gerçek zamanlı izleme.'
  },
  {
    icon: ShieldCheck,
    color: 'from-amber-500 to-orange-600',
    title: 'Güvenli Danışman Paneli',
    desc: '3 aşamalı güvenlik, arşivleme/sıfırlama motoru ve öğrenci yönetim merkezi.'
  }
];

const stats = [
  { value: '365', label: 'Günlük Takip' },
  { value: 'TYT + AYT', label: 'Eksiksiz Müfredat' },
  { value: 'AI', label: 'Destekli Analiz' },
  { value: '7/24', label: 'Erişim' }
];

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenStudentLogin, onOpenCounselorLogin }) => {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMsg, setChatMsg] = useState('');
  const [chatHistory, setChatHistory] = useState<{ from: 'user' | 'bot'; text: string }[]>([
    { from: 'bot', text: 'Merhaba! 👋 Ben Vira\'nın AI asistanıyım. Sana nasıl yardımcı olabilirim?' }
  ]);
  const [form, setForm] = useState({ name: '', target: '12. Sınıf', phone: '', message: '' });
  const [formSent, setFormSent] = useState(false);

  const handleChatSend = () => {
    if (!chatMsg.trim()) return;
    const userMsg = chatMsg.trim();
    setChatHistory(h => [...h, { from: 'user', text: userMsg }]);
    setChatMsg('');
    setTimeout(() => {
      let reply = 'Harika soru! Vira platformu YKS sürecinde sana birebir koçluk desteği sağlar. Detaylı bilgi için danışmanınıza ulaşabilirsiniz.';
      const lower = userMsg.toLowerCase();
      if (lower.includes('fiyat') || lower.includes('ücret')) {
        reply = 'Fiyatlandırma bilgisi için WhatsApp üzerinden Cen Hoca ile iletişime geçebilirsiniz.';
      } else if (lower.includes('nasıl') && lower.includes('giriş')) {
        reply = 'Öğrenci olarak platforma giriş yapmak için sağ üstteki "Öğrenci Girişi" butonunu kullanabilirsiniz.';
      } else if (lower.includes('tyt') || lower.includes('ayt')) {
        reply = 'Vira hem TYT hem AYT Sayısal müfredatını destekler. Konu hakimiyet matrisi ile tüm konularını takip edebilirsin!';
      }
      setChatHistory(h => [...h, { from: 'bot', text: reply }]);
    }, 800);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSent(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">

      {/* ─── NAVBAR ─────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 border-b border-slate-800/60 bg-slate-950/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <ViraLogo size={36} variant="full" />
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenStudentLogin}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition shadow-lg shadow-indigo-600/25"
            >
              Öğrenci Girişi
            </button>
            <button
              onClick={onOpenCounselorLogin}
              className="px-4 py-2 rounded-xl border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white font-medium text-sm transition"
            >
              Danışman Girişi
            </button>
          </div>
        </div>
      </nav>

      {/* ─── HERO ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-20 pb-24 px-4">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-indigo-600/10 rounded-full blur-3xl" />
          <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-violet-600/8 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            YKS 2027 — Hedef Tarihi: 19-20 Haziran 2027
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight">
            Hedef 2027:{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              Yapay Zeka Destekli
            </span>
            <br />
            Birebir YKS Sayısal Koçluğu
          </h1>

          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Dinamik takvim, anlık eksik tespiti ve kişiye özel deneme analizleri ile hedefine tam yol ileri.
            Her öğrenciye özel, her günü planlı, her adımı takipli.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-base transition shadow-xl shadow-indigo-600/30 flex items-center gap-2"
            >
              Sistemi İncele <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-3.5 rounded-2xl border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white font-semibold text-base transition flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" /> İletişime Geç
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="relative max-w-3xl mx-auto mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map(s => (
            <div key={s.label} className="text-center p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="text-2xl font-black text-white">{s.value}</div>
              <div className="text-xs text-slate-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FEATURES ───────────────────────────────────────── */}
      <section id="features" className="py-20 px-4 border-t border-slate-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-white mb-3">Platform Özellikleri</h2>
            <p className="text-slate-400 text-base max-w-xl mx-auto">
              Öğrenci ve danışman için tasarlanmış, YKS&apos;ye özel bütünleşik bir koçluk ekosistemi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(f => (
              <div
                key={f.title}
                className="group p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/50"
              >
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-lg`}>
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-white text-base mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ───────────────────────────────────── */}
      <section className="py-20 px-4 border-t border-slate-800/50 bg-slate-900/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-white mb-3">Nasıl Çalışır?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: '01', icon: BookOpen, title: 'Müfredatını Belirle', desc: 'TYT ve AYT Sayısal konularını Konu Hakimiyet Matrisi ile işaretle. Danışmanın onay verir.' },
              { step: '02', icon: Calendar, title: 'Takvim Oluşturun', desc: 'Danışman, haftaya özel saatlik çalışma bloklarını oluşturur. Telafi görevleri otomatik planlanır.' },
              { step: '03', icon: TrendingUp, title: 'İzle ve Gelişir', desc: 'Deneme sonuçlarını gir, AI koçundan öneri al, eksiklikleri anlık tespit et.' }
            ].map(item => (
              <div key={item.step} className="relative p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                <div className="text-5xl font-black text-slate-800 absolute top-4 right-5 select-none">{item.step}</div>
                <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-6 h-6 text-indigo-400" />
                </div>
                <h3 className="font-bold text-white text-base mb-2">{item.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CONTACT ────────────────────────────────────────── */}
      <section id="contact" className="py-20 px-4 border-t border-slate-800/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-white mb-3">İletişim & Danışman Ağı</h2>
            <p className="text-slate-400 text-base">
              Birebir YKS koçluğu hakkında bilgi almak için hemen ulaşın.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contact form */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              {formSent ? (
                <div className="flex flex-col items-center justify-center h-full py-10 space-y-3 text-center">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                  <h3 className="text-lg font-bold text-white">Mesajınız Alındı!</h3>
                  <p className="text-sm text-slate-400">En kısa sürede geri dönüş yapılacaktır.</p>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <h3 className="font-bold text-white text-base mb-4">Bize Yazın</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      required
                      placeholder="Ad Soyad"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                    <select
                      value={form.target}
                      onChange={e => setForm(f => ({ ...f, target: e.target.value }))}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-sm focus:outline-none focus:border-indigo-500"
                    >
                      <option>12. Sınıf</option>
                      <option>Mezun</option>
                    </select>
                  </div>
                  <input
                    required
                    placeholder="Telefon"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <textarea
                    rows={4}
                    placeholder="Mesajınız..."
                    value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                  />
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" /> Gönder
                  </button>
                </form>
              )}
            </div>

            {/* Quick contact */}
            <div className="space-y-4">
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <h3 className="font-bold text-white text-base">Hızlı İletişim</h3>
                <a
                  href="https://wa.me/905000000000?text=Merhaba%2C%20Vira%20YKS%20koçluk%20hakkında%20bilgi%20almak%20istiyorum."
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 p-4 rounded-xl bg-emerald-600/15 border border-emerald-500/30 hover:border-emerald-400/50 hover:bg-emerald-600/25 transition group"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-emerald-300 text-sm group-hover:text-emerald-200">WhatsApp ile Danışmana Ulaş</div>
                    <div className="text-xs text-slate-400">Hızlı cevap · 7/24</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-emerald-400 ml-auto" />
                </a>

                <a
                  href="https://t.me/virayks"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 p-4 rounded-xl bg-blue-600/15 border border-blue-500/30 hover:border-blue-400/50 hover:bg-blue-600/25 transition group"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <Send className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-blue-300 text-sm group-hover:text-blue-200">Telegram Kanalı</div>
                    <div className="text-xs text-slate-400">Duyurular ve kaynaklar</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-blue-400 ml-auto" />
                </a>

                <a
                  href="mailto:vira@example.com"
                  className="flex items-center gap-3 p-4 rounded-xl bg-slate-800 border border-slate-700 hover:border-slate-600 transition group"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-slate-300" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-200 text-sm group-hover:text-white">E-posta</div>
                    <div className="text-xs text-slate-400">vira@example.com</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 ml-auto" />
                </a>
              </div>

              {/* CTA Box */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-900/40 to-violet-900/40 border border-indigo-500/30 text-center space-y-3">
                <Sparkles className="w-8 h-8 text-indigo-400 mx-auto" />
                <h3 className="font-bold text-white text-base">Sisteme Giriş Yap</h3>
                <p className="text-xs text-slate-400">Öğrenci veya danışman olarak platforma erişin.</p>
                <div className="flex gap-3">
                  <button
                    onClick={onOpenStudentLogin}
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition"
                  >
                    Öğrenci
                  </button>
                  <button
                    onClick={onOpenCounselorLogin}
                    className="flex-1 py-2.5 rounded-xl border border-slate-600 hover:border-slate-500 text-slate-300 hover:text-white font-semibold text-sm transition"
                  >
                    Danışman
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─────────────────────────────────────────── */}
      <footer className="border-t border-slate-800 py-8 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <ViraLogo size={28} variant="full" />
          <span>© 2026-2027 Vira Öğrenci-Danışman Takip ve Yapay Zeka Destekli Koçluk Platformu</span>
          <span className="text-slate-600">YKS 2027 Hedefli · PWA Uyumlu</span>
        </div>
      </footer>

      {/* ─── AI WELCOME WIDGET ──────────────────────────────── */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-xl shadow-indigo-600/40 flex items-center justify-center transition-all hover:scale-110 group"
          title="AI Asistan"
        >
          <Brain className="w-6 h-6 text-white" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-slate-950 animate-pulse" />
        </button>
      )}

      {chatOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-80 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden flex flex-col">
          {/* Chat header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-900/60 to-violet-900/60 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-bold text-white">Vira AI Asistan</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <button onClick={() => setChatOpen(false)} className="text-slate-400 hover:text-white transition">
              <X className="w-4 h-4" />
            </button>
          </div>
          {/* Messages */}
          <div className="flex-1 p-3 space-y-2 overflow-y-auto max-h-60 scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-slate-700">
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                  msg.from === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-200'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
          {/* Input */}
          <div className="p-3 border-t border-slate-800 flex gap-2">
            <input
              value={chatMsg}
              onChange={e => setChatMsg(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleChatSend()}
              placeholder="Mesaj yaz..."
              className="flex-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleChatSend}
              className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
