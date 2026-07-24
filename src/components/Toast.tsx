import { useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';

type Props = {
  message: string;
  onClose: () => void;
};

export default function Toast({ message, onClose }: Props) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-[100] animate-slide-up">
      <div className="flex items-center gap-3 bg-white rounded-2xl shadow-soft border border-sand-100 px-5 py-4 pr-3">
        <CheckCircle2 className="w-5 h-5 text-leaf-500 flex-shrink-0" />
        <span className="text-sm font-medium text-sand-800">{message}</span>
        <button onClick={onClose} className="ml-2 p-1 rounded-lg hover:bg-sand-100">
          <X className="w-4 h-4 text-sand-500" />
        </button>
      </div>
    </div>
  );
}
