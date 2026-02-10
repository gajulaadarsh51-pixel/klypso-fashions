import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Slide {
  id: string;
  title: string;
  subtitle?: string;
  image_url: string;
  mobile_image_url?: string;
  tablet_image_url?: string;
  button_text?: string;
  button_link?: string;
  background_color: string;
  text_color: string;
  button_color: string;
  button_text_color: string;
  slide_type: "text_image" | "text_only" | "image_only";
  image_position?: "center" | "top" | "bottom" | "left" | "right";
}

const SLIDE_INTERVAL = 5000;

const AutoSlide = () => {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);

  const navigate = useNavigate();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Update window width on resize
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load slides
  useEffect(() => {
    loadSlides();
  }, []);

  const loadSlides = async () => {
    try {
      const { data, error } = await supabase
        .from("header_slides")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      
      // Process slides to ensure proper defaults
      const processedSlides = (data || []).map(slide => ({
        ...slide,
        slide_type: slide.slide_type || "text_image",
        image_position: slide.image_position || "center"
      }));
      
      setSlides(processedSlides);
    } catch (err) {
      console.error("Slide load error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Auto slide timer
  useEffect(() => {
    if (slides.length <= 1) return;
    startTimer();
    return stopTimer;
  }, [slides.length, currentIndex]);

  const startTimer = () => {
    stopTimer();
    timerRef.current = setTimeout(goToNext, SLIDE_INTERVAL);
  };

  const stopTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  // Navigation
  const goToPrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  // Swipe handling
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    const minSwipe = 50;
    
    if (diff > minSwipe) goToNext();
    if (diff < -minSwipe) goToPrev();
  };

  // Handle slide click
  const handleSlideClick = (slide: Slide) => {
    if (!slide.button_link) return;

    if (slide.button_link.startsWith("/")) {
      navigate(slide.button_link);
    } else if (slide.button_link.startsWith("http://") || slide.button_link.startsWith("https://")) {
      window.open(slide.button_link, "_blank", "noopener,noreferrer");
    } else {
      navigate("/" + slide.button_link);
    }
  };

  // Get appropriate image URL based on screen size
  const getImageUrl = (slide: Slide) => {
    if (!slide) return "";
    
    // For mobile screens (width < 768px)
    if (windowWidth < 768 && slide.mobile_image_url) {
      return slide.mobile_image_url;
    }
    
    // For tablet screens (width between 768px and 1024px)
    if (windowWidth >= 768 && windowWidth < 1024 && slide.tablet_image_url) {
      return slide.tablet_image_url;
    }
    
    // Default to desktop image
    return slide.image_url;
  };

  // Get object position based on slide settings
  const getObjectPosition = (slide: Slide) => {
    if (!slide.image_position) return "center";
    
    switch(slide.image_position) {
      case "top": return "top";
      case "bottom": return "bottom";
      case "left": return "left";
      case "right": return "right";
      default: return "center";
    }
  };

  if (loading) {
    return (
      <div className="w-full bg-gray-200 animate-pulse rounded-lg mx-0 my-0">
        <div className="aspect-[1920/800]"></div>
      </div>
    );
  }

  if (!slides.length) return null;

  return (
    <div className="w-full overflow-hidden relative">
      {/* Container with fixed aspect ratio */}
      <div 
        className="relative w-full h-0 pb-[41.67%]" // 800/1920 = 41.67%
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Slide track */}
        <div
          className="absolute top-0 left-0 w-full h-full flex transition-transform duration-700 ease-in-out"
          style={{
            transform: `translateX(-${currentIndex * 100}%)`,
          }}
        >
          {slides.map((slide) => (
            <div
              key={slide.id}
              className={`relative min-w-full h-full ${slide.button_link ? 'cursor-pointer' : ''}`}
              onClick={() => handleSlideClick(slide)}
            >
              {/* Image container with object-fit cover */}
              <div className="absolute inset-0">
                <img
                  src={getImageUrl(slide)}
                  alt={slide.title}
                  className="w-full h-full object-cover"
                  style={{
                    objectPosition: getObjectPosition(slide)
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder-slide.jpg";
                  }}
                />
                
                {/* Overlay for text content if needed */}
                {(slide.slide_type === "text_image" || slide.slide_type === "text_only") && 
                 (slide.title || slide.subtitle) && (
                  <div className="absolute inset-0 flex items-center justify-center p-4 md:p-8">
                    <div className="text-center max-w-4xl">
                      {slide.title && (
                        <h1 
                          className="text-2xl md:text-4xl lg:text-5xl font-bold mb-2 md:mb-4"
                          style={{ color: slide.text_color }}
                        >
                          {slide.title}
                        </h1>
                      )}
                      {slide.subtitle && (
                        <p 
                          className="text-base md:text-xl lg:text-2xl"
                          style={{ color: slide.text_color }}
                        >
                          {slide.subtitle}
                        </p>
                      )}
                      {slide.button_text && (
                        <button
                          className="mt-4 md:mt-6 px-6 md:px-8 py-2 md:py-3 rounded-lg font-semibold transition-all hover:opacity-90"
                          style={{
                            backgroundColor: slide.button_color,
                            color: slide.button_text_color
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSlideClick(slide);
                          }}
                        >
                          {slide.button_text}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Navigation arrows - Desktop only */}
        {slides.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrev();
              }}
              className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-3 rounded-full shadow-lg transition-all hover:scale-110 z-20"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-6 w-6 text-gray-800" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-3 rounded-full shadow-lg transition-all hover:scale-110 z-20"
              aria-label="Next slide"
            >
              <ChevronRight className="h-6 w-6 text-gray-800" />
            </button>
          </>
        )}

        {/* Dots indicator - Mobile visible */}
        {slides.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(index);
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex 
                    ? 'bg-white w-4' 
                    : 'bg-white/50 hover:bg-white/80'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}

        
      </div>

     
    </div>
  );
};

export default AutoSlide;