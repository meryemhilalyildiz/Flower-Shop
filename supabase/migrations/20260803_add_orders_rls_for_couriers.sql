-- Enable RLS on orders table if not already enabled
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON public.orders;
DROP POLICY IF EXISTS "Service role can do everything" ON public.orders;

-- Allow anonymous users to read all orders (for courier access)
CREATE POLICY "Anonymous users can read all orders" 
ON public.orders FOR SELECT 
TO anon, authenticated 
USING (true);

-- Allow authenticated users to insert orders
CREATE POLICY "Authenticated users can insert orders" 
ON public.orders FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Allow authenticated users to update orders
CREATE POLICY "Authenticated users can update orders" 
ON public.orders FOR UPDATE 
TO authenticated 
USING (true);

-- Allow service role to do everything
CREATE POLICY "Service role can do everything" 
ON public.orders FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);
