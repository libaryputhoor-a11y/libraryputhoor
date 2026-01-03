import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FolderOpen } from "lucide-react";
import BookCard from "@/components/public/BookCard";
import BookDetailsModal from "@/components/public/BookDetailsModal";

type Book = {
  id: number;
  title: string;
  author: string;
  category: string | null;
  language: string | null;
  book_type: string | null;
  status: boolean | null;
};

type CategoryCount = {
  category: string;
  count: number;
};

const Categories = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Fetch category counts
  const { data: categoryData, isLoading: isLoadingCategories } = useQuery({
    queryKey: ["category-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("books_public")
        .select("category");

      if (error) throw error;

      // Count books per category
      const counts: Record<string, number> = {};
      data.forEach((book) => {
        const cat = book.category || "Uncategorized";
        counts[cat] = (counts[cat] || 0) + 1;
      });

      return Object.entries(counts)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count) as CategoryCount[];
    },
  });

  // Fetch books for selected category
  const { data: categoryBooks, isLoading: isLoadingBooks } = useQuery({
    queryKey: ["category-books", selectedCategory],
    queryFn: async () => {
      let query = supabase
        .from("books_public")
        .select("id, title, author, category, language, book_type, status")
        .order("title", { ascending: true });

      if (selectedCategory === "Uncategorized") {
        query = query.is("category", null);
      } else if (selectedCategory) {
        query = query.eq("category", selectedCategory);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Book[];
    },
    enabled: !!selectedCategory,
  });

  const handleBookClick = (book: Book) => {
    setSelectedBook(book);
    setModalOpen(true);
  };

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
  };

  const handleBack = () => {
    setSelectedCategory(null);
  };

  return (
    <div className="space-y-6">
      {selectedCategory ? (
        // Books in selected category
        <>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-foreground">{selectedCategory}</h2>
              <p className="text-muted-foreground">
                {isLoadingBooks ? (
                  <Skeleton className="h-4 w-20 inline-block" />
                ) : (
                  `${categoryBooks?.length || 0} books`
                )}
              </p>
            </div>
          </div>

          {isLoadingBooks ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-72" />
              ))}
            </div>
          ) : categoryBooks && categoryBooks.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {categoryBooks.map((book) => (
                <BookCard
                  key={book.id}
                  title={book.title}
                  author={book.author}
                  category={book.category}
                  language={book.language}
                  status={book.status}
                  onClick={() => handleBookClick(book)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No books in this category.</p>
            </div>
          )}
        </>
      ) : (
        // Category grid
        <>
          <h2 className="text-2xl font-bold text-foreground">Categories</h2>
          <p className="text-muted-foreground">Browse books by category</p>

          {isLoadingCategories ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-28" />
              ))}
            </div>
          ) : categoryData && categoryData.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {categoryData.map((item) => (
                <Card
                  key={item.category}
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
                  onClick={() => handleCategoryClick(item.category)}
                >
                  <CardHeader className="pb-2">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                      <FolderOpen className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-base line-clamp-1">{item.category}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {item.count} book{item.count !== 1 ? "s" : ""}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No categories yet. Add some books to get started.</p>
            </div>
          )}
        </>
      )}

      {/* Book Details Modal */}
      <BookDetailsModal book={selectedBook} open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
};

export default Categories;
