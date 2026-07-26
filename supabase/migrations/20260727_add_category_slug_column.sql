-- =====================================================================
-- Kategori tablosuna slug sütunu ekle
-- (Kod kategori linklerinde ve admin panelinde slug kullanıyor
--  ama tabloda hiç yoktu → kategoriye göre ürün filtreleme çalışmıyordu)
-- =====================================================================

ALTER TABLE categories
ADD COLUMN IF NOT EXISTS slug TEXT;

-- Mevcut kategoriler için isimden basit bir slug üret (Türkçe karakterler sadeleştirilir)
UPDATE categories
SET slug = lower(
  regexp_replace(
    translate(name, 'çğıöşüÇĞİÖŞÜ', 'cgiosuCGIOSU'),
    '[^a-zA-Z0-9]+', '-', 'g'
  )
)
WHERE slug IS NULL OR slug = '';

-- Boşta kalan/tekrarlayan slug'ları id ile benzersizleştir
UPDATE categories a
SET slug = a.slug || '-' || a.id
WHERE EXISTS (
  SELECT 1 FROM categories b
  WHERE b.slug = a.slug AND b.id <> a.id
);

ALTER TABLE categories
ADD CONSTRAINT categories_slug_unique UNIQUE (slug);

ALTER TABLE categories
ALTER COLUMN slug SET NOT NULL;
