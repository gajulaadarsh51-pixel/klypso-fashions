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
  ChevronRight,
  Clock,
  Flame,
  Store,
  ArrowLeft,
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

// Trending searches like Flipkart
const TRENDING_SEARCHES = [
  "Kurtas",
  "Chocolates",
  "Valentines day gifts",
  "Oppo reno 15c 5g",
  "Laptop table",
  "Samsung a07 mobile 5g",
  "Galaxy a07 5g",
  "Egg boilers",
];

// Recommended stores like Flipkart
const RECOMMENDED_STORES = [
  "Body and Fashion",
  "Women's Style",
  "Bath Essentials",
  "Home Decor",
  "Electronics Hub",
  "Grocery Store",
];

// Enhanced search keyword mappings
const SEARCH_KEYWORD_MAPPINGS: Record<string, string[]> = {
  "women": ["women", "womens", "woman", "womenswear", "female", "ladies", "girl", "girls", "women's"],
  "men": ["men", "mens", "man", "menswear", "male", "gentlemen", "boy", "boys", "men's"],
  "kids": ["kids", "children", "child", "baby", "toddler", "boys", "girls", "kidswear", "childrenswear"],
  "electronics": ["electronics", "mobile", "phone", "laptop", "tablet", "gadget", "device"],
  "beauty": ["beauty", "cosmetics", "makeup", "skincare", "cream", "lotion", "perfume", "fragrance"],
};

// Local storage key for recent searches
const RECENT_SEARCHES_KEY = 'recent_searches';

// Get recent searches from localStorage
const getRecentSearches = (): string[] => {
  try {
    const searches = localStorage.getItem(RECENT_SEARCHES_KEY);
    return searches ? JSON.parse(searches) : [];
  } catch {
    return [];
  }
};

// Save search to recent searches
const saveToRecentSearches = (searchTerm: string) => {
  try {
    const searches = getRecentSearches();
    const filtered = searches.filter(s => s.toLowerCase() !== searchTerm.toLowerCase());
    filtered.unshift(searchTerm);
    const recent = filtered.slice(0, 10);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent));
  } catch (error) {
    console.error("Error saving recent search:", error);
  }
};

// Clear recent searches
const clearRecentSearches = () => {
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
    return true;
  } catch (error) {
    console.error("Error clearing recent searches:", error);
    return false;
  }
};

const getAllSearchVariations = (searchTerm: string): string[] => {
  const normalizedTerm = normalize(searchTerm);
  const allVariations = new Set<string>();
  
  allVariations.add(normalizedTerm);
  
  if (normalizedTerm.endsWith('s')) {
    allVariations.add(normalizedTerm.slice(0, -1));
  } else {
    allVariations.add(normalizedTerm + 's');
  }
  
  Object.entries(SEARCH_KEYWORD_MAPPINGS).forEach(([primary, variations]) => {
    if (variations.includes(normalizedTerm) || primary === normalizedTerm) {
      variations.forEach(v => allVariations.add(v));
      allVariations.add(primary);
    }
  });
  
  return Array.from(allVariations);
};

const calculateRelevanceScore = (product: any, searchTerms: string[]): number => {
  let score = 0;
  
  searchTerms.forEach(term => {
    if (normalize(product.category).includes(term)) score += 5;
    if (normalize(product.name).includes(term)) score += 4;
    if (normalize(product.subcategory).includes(term)) score += 3;
    if (normalize(product.description).includes(term)) score += 1;
    
    if (product.is_new) score += 2;
    if (product.is_on_sale) score += 1;
  });
  
  return score;
};

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

    const categoryCounts: Record<string, number> = {};
    data.forEach(product => {
      if (product.category) {
        categoryCounts[product.category] = (categoryCounts[product.category] || 0) + 1;
      }
    });

    return Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category]) => category);
  } catch (error) {
    console.error("Error in fetchPopularCategories:", error);
    return [];
  }
};

const fetchIntelligentSearchResults = async (searchTerm: string) => {
  try {
    const term = normalize(searchTerm);
    const searchVariations = getAllSearchVariations(searchTerm);
    
    if (searchVariations.length === 0) {
      return [];
    }
    
    // ✅ FIX 6 — Improved search accuracy
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .or(`name.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%,subcategory.ilike.%${searchTerm}%`)
      .limit(30);

    if (error) {
      console.error("Error fetching search results:", error);
      return [];
    }
    
    const variations = getAllSearchVariations(searchTerm);
    return (data || []).sort((a, b) =>
      calculateRelevanceScore(b, variations) -
      calculateRelevanceScore(a, variations)
    );
  } catch (e) {
    console.error("Error in fetchIntelligentSearchResults:", e);
    return [];
  }
};

interface HeaderProps {
  activeCategory?: string;
}

/* AccountIcons Component */
interface AccountIconsProps {
  onOpenProfile: () => void;
  onOpenOrders: () => void;
  iconColor?: string;
  showProfile?: boolean;
  showOrders?: boolean;
}

const AccountIcons = ({ onOpenProfile, onOpenOrders, iconColor = "text-white", showProfile = true, showOrders = true }: AccountIconsProps) => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {showProfile && (
        <button
          onClick={onOpenProfile}
          className="hidden lg:flex p-2 hover:bg-[#E9E1D8]/30 rounded-md transition-colors relative group flex-shrink-0"
          aria-label="Account"
        >
          <User size={20} className={iconColor} />
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 bg-[#E9E1D8] text-gray-800 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            {isAuthenticated ? 'My Profile' : 'Sign In'}
          </div>
        </button>
      )}

      {showOrders && isAuthenticated && (
        <button
          onClick={onOpenOrders}
          className="hidden lg:flex p-2 hover:bg-[#E9E1D8]/30 rounded-md transition-colors relative group"
          aria-label="Orders"
        >
          <Package size={20} className={iconColor} />
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 bg-[#E9E1D8] text-gray-800 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            My Orders
          </div>
        </button>
      )}
    </div>
  );
};

/* HeaderIconBar Component - UPDATED TO SHOW ONLY PRODUCT NAMES */
interface IconItem {
  id: string;
  title: string;
  image_url: string;
  link_url: string;
  badge_text?: string;
  badge_color?: string;
}

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

interface HeaderIconBarProps {
  onIconClick?: (icon: IconItem) => void;
  showOnlyNames?: boolean;
}

const HeaderIconBar = ({ onIconClick, showOnlyNames = false }: HeaderIconBarProps) => {
  const [icons, setIcons] = useState<IconItem[]>([]);
  const [selectedIconId, setSelectedIconId] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadIcons();
  }, []);

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

  const loadIcons = async () => {
    const { data, error } = await supabase
      .from("header_icons")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (!error && data) {
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

  const truncateProductName = (name: string, maxLength: number = 12) => {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength) + "...";
  };

  const isSelected = (iconId: string) => selectedIconId === iconId;

  if (!icons.length) return null;

  if (showOnlyNames) {
    // Show only product names (like Flipkart when scrolling)
    return (
      <div className="relative bg-[#E9E1D8] py-1 border-t border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-4 overflow-x-auto py-1">
            {icons.slice(0, 8).map((icon) => (
              <button
                key={icon.id}
                onClick={() => handleClick(icon)}
                className={`text-xs font-medium whitespace-nowrap px-2 py-1 rounded transition-colors ${
                  isSelected(icon.id)
                    ? "text-gray-900 bg-white/50"
                    : "text-gray-700 hover:text-gray-900"
                }`}
              >
                {truncateProductName(icon.title, 10)}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show full icons with images (default view)
  return (
    <div className="relative bg-[#E9E1D8]">
      <div className="container mx-auto px-4 pb-4 pt-2">
        <div 
          ref={containerRef}
          className="flex gap-5 overflow-x-auto py-2 scrollbar-hide"
          style={{ cursor: "grab" }}
        >
          {icons.map((icon) => (
            <button
              key={icon.id}
              onClick={() => handleClick(icon)}
              className="relative min-w-[90px] flex-shrink-0 flex flex-col items-center pb-2 group"
            >
              <div
                className={`w-16 h-16 rounded-full overflow-hidden mb-2 flex-shrink-0 relative
                ${
                  isSelected(icon.id)
                    ? "ring-2 ring-gray-600 ring-offset-2 ring-offset-[#E9E1D8]"
                    : "hover:ring-2 hover:ring-gray-400 hover:ring-offset-2 hover:ring-offset-[#E9E1D8]"
                }`}
              >
                <div className="w-full h-full overflow-hidden relative">
                  <img
                    src={icon.image_url}
                    alt={icon.title}
                    className="w-full h-full object-cover absolute top-0 left-0"
                    style={{
                      objectPosition: "center top",
                      minHeight: "100%",
                      minWidth: "100%"
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://via.placeholder.com/64/cccccc/969696?text=Icon";
                    }}
                  />
                </div>
              </div>

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

              {isSelected(icon.id) && (
                <div className="mt-1 w-8 h-0.5 bg-gray-600 rounded-full" />
              )}
            </button>
          ))}
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
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isIconBarVisible, setIsIconBarVisible] = useState(true);
  const [showIconNamesOnly, setShowIconNamesOnly] = useState(false);

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

  const debouncedSearch = useRef<NodeJS.Timeout | null>(null);

  const isHomePage = location.pathname === "/";
  const params = new URLSearchParams(location.search);
  const currentCategory = params.get("category") || activeCategory;
  const nameParts = getStoreNameParts();

  // Load recent searches on component mount
  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  /* ================= SCROLL HANDLER ================= */
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // ✅ FIX 4 — Improved scroll behavior like Flipkart
      if (currentScrollY > 80) {
        setIsHeaderVisible(false);
        setShowIconNamesOnly(true);
      } else {
        setIsHeaderVisible(true);
        setShowIconNamesOnly(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
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
        ? "text-orange-500 font-bold border-b-2 border-orange-500"
        : "text-gray-800 hover:text-orange-500";
    }

    return cat && normalize(cat) === normalize(currentCategory)
      ? "text-gray-900 font-bold border-b-2 border-gray-900"
      : "text-gray-800 hover:text-gray-900";
  };

  /* ================= CLOSE ON OUTSIDE CLICK ================= */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setIsSearchOpen(false);
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
  const handleSearch = (value?: string) => {
    const finalValue = (value ?? searchValue).trim().toLowerCase();

    if (!finalValue) {
      setShowSuggestions(true);
      return;
    }

    // Save to recent searches
    saveToRecentSearches(finalValue);
    setRecentSearches(getRecentSearches());

    // ✅ FIX 3 — Direct category navigation
    if (finalValue === "women" || finalValue === "woman") {
      navigate("/products?category=women");
    } 
    else if (finalValue === "men" || finalValue === "man") {
      navigate("/products?category=men");
    } 
    else if (finalValue === "kids") {
      navigate("/products?category=kids");
    } 
    else {
      navigate(`/products?search=${encodeURIComponent(finalValue)}`);
    }

    setShowSuggestions(false);
    setSearchValue("");
    setIsSearchOpen(false);
  };

  /* ================= SEARCH FETCHING ================= */
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
      if (debouncedSearch.current) clearTimeout(debouncedSearch.current);
    };
  }, [searchValue]);

  /* ================= NAVIGATION HANDLERS ================= */
  const handleCategoryNavigation = (category: string) => {
    navigate(`/products?category=${encodeURIComponent(category.toLowerCase().trim())}`);
  };

  const handleNewArrivalsNavigation = () => {
    navigate("/products");
  };

  const handleSaleNavigation = () => {
    navigate("/products?sale=true");
  };

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

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate("/");
  };

  const handleHeaderIconClick = (icon: IconItem) => {
    console.log("Header icon clicked:", icon.title);
  };

  const handleProductClick = (productId: string) => {
    navigate(`/product/${productId}`);
    setShowSuggestions(false);
    setSearchValue("");
    setSearchResults([]);
    setIsSearchOpen(false);
  };

  const handleCategoryClick = (category: string) => {
    navigate(`/products?category=${encodeURIComponent(category.toLowerCase())}`);
    setShowSuggestions(false);
    setSearchValue("");
    setSearchResults([]);
    setIsSearchOpen(false);
  };

  const handleClearRecentSearches = () => {
    if (clearRecentSearches()) {
      setRecentSearches([]);
    }
  };

  // Render Flipkart-style search suggestions
  const renderSearchSuggestions = () => {
    return (
      <div className="absolute top-14 left-0 w-full bg-white border border-gray-200 rounded-xl shadow-xl z-[9999] max-h-[70vh] overflow-y-auto">
        <div className="divide-y divide-gray-100">
          {/* ✅ FIX 2 — Show Recent + Trending By Default */}
          {searchValue.trim().length === 0 && (
            <>
              {/* Recent Searches Section */}
              {recentSearches.length > 0 && (
                <div className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                      <Clock size={14} className="text-gray-600" />
                      Recent Searches
                    </p>
                    <button
                      onClick={handleClearRecentSearches}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="space-y-2">
                    {recentSearches.map((search, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setSearchValue(search);
                          setTimeout(() => handleSearch(search), 100);
                        }}
                        className="flex items-center justify-between w-full text-left p-2 hover:bg-gray-50 rounded transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                            <Clock size={14} className="text-gray-500" />
                          </div>
                          <span className="text-sm text-gray-700">{search}</span>
                        </div>
                        <X size={14} className="text-gray-400 opacity-0 group-hover:opacity-100" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Trending Searches Section */}
              <div className="p-3">
                <p className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <Flame size={14} className="text-orange-500" />
                  Trending Searches
                </p>
                <div className="space-y-2">
                  {TRENDING_SEARCHES.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSearchValue(item);
                        setTimeout(() => handleSearch(item), 100);
                      }}
                      className="flex items-center justify-between w-full text-left p-2 hover:bg-gray-50 rounded transition-colors"
                    >
                      <span className="text-sm text-gray-700">{item}</span>
                      <ChevronRight size={14} className="text-gray-400" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Recommended Stores Section */}
              <div className="p-3">
                <p className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <Store size={14} className="text-blue-500" />
                  Recommended Stores For You
                </p>
                <div className="space-y-2">
                  {RECOMMENDED_STORES.map((store, index) => (
                    <button
                      key={index}
                      onClick={() => handleCategoryClick("stores")}
                      className="flex items-center justify-between w-full text-left p-2 hover:bg-gray-50 rounded transition-colors"
                    >
                      <span className="text-sm text-gray-700">{store}</span>
                      <ChevronRight size={14} className="text-gray-400" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Popular Categories Section */}
              {popularCategories.length > 0 && (
                <div className="p-3">
                  <p className="text-sm font-semibold text-gray-800 mb-2">
                    Popular Categories
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {popularCategories.map((category) => (
                      <button
                        key={category}
                        onClick={() => handleCategoryClick(category)}
                        className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 rounded-full transition-colors border border-gray-200"
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Search Results Section */}
          {searchResults.length > 0 && searchValue.trim().length >= 2 && (
            <div className="p-3 bg-gray-50">
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
                      <span className="text-xs text-gray-600 font-medium">
                        {product.category}
                      </span>
                      {product.gender && (
                        <>
                          <span className="text-gray-400">•</span>
                          <span className="text-xs text-gray-500 capitalize">
                            {product.gender}
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
                  <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
                </button>
              ))}
            </div>
          )}

          {/* Search All Button */}
          {searchValue.trim().length >= 2 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => handleSearch()}
                className="w-full py-2.5 bg-gray-800 text-white font-medium rounded hover:bg-gray-900 transition-colors text-sm flex items-center justify-center gap-2"
              >
                <Search size={16} />
                View All Results for "{searchValue}"
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* ✅ FIX 5 — Smooth Transition Animation */}
      <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isHeaderVisible ? "translate-y-0" : "-translate-y-full"
      }`}>
        <header className="w-full bg-[#E9E1D8] backdrop-blur supports-[backdrop-filter]:bg-[#E9E1D8]/95 shadow-lg safe-top">
          <div className="container mx-auto px-3 sm:px-4">
            {/* TOP ROW: Menu, Logo, Cart */}
            <div className="flex items-center justify-between py-3">
              {/* MOBILE MENU BUTTON - Left */}
              <button
                onClick={() => setIsMenuOpen(true)}
                className="lg:hidden p-1.5 hover:bg-white/30 rounded-md transition-colors relative group flex-shrink-0"
                aria-label="Open menu"
              >
                <Menu size={20} className="text-gray-800" />
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  Menu
                </div>
              </button>

              {/* LOGO - Center */}
              <div className="flex-1 flex justify-center lg:justify-start">
                <Link 
                  to="/" 
                  className="flex-shrink-0"
                  onClick={handleLogoClick}
                >
                  {loading ? (
                    <h1 className="text-lg sm:text-xl md:text-3xl font-bold text-gray-800">Loading...</h1>
                  ) : (
                    <h1 className="text-lg sm:text-xl md:text-3xl font-bold whitespace-nowrap">
                      <span style={{ color: settings.first_name_color || "#1e293b" }}>
                        {nameParts.firstPart}
                      </span>
                      <span style={{ color: settings.second_name_color || "#f59e0b" }}>
                        {nameParts.secondPart}
                      </span>
                    </h1>
                  )}
                </Link>
              </div>

              {/* RIGHT ICONS - Cart and Search (Mobile) */}
              <div className="flex items-center gap-2">
                {/* Cart Icon */}
                <button
                  onClick={() => setIsCartOpen(true)}
                  className="relative p-1.5 hover:bg-white/30 rounded-md transition-colors group flex-shrink-0"
                  aria-label="Cart"
                >
                  <ShoppingBag size={20} className="text-gray-800" />
                  {totalItems > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-orange-400 text-xs rounded-full flex items-center justify-center text-gray-900 font-bold">
                      {totalItems}
                    </span>
                  )}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    My Cart
                  </div>
                </button>
              </div>
            </div>

            {/* SEARCH BAR ROW - Mobile Only, in the middle */}
            <div className="lg:hidden pb-3">
              <div className="relative" ref={searchRef}>
                <div className="flex items-center h-12 bg-white rounded-lg px-4 border border-gray-300 shadow-sm">
                  <button 
                    onClick={() => handleSearch()}
                    className="hover:opacity-70 transition-opacity"
                    aria-label="Search"
                  >
                    <Search size={20} className="text-gray-600" />
                  </button>
                  
                  <input
                    type="text"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    onFocus={() => {
                      setShowSuggestions(true);
                      setIsSearchOpen(true);
                    }}
                    placeholder="Search for products, brands and more"
                    className="flex-1 h-full px-3 bg-transparent text-gray-900 focus:outline-none text-sm font-medium placeholder:text-gray-500"
                    aria-label="Search products"
                  />
                  
                  {searchValue && (
                    <button
                      onClick={() => setSearchValue("")}
                      className="p-1 hover:bg-gray-100 rounded-full"
                      aria-label="Clear search"
                    >
                      <X size={18} className="text-gray-500" />
                    </button>
                  )}
                </div>

                {/* ✅ FIX 1 — Mobile Search Suggestions (Dropdown under search bar) */}
                {showSuggestions && (
                  <div className="absolute top-14 left-0 w-full bg-white border border-gray-200 rounded-xl shadow-xl z-[9999] max-h-[70vh] overflow-y-auto">
                    {/* 🔥 REMOVED DUPLICATE SEARCH BAR - Only shows suggestions now */}
                    
                    {/* Search Content */}
                    <div className="divide-y divide-gray-100">
                      {/* Recent Searches */}
                      {searchValue.trim().length === 0 && recentSearches.length > 0 && (
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-base font-semibold text-gray-800 flex items-center gap-2">
                              <Clock size={16} className="text-gray-600" />
                              Recent Searches
                            </p>
                            <button
                              onClick={handleClearRecentSearches}
                              className="text-sm text-blue-600 hover:text-blue-800"
                            >
                              Clear All
                            </button>
                          </div>
                          <div className="space-y-2">
                            {recentSearches.map((search, index) => (
                              <button
                                key={index}
                                onClick={() => {
                                  setSearchValue(search);
                                  setTimeout(() => handleSearch(search), 100);
                                }}
                                className="flex items-center justify-between w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors group"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                    <Clock size={16} className="text-gray-500" />
                                  </div>
                                  <span className="text-base text-gray-700">{search}</span>
                                </div>
                                <X size={16} className="text-gray-400 opacity-0 group-hover:opacity-100" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Search Results */}
                      {searchResults.length > 0 && searchValue.trim().length >= 2 && (
                        <div className="p-4 bg-gray-50">
                          <p className="text-sm text-gray-600 mb-3 font-semibold">
                            Products matching "{searchValue}" ({searchResults.length})
                          </p>
                          <div className="space-y-3">
                            {searchResults.slice(0, 5).map((product) => (
                              <button
                                key={product.id}
                                onClick={() => handleProductClick(product.id)}
                                className="flex items-center gap-3 w-full text-left p-3 hover:bg-white rounded-lg transition-colors border border-gray-200"
                              >
                                {product.images && product.images.length > 0 && (
                                  <div className="w-14 h-14 flex-shrink-0 rounded overflow-hidden border border-gray-200">
                                    <img 
                                      src={product.images[0]} 
                                      alt={product.name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-base font-medium text-gray-900 truncate">
                                    {product.name}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-sm text-gray-600 font-medium">
                                      {product.category}
                                    </span>
                                    {product.gender && (
                                      <>
                                        <span className="text-gray-400">•</span>
                                        <span className="text-sm text-gray-500 capitalize">
                                          {product.gender}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                  <p className="text-base font-bold text-gray-900 mt-1">
                                    ₹{product.price}
                                  </p>
                                </div>
                                <ChevronRight size={18} className="text-gray-400 flex-shrink-0" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Trending Searches */}
                      {searchValue.trim().length === 0 && (
                        <div className="p-4">
                          <p className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <Flame size={16} className="text-orange-500" />
                            Trending Searches
                          </p>
                          <div className="space-y-2">
                            {TRENDING_SEARCHES.map((item, index) => (
                              <button
                                key={index}
                                onClick={() => {
                                  setSearchValue(item);
                                  setTimeout(() => handleSearch(item), 100);
                                }}
                                className="flex items-center justify-between w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors"
                              >
                                <span className="text-base text-gray-700">{item}</span>
                                <ChevronRight size={16} className="text-gray-400" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Recommended Stores */}
                      {searchValue.trim().length === 0 && (
                        <div className="p-4">
                          <p className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <Store size={16} className="text-blue-500" />
                            Recommended Stores For You
                          </p>
                          <div className="space-y-2">
                            {RECOMMENDED_STORES.map((store, index) => (
                              <button
                                key={index}
                                onClick={() => handleCategoryClick("stores")}
                                className="flex items-center justify-between w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors"
                              >
                                <span className="text-base text-gray-700">{store}</span>
                                <ChevronRight size={16} className="text-gray-400" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Popular Categories */}
                      {searchValue.trim().length === 0 && popularCategories.length > 0 && (
                        <div className="p-4">
                          <p className="text-base font-semibold text-gray-800 mb-3">
                            Popular Categories
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {popularCategories.map((category) => (
                              <button
                                key={category}
                                onClick={() => handleCategoryClick(category)}
                                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 rounded-lg transition-colors border border-gray-200"
                              >
                                {category}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Search All Button */}
                      {searchValue.trim().length >= 2 && (
                        <div className="p-4 border-t border-gray-200 bg-gray-50">
                          <button
                            onClick={() => handleSearch()}
                            className="w-full py-3 bg-gray-800 text-white font-medium rounded-lg hover:bg-gray-900 transition-colors text-base flex items-center justify-center gap-2"
                          >
                            <Search size={18} />
                            View All Results for "{searchValue}"
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* DESKTOP NAV & SEARCH */}
            <div className="hidden lg:flex items-center justify-between py-3">
              {/* DESKTOP NAV */}
              <nav className="flex items-center gap-4 xl:gap-6">
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

              {/* DESKTOP SEARCH */}
              <div ref={searchRef} className="relative flex items-center mx-4 xl:mx-6">
                <div className="flex items-center h-9 w-60 xl:w-80 2xl:w-96 rounded-md bg-white/90 backdrop-blur-sm px-4 border border-gray-300">
                  <button 
                    onClick={() => handleSearch()}
                    className="hover:opacity-70 transition-opacity relative group"
                    aria-label="Search"
                  >
                    <Search size={16} className="text-gray-600" />
                  </button>

                  <span className="mx-2 h-5 w-px bg-gray-400" />

                  <input
                    type="text"
                    value={searchValue}
                    onChange={(e) => {
                      setSearchValue(e.target.value);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder="Search For Products and More"
                    className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-gray-600 text-gray-900 font-medium"
                    aria-label="Search products"
                  />
                </div>

                {/* DESKTOP SEARCH SUGGESTIONS */}
                {showSuggestions && renderSearchSuggestions()}
              </div>

              {/* DESKTOP RIGHT ICONS */}
              <div className="flex items-center gap-3">
                {isAdmin && (
                  <Link 
                    to="/admin" 
                    className="flex p-1.5 hover:bg-white/30 rounded-md transition-colors relative group flex-shrink-0"
                    aria-label="Admin dashboard"
                  >
                    <Shield size={18} className="text-gray-800" />
                  </Link>
                )}

                <Link 
                  to="/wishlist" 
                  className="relative p-1.5 hover:bg-white/30 rounded-md transition-colors group flex-shrink-0"
                  aria-label="Wishlist"
                >
                  <Heart size={18} className="text-gray-800" />
                  {wishlistItems.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-orange-400 text-gray-900 text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                      {wishlistItems.length}
                    </span>
                  )}
                </Link>

                <AccountIcons
                  iconColor="text-gray-800"
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
              </div>
            </div>
          </div>
        </header>
      </div>

      {/* SPACER DIV - Adjust height based on header visibility */}
      <div className={`transition-all duration-300 ${
        isHeaderVisible ? (isSearchOpen ? 'h-32' : 'h-28') : 'h-0'
      }`}></div>

      {/* HEADER ICON BAR - Show based on scroll state */}
      {isIconBarVisible && (
        <div className={`relative z-30 transition-all duration-300 ${
          isIconBarVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full'
        }`}>
          <HeaderIconBar 
            onIconClick={handleHeaderIconClick} 
            showOnlyNames={showIconNamesOnly}
          />
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
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
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
                    className="flex items-center w-full p-3 text-left hover:bg-gray-100 rounded-lg transition-colors text-gray-700 hover:text-gray-900"
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
                    className="flex items-center p-3 text-left hover:bg-gray-100 rounded-lg transition-colors text-gray-700 hover:text-gray-900"
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
                  className="flex items-center w-full p-3 text-left hover:bg-gray-100 rounded-lg transition-colors text-gray-700 hover:text-gray-900"
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