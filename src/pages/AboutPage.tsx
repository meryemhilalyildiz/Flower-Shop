import { Flower2, Heart, Award, Users, Leaf, Sparkles } from 'lucide-react';
import type { Route } from '../types';
import Breadcrumbs from '../components/Breadcrumbs';
import { usePageContent } from '../hooks/usePageContent';
import EditableText from '../components/admin/EditableText';
import EditableImage from '../components/admin/EditableImage';
import { useAdminEditing } from '../contexts/AdminEditingContext';

type Props = {
  navigate: (r: Route) => void;
};

export default function AboutPage({ navigate }: Props) {
  const { content, loading } = usePageContent('about');
  const { isEditing, onTextChange, onImageChange } = useAdminEditing();

  const crumbs = [
    { label: 'Anasayfa', route: { name: 'home' } as Route },
    { label: 'Hakkımızda' },
  ];

  // Varsayılan değerler (veritabanından içerik yüklenemezse)
  const defaultStats = [
    { icon: Users, value: '50K+', label: 'Mutlu Müşteri' },
    { icon: Flower2, value: '100K+', label: 'Çiçek Teslim Edildi' },
    { icon: Award, value: '25+', label: 'Yıllık Tecrübe' },
    { icon: Heart, value: '4.8/5', label: 'Müşteri Puanı' },
  ];

  const defaultValues = [
    { icon: Leaf, title: 'Tazelik', desc: 'Her çiçek taze kesilir ve aynı gün teslim edilir. 7 gün tazelik garantisi.' },
    { icon: Sparkles, title: 'Usta İşçiliği', desc: 'Profesyonel floristlerimiz her buketi özenle tasarlar.' },
    { icon: Heart, title: 'Samimiyet', desc: 'Her sipariş bir sevgi mesajı taşır. Kalbinizi iletmenize aracı oluruz.' },
    { icon: Award, title: 'Güven', desc: '25 yılı aşkın tecrübemizle, her zaman en iyi hizmeti sunarız.' },
  ];

  const stats = content?.stats || defaultStats;
  const values = content?.values || defaultValues;
  const heroTitle = content?.hero_title || 'Çiçek sevgiyi anlatmanın en güzel yoludur';
  const heroDescription = content?.hero_description || 'Çiçekçi, 1998 yılında İstanbul\'da küçük bir çiçekçi dükkanı olarak başladı. Bugün, Türkiye\'nin dört bir yanına taze çiçek ulaştıran, yüz binlerce gülümsemeye vesile olmuş bir marka. Amacımız, her çiçeğin taşıdığı duyguyu en güzel şekilde iletmenize aracılık etmek.';
  const story = content?.story || '1998\'de, İstanbul Beyoğlu\'nda küçük bir dükkan açtığımızda hayalimiz tek bir şeydi: insanların sevdiklerine en güzel duyguları çiçeklerle iletmesine yardımcı olmak. Yıllar geçtikçe büyüdük, ama hep aynı tutkuyla çalıştık. Her buket bir hikaye, her çiçek bir mesaj taşıyor. Bugün Türkiye\'nin 81 iline çiçek ulaştırıyoruz. 25 yılı aşkın tecrübemiz, binlerce mutlu müşterimiz ve taze çiçeklerimizle, kalbinizi iletmenize aracı olmaya devam ediyoruz.';
  const heroImage = content?.hero_image || 'https://images.pexels.com/photos/568685/pexels-photo-568685.jpeg?auto=compress&cs=tinysrgb&w=800';
  const storyImage = content?.story_image || 'https://images.pexels.com/photos/6340978/pexels-photo-6340978.jpeg?auto=compress&cs=tinysrgb&w=800';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
        <p className="ml-4 text-gray-600">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-sand-50 to-leaf-50">
        <div className="max-w-7xl mx-auto px-4 py-16 lg:py-24">
          <Breadcrumbs items={crumbs} />
          <div className="grid lg:grid-cols-2 gap-12 items-center mt-8">
            <div>
              <span className="chip bg-brand-100 text-brand-700 mb-4">
                <Heart className="w-4 h-4" />
                1998'den beri
              </span>
              <h1 className="font-display text-4xl lg:text-5xl font-bold text-sand-900 leading-tight text-balance">
                {isEditing ? (
                  <EditableText
                    value={heroTitle}
                    onSave={(newValue) => onTextChange('hero_title', newValue)}
                  />
                ) : (
                  heroTitle
                )}
              </h1>
              <p className="text-lg text-sand-600 mt-5 leading-relaxed">
                {isEditing ? (
                  <EditableText
                    value={heroDescription}
                    onSave={(newValue) => onTextChange('hero_description', newValue)}
                    multiline
                  />
                ) : (
                  heroDescription
                )}
              </p>
              <button onClick={() => navigate({ name: 'shop' })} className="btn-primary mt-8">
                Çiçekleri Keşfet
              </button>
            </div>
            <div className="relative">
              <div className="rounded-3xl overflow-hidden shadow-soft aspect-[4/3]">
                {isEditing ? (
                  <EditableImage
                    src={heroImage}
                    alt="Çiçekçi dükkanımız"
                    onSave={(newSrc) => onImageChange('hero_image', newSrc)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={heroImage}
                    alt="Çiçekçi dükkanımız"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s: any, index: number) => (
            <div key={s.label} className="card p-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-3">
                <s.icon className="w-6 h-6 text-brand-600" />
              </div>
              <p className="text-2xl lg:text-3xl font-bold text-sand-900">
                {isEditing ? (
                  <EditableText
                    value={s.value}
                    onSave={(newValue) => onTextChange(`stats.${index}.value`, newValue)}
                  />
                ) : (
                  s.value
                )}
              </p>
              <p className="text-sm text-sand-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl lg:text-4xl font-bold text-sand-900">Değerlerimiz</h2>
          <p className="text-sand-500 mt-2">Bizi biz yapan ilkeler</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((v: any, index: number) => (
            <div key={v.title} className="card p-6 hover:shadow-soft transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-100 to-leaf-100 flex items-center justify-center mb-4">
                <v.icon className="w-6 h-6 text-brand-600" />
              </div>
              <h3 className="font-display text-lg font-bold text-sand-900 mb-2">
                {isEditing ? (
                  <EditableText
                    value={v.title}
                    onSave={(newValue) => onTextChange(`values.${index}.title`, newValue)}
                  />
                ) : (
                  v.title
                )}
              </h3>
              <p className="text-sm text-sand-600 leading-relaxed">
                {isEditing ? (
                  <EditableText
                    value={v.desc}
                    onSave={(newValue) => onTextChange(`values.${index}.desc`, newValue)}
                    multiline
                  />
                ) : (
                  v.desc
                )}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Story */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="rounded-3xl overflow-hidden shadow-soft aspect-square">
            {isEditing ? (
              <EditableImage
                src={storyImage}
                alt="Hikayemiz"
                onSave={(newSrc) => onImageChange('story_image', newSrc)}
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={storyImage}
                alt="Hikayemiz"
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div>
            <h2 className="font-display text-3xl font-bold text-sand-900 mb-4">Hikayemiz</h2>
            <div className="space-y-4 text-sand-600 leading-relaxed">
              {isEditing ? (
                <EditableText
                  value={story}
                  onSave={(newValue) => onTextChange('story', newValue)}
                  multiline
                  className="block w-full"
                />
              ) : (
                <p>{story}</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="rounded-3xl bg-gradient-to-r from-brand-600 to-brand-800 p-8 lg:p-12 text-center">
          <h2 className="font-display text-2xl lg:text-3xl font-bold text-white">Sevdiklerinize çiçek gönderin</h2>
          <p className="text-white/80 mt-3">Aynı gün teslimat ile kalbinizi iletmenin tam zamanı.</p>
          <button onClick={() => navigate({ name: 'shop' })} className="btn bg-white text-brand-700 px-6 py-3 mt-6 hover:bg-sand-50 hover:scale-105 active:scale-95 transition-all">
            Hemen Sipariş Ver
          </button>
        </div>
      </section>
    </div>
  );
}
