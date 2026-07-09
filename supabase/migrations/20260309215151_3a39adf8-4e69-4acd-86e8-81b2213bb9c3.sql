-- Remove the policy that lets users view their own audit logs (exposes IP addresses)
DROP POLICY IF EXISTS "Users can view own audit logs" ON public.audit_logs;

-- Remove the policy that lets users insert audit logs directly (should be done server-side)
DROP POLICY IF EXISTS "Authenticated users can insert own audit logs" ON public.audit_logs;