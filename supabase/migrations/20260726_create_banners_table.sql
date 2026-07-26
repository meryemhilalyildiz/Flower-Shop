-- =====================================================================
-- Kampanya Bannerları Modülü
-- Migration: banners tablosu
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
