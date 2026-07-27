import { useEffect, useState } from 'react';
import { BookOpen, Leaf, Droplets, Sun, Thermometer } from 'lucide-react';
import { fetchWikiEntriesForProduct, type WikiEntry } from '../services/supabaseData';

type Props = {
  productId: string;
};

const CATEGORY_META: Record<string, { label: string; icon: typeof BookOpen }> = {
  bakim: { label: 'Çiçek Bakımı', icon: Droplets },
  turler: { label: 'Çiçek Türleri', icon: Leaf },
  aranjman: { label: 'Aranjmanlar', icon: BookOpen },
  sulama: { label: 'Sulama Rehberi', icon: Droplets },
  isik: { label: 'Işık Gereksinimi', icon: Sun },
  sicaklik: { label: 'Sıcaklık', icon: Thermometer },
};

export default function WikiCareSection({ productId }: Props) {
  const [entries, setEntries] = useState<WikiEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchWikiEntriesForProduct(productId).then((data) => {
      if (active) {
        setEntries(data);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [productId]);

  if (loading || entries.length === 0) return null;

  return (
    <div className="mt-12">
      <h2 className="font-display text-2xl font-bold text-sand-900 mb-6 flex items-center gap-2">
        <BookOpen className="w-6 h-6 text-brand-600" />
        Bakım Rehberi
      </h2>

      <div className="grid md:grid-cols-2 gap-5">
        {entries.map((entry) => {
          const meta = CATEGORY_META[entry.category] || { label: entry.category, icon: BookOpen };
          const Icon = meta.icon;

          return (
            <div
              key={entry.id}
              className="bg-gradient-to-br from-brand-50/60 to-white rounded-2xl p-6 border border-brand-100 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center">
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <span className="text-xs font-semibold text-brand-700 bg-brand-100/70 px-2.5 py-1 rounded-full">
                  {meta.label}
                </span>
              </div>

              <h3 className="font-display text-lg font-bold text-sand-900 mb-2">{entry.title}</h3>
              <p className="text-sm text-sand-600 leading-relaxed whitespace-pre-line">{entry.content}</p>

              {entry.tags && entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {entry.tags.map((tag, idx) => (
                    <span key={idx} className="text-xs bg-white text-sand-500 px-2 py-1 rounded-full border border-sand-200">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
