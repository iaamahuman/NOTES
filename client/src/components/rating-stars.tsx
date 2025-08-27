import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingStarsProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
  count?: number;
}

export function RatingStars({ 
  rating, 
  onRatingChange, 
  readonly = false, 
  size = "md",
  showCount = false,
  count = 0
}: RatingStarsProps) {
  const [hoverRating, setHoverRating] = useState(0);
  
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4", 
    lg: "h-5 w-5"
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  };

  const handleStarClick = (starRating: number) => {
    if (readonly || !onRatingChange) return;
    onRatingChange(starRating);
  };

  const handleMouseEnter = (starRating: number) => {
    if (readonly) return;
    setHoverRating(starRating);
  };

  const handleMouseLeave = () => {
    if (readonly) return;
    setHoverRating(0);
  };

  const displayRating = hoverRating || rating;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            sizeClasses[size],
            "transition-colors duration-150",
            displayRating >= star 
              ? "text-yellow-400 fill-yellow-400" 
              : "text-gray-300",
            !readonly && onRatingChange && "cursor-pointer hover:scale-110 transition-transform"
          )}
          onClick={() => handleStarClick(star)}
          onMouseEnter={() => handleMouseEnter(star)}
          onMouseLeave={handleMouseLeave}
          data-testid={`star-${star}`}
        />
      ))}
      
      {showCount && count > 0 && (
        <span className={cn("text-gray-600 ml-1", textSizes[size])}>
          ({count.toLocaleString()})
        </span>
      )}
      
      {!showCount && rating > 0 && (
        <span className={cn("text-gray-600 ml-1 font-medium", textSizes[size])}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}