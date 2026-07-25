interface Props {
  status: string;
}

const statusStyles: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-800 border-gray-200',
  processing: 'bg-blue-100 text-blue-800 border-blue-200',
  shipped: 'bg-purple-100 text-purple-800 border-purple-200',
  delivered: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  preparing: 'bg-amber-100 text-amber-800 border-amber-200',
  Hazırlanıyor: 'bg-amber-100 text-amber-800 border-amber-200',
  Yolda: 'bg-blue-100 text-blue-800 border-blue-200',
  'Teslim Edildi': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'İptal Edildi': 'bg-red-100 text-red-800 border-red-200',
};

const statusLabels: Record<string, string> = {
  pending: 'Beklemede',
  processing: 'İşleniyor',
  shipped: 'Kargoda',
  delivered: 'Teslim Edildi',
  cancelled: 'İptal',
  preparing: 'Hazırlanıyor',
  Hazırlanıyor: 'Hazırlanıyor',
  Yolda: 'Yolda',
  'Teslim Edildi': 'Teslim Edildi',
  'İptal Edildi': 'İptal Edildi',
};

export default function StatusBadge({ status }: Props) {
  const style = statusStyles[status] || statusStyles.pending;
  const label = statusLabels[status] || status;

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${style}`}>
      {label}
    </span>
  );
}
