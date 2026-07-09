
-- Add promo fields to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS is_promo boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS discount_percent integer DEFAULT 0;

-- Create index for promo queries
CREATE INDEX IF NOT EXISTS idx_products_is_promo ON public.products (is_promo) WHERE is_promo = true;
