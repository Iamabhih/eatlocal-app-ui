import { useState } from 'react';
import { Star, ThumbsUp, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useRestaurantReviews, useRatingDistribution, useMarkReviewHelpful } from '@/hooks/useRatingsReviews';
import { ReviewCard } from './ReviewForm';

interface ReviewsSectionProps {
  restaurantId: string;
  restaurantRating: number;
  totalReviews: number;
}

export function ReviewsSection({ restaurantId, restaurantRating, totalReviews }: ReviewsSectionProps) {
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState(true);

  const { data: reviewsData, isLoading } = useRestaurantReviews(restaurantId, page, 5);
  const { data: distribution } = useRatingDistribution(restaurantId);
  const markHelpful = useMarkReviewHelpful();

  const handleMarkHelpful = (reviewId: string) => {
    markHelpful.mutate(reviewId);
  };

  return (
    <Card className="mt-8">
      <CardHeader
        className="cursor-pointer flex-row items-center justify-between"
        onClick={() => setExpanded(!expanded)}
      >
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Reviews & Ratings
        </CardTitle>
        <Button variant="ghost" size="icon">
          {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </Button>
      </CardHeader>

      {expanded && (
        <CardContent>
          {/* Rating Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Overall Rating */}
            <div className="text-center md:text-left">
              <div className="flex items-center gap-4 justify-center md:justify-start">
                <div className="text-5xl font-bold">{restaurantRating.toFixed(1)}</div>
                <div>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-5 w-5 ${
                          star <= Math.round(restaurantRating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Based on {totalReviews} reviews
                  </p>
                </div>
              </div>
            </div>

            {/* Rating Distribution */}
            {distribution && (
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => (
                  <div key={rating} className="flex items-center gap-2">
                    <span className="text-sm w-3">{rating}</span>
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <Progress
                      value={distribution.percentages[rating as keyof typeof distribution.percentages]}
                      className="h-2 flex-1"
                    />
                    <span className="text-sm text-muted-foreground w-10 text-right">
                      {distribution.distribution[rating as keyof typeof distribution.distribution]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator className="my-6" />

          {/* Reviews List */}
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading reviews...</p>
            </div>
          ) : reviewsData?.reviews.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No reviews yet</p>
              <p className="text-sm text-muted-foreground">Be the first to review this restaurant!</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {reviewsData?.reviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={{
                      id: review.id,
                      rating: review.rating,
                      food_rating: review.food_rating,
                      delivery_rating: review.delivery_rating,
                      review_text: review.review_text || undefined,
                      is_anonymous: review.is_anonymous,
                      helpful_count: review.helpful_count,
                      response_text: review.response_text || undefined,
                      response_date: review.response_date || undefined,
                      created_at: review.created_at,
                      user: review.user ? {
                        full_name: review.user.full_name,
                      } : undefined,
                    }}
                    onMarkHelpful={handleMarkHelpful}
                  />
                ))}
              </div>

              {/* Pagination */}
              {reviewsData && reviewsData.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-4 text-sm text-muted-foreground">
                    Page {page} of {reviewsData.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(reviewsData.totalPages, p + 1))}
                    disabled={page === reviewsData.totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}
