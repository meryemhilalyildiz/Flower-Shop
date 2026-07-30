-- =====================================================================
-- İptal Talebi Durumu Ekleme
-- =====================================================================

-- Sipariş tablosuna cancellation_requested durumunu ekle
ALTER TABLE orders 
  DROP CONSTRAINT IF EXISTS orders_status_check,
  ADD CONSTRAINT orders_status_check 
  CHECK (status = ANY (ARRAY['pending'::text, 'processing'::text, 'shipped'::text, 'delivered'::text, 'cancellation_requested'::text, 'cancelled'::text]));

-- İptal talebi için önceki durumu saklamak için yeni kolon ekle
ALTER TABLE orders ADD COLUMN IF NOT EXISTS previous_status text;

-- İndeks ekle
CREATE INDEX IF NOT EXISTS orders_cancellation_requested_idx ON orders(status) WHERE status = 'cancellation_requested';
