import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Search,
  ShoppingBag,
  Menu,
  X,
  Shield,
  TrendingUp,
  Home,
  User,
  Package,
  Heart,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useWishlist } from "@/contexts/WishlistContext";

import CartDrawer from "./CartDrawer";
import AccountDrawer from "./AccountDrawer";
import AutoSlide from "./AutoSlide";

/* HELPERS */
const normalize = (v?: string) =>
  v?.toString().toLowerCase().trim() || "";

// Expanded trending searches with variations
const TRENDING_SEARCHES = [
  "Men Shirts",
  "Women Dresses",
  "T-Shirts",
  "Jeans",
  "Shoes",
  "Watches",
];

// Enhanced search keyword mappings for better matching like Flipkart/Amazon
const SEARCH_KEYWORD_MAPPINGS: Record<string, string[]> = {
  "women": ["women", "womens", "woman", "womenswear", "female", "ladies", "girl", "girls", "women's", "women-clothing"],
  "men": ["men", "mens", "man", "menswear", "male", "gentlemen", "boy", "boys", "men's", "men-clothing"],
  "accessories": ["accessories", "accessory", "jewelry", "jewellery", "watches", "bags", "belts", "sunglasses", "wallet"],
  "shirts": ["shirts", "shirt", "top", "blouse", "tee", "t-shirt", "tshirt", "t shirt", "tops"],
  "dresses": ["dresses", "dress", "gown", "frock", "jumpsuit", "jumpers", "gowns"],
  "pants": ["pants", "trousers", "jeans", "leggings", "shorts", "bottoms", "denim", "trouser"],
  "shoes": ["shoes", "footwear", "sneakers", "boots", "sandals", "heels", "flats", "slippers", "footwear"],
  "jackets": ["jackets", "jacket", "coat", "blazer", "hoodie", "sweater", "sweatshirt", "cardigan"],
  "kids": ["kids", "children", "child", "baby", "toddler", "boys", "girls", "kidswear", "childrenswear"],
  "new": ["new", "latest", "arrivals", "recent", "fresh", "new arrivals"],
  "sale": ["sale", "discount", "offer", "deal", "clearance", "bargain", "discounted", "offers"],
  "electronics": ["electronics", "electronic", "mobile", "phone", "laptop", "tablet", "gadget", "device"],
  "beauty": ["beauty", "cosmetics", "makeup", "skincare", "cream", "lotion", "perfume", "fragrance"],
  "home": ["home", "home decor", "furniture", "decor", "kitchen", "living", "bedroom", "homeware"],
};

// Function to get all possible variations for a search term
const getAllSearchVariations = (searchTerm: string): string[] => {
  const normalizedTerm = normalize(searchTerm);
  const allVariations = new Set<string>();
  
  // Add the original term
  allVariations.add(normalizedTerm);
  
  // Add singular/plural variations
  if (normalizedTerm.endsWith('s')) {
    allVariations.add(normalizedTerm.slice(0, -1)); // Remove 's'
  } else {
    allVariations.add(normalizedTerm + 's'); // Add 's'
  }
  
  // Add common misspellings and variations
  const commonVariations: Record<string, string[]> = {
    'women': ['woman', 'womens', 'women\'s', 'womenswear', 'female'],
    'men': ['man', 'mens', 'men\'s', 'menswear', 'male'],
    'shirts': ['shirt', 'tee', 't-shirt', 'tshirt', 'tops'],
    'jeans': ['jean', 'denim', 'trousers'],
    'shoes': ['shoe', 'footwear', 'sneaker', 'boot'],
    'dresses': ['dress', 'gown', 'frock'],
    'jackets': ['jacket', 'coat', 'blazer'],
    'accessories': ['accessory', 'jewellery', 'jewelry'],
  };
  
  // Check for common variations
  Object.entries(commonVariations).forEach(([key, variations]) => {
    if (normalizedTerm === key || variations.includes(normalizedTerm)) {
      variations.forEach(v => allVariations.add(v));
      allVariations.add(key);
    }
  });
  
  // Check keyword mappings
  Object.entries(SEARCH_KEYWORD_MAPPINGS).forEach(([primary, variations]) => {
    if (variations.includes(normalizedTerm) || primary === normalizedTerm) {
      variations.forEach(v => allVariations.add(v));
      allVariations.add(primary);
    }
  });
  
  return Array.from(allVariations);
};

// Function to fetch intelligent search results
const fetchIntelligentSearchResults = async (searchTerm: string) => {
  try {
    const searchVariations = getAllSearchVariations(searchTerm);
    
    if (searchVariations.length === 0) {
      return [];
    }
    
    // First, try exact or close category matches
    const { data: categoryData, error: categoryError } = await supabase
      .from("products")
      .select("*")
      .or(searchVariations.map(term => `category.ilike.%${term}%`).join(','))
      .eq("is_active", true)
      .limit(15);

    // If we have good category matches, return them
    if (categoryData && categoryData.length >= 3) {
      return categoryData;
    }

    // Otherwise, search across all fields
    const { data: allFieldsData, error: allFieldsError } = await supabase
      .from("products")
      .select("*")
      .or(searchVariations.map(term => 
        `category.ilike.%${term}%,name.ilike.%${term}%,subcategory.ilike.%${term}%,description.ilike.%${term}%`
      ).join(','))
      .eq("is_active", true)
      .limit(15);

    if (allFieldsError) {
      console.error("Error fetching search results:", allFieldsError);
      return [];
    }

    // Sort results by relevance
    const sortedResults = (allFieldsData || []).sort((a, b) => {
      const aScore = calculateRelevanceScore(a, searchVariations);
      const bScore = calculateRelevanceScore(b, searchVariations);
      return bScore - aScore;
    });

    return sortedResults.slice(0, 10);
  } catch (error) {
    console.error("Error in fetchIntelligentSearchResults:", error);
    return [];
  }
};

// Calculate relevance score for sorting
const calculateRelevanceScore = (product: any, searchTerms: string[]): number => {
  let score = 0;
  
  searchTerms.forEach(term => {
    // Exact category match gets highest score
    if (normalize(product.category).includes(term)) {
      score += 5;
    }
    
    // Exact name match
    if (normalize(product.name).includes(term)) {
      score += 4;
    }
    
    // Subcategory match
    if (normalize(product.subcategory).includes(term)) {
      score += 3;
    }
    
    // Description match
    if (normalize(product.description).includes(term)) {
      score += 1;
    }
    
    // Bonus for new and sale items
    if (product.is_new) score += 2;
    if (product.is_on_sale) score += 1;
  });
  
  return score;
};

// Function to fetch popular categories for suggestions
const fetchPopularCategories = async () => {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("category")
      .eq("is_active", true)
      .limit(20);

    if (error) {
      console.error("Error fetching categories:", error);
      return [];
    }

    // Count category frequencies
    const categoryCounts: Record<string, number> = {};
    data.forEach(product => {
      if (product.category) {
        categoryCounts[product.category] = (categoryCounts[product.category] || 0) + 1;
      }
    });

    // Get top 5 popular categories
    return Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category]) => category);
  } catch (error) {
    console.error("Error in fetchPopularCategories:", error);
    return [];
  }
};

interface HeaderProps {
  activeCategory?: string;
}

/* AccountIcons Component - UPDATED: Show profile on desktop, hide on mobile */
interface AccountIconsProps {
  onOpenProfile: () => void;
  onOpenOrders: () => void;
  iconColor?: string;
  showProfile?: boolean;
  showOrders?: boolean;
}

const AccountIcons = ({ onOpenProfile, onOpenOrders, iconColor = "text-gray-800", showProfile = true, showOrders = true }: AccountIconsProps) => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {/* PROFILE - Hidden on mobile, shown on desktop */}
      {showProfile && (
        <button
          onClick={onOpenProfile}
          className="hidden lg:flex p-2 hover:bg-[#E9E1D8]/50 rounded-md transition-colors relative group flex-shrink-0"
          aria-label="Account"
        >
          <User size={20} className={iconColor} />
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            {isAuthenticated ? 'My Profile' : 'Sign In'}
          </div>
        </button>
      )}

      {/* ORDERS - Conditionally rendered, hidden on mobile */}
      {showOrders && isAuthenticated && (
        <button
          onClick={onOpenOrders}
          className="hidden lg:flex p-2 hover:bg-[#E9E1D8]/50 rounded-md transition-colors relative group"
          aria-label="Orders"
        >
          <Package size={20} className={iconColor} />
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            My Orders
          </div>
        </button>
      )}
    </div>
  );
};

/* HeaderIconBar Component */
interface IconItem {
  id: string;
  title: string;
  image_url: string;
  link_url: string;
  badge_text?: string;
  badge_color?: string;
}

/* Get safe route - FIXED VERSION */
const getSafeRoute = (url: string) => {
  if (!url) return "/products";

  if (url.startsWith("http://") || url.startsWith("https://")) {
    console.warn("Blocked external link:", url);
    return "/products";
  }

  if (!url.startsWith("/")) {
    // If it starts with a query parameter like ?category=men
    if (url.startsWith("?")) {
      return `/products${url}`;
    }
    // If it's just a category name like "men"
    if (["men", "women", "accessories", "new", "sale"].includes(url.toLowerCase())) {
      return `/products?category=${url.toLowerCase()}`;
    }
    return `/${url}`;
  }

  return url;
};

interface HeaderIconBarProps {
  onIconClick?: (icon: IconItem) => void;
}

const HeaderIconBar = ({ onIconClick }: HeaderIconBarProps) => {
  const [icons, setIcons] = useState<IconItem[]>([]);
  const [selectedIconId, setSelectedIconId] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);

  // Helper function to convert Google Drive URL to embeddable format
  const convertDriveUrl = (url: string) => {
    if (!url || typeof url !== 'string') return "";
    
    if (!url.includes("drive.google.com")) return url.trim();
    
    const cleanUrl = url.split('?')[0];
    let fileId = "";
    
    // Format 1: https://drive.google.com/file/d/1QOzkXSP4Mwkzy7DV7gPgyTfKH7qzTahG/view
    const fileIdMatch = cleanUrl.match(/\/file\/d\/([^\/]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
      fileId = fileIdMatch[1];
    }
    
    // Format 2: https://drive.google.com/uc?id=...
    const idMatch = url.match(/[?&]id=([^&]+)/);
    if (idMatch && idMatch[1]) {
      fileId = idMatch[1];
    }
    
    if (!fileId) return url.trim();
    
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  };

  // Enhanced image error handler for Google Drive
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
              img.src = "https://via.placeholder.com/64/E9E1D8/6B6254?text=Icon";
            };
          };
        };
      } else {
        img.src = "https://via.placeholder.com/64/E9E1D8/6B6254?text=Icon";
      }
    } else {
      img.src = "https://via.placeholder.com/64/E9E1D8/6B6254?text=Icon";
    }
  };

  useEffect(() => {
    loadIcons();
  }, []);

  // Check current URL and highlight matching icon
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
        
        // Special case: if icon title matches category
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
    
    // If the icon has a title but no proper link_url, create one based on title
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

  // Helper function to format badge text
  const formatBadgeText = (text: string) => {
    if (!text) return "";
    if (text.length > 8) {
      return text.substring(0, 6) + "..";
    }
    return text;
  };

  // Helper function to truncate long product names
  const truncateProductName = (name: string, maxLength: number = 12) => {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength) + "...";
  };

  // Check if icon is selected
  const isSelected = (iconId: string) => selectedIconId === iconId;

  if (!icons.length) return null;

  return (
    <div 
      ref={containerRef}
      className="relative bg-[#E9E1D8]"
      onMouseDown={(e) => {
        const container = containerRef.current;
        if (!container) return;

        const startX = e.pageX - container.offsetLeft;
        const scrollLeft = container.scrollLeft;

        const handleMouseMove = (e: MouseEvent) => {
          const x = e.pageX - container.offsetLeft;
          const walk = (x - startX) * 2;
          container.scrollLeft = scrollLeft - walk;
        };

        const handleMouseUp = () => {
          document.removeEventListener("mousemove", handleMouseMove);
          document.removeEventListener("mouseup", handleMouseUp);
          container.style.cursor = "grab";
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
        container.style.cursor = "grabbing";
      }}
      style={{ cursor: "grab" }}
    >
      <div className="container mx-auto px-4 pb-4 pt-2">
        <div className="flex gap-5 overflow-x-auto scrollbar-hide py-2">
          {icons.map((icon) => {
            const processedImageUrl = convertDriveUrl(icon.image_url);
            
            return (
              <button
                key={icon.id}
                onClick={() => handleClick(icon)}
                className="relative min-w-[90px] flex-shrink-0 flex flex-col items-center pb-2 group"
              >
                {/* Badge */}
                {icon.badge_text && (
                  <div className="absolute -top-1.5 -right-1.5 z-10">
                    <span
                      className="text-[9px] text-white px-1.5 py-0.5 rounded-full font-bold shadow-sm"
                      style={{
                        backgroundColor:
                          icon.badge_color || "#D4A574",
                      }}
                    >
                      {formatBadgeText(icon.badge_text)}
                    </span>
                  </div>
                )}

                {/* Image Container */}
                <div
                  className={`w-16 h-16 rounded-full overflow-hidden mb-2 flex-shrink-0 relative
                  ${
                    isSelected(icon.id)
                      ? "ring-2 ring-amber-600 ring-offset-2 ring-offset-[#E9E1D8]"
                      : "hover:ring-2 hover:ring-amber-500 hover:ring-offset-2 hover:ring-offset-[#E9E1D8]"
                  }`}
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

                {/* Text */}
                <div className="min-h-[40px] flex items-center justify-center">
                  <span
                    className={`text-xs font-bold transition-colors text-center break-words line-clamp-2
                    ${
                      isSelected(icon.id)
                        ? "text-amber-800"
                        : "text-gray-800"
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

                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                  {icon.title}
                </div>

                {/* Selected Indicator */}
                {isSelected(icon.id) && (
                  <div className="mt-1 w-8 h-0.5 bg-amber-600 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* Main Header Component */
const Header = ({ activeCategory }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [popularCategories, setPopularCategories] = useState<string[]>([]);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

  const searchRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);

  const { totalItems, setIsCartOpen } = useCart();
  const { wishlistItems } = useWishlist();
  const {
    isAuthenticated,
    setIsAuthModalOpen,
    setAuthMode,
    isAdmin,
    isAccountDrawerOpen,
    setIsAccountDrawerOpen,
  } = useAuth();
  const { settings, loading, getStoreNameParts } = useSettings();

  const navigate = useNavigate();
  const location = useLocation();

  // Debounce search input
  const debouncedSearch = useRef<NodeJS.Timeout | null>(null);

  // Check if we're on home page (for AutoSlide only)
  const isHomePage = location.pathname === "/";

  // 🔥 GET CATEGORY FROM URL (NOT STATE)
  const params = new URLSearchParams(location.search);
  const currentCategory = params.get("category") || activeCategory;

  // Get store name parts
  const nameParts = getStoreNameParts();

  // Check if we're on pages where HeaderIconBar should be hidden
  const shouldHideHeaderIconBar = () => {
    const currentPath = location.pathname;
    
    const hiddenPaths = [
      "/wishlist",
      "/account/orders",
      "/cart",
      "/checkout",
      "/shipping",
      "/product/",
    ];
    
    if (currentPath.startsWith("/product/")) {
      return true;
    }
    
    return hiddenPaths.some(path => currentPath.startsWith(path));
  };

  /* ================= SCROLL HANDLER ================= */
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsHeaderVisible(false);
      } else if (currentScrollY < lastScrollY) {
        setIsHeaderVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);

  /* ================= LOAD POPULAR CATEGORIES ================= */
  useEffect(() => {
    const loadPopularCategories = async () => {
      const categories = await fetchPopularCategories();
      setPopularCategories(categories);
    };
    
    loadPopularCategories();
  }, []);

  /* ================= ACTIVE STYLE ================= */
  const navClass = (cat?: string, isSale = false) => {
    if (isSale) {
      return params.get("sale") === "true"
        ? "text-orange-600 font-bold border-b-2 border-orange-600"
        : "text-orange-500 hover:text-orange-600";
    }

    return cat && normalize(cat) === normalize(currentCategory)
      ? "text-gray-800 font-bold border-b-2 border-gray-800"
      : "text-gray-700 hover:text-gray-800";
  };

  /* ================= CLOSE ON OUTSIDE CLICK ================= */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }

      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  /* ================= ENHANCED SEARCH HANDLER ================= */
  const handleSearch = (value?: string, isCategorySearch: boolean = false) => {
    const finalValue = (value ?? searchValue).trim();

    if (!finalValue) {
      setShowSuggestions(true);
      return;
    }

    const searchVariations = getAllSearchVariations(finalValue);
    const searchQuery = encodeURIComponent(finalValue);
    const relatedQuery = encodeURIComponent(searchVariations.join(","));

    if (isCategorySearch) {
      navigate(`/products?category=${encodeURIComponent(finalValue.toLowerCase())}`);
    } else {
      navigate(`/products?search=${searchQuery}&related=${relatedQuery}`);
    }

    setShowSuggestions(false);
    setSearchValue("");
    setIsSearchOpen(false);
    setSearchResults([]);
  };

  /* ================= INTELLIGENT SEARCH FETCHING ================= */
  useEffect(() => {
    if (debouncedSearch.current) {
      clearTimeout(debouncedSearch.current);
    }

    if (searchValue.trim().length >= 2) {
      setIsLoadingResults(true);
      
      debouncedSearch.current = setTimeout(async () => {
        const results = await fetchIntelligentSearchResults(searchValue);
        setSearchResults(results);
        setIsLoadingResults(false);
        setShowSuggestions(true);
      }, 300);
    } else {
      setSearchResults([]);
      setIsLoadingResults(false);
    }

    return () => {
      if (debouncedSearch.current) {
        clearTimeout(debouncedSearch.current);
      }
    };
  }, [searchValue]);

  /* ================= FIXED NAVIGATION HANDLERS ================= */
  const handleCategoryNavigation = (category: string) => {
    navigate(`/products?category=${encodeURIComponent(category.toLowerCase().trim())}`);
  };

  const handleNewArrivalsNavigation = () => {
    navigate("/products");
  };

  const handleSaleNavigation = () => {
    navigate("/products?sale=true");
  };

  /* ================= NAV CLICK HANDLER ================= */
  const goToCategory = (url: string) => {
    navigate(url);
    setIsMenuOpen(false);
  };

  /* ================= MOBILE NAV ITEMS ================= */
  const mobileNavItems = [
    { label: "Home", icon: <Home size={20} className="text-gray-700" />, onClick: () => goToCategory("/") },
    { 
      label: "Women", 
      icon: null, 
      onClick: () => goToCategory("/products?category=women") 
    },
    { 
      label: "Men", 
      icon: null, 
      onClick: () => goToCategory("/products?category=men") 
    },
    { 
      label: "Accessories", 
      icon: null, 
      onClick: () => goToCategory("/products?category=accessories") 
    },
    { 
      label: "New Arrivals", 
      icon: null, 
      onClick: () => goToCategory("/products") 
    },
    { 
      label: "Sale", 
      icon: null, 
      onClick: () => goToCategory("/products?sale=true") 
    },
    { 
      label: "Wishlist", 
      icon: <Heart size={20} className="text-gray-700" />, 
      onClick: () => goToCategory("/wishlist") 
    },
  ];

  // Function to handle logo click
  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate("/");
  };

  // Handle HeaderIconBar icon click
  const handleHeaderIconClick = (icon: IconItem) => {
    console.log("Header icon clicked:", icon.title);
  };

  // Handle product click from search results
  const handleProductClick = (productId: string) => {
    navigate(`/product/${productId}`);
    setShowSuggestions(false);
    setSearchValue("");
    setSearchResults([]);
  };

  // Handle category click from search suggestions
  const handleCategoryClick = (category: string) => {
    navigate(`/products?category=${encodeURIComponent(category.toLowerCase())}`);
    setShowSuggestions(false);
    setSearchValue("");
    setSearchResults([]);
  };

  return (
    <>
      {/* MAIN HEADER - Fixed at top */}
      <div className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${
        isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
      }`}>
        <header className="w-full bg-[#E9E1D8] backdrop-blur supports-[backdrop-filter]:bg-[#E9E1D8]/95 shadow-lg safe-top border-b border-[#D4C9BC]">
          <div className="container mx-auto px-3 sm:px-4">
            <div className="flex items-center justify-between py-3 gap-2">
              {/* MOBILE MENU BUTTON */}
              <button
                onClick={() => setIsMenuOpen(true)}
                className="lg:hidden p-1.5 sm:p-2 hover:bg-[#D4C9BC] rounded-md transition-colors relative group flex-shrink-0"
                aria-label="Open menu"
              >
                <Menu size={20} className="text-gray-800 sm:w-6 sm:h-6 w-5 h-5" />
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  Menu
                </div>
              </button>

              {/* LOGO */}
              <Link 
                to="/" 
                className="flex-shrink-0 min-w-[120px] sm:min-w-[140px]"
                onClick={handleLogoClick}
              >
                {loading ? (
                  <h1 className="text-lg sm:text-xl md:text-3xl font-bold text-gray-800">Loading...</h1>
                ) : (
                  <h1 className="text-lg sm:text-xl md:text-3xl font-bold whitespace-nowrap">
                    <span style={{ color: settings.first_name_color || "#6B6254" }}>
                      {nameParts.firstPart}
                    </span>
                    <span style={{ color: settings.second_name_color || "#D4A574" }}>
                      {nameParts.secondPart}
                    </span>
                  </h1>
                )}
              </Link>

              {/* DESKTOP NAV - FIXED NAVIGATION */}
              <nav className="hidden lg:flex items-center gap-4 xl:gap-6 ml-4 xl:ml-10">
                <button
                  onClick={() => handleCategoryNavigation("women")}
                  className={`nav-link text-sm xl:text-base whitespace-nowrap ${navClass("women")}`}
                >
                  WOMEN
                </button>

                <button
                  onClick={() => handleCategoryNavigation("men")}
                  className={`nav-link text-sm xl:text-base whitespace-nowrap ${navClass("men")}`}
                >
                  MEN
                </button>

                <button
                  onClick={() => handleCategoryNavigation("accessories")}
                  className={`nav-link text-sm xl:text-base whitespace-nowrap ${navClass("accessories")}`}
                >
                  ACCESSORIES
                </button>

                <button
                  onClick={handleNewArrivalsNavigation}
                  className={`nav-link text-sm xl:text-base whitespace-nowrap ${navClass(undefined, false)}`}
                >
                  NEW ARRIVALS
                </button>

                <button
                  onClick={handleSaleNavigation}
                  className={`nav-link text-sm xl:text-base whitespace-nowrap ${navClass(undefined, true)}`}
                >
                  SALE
                </button>
              </nav>

              {/* ENHANCED DESKTOP SEARCH LIKE FLIPKART */}
              <div ref={searchRef} className="relative hidden lg:flex items-center mx-4 xl:mx-6">
                <div className="flex items-center h-9 w-60 xl:w-80 2xl:w-96 rounded-md bg-white px-4 border border-[#D4C9BC] shadow-sm">
                  <button 
                    onClick={() => handleSearch()}
                    className="hover:opacity-70 transition-opacity relative group"
                    aria-label="Search"
                  >
                    <Search size={16} className="text-gray-600" />
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                      Search
                    </div>
                  </button>

                  <span className="mx-2 h-5 w-px bg-[#D4C9BC]" />

                  <input
                    type="text"
                    value={searchValue}
                    onChange={(e) => {
                      setSearchValue(e.target.value);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder="Search For Products and More"
                    className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-gray-500 text-gray-800 font-medium"
                    aria-label="Search products"
                  />
                </div>

                {/* FLIPKART-STYLE SEARCH SUGGESTIONS */}
                {showSuggestions && (
                  <div className="absolute top-11 left-0 w-full bg-white border border-gray-200 rounded-md shadow-lg z-[9999] max-h-96 overflow-y-auto">
                    {isLoadingResults ? (
                      <div className="p-4 text-center">
                        <p className="text-gray-600">Searching products...</p>
                      </div>
                    ) : searchResults.length > 0 || searchValue.trim().length >= 2 ? (
                      <div className="divide-y divide-gray-100">
                        {/* Search Results Section */}
                        {searchResults.length > 0 && (
                          <div className="p-3 bg-amber-50">
                            <p className="text-xs text-gray-600 mb-2 font-semibold">
                              Products matching "{searchValue}" ({searchResults.length})
                            </p>
                            {searchResults.slice(0, 6).map((product) => (
                              <button
                                key={product.id}
                                onClick={() => handleProductClick(product.id)}
                                className="flex items-center gap-3 w-full text-left py-2 px-1 hover:bg-white rounded transition-colors"
                              >
                                {product.images && product.images.length > 0 && (
                                  <div className="w-12 h-12 flex-shrink-0 rounded overflow-hidden border border-gray-200">
                                    <img 
                                      src={product.images[0]} 
                                      alt={product.name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {product.name}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-amber-600 font-medium">
                                      {product.category}
                                    </span>
                                    {product.subcategory && (
                                      <>
                                        <span className="text-gray-400">•</span>
                                        <span className="text-xs text-gray-500">
                                          {product.subcategory}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <p className="text-sm font-bold text-gray-900">
                                      ₹{product.price}
                                    </p>
                                    {product.original_price && product.original_price > product.price && (
                                      <>
                                        <span className="text-xs text-gray-500 line-through">
                                          ₹{product.original_price}
                                        </span>
                                        <span className="text-xs text-green-600 font-medium">
                                          {Math.round((1 - product.price / product.original_price) * 100)}% off
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Popular Categories Section */}
                        {popularCategories.length > 0 && (
                          <div className="p-3">
                            <p className="text-xs text-gray-600 mb-2 font-semibold">
                              Popular Categories
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {popularCategories.map((category) => (
                                <button
                                  key={category}
                                  onClick={() => handleCategoryClick(category)}
                                  className="px-3 py-1.5 text-xs bg-[#E9E1D8] hover:bg-amber-100 text-gray-700 hover:text-amber-700 rounded-full transition-colors border border-[#D4C9BC]"
                                >
                                  {category}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Trending Searches Section */}
                        <div className="p-3">
                          <p className="text-xs text-gray-600 mb-2 font-semibold flex items-center gap-1">
                            <TrendingUp size={14} className="text-amber-600" /> Trending Searches
                          </p>
                          <div className="space-y-1">
                            {TRENDING_SEARCHES.map((item) => (
                              <button
                                key={item}
                                onClick={() => handleSearch(item, true)}
                                className="block w-full text-left text-sm py-1.5 px-1 text-gray-700 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                              >
                                {item}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Default Suggestions when no search */
                      <div className="p-3">
                        <p className="text-xs text-gray-600 mb-2 font-semibold flex items-center gap-1">
                          <TrendingUp size={14} className="text-amber-600" /> Start typing to search products
                        </p>
                        <div className="space-y-1">
                          {popularCategories.slice(0, 5).map((category) => (
                            <button
                              key={category}
                              onClick={() => handleCategoryClick(category)}
                              className="block w-full text-left text-sm py-1.5 px-1 text-gray-700 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                            >
                              Browse {category} products
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Search All Button */}
                    {searchValue.trim().length >= 2 && (
                      <div className="p-3 border-t border-gray-200 bg-gray-50">
                        <button
                          onClick={() => handleSearch()}
                          className="w-full py-2.5 bg-amber-600 text-white font-medium rounded hover:bg-amber-700 transition-colors text-sm flex items-center justify-center gap-2"
                        >
                          <Search size={16} />
                          View All Results for "{searchValue}"
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* RIGHT ICONS - UPDATED: Profile icon visible on desktop, hidden on mobile */}
              <div className="flex items-center gap-1.5 sm:gap-3">
                {isAdmin && (
                  <Link 
                    to="/admin" 
                    className="hidden lg:flex p-1.5 sm:p-2 hover:bg-[#D4C9BC] rounded-md transition-colors relative group flex-shrink-0"
                    aria-label="Admin dashboard"
                  >
                    <Shield size={18} className="text-gray-800 sm:w-5 sm:h-5 w-4 h-4" />
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                      Admin Dashboard
                    </div>
                  </Link>
                )}

                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="p-1.5 sm:p-2 lg:hidden hover:bg-[#D4C9BC] rounded-md transition-colors relative group flex-shrink-0"
                  aria-label="Search"
                >
                  <Search size={18} className="text-gray-800 sm:w-5 sm:h-5 w-4 h-4" />
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    Search
                  </div>
                </button>

                {/* Wishlist Icon - Visible on both mobile and desktop */}
                <Link 
                  to="/wishlist" 
                  className="relative p-1.5 sm:p-2 hover:bg-[#D4C9BC] rounded-md transition-colors group flex-shrink-0"
                  aria-label="Wishlist"
                >
                  <Heart size={18} className="text-gray-800 sm:w-5 sm:h-5 w-4 h-4" />
                  {wishlistItems.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 bg-orange-400 text-gray-800 text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center font-bold">
                      {wishlistItems.length}
                    </span>
                  )}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    My Wishlist
                  </div>
                </Link>

                {/* Account Icons - UPDATED: Profile icon visible on desktop only */}
                <AccountIcons
                  iconColor="text-gray-800"
                  showProfile={true}
                  showOrders={true}
                  onOpenProfile={() => {
                    if (!isAuthenticated) {
                      setAuthMode("login");
                      setIsAuthModalOpen(true);
                    } else {
                      setIsAccountDrawerOpen(true);
                    }
                  }}
                  onOpenOrders={() => {
                    if (!isAuthenticated) {
                      setAuthMode("login");
                      setIsAuthModalOpen(true);
                    } else {
                      navigate("/account/orders");
                    }
                  }}
                />

                {/* Cart Icon - Visible on both mobile and desktop */}
                <button
                  onClick={() => setIsCartOpen(true)}
                  className="relative p-1.5 sm:p-2 hover:bg-[#D4C9BC] rounded-md transition-colors group flex-shrink-0"
                  aria-label="Cart"
                >
                  <ShoppingBag size={18} className="text-gray-800 sm:w-5 sm:h-5 w-4 h-4" />
                  {totalItems > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-4 h-4 sm:w-5 sm:h-5 bg-orange-400 text-xs rounded-full flex items-center justify-center text-gray-800 font-bold">
                      {totalItems}
                    </span>
                  )}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    My Cart
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* MOBILE SEARCH */}
          {isSearchOpen && (
            <div className="lg:hidden border-t border-[#D4C9BC] bg-[#E9E1D8] px-4 py-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Search products..."
                  className="flex-1 h-11 px-3 border border-[#D4C9BC] bg-white text-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent font-medium"
                  aria-label="Search products"
                />

                <button
                  onClick={() => handleSearch()}
                  className="h-11 px-4 bg-orange-400 text-gray-800 font-medium rounded-md hover:bg-orange-300 transition-colors"
                  aria-label="Submit search"
                >
                  Search
                </button>

                <button
                  onClick={() => setIsSearchOpen(false)}
                  className="p-2 hover:bg-[#D4C9BC] rounded-md transition-colors"
                  aria-label="Close search"
                >
                  <X size={20} className="text-gray-800" />
                </button>
              </div>
            </div>
          )}
        </header>
      </div>

      {/* SPACER DIV - Adjust height based on header visibility */}
      <div className={`transition-all duration-300 ${isHeaderVisible ? 'h-14 sm:h-16' : 'h-0'}`}></div>

      {/* HEADER ICON BAR */}
      {!shouldHideHeaderIconBar() && (
        <div className="relative z-30">
          <HeaderIconBar onIconClick={handleHeaderIconClick} />
          {isHomePage && <AutoSlide />}
        </div>
      )}

      {/* MOBILE MENU OVERLAY */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div 
            className="fixed inset-0 bg-black/70" 
            onClick={() => setIsMenuOpen(false)}
            aria-hidden="true"
          />
          
          <div 
            ref={mobileMenuRef}
            className="fixed inset-y-0 left-0 w-72 bg-white shadow-lg overflow-y-auto"
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">Menu</h2>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Close menu"
                >
                  <X size={20} className="text-gray-600" />
                </button>
              </div>

              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#E9E1D8] rounded-full flex items-center justify-center">
                    <User size={20} className="text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                      {isAuthenticated ? "My Account" : "Welcome Guest"}
                    </p>
                    {isAuthenticated ? (
                      <button
                        onClick={() => {
                          setIsAccountDrawerOpen(true);
                          setIsMenuOpen(false);
                        }}
                        className="text-sm text-gray-600 hover:text-orange-500 transition-colors"
                      >
                        View Profile
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setAuthMode("login");
                          setIsAuthModalOpen(true);
                          setIsMenuOpen(false);
                        }}
                        className="text-sm text-orange-500 hover:text-orange-600 transition-colors"
                      >
                        Sign In / Register
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <nav className="flex-1 p-2">
                {mobileNavItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={item.onClick}
                    className="flex items-center w-full p-3 text-left hover:bg-[#E9E1D8] rounded-lg transition-colors text-gray-700 hover:text-gray-900"
                  >
                    {item.icon && <span className="mr-3">{item.icon}</span>}
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </nav>

              <div className="p-4 border-t border-gray-200">
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="flex items-center p-3 text-left hover:bg-[#E9E1D8] rounded-lg transition-colors text-gray-700 hover:text-gray-900"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Shield size={18} className="mr-3 text-gray-600" />
                    <span className="font-medium">Admin Dashboard</span>
                  </Link>
                )}
                
                <button
                  onClick={() => {
                    navigate("/account/orders");
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center w-full p-3 text-left hover:bg-[#E9E1D8] rounded-lg transition-colors text-gray-700 hover:text-gray-900"
                >
                  <Package size={18} className="mr-3 text-gray-600" />
                  <span className="font-medium">My Orders</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DRAWERS */}
      <CartDrawer />
      <AccountDrawer
        open={isAccountDrawerOpen}
        onClose={() => setIsAccountDrawerOpen(false)}
      />
    </>
  );
};

export default Header;