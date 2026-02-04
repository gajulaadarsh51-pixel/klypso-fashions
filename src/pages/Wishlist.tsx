import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2, ArrowLeft } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useWishlist, WishlistItem } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { formatPrice } from '@/components/ProductCard';

const Wishlist = () => {
  const { wishlistItems, isLoading, removeFromWishlist, fetchWishlist } = useWishlist();
  const { addToCart, setIsCartOpen } = useCart();

  const handleRemove = async (productId: string, productName: string) => {
    await removeFromWishlist(productId);
    toast.success(`Removed ${productName} from wishlist`);
  };

  const handleAddToCart = async (item: WishlistItem) => {
    try {
      if (!item.product) {
        toast.error('Product information is missing');
        return;
      }

      // Ensure colors and sizes are properly formatted
      const colors = item.product.colors || [];
      const sizes = item.product.sizes || [];
      
      // Extract color name if it's an object
      const processedColors = colors.map((color: any) => {
        if (typeof color === 'object' && color !== null) {
          return color.name || color.hex || 'Black';
        }
        return color || 'Black';
      });

      // Extract size value if it's an object
      const processedSizes = sizes.map((size: any) => {
        if (typeof size === 'object' && size !== null) {
          return size.value || size.name || 'M';
        }
        return size || 'M';
      });

      const product = {
        id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        images: item.product.images || [],
        category: item.product.category || '',
        sizes: processedSizes,
        colors: processedColors,
        stock: item.product.stock || 10
      };
      
      // Use available sizes and colors or defaults
      const size = product.sizes[0] || 'M';
      const color = product.colors[0] || 'Black';
      
      // Convert color to string if it's an object
      const colorString = typeof color === 'object' && color !== null 
        ? (color.name || color.hex || 'Black') 
        : color;
      
      addToCart(product, size, colorString, 1);
      
      // Optional: Open cart drawer after adding
      if (setIsCartOpen) {
        setIsCartOpen(true);
      }
      
      toast.success('Added to cart successfully');
      
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      toast.error(error.message || 'Failed to add to cart. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Heart className="h-8 w-8 animate-pulse mx-auto mb-4" />
            <p>Loading wishlist...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-3 py-6 sm:px-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <Link to="/products" className="inline-flex items-center gap-2 text-xs sm:text-sm text-muted-foreground hover:text-foreground mb-3 sm:mb-4">
            <ArrowLeft size={14} className="sm:size-4" />
            Continue Shopping
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2">My Wishlist</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'}
              </p>
            </div>
          </div>
        </div>

        {wishlistItems.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <Heart className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground mb-3 sm:mb-4" />
            <h2 className="text-lg sm:text-xl md:text-2xl font-semibold mb-1 sm:mb-2">Your wishlist is empty</h2>
            <p className="text-sm text-muted-foreground mb-4 sm:mb-6">
              Save items you love for later
            </p>
            <Button asChild size="sm" className="sm:size-default">
              <Link to="/products">Start Shopping</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {wishlistItems.map((item) => (
              <div key={item.id} className="group relative">
                {/* Image container - Much smaller on mobile */}
                <div className="aspect-square bg-muted overflow-hidden rounded-md sm:rounded-lg mb-2 sm:mb-3 md:mb-4">
                  {item.product?.images?.[0] ? (
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Heart className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Remove button - smaller on mobile */}
                <button
                  onClick={() => handleRemove(item.product_id, item.product?.name || 'Item')}
                  className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 md:top-2 md:right-2 p-1 sm:p-1.5 bg-white/80 hover:bg-white rounded-full transition-colors z-10"
                  aria-label="Remove from wishlist"
                >
                  <Trash2 size={12} className="sm:size-3 md:size-[14px] text-destructive" />
                </button>

                {/* Product info - compact for mobile */}
                <div className="space-y-0.5 sm:space-y-1 relative z-10 bg-background">
                  <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground line-clamp-1">
                    {typeof item.product?.category === 'string' 
                      ? item.product.category 
                      : 'Uncategorized'}
                  </p>
                  <h3 className="font-medium text-xs sm:text-sm md:text-base line-clamp-1">
                    {item.product?.name || 'Product'}
                  </h3>
                  <div className="flex items-center justify-between pt-1">
                    <span className="font-semibold text-xs sm:text-sm md:text-base">
                      {formatPrice(item.product?.price || 0)}
                    </span>
                    <Button
                      size="sm"
                      onClick={() => handleAddToCart(item)}
                      className="gap-1 h-7 sm:h-8 md:h-9 px-2 text-xs"
                      disabled={!item.product}
                    >
                      <ShoppingBag size={10} className="sm:size-3 md:size-4" />
                      <span className="hidden xs:inline">Add</span>
                    </Button>
                  </div>
                </div>

                {/* Product link overlay */}
                <Link
                  to={`/product/${item.product_id}`}
                  className="absolute inset-0 z-0"
                  aria-label={`View ${item.product?.name} details`}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Wishlist;