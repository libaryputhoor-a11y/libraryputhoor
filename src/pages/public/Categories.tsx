import { useState, useEffect, useMemo } from "react";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FolderOpen, Loader2 } from "lucide-react";
import BookCard from "@/components/public/BookCard";
import BookCardSkeleton from "@/components/public/BookCardSkeleton";
import BookDetailsModal from "@/components/public/BookDetailsModal";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";

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

const PAGE_SIZE = 20;

const Categories = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Fetch category counts using RPC (no row limit)
  const { data: categoryData, isLoading: isLoadingCategories } = useQuery({
    queryKey: ["category-counts"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_category_counts");
      if (error) throw error;
      return data as CategoryCount[];
    },
  });

  // Total books from category counts
  const totalBooks = useMemo(() => {
    if (!categoryData) return 0;
    return categoryData.reduce((sum, c) => sum + c.count, 0);
  }, [categoryData]);

  // Fetch books for selected category with infinite scroll
  const {
    data: categoryBooksData,
    isLoading: isLoadingBooks,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ["category-books", selectedCategory],
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from("books_public")
        .select("id, title, author, category, language, book_type, status")
        .order("title", { ascending: true })
        .range(pageParam, pageParam + PAGE_SIZE - 1);

      if (selectedCategory === "Uncategorized") {
        query = query.is("category", null);
      } else if (selectedCategory) {
        query = query.eq("category", selectedCategory);
      }

      const { data, error } = await query;
      if (error) throw error;
      return {
        books: data as Book[],
        nextPage: data.length === PAGE_SIZE ? pageParam + PAGE_SIZE : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    enabled: !!selectedCategory,
  });

  const categoryBooks = useMemo(() => {
    if (!categoryBooksData?.pages) return [];
    return categoryBooksData.pages.flatMap((page) => page.books);
  }, [categoryBooksData]);

  // Get the expected count for selected category
  const selectedCategoryCount = useMemo(() => {
    if (!selectedCategory || !categoryData) return 0;
    return categoryData.find((c) => c.category === selectedCategory)?.count ?? 0;
  }, [selectedCategory, categoryData]);

  // Intersection observer for infinite scroll
  const { ref: loadMoreRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: "100px",
    enabled: hasNextPage && !isFetchingNextPage,
  });

  useEffect(() => {
    if (isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [isIntersecting, hasNextPage, isFetchingNextPage, fetchNextPage]);

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
        <>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-foreground">{selectedCategory}</h2>
              <p className="text-muted-foreground">
                {selectedCategoryCount} book{selectedCategoryCount !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {isLoadingBooks ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[...Array(10)].map((_, i) => (
                <BookCardSkeleton key={i} />
              ))}
            </div>
          ) : categoryBooks.length > 0 ? (
            <>
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

              {/* Infinite scroll trigger */}
              <div ref={loadMoreRef} className="py-4 flex justify-center">
                {isFetchingNextPage && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm">Loading more books...</span>
                  </div>
                )}
                {!hasNextPage && categoryBooks.length > PAGE_SIZE && (
                  <p className="text-sm text-muted-foreground">All books in this category loaded</p>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No books in this category.</p>
            </div>
          )}
        </>
      ) : (
        <>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Categories</h2>
            <p className="text-muted-foreground">
              Browse books by category · {totalBooks} books total
            </p>
          </div>

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

      <BookDetailsModal book={selectedBook} open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
};

export default Categories;
