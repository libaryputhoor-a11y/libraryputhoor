import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
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

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("title-asc");
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data: books, isLoading, refetch } = useQuery({
    queryKey: ["search-books", searchQuery, selectedCategories, selectedLanguage, availabilityFilter, sortBy],
    queryFn: async () => {
      let query = supabase
        .from("books")
        .select("id, title, author, category, language, book_type, status");

      // Apply search filter
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,author.ilike.%${searchQuery}%`);
      }

      // Apply category filter
      if (selectedCategories.length > 0) {
        query = query.in("category", selectedCategories);
      }

      // Apply language filter
      if (selectedLanguage) {
        query = query.eq("language", selectedLanguage);
      }

      // Apply availability filter
      if (availabilityFilter === "available") {
        query = query.eq("status", true);
      } else if (availabilityFilter === "checked-out") {
        query = query.eq("status", false);
      }

      // Apply sorting
      const [field, direction] = sortBy.split("-");
      query = query.order(field, { ascending: direction === "asc" });

      const { data, error } = await query;
      if (error) throw error;
      return data as Book[];
    },
    enabled: hasSearched,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);
    refetch();
  };

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleBookClick = (book: Book) => {
    setSelectedBook(book);
    setModalOpen(true);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategories([]);
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

            {/* Category Checkboxes */}
            <div className="space-y-2">
              <Label>Categories</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {CATEGORIES.map((category) => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox
                      id={`cat-${category}`}
                      checked={selectedCategories.includes(category)}
                      onCheckedChange={() => handleCategoryToggle(category)}
                    />
                    <Label htmlFor={`cat-${category}`} className="text-sm font-normal cursor-pointer">
                      {category}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Language & Availability Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                    <SelectItem value="created_at-desc">Recently Added</SelectItem>
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
              `${books?.length || 0} book${(books?.length || 0) !== 1 ? "s" : ""} found`
            )}
          </p>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-72" />
              ))}
            </div>
          ) : books && books.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {books.map((book) => (
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
