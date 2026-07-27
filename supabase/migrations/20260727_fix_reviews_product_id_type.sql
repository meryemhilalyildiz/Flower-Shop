-- =====================================================================
-- reviews.product_id tipi uuid'ydi ama products.id gerçekte text
-- (örn. 'p1', 'kirmizi-gul-buketi' gibi UUID olmayan id'ler).
-- Bu yüzden UUID formatında olmayan ürünler için yorum eklenemiyordu.
-- =====================================================================

ALTER TABLE reviews
ALTER COLUMN product_id TYPE text USING product_id::text;

-- Artık products.id (text) ile gerçek bir foreign key kurulabilir
ALTER TABLE reviews
ADD CONSTRAINT reviews_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
