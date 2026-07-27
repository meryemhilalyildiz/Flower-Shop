-- =====================================================================
-- TÜM MIGRATION - Flower Shop Supabase Database
-- =====================================================================
-- Bu dosya tüm migrationları tek seferde çalıştırmak için birleştirilmiştir.
-- Supabase SQL Editor'da çalıştırın.
-- =====================================================================

-- =====================================================================
-- TABLO OLUŞTURMALAR
-- =====================================================================

-- Favorites Tablosu
CREATE TABLE IF NOT EXISTS favorites (
  id          uuid    primary key default gen_random_uuid(),
  user_id     uuid    references auth.users on delete cascade not null,
  product_id  text    not null,
  created_at  timestamp with time zone default now() not null
);

-- Reviews Tablosu
CREATE TABLE IF NOT EXISTS reviews (
  id              uuid    primary key default gen_random_uuid(),
  product_id      text    not null,
  user_id         uuid    references auth.users on delete set null,
  user_name       text    not null,
  rating          integer not null check (rating >= 1 and rating <= 5),
  comment         text    not null,
  photo_url       text,
  created_at      timestamp with time zone default now() not null,
  updated_at      timestamp with time zone default now() not null
);

-- Store Settings Tablosu
CREATE TABLE IF NOT EXISTS store_settings (
  id              BIGINT PRIMARY KEY DEFAULT 1,
  city            TEXT NOT NULL,
  district        TEXT NOT NULL,
  address         TEXT,
  latitude        NUMERIC(10, 8),
  longitude       NUMERIC(11, 8),
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shipping Rules Tablosu
CREATE TABLE IF NOT EXISTS shipping_rules (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  min_km          integer NOT NULL,
  max_km          integer,
  price           integer,
  delivery_days   integer,
  is_active       boolean,
  sort_order      integer,
  created_at      timestamp with time zone DEFAULT NOW(),
  updated_at      timestamp with time zone DEFAULT NOW()
);

-- Districts Tablosu
CREATE TABLE IF NOT EXISTS districts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  delivery_fee numeric NOT NULL DEFAULT 25,
  distance_coefficient numeric NOT NULL DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT districts_pkey PRIMARY KEY (id)
);

-- Saved Addresses Tablosu
CREATE TABLE IF NOT EXISTS saved_addresses (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  recipient_name text NOT NULL,
  recipient_phone text NOT NULL,
  address text NOT NULL,
  district text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT saved_addresses_pkey PRIMARY KEY (id),
  CONSTRAINT saved_addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Bundles Tablosu
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

-- Bundle Items Tablosu
CREATE TABLE IF NOT EXISTS bundle_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  bundle_id uuid NOT NULL,
  product_id text NOT NULL,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT bundle_items_pkey PRIMARY KEY (id),
  CONSTRAINT bundle_items_bundle_id_fkey FOREIGN KEY (bundle_id) REFERENCES public.bundles(id) ON DELETE CASCADE
);

-- Sales Analytics Tablosu
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

-- Product Sales Analytics Tablosu
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

-- Category Sales Analytics Tablosu
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

-- Banners Tablosu
CREATE TABLE IF NOT EXISTS banners (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  subtitle text,
  image_url text NOT NULL,
  button_text text,
  link_url text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT banners_pkey PRIMARY KEY (id)
);

-- Coupons Tablosu
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

-- Coupon Analytics Tablosu
CREATE TABLE IF NOT EXISTS coupon_analytics (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  coupon_code text NOT NULL,
  order_id uuid,
  user_id uuid,
  discount_amount numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT coupon_analytics_pkey PRIMARY KEY (id)
);

-- Orders Tablosu
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

-- Order Items Tablosu
CREATE TABLE IF NOT EXISTS order_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  order_id uuid,
  product_id text,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT order_items_pkey PRIMARY KEY (id)
);

-- Product Wiki Entries Tablosu
CREATE TABLE IF NOT EXISTS product_wiki_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id text NOT NULL,
  wiki_entry_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT product_wiki_entries_pkey PRIMARY KEY (id),
  CONSTRAINT product_wiki_entries_unique UNIQUE (product_id, wiki_entry_id)
);

-- =====================================================================
-- STORAGE BUCKETS
-- =====================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('reviews', 'reviews', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- =====================================================================
-- SÜTUN EKLEME İŞLEMLERİ
-- =====================================================================

-- Categories tablosuna image ve description sütunları ekle
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS image TEXT,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Categories tablosuna slug sütunu ekle
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS slug TEXT;

-- Mevcut kategoriler için isimden basit bir slug üret
UPDATE categories
SET slug = lower(
  regexp_replace(
    translate(name, 'çğıöşüÇĞİÖŞÜ', 'cgiosuCGIOSU'),
    '[^a-zA-Z0-9]+', '-', 'g'
  )
)
WHERE slug IS NULL OR slug = '';

-- Boşta kalan/tekrarlayan slug'ları id ile benzersizleştir
UPDATE categories a
SET slug = a.slug || '-' || a.id
WHERE EXISTS (
  SELECT 1 FROM categories b
  WHERE b.slug = a.slug AND b.id <> a.id
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'categories_slug_unique' 
    AND conrelid = 'categories'::regclass
  ) THEN
    ALTER TABLE categories
    ADD CONSTRAINT categories_slug_unique UNIQUE (slug);
  END IF;
END $$;

ALTER TABLE categories
ALTER COLUMN slug SET NOT NULL;

-- Products tablosuna freshness_score, vase_life_days, is_active ve slug sütunları ekle
ALTER TABLE products
ADD COLUMN IF NOT EXISTS freshness_score INTEGER DEFAULT 10 CHECK (freshness_score >= 1 AND freshness_score <= 10),
ADD COLUMN IF NOT EXISTS vase_life_days INTEGER DEFAULT 7 CHECK (vase_life_days >= 1),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS slug TEXT;

-- Slug sütunu için trigger fonksiyonu ve trigger oluştur
CREATE OR REPLACE FUNCTION generate_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := lower(regexp_replace(NEW.name, '[^a-zA-Z0-9\s-]', '', 'g'));
    NEW.slug := regexp_replace(NEW.slug, '\s+', '-', 'g');
    NEW.slug := regexp_replace(NEW.slug, '-+', '-', 'g');
    NEW.slug := trim(both '-' from NEW.slug);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS products_slug_trigger ON products;
CREATE TRIGGER products_slug_trigger
BEFORE INSERT OR UPDATE OF name ON products
FOR EACH ROW
EXECUTE FUNCTION generate_slug();

-- Var olan ürünler için slug değerlerini oluştur
UPDATE products
SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9\s-]', '', 'g'))
WHERE slug IS NULL OR slug = '';

UPDATE products
SET slug = regexp_replace(slug, '\s+', '-', 'g')
WHERE slug IS NOT NULL;

UPDATE products
SET slug = regexp_replace(slug, '-+', '-', 'g')
WHERE slug IS NOT NULL;

UPDATE products
SET slug = trim(both '-' from slug)
WHERE slug IS NOT NULL;

-- Reviews tablosuna is_approved, photo_url ve updated_at sütunları ekle
ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Var olan yorumları onaylı say
UPDATE reviews SET is_approved = true WHERE is_approved IS DISTINCT FROM true;

-- =====================================================================
-- TİP DÜZELTMELERİ
-- =====================================================================

-- favorites.product_id tipini uuid'den text'e çevir
ALTER TABLE favorites
ALTER COLUMN product_id TYPE text USING product_id::text;

-- reviews.product_id tipini uuid'den text'e çevir
ALTER TABLE reviews
ALTER COLUMN product_id TYPE text USING product_id::text;

-- wiki_entries.related_product_id tipini uuid'den text'e çevir
ALTER TABLE wiki_entries
ALTER COLUMN related_product_id TYPE text USING related_product_id::text;

-- =====================================================================
-- FOREIGN KEY CONSTRAINTLER
-- =====================================================================

-- Önce favorites tablosunda products tablosunda olmayan product_id'leri temizle
DELETE FROM favorites
WHERE product_id NOT IN (SELECT id FROM products);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'favorites_product_id_fkey' 
    AND conrelid = 'favorites'::regclass
  ) THEN
    ALTER TABLE favorites
    ADD CONSTRAINT favorites_product_id_fkey
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Önce reviews tablosunda products tablosunda olmayan product_id'leri temizle
DELETE FROM reviews
WHERE product_id NOT IN (SELECT id FROM products);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'reviews_product_id_fkey' 
    AND conrelid = 'reviews'::regclass
  ) THEN
    ALTER TABLE reviews
    ADD CONSTRAINT reviews_product_id_fkey
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Önce wiki_entries tablosunda products tablosunda olmayan related_product_id'leri temizle
UPDATE wiki_entries
SET related_product_id = NULL
WHERE related_product_id NOT IN (SELECT id FROM products);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'wiki_entries_related_product_id_fkey' 
    AND conrelid = 'wiki_entries'::regclass
  ) THEN
    ALTER TABLE wiki_entries
    ADD CONSTRAINT wiki_entries_related_product_id_fkey
      FOREIGN KEY (related_product_id) REFERENCES products(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Önce order_items tablosunda orders tablosunda olmayan order_id'leri temizle
DELETE FROM order_items
WHERE order_id NOT IN (SELECT id FROM orders);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'order_items_order_id_fkey' 
    AND conrelid = 'order_items'::regclass
  ) THEN
    ALTER TABLE order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Önce order_items tablosunda products tablosunda olmayan product_id'leri temizle
UPDATE order_items
SET product_id = NULL
WHERE product_id NOT IN (SELECT id FROM products);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'order_items_product_id_fkey' 
    AND conrelid = 'order_items'::regclass
  ) THEN
    ALTER TABLE order_items
    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Önce coupon_analytics tablosunda orders tablosunda olmayan order_id'leri temizle
UPDATE coupon_analytics
SET order_id = NULL
WHERE order_id NOT IN (SELECT id FROM orders);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'coupon_analytics_order_id_fkey' 
    AND conrelid = 'coupon_analytics'::regclass
  ) THEN
    ALTER TABLE coupon_analytics
    ADD CONSTRAINT coupon_analytics_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Önce coupon_analytics tablosunda profiles tablosunda olmayan user_id'leri temizle
UPDATE coupon_analytics
SET user_id = NULL
WHERE user_id NOT IN (SELECT id FROM profiles);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'coupon_analytics_user_id_fkey' 
    AND conrelid = 'coupon_analytics'::regclass
  ) THEN
    ALTER TABLE coupon_analytics
    ADD CONSTRAINT coupon_analytics_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Önce product_wiki_entries tablosunda products tablosunda olmayan product_id'leri temizle
DELETE FROM product_wiki_entries
WHERE product_id NOT IN (SELECT id FROM products);

-- Önce product_wiki_entries tablosunda wiki_entries tablosunda olmayan wiki_entry_id'leri temizle
DELETE FROM product_wiki_entries
WHERE wiki_entry_id NOT IN (SELECT id FROM wiki_entries);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'product_wiki_entries_wiki_entry_id_fkey' 
    AND conrelid = 'product_wiki_entries'::regclass
  ) THEN
    ALTER TABLE product_wiki_entries
    ADD CONSTRAINT product_wiki_entries_wiki_entry_id_fkey FOREIGN KEY (wiki_entry_id) REFERENCES wiki_entries(id) ON DELETE CASCADE;
  END IF;
END $$;

-- =====================================================================
-- UNIQUE CONSTRAINTLER
-- =====================================================================

-- Önce olası mükerrer kayıtları temizle
DELETE FROM favorites a
USING favorites b
WHERE a.user_id = b.user_id
  AND a.product_id = b.product_id
  AND a.created_at > b.created_at;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'favorites_user_product_unique' 
    AND conrelid = 'favorites'::regclass
  ) THEN
    ALTER TABLE favorites
    ADD CONSTRAINT favorites_user_product_unique UNIQUE (user_id, product_id);
  END IF;
END $$;

-- =====================================================================
-- VARSAYILAN VERİLER
-- =====================================================================

-- Varsayılan kategori görselleri
UPDATE categories 
SET image = 'https://images.pexels.com/photos/931796/pexels-photo-931796.jpeg?auto=compress&cs=tinysrgb&w=600'
WHERE image IS NULL;

-- Mağaza ayarları
INSERT INTO store_settings (id, city, district, address, latitude, longitude)
VALUES (1, 'Ankara', 'Çankaya', 'Kızılay Sakarya Cad.', 39.9334, 32.8597)
ON CONFLICT (id) DO NOTHING;

-- Varsayılan kargo kuralları
INSERT INTO shipping_rules (min_km, max_km, price, delivery_days, sort_order) VALUES
  (0,   100,  150, 1, 1),
  (101, 300,  300, 3, 2),
  (301, 600,  500, 5, 3)
ON CONFLICT DO NOTHING;

-- =====================================================================
-- İNDEKSLER
-- =====================================================================

CREATE INDEX IF NOT EXISTS favorites_user_id_idx ON favorites(user_id);
CREATE INDEX IF NOT EXISTS favorites_product_id_idx ON favorites(product_id);
CREATE INDEX IF NOT EXISTS favorites_created_at_idx ON favorites(created_at DESC);

CREATE INDEX IF NOT EXISTS reviews_product_id_idx ON reviews(product_id);
CREATE INDEX IF NOT EXISTS reviews_user_id_idx ON reviews(user_id);
CREATE INDEX IF NOT EXISTS reviews_is_approved_idx ON reviews(is_approved);
CREATE INDEX IF NOT EXISTS reviews_created_at_idx ON reviews(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_shipping_rules_active ON shipping_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_shipping_rules_min_max ON shipping_rules(min_km, max_km);

CREATE INDEX IF NOT EXISTS districts_name_idx ON districts(name);
CREATE INDEX IF NOT EXISTS districts_is_active_idx ON districts(is_active);

CREATE INDEX IF NOT EXISTS saved_addresses_user_id_idx ON saved_addresses(user_id);

CREATE INDEX IF NOT EXISTS bundles_is_active_idx ON bundles(is_active);
CREATE INDEX IF NOT EXISTS bundle_items_bundle_id_idx ON bundle_items(bundle_id);
CREATE INDEX IF NOT EXISTS bundle_items_product_id_idx ON bundle_items(product_id);

CREATE INDEX IF NOT EXISTS sales_analytics_date_idx ON sales_analytics(date);
CREATE INDEX IF NOT EXISTS product_sales_analytics_date_idx ON product_sales_analytics(date);
CREATE INDEX IF NOT EXISTS product_sales_analytics_product_id_idx ON product_sales_analytics(product_id);
CREATE INDEX IF NOT EXISTS category_sales_analytics_date_idx ON category_sales_analytics(date);
CREATE INDEX IF NOT EXISTS category_sales_analytics_category_id_idx ON category_sales_analytics(category_id);

CREATE INDEX IF NOT EXISTS banners_is_active_idx ON banners(is_active);

CREATE INDEX IF NOT EXISTS coupons_code_idx ON coupons(code);
CREATE INDEX IF NOT EXISTS coupons_is_active_idx ON coupons(is_active);
CREATE INDEX IF NOT EXISTS coupon_analytics_coupon_code_idx ON coupon_analytics(coupon_code);
CREATE INDEX IF NOT EXISTS coupon_analytics_order_id_idx ON coupon_analytics(order_id);

CREATE INDEX IF NOT EXISTS orders_user_id_idx ON orders(user_id);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items(order_id);
CREATE INDEX IF NOT EXISTS order_items_product_id_idx ON order_items(product_id);

CREATE INDEX IF NOT EXISTS product_wiki_entries_product_idx ON product_wiki_entries(product_id);
CREATE INDEX IF NOT EXISTS product_wiki_entries_wiki_idx ON product_wiki_entries(wiki_entry_id);

-- =====================================================================
-- RLS (ROW LEVEL SECURITY) AKTİFLEŞTİRME
-- =====================================================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundle_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_sales_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_sales_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_wiki_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE wiki_entries ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- RLS POLİTİKALARI
-- =====================================================================

-- Categories RLS Politikaları
DO $$
DECLARE
  policy_name text;
BEGIN
  FOR policy_name IN
    SELECT polname FROM pg_policy WHERE polrelid = 'categories'::regclass
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON categories', policy_name);
  END LOOP;
END $$;

DROP POLICY IF EXISTS "Public read access" ON categories;
CREATE POLICY "Public read access" ON categories
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated insert" ON categories;
CREATE POLICY "Authenticated insert" ON categories
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated update" ON categories;
CREATE POLICY "Authenticated update" ON categories
FOR UPDATE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated delete" ON categories;
CREATE POLICY "Authenticated delete" ON categories
FOR DELETE USING (auth.uid() IS NOT NULL);

-- Favorites RLS Politikaları
DROP POLICY IF EXISTS "Allow select own favorites" ON favorites;
CREATE POLICY "Allow select own favorites"
  ON favorites for select
  using (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow insert own favorites" ON favorites;
CREATE POLICY "Allow insert own favorites"
  ON favorites for insert
  with check (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow delete own favorites" ON favorites;
CREATE POLICY "Allow delete own favorites"
  ON favorites for delete
  using (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow admin full access on favorites" ON favorites;
CREATE POLICY "Allow admin full access on favorites"
  ON favorites for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role = 'admin'
    )
  );

-- Reviews RLS Politikaları
DROP POLICY IF EXISTS "Allow insert on reviews" ON reviews;
CREATE POLICY "Allow insert on reviews"
  ON reviews for insert
  with check (true);

DROP POLICY IF EXISTS "Allow select approved reviews" ON reviews;
CREATE POLICY "Allow select approved reviews"
  ON reviews for select
  using (is_approved = true);

DROP POLICY IF EXISTS "Allow update own reviews" ON reviews;
CREATE POLICY "Allow update own reviews"
  ON reviews for update
  using (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow admin full access on reviews" ON reviews;
CREATE POLICY "Allow admin full access on reviews"
  ON reviews for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role = 'admin'
    )
  );

-- Districts RLS Politikaları
DROP POLICY IF EXISTS "Herkes ilçeleri görebilir" ON districts;
CREATE POLICY "Herkes ilçeleri görebilir"
  ON districts FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Adminler ilçeleri yönetebilir" ON districts;
CREATE POLICY "Adminler ilçeleri yönetebilir"
  ON districts FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Saved Addresses RLS Politikaları
DROP POLICY IF EXISTS "Kullanıcılar kendi adreslerini görebilir" ON saved_addresses;
CREATE POLICY "Kullanıcılar kendi adreslerini görebilir"
  ON saved_addresses FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Kullanıcılar kendi adreslerini ekleyebilir" ON saved_addresses;
CREATE POLICY "Kullanıcılar kendi adreslerini ekleyebilir"
  ON saved_addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Kullanıcılar kendi adreslerini güncelleyebilir" ON saved_addresses;
CREATE POLICY "Kullanıcılar kendi adreslerini güncelleyebilir"
  ON saved_addresses FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Kullanıcılar kendi adreslerini silebilir" ON saved_addresses;
CREATE POLICY "Kullanıcılar kendi adreslerini silebilir"
  ON saved_addresses FOR DELETE
  USING (auth.uid() = user_id);

-- Bundles RLS Politikaları
DROP POLICY IF EXISTS "Herkes paketleri görebilir" ON bundles;
CREATE POLICY "Herkes paketleri görebilir"
  ON bundles FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Adminler paketleri yönetebilir" ON bundles;
CREATE POLICY "Adminler paketleri yönetebilir"
  ON bundles FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Bundle Items RLS Politikaları
DROP POLICY IF EXISTS "Herkes paket öğelerini görebilir" ON bundle_items;
CREATE POLICY "Herkes paket öğelerini görebilir"
  ON bundle_items FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Adminler paket öğelerini yönetebilir" ON bundle_items;
CREATE POLICY "Adminler paket öğelerini yönetebilir"
  ON bundle_items FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Sales Analytics RLS Politikaları
DROP POLICY IF EXISTS "Adminler satış analizlerini görebilir" ON sales_analytics;
CREATE POLICY "Adminler satış analizlerini görebilir"
  ON sales_analytics FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

DROP POLICY IF EXISTS "Adminler ürün satış analizlerini görebilir" ON product_sales_analytics;
CREATE POLICY "Adminler ürün satış analizlerini görebilir"
  ON product_sales_analytics FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

DROP POLICY IF EXISTS "Adminler kategori satış analizlerini görebilir" ON category_sales_analytics;
CREATE POLICY "Adminler kategori satış analizlerini görebilir"
  ON category_sales_analytics FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Banners RLS Politikaları
DROP POLICY IF EXISTS "Herkes aktif bannerları görebilir" ON banners;
CREATE POLICY "Herkes aktif bannerları görebilir"
  ON banners FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Adminler bannerları yönetebilir" ON banners;
CREATE POLICY "Adminler bannerları yönetebilir"
  ON banners FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Coupons RLS Politikaları
DROP POLICY IF EXISTS "Herkes aktif kuponları görebilir" ON coupons;
CREATE POLICY "Herkes aktif kuponları görebilir"
  ON coupons FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Adminler kuponları yönetebilir" ON coupons;
CREATE POLICY "Adminler kuponları yönetebilir"
  ON coupons FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Coupon Analytics RLS Politikaları
DROP POLICY IF EXISTS "Adminler kupon analizlerini görebilir" ON coupon_analytics;
CREATE POLICY "Adminler kupon analizlerini görebilir"
  ON coupon_analytics FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Orders RLS Politikaları
DROP POLICY IF EXISTS "Kullanıcılar kendi siparişlerini görebilir" ON orders;
CREATE POLICY "Kullanıcılar kendi siparişlerini görebilir"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Kullanıcılar kendi siparişlerini oluşturabilir" ON orders;
CREATE POLICY "Kullanıcılar kendi siparişlerini oluşturabilir"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Adminler tüm siparişleri yönetebilir" ON orders;
CREATE POLICY "Adminler tüm siparişleri yönetebilir"
  ON orders FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Order Items RLS Politikaları
DROP POLICY IF EXISTS "Kullanıcılar kendi sipariş öğelerini görebilir" ON order_items;
CREATE POLICY "Kullanıcılar kendi sipariş öğelerini görebilir"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Adminler tüm sipariş öğelerini yönetebilir" ON order_items;
CREATE POLICY "Adminler tüm sipariş öğelerini yönetebilir"
  ON order_items FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Product Wiki Entries RLS Politikaları
DROP POLICY IF EXISTS "Herkes bakım kartı atamalarını görebilir" ON product_wiki_entries;
CREATE POLICY "Herkes bakım kartı atamalarını görebilir"
  ON product_wiki_entries FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Adminler bakım kartı ataması yapabilir" ON product_wiki_entries;
CREATE POLICY "Adminler bakım kartı ataması yapabilir"
  ON product_wiki_entries FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Wiki Entries RLS Politikaları
DROP POLICY IF EXISTS "Herkes wiki kartlarını görebilir" ON wiki_entries;
CREATE POLICY "Herkes wiki kartlarını görebilir"
  ON wiki_entries FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Adminler wiki kartı yönetebilir" ON wiki_entries;
CREATE POLICY "Adminler wiki kartı yönetebilir"
  ON wiki_entries FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- =====================================================================
-- STORAGE RLS POLİTİKALARI
-- =====================================================================

DROP POLICY IF EXISTS "Public read access on reviews bucket" ON storage.objects;
CREATE POLICY "Public read access on reviews bucket"
  ON storage.objects for select
  using (bucket_id = 'reviews');

DROP POLICY IF EXISTS "Allow upload to reviews bucket" ON storage.objects;
CREATE POLICY "Allow upload to reviews bucket"
  ON storage.objects for insert
  with check (bucket_id = 'reviews');

-- =====================================================================
-- TRIGGER FONKSİYONLARI
-- =====================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================================
-- TRIGGERLAR
-- =====================================================================

DROP TRIGGER IF EXISTS update_store_settings_updated_at ON store_settings;
CREATE TRIGGER update_store_settings_updated_at
  BEFORE UPDATE ON store_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_shipping_rules_updated_at ON shipping_rules;
CREATE TRIGGER update_shipping_rules_updated_at
  BEFORE UPDATE ON shipping_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================================
-- MIGRATION TAMAMLANDI
-- =====================================================================
