-- =====================================================================
-- Products Tablosu için RLS (Row Level Security) Politikaları
-- =====================================================================
-- Bu migration, admin'den eklenen ürünlerin mağazada görünmesini sağlar
-- =====================================================================

-- RLS'yi aktifleştir
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Mevcut politikaları temizle
DROP POLICY IF EXISTS "Public can read products" ON products;
DROP POLICY IF EXISTS "Admins can manage products" ON products;

-- Herkes aktif ürünleri görebilir
CREATE POLICY "Public can read products"
  ON products FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Adminler tüm ürünleri yönetebilir
CREATE POLICY "Admins can manage products"
  ON products FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
