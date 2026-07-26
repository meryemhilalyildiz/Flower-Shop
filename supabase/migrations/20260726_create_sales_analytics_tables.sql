-- =====================================================================
-- Satış Analitik & Raporlar Modülü
-- Migration: sales_analytics tablosu
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

-- 🌸 updated_at otomatik güncelleme trigger'ı
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
