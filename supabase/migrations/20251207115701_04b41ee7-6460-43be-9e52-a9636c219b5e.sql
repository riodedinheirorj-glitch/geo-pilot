-- Drop the overly permissive policy that allows any authenticated user to insert
DROP POLICY IF EXISTS "Sistema pode inserir transações" ON transactions;

-- Create a restrictive policy that only allows users to insert their own transactions
-- Note: System-level transaction inserts (like process_download) use SECURITY DEFINER functions
CREATE POLICY "Users can insert own transactions" ON transactions
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());