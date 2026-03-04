import { useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

const ExcelExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [open, setOpen] = useState(false);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [isLoadingCount, setIsLoadingCount] = useState(false);

  const fetchCount = async () => {
    setIsLoadingCount(true);
    try {
      const { data, error } = await supabase.rpc("get_book_stats");
      if (error) throw error;
      const stats = data as { total: number };
      setTotalCount(stats.total);
    } catch {
      setTotalCount(null);
    } finally {
      setIsLoadingCount(false);
    }
  };

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (value) fetchCount();
  };

  const handleExport = async () => {
    setOpen(false);
    setIsExporting(true);
    try {
      const allBooks: Record<string, unknown>[] = [];
      let from = 0;
      const pageSize = 1000;

      while (true) {
        const { data, error } = await supabase
          .from("books")
          .select("stock_number, title, author, publisher, language, category, price, book_type, status, notes, checked_out_date, return_date, created_at")
          .order("stock_number", { ascending: true })
          .range(from, from + pageSize - 1);

        if (error) throw error;
        if (!data || data.length === 0) break;

        allBooks.push(
          ...data.map((book) => ({
            "Stock Number": book.stock_number,
            Title: book.title,
            Author: book.author,
            Publisher: book.publisher || "",
            Language: book.language || "",
            Category: book.category || "",
            Price: book.price ?? "",
            "Book Type": book.book_type || "",
            Status: book.status ? "Available" : "Checked Out",
            Notes: book.notes || "",
            "Checked Out Date": book.checked_out_date || "",
            "Return Date": book.return_date || "",
            "Created At": book.created_at,
          }))
        );

        if (data.length < pageSize) break;
        from += pageSize;
      }

      if (allBooks.length === 0) {
        toast.error("No books to export.");
        return;
      }

      const ws = XLSX.utils.json_to_sheet(allBooks);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Books");
      XLSX.writeFile(wb, `library_books_${new Date().toISOString().slice(0, 10)}.xlsx`);

      toast.success(`Exported ${allBooks.length} books successfully!`);
    } catch {
      toast.error("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="touch-target" disabled={isExporting}>
          {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          Export Excel
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Export All Books</AlertDialogTitle>
          <AlertDialogDescription>
            {isLoadingCount ? (
              "Counting books..."
            ) : totalCount !== null ? (
              <>
                This will export <span className="font-semibold text-foreground">{totalCount.toLocaleString()}</span> book{totalCount !== 1 ? "s" : ""} as an Excel file. Do you want to continue?
              </>
            ) : (
              "This will export all books as an Excel file. Do you want to continue?"
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleExport} disabled={isLoadingCount}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ExcelExport;
