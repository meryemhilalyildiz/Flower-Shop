-- =====================================================================
-- Kategori görselleri için storage bucket (Supabase'de 'categories' bucket'ı var)
-- =====================================================================
-- Not: Supabase'de zaten 'categories' adlı bir bucket bulunmaktadır.
-- Bu migration sadece dokümantasyon amaçlıdır.
-- Bucket yoksa aşağıdaki SQL'i çalıştırın:

-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES ('categories', 'categories', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
-- ON CONFLICT (id) DO NOTHING;
