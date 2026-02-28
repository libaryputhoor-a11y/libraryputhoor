import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Upload, FileSpreadsheet, Loader2, Download, AlertCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ParsedBook {
  stock_number: string;
  title: string;
  author: string;
  publisher: string;
  language?: string;
  category?: string;
  price?: number;
  book_type?: string;
  status?: boolean;
  notes?: string;
}

const REQUIRED_FIELDS = ["stock_number", "title", "author", "publisher"];

const COLUMN_MAP: Record<string, string> = {
  "stock_number": "stock_number",
  "stock number": "stock_number",
  "stock no": "stock_number",
  "stock #": "stock_number",
  "stockno": "stock_number",
  "title": "title",
  "book title": "title",
  "author": "author",
  "author name": "author",
  "publisher": "publisher",
  "publisher name": "publisher",
  "language": "language",
  "category": "category",
  "genre": "category",
  "price": "price",
  "book_type": "book_type",
  "book type": "book_type",
  "type": "book_type",
  "status": "status",
  "availability": "status",
  "notes": "notes",
};

const ExcelImport = () => {
  const [open, setOpen] = useState(false);
  const [parsedBooks, setParsedBooks] = useState<ParsedBook[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const resetState = () => {
    setParsedBooks([]);
    setErrors([]);
    setFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const mapColumns = (row: Record<string, unknown>): Partial<ParsedBook> => {
    const mapped: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      const normalizedKey = key.trim().toLowerCase();
      const mappedKey = COLUMN_MAP[normalizedKey];
      if (mappedKey) {
        mapped[mappedKey] = value;
      }
    }
    return mapped as Partial<ParsedBook>;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrors([]);
    setParsedBooks([]);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[];

        if (jsonData.length === 0) {
          setErrors(["The Excel file is empty or has no readable data."]);
          return;
        }

        const validationErrors: string[] = [];
        const books: ParsedBook[] = [];
        const seenStockNumbers = new Map<string, number>();
        const seenTitles = new Map<string, number>();

        jsonData.forEach((row, index) => {
          const mapped = mapColumns(row);
          const rowNum = index + 2; // +2 for header + 0-index

          const missing = REQUIRED_FIELDS.filter((f) => !mapped[f as keyof ParsedBook]?.toString().trim());
          if (missing.length > 0) {
            validationErrors.push(`Row ${rowNum}: Missing required fields: ${missing.join(", ")}`);
            return;
          }

          const stockNum = String(mapped.stock_number).trim();
          const title = String(mapped.title).trim().toLowerCase();

          // Check duplicate stock numbers within the file
          if (seenStockNumbers.has(stockNum)) {
            validationErrors.push(`Row ${rowNum}: Duplicate stock number "${stockNum}" (first seen in row ${seenStockNumbers.get(stockNum)})`);
            return;
          }
          seenStockNumbers.set(stockNum, rowNum);

          // Check duplicate titles within the file
          if (seenTitles.has(title)) {
            validationErrors.push(`Row ${rowNum}: Duplicate title "${String(mapped.title).trim()}" (first seen in row ${seenTitles.get(title)})`);
            return;
          }
          seenTitles.set(title, rowNum);

          const statusVal = mapped.status;
          let status = true;
          if (statusVal !== undefined) {
            const s = statusVal.toString().toLowerCase().trim();
            status = !["false", "0", "no", "checked out", "unavailable", "not available"].includes(s);
          }

          books.push({
            stock_number: stockNum,
            title: String(mapped.title).trim(),
            author: String(mapped.author).trim(),
            publisher: String(mapped.publisher).trim(),
            language: mapped.language ? String(mapped.language).trim() : undefined,
            category: mapped.category ? String(mapped.category).trim() : undefined,
            price: mapped.price ? Number(mapped.price) : undefined,
            book_type: mapped.book_type ? String(mapped.book_type).trim() : undefined,
            status,
            notes: mapped.notes ? String(mapped.notes).trim() : undefined,
          });
        });

        if (validationErrors.length > 0 && books.length === 0) {
          setErrors(validationErrors);
          return;
        }

        setErrors(validationErrors);
        setParsedBooks(books);
      } catch {
        setErrors(["Failed to parse the file. Please ensure it's a valid Excel or CSV file."]);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    if (parsedBooks.length === 0) return;
    setIsImporting(true);

    try {
      // Insert in batches of 50
      const batchSize = 50;
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < parsedBooks.length; i += batchSize) {
        const batch = parsedBooks.slice(i, i + batchSize);
        const { error } = await supabase.from("books").insert(batch);
        if (error) {
          failCount += batch.length;
          console.error("Batch insert error:", error);
        } else {
          successCount += batch.length;
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} books!`);
        queryClient.invalidateQueries({ queryKey: ["books"] });
        queryClient.invalidateQueries({ queryKey: ["book-stats"] });
        queryClient.invalidateQueries({ queryKey: ["recent-books"] });
      }
      if (failCount > 0) {
        toast.error(`Failed to import ${failCount} books. They may have duplicate stock numbers.`);
      }

      setOpen(false);
      resetState();
    } catch {
      toast.error("Import failed. Please try again.");
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        stock_number: "BK001",
        title: "Sample Book Title",
        author: "Author Name",
        publisher: "Publisher Name",
        language: "English",
        category: "Novel",
        price: 299,
        book_type: "Normal",
        status: "Available",
        notes: "",
      },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Books");
    XLSX.writeFile(wb, "book_import_template.xlsx");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetState(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="touch-target">
          <Upload className="mr-2 h-4 w-4" />
          Import Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Import Books from Excel
          </DialogTitle>
          <DialogDescription>
            Upload an Excel (.xlsx, .xls) or CSV file to bulk import books.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template download */}
          <Button variant="link" size="sm" onClick={downloadTemplate} className="p-0 h-auto">
            <Download className="mr-1 h-3 w-3" />
            Download template file
          </Button>

          {/* File input */}
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
              id="excel-upload"
            />
            <label htmlFor="excel-upload" className="cursor-pointer space-y-2 block">
              <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {fileName || "Click to select a file or drag and drop"}
              </p>
              <p className="text-xs text-muted-foreground">
                Supports .xlsx, .xls, and .csv
              </p>
            </label>
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 space-y-1">
              <p className="text-sm font-medium text-destructive flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                Validation Issues ({errors.length})
              </p>
              <ScrollArea className="max-h-24">
                {errors.map((err, i) => (
                  <p key={i} className="text-xs text-destructive/80">{err}</p>
                ))}
              </ScrollArea>
            </div>
          )}

          {/* Preview */}
          {parsedBooks.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  Preview ({parsedBooks.length} books ready to import)
                </p>
                <Badge variant="secondary">{parsedBooks.length} rows</Badge>
              </div>
              <ScrollArea className="h-48 rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Stock #</TableHead>
                      <TableHead className="text-xs">Title</TableHead>
                      <TableHead className="text-xs">Author</TableHead>
                      <TableHead className="text-xs">Publisher</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedBooks.slice(0, 20).map((book, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs">{book.stock_number}</TableCell>
                        <TableCell className="text-xs max-w-[150px] truncate">{book.title}</TableCell>
                        <TableCell className="text-xs">{book.author}</TableCell>
                        <TableCell className="text-xs">{book.publisher}</TableCell>
                        <TableCell className="text-xs">
                          <Badge variant={book.status ? "default" : "destructive"} className="text-[10px]">
                            {book.status ? "Available" : "Checked Out"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {parsedBooks.length > 20 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-xs text-center text-muted-foreground">
                          ...and {parsedBooks.length - 20} more rows
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { setOpen(false); resetState(); }}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={parsedBooks.length === 0 || isImporting}
          >
            {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Import {parsedBooks.length > 0 ? `${parsedBooks.length} Books` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExcelImport;
