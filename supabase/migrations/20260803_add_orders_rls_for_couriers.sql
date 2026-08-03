-- Add 'in_transit' status to the orders status constraint
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders 
ADD CONSTRAINT orders_status_check 
CHECK (status = ANY (ARRAY['pending'::text, 'processing'::text, 'shipped'::text, 'in_transit'::text, 'delivered'::text, 'cancellation_requested'::text, 'cancelled'::text]));
