import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Minus, Plus, ChevronLeft, Heart, Share2, Check, Loader2, ShoppingBag, Ruler, Facebook, Twitter, Mail, Copy, MessageCircle } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard, { formatPrice } from '@/components/ProductCard';
import AuthModal from '@/components/AuthModal';
import { useProduct, useProducts } from '@/hooks/useProducts';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { useWishlist } from '@/contexts/WishlistContext';
import ProductReviews from "@/components/ProductReviews";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const { data: product, isLoading } = useProduct(id || '');
  const { data: allProducts = [] } = useProducts();
  
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
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
          <div className="text-center">
            <h1 className="font-heading text-2xl mb-4">Product not found</h1>
            <button onClick={() => navigate('/products')} className="btn-outline">
              BACK TO SHOP
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const relatedProducts = allProducts
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast({
        title: 'Please select a size',
        variant: 'destructive',
      });
      return;
    }
    if (!selectedColor) {
      toast({
        title: 'Please select a color',
        variant: 'destructive',
      });
      return;
    }

    addToCart(product, selectedSize, selectedColor, quantity);
    toast({
      title: 'Added to bag',
      description: `${product.name} has been added to your bag.`,
    });
  };

  const handleWishlistToggle = async () => {
    setIsWishlistLoading(true);
    try {
      await toggleWishlist(product.id, product.name);
      toast({
        title: isInWishlist(product.id) ? 'Removed from wishlist' : 'Added to wishlist',
        description: `${product.name} ${isInWishlist(product.id) ? 'removed from' : 'added to'} your wishlist.`,
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
          // Use modern clipboard API with fallback
          if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(productUrl);
          } else {
            // Fallback for non-secure contexts
            const textArea = document.createElement('textarea');
            textArea.value = productUrl;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            document.execCommand('copy');
            textArea.remove();
          }
          toast({
            title: 'Link Copied!',
            description: 'Product link copied to clipboard',
            duration: 3000,
          });
          setShowShareMenu(false);
          break;

        case 'facebook':
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}&quote=${encodeURIComponent(shareText)}`, '_blank', 'noopener,noreferrer');
          setShowShareMenu(false);
          break;

        case 'twitter':
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(productUrl)}`, '_blank', 'noopener,noreferrer');
          setShowShareMenu(false);
          break;

        case 'whatsapp':
          window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank', 'noopener,noreferrer');
          setShowShareMenu(false);
          break;

        case 'telegram':
          window.open(`https://t.me/share/url?url=${encodeURIComponent(productUrl)}&text=${encodeURIComponent(product.name)}`, '_blank', 'noopener,noreferrer');
          setShowShareMenu(false);
          break;

        case 'email':
          window.open(`mailto:?subject=${encodeURIComponent(product.name)}&body=${encodeURIComponent(shareText)}`, '_blank', 'noopener,noreferrer');
          setShowShareMenu(false);
          break;

        case 'sms':
          window.open(`sms:?body=${encodeURIComponent(shareText)}`, '_blank', 'noopener,noreferrer');
          setShowShareMenu(false);
          break;

        default:
          // Native Web Share API
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
            // Fallback - show toast with instructions
            toast({
              title: 'Share Options',
              description: 'Select a platform from the menu below',
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
        duration: 3000,
      });
    }
  };

  const images = product.images || [];
  const sizes = product.sizes || [];
  const colors = product.colors || [];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <AuthModal />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ChevronLeft size={18} />
            Back
          </button>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Images */}
            <div className="space-y-4">
              <div className="aspect-[3/4] bg-muted overflow-hidden">
                <img
                  src={images[selectedImage] || '/placeholder.svg'}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-4">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`aspect-square bg-muted overflow-hidden border-2 transition-colors ${
                        selectedImage === index ? 'border-primary' : 'border-transparent'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${product.name} view ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="lg:py-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground tracking-wider uppercase mb-2">
                    {product.category}
                  </p>
                  <h1 className="font-heading text-3xl md:text-4xl font-semibold">
                    {product.name}
                  </h1>
                </div>
                <div className="flex gap-2 relative">
                  <button 
                    onClick={handleWishlistToggle}
                    disabled={isWishlistLoading}
                    className={`p-2 border transition-colors ${
                      isInWishlist(product.id) 
                        ? 'border-primary bg-primary/10 text-primary hover:bg-primary/20' 
                        : 'border-border hover:border-primary hover:bg-muted'
                    } ${isWishlistLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    aria-label={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    <Heart 
                      size={20} 
                      className={isInWishlist(product.id) ? 'fill-primary' : ''}
                    />
                  </button>
                  
                  {/* Share Button with Dropdown */}
                  <div className="relative">
                    <button 
                      onClick={() => setShowShareMenu(!showShareMenu)}
                      className="p-2 border border-border hover:border-primary hover:bg-muted transition-colors"
                      aria-label="Share product"
                    >
                      <Share2 size={20} />
                    </button>
                    
                    {/* Share Dropdown Menu */}
                    {showShareMenu && (
                      <>
                        {/* Overlay to close menu when clicking outside */}
                        <div 
                          className="fixed inset-0 z-40"
                          onClick={() => setShowShareMenu(false)}
                        />
                        
                        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-border z-50 overflow-hidden">
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
                          
                          {/* Main Share Options */}
                          <div className="p-5">
                            {/* Native Share (Mobile) */}
                            {navigator.share && (
                              <button
                                onClick={() => handleShare()}
                                className="w-full px-4 py-3.5 text-left hover:bg-muted/50 transition-all rounded-lg mb-3 flex items-center gap-3 group"
                              >
                                <div className="p-2.5 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
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
                              className="w-full px-4 py-3.5 text-left hover:bg-muted/50 transition-all rounded-lg mb-3 flex items-center gap-3 group"
                            >
                              <div className="p-2.5 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                                <Copy size={18} className="text-blue-500" />
                              </div>
                              <div>
                                <span className="text-sm font-medium block">Copy Link</span>
                                <span className="text-xs text-muted-foreground">Copy to clipboard</span>
                              </div>
                            </button>
                            
                            {/* Share Platform Grid */}
                            <div className="mt-4">
                              <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Share on</p>
                              <div className="grid grid-cols-4 gap-3">
                                {/* WhatsApp */}
                                <button
                                  onClick={() => handleShare('whatsapp')}
                                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-green-500/10 hover:bg-green-500/20 transition-colors group"
                                  aria-label="Share on WhatsApp"
                                >
                                  <div className="p-2.5 bg-green-500 rounded-full mb-2 group-hover:scale-110 transition-transform">
                                    <MessageCircle size={18} className="text-white" />
                                  </div>
                                  <span className="text-xs font-medium">WhatsApp</span>
                                </button>
                                
                                {/* Facebook */}
                                <button
                                  onClick={() => handleShare('facebook')}
                                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 transition-colors group"
                                  aria-label="Share on Facebook"
                                >
                                  <div className="p-2.5 bg-blue-600 rounded-full mb-2 group-hover:scale-110 transition-transform">
                                    <Facebook size={18} className="text-white" />
                                  </div>
                                  <span className="text-xs font-medium">Facebook</span>
                                </button>
                                
                                {/* Twitter */}
                                <button
                                  onClick={() => handleShare('twitter')}
                                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 transition-colors group"
                                  aria-label="Share on Twitter"
                                >
                                  <div className="p-2.5 bg-sky-500 rounded-full mb-2 group-hover:scale-110 transition-transform">
                                    <Twitter size={18} className="text-white" />
                                  </div>
                                  <span className="text-xs font-medium">Twitter</span>
                                </button>
                                
                                {/* Email */}
                                <button
                                  onClick={() => handleShare('email')}
                                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-gray-600/10 hover:bg-gray-600/20 transition-colors group"
                                  aria-label="Share via Email"
                                >
                                  <div className="p-2.5 bg-gray-600 rounded-full mb-2 group-hover:scale-110 transition-transform">
                                    <Mail size={18} className="text-white" />
                                  </div>
                                  <span className="text-xs font-medium">Email</span>
                                </button>
                                
                                {/* SMS */}
                                <button
                                  onClick={() => handleShare('sms')}
                                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 transition-colors group"
                                  aria-label="Share via SMS"
                                >
                                  <div className="p-2.5 bg-purple-500 rounded-full mb-2 group-hover:scale-110 transition-transform">
                                    <MessageCircle size={18} className="text-white" />
                                  </div>
                                  <span className="text-xs font-medium">SMS</span>
                                </button>
                                
                                {/* Telegram */}
                                <button
                                  onClick={() => handleShare('telegram')}
                                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-blue-400/10 hover:bg-blue-400/20 transition-colors group"
                                  aria-label="Share on Telegram"
                                >
                                  <div className="p-2.5 bg-blue-400 rounded-full mb-2 group-hover:scale-110 transition-transform">
                                    <svg className="w-[18px] h-[18px] text-white" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.57-1.38-.93-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.06-.2-.07-.06-.17-.04-.24-.02-.1.02-1.77 1.12-5 3.28-.47.33-.9.44-1.29.43-.43-.01-1.27-.24-1.89-.44-.76-.24-1.36-.37-1.31-.78.03-.24.33-.49.9-.75 3.47-1.51 5.78-2.52 6.94-3.03 3.16-1.37 3.81-1.61 4.24-1.61.09 0 .3.02.43.14.11.1.14.24.15.38-.01.12.01.39 0 .01z"/>
                                    </svg>
                                  </div>
                                  <span className="text-xs font-medium">Telegram</span>
                                </button>
                              </div>
                            </div>
                          </div>
                          
                          {/* Footer */}
                          <div className="px-5 py-3 border-t border-border bg-muted/30">
                            <button
                              onClick={() => setShowShareMenu(false)}
                              className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
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

              <div className="flex items-center gap-3 sm:gap-4 mb-6 flex-wrap">
                <span className="text-xl sm:text-2xl font-semibold">{formatPrice(product.price)}</span>
                {product.original_price && (
                  <span className="text-base sm:text-lg text-muted-foreground line-through">
                    {formatPrice(product.original_price)}
                  </span>
                )}
                {product.is_on_sale && (
                  <span className="bg-destructive text-destructive-foreground text-[10px] sm:text-xs px-2 py-0.5 sm:px-3 sm:py-1 rounded-sm">
                    SALE
                  </span>
                )}
              </div>

              <p className="text-muted-foreground mb-8">{product.description}</p>

              {/* Color Selection */}
              {colors.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xs tracking-wider mb-3 font-medium">
                    COLOR: {selectedColor && <span className="font-normal">{selectedColor}</span>}
                  </h3>
                  <div className="flex gap-3">
                    {colors.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => setSelectedColor(color.name)}
                        className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
                          selectedColor === color.name ? 'border-primary scale-110' : 'border-border'
                        }`}
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                      >
                        {selectedColor === color.name && (
                          <Check
                            size={16}
                            className={color.hex === '#ffffff' ? 'text-primary' : 'text-white'}
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
                    <h3 className="text-xs tracking-wider font-medium">SELECT SIZE</h3>
                    <Link 
                      to="/legal/size-guide" 
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors link-underline flex items-center gap-1"
                    >
                      <Ruler size={12} />
                      Size Guide
                    </Link>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`min-w-[3rem] px-4 py-3 border text-sm font-medium transition-all ${
                          selectedSize === size
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border hover:border-primary'
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
                <h3 className="text-xs tracking-wider mb-3 font-medium">QUANTITY</h3>
                <div className="flex items-center border border-border w-fit">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-3 hover:bg-muted transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={18} />
                  </button>
                  <span className="px-6 text-lg font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-3 hover:bg-muted transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>

              {/* Add to Cart */}
              <button onClick={handleAddToCart} className="w-full btn-primary text-sm sm:text-base py-3.5 sm:py-4 flex items-center justify-center gap-2">
                <ShoppingBag size={18} />
                ADD TO BAG
              </button>

              {/* Stock Info */}
              {product.stock <= 5 && product.stock > 0 && (
                <p className="text-sm text-destructive mt-4">
                  Only {product.stock} left in stock!
                </p>
              )}
            </div>
          </div>

          {/* Product Reviews Section - Added here */}
          <section className="mt-20">
            <ProductReviews productId={product.id} />
          </section>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <section className="mt-20">
              <h2 className="font-heading text-2xl md:text-3xl font-semibold mb-8">
                You May Also Like
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
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