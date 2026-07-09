-- ============================================
-- SECURITY FIX: Block all user SELECT on codes_inventory
-- Only service role / server functions can access codes
-- ============================================

-- 1. Drop existing policy that allows admin access (we'll recreate it more securely)
DROP POLICY IF EXISTS "Admins can manage codes" ON public.codes_inventory;

-- 2. Create a policy that denies ALL user-initiated SELECT
-- No one can read codes directly from the client - must use server function
CREATE POLICY "No direct client access to codes"
ON public.codes_inventory
FOR SELECT
USING (false);

-- 3. Admin can still INSERT/UPDATE/DELETE codes (for inventory management)
CREATE POLICY "Admins can insert codes"
ON public.codes_inventory
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update codes"
ON public.codes_inventory
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete codes"
ON public.codes_inventory
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. Create a secure server-side function to get code for a paid order
-- This function uses SECURITY DEFINER to bypass RLS and access codes
CREATE OR REPLACE FUNCTION public.get_code_for_order_item(
  p_user_id UUID,
  p_order_item_id UUID,
  p_code_id UUID
)
RETURNS TABLE (code TEXT, product_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_user_id UUID;
  v_order_status TEXT;
  v_rate_limit_ok BOOLEAN;
BEGIN
  -- 1. Verify the order item belongs to a paid order owned by this user
  SELECT o.user_id, o.status INTO v_order_user_id, v_order_status
  FROM orders o
  INNER JOIN order_items oi ON oi.order_id = o.id
  WHERE oi.id = p_order_item_id;

  IF v_order_user_id IS NULL THEN
    RAISE EXCEPTION 'Order item not found';
  END IF;

  IF v_order_user_id != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: order does not belong to user';
  END IF;

  IF v_order_status != 'paid' THEN
    RAISE EXCEPTION 'Order is not paid';
  END IF;

  -- 2. Check rate limit (5 attempts per hour per order item)
  SELECT check_reveal_rate_limit(p_user_id, p_order_item_id) INTO v_rate_limit_ok;
  
  IF NOT v_rate_limit_ok THEN
    RAISE EXCEPTION 'Rate limit exceeded. Try again in 1 hour.';
  END IF;

  -- 3. Verify the code belongs to this order item
  IF NOT EXISTS (
    SELECT 1 FROM codes_inventory ci
    WHERE ci.id = p_code_id
    AND ci.order_item_id = p_order_item_id
    AND ci.is_sold = true
  ) THEN
    RAISE EXCEPTION 'Code not found or not assigned to this order';
  END IF;

  -- 4. Return the code (bypasses RLS because SECURITY DEFINER)
  RETURN QUERY
  SELECT ci.code, oi.product_name
  FROM codes_inventory ci
  INNER JOIN order_items oi ON oi.id = ci.order_item_id
  WHERE ci.id = p_code_id
  AND ci.order_item_id = p_order_item_id;
END;
$$;

-- 5. Create function to get code IDs (not values) for an order item
-- This is safe to call from client since it only returns IDs
CREATE OR REPLACE FUNCTION public.get_code_ids_for_order_item(
  p_user_id UUID,
  p_order_item_id UUID
)
RETURNS TABLE (code_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_user_id UUID;
  v_order_status TEXT;
BEGIN
  -- Verify ownership and paid status
  SELECT o.user_id, o.status INTO v_order_user_id, v_order_status
  FROM orders o
  INNER JOIN order_items oi ON oi.order_id = o.id
  WHERE oi.id = p_order_item_id;

  IF v_order_user_id IS NULL OR v_order_user_id != p_user_id THEN
    RETURN; -- Return empty, don't leak info
  END IF;

  IF v_order_status != 'paid' THEN
    RETURN; -- Return empty for non-paid orders
  END IF;

  -- Return only IDs, not codes
  RETURN QUERY
  SELECT ci.id
  FROM codes_inventory ci
  WHERE ci.order_item_id = p_order_item_id
  AND ci.is_sold = true;
END;
$$;

-- 6. Create a secure function for assigning codes to orders (server-side only)
-- This should be called by an edge function or trigger, not directly by users
CREATE OR REPLACE FUNCTION public.assign_codes_to_order(p_order_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_status TEXT;
  v_item RECORD;
  v_code RECORD;
  v_codes_assigned INTEGER := 0;
BEGIN
  -- Verify order is paid
  SELECT status INTO v_order_status FROM orders WHERE id = p_order_id;
  
  IF v_order_status != 'paid' THEN
    RAISE EXCEPTION 'Order must be paid before assigning codes';
  END IF;

  -- Loop through order items
  FOR v_item IN 
    SELECT oi.id, oi.product_id, oi.quantity
    FROM order_items oi
    WHERE oi.order_id = p_order_id
  LOOP
    -- For each quantity, assign an available code
    FOR i IN 1..v_item.quantity LOOP
      -- Lock and select an available code
      SELECT id INTO v_code
      FROM codes_inventory
      WHERE product_id = v_item.product_id
      AND is_sold = false
      AND order_item_id IS NULL
      FOR UPDATE SKIP LOCKED
      LIMIT 1;

      IF v_code.id IS NOT NULL THEN
        -- Mark as sold and assign to order item
        UPDATE codes_inventory
        SET is_sold = true,
            sold_at = now(),
            order_item_id = v_item.id
        WHERE id = v_code.id;
        
        v_codes_assigned := v_codes_assigned + 1;
      END IF;
    END LOOP;
  END LOOP;

  RETURN v_codes_assigned;
END;
$$;