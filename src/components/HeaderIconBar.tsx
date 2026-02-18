import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { X, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface IconItem {
  id: string;
  title: string;
  image_url: string;
  link_url: string;
  badge_text?: string;
  badge_color?: string;
}

interface HeaderIconBarProps {
  onIconClick?: (icon: IconItem) => void;
  isScrolled?: boolean;
}

/* Get safe route - FIXED VERSION */
const getSafeRoute = (url: string) => {
  if (!url) return "/products";

  if (url.startsWith("http://") || url.startsWith("https://")) {
    console.warn("Blocked external link:", url);
    return "/products";
  }

  if (!url.startsWith("/")) {
    if (url.startsWith("?")) {
      return `/products${url}`;
    }
    if (["men", "women", "accessories", "new", "sale"].includes(url.toLowerCase())) {
      return `/products?category=${url.toLowerCase()}`;
    }
    return `/${url}`;
  }

  return url;
};

const convertDriveUrl = (url: string) => {
  if (!url || typeof url !== 'string') return "";
  
  if (!url.includes("drive.google.com")) return url.trim();
  
  const cleanUrl = url.split('?')[0];
  let fileId = "";
  
  const fileIdMatch = cleanUrl.match(/\/file\/d\/([^\/]+)/);
  if (fileIdMatch && fileIdMatch[1]) {
    fileId = fileIdMatch[1];
  }
  
  const idMatch = url.match(/[?&]id=([^&]+)/);
  if (idMatch && idMatch[1]) {
    fileId = idMatch[1];
  }
  
  if (!fileId) return url.trim();
  
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
};

const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>, originalUrl: string) => {
  const img = e.currentTarget as HTMLImageElement;
  
  if (originalUrl.includes("drive.google.com")) {
    const fileIdMatch = originalUrl.match(/\/file\/d\/([^\/]+)/) || originalUrl.match(/[?&]id=([^&]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
      const fileId = fileIdMatch[1];
      
      img.src = `https://lh3.googleusercontent.com/d/${fileId}=w400?authuser=0`;
      
      img.onerror = () => {
        img.src = `https://drive.google.com/uc?export=download&id=${fileId}`;
        
        img.onerror = () => {
          img.src = `https://lh3.googleusercontent.com/d/${fileId}=s400`;
          
          img.onerror = () => {
            img.src = "https://via.placeholder.com/64/cccccc/969696?text=Icon";
          };
        };
      };
    } else {
      img.src = "https://via.placeholder.com/64/cccccc/969696?text=Icon";
    }
  } else {
    img.src = "https://via.placeholder.com/64/cccccc/969696?text=Icon";
  }
};

const HeaderIconBar = ({ onIconClick, isScrolled = false }: HeaderIconBarProps) => {
  const [icons, setIcons] = useState<IconItem[]>([]);
  const [selectedIconId, setSelectedIconId] = useState<string | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  
  const navigate = useNavigate();
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const namesContainerRef = useRef<HTMLDivElement>(null);
  const [horizontalScrollProgress, setHorizontalScrollProgress] = useState(0);
  const [isHorizontallyScrolling, setIsHorizontallyScrolling] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [canScroll, setCanScroll] = useState(false);

  const formatBadgeText = (text: string) => {
    if (!text) return "";
    if (text.length > 8) {
      return text.substring(0, 6) + "..";
    }
    return text;
  };

  const truncateProductName = (name: string, maxLength: number = 12) => {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength) + "...";
  };

  const isSelected = (iconId: string) => selectedIconId === iconId;

  const loadIcons = async () => {
    const { data, error } = await supabase
      .from("header_icons")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (!error && data) {
      console.log("Loaded icons:", data);
      setIcons(data);
    } else {
      console.error("Error loading icons:", error);
    }
  };

  const handleClick = (icon: IconItem) => {
    let safeRoute = getSafeRoute(icon.link_url);
    
    if (safeRoute === "/products" && icon.title) {
      const title = icon.title.toLowerCase();
      if (title.includes("men")) {
        safeRoute = "/products?category=men";
      } else if (title.includes("women")) {
        safeRoute = "/products?category=women";
      } else if (title.includes("accessor")) {
        safeRoute = "/products?category=accessories";
      } else if (title.includes("sale") || title.includes("offer")) {
        safeRoute = "/products?sale=true";
      } else if (title.includes("new")) {
        safeRoute = "/products";
      }
    }
    
    navigate(safeRoute);
    
    if (onIconClick) {
      onIconClick(icon);
    }
  };

  useEffect(() => {
    loadIcons();
  }, []);

  // Track window scroll position for smooth zoom and sticky bar
  useEffect(() => {
    const handleWindowScroll = () => {
      const scrollY = window.scrollY;
      // Calculate progress: 0 at top, 1 at 150px scrolled
      const maxScroll = 150;
      const progress = Math.min(scrollY / maxScroll, 1);
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleWindowScroll);
  }, []);

  // Calculate dimensions and horizontal scroll progress
  useEffect(() => {
    const calculateDimensions = () => {
      const container = containerRef.current;
      if (!container) return;

      const containerWidth = container.clientWidth;
      const contentWidth = container.scrollWidth;
      
      setContainerWidth(containerWidth);
      setContentWidth(contentWidth);
      
      // Check if content can scroll
      const canScroll = contentWidth > containerWidth;
      setCanScroll(canScroll);
      
      // Calculate initial progress
      const scrollLeft = container.scrollLeft;
      const maxScrollLeft = contentWidth - containerWidth;
      const progress = maxScrollLeft > 0 ? (scrollLeft / maxScrollLeft) * 100 : 0;
      
      setHorizontalScrollProgress(progress);
    };

    // Calculate after a delay to ensure DOM is fully rendered
    const timeoutId = setTimeout(calculateDimensions, 100);
    
    // Also calculate when window resizes
    window.addEventListener('resize', calculateDimensions);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', calculateDimensions);
    };
  }, [icons]);

  // Sync horizontal scroll between icons and names containers
  useEffect(() => {
    const container = containerRef.current;
    const namesContainer = namesContainerRef.current;
    
    if (!container || !namesContainer) return;

    const handleIconScroll = () => {
      if (namesContainer) {
        namesContainer.scrollLeft = container.scrollLeft;
      }
    };

    const handleNamesScroll = () => {
      if (container) {
        container.scrollLeft = namesContainer.scrollLeft;
      }
    };

    container.addEventListener('scroll', handleIconScroll);
    namesContainer.addEventListener('scroll', handleNamesScroll);
    
    return () => {
      container.removeEventListener('scroll', handleIconScroll);
      namesContainer.removeEventListener('scroll', handleNamesScroll);
    };
  }, []);

  // Horizontal scroll handler
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const maxScrollLeft = contentWidth - containerWidth;
      const progress = maxScrollLeft > 0 ? (scrollLeft / maxScrollLeft) * 100 : 0;
      
      setHorizontalScrollProgress(progress);
      setIsHorizontallyScrolling(true);
      
      // Clear previous timeout
      if ((container as any).scrollTimeout) {
        clearTimeout((container as any).scrollTimeout);
      }
      
      // Set timeout to hide scrolling indicator
      (container as any).scrollTimeout = setTimeout(() => {
        setIsHorizontallyScrolling(false);
      }, 300);
    };

    container.addEventListener('scroll', handleScroll);
    
    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
        if ((container as any).scrollTimeout) {
          clearTimeout((container as any).scrollTimeout);
        }
      }
    };
  }, [containerWidth, contentWidth]);

  useEffect(() => {
    const currentPath = location.pathname;
    const searchParams = new URLSearchParams(location.search);
    const currentCategory = searchParams.get("category");
    const currentSale = searchParams.get("sale");
    
    if (currentPath === "/") {
      setSelectedIconId(null);
      return;
    }
    
    const matchingIcon = icons.find(icon => {
      const safeRoute = getSafeRoute(icon.link_url);
      
      if (safeRoute === currentPath) return true;
      
      if (safeRoute.startsWith("/products") && currentPath === "/products") {
        const urlParams = new URLSearchParams(icon.link_url.split('?')[1] || '');
        const iconCategory = urlParams.get("category");
        const iconSale = urlParams.get("sale");
        
        if (iconCategory && iconCategory === currentCategory) {
          return true;
        }
        
        if (iconSale === "true" && currentSale === "true") {
          return true;
        }
        
        if (!iconCategory && icon.title) {
          const iconTitle = icon.title.toLowerCase();
          if (
            (iconTitle.includes("men") && currentCategory === "men") ||
            (iconTitle.includes("women") && currentCategory === "women") ||
            (iconTitle.includes("accessor") && currentCategory === "accessories") ||
            (iconTitle.includes("sale") && currentSale === "true")
          ) {
            return true;
          }
        }
      }
      
      return false;
    });
    
    if (matchingIcon) {
      setSelectedIconId(matchingIcon.id);
    } else {
      setSelectedIconId(null);
    }
  }, [location, icons]);

  if (!icons.length) return null;

  // Calculate image zoom (scale from 1 to 0.7)
  const imageScale = 1 - (scrollProgress * 0.3);
  
  // Calculate transform for the icons container (slides up as scroll progresses)
  const iconsTranslateY = scrollProgress * -80; // Move up 80px at full scroll
  
  // Calculate opacity for sticky bar (smooth fade in)
  const stickyBarOpacity = Math.min(scrollProgress * 2, 1);

  return (
    <div className="relative bg-[#E9E1D8]">
      {/* Sticky Names Bar - Smooth fade in and out */}
      <div 
        className="fixed top-14 left-0 right-0 z-40 bg-[#E9E1D8] py-2 shadow-sm border-b border-gray-300 transition-all duration-300 ease-out"
        style={{
          opacity: stickyBarOpacity,
          transform: `translateY(${scrollProgress > 0 ? 0 : -10}px)`,
          pointerEvents: scrollProgress > 0.1 ? 'auto' : 'none',
        }}
      >
        <div className="container mx-auto px-4">
          <div 
            ref={namesContainerRef}
            className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {icons.map((icon) => (
              <button
                key={icon.id}
                onClick={() => handleClick(icon)}
                className="flex-shrink-0 relative group"
              >
                <span className={`text-xs font-bold transition-colors whitespace-nowrap ${
                  isSelected(icon.id) ? "text-gray-700" : "text-gray-900"
                }`}>
                  {truncateProductName(icon.title, 14)}
                </span>
                
                {icon.badge_text && (
                  <div className="absolute -top-1.5 -right-1.5 z-10">
                    <span
                      className="text-[8px] text-white px-1 py-0.5 rounded-full font-bold shadow-sm"
                      style={{
                        backgroundColor: icon.badge_color || "#ff3b30",
                      }}
                    >
                      {formatBadgeText(icon.badge_text)}
                    </span>
                  </div>
                )}
                
                {isSelected(icon.id) && (
                  <div className="mt-1 w-full h-0.5 bg-gray-600 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Icons Row - Slides up smoothly */}
      <div 
        className="container mx-auto px-4 pb-4 pt-2 transition-all duration-300 ease-out"
        style={{
          transform: `translateY(${iconsTranslateY}px)`,
          opacity: Math.max(0.2, 1 - scrollProgress), // Smooth fade out
        }}
      >
        <div className="relative">
          <div 
            ref={containerRef}
            className="flex gap-5 overflow-x-auto py-2 no-scrollbar relative scrollbar-hide scroll-smooth"
            style={{
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {icons.map((icon) => {
              const processedImageUrl = convertDriveUrl(icon.image_url);
              
              return (
                <button
                  key={icon.id}
                  onClick={() => handleClick(icon)}
                  className="relative min-w-[90px] flex-shrink-0 flex flex-col items-center pb-2 group"
                >
                  {icon.badge_text && (
                    <div className="absolute -top-1.5 -right-1.5 z-10">
                      <span
                        className="text-[9px] text-white px-1.5 py-0.5 rounded-full font-bold shadow-sm"
                        style={{
                          backgroundColor: icon.badge_color || "#ff3b30",
                        }}
                      >
                        {formatBadgeText(icon.badge_text)}
                      </span>
                    </div>
                  )}

                  {/* Image Container - Zooms out smoothly */}
                  <div
                    className={`w-16 h-16 rounded-full overflow-hidden mb-2 flex-shrink-0 relative transition-all duration-300 ease-out
                    ${
                      isSelected(icon.id)
                        ? "ring-2 ring-gray-600 ring-offset-2 ring-offset-[#E9E1D8]"
                        : "hover:ring-2 hover:ring-gray-400 hover:ring-offset-2 hover:ring-offset-[#E9E1D8]"
                    }`}
                    style={{
                      transform: `scale(${imageScale})`,
                    }}
                  >
                    <div className="w-full h-full overflow-hidden relative">
                      <img
                        src={processedImageUrl}
                        alt={icon.title}
                        className="w-full h-full object-cover absolute top-0 left-0"
                        style={{
                          objectPosition: "center top",
                          minHeight: "100%",
                          minWidth: "100%"
                        }}
                        onError={(e) => {
                          handleImageError(e, icon.image_url);
                        }}
                      />
                    </div>
                    
                    <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                  </div>

                  {/* Product Name */}
                  <div className="min-h-[40px] flex items-center justify-center">
                    <span
                      className={`text-xs font-bold transition-colors text-center break-words line-clamp-2
                      ${
                        isSelected(icon.id)
                          ? "text-gray-700"
                          : "text-gray-900"
                      }`}
                      style={{
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word',
                        maxWidth: '80px'
                      }}
                    >
                      {truncateProductName(icon.title, 14)}
                    </span>
                  </div>

                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    {icon.title}
                  </div>

                  {isSelected(icon.id) && (
                    <div className="mt-1 w-8 h-0.5 bg-gray-600 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
          
          {/* Progress bar for horizontal scrolling */}
          {canScroll && containerWidth > 0 && (
            <div className="mt-1 w-full flex justify-center">
              <div className="w-1/2 h-[3px] rounded-full bg-gray-300/80 overflow-hidden">
                <div
                  className={`h-full bg-white/90 transition-all duration-300 ease-out rounded-full
                    ${isHorizontallyScrolling ? "opacity-100" : "opacity-90"}`}
                  style={{ 
                    width: `${Math.max(0, Math.min(100, horizontalScrollProgress))}%`,
                    transition: isHorizontallyScrolling ? 'width 0.1s ease-out' : 'width 0.3s ease-out'
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeaderIconBar;