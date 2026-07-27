-- =====================================================================
-- Sales Analytics tabloları - Satış analitiği
-- =====================================================================

CREATE TABLE IF NOT EXISTS sales_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  total_orders integer DEFAULT 0 CHECK (total_orders >= 0),
  total_revenue numeric DEFAULT 0 CHECK (total_revenue >= 0::numeric),
  average_order_value numeric DEFAULT 0,
  unique_customers integer DEFAULT 0,
  coupon_usage integer DEFAULT 0,
  coupon_discount_total numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT sales_analytics_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS product_sales_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id text NOT NULL,
  product_name text NOT NULL,
  date date NOT NULL,
  quantity_sold integer DEFAULT 0 CHECK (quantity_sold >= 0),
  revenue numeric DEFAULT 0 CHECK (revenue >= 0::numeric),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT product_sales_analytics_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS category_sales_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  category_id text NOT NULL,
  category_name text NOT NULL,
  date date NOT NULL,
  total_orders integer DEFAULT 0 CHECK (total_orders >= 0),
  total_revenue numeric DEFAULT 0 CHECK (total_revenue >= 0::numeric),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT category_sales_analytics_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS sales_analytics_date_idx ON sales_analytics(date);
CREATE INDEX IF NOT EXISTS product_sales_analytics_date_idx ON product_sales_analytics(date);
CREATE INDEX IF NOT EXISTS product_sales_analytics_product_id_idx ON product_sales_analytics(product_id);
CREATE INDEX IF NOT EXISTS category_sales_analytics_date_idx ON category_sales_analytics(date);
CREATE INDEX IF NOT EXISTS category_sales_analytics_category_id_idx ON category_sales_analytics(category_id);

ALTER TABLE sales_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_sales_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_sales_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Adminler satış analizlerini görebilir"
  ON sales_analytics FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Adminler ürün satış analizlerini görebilir"
  ON product_sales_analytics FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Adminler kategori satış analizlerini görebilir"
  ON category_sales_analytics FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );
