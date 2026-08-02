import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, FileText, ShoppingBag, ChevronLeft } from 'lucide-react';
import type { Route } from '../types';

type Props = {
  navigate: (r: Route) => void;
};

export default function LegalPages({ navigate }: Props) {
  const [activeTab, setActiveTab] = useState<'kvkk' | 'gizlilik' | 'sozlesme' | 'mesafeli'>('kvkk');

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.includes('tab=gizlilik')) {
        setActiveTab('gizlilik');
      } else if (hash.includes('tab=sozlesme')) {
        setActiveTab('sozlesme');
      } else if (hash.includes('tab=mesafeli')) {
        setActiveTab('mesafeli');
      } else {
        setActiveTab('kvkk');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 animate-fade-in">
      <button 
        onClick={() => navigate({ name: 'home' })} 
        className="flex items-center gap-1 text-sm text-sand-500 hover:text-brand-600 mb-6 cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4" /> Anasayfaya Dön
      </button>

      <h1 className="font-display text-3xl font-bold text-sand-900 mb-2">Yasal Metinler & Politikalar</h1>
      <p className="text-sm text-sand-500 mb-8">Flower Shop platformumuzdaki haklarınız, gizliliğiniz ve satış koşulları hakkında bilgilendirme.</p>

      {/* Sekmeler */}
      <div className="flex border-b border-sand-200 mb-8 overflow-x-auto">
        <button
          onClick={() => { setActiveTab('kvkk'); window.location.hash = '#/legal?tab=kvkk'; }}
          className={`flex items-center gap-2 py-3 px-5 text-sm font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'kvkk' ? 'border-brand-600 text-brand-700' : 'border-transparent text-sand-500 hover:text-sand-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" /> KVKK Metni
        </button>
        <button
          onClick={() => { setActiveTab('gizlilik'); window.location.hash = '#/legal?tab=gizlilik'; }}
          className={`flex items-center gap-2 py-3 px-5 text-sm font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'gizlilik' ? 'border-brand-600 text-brand-700' : 'border-transparent text-sand-500 hover:text-sand-800'
          }`}
        >
          <Lock className="w-4 h-4" /> Gizlilik Politikası
        </button>
        <button
          onClick={() => { setActiveTab('sozlesme'); window.location.hash = '#/legal?tab=sozlesme'; }}
          className={`flex items-center gap-2 py-3 px-5 text-sm font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'sozlesme' ? 'border-brand-600 text-brand-700' : 'border-transparent text-sand-500 hover:text-sand-800'
          }`}
        >
          <FileText className="w-4 h-4" /> Üyelik Sözleşmesi
        </button>
        <button
          onClick={() => { setActiveTab('mesafeli'); window.location.hash = '#/legal?tab=mesafeli'; }}
          className={`flex items-center gap-2 py-3 px-5 text-sm font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'mesafeli' ? 'border-brand-600 text-brand-700' : 'border-transparent text-sand-500 hover:text-sand-800'
          }`}
        >
          <ShoppingBag className="w-4 h-4" /> Mesafeli Satış Sözleşmesi
        </button>
      </div>

      {/* İçerik Alanı */}
      <div className="card p-8 bg-white space-y-6 text-sm text-sand-700 leading-relaxed shadow-sm">
        {activeTab === 'kvkk' && (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-bold text-sand-900">Kişisel Verilerin Korunması Kanunu (KVKK) Aydınlatma Metni</h2>
            <p>
              <strong>Flower Shop</strong> olarak kişisel verilerinizin güvenliğine ve gizliliğine büyük önem veriyoruz. 6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) uyarınca, veri sorumlusu sıfatıyla, siz değerli müşterilerimizin kişisel verilerini aşağıda açıklanan kapsamda işlemekteyiz.
            </p>
            <h3 className="font-bold text-sand-900 pt-2">1. Toplanan Kişisel Verileriniz ve Toplama Yöntemleri</h3>
            <p>
              Platformumuza üye olurken, sipariş verirken veya bültenlerimize kayıt olurken; ad-soyad, e-posta adresi, telefon numarası, teslimat adresleri ve ödeme/fatura bilgileri gibi kişisel verileriniz elektronik ortamda toplanmaktadır.
            </p>
            <h3 className="font-bold text-sand-900 pt-2">2. Kişisel Verilerin İşlenme Amaçları</h3>
            <p>
              Toplanan kişisel verileriniz; siparişlerinizin alınması, taze çiçeklerinizin kurye aracılığıyla zamanında ve güvenle teslim edilmesi, faturalandırma işlemlerinin yapılması ve yasal yükümlülüklerin yerine getirilmesi amaçlarıyla işlenmektedir.
            </p>
            <h3 className="font-bold text-sand-900 pt-2">3. Haklarınız</h3>
            <p>
              KVKK'nın 11. maddesi gereğince; verilerinizin işlenip işlenmediğini öğrenme, işlenmişse buna ilişkin bilgi talep etme, silinmesini veya yok edilmesini isteme haklarına sahipsiniz.
            </p>
          </div>
        )}

        {activeTab === 'gizlilik' && (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-bold text-sand-900">Gizlilik Politikası</h2>
            <p>
              Flower Shop, kullanıcılarının gizliliğini korumayı taahhüt eder. İşbu Gizlilik Politikası, web sitemizi ziyaret ettiğinizde ve alışveriş yaptığınızda verilerinizin nasıl toplandığını ve korunduğunu açıklar.
            </p>
            <h3 className="font-bold text-sand-900 pt-2">Veri Güvenliği</h3>
            <p>
              Sistemimizdeki tüm hassas veri akışları SSL sertifikaları ile şifrelenmektedir. Kredi kartı bilgileriniz hiçbir şekilde sunucularımızda saklanmamakta, doğrudan güvenli ödeme altyapısı üzerinden işlenmektedir.
            </p>
            <h3 className="font-bold text-sand-900 pt-2">Üçüncü Taraf Paylaşımı</h3>
            <p>
              Kişisel verileriniz, yasal zorunluluklar haricinde ve sipariş teslimatının gerçekleştirilmesi (kargo/kurye firmaları) ve ödeme onayı dışındaki üçüncü şahıslarla asla paylaşılmaz.
            </p>
          </div>
        )}

        {activeTab === 'sozlesme' && (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-bold text-sand-900">Üyelik ve Kullanıcı Sözleşmesi</h2>
            <p>
              İşbu Üyelik Sözleşmesi, Flower Shop internet sitesini kullanan ve üye olan tüm kullanıcılar arasında akdedilmiştir.
            </p>
            <h3 className="font-bold text-sand-900 pt-2">1. Taraflar ve Konu</h3>
            <p>
              Bu sözleşmenin konusu, kullanıcının platformdan faydalanma şartlarının, hak ve yükümlülüklerinin belirlenmesidir. Üye, siteye kayıt olarak bu şartları peşinen kabul etmiş sayılır.
            </p>
            <h3 className="font-bold text-sand-900 pt-2">2. Çiçek Siparişleri ve Cayma Hakkı</h3>
            <p>
              Mesafeli Sözleşmeler Yönetmeliği uyarınca, çabuk bozulabilen veya son kullanma tarihi geçme tehlikesi olan malların (taze kesme çiçekler, aranjmanlar ve canlı bitkiler) teslimine ilişkin sözleşmelerde cayma hakkı bulunmamaktadır. Sipariş oluşturulduktan sonraki iptal ve değişim koşulları mağaza politikalarına tabidir.
            </p>
          </div>
        )}

        {activeTab === 'mesafeli' && (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-bold text-sand-900">Mesafeli Satış Sözleşmesi</h2>
            <p>
              İşbu sözleşme 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği'ne uygun olarak düzenlenmiştir.
            </p>
            <h3 className="font-bold text-sand-900 pt-2">1. Taraflar</h3>
            <p><strong>Satıcı:</strong> Flower Shop E-Ticaret Platformu<br /><strong>Alıcı:</strong> Platform üzerinden sipariş veren müşteri.</p>
            
            <h3 className="font-bold text-sand-900 pt-2">2. Konu ve Teslimat</h3>
            <p>
              İşbu sözleşmenin konusu, Alıcı'nın Satıcı'ya ait internet sitesinden elektronik ortamda siparişini yaptığı, nitelikleri ve satış fiyatı belirtilen ürünlerin satışı ve teslimi ile ilgili tarafların hak ve yükümlülüklerinin belirlenmesidir. Teslimat, alıcının belirttiği adrese kurye aracılığıyla gerçekleştirilir.
            </p>

            <h3 className="font-bold text-sand-900 pt-2">3. Cayma Hakkının İstisnaları</h3>
            <p>
              Tüketicinin Korunması Hakkında Kanun ve ilgili yönetmelik gereğince; çabuk bozulabilen veya son kullanma tarihi geçme tehlikesi olan malların (taze kesme çiçekler, özel aranjmanlar ve canlı bitkiler) teslimine ilişkin sözleşmelerde <strong>cayma hakkı bulunmamaktadır</strong>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}