-- Drop the overpermissive public read policies that expose sensitive data
DROP POLICY IF EXISTS "Authenticated Read via View" ON public.books;
DROP POLICY IF EXISTS "Public Read via View" ON public.books;
DROP POLICY IF EXISTS "Public Read Access" ON public.books;

-- Ensure the books_public view has proper grants for public access
GRANT SELECT ON public.books_public TO anon, authenticated;