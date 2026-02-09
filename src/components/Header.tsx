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

// Enhanced search keyword mappings
const SEARCH_KEYWORD_MAPPINGS: Record<string, string[]> = {
  "women": ["women", "womens", "woman", "womenswear", "female", "ladies", "girl", "girls", "women's"],
  "men": ["men", "mens", "man", "menswear", "male", "gentlemen", "boy", "boys", "men's"],
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
  
  Object.entries(commonVariations).forEach(([key, variations]) => {
    if (normalizedTerm === key || variations.includes(normalizedTerm)) {
      variations.forEach(v => allVariations.add(v));
      allVariations.add(key);
    }
  });
  
  Object.entries(SEARCH_KEYWORD_MAPPINGS).forEach(([primary, variations]) => {
    if (variations.includes(normalizedTerm) || primary === normalizedTerm) {
      variations.forEach(v => allVariations.add(v));
      allVariations.add(primary);
    }
  });
  
  return Array.from(allVariations);
};

// Calculate relevance score for sorting
const calculateRelevanceScore = (product: any, searchTerms: string[]): number => {
  let score = 0;
  
  searchTerms.forEach(term => {
    if (normalize(product.category).includes(term)) {
      score += 5;
    }
    
    if (normalize(product.name).includes(term)) {
      score += 4;
    }
    
    if (normalize(product.subcategory).includes(term)) {
      score += 3;
    }
    
    if (normalize(product.description).includes(term)) {
      score += 1;
    }
    
    if (product.gender && ['men', 'women', 'male', 'female', 'ladies', 'gentlemen'].includes(term)) {
      const productGender = normalize(product.gender);
      if (
        (term === 'men' && productGender.includes('men')) ||
        (term === 'women' && productGender.includes('women')) ||
        (term === 'male' && productGender.includes('male')) ||
        (term === 'female' && productGender.includes('female')) ||
        (term === 'ladies' && productGender.includes('ladies')) ||
        (term === 'gentlemen' && productGender.includes('gentlemen'))
      ) {
        score += 6;
      }
    }
    
    if (product.is_new) score += 2;
    if (product.is_on_sale) score += 1;
  });
  
  return score;
};

// Strict gender filter functions - FIXED VERSION
const isMenProduct = (product: any): boolean => {
  const productGender = normalize(product.gender || '');
  const productCategory = normalize(product.category || '');
  const productName = normalize(product.name || '');
  const productSubcategory = normalize(product.subcategory || '');
  
  // Check if it's EXACTLY for men (not containing women)
  const menExactTerms = ['men', 'male', 'gentlemen', 'boy', 'boys'];
  const womenExactTerms = ['women', 'female', 'ladies', 'girl', 'girls'];
  
  // Product gender should contain men term but NOT women term
  const genderIsMen = menExactTerms.some(term => productGender === term);
  const genderIsWomen = womenExactTerms.some(term => productGender === term);
  
  // Product category/name/subcategory check
  const categoryHasMen = menExactTerms.some(term => 
    productCategory === term || productCategory.includes(term)
  );
  const categoryHasWomen = womenExactTerms.some(term => 
    productCategory === term || productCategory.includes(term)
  );
  
  const nameHasMen = menExactTerms.some(term => 
    productName.includes(term)
  );
  const nameHasWomen = womenExactTerms.some(term => 
    productName.includes(term)
  );
  
  const subcategoryHasMen = menExactTerms.some(term => 
    productSubcategory.includes(term)
  );
  const subcategoryHasWomen = womenExactTerms.some(term => 
    productSubcategory.includes(term)
  );
  
  // Return true only if it has men characteristics AND no women characteristics
  return (
    (genderIsMen || categoryHasMen || nameHasMen || subcategoryHasMen) &&
    !(genderIsWomen || categoryHasWomen || nameHasWomen || subcategoryHasWomen)
  );
};

const isWomenProduct = (product: any): boolean => {
  const productGender = normalize(product.gender || '');
  const productCategory = normalize(product.category || '');
  const productName = normalize(product.name || '');
  const productSubcategory = normalize(product.subcategory || '');
  
  // Check if it's EXACTLY for women (not containing men)
  const menExactTerms = ['men', 'male', 'gentlemen', 'boy', 'boys'];
  const womenExactTerms = ['women', 'female', 'ladies', 'girl', 'girls'];
  
  // Product gender should contain women term but NOT men term
  const genderIsWomen = womenExactTerms.some(term => productGender === term);
  const genderIsMen = menExactTerms.some(term => productGender === term);
  
  // Product category/name/subcategory check
  const categoryHasWomen = womenExactTerms.some(term => 
    productCategory === term || productCategory.includes(term)
  );
  const categoryHasMen = menExactTerms.some(term => 
    productCategory === term || productCategory.includes(term)
  );
  
  const nameHasWomen = womenExactTerms.some(term => 
    productName.includes(term)
  );
  const nameHasMen = menExactTerms.some(term => 
    productName.includes(term)
  );
  
  const subcategoryHasWomen = womenExactTerms.some(term => 
    productSubcategory.includes(term)
  );
  const subcategoryHasMen = menExactTerms.some(term => 
    productSubcategory.includes(term)
  );
  
  // Return true only if it has women characteristics AND no men characteristics
  return (
    (genderIsWomen || categoryHasWomen || nameHasWomen || subcategoryHasWomen) &&
    !(genderIsMen || categoryHasMen || nameHasMen || subcategoryHasMen)
  );
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

// Function to fetch intelligent search results - COMPLETELY FIXED FOR GENDER SPECIFIC SEARCH
const fetchIntelligentSearchResults = async (searchTerm: string) => {
  try {
    const term = normalize(searchTerm);
    console.log("Searching for term:", term);

    const searchVariations = getAllSearchVariations(searchTerm);
    
    if (searchVariations.length === 0) {
      return [];
    }
    
    const conditions = searchVariations.map(variation => 
      `category.ilike.%${variation}%,name.ilike.%${variation}%,subcategory.ilike.%${variation}%,description.ilike.%${variation}%`
    ).join(',');

    const womenTerms = ['women', 'womens', 'woman', 'female', 'ladies', 'women\'s', 'girl', 'girls'];
    const menTerms = ['men', 'mens', 'man', 'male', 'gentlemen', 'men\'s', 'boy', 'boys'];
    
    // For men search - STRICT FILTERING
    if (menTerms.includes(term) || searchVariations.some(v => menTerms.includes(v))) {
      console.log("Searching for MEN products only with STRICT filtering");
      
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .limit(100); // Get more products for filtering

      if (error) {
        console.error("Error fetching men products:", error);
        return [];
      }
      
      // Use strict men filter
      const filteredData = (data || []).filter(product => {
        return isMenProduct(product);
      });
      
      console.log(`Found ${filteredData.length} men's products after strict filtering`);
      console.log("Sample filtered men products:", filteredData.slice(0, 3).map(p => ({
        name: p.name,
        gender: p.gender,
        category: p.category
      })));
      
      return filteredData.slice(0, 30);
    }
    
    // For women search - STRICT FILTERING
    if (womenTerms.includes(term) || searchVariations.some(v => womenTerms.includes(v))) {
      console.log("Searching for WOMEN products only with STRICT filtering");
      
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .limit(100); // Get more products for filtering

      if (error) {
        console.error("Error fetching women products:", error);
        return [];
      }
      
      // Use strict women filter
      const filteredData = (data || []).filter(product => {
        return isWomenProduct(product);
      });
      
      console.log(`Found ${filteredData.length} women's products after strict filtering`);
      console.log("Sample filtered women products:", filteredData.slice(0, 3).map(p => ({
        name: p.name,
        gender: p.gender,
        category: p.category
      })));
      
      return filteredData.slice(0, 30);
    }
    
    console.log("Non-gender specific search, using general conditions");
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .or(conditions)
      .limit(30);

    if (error) {
      console.error("Error fetching search results:", error);
      return [];
    }
    
    return data || [];
  } catch (e) {
    console.error("Error in fetchIntelligentSearchResults:", e);
    return [];
  }
};

interface HeaderProps {
  activeCategory?: string;
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

/* AccountIcons Component - UPDATED: Show profile on desktop, hide on mobile */
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

const HeaderIconBar = ({ onIconClick, isScrolled = false }: HeaderIconBarProps) => {
  const [icons, setIcons] = useState<IconItem[]>([]);
  const [selectedIconId, setSelectedIconId] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [canScroll, setCanScroll] = useState(false);

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

  useEffect(() => {
    loadIcons();
  }, []);

  // Calculate dimensions and scroll progress when icons change
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
      
      setScrollProgress(progress);
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

  // Scroll handler
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const maxScrollLeft = contentWidth - containerWidth;
      const progress = maxScrollLeft > 0 ? (scrollLeft / maxScrollLeft) * 100 : 0;
      
      setScrollProgress(progress);
      setIsScrolling(true);
      
      // Clear previous timeout
      if ((container as any).scrollTimeout) {
        clearTimeout((container as any).scrollTimeout);
      }
      
      // Set timeout to hide scrolling indicator
      (container as any).scrollTimeout = setTimeout(() => {
        setIsScrolling(false);
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

  if (!icons.length) return null;

  return (
    <div className={`relative bg-[#E9E1D8] transition-all duration-300 ${isScrolled ? 'pt-0' : ''}`}>
      <div className="container mx-auto px-4 pb-4 pt-2">
        <div className="relative">
          {/* Fixed Product Names Row when scrolled */}
          {isScrolled && (
            <div className="fixed top-14 left-0 right-0 z-40 bg-[#E9E1D8] py-2 shadow-sm border-b border-gray-300">
              <div className="container mx-auto px-4">
                <div 
                  ref={containerRef}
                  className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth"
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
          )}

          {/* Normal Icons Row (hidden when scrolled) */}
          {!isScrolled && (
            <>
              <div 
                ref={containerRef}
                className="flex gap-5 overflow-x-auto py-2 no-scrollbar relative scrollbar-hide scroll-smooth"
                style={{
                  WebkitOverflowScrolling: 'touch',
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
                              backgroundColor:
                                icon.badge_color || "#ff3b30",
                            }}
                          >
                            {formatBadgeText(icon.badge_text)}
                          </span>
                        </div>
                      )}

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
              
              {/* White progress bar on light gray track - FIXED */}
              {canScroll && containerWidth > 0 && (
                <div className="mt-1 w-full flex justify-center">
                  <div className="w-1/2 h-[3px] rounded-full bg-gray-300/80 overflow-hidden">
                    <div
                      className={`h-full bg-white/90 transition-all duration-300 ease-out rounded-full
                        ${isScrolling ? "opacity-100" : "opacity-90"}`}
                      style={{ 
                        width: `${Math.max(0, Math.min(100, scrollProgress))}%`,
                        transition: isScrolling ? 'width 0.1s ease-out' : 'width 0.3s ease-out'
                      }}
                    />
                  </div>
                </div>
              )}
            </>
          )}
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
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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

  // Check if mobile on mount
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load recent searches on component mount
  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  /* ================= FLIPKART STYLE SCROLL HANDLER - FIXED ================= */
  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          
          if (window.innerWidth < 1024) { // MOBILE ONLY
            if (currentScrollY > 100) {
              // Scrolled down > 100px - show fixed header
              setIsScrolled(true);
              
              // When scrolling down, hide search suggestions
              if (currentScrollY > lastScrollY && currentScrollY > 200) {
                setShowSuggestions(false);
                setIsSearchOpen(false);
              }
            } else {
              // At top - show normal header
              setIsScrolled(false);
            }
          } else {
            // DESKTOP: Always show everything
            setIsScrolled(false);
          }
          
          setLastScrollY(currentScrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
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

    // Direct category navigation
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
        const term = normalize(searchValue);
        const results = await fetchIntelligentSearchResults(searchValue);

        const womenTerms = ['women', 'womens', 'woman', 'female', 'ladies', 'women\'s', 'girl', 'girls'];
        const menTerms = ['men', 'mens', 'man', 'male', 'gentlemen', 'men\'s', 'boy', 'boys'];
        
        let filteredResults = results;
        
        // Apply strict gender filtering for search suggestions
        if (menTerms.includes(term)) {
          console.log("Applying STRICT men filter for search suggestions");
          filteredResults = results.filter(product => isMenProduct(product));
          console.log(`After strict men filter: ${filteredResults.length} products`);
        } else if (womenTerms.includes(term)) {
          console.log("Applying STRICT women filter for search suggestions");
          filteredResults = results.filter(product => isWomenProduct(product));
          console.log(`After strict women filter: ${filteredResults.length} products`);
        } else {
          const variations = getAllSearchVariations(searchValue);
          filteredResults = results.sort((a, b) =>
            calculateRelevanceScore(b, variations) -
            calculateRelevanceScore(a, variations)
          );
        }

        console.log(`Final filtered results: ${filteredResults.length} products`);
        setSearchResults(filteredResults);
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

  /* ================= FIXED: Hide HeaderIconBar on specific pages ================= */
  const shouldHideHeaderIconBar = () => {
    const currentPath = location.pathname;
    
    // Check for order pages
    if (currentPath.startsWith("/account/orders") || currentPath === "/account/orders") {
      return true;
    }
    
    // Check for product detail pages (both /product/:id and /products/:id formats)
    if (currentPath.startsWith("/product/")) {
      return true;
    }
    
    // Check for product detail pages with /products/:id format
    if (currentPath.startsWith("/products/")) {
      const pathParts = currentPath.split('/');
      // If it's not just "/products" but "/products/something" (product detail)
      if (pathParts.length >= 3 && pathParts[2]) {
        return true;
      }
    }
    
    // Check for checkout flow pages
    const checkoutPaths = ["/cart", "/checkout", "/shipping", "/payment", "/order-confirmation"];
    if (checkoutPaths.some(path => currentPath.startsWith(path))) {
      return true;
    }
    
    // Check for wishlist
    if (currentPath === "/wishlist" || currentPath.startsWith("/wishlist/")) {
      return true;
    }
    
    // Check for admin pages
    if (currentPath.startsWith("/admin")) {
      return true;
    }
    
    // Check for other account pages (profile, settings, etc.)
    if (currentPath.startsWith("/account") && currentPath !== "/account") {
      return true;
    }
    
    return false;
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

  // Render mobile search suggestions
  const renderMobileSearchSuggestions = (fixedPosition = false) => {
    return (
      <div className="w-full bg-white">
        <div className="divide-y divide-gray-100">
          {/* Show Recent + Trending By Default */}
          {searchValue.trim().length === 0 && (
            <>
              {/* Recent Searches Section */}
              {recentSearches.length > 0 && (
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

              {/* Trending Searches Section */}
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

              {/* Recommended Stores Section */}
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

              {/* Popular Categories Section */}
              {popularCategories.length > 0 && (
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
            </>
          )}

          {/* Search Results Section */}
          {searchResults.length > 0 && searchValue.trim().length >= 2 && (
            <div className="p-4 bg-gray-50">
              <p className="text-sm text-gray-600 mb-3 font-semibold">
                Products matching "{searchValue}" ({searchResults.length})
              </p>
              {searchResults.slice(0, 5).map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleProductClick(product.id)}
                  className="flex items-center gap-3 w-full text-left p-3 hover:bg-white rounded-lg transition-colors border border-gray-200 mb-2"
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
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-base font-bold text-gray-900">
                        ₹{product.price}
                      </p>
                      {product.original_price && product.original_price > product.price && (
                        <>
                          <span className="text-sm text-gray-500 line-through">
                            ₹{product.original_price}
                          </span>
                          <span className="text-sm text-green-600 font-medium">
                            {Math.round((1 - product.price / product.original_price) * 100)}% off
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-400 flex-shrink-0" />
                </button>
              ))}
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
    );
  };

  // Render desktop search suggestions
  const renderDesktopSearchSuggestions = () => {
    return (
      <div className="absolute top-11 left-0 w-full bg-white border border-gray-200 rounded-md shadow-lg z-[9999] max-h-96 overflow-y-auto desktop-scroll">
        {isLoadingResults ? (
          <div className="p-4 text-center">
            <p className="text-gray-600">Searching products...</p>
          </div>
        ) : searchResults.length > 0 || searchValue.trim().length >= 2 ? (
          <div className="divide-y divide-gray-100">
            {searchResults.length > 0 && (
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
                      className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 rounded-full transition-colors border border-gray-200"
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="p-3">
              <p className="text-xs text-gray-600 mb-2 font-semibold flex items-center gap-1">
                <TrendingUp size={14} className="text-gray-600" /> Trending Searches
              </p>
              <div className="space-y-1">
                {TRENDING_SEARCHES.map((item) => (
                  <button
                    key={item}
                    onClick={() => {
                      setSearchValue(item);
                      setTimeout(() => handleSearch(item), 100);
                    }}
                    className="block w-full text-left text-sm py-1.5 px-1 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded transition-colors"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3">
            <p className="text-xs text-gray-600 mb-2 font-semi-bold flex items-center gap-1">
              <TrendingUp size={14} className="text-gray-600" /> Start typing to search products
            </p>
            <div className="space-y-1">
              {popularCategories.slice(0, 5).map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryClick(category)}
                  className="block w-full text-left text-sm py-1.5 px-1 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded transition-colors"
                >
                  Browse {category} products
                </button>
              ))}
            </div>
          </div>
        )}
        
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
    );
  };

  return (
    <>
      {/* DESKTOP HEADER - Fixed at top */}
      <div className="hidden lg:block fixed top-0 left-0 right-0 z-50 bg-[#E9E1D8] shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-3">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link to="/" className="flex-shrink-0" onClick={handleLogoClick}>
                {loading ? (
                  <h1 className="text-3xl font-bold text-gray-800">Loading...</h1>
                ) : (
                  <h1 className="text-3xl font-bold whitespace-nowrap">
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

            {/* Desktop Search - Always Fixed */}
            <div ref={searchRef} className="relative flex items-center mx-4 xl:mx-6">
              <div className="flex items-center h-9 w-80 2xl:w-96 rounded-md bg-white/90 backdrop-blur-sm px-4 border border-gray-300">
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
              {showSuggestions && renderDesktopSearchSuggestions()}
            </div>

            {/* Desktop Right Icons - Always Fixed */}
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

          {/* Desktop Navigation - Always Fixed */}
          <div className="flex items-center justify-between py-3">
            <nav className="flex items-center gap-4 xl:gap-6">
              <button
                onClick={() => handleCategoryNavigation("women")}
                className={`nav-link text-base whitespace-nowrap ${navClass("women")}`}
              >
                WOMEN
              </button>

              <button
                onClick={() => handleCategoryNavigation("men")}
                className={`nav-link text-base whitespace-nowrap ${navClass("men")}`}
              >
                MEN
              </button>

              <button
                onClick={() => handleCategoryNavigation("accessories")}
                className={`nav-link text-base whitespace-nowrap ${navClass("accessories")}`}
              >
                ACCESSORIES
              </button>

              <button
                onClick={handleNewArrivalsNavigation}
                className={`nav-link text-base whitespace-nowrap ${navClass(undefined, false)}`}
              >
                NEW ARRIVALS
              </button>

              <button
                onClick={handleSaleNavigation}
                className={`nav-link text-base whitespace-nowrap ${navClass(undefined, true)}`}
              >
                SALE
              </button>
            </nav>

            <div className="flex items-center gap-3">
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
        </div>
      </div>

      {/* DESKTOP SPACER */}
      <div className="hidden lg:block h-28"></div>

      {/* MOBILE HEADER */}
      <div className="lg:hidden">
        {/* Fixed Top Header (shown when scrolled OR search is open) */}
        {(isScrolled || isSearchOpen) && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-[#E9E1D8] shadow-lg border-b border-gray-300">
            <div className="container mx-auto px-3 sm:px-4">
              <div className="flex items-center justify-between py-2">
                {/* Back button - shows arrow when scrolled, X when search is open */}
                {isSearchOpen ? (
                  <button
                    onClick={() => {
                      setIsSearchOpen(false);
                      setShowSuggestions(false);
                      setSearchValue("");
                    }}
                    className="p-1.5 hover:bg-white/30 rounded-md transition-colors flex-shrink-0"
                    aria-label="Close search"
                  >
                    <ArrowLeft size={20} className="text-gray-800" />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (window.scrollY > 100) {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      } else {
                        setIsScrolled(false);
                      }
                    }}
                    className="p-1.5 hover:bg-white/30 rounded-md transition-colors flex-shrink-0"
                    aria-label="Back to top"
                  >
                    <ArrowLeft size={20} className="text-gray-800" />
                  </button>
                )}

                {/* Fixed Search Bar - Always show search button */}
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="flex-1 mx-3"
                >
                  <div className="flex items-center h-10 bg-white rounded-lg px-4 border border-gray-300 shadow-sm">
                    <Search size={18} className="text-gray-500" />
                    <span className="ml-3 text-sm text-gray-600 font-medium truncate">
                      {searchValue || "Search for products, brands and more"}
                    </span>
                  </div>
                </button>

                {/* Wishlist Icon */}
                {!isSearchOpen && (
                  <Link 
                    to="/wishlist" 
                    className="relative p-1.5 hover:bg-white/30 rounded-md transition-colors group flex-shrink-0"
                    aria-label="Wishlist"
                  >
                    <Heart size={20} className="text-gray-800" />
                    {wishlistItems.length > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-orange-400 text-xs rounded-full flex items-center justify-center text-gray-900 font-bold">
                        {wishlistItems.length}
                      </span>
                    )}
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Normal Mobile Header (shown when NOT scrolled AND search NOT open) */}
        {!isScrolled && !isSearchOpen && (
          <div className="bg-[#E9E1D8] shadow-lg">
            {/* TOP ROW: Menu, Logo, Wishlist, Cart */}
            <div className="container mx-auto px-3 sm:px-4 pt-3">
              <div className="flex items-center justify-between py-3">
                {/* MOBILE MENU BUTTON - Left */}
                <button
                  onClick={() => setIsMenuOpen(true)}
                  className="p-1.5 hover:bg-white/30 rounded-md transition-colors relative group flex-shrink-0"
                  aria-label="Open menu"
                >
                  <Menu size={20} className="text-gray-800" />
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    Menu
                  </div>
                </button>

                {/* LOGO - Center */}
                <div className="flex-1 flex justify-center">
                  <Link 
                    to="/" 
                    className="flex-shrink-0"
                    onClick={handleLogoClick}
                  >
                    {loading ? (
                      <h1 className="text-lg sm:text-xl font-bold text-gray-800">Loading...</h1>
                    ) : (
                      <h1 className="text-lg sm:text-xl font-bold whitespace-nowrap">
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

                {/* WISHLIST ICON - Right (before cart) */}
                <Link 
                  to="/wishlist" 
                  className="relative p-1.5 hover:bg-white/30 rounded-md transition-colors group flex-shrink-0 mr-2"
                  aria-label="Wishlist"
                >
                  <Heart size={20} className="text-gray-800" />
                  {wishlistItems.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-orange-400 text-xs rounded-full flex items-center justify-center text-gray-900 font-bold">
                      {wishlistItems.length}
                    </span>
                  )}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    Wishlist
                  </div>
                </Link>

                {/* CART ICON - Right */}
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

            {/* SEARCH BAR - Always visible at top in normal state */}
            <div className="bg-[#E9E1D8] border-b border-gray-300 py-2 px-3">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="w-full flex items-center h-12 bg-white rounded-lg px-4 border border-gray-300 shadow-sm"
              >
                <Search size={20} className="text-gray-500" />
                <span className="ml-3 text-sm text-gray-600 font-medium">
                  Search for products, brands and more
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Full Screen Search Overlay (when search is open) */}
        {isSearchOpen && (
          <div className="fixed inset-0 z-40 bg-white">
            {/* Search Header */}
            <div className="fixed top-0 left-0 right-0 z-50 bg-[#E9E1D8] border-b border-gray-300">
              <div className="container mx-auto px-3 sm:px-4">
                <div className="flex items-center gap-2 py-3">
                  <button
                    onClick={() => {
                      setIsSearchOpen(false);
                      setShowSuggestions(false);
                      setSearchValue("");
                    }}
                    className="p-1.5 hover:bg-white/30 rounded-md transition-colors"
                    aria-label="Close search"
                  >
                    <ArrowLeft size={20} className="text-gray-800" />
                  </button>
                  
                  <div className="flex-1">
                    <div className="flex items-center h-12 bg-white rounded-lg px-4 border border-gray-300 shadow-sm">
                      <Search size={20} className="text-gray-500" />
                      <input
                        type="text"
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        onFocus={() => setShowSuggestions(true)}
                        placeholder="Search for products, brands and more"
                        className="flex-1 h-full px-3 bg-transparent text-gray-900 focus:outline-none text-base placeholder:text-gray-500"
                        autoFocus
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
                  </div>
                </div>
              </div>
            </div>

            {/* Search Content */}
            <div className="pt-16 h-full overflow-y-auto">
              {renderMobileSearchSuggestions(true)}
            </div>
          </div>
        )}
      </div>

      {/* HEADER ICON BAR - Hide on order pages and product detail pages */}
      {!shouldHideHeaderIconBar() && (
        <div className="relative z-30">
          <HeaderIconBar onIconClick={handleHeaderIconClick} isScrolled={isScrolled} />
          {isHomePage && <AutoSlide />}
        </div>
      )}

      {/* Add padding when header is fixed (scrolled state) */}
      {isScrolled && !isSearchOpen && (
        <div className="lg:hidden pt-16"></div>
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