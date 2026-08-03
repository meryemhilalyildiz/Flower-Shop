-- Add password field to couriers table for courier authentication
ALTER TABLE public.couriers 
ADD COLUMN password_hash text;

-- Add index on email for faster login queries
CREATE INDEX IF NOT EXISTS couriers_email_idx ON public.couriers(email);

-- Add comment to document the password field
COMMENT ON COLUMN public.couriers.password_hash IS 'Hashed password for courier login authentication';
