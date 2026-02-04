import { useState } from "react"
import { Star, User, Calendar, ThumbsUp, MessageSquare, Send, Loader2 } from "lucide-react"
import { useProductReviews } from "@/hooks/useReviews"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"


interface ProductReviewsProps {
  productId: string
}

const ProductReviews = ({ productId }: ProductReviewsProps) => {
  const { user } = useAuth()
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hoverRating, setHoverRating] = useState(0)
  
  const { reviews, stats, isLoading, addReview } = useProductReviews(productId)

  const handleSubmitReview = async () => {
    if (!user) {
      // You might want to trigger a login modal here
      return
    }

    if (!comment.trim()) {
      alert("Please write a review comment")
      return
    }

    setIsSubmitting(true)
    const success = await addReview(user.id, rating, comment)
    
    if (success) {
      setComment("")
      setRating(5)
    }
    setIsSubmitting(false)
  }

  const renderStars = (currentRating: number, size: "sm" | "md" | "lg" = "md") => {
    const sizes = {
      sm: "h-3 w-3",
      md: "h-4 w-4",
      lg: "h-5 w-5",
    }

    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              sizes[size],
              star <= currentRating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            )}
          />
        ))}
      </div>
    )
  }

  const getRatingPercentage = (ratingValue: number) => {
    if (!stats?.rating_breakdown || !stats.total_reviews) return 0
    const breakdown = stats.rating_breakdown as Record<string, number>
    const count = breakdown[ratingValue] || 0
    return (count / stats.total_reviews) * 100
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <section className="py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Review Summary */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border shadow-sm">
              <h3 className="text-2xl font-bold mb-4">Customer Reviews</h3>
              
              {/* Overall Rating */}
              <div className="flex items-center gap-4 mb-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary">
                    {stats?.avg_rating?.toFixed(1) || "0.0"}
                  </div>
                  <div className="flex items-center justify-center mt-1">
                    {renderStars(Math.round(stats?.avg_rating || 0), "md")}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {stats?.total_reviews || 0} {stats?.total_reviews === 1 ? 'review' : 'reviews'}
                  </p>
                </div>
              </div>

              {/* Rating Breakdown */}
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((star) => (
                  <div key={star} className="flex items-center gap-2">
                    <div className="flex items-center gap-1 w-16">
                      <span className="text-sm font-medium">{star}</span>
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    </div>
                    <Progress 
                      value={getRatingPercentage(star)} 
                      className="h-2 flex-1"
                    />
                    <span className="text-sm text-muted-foreground w-10 text-right">
                      {Math.round(getRatingPercentage(star))}%
                    </span>
                  </div>
                ))}
              </div>

              {/* Write Review Button */}
              <Button 
                onClick={() => {
                  if (!user) {
                    // Trigger login modal
                    document.dispatchEvent(new CustomEvent('open-auth-modal'))
                    return
                  }
                  document.getElementById('write-review')?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="w-full mt-6"
                size="lg"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Write a Review
              </Button>
            </div>

            {/* Review Guidelines */}
            <div className="bg-muted/50 rounded-xl p-6 border">
              <h4 className="font-semibold mb-3">Review Guidelines</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <ThumbsUp className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Share your honest experience with the product</span>
                </li>
                <li className="flex items-start gap-2">
                  <ThumbsUp className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Include details about quality, fit, and sizing</span>
                </li>
                <li className="flex items-start gap-2">
                  <ThumbsUp className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Reviews are approved within 24 hours</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column - Reviews and Form */}
          <div className="lg:col-span-2 space-y-8">
            {/* Write Review Form */}
            <div id="write-review" className="bg-white dark:bg-gray-900 rounded-xl p-6 border shadow-sm">
              <h4 className="text-lg font-semibold mb-4">
                {user ? "Write Your Review" : "Sign in to write a review"}
              </h4>
              
              {user ? (
                <>
                  {/* Rating Selection */}
                  <div className="mb-4">
                    <p className="text-sm font-medium mb-2">Your Rating</p>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="p-1"
                        >
                          <Star
                            className={cn(
                              "h-8 w-8 transition-colors",
                              star <= (hoverRating || rating)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            )}
                          />
                        </button>
                      ))}
                      <span className="ml-2 text-sm text-muted-foreground">
                        {rating} {rating === 1 ? 'star' : 'stars'}
                      </span>
                    </div>
                  </div>

                  {/* Comment Input */}
                  <div className="mb-4">
                    <Textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Share your experience with this product..."
                      className="min-h-[120px]"
                      disabled={isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Minimum 10 characters required
                    </p>
                  </div>

                  {/* Submit Button */}
                  <Button
                    onClick={handleSubmitReview}
                    disabled={comment.length < 10 || isSubmitting}
                    className="w-full sm:w-auto"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Submit Review
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Sign in to share your thoughts about this product
                  </p>
                  <Button
                    onClick={() => document.dispatchEvent(new CustomEvent('open-auth-modal'))}
                  >
                    Sign In to Review
                  </Button>
                </div>
              )}
            </div>
              
            {/* Reviews List */}
            <div>
              <h4 className="text-lg font-semibold mb-4">
                Customer Reviews ({reviews.length})
              </h4>
              
              {reviews.length === 0 ? (
                <div className="text-center py-12 border rounded-xl">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="bg-white dark:bg-gray-900 rounded-xl p-6 border shadow-sm"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            {review.user_avatar ? (
                              <img
                                src={review.user_avatar}
                                alt={review.user_name || 'User'}
                                className="w-10 h-10 rounded-full"
                              />
                            ) : (
                              <User className="h-5 w-5 text-primary" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold">
                              {review.user_name || 'Anonymous'}
                            </p>
                            <div className="flex items-center gap-2">
                              {renderStars(review.rating, "sm")}
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                      </div>
                      
                      <p className="text-foreground">{review.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
  
}

export default ProductReviews