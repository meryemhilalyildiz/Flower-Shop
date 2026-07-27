-- =====================================================================
-- Bundles ve Bundle Items tabloları - Ürün paketleri
-- =====================================================================

CREATE TABLE IF NOT EXISTS bundles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  image_url text NOT NULL,
  original_price numeric NOT NULL,
  bundle_price numeric NOT NULL CHECK (bundle_price > 0::numeric),
  discount_percentage numeric,
  is_active boolean DEFAULT true,
  is_limited boolean DEFAULT false,
  stock_quantity integer CHECK (stock_quantity IS NULL OR stock_quantity >= 0),
  valid_from timestamp with time zone DEFAULT now(),
  valid_until timestamp with time zone,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT bundles_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS bundle_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  bundle_id uuid NOT NULL,
  product_id text NOT NULL,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT bundle_items_pkey PRIMARY KEY (id),
  CONSTRAINT bundle_items_bundle_id_fkey FOREIGN KEY (bundle_id) REFERENCES public.bundles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS bundles_is_active_idx ON bundles(is_active);
CREATE INDEX IF NOT EXISTS bundle_items_bundle_id_idx ON bundle_items(bundle_id);
CREATE INDEX IF NOT EXISTS bundle_items_product_id_idx ON bundle_items(product_id);

ALTER TABLE bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundle_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Herkes paketleri görebilir"
  ON bundles FOR SELECT
  USING (is_active = true);

CREATE POLICY "Adminler paketleri yönetebilir"
  ON bundles FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Herkes paket öğelerini görebilir"
  ON bundle_items FOR SELECT
  USING (true);

CREATE POLICY "Adminler paket öğelerini yönetebilir"
  ON bundle_items FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );
