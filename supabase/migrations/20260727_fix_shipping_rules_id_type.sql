-- =====================================================================
-- shipping_rules.id tipi BIGINT idi ama schema'da uuid olarak tanımlı
-- Bu migration id'yi uuid'ye çevirir
-- =====================================================================

-- Önce yeni uuid sütunu ekle
ALTER TABLE shipping_rules
ADD COLUMN IF NOT EXISTS new_id uuid DEFAULT gen_random_uuid();

-- Varsayılan değerleri ata (mevcut kayıtlar için)
UPDATE shipping_rules
SET new_id = gen_random_uuid()
WHERE new_id IS NULL;

-- Foreign key'leri ve diğer constraint'leri güncelle
-- Önce trigger'ı geçici olarak kaldır
DROP TRIGGER IF EXISTS update_shipping_rules_updated_at ON shipping_rules;

-- Primary key'i yeni sütuna taşı
ALTER TABLE shipping_rules
DROP CONSTRAINT shipping_rules_pkey;

ALTER TABLE shipping_rules
ADD CONSTRAINT shipping_rules_pkey PRIMARY KEY (new_id);

-- Eski id sütununu sil
ALTER TABLE shipping_rules
DROP COLUMN IF EXISTS id;

-- new_id sütununu id olarak yeniden adlandır
ALTER TABLE shipping_rules
RENAME COLUMN new_id TO id;

-- Trigger'ı tekrar oluştur
CREATE TRIGGER update_shipping_rules_updated_at
  BEFORE UPDATE ON shipping_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
