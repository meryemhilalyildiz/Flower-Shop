-- =====================================================================
-- SATIŞ VE PAZARLAMA ÖZELLİKLERİ - TAM MIGRATION
-- =====================================================================
-- Bu dosya tüm satış ve pazarlama özelliklerini içerir:
-- 1. İndirim Kuponları (coupons)
-- 2. Kampanya Bannerları (banners)
-- 3. Kampanyalı Paketler (bundles, bundle_items)
-- 4. Satış Analitikleri (sales_analytics, product_sales_analytics, category_sales_analytics, coupon_analytics)
-- =====================================================================

-- 🌸 updated_at otomatik güncelleme fonksiyonu (tüm tablolar için)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================================
-- 1. İndirim Kuponları Modülü
-- =====================================================================

-- 🌸 İndirim Kuponları Tablosu
CREATE TABLE IF NOT EXISTS coupons (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            TEXT NOT NULL UNIQUE,           -- Kupon kodu (örn: "WELCOME10", "VALENTINE25")
  discount_type   TEXT NOT NULL,                  -- 'percentage' veya 'fixed'
  discount_value  NUMERIC(10, 2) NOT NULL,        -- İndirim değeri (yüzde veya TL)
  min_order_amount NUMERIC(10, 2) DEFAULT 0,      -- Minimum sipariş tutarı
  max_discount_amount NUMERIC(10, 2),             -- Maksimum indirim tutarı (opsiyonel)
  usage_limit     INTEGER DEFAULT NULL,           -- Kullanım limiti (NULL = sınırsız)
  used_count      INTEGER DEFAULT 0,              -- Kullanım sayısı
  valid_from      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until     TIMESTAMP WITH TIME ZONE,       -- Bitiş tarihi (NULL = süresiz)
  is_active       BOOLEAN DEFAULT true,
  description     TEXT,                          -- Kupon açıklaması
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT coupons_discount_type_check CHECK (discount_type IN ('percentage', 'fixed')),
  CONSTRAINT coupons_discount_value_check CHECK (discount_value > 0),
  CONSTRAINT coupons_min_order_check CHECK (min_order_amount >= 0),
  CONSTRAINT coupons_max_discount_check CHECK (max_discount_amount IS NULL OR max_discount_amount > 0),
  CONSTRAINT coupons_usage_limit_check CHECK (usage_limit IS NULL OR usage_limit > 0),
  CONSTRAINT coupons_used_count_check CHECK (used_count >= 0)
);

-- 🌸 Varsayılan kuponlar
INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, max_discount_amount, usage_limit, valid_from, valid_until, description) VALUES
  ('WELCOME10', 'percentage', 10, 100, 200, 1000, NOW(), NOW() + INTERVAL '1 year', 'Hoş geldiniz! İlk siparişinizde %10 indirim'),
  ('VALENTINE25', 'percentage', 25, 200, 500, 500, NOW(), NOW() + INTERVAL '6 months', 'Sevgililer günü özel %25 indirim'),
  ('FLASH50', 'fixed', 50, 150, NULL, 200, NOW(), NOW() + INTERVAL '1 month', 'Flash sale! 50 TL indirim'),
  ('SUMMER100', 'fixed', 100, 300, NULL, 300, NOW(), NOW() + INTERVAL '3 months', 'Yaz indirimleri! 100 TL indirim')
ON CONFLICT (code) DO NOTHING;

-- 🌸 updated_at otomatik güncelleme trigger'ı
CREATE TRIGGER update_coupons_updated_at
  BEFORE UPDATE ON coupons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 🌸 İndeksler
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_coupons_validity ON coupons(valid_from, valid_until);

-- =====================================================================
-- 2. Kampanya Bannerları Modülü
-- =====================================================================

-- 🌸 Kampanya Bannerları Tablosu
CREATE TABLE IF NOT EXISTS banners (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,                   -- Banner başlığı
  subtitle        TEXT,                            -- Alt başlık
  image_url       TEXT NOT NULL,                   -- Banner görseli
  background_color TEXT DEFAULT '#ffffff',         -- Arka plan rengi
  text_color      TEXT DEFAULT '#000000',          -- Metin rengi
  link_url        TEXT,                            -- Tıklanınca gidilecek URL
  link_text       TEXT DEFAULT 'Şimdi Keşfet',     -- Buton metni
  start_date      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date        TIMESTAMP WITH TIME ZONE,         -- Bitiş tarihi (NULL = süresiz)
  is_active       BOOLEAN DEFAULT true,
  sort_order      INTEGER DEFAULT 0,                -- Sıralama
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT banners_date_check CHECK (end_date IS NULL OR end_date > start_date)
);

-- 🌸 Varsayılan bannerlar
INSERT INTO banners (title, subtitle, image_url, background_color, text_color, link_url, link_text, start_date, end_date, sort_order) VALUES
  ('Flash Sale! 🌸', 'Sadece bugün geçerli %30 indirim', 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=1200&h=400&fit=crop', '#fef3c7', '#92400e', '/shop', 'Alışverişe Başla', NOW(), NOW() + INTERVAL '1 day', 1),
  ('Sevgililer Günü Özel ❤️', 'Sevdiklerinize en güzel çiçekleri gönderin', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&h=400&fit=crop', '#fce7f3', '#831843', '/shop?category=valentines', 'Seçim Yap', NOW(), NOW() + INTERVAL '1 month', 2),
  ('Yeni Gelenler 🌷', 'Taze çiçeklerimiz mağazada!', 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=1200&h=400&fit=crop', '#ecfdf5', '#065f46', '/shop?badge=new', 'Keşfet', NOW(), NULL, 3)
ON CONFLICT DO NOTHING;

-- 🌸 updated_at otomatik güncelleme trigger'ı
CREATE TRIGGER update_banners_updated_at
  BEFORE UPDATE ON banners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 🌸 İndeksler
CREATE INDEX IF NOT EXISTS idx_banners_active ON banners(is_active);
CREATE INDEX IF NOT EXISTS idx_banners_dates ON banners(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_banners_sort ON banners(sort_order);

-- =====================================================================
-- 3. Kampanyalı Paketler (Bundle) Modülü
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
INSERT INTO bundle_items (bundle_id, product_id, quantity)
SELECT 
  (SELECT id FROM bundles WHERE name = 'Yılbaşı Paketi 🎄' LIMIT 1),
  '1',
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

-- =====================================================================
-- 4. Satış Analitik & Raporlar Modülü
-- =====================================================================

-- 🌸 Satış Analitik Tablosu (Günlük özet veriler)
CREATE TABLE IF NOT EXISTS sales_analytics (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date            DATE NOT NULL UNIQUE,            -- Tarih
  total_orders    INTEGER DEFAULT 0,               -- Toplam sipariş sayısı
  total_revenue   NUMERIC(15, 2) DEFAULT 0,        -- Toplam gelir
  average_order_value NUMERIC(10, 2) DEFAULT 0,    -- Ortalama sipariş değeri
  unique_customers INTEGER DEFAULT 0,             -- Benzersiz müşteri sayısı
  coupon_usage    INTEGER DEFAULT 0,               -- Kupon kullanım sayısı
  coupon_discount_total NUMERIC(10, 2) DEFAULT 0,  -- Kupon ile toplam indirim
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT sales_analytics_revenue_check CHECK (total_revenue >= 0),
  CONSTRAINT sales_analytics_orders_check CHECK (total_orders >= 0)
);

-- 🌸 Ürün Satış Analitik Tablosu (Ürün bazlı satış verileri)
CREATE TABLE IF NOT EXISTS product_sales_analytics (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      TEXT NOT NULL,                    -- Ürün ID
  product_name    TEXT NOT NULL,                    -- Ürün adı
  date            DATE NOT NULL,                    -- Tarih
  quantity_sold   INTEGER DEFAULT 0,               -- Satılan adet
  revenue         NUMERIC(10, 2) DEFAULT 0,         -- Elde edilen gelir
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT product_sales_quantity_check CHECK (quantity_sold >= 0),
  CONSTRAINT product_sales_revenue_check CHECK (revenue >= 0),
  UNIQUE(product_id, date)
);

-- 🌸 Kategori Satış Analitik Tablosu (Kategori bazlı satış verileri)
CREATE TABLE IF NOT EXISTS category_sales_analytics (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id     TEXT NOT NULL,                    -- Kategori ID
  category_name   TEXT NOT NULL,                    -- Kategori adı
  date            DATE NOT NULL,                    -- Tarih
  total_orders    INTEGER DEFAULT 0,               -- Toplam sipariş sayısı
  total_revenue   NUMERIC(10, 2) DEFAULT 0,        -- Toplam gelir
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT category_sales_orders_check CHECK (total_orders >= 0),
  CONSTRAINT category_sales_revenue_check CHECK (total_revenue >= 0),
  UNIQUE(category_id, date)
);

-- 🌸 Kupon Performans Analitik Tablosu
CREATE TABLE IF NOT EXISTS coupon_analytics (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id       UUID NOT NULL,                    -- Kupon ID
  coupon_code     TEXT NOT NULL,                    -- Kupon kodu
  date            DATE NOT NULL,                    -- Tarih
  usage_count     INTEGER DEFAULT 0,               -- Kullanım sayısı
  discount_total  NUMERIC(10, 2) DEFAULT 0,        -- Toplam indirim tutarı
  revenue_generated NUMERIC(10, 2) DEFAULT 0,      -- Kupon ile elde edilen gelir
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT coupon_analytics_usage_check CHECK (usage_count >= 0),
  CONSTRAINT coupon_analytics_discount_check CHECK (discount_total >= 0),
  UNIQUE(coupon_id, date)
);

-- 🌸 updated_at otomatik güncelleme trigger'ları
CREATE TRIGGER update_sales_analytics_updated_at
  BEFORE UPDATE ON sales_analytics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_sales_analytics_updated_at
  BEFORE UPDATE ON product_sales_analytics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_category_sales_analytics_updated_at
  BEFORE UPDATE ON category_sales_analytics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coupon_analytics_updated_at
  BEFORE UPDATE ON coupon_analytics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 🌸 İndeksler
CREATE INDEX IF NOT EXISTS idx_sales_analytics_date ON sales_analytics(date);
CREATE INDEX IF NOT EXISTS idx_product_sales_date ON product_sales_analytics(date);
CREATE INDEX IF NOT EXISTS idx_product_sales_product ON product_sales_analytics(product_id);
CREATE INDEX IF NOT EXISTS idx_category_sales_date ON category_sales_analytics(date);
CREATE INDEX IF NOT EXISTS idx_category_sales_category ON category_sales_analytics(category_id);
CREATE INDEX IF NOT EXISTS idx_coupon_analytics_date ON coupon_analytics(date);
CREATE INDEX IF NOT EXISTS idx_coupon_analytics_coupon ON coupon_analytics(coupon_id);

-- =====================================================================
-- MIGRATION TAMAMLANDI
-- =====================================================================
