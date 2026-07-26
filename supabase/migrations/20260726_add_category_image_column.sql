-- =====================================================================
-- Kategori tablosuna görsel ve açıklama sütunları ekle
-- =====================================================================

-- categories tablosuna image ve description sütunları ekle
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS image TEXT,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Varsayılan kategori görselleri (mevcut kategoriler için)
UPDATE categories 
SET image = 'https://images.pexels.com/photos/931796/pexels-photo-931796.jpeg?auto=compress&cs=tinysrgb&w=600'
WHERE image IS NULL;
