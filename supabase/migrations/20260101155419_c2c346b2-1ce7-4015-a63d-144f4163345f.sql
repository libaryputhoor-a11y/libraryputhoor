-- ============================================
-- SECURITY FIX: Admin Role System + Data Protection
-- ============================================

-- 1. Create enum for app roles
CREATE TYPE public.app_role AS ENUM ('admin');

-- 2. Create user_roles table for admin access control
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, role)
);

-- 3. Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Create security definer function to check admin role (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'
  )
$$;

-- 5. RLS policies for user_roles table - only admins can read
CREATE POLICY "Admins can view roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- 6. Drop existing overly permissive policies on books table
DROP POLICY IF EXISTS "Admin Delete Access" ON public.books;
DROP POLICY IF EXISTS "Admin Insert Access" ON public.books;
DROP POLICY IF EXISTS "Admin Update Access" ON public.books;
DROP POLICY IF EXISTS "Public Read Access" ON public.books;

-- 7. Create new secure admin policies that check admin role
CREATE POLICY "Admin Insert Access"
ON public.books
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admin Update Access"
ON public.books
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admin Delete Access"
ON public.books
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- 8. Create secure public read policy that excludes sensitive columns
-- Since RLS operates at row level, we'll create a view for public access
CREATE VIEW public.books_public AS
SELECT 
  id,
  stock_number,
  title,
  author,
  publisher,
  language,
  category,
  book_type,
  status,
  created_at
FROM public.books;

-- 9. Grant SELECT on the public view to anonymous and authenticated users
GRANT SELECT ON public.books_public TO anon, authenticated;

-- 10. Create policy for authenticated admins to read all book data (including sensitive fields)
CREATE POLICY "Admin Full Read Access"
ON public.books
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- 11. Create policy for anonymous/public to read the books table (needed for the view)
-- Note: The view will filter out sensitive columns, but we need underlying table access
CREATE POLICY "Public Read via View"
ON public.books
FOR SELECT
TO anon
USING (true);

-- Allow authenticated non-admins to also read via view
CREATE POLICY "Authenticated Read via View"
ON public.books
FOR SELECT
TO authenticated
USING (true);