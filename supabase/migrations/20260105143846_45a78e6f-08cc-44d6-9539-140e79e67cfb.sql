-- Fix books table RLS policies to properly check admin role
-- Drop existing policies
DROP POLICY IF EXISTS "Admin Delete Access" ON public.books;
DROP POLICY IF EXISTS "Admin Full Read Access" ON public.books;
DROP POLICY IF EXISTS "Admin Insert Access" ON public.books;
DROP POLICY IF EXISTS "Admin Update Access" ON public.books;

-- Recreate policies with proper is_admin() checks
CREATE POLICY "Admin Full Read Access" ON public.books
  FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admin Insert Access" ON public.books
  FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admin Update Access" ON public.books
  FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "Admin Delete Access" ON public.books
  FOR DELETE
  USING (is_admin(auth.uid()));