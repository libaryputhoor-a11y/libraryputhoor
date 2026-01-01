-- Fix INPUT_VALIDATION: Add database-level constraints for data integrity

-- Add length constraints
ALTER TABLE public.books 
  ADD CONSTRAINT stock_number_length CHECK (char_length(stock_number) <= 50);

ALTER TABLE public.books 
  ADD CONSTRAINT title_length CHECK (char_length(title) <= 255);

ALTER TABLE public.books 
  ADD CONSTRAINT author_length CHECK (char_length(author) <= 255);

ALTER TABLE public.books 
  ADD CONSTRAINT publisher_length CHECK (publisher IS NULL OR char_length(publisher) <= 255);

ALTER TABLE public.books 
  ADD CONSTRAINT notes_length CHECK (notes IS NULL OR char_length(notes) <= 1000);

-- Add value constraints
ALTER TABLE public.books 
  ADD CONSTRAINT price_non_negative CHECK (price IS NULL OR price >= 0);

-- Fix PUBLIC_DATA_EXPOSURE: Remove stock_number and created_at from public view
DROP VIEW IF EXISTS public.books_public;

CREATE VIEW public.books_public 
WITH (security_invoker = true)
AS SELECT 
  id,
  title,
  author,
  publisher,
  language,
  category,
  book_type,
  status
FROM public.books;

-- Grant access to the updated view
GRANT SELECT ON public.books_public TO anon;
GRANT SELECT ON public.books_public TO authenticated;