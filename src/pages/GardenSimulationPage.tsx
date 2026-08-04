import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Sparkles, ArrowLeft, Gift, Sprout } from 'lucide-react';
import type { Route } from '../types';
import React from 'react';

type Props = {
  navigate: (r: Route) => void;
};

const seeds = [
  { id: 'rose', name: 'Kırmızı Gül', desc: 'Tutkunun simgesi.' },
  { id: 'tulip', name: 'Mor Lale', desc: 'Zarafetin simgesi.' },
  { id: 'daisy', name: 'Papatya', desc: 'Saf sevgi.' },
  { id: 'sunflower', name: 'Günebakan', desc: 'Pozitif enerji.' },
];

export default function GardenSimulationPage({ navigate }: Props) {
  const [orderCount, setOrderCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedSeed, setSelectedSeed] = useState(seeds[1]); // Mor Lale

  useEffect(() => {
    async function fetchOrders() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { count, error } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

          if (!error && count !== null) {
            setOrderCount(count);
          }
        }
      } catch (err) {
        console.error('Siparişler çekilemedi:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  const currentStep = orderCount % 6;
  const remainingOrders = 6 - (currentStep === 0 && orderCount > 0 ? 6 : currentStep);
  const hasEarnedReward = currentStep === 5;

  // 🌸 YANDAN / KARŞIDAN GÖRÜNÜM İÇİN GERÇEKÇİ BOTANİK ÇİÇEK MOTORU 🌸
  const renderSideProfileFlower = (id: string, size = 110) => {
    switch (id) {
      case 'rose': // Yandan Açan Gül
        return (
          <svg width={size} height={size} viewBox="0 0 100 100" className="drop-shadow-2xl">
            <path d="M30,70 Q50,90 70,70 Q85,45 65,30 Q50,40 35,30 Q15,45 30,70 Z" fill="#e11d48" />
            <path d="M38,60 Q50,75 62,60 Q70,40 50,30 Q30,40 38,60 Z" fill="#f43f5e" />
            <path d="M45,45 Q50,55 55,45 Q60,35 50,25 Q40,35 45,45 Z" fill="#9f1239" />
            {/* Çanağın Alt Kısmı (Sapa Bağlanan Yeşil Kısım) */}
            <path d="M42,70 L50,82 L58,70 Z" fill="#15803d" />
          </svg>
        );
      case 'tulip': // Yandan Zarif Lale
        return (
          <svg width={size} height={size} viewBox="0 0 100 100" className="drop-shadow-xl">
            <path d="M30,75 C15,45 30,20 50,15 C70,20 85,45 70,75 C60,88 40,88 30,75 Z" fill="#c084fc" />
            <path d="M40,70 C28,45 38,28 50,25 C62,28 72,45 60,70 C54,80 46,80 40,70 Z" fill="#a855f7" />
            <path d="M47,65 C42,50 46,38 50,35 C54,38 58,50 53,65 Z" fill="#7e22ce" />
            {/* Alt Sap Yuvası */}
            <path d="M45,75 L50,85 L55,75 Z" fill="#15803d" />
          </svg>
        );
      case 'daisy': // Yandan Eğik Papatya
        return (
          <svg width={size} height={size} viewBox="0 0 100 100" className="drop-shadow-xl">
            <ellipse cx="50" cy="50" rx="36" ry="14" fill="#ffffff" transform="rotate(-15 50 50)" />
            <ellipse cx="50" cy="50" rx="36" ry="14" fill="#f8fafc" transform="rotate(35 50 50)" />
            <ellipse cx="50" cy="50" rx="32" ry="12" fill="#ffffff" transform="rotate(-65 50 50)" />
            <ellipse cx="50" cy="50" rx="16" ry="10" fill="#f59e0b" transform="rotate(-15 50 50)" />
            {/* Alt Çanak */}
            <path d="M44,56 L50,65 L56,56 Z" fill="#15803d" />
          </svg>
        );
      case 'sunflower': // Güneşe Bakan / Yandan Ayçiçeği
        return (
          <svg width={size} height={size} viewBox="0 0 100 100" className="drop-shadow-xl">
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => (
              <ellipse key={i} cx="50" cy="22" rx="6" ry="24" fill="#facc15" transform={`rotate(${angle} 50 50)`} />
            ))}
            <ellipse cx="50" cy="50" rx="18" ry="14" fill="#78350f" />
            <ellipse cx="50" cy="50" rx="12" ry="9" fill="#451a03" />
            {/* Alt Çanak */}
            <path d="M43,62 L50,72 L57,62 Z" fill="#15803d" />
          </svg>
        );
      default:
        return null;
    }
  };

  // Neşeli ve dolu arka plan tarlası (Karşıdan Profil Görünümü)
  const backgroundGarden = [
    { type: 'tulip', left: '10%', bottom: '12%', scale: 0.75 },
    { type: 'daisy', left: '22%', bottom: '18%', scale: 0.8 },
    { type: 'rose', left: '32%', bottom: '14%', scale: 0.7 },
    { type: 'sunflower', left: '42%', bottom: '20%', scale: 0.85 },
    { type: 'daisy', left: '58%', bottom: '16%', scale: 0.8 },
    { type: 'tulip', left: '68%', bottom: '13%', scale: 0.75 },
    { type: 'sunflower', left: '78%', bottom: '19%', scale: 0.85 },
    { type: 'rose', left: '88%', bottom: '15%', scale: 0.7 },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F5] py-10 px-4 relative overflow-hidden text-stone-900 font-serif">
       <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#E8F7E5] rounded-full blur-[100px] opacity-50 pointer-events-none"></div>
       <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#FFF4E5] rounded-full blur-[100px] opacity-60 pointer-events-none"></div>

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        
        {/* Üst Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate({ name: 'home' })}
            className="flex items-center gap-2.5 px-6 py-3 bg-white hover:bg-stone-50 backdrop-blur-md rounded-full text-xs font-semibold text-stone-800 shadow-sm transition-all cursor-pointer border border-stone-100 hover:scale-[1.02]"
          >
            <ArrowLeft className="w-4 h-4" /> Ana Sayfaya Dön
          </button>
          <span className="text-sm font-bold bg-gradient-to-r from-[#EC4899] to-[#F59E0B] text-white px-5 py-2.5 rounded-full uppercase tracking-widest shadow-md flex items-center gap-2.5">
            <Sparkles className="w-5 h-5" /> Hayat Dolu Çiçek Bahçem
          </span>
        </div>

        {/* Ana Bahçe Sahnesi */}
        <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-stone-100 bg-gradient-to-b from-[#FAF8F5] to-[#E5EFE2] p-8 text-center backdrop-blur-2xl">
          
          {/* Üst Bilgi Paneli */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-stone-700 font-medium mb-6 px-6 bg-white/60 py-4 rounded-3xl border border-white/80 shadow-inner">
            <div className="flex items-center gap-3">
              <span className="text-[#EC4899] font-bold">Toplam Sipariş (DB):</span> 
              <span className="text-white text-base bg-[#EC4899] px-4 py-1 rounded-full shadow">
                {loading ? 'Yükleniyor...' : orderCount}
              </span>
            </div>
            <div className="text-center flex-grow">
              {hasEarnedReward ? (
                <span className="text-[#F59E0B] font-extrabold flex items-center justify-center gap-2 animate-bounce">
                  🎉 5. Aşama Tamamlandı! Çiçek Kupona Dönüştü! 🎁
                </span>
              ) : (
                <span>Sonraki aşamaya ve kupona son <strong className="text-[#EC4899] font-bold">{remainingOrders}</strong> sipariş kaldı!</span>
              )}
            </div>
            <span className="bg-[#577F56]/10 text-[#577F56] border border-[#577F56]/20 px-5 py-2 rounded-full font-sans text-xs uppercase tracking-wider">
              Büyüme Aşama: {currentStep}/5
            </span>
          </div>

          {/* Karşıdan Bakış Alanı (Butonsuz, Net Vitrin Görünümü) */}
          <div className="relative w-full h-[500px] rounded-3xl overflow-hidden shadow-inner border border-[#A5BFA3]/30 bg-gradient-to-b from-[#bbf7d0] via-[#86efac] to-[#4ade80] flex flex-col items-center justify-end pb-8">
            
            {/* Neşeli Güneş / Işık Efekti */}
            <div className="absolute top-8 right-12 w-24 h-24 bg-amber-300 rounded-full blur-2xl opacity-70 pointer-events-none"></div>
            <div className="absolute top-12 left-16 w-36 h-12 bg-white/40 rounded-full blur-md pointer-events-none"></div>

            {/* Arka Plan Neşeli Çiçek Tarlası */}
            <div className="absolute inset-0 pointer-events-none z-10">
              {backgroundGarden.map((item, index) => (
                <div
                  key={index}
                  className="absolute drop-shadow-md transition-all duration-700"
                  style={{ left: item.left, bottom: item.bottom, transform: `scale(${item.scale})` }}
                >
                  {renderSideProfileFlower(item.type, 50)}
                </div>
              ))}
            </div>

            {/* 🪴 6 AŞAMALI BÜYÜME SİSTEMİ (Sap ve Çiçek Tam Bitişik - Yandan Profil) */}
            <div className="relative flex flex-col items-center z-20 pb-4">
              <div className="transition-all duration-700 transform flex flex-col items-center">
                
                {/* AŞAMA 0: Fide */}
                {currentStep === 0 && (
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-emerald-700 rounded-full flex items-center justify-center text-white text-xs font-bold mb-2 shadow-lg">🌱</div>
                    <span className="text-xs bg-stone-900/70 text-white px-4 py-1.5 rounded-full font-sans tracking-wide shadow">
                      Aşama 0: Toprakta Minik Fide
                    </span>
                  </div>
                )}

                {/* AŞAMA 1: Yapraklar */}
                {currentStep === 1 && (
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-emerald-700 rounded-full flex items-center justify-center text-white text-xs font-bold mb-2 shadow-lg">🌿</div>
                    <span className="text-xs bg-stone-900/70 text-white px-4 py-1.5 rounded-full font-sans tracking-wide mb-2 shadow">
                      Aşama 1: Yaprakları Çoğalıyor
                    </span>
                    <div className="w-4 h-24 bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-t-full shadow-lg relative">
                      <div className="absolute -left-6 top-3 w-7 h-3.5 bg-emerald-500 rounded-full rotate-[-30deg]" />
                      <div className="absolute -right-6 top-6 w-7 h-3.5 bg-emerald-500 rounded-full rotate-[30deg]" />
                    </div>
                  </div>
                )}

                {/* AŞAMA 2: Tomurcuk */}
                {currentStep === 2 && (
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-amber-600 rounded-full flex items-center justify-center text-white text-xs font-bold mb-2 shadow-lg">🪴</div>
                    <span className="text-xs bg-stone-900/70 text-white px-4 py-1.5 rounded-full font-sans tracking-wide mb-2 shadow">
                      Aşama 2: Tomurcuklanıyor
                    </span>
                    <div className="w-4 h-28 bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-t-full shadow-lg relative">
                      <div className="absolute -left-6 top-4 w-7 h-3.5 bg-emerald-500 rounded-full rotate-[-30deg]" />
                      <div className="absolute -right-6 top-7 w-7 h-3.5 bg-emerald-500 rounded-full rotate-[30deg]" />
                    </div>
                  </div>
                )}

                {/* AŞAMA 3: Özü / Rengi Gelir (Sap ile Çiçek Arasında Boşluk Yok) */}
                {currentStep === 3 && (
                  <div className="flex flex-col items-center relative">
                    <span className="absolute -top-6 -left-7 text-xl animate-ping">✨</span>
                    <span className="absolute -top-4 -right-7 text-lg animate-pulse">⭐</span>

                    {/* Çiçek */}
                    <div className="mb-[-2px] z-20">
                      {renderSideProfileFlower(selectedSeed.id, 65)}
                    </div>
                    
                    <span className="text-xs bg-stone-900/70 text-white px-4 py-1.5 rounded-full font-sans tracking-wide mb-2 shadow z-30">
                      Aşama 3: Rengi Geldi ({selectedSeed.name}) ✨
                    </span>

                    {/* Doğrudan Çiçeğe Bağlı Sap */}
                    <div className="w-4 h-32 bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full shadow-lg relative z-10">
                      <div className="absolute -left-6 top-5 w-7 h-3.5 bg-emerald-500 rounded-full rotate-[-30deg]" />
                      <div className="absolute -right-6 top-9 w-7 h-3.5 bg-emerald-500 rounded-full rotate-[30deg]" />
                    </div>
                  </div>
                )}

                {/* AŞAMA 4: Çiçek Tam Anlamıyla Açar (Yandan/Karşıdan Gerçekçi Profil) */}
                {currentStep === 4 && (
                  <div className="flex flex-col items-center transition-all duration-700 hover:scale-[1.02]">
                    {/* Çiçek Kafası */}
                    <div className="mb-[-4px] z-20 drop-shadow-2xl">
                      {renderSideProfileFlower(selectedSeed.id, 110)}
                    </div>

                    <span className="text-xs bg-stone-900/70 text-white px-4 py-1.5 rounded-full font-sans tracking-wide mb-2 font-bold shadow z-30">
                      Aşama 4: Çiçek Tam Anlamıyla Açtı! 🌸
                    </span>

                    {/* Doğrudan Çiçeğin Altından Başlayan Sap */}
                    <div className="w-5 h-36 bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full shadow-lg relative z-10">
                      <div className="absolute -left-7 top-6 w-8 h-4 bg-emerald-500 rounded-full rotate-[-30deg]" />
                      <div className="absolute -right-7 top-10 w-8 h-4 bg-emerald-500 rounded-full rotate-[30deg]" />
                    </div>
                  </div>
                )}

                {/* AŞAMA 5: Kupona Dönüşür */}
                {currentStep === 5 && (
                  <div className="flex flex-col items-center animate-fade-in">
                    <div className="p-8 bg-white/95 border border-amber-300 rounded-3xl shadow-2xl backdrop-blur-md space-y-3 max-w-sm">
                      <Gift className="w-16 h-16 text-amber-500 mx-auto animate-bounce" />
                      <h4 className="text-base font-bold text-stone-900 font-serif">Aşama 5: Çiçek Toplandı & Kupona Dönüştü!</h4>
                      <p className="text-xs text-stone-600 font-sans">Harika! 6. siparişinle birlikte özel indirim kuponun hesabına başarıyla tanımlandı.</p>
                      <button className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs uppercase tracking-wider rounded-2xl shadow-md transition-all cursor-pointer">
                        KUPONUNU KULLAN
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>

          </div>

        </div>

        {/* Tohum Seçim Kartları */}
        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl border border-stone-200 shadow-xl space-y-6">
          <h3 className="text-sm font-bold text-stone-800 flex items-center gap-2 uppercase tracking-wide">
            <Sprout className="w-5 h-5 text-pink-500" /> 1. Bahçene Ekilecek Tohumu Seç
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {seeds.map((seed) => (
              <button
                key={seed.id}
                onClick={() => setSelectedSeed(seed)}
                className={`p-6 rounded-3xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between group h-52 ${
                  selectedSeed.id === seed.id
                    ? 'border-pink-500 bg-pink-500/10 shadow-lg scale-[1.03]'
                    : 'border-stone-200 hover:border-stone-300 bg-white'
                }`}
              >
                <div className="flex justify-center mb-2 transform group-hover:scale-110 transition-transform h-20 items-center">
                  {renderSideProfileFlower(seed.id, 65)}
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-900">{seed.name}</p>
                  <p className="text-[10px] text-stone-500 mt-1">{seed.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Alışverişe Git CTA */}
        <div className="text-center pt-2">
          <button
            onClick={() => navigate({ name: 'shop' })}
            className="px-12 py-5 bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:from-pink-600 hover:to-amber-600 text-white text-sm font-bold rounded-2xl shadow-2xl transition-all inline-flex items-center gap-3 cursor-pointer hover:scale-105"
          >
            <Sparkles className="w-5 h-5 animate-pulse" /> Yeni Sipariş Vererek Bahçeni Büyüt <ArrowLeft className="w-4 h-4 rotate-180" />
          </button>
        </div>

      </div>
    </div>
  );
}