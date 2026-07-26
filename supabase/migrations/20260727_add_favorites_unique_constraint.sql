-- =====================================================================
-- favorites tablosunda (user_id, product_id) tekil olsun
-- (Kod zaten "23505 unique violation" hatasını bekleyip yönetiyordu,
--  ama DB'de bu kısıt yoktu → aynı ürün bir kullanıcı için birden
--  fazla satır olarak birikebiliyordu)
-- =====================================================================

-- Önce olası mükerrer kayıtları temizle (en eski satırı tut)
DELETE FROM favorites a
USING favorites b
WHERE a.user_id = b.user_id
  AND a.product_id = b.product_id
  AND a.created_at > b.created_at;

ALTER TABLE favorites
ADD CONSTRAINT favorites_user_product_unique UNIQUE (user_id, product_id);
