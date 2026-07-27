-- =====================================================================
-- Banners tablosu - Ana sayfa bannerları
-- =====================================================================

CREATE TABLE IF NOT EXISTS banners (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  subtitle text,
  image_url text NOT NULL,
  button_text text,
  link_url text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT banners_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS banners_is_active_idx ON banners(is_active);

ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Herkes aktif bannerları görebilir"
  ON banners FOR SELECT
  USING (is_active = true);

CREATE POLICY "Adminler bannerları yönetebilir"
  ON banners FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );
