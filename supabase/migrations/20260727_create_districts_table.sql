-- =====================================================================
-- Districts tablosu - İlçe bazlı teslimat ücretleri
-- =====================================================================

CREATE TABLE IF NOT EXISTS districts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  delivery_fee numeric NOT NULL DEFAULT 25,
  distance_coefficient numeric NOT NULL DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT districts_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS districts_name_idx ON districts(name);
CREATE INDEX IF NOT EXISTS districts_is_active_idx ON districts(is_active);

ALTER TABLE districts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Herkes ilçeleri görebilir"
  ON districts FOR SELECT
  USING (true);

CREATE POLICY "Adminler ilçeleri yönetebilir"
  ON districts FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );
