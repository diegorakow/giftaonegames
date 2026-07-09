
-- Function to cancel stale pending orders (older than 30 minutes)
CREATE OR REPLACE FUNCTION public.cancel_stale_pending_orders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE orders
  SET status = 'cancelled', updated_at = now()
  WHERE status = 'pending'
    AND created_at < now() - INTERVAL '30 minutes';
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;
