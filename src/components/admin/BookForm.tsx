import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const bookSchema = z.object({
  stock_number: z.string().min(1, "Stock number is required").max(50),
  title: z.string().min(1, "Title is required").max(255),
  author: z.string().min(1, "Author is required").max(255),
  publisher: z.string().min(1, "Publisher is required").max(255),
  language: z.string().optional(),
  category: z.string().optional(),
  price: z.coerce.number().min(0).optional(),
  book_type: z.string().optional(),
  status: z.boolean().default(true),
});

export type BookFormValues = z.infer<typeof bookSchema>;

const LANGUAGES = ["English", "Tamil", "Hindi", "Sanskrit", "Telugu", "Malayalam", "Kannada", "Other"];
const CATEGORIES = [
  "Novel",
  "Story",
  "Poem",
  "Drama",
  "Biography",
  "Autobiography",
  "Memories",
  "Childrens Literature",
  "Travelogue",
  "Science",
  "Indian History",
  "Kerala History",
  "World History",
  "Reference",
  "Essays",
  "Study",
  "Criticism",
  "Personal Development",
  "General Knowledge",
  "Year Book",
  "Health",
  "Environmental Study",
  "Complete Works",
  "Dictionary",
  "English Language",
  "Malayalam Language",
  "Geography",
  "Text Book",
  "Article",
  "Comedy",
  "Crime Thriller",
  "CD",
  "E Book",
];
const BOOK_TYPES = ["Normal", "Reference", "EBooks", "Journals", "CD", "Close Reference"];

interface BookFormProps {
  defaultValues?: Partial<BookFormValues>;
  onSubmit: (values: BookFormValues) => Promise<void>;
  isSubmitting: boolean;
  submitLabel: string;
}

const BookForm = ({ defaultValues, onSubmit, isSubmitting, submitLabel }: BookFormProps) => {
  const form = useForm<BookFormValues>({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      stock_number: "",
      title: "",
      author: "",
      publisher: "",
      language: "",
      category: "",
      price: undefined,
      book_type: "",
      status: true,
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="stock_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stock Number *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., BK001" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title *</FormLabel>
                <FormControl>
                  <Input placeholder="Book title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="author"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Author *</FormLabel>
                <FormControl>
                  <Input placeholder="Author name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="publisher"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Publisher *</FormLabel>
                <FormControl>
                  <Input placeholder="Publisher name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="language"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Language</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {LANGUAGES.map((lang) => (
                      <SelectItem key={lang} value={lang}>
                        {lang}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="book_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Book Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {BOOK_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price (₹)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Availability Status</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    {field.value ? "Book is available" : "Book is checked out"}
                  </p>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-4">
          <Button type="submit" disabled={isSubmitting} className="touch-target">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default BookForm;
