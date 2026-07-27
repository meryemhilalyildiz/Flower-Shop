import { useEffect, useState } from 'react';
import { ArrowRight, Truck, Clock, ShieldCheck, Sparkles, Star } from 'lucide-react';
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

const features = [
  { icon: Truck, title: 'Aynı Gün Teslimat', desc: '16:00\'dan önce verilen siparişler' },
  { icon: ShieldCheck, title: 'Tazelik Garantisi', desc: '7 gün taze kalır, değilse iade' },
  { icon: Clock, title: '7/24 Sipariş', desc: 'Her an online çiçek gönder' },
  { icon: Sparkles, title: 'Usta İşçiliği', desc: 'Profesyonel floristler tarafından' },
];

export default function HomePage({ categories, featured, discounted, navigate, onAddToCart, isFavorite, onToggleFavorite }: Props) {
  const { content, loading } = usePageContent('home');
  const { isEditing, onTextChange, onImageChange } = useAdminEditing();
  const [testimonials, setTestimonials] = useState<FeaturedReview[]>([]);
  const [testimonialsLoading, setTestimonialsLoading] = useState(true);

  // Varsayılan değerler
  const heroTitle = content?.hero_title || 'Sevdiklerinize Çiçek Gönderin';
  const heroSubtitle = content?.hero_subtitle || 'Türkiye\'nin her yerine aynı gün teslimat ile duygularınızı çiçeklerle iletin';
  const heroCta = content?.hero_cta || 'Hemen Sipariş Ver';
  const heroImage1 = content?.hero_image_1 || 'https://images.pexels.com/photos/931796/pexels-photo-931796.jpeg?auto=compress&cs=tinysrgb&w=600';
  const heroImage2 = content?.hero_image_2 || 'https://images.pexels.com/photos/568685/pexels-photo-568685.jpeg?auto=compress&cs=tinysrgb&w=600';
  const heroImage3 = content?.hero_image_3 || 'https://images.pexels.com/photos/6340978/pexels-photo-6340978.jpeg?auto=compress&cs=tinysrgb&w=600';

  useEffect(() => {
    let cancelled = false;

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

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-sand-50 to-leaf-50">
        <div className="absolute top-20 right-10 w-72 h-72 bg-brand-200/30 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-10 left-10 w-64 h-64 bg-leaf-200/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />

        <div className="max-w-7xl mx-auto px-4 py-16 lg:py-24 relative">
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
            <p className="text-sand-500 mt-2">Her durasa uygun çiçekler</p>
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

      {/* Campaign Banner */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-brand-600 to-brand-800">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative px-8 py-12 lg:px-16 lg:py-20 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="text-white max-w-lg">
              <span className="chip bg-white/20 text-white mb-4">Kampanya</span>
              <h2 className="font-display text-3xl lg:text-4xl font-bold leading-tight">
                İlk siparişe özel %20 indirim
              </h2>
              <p className="text-white/80 mt-3 text-lg">
                Sepetinizde 400 TL ve üzeri çiçeklerde, ilk siparişinizde geçerli.
              </p>
              <button onClick={() => navigate({ name: 'shop' })} className="btn bg-white text-brand-700 px-6 py-3 mt-6 hover:bg-sand-50 hover:scale-105 active:scale-95 transition-all">
                Hemen Keşfet
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
            <div className="relative w-48 h-48 lg:w-64 lg:h-64 flex-shrink-0">
              <div className="absolute inset-0 bg-white/10 rounded-full blur-2xl" />
              <img
                src="https://images.pexels.com/photos/165826/pexels-photo-165826.jpeg?auto=compress&cs=tinysrgb&w=600"
                alt="Kampanya"
                className="relative w-full h-full object-cover rounded-3xl shadow-2xl"
              />
            </div>
          </div>
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
