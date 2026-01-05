-- Recreate the books_public view without security_invoker
-- This allows public (unauthenticated) users to read the catalog
-- The view only exposes safe columns (no price, notes, or checkout dates)

DROP VIEW IF EXISTS public.books_public;

CREATE VIEW public.books_public AS
SELECT 
  id,
  status,
  title,
  author,
  publisher,
  language,
  category,
  book_type
FROM public.books;

-- Grant SELECT access to anonymous users
GRANT SELECT ON public.books_public TO anon;
GRANT SELECT ON public.books_public TO authenticated;