-- Revoke SELECT on affiliate_url from anon and authenticated roles
-- Only service_role (used by edge functions) can read it
REVOKE SELECT ON public.offers FROM anon, authenticated;
GRANT SELECT (id, product_id, price, list_price, discount_pct, active, created_at, updated_at, partner, currency, partner_landing_url) ON public.offers TO anon, authenticated;