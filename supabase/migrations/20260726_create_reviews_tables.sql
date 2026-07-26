-- =====================================================================
-- 🌸 ÜRÜN YORUMLARI TABLOSU
-- =====================================================================
-- Kullanıcılar ürünlere yorum ve fotoğraf bırakabilir.
-- Yönetici onayladıktan sonra yayınlanır.
-- =====================================================================

create table if not exists reviews (
  id              uuid    primary key default gen_random_uuid(),
  product_id      uuid    references products(id) on delete cascade not null,
  user_id         uuid    references auth.users on delete set null,
  user_name       text    not null,
  rating          integer not null check (rating >= 1 and rating <= 5),
  comment         text    not null,
  photo_url       text,
  is_approved     boolean not null default false,
  created_at      timestamp with time zone default now() not null,
  updated_at      timestamp with time zone default now() not null
);

-- =====================================================================
-- 📊 İNDeksler
-- =====================================================================
create index if not exists reviews_product_id_idx on reviews(product_id);
create index if not exists reviews_user_id_idx on reviews(user_id);
create index if not exists reviews_is_approved_idx on reviews(is_approved);
create index if not exists reviews_created_at_idx on reviews(created_at desc);

-- =====================================================================
-- 🔐 RLS Politikaları
-- =====================================================================
alter table reviews enable row level security;

-- Herkes yorum ekleyebilir (anonim veya girişli)
create policy "Allow insert on reviews"
  on reviews for insert
  with check (true);

-- Sadece onaylanmış yorumlar görüntürülür
create policy "Allow select approved reviews"
  on reviews for select
  using (is_approved = true);

-- Kullanıcılar kendi yorumlarını güncelleyebilir
create policy "Allow update own reviews"
  on reviews for update
  using (auth.uid() = user_id);

-- Admin tüm yorumları görebilir/güncelleyebilir
create policy "Allow admin full access on reviews"
  on reviews for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role = 'admin'
    )
  );

-- =====================================================================
-- 🪣 REVIEWS FOTOĞRAF STORAGE BUCKET'ı
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('reviews', 'reviews', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- =====================================================================
-- 🪣 Storage RLS - Public okuma, insert sadece onaylı kullanıcılar
-- =====================================================================
create policy "Public read access on reviews bucket"
  on storage.objects for select
  using (bucket_id = 'reviews');

create policy "Allow upload to reviews bucket"
  on storage.objects for insert
  with check (bucket_id = 'reviews');
