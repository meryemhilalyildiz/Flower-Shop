import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight, Tag } from 'lucide-react';
import type { Banner, Bundle } from '../types';
import { supabase } from '../supabaseClient';

type Props = {
  navigate: (route: any) => void;
  bundles?: Bundle[];
};

export default function BannerRotator({ navigate, bundles = [] }: Props) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBanners() {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Bannerlar yüklenirken hata:', error);
      } else {
        // Filter banners by date validity
        const now = new Date();
        const validBanners = data?.filter((banner: Banner) => {
          const startDate = new Date(banner.start_date);
          const endDate = banner.end_date ? new Date(banner.end_date) : null;
          return startDate <= now && (!endDate || endDate >= now);
        }) || [];
        setBanners(validBanners);
      }
      setLoading(false);
    }

    fetchBanners();
  }, []);

  // Auto-rotate every 5 seconds
  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  if (loading) {
    return (
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="relative rounded-3xl overflow-hidden bg-sand-100 h-64 animate-pulse" />
      </section>
    );
  }

  if (banners.length === 0) {
    return null;
  }

  const banner = banners[currentIndex];
  const linkedBundle = banner.bundle_id ? bundles.find(b => b.id === banner.bundle_id) : null;

  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      <div
        className="relative rounded-3xl overflow-hidden transition-all duration-500"
        style={{
          backgroundColor: banner.background_color,
          color: banner.text_color,
        }}
      >
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <img
            src={banner.image_url}
            alt={banner.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30" />
        </div>

        {/* Bundle Badge */}
        {linkedBundle && (
          <div className="absolute top-4 right-4 bg-rose-500 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg">
            <Tag className="w-4 h-4" />
            <span>%{Math.round(linkedBundle.discount_percentage || 0)} İndirim</span>
          </div>
        )}

        {/* Content */}
        <div className="relative px-8 py-12 lg:px-16 lg:py-20 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="text-white max-w-lg">
            <span className="chip bg-white/20 text-white mb-4">Kampanya</span>
            <h2 className="font-display text-3xl lg:text-4xl font-bold leading-tight">
              {banner.title}
            </h2>
            {banner.subtitle && (
              <p className="text-white/80 mt-3 text-lg">{banner.subtitle}</p>
            )}
            {linkedBundle && (
              <div className="mt-4 bg-white/20 backdrop-blur-sm rounded-lg p-4">
                <p className="font-semibold text-white">{linkedBundle.name}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-2xl font-bold text-white">{linkedBundle.bundle_price} TL</span>
                  {linkedBundle.original_price > linkedBundle.bundle_price && (
                    <span className="text-white/70 line-through">{linkedBundle.original_price} TL</span>
                  )}
                </div>
              </div>
            )}
            {banner.link_url && (
              <button
                onClick={() => {
                  if (banner.link_url?.startsWith('/')) {
                    // Handle internal routing
                    const path = banner.link_url;
                    if (path === '/shop') {
                      navigate({ name: 'shop' });
                    } else if (path.startsWith('/shop?')) {
                      const params = new URLSearchParams(path.split('?')[1]);
                      navigate({ name: 'shop', categorySlug: params.get('category') || undefined });
                    }
                  } else if (banner.link_url) {
                    window.open(banner.link_url, '_blank');
                  }
                }}
                className="btn bg-white text-sand-900 px-6 py-3 mt-6 hover:bg-sand-50 hover:scale-105 active:scale-95 transition-all"
              >
                {banner.link_text || 'Şimdi Keşfet'}
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation Arrows */}
        {banners.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Dots */}
        {banners.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  index === currentIndex ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
