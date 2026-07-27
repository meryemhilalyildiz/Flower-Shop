-- =====================================================================
-- Saved Addresses tablosu - Kullanıcı kayıtlı adresleri
-- =====================================================================

CREATE TABLE IF NOT EXISTS saved_addresses (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  recipient_name text NOT NULL,
  recipient_phone text NOT NULL,
  address text NOT NULL,
  district text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT saved_addresses_pkey PRIMARY KEY (id),
  CONSTRAINT saved_addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS saved_addresses_user_id_idx ON saved_addresses(user_id);

ALTER TABLE saved_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Kullanıcılar kendi adreslerini görebilir"
  ON saved_addresses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar kendi adreslerini ekleyebilir"
  ON saved_addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar kendi adreslerini güncelleyebilir"
  ON saved_addresses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar kendi adreslerini silebilir"
  ON saved_addresses FOR DELETE
  USING (auth.uid() = user_id);
