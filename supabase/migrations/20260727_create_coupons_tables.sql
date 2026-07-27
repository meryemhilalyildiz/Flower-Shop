-- =====================================================================
-- Coupons ve Coupon Analytics tabloları - Kupon sistemi
-- =====================================================================

CREATE TABLE IF NOT EXISTS coupons (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL CHECK (discount_type = ANY (ARRAY['percentage'::text, 'fixed'::text])),
  discount_value numeric NOT NULL CHECK (discount_value > 0::numeric),
  usage_limit integer NOT NULL DEFAULT 100,
  used_count integer NOT NULL DEFAULT 0,
  min_order_amount numeric DEFAULT 0,
  expires_at timestamp with time zone NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT coupons_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS coupon_analytics (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  coupon_code text NOT NULL,
  order_id uuid,
  user_id uuid,
  discount_amount numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT coupon_analytics_pkey PRIMARY KEY (id),
  CONSTRAINT coupon_analytics_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL,
  CONSTRAINT coupon_analytics_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS coupons_code_idx ON coupons(code);
CREATE INDEX IF NOT EXISTS coupons_is_active_idx ON coupons(is_active);
CREATE INDEX IF NOT EXISTS coupon_analytics_coupon_code_idx ON coupon_analytics(coupon_code);
CREATE INDEX IF NOT EXISTS coupon_analytics_order_id_idx ON coupon_analytics(order_id);

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Herkes aktif kuponları görebilir"
  ON coupons FOR SELECT
  USING (is_active = true);

CREATE POLICY "Adminler kuponları yönetebilir"
  ON coupons FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Adminler kupon analizlerini görebilir"
  ON coupon_analytics FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );
