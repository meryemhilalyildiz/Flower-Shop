import { LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  label: string;
  value: string | number;
  tone?: 'brand' | 'amber' | 'leaf' | 'rose' | 'sand';
}

const toneStyles = {
  brand: 'bg-brand-50 text-brand-700 border-brand-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  leaf: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rose: 'bg-rose-50 text-rose-700 border-rose-200',
  sand: 'bg-sand-50 text-sand-700 border-sand-200',
};

export default function StatCard({ icon: Icon, label, value, tone = 'sand' }: Props) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-sand-200 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${toneStyles[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-sm font-medium text-sand-600">{label}</span>
      </div>
      <p className="text-2xl font-bold text-sand-900">{value}</p>
    </div>
  );
}
