
CREATE OR REPLACE FUNCTION public.get_category_counts()
RETURNS JSON
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT json_agg(row_to_json(t) ORDER BY t.count DESC)
  FROM (
    SELECT 
      COALESCE(category, 'Uncategorized') AS category,
      COUNT(*) AS count
    FROM public.books
    GROUP BY category
    ORDER BY count DESC
  ) t;
$$;
