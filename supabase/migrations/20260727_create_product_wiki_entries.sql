-- =====================================================================
-- Bakım rehberi (wiki) kartlarını birden fazla ürüne atayabilmek için
-- çoktan-çoğa ilişki tablosu.
-- (wiki_entries.related_product_id sadece 1 ürüne bağlanabiliyordu,
--  artık bu tablo kullanılacak; eski kolona dokunulmadı, kullanılmayacak.)
-- =====================================================================

CREATE TABLE IF NOT EXISTS product_wiki_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id text NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  wiki_entry_id uuid NOT NULL REFERENCES wiki_entries(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT product_wiki_entries_pkey PRIMARY KEY (id),
  CONSTRAINT product_wiki_entries_unique UNIQUE (product_id, wiki_entry_id)
);

CREATE INDEX IF NOT EXISTS product_wiki_entries_product_idx ON product_wiki_entries(product_id);
CREATE INDEX IF NOT EXISTS product_wiki_entries_wiki_idx ON product_wiki_entries(wiki_entry_id);

ALTER TABLE product_wiki_entries ENABLE ROW LEVEL SECURITY;

-- Herkes okuyabilsin (ürün sayfasında herkese gösterilecek)
CREATE POLICY "Herkes bakım kartı atamalarını görebilir"
  ON product_wiki_entries FOR SELECT
  USING (true);

-- Sadece adminler yönetebilsin
CREATE POLICY "Adminler bakım kartı ataması yapabilir"
  ON product_wiki_entries FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );
