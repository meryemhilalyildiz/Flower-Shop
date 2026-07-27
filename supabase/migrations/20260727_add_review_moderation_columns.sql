-- =====================================================================
-- Yorum onay/moderasyon ve fotoğraf sütunları
-- (Kod bu alanları zaten kullanıyor ama tabloda karşılığı yoktu)
-- =====================================================================

ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Var olan yorumları (kod bunlara zaten güveniyordu) onaylı say
UPDATE reviews SET is_approved = true WHERE is_approved IS DISTINCT FROM true;

CREATE INDEX IF NOT EXISTS reviews_is_approved_idx ON reviews(is_approved);

-- reviews fotoğraf storage bucket'ı yoksa oluştur
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('reviews', 'reviews', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;
