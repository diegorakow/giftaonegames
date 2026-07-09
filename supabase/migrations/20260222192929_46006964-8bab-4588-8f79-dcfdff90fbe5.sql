
-- 1. Add slug column to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS slug text UNIQUE;

-- Generate slugs for existing products
UPDATE public.products SET slug = LOWER(REPLACE(REPLACE(REPLACE(REPLACE(name, ' ', '-'), '(', ''), ')', ''), '.', '')) WHERE slug IS NULL;

-- 2. Create offers table
CREATE TABLE public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  partner text NOT NULL CHECK (partner IN ('NUUVEM', 'HYPE', 'OTHER')),
  price numeric NOT NULL,
  list_price numeric,
  discount_pct numeric,
  currency text NOT NULL DEFAULT 'BRL',
  partner_landing_url text NOT NULL,
  affiliate_url text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- Anyone can view active offers
CREATE POLICY "Anyone can view active offers"
  ON public.offers FOR SELECT
  USING (active = true);

-- Admins can manage all offers
CREATE POLICY "Admins can manage offers"
  ON public.offers FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_offers_updated_at
  BEFORE UPDATE ON public.offers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Create click_events table
CREATE TABLE public.click_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  page_path text,
  referrer text,
  user_agent text,
  ip_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.click_events ENABLE ROW LEVEL SECURITY;

-- Anyone can insert click events (including anonymous)
CREATE POLICY "Anyone can insert click events"
  ON public.click_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins can read click events
CREATE POLICY "Admins can read click events"
  ON public.click_events FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can manage click events
CREATE POLICY "Admins can manage click events"
  ON public.click_events FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));
