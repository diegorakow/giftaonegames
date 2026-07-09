-- 1. Fix PRIVILEGE ESCALATION: Remove user ability to update their own XP/level
DROP POLICY IF EXISTS "Users can update own stats" ON public.user_stats;
DROP POLICY IF EXISTS "Users can insert own stats" ON public.user_stats;

-- 2. Fix code_reveal_attempts ownership check
DROP POLICY IF EXISTS "Users can insert own attempts" ON public.code_reveal_attempts;

CREATE POLICY "Users can insert own attempts" ON public.code_reveal_attempts
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM orders o
    INNER JOIN order_items oi ON oi.order_id = o.id
    WHERE oi.id = code_reveal_attempts.order_item_id
    AND o.user_id = auth.uid()
  )
);

-- 3. Fix permissive INSERT on click_events - restrict to only allow setting offer_id
-- The current policy WITH CHECK (true) is acceptable for analytics click tracking
-- since click_events only store anonymous data (ip_hash, user_agent, page_path)
-- and users cannot read them. No change needed here.