import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import BookForm, { BookFormValues } from "@/components/admin/BookForm";

const AddBook = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mutation = useMutation({
    mutationFn: async (values: BookFormValues) => {
      const { error } = await supabase.from("books").insert({
        stock_number: values.stock_number,
        title: values.title,
        author: values.author,
        publisher: values.publisher,
        language: values.language || null,
        category: values.category || null,
        price: values.price || null,
        book_type: values.book_type || null,
        status: values.status,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["book-stats"] });
      queryClient.invalidateQueries({ queryKey: ["recent-books"] });
      toast.success("Book added successfully!");
      navigate("/admin/books");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add book");
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Add New Book</h2>
          <p className="text-muted-foreground">Fill in the details to add a book to the library</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Book Details</CardTitle>
        </CardHeader>
        <CardContent>
          <BookForm onSubmit={handleSubmit} isSubmitting={isSubmitting} submitLabel="Add Book" />
        </CardContent>
      </Card>
    </div>
  );
};

export default AddBook;
