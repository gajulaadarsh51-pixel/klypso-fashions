// src/components/ExclusiveDrops.tsx
import { Link } from 'react-router-dom';
import { Clock, Sparkles, Eye, ChevronLeft, ChevronRight, ImageOff, Diamond, Shield } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { useProducts } from '@/hooks/useProducts';

interface ExclusiveDrop {
  id: string;
  title: string;
  brand: string;
  image_url: string;
  release_date: string;
  price: number;
  original_price?: number;
  is_limited: boolean;
  stock_count?: number;
  category: string;
  hype_level?: 'high' | 'medium' | 'low';
  is_premium?: boolean;
  material?: string;
}

// Fallback images for error cases
const FALLBACK_IMAGES: Record<string, string> = {
  'default': 'https://images.unsplash.com/photo-1598033121414-5e23d7a8c5e8?w=800&auto=format&fit=crop&q=60'
};

// Format price in Indian Rupees
const formatIndianPrice = (price: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
};

const ExclusiveDrops = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: allProducts = [] } = useProducts();
  const [timeLeft, setTimeLeft] = useState<{ [key: string]: string }>({});
  const [imageErrors, setImageErrors] = useState<{ [key: string]: boolean }>({});
  const [imagesLoaded, setImagesLoaded] = useState<{ [key: string]: boolean }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [exclusiveDrops, setExclusiveDrops] = useState<ExclusiveDrop[]>([]);

  // Transform real products into exclusive drops
  useEffect(() => {
    if (allProducts.length > 0) {
      // Take first 8 products or all if less than 8
      const drops = allProducts.slice(0, 8).map((product, index) => ({
        id: product.id,
        title: product.name,
        brand: product.brand || 'Premium Brand',
        image_url: product.images?.[0] || product.image_url || '',
        release_date: new Date(Date.now() + (index + 1) * 86400000).toISOString(), // Staggered release dates
        price: product.price,
        original_price: product.original_price,
        is_limited: product.stock < 50 || index % 2 === 0,
        stock_count: product.stock,
        category: product.category,
        hype_level: index < 3 ? 'high' : index < 6 ? 'medium' : 'low',
        is_premium: product.price > 5000,
        material: product.material || 'Premium Quality'
      }));
      
      setExclusiveDrops(drops);
    }
  }, [allProducts]);

  // Preload images with error handling and loading state
  useEffect(() => {
    if (exclusiveDrops.length === 0) return;

    const preloadImages = async () => {
      const loadPromises = exclusiveDrops.map(drop => {
        return new Promise((resolve) => {
          const img = new Image();
          
          img.onload = () => {
            setImagesLoaded(prev => ({ ...prev, [drop.id]: true }));
            resolve(true);
          };
          
          img.onerror = () => {
            // Try fallback image
            const fallbackImg = new Image();
            fallbackImg.src = FALLBACK_IMAGES.default;
            
            fallbackImg.onload = () => {
              setImageErrors(prev => ({ ...prev, [drop.id]: true }));
              setImagesLoaded(prev => ({ ...prev, [drop.id]: true }));
              resolve(true);
            };
            
            fallbackImg.onerror = () => {
              setImageErrors(prev => ({ ...prev, [drop.id]: true }));
              setImagesLoaded(prev => ({ ...prev, [drop.id]: false }));
              resolve(false);
            };
            
            fallbackImg.src = FALLBACK_IMAGES.default;
          };
          
          img.src = drop.image_url;
          img.loading = 'eager';
        });
      });

      await Promise.all(loadPromises);
      setIsLoading(false);
    };
    
    preloadImages();
  }, [exclusiveDrops]);

  // Always show "Available now" instead of countdown
  useEffect(() => {
    if (exclusiveDrops.length > 0) {
      const availableNow: { [key: string]: string } = {};
      exclusiveDrops.forEach(drop => {
        availableNow[drop.id] = 'Available now';
      });
      setTimeLeft(availableNow);
    }
  }, [exclusiveDrops]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 400;
      const newScrollLeft = scrollRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
      scrollRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  const handleImageError = (dropId: string) => {
    setImageErrors(prev => ({ ...prev, [dropId]: true }));
  };

  const getImageSrc = (drop: ExclusiveDrop) => {
    if (imageErrors[drop.id]) {
      return FALLBACK_IMAGES.default;
    }
    return drop.image_url;
  };

  // Helper function to get product detail URL
  const getProductUrl = (productId: string) => {
    return `/product/${productId}`;
  };

  // Show loading state
  if (isLoading || exclusiveDrops.length === 0) {
    return (
      <section className="py-12 md:py-24 bg-gradient-to-b from-stone-100 via-white to-stone-100">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-900"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 md:py-24 bg-gradient-to-b from-stone-100 via-white to-stone-100">
      {/* Background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-64 md:w-96 h-64 md:h-96 bg-amber-200/40 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-64 md:w-96 h-64 md:h-96 bg-stone-300/40 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-px bg-gradient-to-r from-transparent via-amber-300/30 to-transparent" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3g%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3g%20fill%3D%22%239C8A6D%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-8 md:mb-12">
          <div className="flex items-center gap-4 md:gap-5 mb-4 sm:mb-0">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-300/60 blur-xl rounded-full" />
              <div className="relative w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-amber-900 to-stone-900 rounded-xl flex items-center justify-center">
                <Sparkles className="text-amber-200" size={20} />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-light text-stone-900 tracking-tight">
                  Exclusive Drops
                </h2>
                <span className="hidden sm:inline-flex px-2 py-1 bg-amber-900/10 text-amber-900 text-[10px] font-semibold tracking-wider border border-amber-900/20 rounded-lg">
                  NEW
                </span>
              </div>
              <p className="font-sans text-xs md:text-sm text-stone-600 tracking-wide flex items-center gap-3">
                <Shield size={12} className="text-amber-700" />
                <span>Curated luxury apparel • Authentic craftsmanship • Exclusive preview</span>
              </p>
            </div>
          </div>

          {exclusiveDrops.length > 4 && (
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={() => scroll('left')}
                className="p-3 rounded-xl bg-white border border-stone-300 hover:bg-stone-50 transition-colors"
                aria-label="Scroll left"
              >
                <ChevronLeft size={18} className="text-stone-700" />
              </button>
              <button
                onClick={() => scroll('right')}
                className="p-3 rounded-xl bg-white border border-stone-300 hover:bg-stone-50 transition-colors"
                aria-label="Scroll right"
              >
                <ChevronRight size={18} className="text-stone-700" />
              </button>
            </div>
          )}
        </div>

        {/* Drops Grid/Scroll */}
        <div className="relative">
          <div
            ref={scrollRef}
            className="flex gap-5 md:gap-8 overflow-x-auto pb-6 md:pb-8 scrollbar-hide snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {exclusiveDrops.map((drop) => (
              <div
                key={drop.id}
                className="flex-shrink-0 w-[280px] sm:w-[300px] md:w-[340px] bg-white rounded-2xl border border-stone-200/80 shadow-sm overflow-hidden snap-start hover:shadow-lg transition-shadow duration-300"
              >
                {/* Image Container */}
                <div className="relative h-48 sm:h-52 md:h-56 bg-stone-100 overflow-hidden rounded-t-2xl">
                  {!imageErrors[drop.id] && imagesLoaded[drop.id] ? (
                    <img
                      src={getImageSrc(drop)}
                      alt={drop.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                      loading="eager"
                      decoding="async"
                      onError={() => handleImageError(drop.id)}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-stone-200 to-stone-300">
                      <ImageOff size={32} className="text-stone-600 mb-2" />
                      <span className="text-stone-700 text-sm font-medium">{drop.brand}</span>
                    </div>
                  )}
                  
                  {/* Limited Edition Badge */}
                  {drop.is_limited && (
                    <div className="absolute top-3 left-3 md:top-4 md:left-4">
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-800/90 text-amber-50 text-[10px] font-semibold tracking-wider rounded-xl backdrop-blur-sm border border-amber-700/50">
                        <Eye size={10} className="text-amber-300" />
                        <span className="hidden sm:inline">Limited Edition</span>
                        <span className="sm:hidden">Limited</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 md:p-6">
                  {/* Brand & Category */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] md:text-xs font-semibold text-stone-600 tracking-wider uppercase">
                      {drop.brand}
                    </span>
                    <span className="text-[9px] md:text-[10px] px-3 py-1.5 bg-stone-100 text-stone-700 font-medium tracking-wide rounded-xl border border-stone-200/80">
                      {drop.category}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-serif font-medium text-stone-900 text-base md:text-lg mb-3 line-clamp-1">
                    {drop.title}
                  </h3>

                  {/* Price */}
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span className="text-xl md:text-2xl font-serif font-light text-stone-900">
                      {formatIndianPrice(drop.price)}
                    </span>
                    {drop.original_price && (
                      <span className="text-xs md:text-sm text-stone-400 line-through">
                        {formatIndianPrice(drop.original_price)}
                      </span>
                    )}
                  </div>

                  {/* Release Info - Always shows "Available now" in orange */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-[11px] md:text-xs">
                      <Clock size={12} className="text-orange-500" />
                      <span className="text-orange-600 font-semibold">
                        {timeLeft[drop.id] || 'Available now'}
                      </span>
                    </div>
                  </div>

                  {/* SHOP NOW BUTTON */}
                  <Link
                    to={getProductUrl(drop.id)}
                    className="mt-5 block w-full py-3.5 text-center text-[11px] md:text-xs font-semibold tracking-wider text-white bg-stone-900 uppercase rounded-xl hover:bg-stone-800 transition-colors duration-300"
                  >
                    SHOP NOW
                  </Link>
                </div>
              </div>
            ))}

            {/* View All Card */}
            <Link
              to="/products"
              className="flex-shrink-0 w-[280px] sm:w-[300px] md:w-[340px] bg-gradient-to-br from-stone-100 to-amber-100/50 border-2 border-stone-300/80 rounded-2xl overflow-hidden snap-start hover:shadow-lg transition-shadow duration-300"
            >
              <div className="h-full flex flex-col items-center justify-center p-8 md:p-10 text-center">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-amber-300/40 blur-2xl rounded-full" />
                  <div className="relative w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-amber-900 to-stone-900 rounded-xl flex items-center justify-center">
                    <Diamond className="text-amber-200" size={24} />
                  </div>
                </div>
                <h3 className="font-serif text-2xl md:text-3xl font-light text-stone-900 mb-3">
                  The Complete Collection
                </h3>
                <p className="text-xs md:text-sm text-stone-600 mb-6 max-w-[200px] md:max-w-[220px] leading-relaxed">
                  Explore our curated selection of luxury fashion and accessories
                </p>
                <span className="inline-flex items-center gap-2 text-[11px] md:text-xs font-semibold tracking-wider text-stone-900 uppercase border-b-2 border-stone-400 pb-1 hover:border-stone-900 transition-colors">
                  View All Products
                  <ChevronRight size={14} />
                </span>
              </div>
            </Link>
          </div>
        </div>
        
      </div>
    </section>
  );
};

export default ExclusiveDrops;