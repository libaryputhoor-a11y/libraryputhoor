import { useState, useMemo, useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import BookCardSkeleton from "@/components/public/BookCardSkeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BookCard from "@/components/public/BookCard";
import BookDetailsModal from "@/components/public/BookDetailsModal";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";

const CATEGORIES = [
  "Fiction",
  "Non-Fiction",
  "Science",
  "Technology",
  "History",
  "Biography",
  "Philosophy",
  "Religion",
  "Art",
  "Literature",
  "Reference",
  "Children",
  "Other",
];

const LANGUAGES = ["English", "Tamil", "Hindi", "Sanskrit", "Telugu", "Malayalam", "Kannada", "Other"];

type Book = {
  id: number;
  title: string;
  author: string;
  category: string | null;
  language: string | null;
  book_type: string | null;
  status: boolean | null;
};

const PAGE_SIZE = 20;

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("title-asc");
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Snapshot filters on search to avoid refetching on every filter change
  const [activeFilters, setActiveFilters] = useState({
    searchQuery: "",
    selectedCategory: "",
    selectedLanguage: "",
    availabilityFilter: "all",
    sortBy: "title-asc",
  });

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ["search-books", activeFilters],
    queryFn: async ({ pageParam = 0 }) => {
      const [field, direction] = activeFilters.sortBy.split("-");

      let query = supabase
        .from("books_public")
        .select("id, title, author, category, language, book_type, status")
        .order(field, { ascending: direction === "asc" })
        .range(pageParam, pageParam + PAGE_SIZE - 1);

      if (activeFilters.searchQuery) {
        query = query.or(`title.ilike.%${activeFilters.searchQuery}%,author.ilike.%${activeFilters.searchQuery}%`);
      }

      if (activeFilters.selectedCategory && activeFilters.selectedCategory !== "all-cats") {
        query = query.eq("category", activeFilters.selectedCategory);
      }

      if (activeFilters.selectedLanguage && activeFilters.selectedLanguage !== "all-langs") {
        query = query.eq("language", activeFilters.selectedLanguage);
      }

      if (activeFilters.availabilityFilter === "available") {
        query = query.eq("status", true);
      } else if (activeFilters.availabilityFilter === "checked-out") {
        query = query.eq("status", false);
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
    enabled: hasSearched,
  });

  const allBooks = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.books);
  }, [data]);

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveFilters({
      searchQuery,
      selectedCategory,
      selectedLanguage,
      availabilityFilter,
      sortBy,
    });
    setHasSearched(true);
  };

  const handleBookClick = (book: Book) => {
    setSelectedBook(book);
    setModalOpen(true);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setSelectedLanguage("");
    setAvailabilityFilter("all");
    setSortBy("title-asc");
    setHasSearched(false);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Advanced Search</h2>

      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-6">
            {/* Search Input */}
            <div className="space-y-2">
              <Label htmlFor="search">Title or Author</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Enter book title or author name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Category & Language & Availability Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-cats">Any category</SelectItem>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Language</Label>
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-langs">Any language</SelectItem>
                    {LANGUAGES.map((lang) => (
                      <SelectItem key={lang} value={lang}>
                        {lang}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Availability</Label>
                <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="available">Available Only</SelectItem>
                    <SelectItem value="checked-out">Checked Out Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Sort By</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="title-asc">Title (A-Z)</SelectItem>
                    <SelectItem value="title-desc">Title (Z-A)</SelectItem>
                    <SelectItem value="author-asc">Author (A-Z)</SelectItem>
                    <SelectItem value="author-desc">Author (Z-A)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button type="submit" className="touch-target">
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
              <Button type="button" variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      {hasSearched && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {isLoading ? (
              <Skeleton className="h-4 w-24 inline-block" />
            ) : (
              `${allBooks.length} book${allBooks.length !== 1 ? "s" : ""} found${hasNextPage ? "..." : ""}`
            )}
          </p>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[...Array(10)].map((_, i) => (
                <BookCardSkeleton key={i} />
              ))}
            </div>
          ) : allBooks.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {allBooks.map((book) => (
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
                {!hasNextPage && allBooks.length > PAGE_SIZE && (
                  <p className="text-sm text-muted-foreground">All matching books loaded</p>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No books match your search criteria.</p>
            </div>
          )}
        </div>
      )}

      {/* Book Details Modal */}
      <BookDetailsModal book={selectedBook} open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
};

export default SearchPage;
