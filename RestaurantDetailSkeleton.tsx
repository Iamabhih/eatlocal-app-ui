import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function RestaurantDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Restaurant Header */}
      <div className="relative">
        <Skeleton className="h-64 w-full rounded-lg" />
        <div className="absolute bottom-4 left-4 right-4 space-y-2">
          <Skeleton className="h-8 w-1/2 bg-white/20" />
          <Skeleton className="h-4 w-1/3 bg-white/20" />
        </div>
      </div>

      {/* Restaurant Info */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>

      {/* Menu Categories */}
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        
        {/* Menu Items */}
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="flex items-center gap-4 p-4">
              <Skeleton className="h-20 w-20 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-10 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
