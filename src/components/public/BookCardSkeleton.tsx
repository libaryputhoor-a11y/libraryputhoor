import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const BookCardSkeleton = () => {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        {/* Book Cover Placeholder */}
        <Skeleton className="aspect-[3/4] rounded-md mb-3 animate-pulse" />

        {/* Book Info */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />

          {/* Category & Language */}
          <div className="flex gap-1">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>

          {/* Status Badge */}
          <div className="pt-1">
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BookCardSkeleton;
