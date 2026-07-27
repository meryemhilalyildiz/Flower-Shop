import { useState, useEffect } from 'react';
import { Star, Upload, X, Send, RefreshCw, User } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { addReview, uploadReviewPhoto, fetchProductReviewStats } from '../services/adminApi';
import type { Product, ReviewStats } from '../types';

type Props = {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onReviewSubmitted?: () => void;
};

export default function ReviewModal({ product, isOpen, onClose, onReviewSubmitted }: Props) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [userName, setUserName] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [existingStats, setExistingStats] = useState<ReviewStats | null>(null);

  // Kullanıcı oturumunu kontrol et
  useEffect(() => {
    if (!isOpen) return;

    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
        setUserName(user.user_metadata?.full_name || user.user_metadata?.name || '');
      }
    }
    checkAuth();

    // Mevcut yorum istatistiklerini çek
    fetchProductReviewStats(product.id).then(setExistingStats).catch(() => setExistingStats(null));
  }, [isOpen, product.id]);

  // Modal açıldığında state sıfırla
  useEffect(() => {
    if (isOpen) {
      setRating(0);
      setHoverRating(0);
      setComment('');
      setPhotoFile(null);
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      setPhotoPreview(null);
    }
  }, [isOpen]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Lütfen geçerli bir fotoğraf dosyası seçin (JPG, PNG, WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Fotoğraf 5MB'den büyük olamaz.");
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
    if (rating === 0) {
      alert('Lütfen yıldız puanınızı seçin.');
      return;
    }
    if (!comment.trim()) {
      alert('Lütfen yorumunuzu yazın.');
      return;
    }
    if (!userName.trim()) {
      alert('Lütfen adınızı yazın.');
      return;
    }

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
      alert('Yorumunuz gönderildi! Yönetici onayladıktan sonra yayınlanacaktır.');
      onReviewSubmitted?.();
      onClose();
    } catch (error: any) {
      console.error('Yorum gönderilirken hata:', error);
      alert('Yorum gönderilirken hata oluştu: ' + (error.message || 'Bilinmeyen hata'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-sand-200">
          <div className="flex items-center gap-3">
            {product.images?.[0] ? (
              <img src={product.images[0]} alt={product.name} className="w-12 h-12 object-cover rounded-xl" />
            ) : (
              <div className="w-12 h-12 bg-pink-50 rounded-xl flex items-center justify-center text-pink-400">🌸</div>
            )}
            <div>
              <h2 className="text-xl font-bold text-sand-900">Ürün Değerlendir</h2>
              <p className="text-sm text-sand-500">{product.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-sand-100 hover:bg-sand-200 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-sand-600" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Mevcut istatistikler */}
          {existingStats && existingStats.totalReviews > 0 && (
            <div className="mb-6 p-4 bg-sand-50 rounded-xl border border-sand-200">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i <= Math.round(existingStats.averageRating) ? 'fill-amber-400 text-amber-400' : 'text-sand-200'}`}
                    />
                  ))}
                </div>
                <span className="font-bold text-sand-800">{existingStats.averageRating}</span>
                <span className="text-sm text-sand-500">({existingStats.totalReviews} değerlendirme)</span>
              </div>
              <p className="text-xs text-sand-400 mt-1">Bu ürün için mevcut değerlendirmeler</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Ad */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-sand-700 mb-1.5">
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

            {/* Puan */}
            <div>
              <label className="text-xs font-semibold text-sand-700 mb-1.5 block">Puan *</label>
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
                      className={`w-6 h-6 transition-all ${
                        star <= (hoverRating || rating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-sand-200 hover:text-amber-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Yorum */}
            <div>
              <label className="text-xs font-semibold text-sand-700 mb-1.5 block">Yorum *</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-3 py-2 border border-sand-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none resize-none"
                placeholder="Deneyiminizi paylaşın..."
                rows={4}
              />
            </div>

            {/* Fotoğraf */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-sand-700 mb-1.5">
                <Upload className="w-3.5 h-3.5" />
                Fotoğraf (isteğe bağlı)
              </label>
              {photoPreview ? (
                <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-sand-200">
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

            {/* Submit */}
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
        </div>
      </div>
    </div>
  );
}
