import { useState, useEffect, useCallback } from 'react';
import { Star, Upload, X, Send, RefreshCw, User, Package } from 'lucide-react';
import { supabase } from '../supabaseClient';
import {
  fetchProductReviews,
  fetchProductReviewStats,
  addReview,
  uploadReviewPhoto,
  checkUserCanReview,
} from '../services/adminApi';
import type { Review, ReviewStats, Product } from '../types';

type Props = {
  product: Product;
};

export default function ReviewSection({ product }: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [userName, setUserName] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [canReview, setCanReview] = useState(false);
  const [reviewCheckLoading, setReviewCheckLoading] = useState(false);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      const [reviewsData, statsData] = await Promise.all([
        fetchProductReviews(product.id),
        fetchProductReviewStats(product.id),
      ]);
      setReviews(reviewsData);
      setStats(statsData);
    } catch (error) {
      console.error('Yorumlar yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  }, [product.id]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
        setUserName(user.user_metadata?.full_name || user.user_metadata?.name || '');
        setReviewCheckLoading(true);
        try {
          const canReviewResult = await checkUserCanReview(product.id, user.id);
          setCanReview(canReviewResult);
        } catch (err) {
          console.error('Yorum yetki kontrolü hatası:', err);
          setCanReview(false);
        } finally {
          setReviewCheckLoading(false);
        }
      }
    }
    checkAuth();
  }, [product.id]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Lutfen gecerli bir fotoğraf dosyasi secin (JPG, PNG, WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Fotoğraf 5MB den büyük olamaz.');
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const removePhoto = () => {
    setPhotoFile(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { alert('Lutfen yildiz puaninizi secin.'); return; }
    if (!comment.trim()) { alert('Lutfen yorumunuzu yazin.'); return; }
    if (!userName.trim()) { alert('Lutfen adinizi yazin.'); return; }

    setSubmitting(true);
    try {
      let photoUrl = null;
      if (photoFile) {
        photoUrl = await uploadReviewPhoto(photoFile);
      }
      await addReview({
        product_id: product.id,
        user_id: currentUser?.id || null,
        user_name: userName,
        rating,
        comment,
        photo_url: photoUrl,
      });
      setRating(0);
      setComment('');
      setPhotoFile(null);
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      setPhotoPreview(null);
      alert('Yorumunuz gönderildi! Yonetici onayladiktan sonra yayinlanacaktir.');
      loadReviews();
    } catch (error: any) {
      console.error('Yorum gönderilirken hata:', error);
      alert('Yorum gönderilirken hata olustu: ' + (error.message || 'Bilinmeyen hata'));
    } finally {
      setSubmitting(false);
    }
  };

  const renderRatingBar = (star: number) => {
    const count = stats?.ratingDistribution[star] || 0;
    const percentage = stats?.totalReviews ? Math.round((count / stats.totalReviews) * 100) : 0;
    return (
      <div key={star} className="flex items-center gap-2 text-sm">
        <span className="w-3 text-sand-600">{star}</span>
        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
        <div className="flex-1 bg-sand-200 rounded-full h-2 overflow-hidden">
          <div className="bg-amber-400 h-full rounded-full transition-all" style={{ width: `${percentage}%` }} />
        </div>
        <span className="w-8 text-xs text-sand-500 text-right">{count}</span>
      </div>
    );
  };

  const renderReviewForm = () => {
    if (!currentUser) {
      return (
        <div className="text-center py-8 text-sand-500">
          <User className="w-8 h-8 mx-auto mb-2 text-sand-300" />
          <p className="text-sm mb-2">Yorum yapmak için giriş yapın.</p>
          <button
            onClick={() => supabase.auth.signInWithOAuth({
              provider: 'google',
              options: {
                redirectTo: window.location.origin + window.location.hash,
              },
            })}
            className="btn-primary text-sm"
          >
            Giriş Yap
          </button>
        </div>
      );
    }

    if (reviewCheckLoading) {
      return (
        <div className="text-center py-8 text-sand-500">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-600" />
          <p className="text-sm">Yorum yetkiniz kontrol ediliyor...</p>
        </div>
      );
    }

    if (!canReview) {
      return (
        <div className="text-center py-8 text-sand-500">
          <Package className="w-8 h-8 mx-auto mb-2 text-sand-300" />
          <p className="text-sm mb-2">Bu ürünü satın alıp teslimatını aldıktan sonra yorum yapabilirsiniz.</p>
          <p className="text-xs text-sand-400">Yorum yapma hakkı, siparişiniz "Teslim Edildi" durumuna geldiğinde aktif olur.</p>
        </div>
      );
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-sand-700 mb-1">
            <User className="w-3.5 h-3.5" />
            Adınız *
          </label>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="w-full px-3 py-2 border border-sand-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none"
            placeholder="Adınız soyadınız"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-sand-700 mb-1 block">Puan *</label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-0.5"
              >
                <Star
                  className={`w-5 h-5 transition-all ${
                    star <= (hoverRating || rating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-sand-200 hover:text-amber-300'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-sand-700 mb-1 block">Yorum *</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full px-3 py-2 border border-sand-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none resize-none"
            placeholder="Deneyiminizi paylaşın..."
            rows={4}
          />
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-sand-700 mb-1">
            <Upload className="w-3.5 h-3.5" />
            Fotoğraf (isteğe bağlı)
          </label>
          {photoPreview ? (
            <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-sand-200">
              <img src={photoPreview} alt="preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={removePhoto}
                className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <label className="flex items-center justify-center w-full h-20 border-2 border-dashed border-sand-300 rounded-xl cursor-pointer hover:border-brand-400 transition-colors">
              <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              <Upload className="w-5 h-5 text-sand-400" />
            </label>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full btn-primary flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Gönderiliyor...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Yorumu Gönder
            </>
          )}
        </button>
      </form>
    );
  };

  return (
    <div className="mt-16 bg-white rounded-3xl border border-sand-200 p-8 shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-display text-2xl lg:text-3xl font-bold text-sand-900">Müşteri Yorumları</h2>
        {stats && stats.totalReviews > 0 && (
          <div className="flex items-center gap-3 bg-sand-50 px-4 py-2 rounded-xl">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className={`w-4 h-4 ${i <= Math.round(stats.averageRating) ? 'fill-amber-400 text-amber-400' : 'text-sand-200'}`} />
              ))}
            </div>
            <span className="font-bold text-sand-800">{stats.averageRating}</span>
            <span className="text-sm text-sand-500">({stats.totalReviews} yorum)</span>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Sol: İstatistikler + Form */}
        <div className="lg:col-span-1 space-y-8">
          {stats && stats.totalReviews > 0 ? (
            <div className="space-y-3">
              <h3 className="font-semibold text-sand-800 text-sm">Puan Dağılımı</h3>
              {[5, 4, 3, 2, 1].map(renderRatingBar)}
            </div>
          ) : (
            <div className="text-center py-8 text-sand-500">
              <Star className="w-8 h-8 mx-auto mb-2 text-sand-300" />
              <p className="text-sm">Henüz yorum yok. İlk yorumu siz bırakın!</p>
            </div>
          )}

          <div className="border-t border-sand-200 pt-6">
            <h3 className="font-semibold text-sand-800 mb-4">Yorum Bırak</h3>
            {renderReviewForm()}
          </div>
        </div>

        {/* Sağ: Yorum Listesi */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="text-center py-12 text-sand-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-600" />
              <p>Yorumlar yükleniyor...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12 text-sand-500">
              <Star className="w-12 h-12 mx-auto mb-3 text-sand-300" />
              <p>Henüz yorum yok.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="border border-sand-200 rounded-2xl p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold flex-shrink-0">
                      {review.user_name?.[0] || <User className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sand-800 text-sm">{review.user_name}</span>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${i <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-sand-200'}`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-sand-400">
                          {new Date(review.created_at).toLocaleDateString('tr-TR', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      <p className="text-sand-700 text-sm leading-relaxed mt-2">{review.comment}</p>
                      {review.photo_url && (
                        <div className="mt-3">
                          <img
                            src={review.photo_url}
                            alt="yorum fotoğrafı"
                            className="max-w-32 max-h-32 rounded-xl object-cover border border-sand-200"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
