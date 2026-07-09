
-- Drop the overly permissive policy
DROP POLICY "Anyone can insert click events" ON public.click_events;

-- Create a tighter policy that validates offer_id exists in active offers
CREATE POLICY "Anyone can insert click events for valid offers"
ON public.click_events
FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.offers
    WHERE offers.id = click_events.offer_id
    AND offers.active = true
  )
);
