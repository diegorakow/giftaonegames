-- Operational commerce fields for owned digital delivery flows.
-- Keeps the existing catalog/order model and adds supplier/payment tracking.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS cost_price numeric(10,2),
  ADD COLUMN IF NOT EXISTS supplier text,
  ADD COLUMN IF NOT EXISTS supplier_product_id text,
  ADD COLUMN IF NOT EXISTS delivery_eta text DEFAULT 'Entrega automática após pagamento aprovado',
  ADD COLUMN IF NOT EXISTS digital_notice text DEFAULT 'Produto digital. O código fica disponível após confirmação do pagamento.';

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS customer_name text,
  ADD COLUMN IF NOT EXISTS customer_email text,
  ADD COLUMN IF NOT EXISTS customer_phone text,
  ADD COLUMN IF NOT EXISTS amount_paid numeric(10,2),
  ADD COLUMN IF NOT EXISTS payment_provider text DEFAULT 'stripe',
  ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS delivery_status text DEFAULT 'waiting_payment',
  ADD COLUMN IF NOT EXISTS payment_id text,
  ADD COLUMN IF NOT EXISTS supplier_transaction_id text,
  ADD COLUMN IF NOT EXISTS supplier_response jsonb,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'orders_payment_provider_check'
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_payment_provider_check
      CHECK (payment_provider IN ('stripe', 'mercadopago', 'manual', 'other'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'orders_delivery_status_check'
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_delivery_status_check
      CHECK (delivery_status IN ('waiting_payment', 'processing', 'delivered', 'error', 'manual_review'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.delivered_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  order_item_id uuid REFERENCES public.order_items(id) ON DELETE SET NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  pin_code text NOT NULL,
  serial_number text,
  supplier_response jsonb,
  delivered_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  type text NOT NULL,
  message text NOT NULL,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.delivered_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No direct client access to delivered codes" ON public.delivered_codes;
CREATE POLICY "No direct client access to delivered codes"
  ON public.delivered_codes
  FOR SELECT
  USING (false);

DROP POLICY IF EXISTS "Admins can manage delivered codes" ON public.delivered_codes;
CREATE POLICY "Admins can manage delivered codes"
  ON public.delivered_codes
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can view own order logs" ON public.order_logs;
CREATE POLICY "Users can view own order logs"
  ON public.order_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_logs.order_id
        AND orders.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage order logs" ON public.order_logs;
CREATE POLICY "Admins can manage order logs"
  ON public.order_logs
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_orders_payment_id ON public.orders(payment_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_provider ON public.orders(payment_provider);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_status ON public.orders(delivery_status);
CREATE INDEX IF NOT EXISTS idx_delivered_codes_order_id ON public.delivered_codes(order_id);
CREATE INDEX IF NOT EXISTS idx_order_logs_order_id ON public.order_logs(order_id);
