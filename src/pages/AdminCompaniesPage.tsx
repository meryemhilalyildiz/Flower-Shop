import { useState, useEffect } from 'react';
import { Building2, Check, RefreshCw, AlertCircle } from 'lucide-react';
import { fetchPendingCompanies, approveCompany } from '../services/api';

export function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const data = await fetchPendingCompanies();
      setCompanies(data || []);
    } catch (err) {
      alert('Bekleyen şirketler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  const handleApprove = async (userId: string) => {
    setApprovingId(userId);
    try {
      await approveCompany(userId);
      setCompanies((prev) => prev.filter((c) => c.id !== userId));
      alert('Şirket kaydı başarıyla onaylandı!');
    } catch (err) {
      alert('Onaylama sırasında bir hata oluştu.');
    } finally {
      setApprovingId(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-sand-600">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-brand-600" />
        Şirket başvuruları yükleniyor...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-sand-900 font-display">Şirket Onay Yönetimi</h1>
          <p className="text-sm text-sand-600">Onay bekleyen B2B şirket başvurularını inceleyin ve onaylayın.</p>
        </div>
        <button
          onClick={loadCompanies}
          className="p-2 border border-sand-200 rounded-lg hover:bg-sand-100 transition-all flex items-center gap-2 text-sm font-semibold text-sand-700 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" /> Yenile
        </button>
      </div>

      {companies.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center text-sand-600 shadow-sm border border-sand-200 flex flex-col items-center gap-2">
          <AlertCircle className="w-8 h-8 text-sand-400" />
          <span>Şu anda onay bekleyen bir şirket başvurusu bulunmuyor.</span>
        </div>
      ) : (
        <div className="space-y-4">
          {companies.map((company) => (
            <div
              key={company.id}
              className="bg-white rounded-2xl p-6 shadow-sm border border-sand-200 flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-brand-600" />
                  <h3 className="font-bold text-sand-900 text-lg">
                    {company.company_name || 'Şirket Adı Belirtilmemiş'}
                  </h3>
                  <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full">
                    Onay Bekliyor
                  </span>
                </div>
                <p className="text-xs text-sand-500 font-mono">ID: {company.id}</p>
              </div>

              <button
                onClick={() => handleApprove(company.id)}
                disabled={approvingId === company.id}
                className="btn-primary bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 text-sm font-semibold py-2.5 px-5 rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                {approvingId === company.id ? 'Onaylanıyor...' : 'Şirketi Onayla'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}