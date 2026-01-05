-- Fix Security Definer View issue by recreating books_public with security_invoker = true
-- This makes the view respect the caller's permissions instead of the creator's

-- Drop the existing view
DROP VIEW IF EXISTS public.books_public;

-- Recreate the view with security_invoker = true (respects caller's permissions)
CREATE VIEW public.books_public 
WITH (security_invoker = true)
AS SELECT 
    id,
    status,
    title,
    author,
    publisher,
    language,
    category,
    book_type
FROM public.books;

-- Grant SELECT on the view to anon and authenticated roles
GRANT SELECT ON public.books_public TO anon;
GRANT SELECT ON public.books_public TO authenticated;

-- Add a permissive policy on books table for public read access to allow the view to work
-- This is separate from the admin restrictive policies
CREATE POLICY "Public Read Access via View"
ON public.books
FOR SELECT
TO anon, authenticated
USING (true);