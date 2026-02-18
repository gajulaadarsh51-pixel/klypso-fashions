// components/TrendingSlideDeck.tsx
import React, { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTrendingSlides, TrendingSlide, TrendingDeal } from "@/hooks/useTrendingSlides";
import { processGoogleDriveUrl, getVideoEmbedUrl } from "@/lib/utils";
import { Loader2 } from "lucide-react";

// -------------------------------------------------------------
// 1. DEALS CARD (Dynamic)
// -------------------------------------------------------------
interface DealCardProps {
  deal: TrendingDeal;
}

const DealCard: React.FC<DealCardProps> = ({ deal }) => {
  const [error, setError] = useState(false);
  const imageUrl = deal.image_url ? processGoogleDriveUrl(deal.image_url) : null;
  
  return (
    <Link to={deal.link} className="block w-full">
      <div className="bg-white rounded-2xl overflow-hidden border border-[#EDE0D4] active:scale-[0.98] transition-transform">
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
              <span className="text-5xl">{deal.emoji || '🛍️'}</span>
            </div>
          )}
          <div className="absolute top-2 left-2">
            <span className="bg-[#C19A6B] text-white text-xs font-bold px-2.5 py-1.5 rounded-full shadow-sm">
              {deal.discount} OFF
            </span>
          </div>
        </div>
        <div className="p-2 text-center">
          <h3 className="text-sm font-medium truncate">{deal.title}</h3>
        </div>
      </div>
    </Link>
  );
};

// -------------------------------------------------------------
// 2. SHOPPING DEALS BOX (Dynamic)
// -------------------------------------------------------------
interface ShoppingDealsBoxProps {
  slide: TrendingSlide;
  deals: TrendingDeal[];
  className?: string;
}

const ShoppingDealsBox: React.FC<ShoppingDealsBoxProps> = ({ slide, deals, className }) => {
  const bgColor = slide.bg_color || "from-[#1B4D3E] to-[#2A6E4B]";
  const borderColor = slide.border_color || "border-[#9DC183]";
  const textColor = slide.accent_color || "text-[#E6D5B8]";
  const title = slide.title || "Hot Deals For You";
  const subtitle = slide.subtitle || "⚡ Flash Sale";
  const buttonLink = slide.button_link || "/products?discount=true";
  
  return (
    <div className={`h-full ${className}`}>
      <div className={`bg-gradient-to-br ${bgColor} rounded-3xl h-full flex flex-col shadow-sm border ${borderColor}`}>
        <div className="p-5 border-b border-white/30">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">{title}</h2>
              <p className="text-xs text-white/80 font-medium mt-0.5">{subtitle}</p>
            </div>
            <Link to={buttonLink} className={`text-sm font-medium ${textColor}`}>
              Explore
            </Link>
          </div>
        </div>
        <div className="p-4 grid grid-cols-2 gap-3 flex-grow">
          {deals.slice(0, 4).map(deal => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 3. PREMIUM SUITS (Dynamic)
// -------------------------------------------------------------
interface PremiumSuitsProps {
  slide: TrendingSlide;
  className?: string;
}

const PremiumSuits: React.FC<PremiumSuitsProps> = ({ slide, className }) => {
  const [imageError, setImageError] = useState(false);
  const imageUrl = slide.image_url 
    ? processGoogleDriveUrl(slide.image_url) 
    : "https://images4.alphacoders.com/691/thumb-1920-691279.jpg";
  
  const bgColor = slide.bg_color || "from-[#0B3B5C] to-[#1A5F7A]";
  const borderColor = slide.border_color || "border-[#3B9EBF]";
  const accentColor = slide.accent_color || "text-[#B0E0FF]";
  const discount = slide.discount || "Up to 65% Off";
  const buttonLink = slide.button_link || "/products?category=men&search=suits";
  const title = slide.title || "Luxury Suits";
  
  const titleParts = title.split(' ');
  const firstLine = titleParts.slice(0, Math.ceil(titleParts.length / 2)).join(' ');
  const secondLine = titleParts.slice(Math.ceil(titleParts.length / 2)).join(' ');
  
  return (
    <div className={`h-full ${className}`}>
      <div className={`h-full bg-gradient-to-br ${bgColor} rounded-3xl border ${borderColor} shadow-sm`}>
        <div className="p-6 h-full flex flex-col">
          <div className="mb-3">
            <span className={`${accentColor} text-xs font-semibold uppercase tracking-wider`}>✦ PREMIUM</span>
            <h3 className="text-white text-3xl font-bold mt-2 leading-tight">
              {firstLine}<br />{secondLine || ''}
            </h3>
            <div className="flex items-center gap-2 mt-3">
              <span className={`bg-white/20 text-white text-xs px-3 py-1.5 rounded-full`}>
                {discount}
              </span>
            </div>
          </div>
          <div className="mt-auto">
            <Link to={buttonLink} className="block">
              <div className="rounded-2xl overflow-hidden border-2 border-white/30">
                {!imageError ? (
                  <img 
                    src={imageUrl}
                    alt="Suits"
                    className="w-full h-40 object-cover"
                    onError={() => setImageError(true)}
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-40 bg-gray-700 flex items-center justify-center">
                    <span className="text-4xl">👔</span>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-white text-sm font-medium">Shop Collection</span>
                <span className={`${accentColor} text-lg`}>→</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 4. STREET MODE (Dynamic)
// -------------------------------------------------------------
interface StreetModeProps {
  slide: TrendingSlide;
  className?: string;
}

const StreetMode: React.FC<StreetModeProps> = ({ slide, className }) => {
  const [imageError, setImageError] = useState(false);
  const imageUrl = slide.image_url 
    ? processGoogleDriveUrl(slide.image_url) 
    : "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&h=300&fit=crop";
  
  const bgColor = slide.bg_color || "from-[#301934] to-[#4B0082]";
  const borderColor = slide.border_color || "border-[#9370DB]";
  const accentColor = slide.accent_color || "text-[#E6E6FA]";
  const textColor = slide.text_color || "text-white";
  const discountMin = slide.discount_min || "55";
  const discountText = slide.discount || `Min. ${discountMin}%`;
  const features = slide.features || ["Top Brands", "New Styles", "Free Delivery"];
  const buttonLink = slide.button_link || "/products?category=women";
  const buttonText = slide.button_text || "SHOP NOW";
  const title = slide.title || "Street Mode";
  const subtitle = slide.subtitle || "Fresh arrivals";
  
  return (
    <div className={`h-full ${className}`}>
      <div className={`h-full bg-gradient-to-br ${bgColor} rounded-3xl border-2 ${borderColor} shadow-sm`}>
        <div className="p-6 h-full flex flex-col">
          <div className="mb-3">
            <span className="bg-white/20 text-white text-xs px-3 py-1.5 rounded-full inline-block">
              🔥 SALE
            </span>
            <span className="block text-3xl font-bold text-white mt-4">{discountText}</span>
            <span className="block text-lg font-semibold text-white/90">{subtitle}</span>
          </div>
          
          <div className="mb-4">
            <h4 className="text-2xl font-bold text-white">{title}</h4>
            <p className={`text-sm ${accentColor}`}>{subtitle}</p>
          </div>
          
          <div className="space-y-2 mb-4">
            {features.map((text, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 bg-white/80 rounded-full`}></div>
                <span className={`text-sm ${textColor}`}>{text}</span>
              </div>
            ))}
          </div>
          
          <div className="my-2">
            <div className="rounded-xl overflow-hidden border-2 border-white/30">
              {!imageError ? (
                <img 
                  src={imageUrl}
                  alt="Street Fashion"
                  className="w-full h-32 object-cover"
                  onError={() => setImageError(true)}
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-32 bg-purple-900 flex items-center justify-center">
                  <span className="text-4xl">👕</span>
                </div>
              )}
            </div>
          </div>
          
          <Link 
            to={buttonLink}
            className="mt-auto w-full bg-white hover:bg-gray-100 text-purple-900 text-center py-3.5 rounded-xl text-sm font-bold transition-colors"
          >
            {buttonText}
          </Link>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 5. VIDEO GRID - FIXED FOR AUTOPLAY, LOOP, CONTINUOUS PLAY
// -------------------------------------------------------------
interface VideoGridProps {
  slide: TrendingSlide;
  className?: string;
}

const VideoGrid: React.FC<VideoGridProps> = ({ slide, className }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoError, setVideoError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const imageUrl = slide.image_url 
    ? processGoogleDriveUrl(slide.image_url) 
    : "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&h=600&fit=crop";
  
  const videoUrl = slide.video_url;
  const bgColor = slide.bg_color || "from-[#4A4A4A] to-[#2C3E50]";
  const borderColor = slide.border_color || "border-[#BDC3C7]";
  const buttonLink = slide.button_link || "/products?category=summer";
  const buttonText = slide.button_text || "SHOP NOW";
  const title = slide.title || "Summer Collection";
  const subtitle = slide.subtitle || "✨ New Arrivals";
  
  const isEmbedVideo = videoUrl && (
    videoUrl.includes('youtube.com') || 
    videoUrl.includes('youtu.be') || 
    videoUrl.includes('vimeo.com')
  );
  
  const isGoogleDriveVideo = videoUrl && videoUrl.includes('drive.google.com');
  
  // Handle video playback for HTML5 video
  useEffect(() => {
    if (videoRef.current && !isEmbedVideo && !isGoogleDriveVideo && !videoError && videoUrl) {
      const playVideo = async () => {
        try {
          videoRef.current.loop = true;
          videoRef.current.muted = true;
          videoRef.current.playsInline = true;
          
          await videoRef.current.play();
          setIsPlaying(true);
        } catch (error) {
          console.error('Video autoplay failed:', error);
          setVideoError(true);
        }
      };
      
      playVideo();
    }
    
    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    };
  }, [isEmbedVideo, isGoogleDriveVideo, videoError, videoUrl]);

  const titleParts = title.split(' ');
  const firstLine = titleParts.slice(0, Math.ceil(titleParts.length / 2)).join(' ');
  const secondLine = titleParts.slice(Math.ceil(titleParts.length / 2)).join(' ');

  return (
    <div className={`h-full ${className}`}>
      <div className={`h-full bg-gradient-to-br ${bgColor} rounded-3xl border ${borderColor} shadow-lg overflow-hidden`}>
        <div className="relative h-full">
          <div className="absolute inset-0">
            {/* YouTube/Vimeo Embed */}
            {isEmbedVideo && videoUrl && (
              <iframe
                src={`${getVideoEmbedUrl(videoUrl)}?autoplay=1&loop=1&mute=1&playsinline=1&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&playlist=${videoUrl.includes('youtube') ? videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)?.[1] || '' : ''}`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                title={title}
              />
            )}
            
            {/* Google Drive Video Embed with autoplay */}
            {isGoogleDriveVideo && videoUrl && !isEmbedVideo && (
              <iframe
                src={`https://drive.google.com/file/d/${videoUrl.match(/\/d\/([^\/]+)/)?.[1] || videoUrl.match(/id=([^&]+)/)?.[1]}/preview?autoplay=1&loop=1`}
                className="w-full h-full"
                allow="autoplay"
                allowFullScreen
                title={title}
              />
            )}
            
            {/* HTML5 Video with autoplay and loop */}
            {!isEmbedVideo && !isGoogleDriveVideo && videoUrl && !videoError && (
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                muted
                loop
                playsInline
                disablePictureInPicture
                controlsList="nodownload nofullscreen noremoteplayback"
                poster={imageUrl}
                onError={() => setVideoError(true)}
                onPlay={() => setIsPlaying(true)}
              >
                <source src={videoUrl} type="video/mp4" />
                <source src={videoUrl} type="video/webm" />
                <source src={videoUrl} type="video/ogg" />
              </video>
            )}
            
            {/* Fallback Image */}
            {(!videoUrl || videoError) && (
              <img 
                src={imageUrl}
                alt={title}
                className="w-full h-full object-cover"
              />
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
          </div>

          <div className="absolute top-4 left-4 z-10">
            <span className="bg-red-600/90 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full inline-flex items-center gap-1 shadow-lg">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
              LIVE NOW
            </span>
          </div>

          <div className="absolute inset-x-0 bottom-0 p-6 flex flex-col z-10 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-20">
            <h3 className="text-white text-3xl font-bold mb-2 drop-shadow-lg">
              {firstLine}<br />{secondLine || ''}
            </h3>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-white/90 text-sm drop-shadow">{subtitle}</span>
            </div>
            <Link 
              to={buttonLink}
              className="w-full bg-white hover:bg-gray-100 text-gray-900 text-center py-3.5 rounded-xl text-sm font-bold transition-all transform hover:scale-[0.98] shadow-lg"
            >
              {buttonText}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 6. WRAPPER COMPONENT FOR DEALS SLIDE
// -------------------------------------------------------------
interface DealsSlideWrapperProps {
  slide: TrendingSlide;
  useSlideDeals: (slideId: number) => any;
}

const DealsSlideWrapper: React.FC<DealsSlideWrapperProps> = ({ slide, useSlideDeals }) => {
  const { data: deals = [], isLoading } = useSlideDeals(slide.id);
  
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-[#1B4D3E] to-[#2A6E4B] rounded-3xl">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }
  
  return <ShoppingDealsBox slide={slide} deals={deals} className="h-full" />;
};

// -------------------------------------------------------------
// 7. MAIN COMPONENT - WITH AUTO SCROLL BACK (FIXED TOUCH WARNING)
// -------------------------------------------------------------
const TrendingSlideDeck: React.FC = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const isHorizontalScrollRef = useRef<boolean>(false);
  const { slides, slidesLoading, useSlideDeals } = useTrendingSlides();

  // Create slides array with components
  const slideComponents = slides
    .filter(slide => slide.is_active)
    .map(slide => {
      let component;
      
      if (slide.slide_type === 'deals') {
        component = <DealsSlideWrapper slide={slide} useSlideDeals={useSlideDeals} />;
      } else {
        switch (slide.slide_type) {
          case 'premium_suits':
            component = <PremiumSuits slide={slide} className="h-full" />;
            break;
          case 'street_mode':
            component = <StreetMode slide={slide} className="h-full" />;
            break;
          case 'video_grid':
            component = <VideoGrid slide={slide} className="h-full" />;
            break;
          default:
            component = null;
        }
      }
      
      return { 
        id: slide.id, 
        component,
        slide_type: slide.slide_type 
      };
    })
    .filter(item => item.component !== null);

  const totalSlides = slideComponents.length;

  // ===== DYNAMIC COLORS BASED ON ACTIVE SLIDE =====
  const getBackgroundGradient = () => {
    if (slidesLoading || totalSlides === 0 || !slides.length) return "from-[#E0E6D8] to-[#D0D8C8]";
    const activeSlideData = slides[activeSlide];
    switch(activeSlideData?.slide_type) {
      case 'deals': return "from-[#E0E6D8] to-[#D0D8C8]";
      case 'premium_suits': return "from-[#D8E0E6] to-[#C8D0D8]";
      case 'street_mode': return "from-[#E0D8E0] to-[#D0C8D0]";
      case 'video_grid': return "from-[#D8D0C8] to-[#C8C0B8]";
      default: return "from-[#E8E0D8] to-[#D8D0C8]";
    }
  };

  const getTextColor = () => {
    if (slidesLoading || totalSlides === 0 || !slides.length) return "text-[#5C6F5C]";
    const activeSlideData = slides[activeSlide];
    switch(activeSlideData?.slide_type) {
      case 'deals': return "text-[#5C6F5C]";
      case 'premium_suits': return "text-[#5C6F7A]";
      case 'street_mode': return "text-[#6C5C6C]";
      case 'video_grid': return "text-[#6C6C6C]";
      default: return "text-[#6C5C4C]";
    }
  };

  const getSubtitleColor = () => {
    if (slidesLoading || totalSlides === 0 || !slides.length) return "text-[#7C8F7C]";
    const activeSlideData = slides[activeSlide];
    switch(activeSlideData?.slide_type) {
      case 'deals': return "text-[#7C8F7C]";
      case 'premium_suits': return "text-[#7C8F9A]";
      case 'street_mode': return "text-[#8C7C8C]";
      case 'video_grid': return "text-[#8C8C8C]";
      default: return "text-[#8C7C6C]";
    }
  };

  const getAccentColor = () => {
    if (slidesLoading || totalSlides === 0 || !slides.length) return "bg-[#6C7F6C]";
    const activeSlideData = slides[activeSlide];
    switch(activeSlideData?.slide_type) {
      case 'deals': return "bg-[#6C7F6C]";
      case 'premium_suits': return "bg-[#6C7F8A]";
      case 'street_mode': return "bg-[#7C6C7C]";
      case 'video_grid': return "bg-[#7C7C7C]";
      default: return "bg-[#7C6C5C]";
    }
  };

  // Track active slide based on scroll position
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || slidesLoading || totalSlides === 0) return;

    const handleScroll = () => {
      if (isAutoScrolling) return;
      
      const slideWidth = container.querySelector('.snap-start')?.clientWidth || 450;
      const gap = 20;
      const totalWidth = slideWidth + gap;
      const scrollLeft = container.scrollLeft;
      
      // Calculate which slide we're on
      const rawIndex = Math.round(scrollLeft / totalWidth);
      const realIndex = Math.min(Math.max(rawIndex, 0), totalSlides - 1);
      
      if (realIndex !== activeSlide) {
        setActiveSlide(realIndex);
      }
    };

    let ticking = false;
    const scrollListener = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    container.addEventListener('scroll', scrollListener, { passive: true });
    
    return () => {
      container.removeEventListener('scroll', scrollListener);
    };
  }, [activeSlide, totalSlides, slidesLoading, isAutoScrolling]);

  // Handle touch start to detect horizontal vs vertical scroll
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    isHorizontalScrollRef.current = false;
  };

  // Handle touch move to determine scroll direction
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!scrollContainerRef.current || touchStartXRef.current === null || touchStartYRef.current === null || isAutoScrolling) return;

    const touchMoveX = e.touches[0].clientX;
    const touchMoveY = e.touches[0].clientY;
    
    const deltaX = Math.abs(touchMoveX - touchStartXRef.current);
    const deltaY = Math.abs(touchMoveY - touchStartYRef.current);
    
    // If horizontal movement is greater than vertical, it's a horizontal scroll
    if (deltaX > deltaY && deltaX > 10) {
      isHorizontalScrollRef.current = true;
    }
  };

  // Handle touch end to detect swipe past last slide
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!scrollContainerRef.current || touchStartXRef.current === null || isAutoScrolling || !isHorizontalScrollRef.current) {
      touchStartXRef.current = null;
      touchStartYRef.current = null;
      return;
    }

    const container = scrollContainerRef.current;
    const touchEndX = e.changedTouches[0].clientX;
    const swipeDistance = touchStartXRef.current - touchEndX;
    
    // Check if this is a left swipe (positive distance)
    if (swipeDistance > 50) {
      // Check if we're at the last slide and trying to swipe left
      const slideWidth = container.querySelector('.snap-start')?.clientWidth || 450;
      const gap = 20;
      const totalWidth = slideWidth + gap;
      const maxScroll = (totalSlides - 1) * totalWidth;
      const currentScroll = container.scrollLeft;
      
      // If we're at or near the last slide and swiping left, scroll to first
      if (currentScroll >= maxScroll - 50 && activeSlide === totalSlides - 1) {
        // Remove preventDefault() call to avoid the warning
        setIsAutoScrolling(true);
        
        container.scrollTo({
          left: 0,
          behavior: 'smooth'
        });
        
        setTimeout(() => {
          setIsAutoScrolling(false);
        }, 500);
      }
    }
    
    touchStartXRef.current = null;
    touchStartYRef.current = null;
    isHorizontalScrollRef.current = false;
  };

  // Handle wheel events for desktop
  const handleWheel = (e: React.WheelEvent) => {
    if (!scrollContainerRef.current || isAutoScrolling) return;

    const container = scrollContainerRef.current;
    const slideWidth = container.querySelector('.snap-start')?.clientWidth || 450;
    const gap = 20;
    const totalWidth = slideWidth + gap;
    const maxScroll = (totalSlides - 1) * totalWidth;
    const currentScroll = container.scrollLeft;
    
    // If scrolling right (positive deltaY or deltaX) and at the last slide
    if ((e.deltaY > 0 || e.deltaX > 0) && currentScroll >= maxScroll - 10 && activeSlide === totalSlides - 1) {
      e.preventDefault();
      setIsAutoScrolling(true);
      
      container.scrollTo({
        left: 0,
        behavior: 'smooth'
      });
      
      setTimeout(() => {
        setIsAutoScrolling(false);
      }, 500);
    }
  };

  // Handle dot navigation
  const goToSlide = (index: number) => {
    if (scrollContainerRef.current && totalSlides > 0) {
      const slideWidth = scrollContainerRef.current.querySelector('.snap-start')?.clientWidth || 450;
      const gap = 20;
      const totalWidth = slideWidth + gap;
      const targetPosition = index * totalWidth;
      
      scrollContainerRef.current.scrollTo({
        left: targetPosition,
        behavior: 'smooth'
      });
      
      setActiveSlide(index);
    }
  };

  // Loading state
  if (slidesLoading) {
    return (
      <section className="w-full font-sans">
        <div className="w-full bg-gradient-to-br from-[#E0E6D8] to-[#D0D8C8]">
          <div className="max-w-7xl mx-auto px-4 py-16">
            <div className="flex flex-col items-center justify-center h-64">
              <Loader2 className="w-10 h-10 animate-spin text-[#C19A6B] mb-4" />
              <p className="text-gray-600">Loading trending slides...</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (totalSlides === 0) {
    return null;
  }

  return (
    <section className="w-full font-sans">
      <style>{`
        .font-sans { font-family: sans-serif; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .snap-mandatory {
          scroll-snap-type: x mandatory;
        }
        .snap-start {
          scroll-snap-align: start;
        }
      `}</style>
      
      <div className={`w-full bg-gradient-to-br ${getBackgroundGradient()} transition-colors duration-700 font-sans`}>
        <div className="max-w-7xl mx-auto px-4 py-8 sm:py-10 md:py-12 lg:py-16">
          
          {/* Header */}
          <div className="mb-8 md:mb-10 lg:mb-12">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 ${getAccentColor()} rounded-full animate-pulse opacity-60`}></span>
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-[#3C3C3C] tracking-tight">
                Trend<span className={getTextColor()}>ing</span>
              </h1>
            </div>
            <p className={`text-sm sm:text-base ${getSubtitleColor()} mt-2 max-w-2xl transition-colors duration-700 font-sans`}>
              • Handpicked deals  
            </p>
          </div>

          {/* Simple Slider with Auto Scroll Back */}
          <div className="relative -mx-4 px-4">
            <div 
              ref={scrollContainerRef}
              className="flex overflow-x-auto gap-5 pb-6 scrollbar-hide snap-x snap-mandatory"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onWheel={handleWheel}
            >
              {slideComponents.map((slide, index) => (
                <div 
                  key={slide.id}
                  className="flex-shrink-0 w-[85%] sm:w-[380px] md:w-[420px] lg:w-[450px] snap-start"
                >
                  <div className="h-full min-h-[500px]">
                    {slide.component}
                  </div>
                </div>
              ))}
              <div className="flex-shrink-0 w-4"></div>
            </div>
            
            <div className="absolute left-0 top-0 bottom-6 w-8 bg-gradient-to-r from-white/20 to-transparent pointer-events-none md:hidden"></div>
            <div className="absolute right-0 top-0 bottom-6 w-8 bg-gradient-to-l from-white/20 to-transparent pointer-events-none md:hidden"></div>
          </div>

          {/* Slider Indicators */}
          {totalSlides > 1 && (
            <div className="flex justify-center gap-3 mt-8 md:mt-10 lg:mt-12 mb-2">
              {slideComponents.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`h-2.5 rounded-full transition-all duration-500 ${
                    activeSlide === index 
                      ? `w-8 ${getAccentColor()} opacity-70` 
                      : 'w-2.5 bg-[#C0C0C0]/50 hover:bg-[#A0A0A0]/70'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default TrendingSlideDeck;