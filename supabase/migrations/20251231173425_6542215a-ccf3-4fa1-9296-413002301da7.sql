-- Add checked_out_date and return_date columns to books table
ALTER TABLE public.books 
ADD COLUMN checked_out_date date,
ADD COLUMN return_date date;