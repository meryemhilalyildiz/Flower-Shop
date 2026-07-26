-- =====================================================================
-- İndirim Kuponları Modülü
-- Migration: coupons tablosu
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
