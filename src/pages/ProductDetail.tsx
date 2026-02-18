// pages/ProductDetail.tsx
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Minus, Plus, ChevronLeft, Heart, Share2, Check, Loader2, 
  ShoppingBag, Ruler, Facebook, Twitter, Mail, Copy, MessageCircle,
  AlertCircle
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard, { formatPrice } from '@/components/ProductCard';
import AuthModal from '@/components/AuthModal';
import { useProduct, useProducts } from '@/hooks/useProducts';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { useWishlist } from '@/contexts/WishlistContext';
import ProductReviews from "@/components/ProductReviews";
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToRecentlyViewed } = useRecentlyViewed();
  
  // Use a ref to track if we've already added this product
  const hasAddedRef = useRef(false);

  const { data: product, isLoading, error } = useProduct(id || '');
  const { data: allProducts = [] } = useProducts();
  
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Add to recently viewed when product is loaded
  useEffect(() => {
    if (product && !hasAddedRef.current) {
      addToRecentlyViewed(product);
      hasAddedRef.current = true;
    }

    // Reset the ref when product ID changes
    return () => {
      hasAddedRef.current = false;
    };
  }, [product, addToRecentlyViewed]);

  // Handle error state
  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="font-heading text-2xl mb-2">Error Loading Product</h1>
            <p className="text-muted-foreground mb-6">
              There was a problem loading this product. Please try again.
            </p>
            <div className="flex gap-4 justify-center">
              <button 
                onClick={() => window.location.reload()} 
                className="btn-primary"
              >
                TRY AGAIN
              </button>
              <button 
                onClick={() => navigate('/products')} 
                className="btn-outline"
              >
                BROWSE PRODUCTS
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <AlertCircle className="h-16 w-16 text-amber-600 mx-auto mb-4" />
            <h1 className="font-heading text-2xl mb-2">Product Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The product you're looking for doesn't exist or has been removed.
            </p>
            <button 
              onClick={() => navigate('/products')} 
              className="btn-primary"
            >
              BROWSE PRODUCTS
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Get related products (excluding current product)
  const relatedProducts = allProducts
    .filter((p) => {
      // Match by category or subcategory
      const categoryMatch = p.category === product.category;
      const subcategoryMatch = p.subcategory && product.subcategory && 
                              p.subcategory === product.subcategory;
      return (categoryMatch || subcategoryMatch) && p.id !== product.id;
    })
    .slice(0, 4);

  const handleAddToCart = () => {
    // Validate size selection if sizes exist
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      toast({
        title: 'Please select a size',
        description: 'Choose a size to continue',
        variant: 'destructive',
      });
      return;
    }
    
    // Validate color selection if colors exist
    if (product.colors && product.colors.length > 0 && !selectedColor) {
      toast({
        title: 'Please select a color',
        description: 'Choose a color to continue',
        variant: 'destructive',
      });
      return;
    }

    // Check stock
    if (product.stock < quantity) {
      toast({
        title: 'Insufficient stock',
        description: `Only ${product.stock} items available`,
        variant: 'destructive',
      });
      return;
    }

    addToCart(product, selectedSize, selectedColor, quantity);
    toast({
      title: 'Added to bag',
      description: `${product.name} has been added to your bag.`,
      duration: 3000,
    });
  };

  const handleWishlistToggle = async () => {
    setIsWishlistLoading(true);
    try {
      await toggleWishlist(product.id, product.name);
      toast({
        title: isInWishlist(product.id) ? 'Removed from wishlist' : 'Added to wishlist',
        description: `${product.name} ${isInWishlist(product.id) ? 'removed from' : 'added to'} your wishlist.`,
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update wishlist',
        variant: 'destructive',
      });
    } finally {
      setIsWishlistLoading(false);
    }
  };

  // Share functionality
  const productUrl = `${window.location.origin}/product/${product.id}`;
  const shareText = `Check out ${product.name} - ${formatPrice(product.price)}\n\n${productUrl}`;

  const handleShare = async (platform?: string) => {
    try {
      switch (platform) {
        case 'copy':
          await navigator.clipboard.writeText(productUrl);
          toast({
            title: 'Link Copied!',
            description: 'Product link copied to clipboard',
            duration: 3000,
          });
          setShowShareMenu(false);
          break;
          
        case 'facebook':
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}&quote=${encodeURIComponent(shareText)}`, '_blank');
          setShowShareMenu(false);
          break;
          
        case 'twitter':
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank');
          setShowShareMenu(false);
          break;
          
        case 'whatsapp':
          window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
          setShowShareMenu(false);
          break;
          
        case 'telegram':
          window.open(`https://t.me/share/url?url=${encodeURIComponent(productUrl)}&text=${encodeURIComponent(product.name)}`, '_blank');
          setShowShareMenu(false);
          break;
          
        case 'email':
          window.open(`mailto:?subject=${encodeURIComponent(product.name)}&body=${encodeURIComponent(shareText)}`);
          setShowShareMenu(false);
          break;
          
        default:
          if (navigator.share) {
            try {
              await navigator.share({
                title: product.name,
                text: shareText,
                url: productUrl,
              });
            } catch (err) {
              if ((err as Error).name !== 'AbortError') {
                console.log('Share was cancelled');
              }
            }
          } else {
            toast({
              title: 'Share Options',
              description: 'Select a platform from the menu',
              duration: 2000,
            });
          }
          setShowShareMenu(false);
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast({
        title: 'Failed to share',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
  };

  // Get images array (handle both string and array formats)
  const getProductImages = () => {
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      return product.images;
    }
    if (product.image_url) {
      return [product.image_url];
    }
    return ['/placeholder-product.jpg'];
  };

  const images = getProductImages();
  const sizes = product.sizes || [];
  const colors = product.colors || [];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <AuthModal />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Back button and breadcrumbs */}
          <div className="mb-8">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
            >
              <ChevronLeft size={18} />
              Back
            </button>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Link to="/" className="hover:text-foreground">Home</Link>
              <span>/</span>
              <Link to="/products" className="hover:text-foreground">Products</Link>
              <span>/</span>
              <Link to={`/products?category=${product.category}`} className="hover:text-foreground">
                {product.category}
              </Link>
              <span>/</span>
              <span className="text-foreground font-medium truncate">{product.name}</span>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Images Section */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="aspect-[3/4] bg-muted overflow-hidden rounded-lg">
                <img
                  src={imageError ? '/placeholder-product.jpg' : images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                  onError={() => setImageError(true)}
                />
              </div>
              
              {/* Thumbnail Grid */}
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-4">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedImage(index);
                        setImageError(false);
                      }}
                      className={`aspect-square bg-muted overflow-hidden rounded-lg border-2 transition-all ${
                        selectedImage === index 
                          ? 'border-primary ring-2 ring-primary/20' 
                          : 'border-transparent hover:border-primary/50'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${product.name} view ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-product.jpg';
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info Section */}
            <div className="lg:py-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground tracking-wider uppercase mb-2">
                    {product.brand || product.category}
                  </p>
                  <h1 className="font-heading text-3xl md:text-4xl font-semibold">
                    {product.name}
                  </h1>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2 relative">
                  <button 
                    onClick={handleWishlistToggle}
                    disabled={isWishlistLoading}
                    className={`p-3 border rounded-lg transition-all ${
                      isInWishlist(product.id) 
                        ? 'border-red-500 bg-red-50 text-red-500 hover:bg-red-100' 
                        : 'border-border hover:border-primary hover:bg-muted'
                    } ${isWishlistLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    aria-label={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    <Heart 
                      size={20} 
                      className={isInWishlist(product.id) ? 'fill-red-500' : ''}
                    />
                  </button>
                  
                  {/* Share Button */}
                  <div className="relative">
                    <button 
                      onClick={() => setShowShareMenu(!showShareMenu)}
                      className="p-3 border border-border hover:border-primary hover:bg-muted rounded-lg transition-colors"
                      aria-label="Share product"
                    >
                      <Share2 size={20} />
                    </button>
                    
                    {/* Share Dropdown Menu */}
                    {showShareMenu && (
                      <>
                        <div 
                          className="fixed inset-0 z-40"
                          onClick={() => setShowShareMenu(false)}
                        />
                        <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-border z-50 overflow-hidden">
                          {/* Header */}
                          <div className="px-5 py-4 bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-primary/20 rounded-lg">
                                <Share2 size={20} className="text-primary" />
                              </div>
                              <div>
                                <p className="font-semibold text-foreground">Share Product</p>
                                <p className="text-xs text-muted-foreground mt-0.5">Share with friends & family</p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Share Options */}
                          <div className="p-5">
                            {/* Native Share */}
                            {navigator.share && (
                              <button
                                onClick={() => handleShare()}
                                className="w-full px-4 py-3 text-left hover:bg-muted/50 rounded-lg mb-2 flex items-center gap-3"
                              >
                                <div className="p-2 bg-primary/10 rounded-lg">
                                  <Share2 size={18} className="text-primary" />
                                </div>
                                <div>
                                  <span className="text-sm font-medium block">Share via...</span>
                                  <span className="text-xs text-muted-foreground">Mobile sharing options</span>
                                </div>
                              </button>
                            )}
                            
                            {/* Copy Link */}
                            <button
                              onClick={() => handleShare('copy')}
                              className="w-full px-4 py-3 text-left hover:bg-muted/50 rounded-lg mb-2 flex items-center gap-3"
                            >
                              <div className="p-2 bg-blue-500/10 rounded-lg">
                                <Copy size={18} className="text-blue-500" />
                              </div>
                              <div>
                                <span className="text-sm font-medium block">Copy Link</span>
                                <span className="text-xs text-muted-foreground">Copy to clipboard</span>
                              </div>
                            </button>
                            
                            {/* Platform Grid */}
                            <div className="grid grid-cols-4 gap-2 mt-4">
                              <button
                                onClick={() => handleShare('whatsapp')}
                                className="flex flex-col items-center p-2 rounded-lg hover:bg-green-50"
                              >
                                <div className="p-2 bg-green-500 rounded-full mb-1">
                                  <MessageCircle size={16} className="text-white" />
                                </div>
                                <span className="text-xs">WhatsApp</span>
                              </button>
                              
                              <button
                                onClick={() => handleShare('facebook')}
                                className="flex flex-col items-center p-2 rounded-lg hover:bg-blue-50"
                              >
                                <div className="p-2 bg-blue-600 rounded-full mb-1">
                                  <Facebook size={16} className="text-white" />
                                </div>
                                <span className="text-xs">Facebook</span>
                              </button>
                              
                              <button
                                onClick={() => handleShare('twitter')}
                                className="flex flex-col items-center p-2 rounded-lg hover:bg-sky-50"
                              >
                                <div className="p-2 bg-sky-500 rounded-full mb-1">
                                  <Twitter size={16} className="text-white" />
                                </div>
                                <span className="text-xs">Twitter</span>
                              </button>
                              
                              <button
                                onClick={() => handleShare('email')}
                                className="flex flex-col items-center p-2 rounded-lg hover:bg-gray-50"
                              >
                                <div className="p-2 bg-gray-600 rounded-full mb-1">
                                  <Mail size={16} className="text-white" />
                                </div>
                                <span className="text-xs">Email</span>
                              </button>
                            </div>
                          </div>
                          
                          {/* Footer */}
                          <div className="px-5 py-3 border-t border-border bg-muted/30">
                            <button
                              onClick={() => setShowShareMenu(false)}
                              className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="flex items-center gap-4 mb-6">
                <span className="text-3xl font-semibold text-primary">
                  {formatPrice(product.price)}
                </span>
                {product.original_price && (
                  <>
                    <span className="text-lg text-muted-foreground line-through">
                      {formatPrice(product.original_price)}
                    </span>
                    <span className="bg-green-100 text-green-700 text-sm px-3 py-1 rounded-full">
                      Save {Math.round(((product.original_price - product.price) / product.original_price) * 100)}%
                    </span>
                  </>
                )}
              </div>

              {/* Description */}
              <p className="text-muted-foreground mb-8 leading-relaxed">
                {product.description}
              </p>

              {/* Color Selection */}
              {colors.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium mb-3">
                    COLOR: <span className="font-normal text-muted-foreground">{selectedColor || 'Select a color'}</span>
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {colors.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => setSelectedColor(color.name)}
                        className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all ${
                          selectedColor === color.name 
                            ? 'border-primary scale-110 ring-2 ring-primary/20' 
                            : 'border-border hover:border-primary'
                        }`}
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                      >
                        {selectedColor === color.name && (
                          <Check
                            size={20}
                            className={color.hex === '#ffffff' || color.hex === '#fff' ? 'text-primary' : 'text-white'}
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Size Selection */}
              {sizes.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium">
                      SIZE: <span className="font-normal text-muted-foreground">{selectedSize || 'Select a size'}</span>
                    </h3>
                    <Link 
                      to="/size-guide" 
                      className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                    >
                      <Ruler size={14} />
                      Size Guide
                    </Link>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`min-w-[3.5rem] px-4 py-3 border text-sm font-medium rounded-lg transition-all ${
                          selectedSize === size
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border hover:border-primary hover:bg-muted'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="mb-8">
                <h3 className="text-sm font-medium mb-3">QUANTITY</h3>
                <div className="flex items-center border border-border rounded-lg w-fit">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-3 hover:bg-muted transition-colors rounded-l-lg"
                    disabled={quantity <= 1}
                  >
                    <Minus size={18} />
                  </button>
                  <span className="px-8 py-3 text-lg font-medium border-x border-border">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock || 10, quantity + 1))}
                    className="p-3 hover:bg-muted transition-colors rounded-r-lg"
                    disabled={quantity >= (product.stock || 10)}
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>

              {/* Add to Cart Button */}
              <button 
                onClick={handleAddToCart} 
                className="w-full btn-primary text-base py-4 flex items-center justify-center gap-2 rounded-lg hover:scale-[1.02] transition-transform"
                disabled={product.stock === 0}
              >
                <ShoppingBag size={20} />
                {product.stock === 0 ? 'OUT OF STOCK' : 'ADD TO BAG'}
              </button>

              {/* Stock Status */}
              {product.stock > 0 && product.stock <= 5 && (
                <p className="text-sm text-amber-600 mt-4 flex items-center gap-2">
                  <AlertCircle size={16} />
                  Only {product.stock} left in stock - order soon!
                </p>
              )}
              
              {product.stock === 0 && (
                <p className="text-sm text-red-600 mt-4 flex items-center gap-2">
                  <AlertCircle size={16} />
                  This product is currently out of stock
                </p>
              )}
            </div>
          </div>

          {/* Product Reviews Section */}
          <section className="mt-16 lg:mt-20">
            <ProductReviews productId={product.id} />
          </section>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <section className="mt-16 lg:mt-20">
              <h2 className="font-heading text-2xl md:text-3xl font-semibold mb-8">
                You May Also Like
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {relatedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetail;