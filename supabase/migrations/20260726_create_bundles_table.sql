-- =====================================================================
-- Kampanyalı Paketler (Bundle) Modülü
-- Migration: bundles ve bundle_items tabloları
-- =====================================================================

-- 🌸 Kampanyalı Paketler Tablosu
CREATE TABLE IF NOT EXISTS bundles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,                   -- Paket adı (örn: "Yılbaşı Paketi")
  description     TEXT,                            -- Paket açıklaması
  image_url       TEXT NOT NULL,                   -- Paket görseli
  original_price  NUMERIC(10, 2) NOT NULL,         -- Ürünlerin toplam orijinal fiyatı
  bundle_price    NUMERIC(10, 2) NOT NULL,         -- Paket fiyatı (indirimli)
  discount_percentage NUMERIC(5, 2),               -- İndirim yüzdesi (hesaplanan)
  is_active       BOOLEAN DEFAULT true,
  is_limited      BOOLEAN DEFAULT false,           -- Sınırlı sayıda mı?
  stock_quantity  INTEGER DEFAULT NULL,            -- Stok adedi (sınırlıysa)
  valid_from      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until     TIMESTAMP WITH TIME ZONE,         -- Bitiş tarihi (NULL = süresiz)
  sort_order      INTEGER DEFAULT 0,                -- Sıralama
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT bundles_price_check CHECK (bundle_price > 0),
  CONSTRAINT bundles_original_price_check CHECK (original_price >= bundle_price),
  CONSTRAINT bundles_stock_check CHECK (stock_quantity IS NULL OR stock_quantity >= 0)
);

-- 🌸 Paket Ürünleri Tablosu (Bundle Items)
CREATE TABLE IF NOT EXISTS bundle_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id       UUID NOT NULL,                    -- Paket ID
  product_id      TEXT NOT NULL,                    -- Ürün ID
  quantity        INTEGER NOT NULL DEFAULT 1,       -- Ürün adedi
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT bundle_items_quantity_check CHECK (quantity > 0),
  FOREIGN KEY (bundle_id) REFERENCES bundles(id) ON DELETE CASCADE
);

-- 🌸 Varsayılan paketler
INSERT INTO bundles (name, description, image_url, original_price, bundle_price, discount_percentage, is_limited, stock_quantity, valid_from, valid_until, sort_order) VALUES
  ('Yılbaşı Paketi 🎄', 'Kırmızı gül buketi + şampanya + kutu çikolata ile mükemmel yılbaşı sürprizi', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&h=600&fit=crop', 850, 650, 23.53, true, 50, NOW(), NOW() + INTERVAL '2 months', 1),
  ('Sevgililer Günü Özel ❤️', '50 adet kırmızı gül + kalp şeklinde kutu + çikolata', 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=800&h=600&fit=crop', 1200, 899, 25.08, true, 100, NOW(), NOW() + INTERVAL '6 months', 2),
  ('Anneler Günü Sürprizi 🌸', 'Renkli karışık buket + parfüm + mum seti', 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800&h=600&fit=crop', 750, 550, 26.67, false, NULL, NOW(), NULL, 3),
  ('Doğum Günü Kutlaması 🎂', 'Fiesta buketi + balonlar + pasta', 'https://images.unsplash.com/photo-1582794543139-8ac5a3ca5a91?w=800&h=600&fit=crop', 600, 450, 25.00, false, NULL, NOW(), NULL, 4)
ON CONFLICT DO NOTHING;

-- 🌸 Paket ürünlerini ekle (örnek veriler)
-- Yılbaşı Paketi ürünleri
INSERT INTO bundle_items (bundle_id, product_id, quantity)
SELECT 
  (SELECT id FROM bundles WHERE name = 'Yılbaşı Paketi 🎄' LIMIT 1),
  '1', -- Bu ürün ID'leri gerçek ürünlerle eşleşmelidir
  1
WHERE EXISTS (SELECT 1 FROM bundles WHERE name = 'Yılbaşı Paketi 🎄')
ON CONFLICT DO NOTHING;

-- 🌸 updated_at otomatik güncelleme trigger'ı
CREATE TRIGGER update_bundles_updated_at
  BEFORE UPDATE ON bundles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 🌸 İndeksler
CREATE INDEX IF NOT EXISTS idx_bundles_active ON bundles(is_active);
CREATE INDEX IF NOT EXISTS idx_bundles_dates ON bundles(valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_bundles_sort ON bundles(sort_order);
CREATE INDEX IF NOT EXISTS idx_bundle_items_bundle ON bundle_items(bundle_id);
CREATE INDEX IF NOT EXISTS idx_bundle_items_product ON bundle_items(product_id);
