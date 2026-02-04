import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Slide {
  id: string;
  title: string;
  subtitle?: string;
  image_url: string;
  button_text?: string;
  button_link?: string;
  background_color: string;
  text_color: string;
  button_color: string;
  button_text_color: string;
}

const SLIDE_INTERVAL = 5000;

// Flipkart-style banner heights
const HEIGHTS =
  "h-[140px] sm:h-[200px] md:h-[320px] lg:h-[420px] xl:h-[480px]";

const AutoSlide = () => {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // =========================
  // Load Slides
  // =========================
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
      setSlides(data || []);
    } catch (err) {
      console.error("Slide load error:", err);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // Auto Slide Loop
  // =========================
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

  // =========================
  // Navigation
  // =========================
  const goToPrev = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? slides.length - 1 : prev - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prev) =>
      (prev + 1) % slides.length
    );
  };

  // =========================
  // Swipe Support
  // =========================
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 50) goToNext();
    if (diff < -50) goToPrev();
  };

  // =========================
  // Handle Image or Button Click
  // =========================
  const handleSlideClick = (slide: Slide) => {
    if (!slide.button_link) return;

    console.log("Slide clicked, navigating to:", slide.button_link);

    // Handle internal navigation
    if (slide.button_link.startsWith("/")) {
      navigate(slide.button_link);
    } 
    // Handle external links (open in new tab)
    else if (
      slide.button_link.startsWith("http://") ||
      slide.button_link.startsWith("https://")
    ) {
      window.open(slide.button_link, "_blank", "noopener,noreferrer");
    }
    // Handle relative paths (prepend with /)
    else {
      navigate("/" + slide.button_link);
    }
  };

  // Handle button click separately to stop propagation
  const handleButtonClick = (e: React.MouseEvent, slide: Slide) => {
    e.stopPropagation(); // Prevent triggering the slide click
    
    console.log("Button clicked, navigating to:", slide.button_link);
    
    if (!slide.button_link) return;

    // Handle internal navigation
    if (slide.button_link.startsWith("/")) {
      navigate(slide.button_link);
    } 
    // Handle external links (open in new tab)
    else if (
      slide.button_link.startsWith("http://") ||
      slide.button_link.startsWith("https://")
    ) {
      window.open(slide.button_link, "_blank", "noopener,noreferrer");
    }
    // Handle relative paths (prepend with /)
    else {
      navigate("/" + slide.button_link);
    }
  };

  if (loading) {
    return (
      <div
        className={`${HEIGHTS} bg-gray-200 animate-pulse rounded-lg mx-4 my-6`}
      />
    );
  }

  if (!slides.length) return null;

  return (
    <div
      className="relative overflow-hidden rounded-lg mx-4 my-6 shadow-lg"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* SLIDE TRACK */}
      <div
        className={`flex transition-transform duration-700 ease-in-out ${HEIGHTS}`}
        style={{
          transform: `translateX(-${currentIndex * 100}%)`,
        }}
      >
        {slides.map((slide) => (
          <div
            key={slide.id}
            className={`relative min-w-full h-full flex items-center justify-center ${slide.button_link ? 'cursor-pointer' : ''}`}
            style={{ backgroundColor: slide.background_color }}
            onClick={() => handleSlideClick(slide)}
          >
            {/* IMAGE */}
            <img
              src={slide.image_url}
              alt={slide.title}
              className="absolute inset-0 w-full h-full object-contain md:object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "/placeholder-slide.jpg";
              }}
            />

            {/* OVERLAY */}
            <div className="absolute inset-0 bg-black/5 md:bg-black/10" />

            {/* TEXT */}
            <div className="relative z-10 h-full flex items-center w-full">
              <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
                <div
                  className="space-y-1 sm:space-y-3 md:space-y-6 max-w-[80%] sm:max-w-md md:max-w-xl"
                  style={{ color: slide.text_color }}
                >
                  <h1 className="text-sm sm:text-lg md:text-3xl lg:text-5xl font-bold leading-tight drop-shadow-md">
                    {slide.title}
                  </h1>

                  {slide.subtitle && (
                    <p className="text-[10px] sm:text-sm md:text-lg opacity-90 drop-shadow">
                      {slide.subtitle}
                    </p>
                  )}

                  {slide.button_text && slide.button_link && (
                    <button
                      onClick={(e) => handleButtonClick(e, slide)}
                      className="px-3 py-1.5 sm:px-4 sm:py-2 md:px-6 md:py-3 rounded-md font-semibold transition-transform duration-300 hover:scale-105 shadow-lg text-xs sm:text-sm md:text-base"
                      style={{
                        backgroundColor: slide.button_color,
                        color: slide.button_text_color,
                      }}
                    >
                      {slide.button_text}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ARROWS — DESKTOP ONLY */}
      {slides.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToPrev();
            }}
            className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition hover:scale-110 z-[999]"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition hover:scale-110 z-[999]"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* SMOOTH FLOWING PROGRESS LINE */}
      <div className="absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 z-[999]">
        <div className="relative h-[3px] w-[120px] sm:w-[160px] bg-white/30 rounded-full overflow-hidden">
          <div
            key={currentIndex}
            className="absolute top-0 h-full w-[40%] bg-white rounded-full animate-progress"
          />
        </div>
      </div>

      {/* KEYFRAMES */}
      <style>{`
        @keyframes progress {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(250%);
          }
        }

        .animate-progress {
          animation: progress ${SLIDE_INTERVAL}ms linear infinite;
        }
      `}</style>
    </div>
  );
};

export default AutoSlide;