-- =====================================================================
-- favorites.product_id tipi uuid'ydi ama products.id gerçekte text
-- (örn. 'p1', 'kirmizi-gul-buketi' gibi UUID olmayan id'ler).
-- Bu yüzden UUID formatında olmayan ürünler favoriye eklenemiyordu:
-- insert sessizce hata veriyor, arayüzde geçici görünüp
-- yenilemede/başka sayfaya geçince kayboluyordu.
-- =====================================================================

ALTER TABLE favorites
ALTER COLUMN product_id TYPE text USING product_id::text;

-- Artık products.id (text) ile gerçek bir foreign key kurulabilir
ALTER TABLE favorites
ADD CONSTRAINT favorites_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- 🌸 Aynı tip uyumsuzluğu wiki_entries.related_product_id'de de var
ALTER TABLE wiki_entries
ALTER COLUMN related_product_id TYPE text USING related_product_id::text;

ALTER TABLE wiki_entries
ADD CONSTRAINT wiki_entries_related_product_id_fkey
  FOREIGN KEY (related_product_id) REFERENCES products(id) ON DELETE SET NULL;
