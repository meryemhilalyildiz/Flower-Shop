import { useState, useRef } from 'react';
import { Upload, X, Check, Edit2, Link } from 'lucide-react';
import { supabase } from '../../supabaseClient';

type Props = {
  src: string;
  alt: string;
  onSave: (newSrc: string) => void;
  className?: string;
};

export default function EditableImage({ src, alt, onSave, className = '' }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [useUrl, setUseUrl] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      // Dosya adını oluştur
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `page-images/${fileName}`;

      // Supabase Storage'a yükle
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Storage bucket hatası:', uploadError);
        // RLS hatası varsa URL kullanmayı öner
        if (uploadError.message?.includes('row-level security')) {
          throw new Error('Storage bucket RLS politikası nedeniyle dosya yüklenemiyor. Lütfen URL kullanmayı deneyin.');
        }
        throw uploadError;
      }

      // Public URL al
      const { data } = supabase.storage.from('images').getPublicUrl(filePath);
      const publicUrl = data.publicUrl;

      setPreviewUrl(publicUrl);
    } catch (error) {
      console.error('Görsel yükleme hatası:', error);
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      alert(`Görsel yüklenirken bir hata oluştu: ${errorMessage}. URL kullanmayı deneyin.`);
      setUseUrl(true);
    } finally {
      setUploading(false);
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput) {
      setPreviewUrl(urlInput);
    }
  };

  const handleSave = () => {
    if (previewUrl) {
      onSave(previewUrl);
    }
    setIsEditing(false);
    setPreviewUrl(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setPreviewUrl(null);
    setUrlInput('');
    setUseUrl(false);
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setPreviewUrl(null);
    setUrlInput('');
    setUseUrl(false);
  };

  if (isEditing) {
    return (
      <div className="editable-component relative inline-block">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="border-2 border-dashed border-pink-500 rounded-lg p-4 bg-pink-50">
          {uploading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
              <span className="ml-3 text-gray-600">Yükleniyor...</span>
            </div>
          ) : previewUrl ? (
            <div className="space-y-3">
              <img
                src={previewUrl}
                alt="Önizleme"
                className="w-full rounded-lg max-h-64 object-contain"
              />
              <div className="flex gap-2 justify-center">
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  Kaydet
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  İptal
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {!useUrl ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 flex flex-col items-center justify-center py-6 cursor-pointer bg-white rounded-lg hover:bg-pink-100 transition-colors"
                  >
                    <Upload className="w-10 h-10 text-pink-500 mb-2" />
                    <p className="text-gray-600 text-sm">Dosya Yükle</p>
                  </button>
                  <button
                    onClick={() => setUseUrl(true)}
                    className="flex-1 flex flex-col items-center justify-center py-6 cursor-pointer bg-white rounded-lg hover:bg-pink-100 transition-colors"
                  >
                    <Link className="w-10 h-10 text-pink-500 mb-2" />
                    <p className="text-gray-600 text-sm">URL Gir</p>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                    <button
                      onClick={handleUrlSubmit}
                      className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors cursor-pointer"
                    >
                      Uygula
                    </button>
                  </div>
                  <button
                    onClick={() => setUseUrl(false)}
                    className="text-sm text-pink-600 hover:text-pink-800 cursor-pointer"
                  >
                    ← Dosya yüklemeye dön
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-1 mt-2 justify-center">
          <button
            onClick={handleCancel}
            className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors cursor-pointer"
            title="İptal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="editable-component relative group inline-block">
      <img
        src={src}
        alt={alt}
        className={className}
      />
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer rounded-lg" onClick={handleEditClick}>
        <div className="bg-white p-2 rounded-full">
          <Edit2 className="w-5 h-5 text-gray-800" />
        </div>
      </div>
    </div>
  );
}
