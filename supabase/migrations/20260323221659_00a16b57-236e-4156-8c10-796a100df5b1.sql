
-- Fix audit_logs: deny all writes from authenticated/anon users
-- Only service_role and triggers can write
CREATE POLICY "Deny all inserts from users"
ON public.audit_logs
FOR INSERT
TO authenticated, anon
WITH CHECK (false);

CREATE POLICY "Deny all updates from users"
ON public.audit_logs
FOR UPDATE
TO authenticated, anon
USING (false)
WITH CHECK (false);

CREATE POLICY "Deny all deletes from users"
ON public.audit_logs
FOR DELETE
TO authenticated, anon
USING (false);
