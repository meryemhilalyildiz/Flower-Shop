import { useState, useEffect } from 'react';
import { Star, Search, Filter, RefreshCw, CheckCircle, XCircle, Trash2, Image as ImageIcon } from 'lucide-react';
import { fetchAllReviews, updateReviewApproval, deleteReview } from '../services/adminApi';
import type { Review } from '../types';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const data = await fetchAllReviews();
      setReviews(data);
    } catch (err) {
      console.error('Yorumlar yüklenirken hata:', err);
      alert('Yorumlar yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleApproval = async (reviewId: string, isApproved: boolean) => {
    setUpdatingId(reviewId);
    try {
      await updateReviewApproval(reviewId, isApproved);
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, is_approved: isApproved } : r))
      );
    } catch (err: any) {
      console.error('Onay güncellenirken hata:', err);
      alert('Güncelleme sırasında hata: ' + (err.message || 'Bilinmeyen hata'));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm('Bu yorumu silmek istediğinizden emin misiniz?')) return;
    try {
      await deleteReview(reviewId);
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      alert('Yorum silindi.');
    } catch (err: any) {
      console.error('Silme hatası:', err);
      alert('Silme sırasında hata: ' + (err.message || 'Bilinmeyen hata'));
    }
  };

  const filteredReviews = reviews.filter((review) => {
    const matchesSearch =
      review.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.comment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.product_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'approved' && review.is_approved) ||
      (statusFilter === 'pending' && !review.is_approved);
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: reviews.length,
    pending: reviews.filter((r) => !r.is_approved).length,
    approved: reviews.filter((r) => r.is_approved).length,
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`w-3 h-3 ${i <= rating ? 'fill-amber-400 text-amber-400' : 'text-sand-200'}`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-20 text-sand-600">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-brand-600" />
        Yorumlar yükleniyor...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-sand-900 font-display">Yorum Yönetimi</h1>
          <p className="text-sm text-sand-600">Gelen tüm yorumları görüntüleyin, onaylayın veya silin.</p>
        </div>
        <button
          onClick={loadReviews}
          className="flex items-center gap-2 px-4 py-2 border border-sand-200 rounded-xl hover:bg-sand-50 text-sm font-semibold text-sand-700"
        >
          <RefreshCw className="w-4 h-4" /> Yenile
        </button>
      </div>

      {/* Filtreler */}
      <div className="bg-white rounded-2xl border border-sand-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sand-400" />
            <input
              type="text"
              placeholder="Yorum ara (isim, yorum, ürün ID)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-sand-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {Object.entries({
              all: 'Tümü',
              pending: 'Onay Bekliyor',
              approved: 'Onaylı',
            }).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                  statusFilter === key
                    ? 'bg-brand-600 text-white'
                    : 'bg-sand-100 text-sand-700 hover:bg-sand-200'
                }`}
              >
                {label} ({statusCounts[key as keyof typeof statusCounts]})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Yorum Listesi */}
      {filteredReviews.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center text-sand-600 shadow-sm border border-sand-200">
          {searchTerm || statusFilter !== 'all'
            ? 'Arama kriterlerine uygun yorum bulunmuyor.'
            : 'Henüz hiç yorum bulunmuyor.'}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <div key={review.id} className="bg-white rounded-2xl p-6 shadow-sm border border-sand-200">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-md border border-brand-200">
                      #{review.id.slice(0, 8)}
                    </span>
                    <div className="flex items-center gap-1">
                      {renderStars(review.rating)}
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      review.is_approved
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {review.is_approved ? 'Onaylı' : 'Onay Bekliyor'}
                    </span>
                    <span className="text-xs text-sand-500">
                      {new Date(review.created_at).toLocaleString('tr-TR')}
                    </span>
                  </div>

                  <div className="text-sm text-sand-800 space-y-1">
                    <p className="font-semibold text-sand-900">
                      Kullanıcı: <span className="font-normal">{review.user_name || 'Belirtilmemiş'}</span>
                    </p>
                    <p className="font-semibold">
                      Ürün ID: <span className="font-normal font-mono text-xs">{review.product_id}</span>
                    </p>
                    <p className="text-sand-600 mt-2">{review.comment}</p>
                    {review.photo_url && (
                      <div className="mt-3">
                        <img
                          src={review.photo_url}
                          alt="yorum fotoğrafı"
                          className="max-w-32 max-h-32 rounded-xl object-cover border border-sand-200"
                        />
                      </div>
                    )}
                    {!review.photo_url && (
                      <div className="flex items-center gap-1 text-xs text-sand-400 mt-2">
                        <ImageIcon className="w-3 h-3" />
                        Fotoğraf yok
                      </div>
                    )}
                  </div>
                </div>

                <div className="lg:min-w-[180px] flex flex-col gap-2">
                  {review.is_approved ? (
                    <button
                      onClick={() => handleApproval(review.id, false)}
                      disabled={updatingId === review.id}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-100 text-amber-800 rounded-xl text-sm font-semibold hover:bg-amber-200 transition-all disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      {updatingId === review.id ? '...' : 'Onayı Kaldır'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleApproval(review.id, true)}
                      disabled={updatingId === review.id}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-800 rounded-xl text-sm font-semibold hover:bg-emerald-200 transition-all disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {updatingId === review.id ? '...' : 'Onayla'}
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(review.id)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-100 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                    Sil
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
