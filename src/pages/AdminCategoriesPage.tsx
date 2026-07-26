import { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, RefreshCw, Save, X, FolderTree, Upload } from 'lucide-react';
import { fetchAllCategories, addCategory, updateCategory, deleteCategory, uploadCategoryImage, slugify } from '../services/adminApi';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);

  const [newCategory, setNewCategory] = useState({
    name: '',
    slug: '',
  });
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [newImagePreview, setNewImagePreview] = useState<string>('');

  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<Record<string, string>>({});

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await fetchAllCategories();
      setCategories(data || []);
    } catch (err: any) {
      alert('Kategoriler yüklenirken hata: ' + (err?.message || err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setFile: (f: File | null) => void, setPreview: (p: string) => void) => {
    const file = e.target.files?.[0] || null;
    setFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
    } else {
      setPreview('');
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const slug = newCategory.slug || slugify(newCategory.name);
      let imageUrl: string | undefined = undefined;

      if (newImageFile) {
        imageUrl = await uploadCategoryImage(newImageFile);
      }

      await addCategory(newCategory.name, slug, imageUrl);
      alert('Kategori başarıyla eklendi!');
      setShowAddModal(false);
      setNewCategory({ name: '', slug: '' });
      setNewImageFile(null);
      setNewImagePreview('');
      loadCategories();
    } catch (err: any) {
      alert('Ekleme hatası: ' + (err?.message || err));
    }
  };

  const handleUpdateCategory = async (id: string, name: string, slug: string, existingImage: string) => {
    try {
      let imageUrl = existingImage;

      if (editImageFile) {
        imageUrl = await uploadCategoryImage(editImageFile);
      }

      await updateCategory(id, name, slug, imageUrl || undefined);
      setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, name, slug, image: imageUrl } : c)));
      setEditingCategory(null);
      setEditImageFile(null);
      setEditImagePreview({});
      alert('Kategori güncellendi!');
    } catch (err: any) {
      alert('Güncelleme hatası: ' + (err?.message || err));
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Bu kategoriyi silmek istediğinizden emin misiniz?')) return;
    try {
      await deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      alert('Kategori silindi.');
    } catch (err: any) {
      alert('Silme hatası: ' + (err?.message || err));
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20 text-sand-600">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-brand-600" />
        Kategoriler yükleniyor...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-sand-900 font-display">Kategori Yönetimi</h1>
          <p className="text-sm text-sand-600">Ürün kategorilerini ve görsellerini yönetin.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold"
        >
          <Plus className="w-4 h-4" /> Yeni Kategori
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-sand-200 p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-sand-200 text-xs font-semibold text-sand-500 uppercase">
                <th className="p-3">Görsel</th>
                <th className="p-3">Kategori Adı</th>
                <th className="p-3">Slug</th>
                <th className="p-3">Ürün Sayısı</th>
                <th className="p-3 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-100 text-sm">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-sand-50">
                  <td className="p-3">
                    {editingCategory?.id === cat.id ? (
                      <div className="space-y-2">
                        <label className="flex items-center justify-center w-12 h-12 rounded-lg overflow-hidden bg-sand-100 border-2 border-dashed border-sand-300 cursor-pointer hover:border-brand-500">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, setEditImageFile, (p) => setEditImagePreview({ ...editImagePreview, [cat.id]: p }))}
                            className="hidden"
                          />
                          {editImagePreview[cat.id] ? (
                            <img src={editImagePreview[cat.id]} alt="Önizleme" className="w-full h-full object-cover" />
                          ) : (
                            <Upload className="w-4 h-4 text-sand-400" />
                          )}
                        </label>
                        {cat.image && !editImagePreview[cat.id] && (
                          <img src={cat.image} alt={cat.name} className="w-12 h-12 rounded-lg object-cover" />
                        )}
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-sand-100 flex items-center justify-center">
                        {cat.image ? (
                          <img
                            src={cat.image}
                            alt={cat.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = 'https://images.pexels.com/photos/931796/pexels-photo-931796.jpeg?auto=compress&cs=tinysrgb&w=600';
                            }}
                          />
                        ) : (
                          <FolderTree className="w-5 h-5 text-sand-400" />
                        )}
                      </div>
                    )}
                  </td>
                  <td className="p-3 font-semibold text-sand-900">
                    {editingCategory?.id === cat.id ? (
                      <input
                        type="text"
                        defaultValue={cat.name}
                        id={`name-${cat.id}`}
                        className="w-full px-2 py-1 border border-sand-300 rounded-lg"
                      />
                    ) : (
                      cat.name
                    )}
                  </td>
                  <td className="p-3 text-sand-600">
                    {editingCategory?.id === cat.id ? (
                      <input
                        type="text"
                        defaultValue={cat.slug}
                        id={`slug-${cat.id}`}
                        className="w-full px-2 py-1 border border-sand-300 rounded-lg"
                      />
                    ) : (
                      cat.slug
                    )}
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-1 bg-brand-50 text-brand-700 rounded-full text-xs font-semibold">
                      {cat.product_count || 0}
                    </span>
                  </td>
                  <td className="p-3 text-right space-x-2">
                    {editingCategory?.id === cat.id ? (
                      <button
                        onClick={() => {
                          const name = (document.getElementById(`name-${cat.id}`) as HTMLInputElement).value;
                          const slug = (document.getElementById(`slug-${cat.id}`) as HTMLInputElement).value;
                          handleUpdateCategory(cat.id, name, slug, cat.image || '');
                        }}
                        className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                        title="Kaydet"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => setEditingCategory(cat)}
                        className="p-2 bg-sand-100 text-sand-700 rounded-lg hover:bg-sand-200"
                        title="Düzenle"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                      title="Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl relative">
            <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-sand-400 hover:text-sand-700">
              <X className="w-6 h-6" />
            </button>
            <h3 className="text-xl font-bold font-display text-sand-900 mb-4">Yeni Kategori Ekle</h3>

            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-sand-700">Kategori Adı</label>
                <input
                  type="text"
                  required
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value, slug: slugify(e.target.value) })}
                  placeholder="ör. Gül Buketleri"
                  className="w-full px-3 py-2 border border-sand-300 rounded-xl text-sm mt-1 focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-sand-700">Slug (URL)</label>
                <input
                  type="text"
                  value={newCategory.slug}
                  onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })}
                  placeholder="gul-buketleri"
                  className="w-full px-3 py-2 border border-sand-300 rounded-xl text-sm mt-1 focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-sand-700">Kategori Görseli</label>
                <label className="flex items-center justify-center w-full h-24 rounded-xl border-2 border-dashed border-sand-300 cursor-pointer hover:border-brand-500 mt-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, setNewImageFile, setNewImagePreview)}
                    className="hidden"
                  />
                  {newImagePreview ? (
                    <img src={newImagePreview} alt="Önizleme" className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <div className="text-center">
                      <Upload className="w-6 h-6 text-sand-400 mx-auto mb-1" />
                      <span className="text-xs text-sand-500">Fotoğraf seç</span>
                    </div>
                  )}
                </label>
              </div>

              <button type="submit" className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl">
                Kategoriyi Kaydet
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
