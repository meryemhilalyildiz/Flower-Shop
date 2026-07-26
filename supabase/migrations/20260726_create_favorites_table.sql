-- =====================================================================
-- 🌸 FAVORİTES TABLOSU
-- =====================================================================
-- Kullanıcılar ürünleri favorilerine ekleyebilir.
-- - Girişli kullanıcılar: Supabase 'favorites' tablosunda saklanır
-- - Anonim kullanıcılar: localStorage'da saklanır (frontend)
-- - Kullanıcı giriş yaptığında localStorage favorileri Supabase'e aktarılır
-- =====================================================================

create table if not exists favorites (
  id          uuid    primary key default gen_random_uuid(),
  user_id     uuid    references auth.users on delete cascade not null,
  product_id  uuid    references products(id) on delete cascade not null,
  created_at  timestamp with time zone default now() not null,
  unique (user_id, product_id)
);

-- =====================================================================
-- 📊 İNDeksler
-- =====================================================================
create index if not exists favorites_user_id_idx on favorites(user_id);
create index if not exists favorites_product_id_idx on favorites(product_id);
create index if not exists favorites_created_at_idx on favorites(created_at desc);

-- =====================================================================
-- 🔐 RLS Politikaları
-- =====================================================================
alter table favorites enable row level security;

-- Kullanıcılar sadece kendi favorilerini görebilir
create policy "Allow select own favorites"
  on favorites for select
  using (auth.uid() = user_id);

-- Kullanıcılar kendi favorilerine ekleyebilir
create policy "Allow insert own favorites"
  on favorites for insert
  with check (auth.uid() = user_id);

-- Kullanıcılar kendi favorilerinden çıkarabilir
create policy "Allow delete own favorites"
  on favorites for delete
  using (auth.uid() = user_id);

-- Admin tüm favorileri görebilir
create policy "Allow admin full access on favorites"
  on favorites for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role = 'admin'
    )
  );
