import { Heart, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWishlist } from '@/contexts/WishlistContext';
import { useState } from 'react';

export const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

// Function to calculate discount percentage
const calculateDiscountPercentage = (originalPrice: number, currentPrice: number) => {
  if (!originalPrice || originalPrice <= currentPrice) return 0;
  const discount = ((originalPrice - currentPrice) / originalPrice) * 100;
  return Math.round(discount);
};

// RatingStars component for displaying star ratings
const RatingStars = ({ rating, size = 16, showNumber = false }: { rating: number; size?: number; showNumber?: boolean }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} size={size} className="fill-yellow-400 text-yellow-400" />
        ))}
        {hasHalfStar && (
          <div className="relative">
            <Star size={size} className="text-gray-300" />
            <Star 
              size={size} 
              className="fill-yellow-400 text-yellow-400 absolute left-0" 
              style={{ clipPath: 'inset(0 50% 0 0)' }}
            />
          </div>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} size={size} className="text-gray-300" />
        ))}
      </div>
      {showNumber && rating > 0 && (
        <span className="text-xs text-gray-600 font-medium ml-1">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    original_price?: number;
    is_on_sale?: boolean;
    images: string[];
    category: string;
    stock?: number;
    average_rating?: number | null; // Can be null if no reviews
    total_reviews?: number;
  };
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsWishlistLoading(true);
    try {
      await toggleWishlist(product.id, product.name);
    } finally {
      setIsWishlistLoading(false);
    }
  };

  // Calculate discount percentage
  const discountPercentage = product.original_price 
    ? calculateDiscountPercentage(product.original_price, product.price)
    : 0;
  
  // Get real rating data (no fake defaults)
  const averageRating = product.average_rating; // Can be null or undefined
  const totalReviews = product.total_reviews || 0;
  
  // Check if product has real ratings
  const hasRating = averageRating !== null && averageRating !== undefined && averageRating > 0;

  return (
    <Link to={`/product/${product.id}`} className="group block">
      <div className="relative">
        <div className="aspect-[3/4] bg-muted overflow-hidden rounded-lg mb-4">
          <img
            src={product.images[0] || '/placeholder.svg'}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        
        {/* Wishlist Button */}
        <button
          onClick={handleWishlistToggle}
          disabled={isWishlistLoading}
          className={`absolute top-2 right-2 p-2 rounded-full transition-all ${
            isInWishlist(product.id)
              ? 'bg-primary/20 text-primary hover:bg-primary/30'
              : 'bg-white/80 hover:bg-white text-gray-700 hover:text-primary'
          } ${isWishlistLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          aria-label={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart 
            size={18} 
            className={isInWishlist(product.id) ? 'fill-primary' : ''}
          />
        </button>

        {/* Top-Left Badges Container */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {/* Discount Percentage Badge */}
          {discountPercentage > 0 && (
            <div className="bg-white/95 backdrop-blur-sm text-red-600 text-xs px-2 py-1 rounded font-bold shadow-md border border-gray-100 w-fit">
              {discountPercentage}% OFF
            </div>
          )}
          
          {/* Rating Display - Only show if product has real ratings */}
          {hasRating && (
            <div className="bg-white/95 backdrop-blur-sm px-2 py-1 rounded flex items-center gap-1 shadow-md border border-gray-100 w-fit">
              <span className="text-xs font-bold text-gray-900">
                {averageRating.toFixed(1)}
              </span>
              <Star size={10} className="fill-yellow-400 text-yellow-400" />
              {totalReviews > 0 && (
                <span className="text-xs text-gray-600 font-medium ml-0.5">
                  ({totalReviews})
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">{product.category}</p>
        <h3 className="font-medium line-clamp-1">{product.name}</h3>
        
        {/* Rating in product info - Show real ratings or empty state */}
        <div className="flex items-center gap-2">
          {hasRating ? (
            <>
              <RatingStars rating={averageRating} size={14} showNumber={true} />
              {totalReviews > 0 && (
                <span className="text-xs text-gray-500">
                  ({totalReviews})
                </span>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} size={14} className="text-gray-300" />
                ))}
              </div>
              <span className="text-xs text-gray-400">No ratings yet</span>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <span className="font-semibold">{formatPrice(product.price)}</span>
          {product.original_price && product.original_price > product.price && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(product.original_price)}
            </span>
          )}
        </div>
        
        {/* Discount info below price */}
        {discountPercentage > 0 && (
          <div className="text-xs text-red-600 font-medium">
            Save {formatPrice(product.original_price! - product.price)} ({discountPercentage}% off)
          </div>
        )}
      </div>
    </Link>
  );
};

export default ProductCard;