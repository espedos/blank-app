'use client';

import React, { useState, useRef } from 'react';
import { User } from '@/types';
import { StorageService } from '@/lib/storage';
import { 
  X, 
  Upload, 
  Camera, 
  Image as ImageIcon, 
  Sparkles, 
  Check, 
  Link as LinkIcon 
} from 'lucide-react';

interface AvatarUploadModalProps {
  isOpen: boolean;
  user: User;
  onClose: () => void;
  onSuccess: (updatedUser: User) => void;
}

// Curated high quality avatars for students and counselor
const PRESET_AVATARS = [
  {
    category: 'Öğrenci',
    url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=256&q=80',
    label: 'Barış (Klasik)'
  },
  {
    category: 'Öğrenci',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
    label: 'Efe (Klasik)'
  },
  {
    category: 'Öğrenci',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
    label: 'Genç Erkek (Çalışma)'
  },
  {
    category: 'Öğrenci',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
    label: 'Genç Kız (Güleryüz)'
  },
  {
    category: 'Öğrenci',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&q=80',
    label: 'Öğrenci (Modern)'
  },
  {
    category: 'Öğrenci',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    label: 'Cen Danışman'
  },
  {
    category: 'Akademik',
    url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=256&q=80',
    label: 'Kütüphane Çalışanı'
  },
  {
    category: 'Akademik',
    url: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=256&q=80',
    label: 'Sınav Odaklı'
  }
];

export const AvatarUploadModal: React.FC<AvatarUploadModalProps> = ({
  isOpen,
  user,
  onClose,
  onSuccess
}) => {
  const [selectedAvatar, setSelectedAvatar] = useState<string>(user.avatar);
  const [customUrl, setCustomUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'UPLOAD' | 'GALLERY' | 'URL'>('UPLOAD');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (< 4MB)
      if (file.size > 4 * 1024 * 1024) {
        alert('Lütfen 4MB\'dan küçük bir görsel seçin.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSelectedAvatar(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    const updated = StorageService.updateUserAvatar(user.id, selectedAvatar);
    if (updated) {
      onSuccess(updated);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-7 text-white relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Profil Resmini Değiştir</h3>
              <p className="text-xs text-slate-400">{user.name} ({user.role === 'CONSULTANT' ? 'Danışman' : 'Öğrenci'})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Preview Section */}
        <div className="py-5 flex flex-col items-center justify-center bg-slate-950/50 rounded-2xl border border-slate-800/80 my-4">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <img
              src={selectedAvatar}
              alt={user.name}
              className="w-24 h-24 rounded-full object-cover ring-4 ring-indigo-500/50 shadow-2xl transition group-hover:opacity-80"
            />
            <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition">
              <Camera className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-2.5 text-center">
            <span className="text-xs font-semibold text-slate-300">Önizleme</span>
            <p className="text-[11px] text-slate-500">Resme tıklayarak cihazınızdan doğrudan dosya seçebilirsiniz</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center space-x-1 p-1 bg-slate-800/80 rounded-xl mb-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('UPLOAD')}
            className={`flex-1 py-1.5 px-3 rounded-lg transition flex items-center justify-center space-x-1.5 ${
              activeTab === 'UPLOAD' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Dosya Yükle</span>
          </button>
          <button
            onClick={() => setActiveTab('GALLERY')}
            className={`flex-1 py-1.5 px-3 rounded-lg transition flex items-center justify-center space-x-1.5 ${
              activeTab === 'GALLERY' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Hazır Galeri</span>
          </button>
          <button
            onClick={() => setActiveTab('URL')}
            className={`flex-1 py-1.5 px-3 rounded-lg transition flex items-center justify-center space-x-1.5 ${
              activeTab === 'URL' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Resim Bağlantısı</span>
          </button>
        </div>

        {/* Tab 1: File Upload */}
        {activeTab === 'UPLOAD' && (
          <div className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-indigo-500/80 rounded-2xl p-6 text-center cursor-pointer transition bg-slate-800/30 hover:bg-indigo-600/5 group"
            >
              <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400 group-hover:text-indigo-400 group-hover:scale-110 transition" />
              <div className="text-xs font-semibold text-slate-200">
                Bilgisayardan veya Telefondan Fotoğraf Seç
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                JPG, PNG, WebP formatları desteklenir (Maks. 4MB)
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Preset Gallery */}
        {activeTab === 'GALLERY' && (
          <div className="grid grid-cols-4 gap-3 max-h-48 overflow-y-auto p-1">
            {PRESET_AVATARS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedAvatar(preset.url)}
                className={`relative rounded-2xl overflow-hidden aspect-square border-2 transition group ${
                  selectedAvatar === preset.url
                    ? 'border-indigo-500 ring-2 ring-indigo-500/50 scale-105'
                    : 'border-slate-700 hover:border-slate-500'
                }`}
              >
                <img
                  src={preset.url}
                  alt={preset.label}
                  className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                />
                {selectedAvatar === preset.url && (
                  <div className="absolute inset-0 bg-indigo-600/40 flex items-center justify-center">
                    <Check className="w-5 h-5 text-white stroke-[3]" />
                  </div>
                )}
                <div className="absolute bottom-0 inset-x-0 bg-slate-950/80 text-[9px] py-0.5 text-center text-slate-300 truncate px-1">
                  {preset.label}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Tab 3: Custom URL */}
        {activeTab === 'URL' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Görsel Web Adresi (URL)
              </label>
              <div className="flex space-x-2">
                <input
                  type="url"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customUrl.trim()) {
                      setSelectedAvatar(customUrl.trim());
                    }
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700"
                >
                  Uygula
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
          >
            Vazgeç
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 flex items-center space-x-1.5 transition"
          >
            <Check className="w-4 h-4" />
            <span>Resmi Kaydet</span>
          </button>
        </div>
      </div>
    </div>
  );
};
