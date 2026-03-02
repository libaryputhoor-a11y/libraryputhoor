
CREATE OR REPLACE FUNCTION public.get_book_stats()
RETURNS JSON
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT json_build_object(
    'total', COUNT(*),
    'available', COUNT(*) FILTER (WHERE status = true),
    'checked_out', COUNT(*) FILTER (WHERE status = false),
    'categories', COUNT(DISTINCT category)
  )
  FROM public.books;
$$;
