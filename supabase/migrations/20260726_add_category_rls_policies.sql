-- =====================================================================
-- Kategori tablosu RLS politikaları
-- =====================================================================

-- RLS'yi etkinleştir
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Tüm mevcut politikaları temizle (herhangi bir isimde olsun)
DO $$
DECLARE
  policy_name text;
BEGIN
  FOR policy_name IN
    SELECT polname FROM pg_policy WHERE polrelid = 'categories'::regclass
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON categories', policy_name);
  END LOOP;
END $$;

-- Herkese okuma erişimi (anasayfa için)
CREATE POLICY "Public read access" ON categories
FOR SELECT USING (true);

-- Yetkili kullanıcılar ekleme yapabilsin
CREATE POLICY "Authenticated insert" ON categories
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Yetkili kullanıcılar güncelleme yapabilsin
CREATE POLICY "Authenticated update" ON categories
FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Yetkili kullanıcılar silebilsin
CREATE POLICY "Authenticated delete" ON categories
FOR DELETE USING (auth.uid() IS NOT NULL);
