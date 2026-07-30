import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { ArrowRight, Truck, Clock, ShieldCheck, Sparkles, Star, ChevronRight, ChevronLeft, Tag } from 'lucide-react';
import type { Product, Route, Category } from '../types';
import { routeToHash } from '../router';
import ProductCard from '../components/ProductCard';
import { fetchRandomApprovedReviews, type FeaturedReview } from '../services/adminApi';
import { usePageContent } from '../hooks/usePageContent';
import EditableText from '../components/admin/EditableText';
import EditableImage from '../components/admin/EditableImage';
import { useAdminEditing } from '../contexts/AdminEditingContext';

type Props = {
  categories: Category[];
  featured: Product[];
  discounted: Product[];
  navigate: (r: Route) => void;
  onAddToCart: (p: Product) => void;
  isFavorite: (productId: string) => boolean;
  onToggleFavorite: (p: Product) => void;
};

type Campaign = {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  discount_percentage?: number;
  discount_value?: number;
  discount_type?: 'percentage' | 'fixed_amount' | 'buy_x_pay_y' | 'second_item_discount';
  buy_x?: number;
  pay_y?: number;
  min_order_amount: number;
};

const features = [
  { icon: Truck, title: 'Aynı Gün Teslimat', desc: '16:00\'dan önce verilen siparişler' },
  { icon: ShieldCheck, title: 'Tazelik Garantisi', desc: '7 gün taze kalır, değilse iade' },
  { icon: Clock, title: '7/24 Sipariş', desc: 'Her an online çiçek gönder' },
  { icon: Sparkles, title: 'Usta İşçiliği', desc: 'Profesyonel floristler tarafından' },
];

export default function HomePage({ categories, featured, discounted, navigate, onAddToCart, isFavorite, onToggleFavorite }: Props) {
  const { content } = usePageContent('home');
  const { isEditing, onTextChange, onImageChange } = useAdminEditing();
  const [testimonials, setTestimonials] = useState<FeaturedReview[]>([]);
  const [testimonialsLoading, setTestimonialsLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Varsayılan değerler
  const heroTitle = content?.hero_title || 'Sevdiklerinize Çiçek Gönderin';
  const heroSubtitle = content?.hero_subtitle || 'Türkiye\'nin her yerine aynı gün teslimat ile duygularınızı çiçeklerle iletin';
  const heroCta = content?.hero_cta || 'Hemen Sipariş Ver';
  const heroImage1 = content?.hero_image_1 || 'https://images.pexels.com/photos/931796/pexels-photo-931796.jpeg?auto=compress&cs=tinysrgb&w=600';
  const heroImage2 = content?.hero_image_2 || 'https://images.pexels.com/photos/568685/pexels-photo-568685.jpeg?auto=compress&cs=tinysrgb&w=600';
  const heroImage3 = content?.hero_image_3 || 'https://images.pexels.com/photos/6340978/pexels-photo-6340978.jpeg?auto=compress&cs=tinysrgb&w=600';

  useEffect(() => {
    let cancelled = false;

    // Yorumları Çek
    fetchRandomApprovedReviews(3)
      .then((reviews) => {
        if (!cancelled) setTestimonials(reviews);
      })
      .catch(() => {
        if (!cancelled) setTestimonials([]);
      })
      .finally(() => {
        if (!cancelled) setTestimonialsLoading(false);
      });

    // Aktif Kampanyaları Çek
    const fetchActiveCampaigns = async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (!error && data && !cancelled) {
        setCampaigns(data);
      }
    };

    fetchActiveCampaigns();

    return () => {
      cancelled = true;
    };
  }, []);

  // 🌸 Birden fazla kampanya varsa otomatik kaydırma efekti (4 saniyede bir)
  useEffect(() => {
    if (campaigns.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % campaigns.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [campaigns.length]);

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-sand-50 to-leaf-50">
        <div className="absolute top-20 right-10 w-72 h-72 bg-brand-200/30 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-10 left-10 w-64 h-64 bg-leaf-200/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />

        <div className="max-w-7xl mx-auto px-4 py-12 lg:py-16 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-slide-up">
              <span className="chip bg-brand-100 text-brand-700 mb-4">
                <Sparkles className="w-4 h-4" />
                Taze çiçekler her gün
              </span>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-sand-900 leading-tight text-balance">
                {isEditing ? (
                  <EditableText
                    value={heroTitle}
                    onSave={(newValue) => onTextChange('hero_title', newValue)}
                  />
                ) : (
                  heroTitle
                )}
              </h1>
              <p className="text-lg text-sand-600 mt-5 max-w-md leading-relaxed">
                {isEditing ? (
                  <EditableText
                    value={heroSubtitle}
                    onSave={(newValue) => onTextChange('hero_subtitle', newValue)}
                    multiline
                  />
                ) : (
                  heroSubtitle
                )}
              </p>
              <div className="flex flex-wrap gap-3 mt-8">
                <button onClick={() => navigate({ name: 'shop' })} className="btn-primary group">
                  {isEditing ? (
                    <EditableText
                      value={heroCta}
                      onSave={(newValue) => onTextChange('hero_cta', newValue)}
                    />
                  ) : (
                    heroCta
                  )}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button onClick={() => navigate({ name: 'about' })} className="btn-secondary">
                  Hikayemiz
                </button>
              </div>

              {/* ⭐ Yıldızlar ve Müşteri Sayısı */}
              <div className="flex items-center gap-6 mt-10">
                <div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-sand-500 mt-1">4.8/5 · 12.000+ değerlendirme</p>
                </div>
                <div className="w-px h-10 bg-sand-200" />
                <div>
                  <p className="text-2xl font-bold text-sand-900">50K+</p>
                  <p className="text-sm text-sand-500">Mutlu müşteri</p>
                </div>
              </div>

              {/* 🌸 🏷️ YILDIZLARIN ALTINA EKLENEN KAMPANYA BANNER SLIDER */}
{campaigns.length > 0 && (
  <div className="mt-8 relative rounded-3xl overflow-hidden bg-white border border-brand-200 shadow-lg group transition-all">
    <a
  href={`#/magaza/${campaigns[currentSlide].id}`}
  className="relative h-44 sm:h-48 w-full block cursor-pointer"
>
      <img
        src={campaigns[currentSlide].image_url}
        alt={campaigns[currentSlide].title}
        className="w-full h-full object-cover transition-all duration-700"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-sand-900/85 via-sand-900/50 to-transparent flex flex-col justify-center p-6 text-white space-y-1.5">
        
        {/* 🌸 DİNAMİK KAMPANYA TİPİ ROZETİ */}
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-500 text-white font-bold text-xs rounded-full shadow-sm mb-2 w-fit">
          <Tag className="w-3.5 h-3.5" />
          {campaigns[currentSlide].discount_type === 'fixed_amount' && `₺${campaigns[currentSlide].discount_value} İNDİRİM`}
          {campaigns[currentSlide].discount_type === 'percentage' && `%${campaigns[currentSlide].discount_value || campaigns[currentSlide].discount_percentage} İNDİRİM`}
          {campaigns[currentSlide].discount_type === 'buy_x_pay_y' && `${campaigns[currentSlide].buy_x || 2} AL ${campaigns[currentSlide].pay_y || 1} ÖDE`}
          {campaigns[currentSlide].discount_type === 'second_item_discount' && `2. ÜRÜNE %${campaigns[currentSlide].discount_value} İNDİRİM`}
          {(!campaigns[currentSlide].discount_type || campaigns[currentSlide].discount_type === 'percentage') && !campaigns[currentSlide].discount_value && `%${campaigns[currentSlide].discount_percentage} İNDİRİM`}
        </span>

        <h3 className="font-display text-2xl font-bold">{campaigns[currentSlide].title}</h3>
        <p className="text-xs sm:text-sm text-sand-200 line-clamp-2">{campaigns[currentSlide].subtitle}</p>
        <p className="text-[10px] text-brand-200 font-semibold pt-1">
          * ₺{campaigns[currentSlide].min_order_amount} üzerindeki siparişlerde geçerlidir.
        </p>
      </div>
    </a>

    {/* Birden fazla kampanya varsa Sol/Sağ Butonları & Noktalar */}
    {campaigns.length > 1 && (
      <>
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setCurrentSlide((prev) => (prev === 0 ? campaigns.length - 1 : prev - 1));
          }}
          className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/40 backdrop-blur-md text-white hover:bg-white/70 transition-colors cursor-pointer z-10"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setCurrentSlide((prev) => (prev + 1) % campaigns.length);
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/40 backdrop-blur-md text-white hover:bg-white/70 transition-colors cursor-pointer z-10"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <div className="absolute bottom-2.5 right-4 flex gap-1.5 z-10">
          {campaigns.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setCurrentSlide(idx);
              }}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                idx === currentSlide ? 'w-5 bg-white' : 'w-1.5 bg-white/50'
              }`}
            />
          ))}
        </div>
      </>
    )}
  </div>
)}

            </div>

            <div className="relative animate-scale-in">
              <div className="relative grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="rounded-3xl overflow-hidden shadow-soft aspect-[3/4]">
                    {isEditing ? (
                      <EditableImage
                        src={heroImage1}
                        alt="Buket"
                        onSave={(newSrc) => onImageChange('hero_image_1', newSrc)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={heroImage1}
                        alt="Buket"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="rounded-3xl overflow-hidden shadow-soft aspect-square">
                    {isEditing ? (
                      <EditableImage
                        src={heroImage2}
                        alt="Saksılı"
                        onSave={(newSrc) => onImageChange('hero_image_2', newSrc)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={heroImage2}
                        alt="Saksılı"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                </div>
                <div className="space-y-4 pt-8">
                  <div className="rounded-3xl overflow-hidden shadow-soft aspect-square">
                    {isEditing ? (
                      <EditableImage
                        src={heroImage3}
                        alt="Gül"
                        onSave={(newSrc) => onImageChange('hero_image_3', newSrc)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={heroImage3}
                        alt="Gül"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="rounded-3xl overflow-hidden shadow-soft aspect-[3/4]">
                    {isEditing ? (
                      <EditableImage
                        src={heroImage1}
                        alt="Özel gün"
                        onSave={(newSrc) => onImageChange('hero_image_1', newSrc)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={heroImage1}
                        alt="Özel gün"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-soft px-5 py-3 flex items-center gap-3 animate-float">
                <div className="w-10 h-10 rounded-full bg-leaf-100 flex items-center justify-center">
                  <Truck className="w-5 h-5 text-leaf-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-sand-900">Aynı gün</p>
                  <p className="text-xs text-sand-500">teslimat</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f) => (
            <div key={f.title} className="card p-5 flex flex-col items-center text-center hover:shadow-soft transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center mb-3">
                <f.icon className="w-6 h-6 text-brand-600" />
              </div>
              <h3 className="font-semibold text-sand-800 text-sm">{f.title}</h3>
              <p className="text-xs text-sand-500 mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-sand-900">Kategoriler</h2>
            <p className="text-sand-500 mt-2">Her duruma uygun çiçekler</p>
          </div>
          <button onClick={() => navigate({ name: 'shop' })} className="btn-ghost text-brand-600 hidden sm:flex">
            Tümünü Gör
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <a
              key={cat.id}
              href={routeToHash({ name: 'shop', categorySlug: cat.slug })}
              className="group relative rounded-2xl overflow-hidden aspect-square shadow-card hover:shadow-soft transition-all hover:-translate-y-1"
            >
              <img
                src={cat.image}
                alt={cat.name}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-sand-900/80 via-sand-900/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <h3 className="text-white font-semibold text-sm lg:text-base">{cat.name}</h3>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-sand-900">Öne Çıkanlar</h2>
            <p className="text-sand-500 mt-2">En çok sevilen çiçekler</p>
          </div>
          <button onClick={() => navigate({ name: 'shop' })} className="btn-ghost text-brand-600 hidden sm:flex">
            Tümünü Gör
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
          {featured.slice(0, 4).map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onAddToCart={onAddToCart}
              isFavorite={isFavorite(p.id)}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      </section>

      {/* Discounted Products */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-sand-900">İndirimdekiler</h2>
            <p className="text-sand-500 mt-2">Kaçırılmayacak fırsatlar</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
          {discounted.slice(0, 4).map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onAddToCart={onAddToCart}
              isFavorite={isFavorite(p.id)}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      </section>

      {/* Testimonials */}
      {(testimonialsLoading || testimonials.length > 0) && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-sand-900">Müşterilerimiz Ne Diyor?</h2>
            <p className="text-sand-500 mt-2">Gerçek müşteri yorumları</p>
          </div>

          {testimonialsLoading ? (
            <div className="grid md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card p-6 animate-pulse">
                  <div className="h-4 bg-sand-100 rounded w-24 mb-3" />
                  <div className="space-y-2">
                    <div className="h-3 bg-sand-100 rounded" />
                    <div className="h-3 bg-sand-100 rounded w-5/6" />
                    <div className="h-3 bg-sand-100 rounded w-4/6" />
                  </div>
                  <div className="flex items-center gap-3 mt-4 pt-4 border-t border-sand-100">
                    <div className="w-10 h-10 rounded-full bg-sand-100" />
                    <div className="space-y-2 flex-1">
                      <div className="h-3 bg-sand-100 rounded w-24" />
                      <div className="h-2 bg-sand-100 rounded w-16" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((review) => (
                <div key={review.id} className="card p-6">
                  <div className="flex items-center gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${
                          s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-sand-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sand-700 leading-relaxed">"{review.comment}"</p>
                  <div className="flex items-center gap-3 mt-4 pt-4 border-t border-sand-100">
                    <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold">
                      {review.user_name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="font-semibold text-sand-800 text-sm">{review.user_name}</p>
                      <p className="text-xs text-sand-500">
                        {review.product_name || 'Ürün değerlendirmesi'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}