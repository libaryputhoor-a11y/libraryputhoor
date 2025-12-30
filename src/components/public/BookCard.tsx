import { BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface BookCardProps {
  title: string;
  author: string;
  publisher?: string | null;
  category?: string | null;
  language?: string | null;
  status: boolean | null;
  onClick?: () => void;
}

const BookCard = ({ title, author, publisher, category, language, status, onClick }: BookCardProps) => {
  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
      onClick={onClick}
    >
      <CardContent className="p-4">
        {/* Book Cover Placeholder */}
        <div className="aspect-[3/4] bg-muted rounded-md mb-3 flex items-center justify-center">
          <BookOpen className="h-12 w-12 text-muted-foreground/50" />
        </div>

        {/* Book Info */}
        <div className="space-y-2">
          <h3 className="font-semibold text-foreground line-clamp-2 leading-tight">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-1">{author}</p>
          {publisher && (
            <p className="text-xs text-muted-foreground/80 line-clamp-1">{publisher}</p>
          )}

          {/* Category & Language */}
          <div className="flex flex-wrap gap-1">
            {category && (
              <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                {category}
              </span>
            )}
            {language && (
              <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                {language}
              </span>
            )}
          </div>

          {/* Status Badge */}
          <div className="pt-1">
            <span
              className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${
                status
                  ? "bg-accent/10 text-accent"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              {status ? "Available" : "Checked Out"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BookCard;
