import React, { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTrendingSlides, useTrendingDeals, processGoogleDriveUrl, processGoogleDriveVideoUrl } from "@/hooks/useTrendingSlides";
import { Loader2, Play, ChevronRight } from "lucide-react";

const CHAI = {
  primary: "#C19A6B",
  secondary: "#E6B17E",
  light: "#FDF4E6",
  dark: "#8B5A2B",
  accent: "#DAA520",
  bg: "#FFF9F0"
};

interface DealCardProps {
  deal: {
    id: number;
    discount: string;
    link: string;
    image_url?: string;
    title: string;
    emoji: string;
    category: string;
  };
}

const DealCard: React.FC<DealCardProps> = ({ deal }) => {
  const [error, setError] = useState(false);
  const imageUrl = deal.image_url ? processGoogleDriveUrl(deal.image_url) : '';
  
  return (
    <Link to={deal.link} className="block w-full">
      <div className="bg-white rounded-2xl overflow-hidden border border-[#EDE0D4] active:scale-[0.98] transition-transform hover:shadow-lg">
        <div className="aspect-square relative bg-[#FDF4E6]">
          {!error && imageUrl ? (
            <img 
              src={imageUrl} 
              alt={deal.title}
              className="w-full h-full object-cover"
              onError={() => setError(true)}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-5xl">{deal.emoji}</span>
            </div>
          )}
          <div className="absolute top-2 left-2">
            <span className="bg-gradient-to-r from-[#C19A6B] to-[#8B5A2B] text-white text-xs font-bold px-2.5 py-1.5 rounded-full shadow-sm">
              {deal.discount} OFF
            </span>
          </div>
        </div>
        <div className="p-2">
          <h3 className="text-sm font-medium truncate">{deal.title}</h3>
          <p className="text-xs text-gray-500 capitalize">{deal.category}</p>
        </div>
      </div>
    </Link>
  );
};

// Slide Type 1: Shopping Deals Box (Grid of 4 products)
const ShoppingDealsBox: React.FC<{ className?: string; slide: any; deals: any[] }> = ({ className, slide, deals }) => (
  <div className={`h-full ${className}`}>
    <div className="bg-gradient-to-br from-[#1B4D3E] to-[#2A6E4B] rounded-3xl h-full flex flex-col shadow-sm border border-[#9DC183]">
      <div className="p-5 border-b border-[#9DC183]/30">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">{slide.offer_text || 'Hot Deals For You'}</h2>
            <p className="text-xs text-[#E6D5B8] font-medium mt-0.5">⚡ {slide.subtitle || 'Flash Sale'}</p>
          </div>
          <Link to={slide.button_link || '/products?category=deals'} className="text-sm font-medium text-[#E6D5B8] hover:text-white transition-colors">
            {slide.button_text || 'Explore'} →
          </Link>
        </div>
      </div>
      <div className="p-4 grid grid-cols-2 gap-3 flex-grow">
        {deals.slice(0, 4).map(deal => <DealCard key={deal.id} deal={deal} />)}
      </div>
    </div>
  </div>
);

// Slide Type 2: Premium Suits
const PremiumSuits: React.FC<{ className?: string; slide: any }> = ({ className, slide }) => {
  const [imageError, setImageError] = useState(false);
  const imageUrl = slide.image_url ? processGoogleDriveUrl(slide.image_url) : 'https://images4.alphacoders.com/691/thumb-1920-691279.jpg';
  
  return (
    <div className={`h-full ${className}`}>
      <div className="h-full bg-gradient-to-br from-[#0B3B5C] to-[#1A5F7A] rounded-3xl border border-[#3B9EBF] shadow-sm hover:shadow-lg transition-shadow">
        <div className="p-6 h-full flex flex-col">
          <div className="mb-3">
            <span className="text-[#B0E0FF] text-xs font-semibold uppercase tracking-wider">✦ PREMIUM</span>
            <h3 className="text-white text-3xl font-bold mt-2 leading-tight">
              {slide.title || 'Luxury Suits'}
            </h3>
            <div className="flex items-center gap-2 mt-3">
              <span className="bg-[#B0E0FF]/20 text-[#B0E0FF] text-xs px-3 py-1.5 rounded-full">
                {slide.discount ? `Up to ${slide.discount} Off` : 'Up to 65% Off'}
              </span>
            </div>
          </div>
          <div className="mt-auto">
            <Link to={slide.button_link || '/products?category=men&search=suits'} className="block group">
              <div className="rounded-2xl overflow-hidden border-2 border-[#B0E0FF]/30 group-hover:border-[#B0E0FF] transition-colors">
                {!imageError ? (
                  <img 
                    src={imageUrl}
                    alt={slide.title || 'Suits'}
                    className="w-full h-40 object-cover transition-transform group-hover:scale-105"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-full h-40 bg-[#1A5F7A] flex items-center justify-center">
                    <span className="text-4xl">👔</span>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-white text-sm font-medium group-hover:text-[#B0E0FF] transition-colors">
                  {slide.button_text || 'Shop Collection'}
                </span>
                <span className="text-[#B0E0FF] text-lg transform group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

// Slide Type 3: Street Mode
const StreetMode: React.FC<{ className?: string; slide: any }> = ({ className, slide }) => {
  const [imageError, setImageError] = useState(false);
  const imageUrl = slide.image_url ? processGoogleDriveUrl(slide.image_url) : 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&h=300&fit=crop';
  
  return (
    <div className={`h-full ${className}`}>
      <div className="h-full bg-gradient-to-br from-[#301934] to-[#4B0082] rounded-3xl border-2 border-[#9370DB] shadow-sm hover:shadow-lg transition-shadow">
        <div className="p-6 h-full flex flex-col">
          <div className="mb-3">
            <span className="bg-[#9370DB] text-white text-xs px-3 py-1.5 rounded-full inline-block">
              🔥 SALE
            </span>
            <span className="block text-3xl font-bold text-white mt-4">Min. {slide.discount || '55%'}</span>
            <span className="block text-lg font-semibold text-[#E6E6FA]">{slide.offer_text || 'Ultimate Brand Sale'}</span>
          </div>
          
          <div className="mb-4">
            <h4 className="text-2xl font-bold text-white">{slide.title || 'Street Mode'}</h4>
            <p className="text-sm text-[#E6E6FA]">{slide.subtitle || 'Fresh arrivals'}</p>
          </div>
          
          <div className="space-y-2 mb-4">
            {["Top Brands", "New Styles", "Free Delivery"].map((text, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[#E6E6FA] rounded-full"></div>
                <span className="text-sm text-white">{text}</span>
              </div>
            ))}
          </div>
          
          <div className="my-2">
            <div className="rounded-xl overflow-hidden border-2 border-[#9370DB]">
              {!imageError ? (
                <img 
                  src={imageUrl}
                  alt={slide.title || 'Street Fashion'}
                  className="w-full h-32 object-cover transition-transform hover:scale-105"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-32 bg-[#4B0082] flex items-center justify-center">
                  <span className="text-4xl">👕</span>
                </div>
              )}
            </div>
          </div>
          
          <Link 
            to={slide.button_link || '/products?category=women'}
            className="mt-auto w-full bg-[#E6E6FA] hover:bg-white text-[#301934] text-center py-3.5 rounded-xl text-sm font-bold transition-all hover:shadow-md"
          >
            {slide.button_text || 'SHOP NOW'}
          </Link>
        </div>
      </div>
    </div>
  );
};

// Slide Type 4: Product Grid
const ProductGrid: React.FC<{ className?: string; slide: any }> = ({ className, slide }) => {
  const [imageError, setImageError] = useState(false);
  const imageUrl = slide.image_url ? processGoogleDriveUrl(slide.image_url) : 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=400&h=300&fit=crop';
  
  return (
    <div className={`h-full ${className}`}>
      <div className={`h-full bg-gradient-to-br ${slide.background_gradient} rounded-3xl border shadow-sm hover:shadow-lg transition-all`}
        style={{ borderColor: slide.accent_color?.replace('bg-', '#') || '#E5E7EB' }}
      >
        <div className="p-6 h-full flex flex-col">
          <div className="flex justify-between items-start">
            <div>
              <h3 className={`text-2xl font-bold ${slide.text_color || 'text-gray-900'}`}>
                {slide.title || 'Trending Now'}
              </h3>
              <p className={`text-sm mt-1 ${slide.subtitle_color || 'text-gray-600'}`}>
                {slide.subtitle || 'Top picks for you'}
              </p>
            </div>
            {slide.discount && (
              <span className={`px-3 py-1 text-xs font-bold text-white rounded-full ${slide.accent_color || 'bg-gray-700'}`}>
                {slide.discount} OFF
              </span>
            )}
          </div>
          
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="aspect-square bg-white/80 rounded-lg overflow-hidden border">
                <img 
                  src={imageUrl}
                  alt={`Product ${item}`}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              </div>
            ))}
          </div>
          
          <div className="mt-4 flex items-center justify-between">
            <span className={`text-sm font-medium ${slide.text_color || 'text-gray-900'}`}>
              {slide.offer_text || 'Shop the collection'}
            </span>
            <Link 
              to={slide.button_link || '/products'}
              className={`text-sm font-medium px-4 py-2 rounded-full text-white transition-all hover:shadow-md ${slide.accent_color || 'bg-gray-700'}`}
            >
              {slide.button_text || 'Shop Now'} →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

// Slide Type 5: Video Slide
const VideoSlide: React.FC<{ className?: string; slide: any }> = ({ className, slide }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoUrl = slide.video_url ? processGoogleDriveVideoUrl(slide.video_url) : '';
  const imageUrl = slide.image_url ? processGoogleDriveUrl(slide.image_url) : 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=300&fit=crop';
  
  return (
    <div className={`h-full ${className}`}>
      <div className="h-full bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl border border-gray-700 shadow-sm overflow-hidden">
        <div className="relative h-full flex flex-col">
          {!isPlaying ? (
            <>
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={imageUrl}
                  alt={slide.title || 'Video thumbnail'}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <button
                    onClick={() => setIsPlaying(true)}
                    className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                  >
                    <Play className="w-8 h-8 text-gray-900 ml-1" />
                  </button>
                </div>
                {slide.discount && (
                  <div className="absolute top-4 left-4">
                    <span className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                      {slide.discount} OFF
                    </span>
                  </div>
                )}
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-2xl font-bold text-white">{slide.title || 'Summer Collection'}</h3>
                <p className="text-sm text-gray-300 mt-1">{slide.subtitle || 'New arrivals'}</p>
                <p className="text-sm text-gray-400 mt-2">{slide.offer_text || 'Watch the latest collection video'}</p>
                <div className="mt-auto pt-4">
                  <Link 
                    to={slide.button_link || '/products'}
                    className="inline-flex items-center gap-2 text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full text-sm font-medium transition-colors"
                  >
                    {slide.button_text || 'Shop Collection'} 
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </>
          ) : (
            <div className="absolute inset-0 bg-black">
              <iframe
                src={`${videoUrl}?autoplay=1`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={slide.title || 'Video player'}
              />
              <button
                onClick={() => setIsPlaying(false)}
                className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1.5 rounded-full text-sm hover:bg-black/80 transition-colors"
              >
                Close ✕
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Slide Type 6: Custom Slide
const CustomSlide: React.FC<{ className?: string; slide: any }> = ({ className, slide }) => {
  const [imageError, setImageError] = useState(false);
  const imageUrl = slide.image_url ? processGoogleDriveUrl(slide.image_url) : '';
  
  return (
    <div className={`h-full ${className}`}>
      <div className={`h-full bg-gradient-to-br ${slide.background_gradient} rounded-3xl border shadow-sm hover:shadow-lg transition-all`}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex-1">
            <h3 className={`text-2xl font-bold ${slide.text_color || 'text-gray-900'}`}>
              {slide.title || 'Custom Collection'}
            </h3>
            <p className={`text-sm mt-1 ${slide.subtitle_color || 'text-gray-600'}`}>
              {slide.subtitle || 'Curated just for you'}
            </p>
            
            {imageUrl && !imageError && (
              <div className="mt-4 rounded-xl overflow-hidden">
                <img 
                  src={imageUrl}
                  alt={slide.title}
                  className="w-full h-40 object-cover"
                  onError={() => setImageError(true)}
                />
              </div>
            )}
            
            <p className={`text-sm mt-4 ${slide.subtitle_color || 'text-gray-600'}`}>
              {slide.offer_text || 'Discover our latest collection'}
            </p>
          </div>
          
          <div className="mt-auto pt-4">
            <Link 
              to={slide.button_link || '/products'}
              className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium text-white transition-all hover:shadow-md ${slide.accent_color || 'bg-gray-700'}`}
            >
              {slide.button_text || 'Explore'} 
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const TrendingSlideDeck: React.FC = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const { data: slides = [], isLoading: slidesLoading } = useTrendingSlides();
  
  // Get deals for the first deals slide
  const dealsSlide = slides.find(s => s.slide_type === 'deals');
  const { data: deals = [] } = useTrendingDeals(dealsSlide?.id);

  const getBackgroundGradient = () => {
    if (slidesLoading || !slides.length || activeSlide >= slides.length) {
      return "from-[#E8E0D8] to-[#D8D0C8]";
    }
    return slides[activeSlide]?.background_gradient || "from-[#E8E0D8] to-[#D8D0C8]";
  };

  const getTextColor = () => {
    if (slidesLoading || !slides.length || activeSlide >= slides.length) {
      return "text-[#6C5C4C]";
    }
    return slides[activeSlide]?.text_color || "text-[#6C5C4C]";
  };

  const getSubtitleColor = () => {
    if (slidesLoading || !slides.length || activeSlide >= slides.length) {
      return "text-[#8C7C6C]";
    }
    return slides[activeSlide]?.subtitle_color || "text-[#8C7C6C]";
  };

  const getAccentColor = () => {
    if (slidesLoading || !slides.length || activeSlide >= slides.length) {
      return "bg-[#7C6C5C]";
    }
    return slides[activeSlide]?.accent_color || "bg-[#7C6C5C]";
  };

  useEffect(() => {
    const handleScroll = () => {
      if (scrollContainerRef.current && slides.length > 0) {
        const container = scrollContainerRef.current;
        const scrollPosition = container.scrollLeft;
        const slideWidth = container.querySelector('.snap-start')?.clientWidth || 450;
        const gap = 20;
        const activeIndex = Math.round(scrollPosition / (slideWidth + gap));
        
        if (activeIndex !== activeSlide && activeIndex >= 0 && activeIndex < slides.length) {
          setActiveSlide(activeIndex);
        }
      }
    };

    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      handleScroll();
    }

    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, [activeSlide, slides.length]);

  // Render the appropriate slide component based on slide_type
  const renderSlide = (slide: any) => {
    if (!slide) return null;
    
    switch(slide.slide_type) {
      case 'deals':
        return (
          <ShoppingDealsBox 
            className="h-full" 
            slide={slide}
            deals={deals.filter(deal => deal.slide_id === slide.id)}
          />
        );
      case 'premium':
        return <PremiumSuits className="h-full" slide={slide} />;
      case 'street':
        return <StreetMode className="h-full" slide={slide} />;
      case 'grid':
        return <ProductGrid className="h-full" slide={slide} />;
      case 'video':
        return <VideoSlide className="h-full" slide={slide} />;
      case 'custom':
        return <CustomSlide className="h-full" slide={slide} />;
      default:
        return <PremiumSuits className="h-full" slide={slide} />;
    }
  };

  if (slidesLoading) {
    return (
      <section className="w-full font-sans">
        <div className="w-full bg-gradient-to-br from-[#E8E0D8] to-[#D8D0C8]">
          <div className="max-w-7xl mx-auto px-4 py-16 flex justify-center">
            <Loader2 className="animate-spin h-8 w-8 text-[#6C5C4C]" />
          </div>
        </div>
      </section>
    );
  }

  if (!slides.length) {
    return null;
  }

  return (
    <section className="w-full font-sans">
      <style>{`
        .font-sans {
          font-family: sans-serif;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.3; }
        }
        .animate-pulse-custom {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
      
      <div className={`w-full bg-gradient-to-br ${getBackgroundGradient()} transition-colors duration-700`}>
        <div className="max-w-7xl mx-auto px-4 py-8 sm:py-10 md:py-12 lg:py-16">
          
          {/* Header */}
          <div className="mb-8 md:mb-10 lg:mb-12">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 ${getAccentColor()} rounded-full animate-pulse-custom`}></span>
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-[#3C3C3C] tracking-tight">
                Trend<span className={getTextColor()}>ing</span>
              </h1>
            </div>
            <p className={`text-sm sm:text-base ${getSubtitleColor()} mt-2 max-w-2xl transition-colors duration-700`}>
              • Handpicked for you • {slides.length} collections
            </p>
          </div>

          {/* Slider */}
          <div className="relative -mx-4 px-4">
            <div 
              ref={scrollContainerRef}
              className="flex overflow-x-auto gap-5 pb-6 scrollbar-hide snap-x snap-mandatory"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {slides.filter(slide => slide.is_active).map((slide) => (
                <div 
                  key={slide.id}
                  className="flex-shrink-0 w-[85%] sm:w-[380px] md:w-[420px] lg:w-[450px] snap-start"
                >
                  <div className="h-full min-h-[500px]">
                    {renderSlide(slide)}
                  </div>
                </div>
              ))}
              
              <div className="flex-shrink-0 w-4"></div>
            </div>
            
            {/* Gradient fades */}
            <div className="absolute left-0 top-0 bottom-6 w-8 bg-gradient-to-r from-white/20 to-transparent pointer-events-none md:hidden"></div>
            <div className="absolute right-0 top-0 bottom-6 w-8 bg-gradient-to-l from-white/20 to-transparent pointer-events-none md:hidden"></div>
          </div>

          {/* Slide indicators */}
          <div className="flex justify-center gap-3 mt-8 md:mt-10 lg:mt-12 mb-2">
            {slides.filter(s => s.is_active).map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  if (scrollContainerRef.current) {
                    const slideWidth = scrollContainerRef.current.querySelector('.snap-start')?.clientWidth || 450;
                    const gap = 20;
                    scrollContainerRef.current.scrollTo({
                      left: index * (slideWidth + gap),
                      behavior: 'smooth'
                    });
                  }
                }}
                className={`h-2.5 rounded-full transition-all duration-500 ${
                  activeSlide === index 
                    ? `w-8 ${getAccentColor()} opacity-70` 
                    : 'w-2.5 bg-[#C0C0C0]/50 hover:bg-[#A0A0A0]/70'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrendingSlideDeck;