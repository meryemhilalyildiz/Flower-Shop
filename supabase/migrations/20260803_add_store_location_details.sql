-- =====================================================================
-- Mağaza Konumu Detayları Ekleme
-- Migration: mahalle ve cadde alanları
-- =====================================================================

-- 🌸 Mahalle ve cadde alanlarını ekle
ALTER TABLE store_settings 
ADD COLUMN IF NOT EXISTS neighborhood TEXT,
ADD COLUMN IF NOT EXISTS street TEXT;

-- 🌸 Varsayılan değerleri güncelle
UPDATE store_settings 
SET neighborhood = 'Kızılay', street = 'Sakarya Cad.'
WHERE id = 1 AND neighborhood IS NULL AND street IS NULL;