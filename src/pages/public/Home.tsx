import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const Home = () => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search by title or author..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-12 text-base"
        />
      </div>

      {/* Placeholder for books grid */}
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          No books in the catalog yet. Add some books from the admin panel.
        </p>
      </div>
    </div>
  );
};

export default Home;
