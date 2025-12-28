import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, CheckCircle, XCircle, FolderOpen } from "lucide-react";

const Dashboard = () => {
  // Placeholder stats - will be replaced with real data
  const stats = [
    { 
      title: "Total Books", 
      value: "0", 
      icon: BookOpen, 
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    { 
      title: "Available", 
      value: "0", 
      icon: CheckCircle, 
      color: "text-accent",
      bgColor: "bg-accent/10"
    },
    { 
      title: "Checked Out", 
      value: "0", 
      icon: XCircle, 
      color: "text-destructive",
      bgColor: "bg-destructive/10"
    },
    { 
      title: "Categories", 
      value: "0", 
      icon: FolderOpen, 
      color: "text-secondary",
      bgColor: "bg-secondary/10"
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
        <p className="text-muted-foreground">Welcome to the Library Admin Panel</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
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
              <div className="text-3xl font-bold text-foreground">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Use the sidebar to manage books, view settings, and more.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
