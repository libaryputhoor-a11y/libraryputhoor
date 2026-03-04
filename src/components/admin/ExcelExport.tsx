import { useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

const ExcelExport = () => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Fetch all books in batches to bypass 1000-row limit
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
    <Button variant="outline" className="touch-target" onClick={handleExport} disabled={isExporting}>
      {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
      Export Excel
    </Button>
  );
};

export default ExcelExport;
