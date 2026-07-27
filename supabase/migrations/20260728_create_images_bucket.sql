-- Create images bucket for page content images
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Note: RLS policies on storage.objects require Supabase Dashboard configuration
-- Please go to Supabase Dashboard > Storage > images > Policies to configure:
-- - Public read access for anon and authenticated users
-- - Upload access for authenticated users
