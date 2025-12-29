import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BookOpen } from "lucide-react";

interface Book {
  id: number;
  title: string;
  author: string;
  category?: string | null;
  language?: string | null;
  book_type?: string | null;
  status: boolean | null;
}

interface BookDetailsModalProps {
  book: Book | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BookDetailsModal = ({ book, open, onOpenChange }: BookDetailsModalProps) => {
  if (!book) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">{book.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Book Cover Placeholder */}
          <div className="w-32 h-44 bg-muted rounded-md flex items-center justify-center mx-auto">
            <BookOpen className="h-16 w-16 text-muted-foreground/50" />
          </div>

          {/* Status Badge - Prominent */}
          <div className="flex justify-center">
            <span
              className={`inline-flex items-center px-4 py-2 text-sm font-semibold rounded-full ${
                book.status
                  ? "bg-accent/10 text-accent"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              {book.status ? "✓ Available" : "✗ Checked Out"}
            </span>
          </div>

          {/* Book Details */}
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Author</span>
              <span className="font-medium text-foreground">{book.author}</span>
            </div>

            {book.category && (
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Category</span>
                <span className="font-medium text-foreground">{book.category}</span>
              </div>
            )}

            {book.language && (
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Language</span>
                <span className="font-medium text-foreground">{book.language}</span>
              </div>
            )}

            {book.book_type && (
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium text-foreground">{book.book_type}</span>
              </div>
            )}
          </div>

          {book.status && (
            <p className="text-center text-sm text-muted-foreground pt-2">
              Visit the library to borrow this book.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookDetailsModal;
