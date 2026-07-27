-- =====================================================================
-- wiki_entries tablosunda hiç RLS politikası tanımlı değildi
-- (RLS açık ama izin veren bir kural yoktu) → admin panelden
-- kart eklerken/güncellerken 403 Forbidden hatası alınıyordu.
-- =====================================================================

ALTER TABLE wiki_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Herkes wiki kartlarını görebilir" ON wiki_entries;
CREATE POLICY "Herkes wiki kartlarını görebilir"
  ON wiki_entries FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Adminler wiki kartı yönetebilir" ON wiki_entries;
CREATE POLICY "Adminler wiki kartı yönetebilir"
  ON wiki_entries FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );
