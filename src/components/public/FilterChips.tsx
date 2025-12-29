import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface FilterChipsProps {
  categories: string[];
  languages: string[];
  selectedCategory: string | null;
  selectedLanguage: string | null;
  selectedAvailability: "all" | "available" | "checked-out";
  onCategoryChange: (category: string | null) => void;
  onLanguageChange: (language: string | null) => void;
  onAvailabilityChange: (availability: "all" | "available" | "checked-out") => void;
}

const FilterChips = ({
  categories,
  languages,
  selectedCategory,
  selectedLanguage,
  selectedAvailability,
  onCategoryChange,
  onLanguageChange,
  onAvailabilityChange,
}: FilterChipsProps) => {
  const hasActiveFilters =
    selectedCategory || selectedLanguage || selectedAvailability !== "all";

  const clearAllFilters = () => {
    onCategoryChange(null);
    onLanguageChange(null);
    onAvailabilityChange("all");
  };

  return (
    <div className="space-y-3">
      {/* Availability Filters */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-muted-foreground font-medium self-center mr-1">
          Status:
        </span>
        {(["all", "available", "checked-out"] as const).map((status) => (
          <Button
            key={status}
            variant={selectedAvailability === status ? "default" : "outline"}
            size="sm"
            onClick={() => onAvailabilityChange(status)}
            className="h-8 text-xs"
          >
            {status === "all" ? "All" : status === "available" ? "Available" : "Checked Out"}
          </Button>
        ))}
      </div>

      {/* Category Filters */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-muted-foreground font-medium self-center mr-1">
            Category:
          </span>
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => onCategoryChange(selectedCategory === cat ? null : cat)}
              className="h-8 text-xs"
            >
              {cat}
            </Button>
          ))}
        </div>
      )}

      {/* Language Filters */}
      {languages.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-muted-foreground font-medium self-center mr-1">
            Language:
          </span>
          {languages.map((lang) => (
            <Button
              key={lang}
              variant={selectedLanguage === lang ? "default" : "outline"}
              size="sm"
              onClick={() => onLanguageChange(selectedLanguage === lang ? null : lang)}
              className="h-8 text-xs"
            >
              {lang}
            </Button>
          ))}
        </div>
      )}

      {/* Clear All Filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAllFilters}
          className="h-8 text-xs text-destructive hover:text-destructive"
        >
          <X className="h-3 w-3 mr-1" />
          Clear filters
        </Button>
      )}
    </div>
  );
};

export default FilterChips;
