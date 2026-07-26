-- =====================================================================
-- Kargo Ücretlendirme ve Teslimat Tarihi Hesaplama Modülü
-- Migration: store_settings & shipping_rules tabloları
-- =====================================================================

-- 🌸 Mağaza Ayarları (Admin tarafından güncellenebilir)
-- Tek bir kayıt tutulur (id = 1), güncelleme yapılır
CREATE TABLE IF NOT EXISTS store_settings (
  id              BIGINT PRIMARY KEY DEFAULT 1,
  city            TEXT NOT NULL,           -- İl (örn: "Ankara")
  district        TEXT NOT NULL,           -- İlçe (örn: "Çankaya")
  address         TEXT,                    -- Açık adres (örn: "Kızılay Sakarya Cad.")
  latitude        NUMERIC(10, 8),          -- Koordinat (opsiyonel)
  longitude       NUMERIC(11, 8),          -- Koordinat (opsiyonel)
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 🌸 Kargo Kuralları (Km aralıkları, fiyat, teslimat süresi)
-- Admin panelinden eklenip düzenlenebilir
CREATE TABLE IF NOT EXISTS shipping_rules (
  id              BIGINT PRIMARY KEY DEFAULT gen_random_uuid(),
  min_km          NUMERIC(7, 2) NOT NULL,           -- Minimum km (örn: 0)
  max_km          NUMERIC(7, 2) NOT NULL,           -- Maksimum km (örn: 100)
  price           NUMERIC(10, 2) NOT NULL,          -- Kargo ücreti (TL)
  delivery_days   INTEGER NOT NULL DEFAULT 1,       -- Hazırlık/Teslimat süresi (gün)
  is_active       BOOLEAN DEFAULT true,
  sort_order      INTEGER DEFAULT 0,                -- Sıralama
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT shipping_rules_min_max_check CHECK (min_km <= max_km),
  CONSTRAINT shipping_rules_price_check CHECK (price >= 0),
  CONSTRAINT shipping_rules_days_check CHECK (delivery_days >= 0)
);

-- 🌸 Varsayılan veriler
-- Mağaza: Ankara / Çankaya (Kızılay Sakarya Cad.)
INSERT INTO store_settings (id, city, district, address, latitude, longitude)
VALUES (1, 'Ankara', 'Çankaya', 'Kızılay Sakarya Cad.', 39.9334, 32.8597)
ON CONFLICT (id) DO NOTHING;

-- Varsayılan kargo kuralları
INSERT INTO shipping_rules (min_km, max_km, price, delivery_days, sort_order) VALUES
  (0,   100,  150, 1, 1),
  (101, 300,  300, 3, 2),
  (301, 600,  500, 5, 3)
ON CONFLICT DO NOTHING;

-- 🌸 updated_at otomatik güncelleme trigger'ı
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_store_settings_updated_at
  BEFORE UPDATE ON store_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shipping_rules_updated_at
  BEFORE UPDATE ON shipping_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 🌸 İndeksler
CREATE INDEX IF NOT EXISTS idx_shipping_rules_active ON shipping_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_shipping_rules_min_max ON shipping_rules(min_km, max_km);
