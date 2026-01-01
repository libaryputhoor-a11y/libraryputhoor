import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import BookForm, { BookFormValues } from "@/components/admin/BookForm";

const EditBook = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: book, isLoading, error } = useQuery({
    queryKey: ["book", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .eq("id", Number(id))
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("Book not found");
      return data;
    },
    enabled: !!id,
  });

  const mutation = useMutation({
    mutationFn: async (values: BookFormValues) => {
      const { error } = await supabase
        .from("books")
        .update({
          stock_number: values.stock_number,
          title: values.title,
          author: values.author,
          publisher: values.publisher,
          language: values.language || null,
          category: values.category || null,
          price: values.price || null,
          book_type: values.book_type || null,
          status: values.status,
          checked_out_date: values.checked_out_date ? format(values.checked_out_date, "yyyy-MM-dd") : null,
          return_date: values.return_date ? format(values.return_date, "yyyy-MM-dd") : null,
          notes: values.notes || null,
        })
        .eq("id", Number(id));

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["book", id] });
      queryClient.invalidateQueries({ queryKey: ["book-stats"] });
      queryClient.invalidateQueries({ queryKey: ["recent-books"] });
      toast.success("Book updated successfully!");
      navigate("/admin/books");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update book");
    },
  });

  const handleSubmit = async (values: BookFormValues) => {
    setIsSubmitting(true);
    try {
      await mutation.mutateAsync(values);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-2xl font-bold text-foreground">Book Not Found</h2>
        </div>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">The book you're looking for doesn't exist.</p>
            <Button className="mt-4" onClick={() => navigate("/admin/books")}>
              Back to Books
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Edit Book</h2>
          <p className="text-muted-foreground">Update the book details</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Book Details</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            </div>
          ) : book ? (
            <BookForm
              defaultValues={{
                stock_number: book.stock_number,
                title: book.title,
                author: book.author,
                publisher: book.publisher || "",
                language: book.language || "",
                category: book.category || "",
                price: book.price ?? undefined,
                book_type: book.book_type || "",
                status: book.status ?? true,
                checked_out_date: book.checked_out_date ? parseISO(book.checked_out_date) : null,
                return_date: book.return_date ? parseISO(book.return_date) : null,
                notes: book.notes || "",
              }}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              submitLabel="Save Changes"
              isEditMode={true}
            />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
};

export default EditBook;
