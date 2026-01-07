import { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, Grid, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import BookCard from "@/components/public/BookCard";
import BookCardSkeleton from "@/components/public/BookCardSkeleton";
import BookDetailsModal from "@/components/public/BookDetailsModal";
import FilterChips from "@/components/public/FilterChips";

type Book = {
  id: number;
  title: string;
  author: string;
  publisher: string | null;
  category: string | null;
  language: string | null;
  book_type: string | null;
  status: boolean | null;
};

const Home = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [selectedAvailability, setSelectedAvailability] = useState<
    "all" | "available" | "checked-out"
  >("all");

  // Fetch all books (public doesn't see price/stock_number)
  const { data: books, isLoading } = useQuery({
    queryKey: ["public-books"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("books_public")
        .select("id, title, author, publisher, category, language, book_type, status")
        .order("title", { ascending: true });

      if (error) throw error;
      return data as Book[];
    },
  });

  // Subscribe to real-time updates for books
  useEffect(() => {
    const channel = supabase
      .channel("books-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "books",
        },
        () => {
          // Invalidate and refetch books when any change occurs
          queryClient.invalidateQueries({ queryKey: ["public-books"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Extract unique categories and languages for filter chips
  const { categories, languages } = useMemo(() => {
    if (!books) return { categories: [], languages: [] };
    const cats = [...new Set(books.map((b) => b.category).filter(Boolean))] as string[];
    const langs = [...new Set(books.map((b) => b.language).filter(Boolean))] as string[];
    return { categories: cats.sort(), languages: langs.sort() };
  }, [books]);

  // Filter books based on search and filters
  const filteredBooks = useMemo(() => {
    if (!books) return [];

    return books.filter((book) => {
      // Search filter
      const matchesSearch =
        !searchQuery ||
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase());

      // Category filter
      const matchesCategory = !selectedCategory || book.category === selectedCategory;

      // Language filter
      const matchesLanguage = !selectedLanguage || book.language === selectedLanguage;

      // Availability filter
      const matchesAvailability =
        selectedAvailability === "all" ||
        (selectedAvailability === "available" && book.status === true) ||
        (selectedAvailability === "checked-out" && book.status === false);

      return matchesSearch && matchesCategory && matchesLanguage && matchesAvailability;
    });
  }, [books, searchQuery, selectedCategory, selectedLanguage, selectedAvailability]);

  const handleBookClick = (book: Book) => {
    setSelectedBook(book);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by title or author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>
        <div className="flex border rounded-md">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="icon"
            onClick={() => setViewMode("grid")}
            className="rounded-r-none"
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="icon"
            onClick={() => setViewMode("list")}
            className="rounded-l-none"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filter Chips */}
      <FilterChips
        categories={categories}
        languages={languages}
        selectedCategory={selectedCategory}
        selectedLanguage={selectedLanguage}
        selectedAvailability={selectedAvailability}
        onCategoryChange={setSelectedCategory}
        onLanguageChange={setSelectedLanguage}
        onAvailabilityChange={setSelectedAvailability}
      />

      {/* Results Count */}
      <p className="text-sm text-muted-foreground">
        {isLoading ? (
          <Skeleton className="h-4 w-24 inline-block" />
        ) : (
          `${filteredBooks.length} book${filteredBooks.length !== 1 ? "s" : ""} found`
        )}
      </p>

      {/* Books Grid/List */}
      {isLoading ? (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
              : "space-y-3"
          }
        >
          {[...Array(10)].map((_, i) => (
            viewMode === "grid" ? (
              <BookCardSkeleton key={i} />
            ) : (
              <div key={i} className="flex items-center justify-between p-4 bg-card border border-border rounded-lg">
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full ml-4" />
              </div>
            )
          ))}
        </div>
      ) : filteredBooks.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredBooks.map((book) => (
              <BookCard
                key={book.id}
                title={book.title}
                author={book.author}
                publisher={book.publisher}
                category={book.category}
                language={book.language}
                status={book.status}
                onClick={() => handleBookClick(book)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredBooks.map((book) => (
              <div
                key={book.id}
                onClick={() => handleBookClick(book)}
                className="flex items-center justify-between p-4 bg-card border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground truncate">{book.title}</p>
                  <p className="text-sm text-muted-foreground truncate">{book.author}</p>
                </div>
                <span
                  className={`ml-4 px-2.5 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                    book.status
                      ? "bg-accent/10 text-accent"
                      : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {book.status ? "Available" : "Checked Out"}
                </span>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchQuery || selectedCategory || selectedLanguage || selectedAvailability !== "all"
              ? "No books match your filters."
              : "No books in the catalog yet."}
          </p>
        </div>
      )}

      {/* Book Details Modal */}
      <BookDetailsModal book={selectedBook} open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
};

export default Home;
