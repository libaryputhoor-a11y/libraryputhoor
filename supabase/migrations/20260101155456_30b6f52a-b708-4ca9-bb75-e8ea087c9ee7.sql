-- Fix the view - explicitly set as security invoker (default, but being explicit)
DROP VIEW IF EXISTS public.books_public;

CREATE VIEW public.books_public 
WITH (security_invoker = true)
AS
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