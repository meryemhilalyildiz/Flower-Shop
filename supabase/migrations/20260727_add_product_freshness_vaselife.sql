-- =====================================================================
-- Ürün tazelik skoru ve vazo ömrü sütunları
-- (Admin ürün formunda zaten var olan ama DB'de karşılığı olmayan alanlar)
-- =====================================================================

ALTER TABLE products
ADD COLUMN IF NOT EXISTS freshness_score INTEGER DEFAULT 10 CHECK (freshness_score >= 1 AND freshness_score <= 10),
ADD COLUMN IF NOT EXISTS vase_life_days INTEGER DEFAULT 7 CHECK (vase_life_days >= 1);
