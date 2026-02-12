// components/RecentlyViewedProducts.tsx - Darker Dramatic Version
import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { Product } from '@/hooks/useProducts';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';

interface RecentlyViewedProductsProps {
  products: Product[];
  onProductClick?: (product: Product) => void;
}

const RecentlyViewedProducts = ({ products, onProductClick }: RecentlyViewedProductsProps) => {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { removeFromRecentlyViewed } = useRecentlyViewed();

  if (!products || products.length === 0) {
    return null;
  }

  const scrollSection = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollLeft += direction === 'left' ? -scrollAmount : scrollAmount;
    }
  };

  const handleProductClick = (product: Product) => {
    if (onProductClick) {
      onProductClick(product);
    }
    navigate(`/product/${product.id}`);
  };

  const handleRemove = (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    removeFromRecentlyViewed(productId);
  };

  return (
    <section 
      className="py-6 sm:py-8 border-t relative overflow-hidden"
      style={{ 
        background: 'linear-gradient(145deg, #0A1929 0%, #1A2C3E 30%, #4A2E2E 70%, #B85C1F 100%)'
      }}
    >
      {/* Dark overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-transparent to-black/40 pointer-events-none"></div>
      
      {/* Orange/Red glow effect */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/30 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-20 right-20 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl pointer-events-none"></div>
      
      {/* Blue glow effect */}
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-700/30 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-20 left-20 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
      
      {/* Dark accent lines */}
      <div className="absolute top-1/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-orange-400/40 to-transparent"></div>
      <div className="absolute bottom-1/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-orange-600/50 rounded-full blur-md"></div>
              <div className="absolute inset-0 bg-blue-600/30 rounded-full blur-lg"></div>
              <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-indigo-700 flex items-center justify-center shadow-xl shadow-black/40">
                <Eye size={20} className="text-white" />
              </div>
            </div>
            <div>
              <h2 className="font-sans text-lg sm:text-xl md:text-2xl font-semibold text-white drop-shadow-lg">
              Still looking for these ?
              </h2>
              <p className="font-sans text-orange-200/80 text-xs sm:text-sm mt-0.5 drop-shadow">
                Products you've checked out
              </p>
            </div>
          </div>
          
          {/* REMOVED: Clear all button */}
          
          {products.length > 4 && (
            <div className="hidden md:flex items-center gap-2">
              <button 
                onClick={() => scrollSection('left')}
                className="p-2 rounded-full bg-black/30 backdrop-blur-sm border border-white/40 shadow-lg hover:bg-black/50 transition-colors hover:border-white/70"
                aria-label="Scroll left"
              >
                <ChevronLeft size={20} className="text-white drop-shadow" />
              </button>
              <button 
                onClick={() => scrollSection('right')}
                className="p-2 rounded-full bg-black/30 backdrop-blur-sm border border-white/40 shadow-lg hover:bg-black/50 transition-colors hover:border-white/70"
                aria-label="Scroll right"
              >
                <ChevronRight size={20} className="text-white drop-shadow" />
              </button>
            </div>
          )}
        </div>

        <div className="relative">
          <div 
            ref={scrollRef}
            className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {products.map((product) => (
              <div
                key={product.id}
                onClick={() => handleProductClick(product)}
                className="flex-shrink-0 w-[160px] sm:w-[180px] md:w-[200px] bg-white/90 backdrop-blur-sm rounded-xl shadow-2xl border border-white/50 overflow-hidden hover:shadow-3xl transition-all duration-300 cursor-pointer relative"
              >
                {/* REMOVED: X/Remove button */}
                
                {/* Product Image - Full image without cropping, NO zoom animation */}
                <div className="w-full bg-gradient-to-br from-orange-200/80 to-blue-200/80 flex items-center justify-center" style={{ aspectRatio: '1/1' }}>
                  <img
                    src={product.images?.[0] || '/placeholder.svg'}
                    alt={product.name}
                    className="w-full h-full object-contain"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.svg';
                    }}
                  />
                </div>

                {/* Product Info - Only Name */}
                <div className="p-2 sm:p-3 bg-gradient-to-r from-white via-orange-100/70 to-blue-100/70">
                  <h3 className="font-sans text-xs sm:text-sm font-medium text-gray-900 truncate">
                    {product.name}
                  </h3>
                </div>
              </div>
            ))}
          </div>

          {/* REMOVED: Gradient overlays for scroll indication - black left and orange right corner lines */}
        </div>
      </div>
    </section>
  );
};

export default RecentlyViewedProducts;