-- =====================================================================
-- shipping_rules tablosuna created_at/updated_at ekle
-- (Kod bu alanları zaten okuyordu ama tabloda yoktu)
-- =====================================================================

ALTER TABLE shipping_rules
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_shipping_rules_updated_at ON shipping_rules;
CREATE TRIGGER update_shipping_rules_updated_at
  BEFORE UPDATE ON shipping_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
