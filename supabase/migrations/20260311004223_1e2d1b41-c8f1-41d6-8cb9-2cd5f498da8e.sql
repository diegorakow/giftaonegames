-- 1. Fix: Users can only create orders with 'pending' status
DROP POLICY IF EXISTS "Users can create own orders" ON public.orders;
CREATE POLICY "Users can create own orders"
  ON public.orders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- 2. Fix: Remove user INSERT on order_items (must be done server-side only)
DROP POLICY IF EXISTS "Users can insert own order items" ON public.order_items;