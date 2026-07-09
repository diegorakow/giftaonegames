
-- Recreate get_code_ids_for_order_item without p_user_id parameter
CREATE OR REPLACE FUNCTION public.get_code_ids_for_order_item(p_order_item_id uuid)
RETURNS TABLE(code_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_order_user_id UUID;
  v_order_status TEXT;
BEGIN
  SELECT o.user_id, o.status INTO v_order_user_id, v_order_status
  FROM orders o
  INNER JOIN order_items oi ON oi.order_id = o.id
  WHERE oi.id = p_order_item_id;

  IF v_order_user_id IS NULL OR v_order_user_id != auth.uid() THEN
    RETURN;
  END IF;

  IF v_order_status != 'paid' THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT ci.id
  FROM codes_inventory ci
  WHERE ci.order_item_id = p_order_item_id
  AND ci.is_sold = true;
END;
$function$;

-- Recreate get_code_for_order_item without p_user_id parameter
CREATE OR REPLACE FUNCTION public.get_code_for_order_item(p_order_item_id uuid, p_code_id uuid)
RETURNS TABLE(code text, product_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_order_user_id UUID;
  v_order_status TEXT;
  v_rate_limit_ok BOOLEAN;
BEGIN
  SELECT o.user_id, o.status INTO v_order_user_id, v_order_status
  FROM orders o
  INNER JOIN order_items oi ON oi.order_id = o.id
  WHERE oi.id = p_order_item_id;

  IF v_order_user_id IS NULL THEN
    RAISE EXCEPTION 'Order item not found';
  END IF;

  IF v_order_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: order does not belong to user';
  END IF;

  IF v_order_status != 'paid' THEN
    RAISE EXCEPTION 'Order is not paid';
  END IF;

  SELECT check_reveal_rate_limit(auth.uid(), p_order_item_id) INTO v_rate_limit_ok;
  
  IF NOT v_rate_limit_ok THEN
    RAISE EXCEPTION 'Rate limit exceeded. Try again in 1 hour.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM codes_inventory ci
    WHERE ci.id = p_code_id
    AND ci.order_item_id = p_order_item_id
    AND ci.is_sold = true
  ) THEN
    RAISE EXCEPTION 'Code not found or not assigned to this order';
  END IF;

  RETURN QUERY
  SELECT ci.code, oi.product_name
  FROM codes_inventory ci
  INNER JOIN order_items oi ON oi.id = ci.order_item_id
  WHERE ci.id = p_code_id
  AND ci.order_item_id = p_order_item_id;
END;
$function$;

-- Drop the old versions with p_user_id parameter
DROP FUNCTION IF EXISTS public.get_code_ids_for_order_item(uuid, uuid);
DROP FUNCTION IF EXISTS public.get_code_for_order_item(uuid, uuid, uuid);
