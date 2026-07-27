-- =====================================================================
-- Orders ve Order Items tabloları - Sipariş sistemi
-- =====================================================================

CREATE TABLE IF NOT EXISTS orders (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  recipient_name text NOT NULL,
  recipient_phone text NOT NULL,
  shipping_address text NOT NULL,
  city text DEFAULT 'Ankara'::text,
  district text,
  delivery_date date,
  note text,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'processing'::text, 'shipped'::text, 'delivered'::text, 'İptal Talebi Alındı'::text, 'cancelled'::text])),
  cancel_reason text,
  total_amount numeric NOT NULL CHECK (total_amount >= 0::numeric),
  discount_amount numeric DEFAULT 0,
  applied_coupon_code text,
  tracking_number text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  subtotal numeric DEFAULT 0,
  delivery_fee numeric DEFAULT 0,
  CONSTRAINT orders_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS order_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  order_id uuid,
  product_id text,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE,
  CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS orders_user_id_idx ON orders(user_id);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items(order_id);
CREATE INDEX IF NOT EXISTS order_items_product_id_idx ON order_items(product_id);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Kullanıcılar kendi siparişlerini görebilir"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar kendi siparişlerini oluşturabilir"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Adminler tüm siparişleri yönetebilir"
  ON orders FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Kullanıcılar kendi sipariş öğelerini görebilir"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Adminler tüm sipariş öğelerini yönetebilir"
  ON order_items FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );
