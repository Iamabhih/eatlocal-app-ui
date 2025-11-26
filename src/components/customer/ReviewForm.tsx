import { useState } from 'react';
import { Star, Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useCreateReview } from '@/hooks/useRatingsReviews';

interface ReviewFormProps {
  restaurantId: string;
  orderId: string;
  restaurantName: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ReviewForm({ restaurantId, orderId, restaurantName, onSuccess, onCancel }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [foodRating, setFoodRating] = useState(0);
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  const createReview = useCreateReview();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      return;
    }

    createReview.mutate({
      restaurant_id: restaurantId,
      order_id: orderId,
      rating,
      food_rating: foodRating || rating,
      delivery_rating: deliveryRating || rating,
      review_text: reviewText || undefined,
      is_anonymous: isAnonymous,
    }, {
      onSuccess: () => {
        onSuccess?.();
      },
    });
  };

  const StarRating = ({
    value,
    onChange,
    onHover,
    size = 'lg',
  }: {
    value: number;
    onChange: (v: number) => void;
    onHover?: (v: number) => void;
    size?: 'sm' | 'lg';
  }) => {
    const sizeClass = size === 'lg' ? 'h-8 w-8' : 'h-5 w-5';
    const displayValue = onHover && hoverRating > 0 ? hoverRating : value;

    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="focus:outline-none transition-transform hover:scale-110"
            onClick={() => onChange(star)}
            onMouseEnter={() => onHover?.(star)}
            onMouseLeave={() => onHover?.(0)}
            aria-label={`Rate ${star} stars`}
          >
            <Star
              className={`${sizeClass} ${
                star <= displayValue
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const getRatingLabel = (value: number) => {
    if (value === 0) return 'Select a rating';
    if (value === 1) return 'Poor';
    if (value === 2) return 'Fair';
    if (value === 3) return 'Good';
    if (value === 4) return 'Very Good';
    return 'Excellent';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rate Your Experience</CardTitle>
        <CardDescription>How was your order from {restaurantName}?</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Overall Rating */}
          <div className="text-center space-y-2">
            <Label className="text-base">Overall Rating *</Label>
            <StarRating
              value={rating}
              onChange={setRating}
              onHover={setHoverRating}
              size="lg"
            />
            <p className="text-sm text-muted-foreground">
              {getRatingLabel(hoverRating || rating)}
            </p>
          </div>

          {/* Detailed Ratings */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">Food Quality</Label>
              <StarRating
                value={foodRating}
                onChange={setFoodRating}
                size="sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Delivery Experience</Label>
              <StarRating
                value={deliveryRating}
                onChange={setDeliveryRating}
                size="sm"
              />
            </div>
          </div>

          {/* Review Text */}
          <div className="space-y-2">
            <Label htmlFor="review">Your Review (Optional)</Label>
            <Textarea
              id="review"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Tell others about your experience..."
              rows={4}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground text-right">
              {reviewText.length}/1000 characters
            </p>
          </div>

          {/* Anonymous Option */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="anonymous"
              checked={isAnonymous}
              onCheckedChange={(checked) => setIsAnonymous(checked === true)}
            />
            <label
              htmlFor="anonymous"
              className="text-sm text-muted-foreground cursor-pointer"
            >
              Post anonymously (your name won't be shown)
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1"
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={rating === 0 || createReview.isPending}
              className="flex-1"
            >
              {createReview.isPending ? 'Submitting...' : 'Submit Review'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// Review display component
interface ReviewCardProps {
  review: {
    id: string;
    rating: number;
    food_rating?: number;
    delivery_rating?: number;
    review_text?: string;
    is_anonymous: boolean;
    helpful_count: number;
    response_text?: string;
    response_date?: string;
    created_at: string;
    user?: {
      full_name?: string;
    };
  };
  onMarkHelpful?: (id: string) => void;
}

export function ReviewCard({ review, onMarkHelpful }: ReviewCardProps) {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= review.rating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="font-medium">{review.rating.toFixed(1)}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {review.is_anonymous ? 'Anonymous' : review.user?.full_name || 'Customer'}
            {' • '}
            {new Date(review.created_at).toLocaleDateString('en-ZA', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </p>
        </div>
      </div>

      {review.review_text && (
        <p className="text-sm">{review.review_text}</p>
      )}

      {/* Sub-ratings */}
      {(review.food_rating || review.delivery_rating) && (
        <div className="flex gap-4 text-xs text-muted-foreground">
          {review.food_rating && (
            <span>Food: {review.food_rating.toFixed(1)} ⭐</span>
          )}
          {review.delivery_rating && (
            <span>Delivery: {review.delivery_rating.toFixed(1)} ⭐</span>
          )}
        </div>
      )}

      {/* Restaurant Response */}
      {review.response_text && (
        <div className="bg-muted/50 rounded-lg p-3 ml-4">
          <p className="text-xs text-muted-foreground mb-1">
            Restaurant Response • {new Date(review.response_date!).toLocaleDateString('en-ZA')}
          </p>
          <p className="text-sm">{review.response_text}</p>
        </div>
      )}

      {/* Helpful button */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onMarkHelpful?.(review.id)}
          className="text-xs"
        >
          👍 Helpful ({review.helpful_count})
        </Button>
      </div>
    </div>
  );
}
