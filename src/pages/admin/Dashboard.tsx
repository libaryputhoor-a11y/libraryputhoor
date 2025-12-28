import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, CheckCircle, XCircle, FolderOpen, Plus } from "lucide-react";
import { Link } from "react-router-dom";

interface BookStats {
  total: number;
  available: number;
  checkedOut: number;
  categories: number;
}

const Dashboard = () => {
  const { data: stats, isLoading } = useQuery<BookStats>({
    queryKey: ["book-stats"],
    queryFn: async () => {
      // Get all books
      const { data: books, error } = await supabase
        .from("books")
        .select("status, category");

      if (error) throw error;

      const total = books?.length || 0;
      const available = books?.filter((b) => b.status === true).length || 0;
      const checkedOut = books?.filter((b) => b.status === false).length || 0;
      const uniqueCategories = new Set(books?.map((b) => b.category).filter(Boolean));
      
      return {
        total,
        available,
        checkedOut,
        categories: uniqueCategories.size,
      };
    },
  });

  const { data: recentBooks, isLoading: isLoadingRecent } = useQuery({
    queryKey: ["recent-books"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("books")
        .select("id, title, author, status, created_at")
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
  });

  const statCards = [
    { 
      title: "Total Books", 
      value: stats?.total ?? 0, 
      icon: BookOpen, 
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    { 
      title: "Available", 
      value: stats?.available ?? 0, 
      icon: CheckCircle, 
      color: "text-accent",
      bgColor: "bg-accent/10"
    },
    { 
      title: "Checked Out", 
      value: stats?.checkedOut ?? 0, 
      icon: XCircle, 
      color: "text-destructive",
      bgColor: "bg-destructive/10"
    },
    { 
      title: "Categories", 
      value: stats?.categories ?? 0, 
      icon: FolderOpen, 
      color: "text-secondary",
      bgColor: "bg-secondary/10"
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
          <p className="text-muted-foreground">Welcome to the Library Admin Panel</p>
        </div>
        <Link to="/admin/books/add">
          <Button className="touch-target">
            <Plus className="mr-2 h-4 w-4" />
            Add Book
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-9 w-16" />
              ) : (
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Recent Books</span>
            <Link to="/admin/books">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingRecent ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : recentBooks && recentBooks.length > 0 ? (
            <div className="space-y-3">
              {recentBooks.map((book) => (
                <div
                  key={book.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground truncate">{book.title}</p>
                    <p className="text-sm text-muted-foreground truncate">{book.author}</p>
                  </div>
                  <span
                    className={`ml-4 px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                      book.status
                        ? "bg-accent/10 text-accent"
                        : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {book.status ? "Available" : "Checked Out"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              No books added yet. Click "Add Book" to get started.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Link to="/admin/books/add">
            <Button variant="outline" className="touch-target">
              <Plus className="mr-2 h-4 w-4" />
              Add New Book
            </Button>
          </Link>
          <Link to="/admin/books">
            <Button variant="outline" className="touch-target">
              <BookOpen className="mr-2 h-4 w-4" />
              Manage Books
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
