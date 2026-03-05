
-- Indexes for faster book queries
CREATE INDEX IF NOT EXISTS idx_books_title ON public.books (title);
CREATE INDEX IF NOT EXISTS idx_books_author ON public.books (author);
CREATE INDEX IF NOT EXISTS idx_books_category ON public.books (category);
CREATE INDEX IF NOT EXISTS idx_books_language ON public.books (language);
CREATE INDEX IF NOT EXISTS idx_books_status ON public.books (status);
CREATE INDEX IF NOT EXISTS idx_books_title_author ON public.books USING gin (to_tsvector('simple', title || ' ' || author));
CREATE INDEX IF NOT EXISTS idx_books_stock_number ON public.books (stock_number);
