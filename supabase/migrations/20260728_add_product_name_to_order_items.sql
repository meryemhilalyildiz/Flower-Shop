-- =====================================================================
-- order_items tablosuna product_name sütunu ekle
-- =====================================================================

ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS product_name text;
