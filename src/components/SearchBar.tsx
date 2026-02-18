import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  ChevronRight,
  Clock,
  Flame,
  X,
  ArrowLeft,
  Sparkles,
  Camera,
  Image as ImageIcon,
  Tag,
  ShoppingBag,
  Grid,
  Heart,
  Zap,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';

// HELPERS
const normalize = (v?: string) =>
  v?.toString().toLowerCase().trim() || "";

// Trending searches - FASHION ONLY
const TRENDING_SEARCHES = [
  "Men's Running Shoes",
  "Women's Summer Dresses",
  "Men's T-Shirts",
  "Women's Kurtas",
  "Men's Jeans",
  "Women's Sarees",
  "Men's Formal Shirts",
  "Women's Handbags",
  "Men's Watches",
  "Women's Jewelry",
];

// Popular categories - FASHION ONLY
const POPULAR_CATEGORIES = [
  { name: "Men", icon: "👔", color: "bg-blue-100" },
  { name: "Women", icon: "👗", color: "bg-pink-100" },
  { name: "Footwear", icon: "👟", color: "bg-green-100" },
  { name: "Accessories", icon: "⌚", color: "bg-purple-100" },
  { name: "Traditional", icon: "🥻", color: "bg-yellow-100" },
  { name: "Sports ", icon: "⚽", color: "bg-orange-100" },
];

// Recommended categories - FASHION ONLY
const RECOMMENDED_CATEGORIES = [
  "Today's Deals",
  "Best Sellers",
  "New Arrivals",
  "Men's Collection",
  "Women's Collection",
  "Kids Fashion",
  "Winter Wear",
  "Summer Collection",
  "Festive Special",
  "Wedding Collection",
];

// Fashion sub-categories for women - UPDATED WITH COMPREHENSIVE LIST
const WOMENS_CATEGORIES = [
  "Sarees",
  "Lehengas",
  "Kurtis",
  "Dresses",
  "Leggings",
  "Night Dresses",
  "Blouses",
  "Petticoats",
  "Palazzos",
  "Corsets",
  "Bodysuits",
  "Rompers",
  "Hijabs",
];

// Fashion sub-categories for men
const MENS_CATEGORIES = [
  "T-Shirts",
  "Formal Shirts",
  "Jeans",
  "Trousers",
  "Jackets",
  "Winter Wear",
  "Watches",
  "Footwear",
  "Accessories",
  "Grooming",
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

// Fixed gender detection function
const isMenProduct = (product: any): boolean => {
  if (!product) return false;
  
  const productGender = normalize(product.gender || '');
  const productCategory = normalize(product.category || '');
  const productName = normalize(product.name || '');
  const productSubcategory = normalize(product.subcategory || '');
  
  const menExactTerms = ['men', 'male', 'mens', "men's", 'gentleman', 'gentlemen', 'boy', 'boys'];
  const womenExactTerms = ['women', 'female', 'womens', "women's", 'lady', 'ladies', 'girl', 'girls'];
  
  if (productGender) {
    const isMenGender = menExactTerms.some(term => productGender === term);
    const isWomenGender = womenExactTerms.some(term => productGender === term);
    
    if (isMenGender && !isWomenGender) return true;
    if (isWomenGender) return false;
  }
  
  const hasExplicitMenTerm = menExactTerms.some(term => 
    productName.includes(term) ||
    productCategory.includes(term) ||
    productSubcategory.includes(term)
  );
  
  const hasExplicitWomenTerm = womenExactTerms.some(term => 
    productName.includes(term) ||
    productCategory.includes(term) ||
    productSubcategory.includes(term)
  );
  
  if (hasExplicitWomenTerm) return false;
  
  const isMenClothingPattern = (
    (productCategory.includes('shirt') && !productName.includes('blouse')) ||
    productCategory.includes('t-shirt') ||
    (productCategory.includes('formal') && !productName.includes('women')) ||
    productCategory.includes('suit') ||
    productCategory.includes('blazer') ||
    (productCategory.includes('trouser') && !productName.includes('women')) ||
    (productCategory.includes('pant') && !productName.includes('women')) ||
    (productName.includes('shirt') && productName.includes('men')) ||
    productName.includes('mens shirt') ||
    productName.includes('men shirt') ||
    productName.includes("men's shirt") ||
    (productName.includes('formal shirt') && !productName.includes('women')) ||
    productName.includes('office shirt') ||
    productName.includes('men t-shirt') ||
    productName.includes("men's t-shirt") ||
    productName.includes('mens t-shirt') ||
    productName.includes('men trouser') ||
    productName.includes('men pant') ||
    productName.includes('men jean')
  );
  
  return hasExplicitMenTerm || isMenClothingPattern;
};

const isWomenProduct = (product: any): boolean => {
  if (!product) return false;
  
  const productGender = normalize(product.gender || '');
  const productCategory = normalize(product.category || '');
  const productName = normalize(product.name || '');
  const productSubcategory = normalize(product.subcategory || '');
  
  const womenExactTerms = ['women', 'female', 'womens', "women's", 'lady', 'ladies', 'girl', 'girls'];
  const menExactTerms = ['men', 'male', 'mens', "men's", 'gentleman', 'gentlemen', 'boy', 'boys'];
  
  if (productGender) {
    const isWomenGender = womenExactTerms.some(term => productGender === term);
    const isMenGender = menExactTerms.some(term => productGender === term);
    
    if (isWomenGender && !isMenGender) return true;
    if (isMenGender) return false;
  }
  
  const hasExplicitWomenTerm = womenExactTerms.some(term => 
    productName.includes(term) ||
    productCategory.includes(term) ||
    productSubcategory.includes(term)
  );
  
  const hasExplicitMenTerm = menExactTerms.some(term => 
    productName.includes(term) ||
    productCategory.includes(term) ||
    productSubcategory.includes(term)
  );
  
  if (hasExplicitMenTerm) return false;
  
  const isWomenClothingPattern = (
    productCategory.includes('dress') ||
    productCategory.includes('gown') ||
    productCategory.includes('saree') ||
    productCategory.includes('lehenga') ||
    productCategory.includes('blouse') ||
    productCategory.includes('kurti') ||
    productCategory.includes('kurtas') ||
    (productCategory.includes('top') && !productName.includes('men')) ||
    productCategory.includes('skirt') ||
    productName.includes("women's") ||
    productName.includes('womens') ||
    productName.includes('women dress') ||
    productName.includes('ladies dress') ||
    productName.includes('women top') ||
    productName.includes('ladies top') ||
    productName.includes('women kurti') ||
    productName.includes('women saree') ||
    productName.includes('women blouse') ||
    productCategory.includes('night') ||
    productName.includes('night dress') ||
    productName.includes('nightdress') ||
    productName.includes('nightwear') ||
    productName.includes('night wear') ||
    productCategory.includes('lingerie') ||
    productCategory.includes('innerwear') ||
    productCategory.includes('nightgown') ||
    productCategory.includes('nightie') ||
    productCategory.includes('pajama') ||
    productCategory.includes('pyjama')
  );
  
  return hasExplicitWomenTerm || isWomenClothingPattern;
};

const isAccessoryProduct = (product: any): boolean => {
  if (!product) return false;
  
  const productCategory = normalize(product.category || '');
  const productName = normalize(product.name || '');
  const productSubcategory = normalize(product.subcategory || '');
  
  return (
    productCategory.includes('accessory') ||
    productCategory.includes('watch') ||
    productCategory.includes('jewel') ||
    productCategory.includes('bag') ||
    productCategory.includes('sunglass') ||
    productCategory.includes('belt') ||
    productCategory.includes('wallet') ||
    productName.includes('watch') ||
    productName.includes('belt') ||
    productName.includes('bag') ||
    productName.includes('sunglass') ||
    productName.includes('wallet') ||
    productSubcategory.includes('accessory') ||
    productSubcategory.includes('watch') ||
    productSubcategory.includes('jewel')
  );
};

// Enhanced search keyword mappings
const SEARCH_KEYWORD_MAPPINGS: Record<string, string[]> = {
  "women": ["women", "womens", "woman", "womenswear", "female", "ladies", "girl", "girls", "women's", "woman's"],
  "men": ["men", "mens", "man", "menswear", "male", "gentlemen", "boy", "boys", "men's", "man's"],
  "accessories": ["accessories", "accessory", "jewelry", "jewellery", "watches", "bags", "belts", "sunglasses", "wallet"],
  "shirts": ["shirts", "shirt", "top", "blouse", "tee", "t-shirt", "tshirt", "t shirt", "tops"],
  "dresses": ["dresses", "dress", "gown", "frock", "jumpsuit", "jumpers", "gowns"],
  "pants": ["pants", "trousers", "jeans", "leggings", "shorts", "bottoms", "denim", "trouser"],
  "shoes": ["shoes", "footwear", "sneakers", "boots", "sandals", "heels", "flats", "slippers", "footwear"],
  "jackets": ["jackets", "jacket", "coat", "blazer", "hoodie", "sweater", "sweatshirt", "cardigan"],
  "night": ["night", "nightdress", "nightwear", "nightgown", "nightie", "pajama", "pyjama", "sleepwear", "night dress"],
  "saree": ["saree", "sari", "sarees"],
  "lehenga": ["lehenga", "lehengas"],
  "kurti": ["kurti", "kurtis", "kurta", "kurtas"],
  "new": ["new", "latest", "arrivals", "recent", "fresh", "new arrivals"],
  "sale": ["sale", "discount", "offer", "deal", "clearance", "bargain", "discounted", "offers"],
};

// Function to get all possible variations for a search term
const getAllSearchVariations = (searchTerm: string): string[] => {
  const normalizedTerm = normalize(searchTerm);
  const allVariations = new Set<string>();
  
  allVariations.add(normalizedTerm);
  
  if (normalizedTerm.endsWith('s')) {
    allVariations.add(normalizedTerm.slice(0, -1));
  } else {
    allVariations.add(normalizedTerm + 's');
  }
  
  if (normalizedTerm.includes("men") || normalizedTerm === "man") {
    allVariations.add("men");
    allVariations.add("mens");
    allVariations.add("men's");
    allVariations.add("man");
  }
  
  if (normalizedTerm.includes("women") || normalizedTerm === "woman") {
    allVariations.add("women");
    allVariations.add("womens");
    allVariations.add("women's");
    allVariations.add("woman");
  }
  
  const commonVariations: Record<string, string[]> = {
    'women': ['woman', 'womens', 'women\'s', 'womenswear', 'female'],
    'men': ['man', 'mens', 'men\'s', 'menswear', 'male'],
    'shirts': ['shirt', 'tee', 't-shirt', 'tshirt', 'tops'],
    'jeans': ['jean', 'denim', 'trousers'],
    'shoes': ['shoe', 'footwear', 'sneaker', 'boot'],
    'dresses': ['dress', 'gown', 'frock'],
    'jackets': ['jacket', 'coat', 'blazer'],
    'accessories': ['accessory', 'jewellery', 'jewelry'],
    'night': ['nightdress', 'nightwear', 'nightgown', 'nightie'],
    'saree': ['sari', 'sarees'],
    'lehenga': ['lehengas'],
    'kurti': ['kurtis', 'kurta', 'kurtas'],
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

// Fixed search function with strict gender filtering
const fetchIntelligentSearchResults = async (searchTerm: string) => {
  try {
    const term = normalize(searchTerm);
    
    const womenTerms = ['women', 'woman', 'female', 'ladies', 'girl'];
    const menTerms = ['men', 'man', 'male', 'gentlemen', 'boy'];
    
    let strictGenderFilter = null;
    
    if (menTerms.includes(term) || menTerms.some(t => term === t)) {
      strictGenderFilter = 'men';
    } else if (womenTerms.includes(term) || womenTerms.some(t => term === t)) {
      strictGenderFilter = 'women';
    }
    
    const words = term.split(' ');
    if (words.length > 1) {
      if (words.some(w => menTerms.includes(w))) {
        strictGenderFilter = 'men';
      } else if (words.some(w => womenTerms.includes(w))) {
        strictGenderFilter = 'women';
      }
    }
    
    const searchVariations = getAllSearchVariations(searchTerm);
    
    let data;
    let error;
    
    const { data: allProducts, error: fetchError } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .limit(100);

    data = allProducts;
    error = fetchError;

    if (error) {
      console.error("Error fetching products:", error);
      return [];
    }
    
    if (!data) return [];
    
    let filteredResults = data;
    
    if (strictGenderFilter === 'men') {
      filteredResults = data.filter(product => {
        const isMen = isMenProduct(product);
        const isNotWomen = !isWomenProduct(product);
        return isMen && isNotWomen;
      });
    } else if (strictGenderFilter === 'women') {
      filteredResults = data.filter(product => {
        const isWomen = isWomenProduct(product);
        const isNotMen = !isMenProduct(product);
        return isWomen && isNotMen;
      });
    } else {
      filteredResults = data.filter(product => {
        return searchVariations.some(variation => {
          const productCategory = normalize(product.category || '');
          const productName = normalize(product.name || '');
          const productSubcategory = normalize(product.subcategory || '');
          const productDescription = normalize(product.description || '');
          
          return (
            productCategory.includes(variation) ||
            productName.includes(variation) ||
            productSubcategory.includes(variation) ||
            productDescription.includes(variation)
          );
        });
      });
    }
    
    return filteredResults.slice(0, 30);
  } catch (e) {
    console.error("Error in fetchIntelligentSearchResults:", e);
    return [];
  }
};

// Function to fetch popular products for suggestions
const fetchPopularProducts = async () => {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .limit(12);

    if (error) {
      console.error("Error fetching popular products:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Error in fetchPopularProducts:", error);
    return [];
  }
};

interface SearchBarProps {
  isDesktop?: boolean;
  isMobile?: boolean;
  onSearch?: (value: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  isDesktop = false, 
  isMobile = false,
  onSearch
}) => {
  const [searchValue, setSearchValue] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isImageSearchOpen, setIsImageSearchOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [popularProducts, setPopularProducts] = useState<any[]>([]);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  
  const searchRef = useRef<HTMLDivElement | null>(null);
  const imageSearchRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();
  const debouncedSearch = useRef<NodeJS.Timeout | null>(null);
  
  // Recently viewed hook
  const { addToRecentlyViewed } = useRecentlyViewed();

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      setIsMobileDevice(isMobile);
    };
    checkMobile();
  }, []);

  // Load recent searches and popular products on component mount
  useEffect(() => {
    setRecentSearches(getRecentSearches());
    
    const loadPopularProducts = async () => {
      const products = await fetchPopularProducts();
      const menProducts = products.filter(p => isMenProduct(p)).slice(0, 4);
      const womenProducts = products.filter(p => isWomenProduct(p)).slice(0, 4);
      const accessoryProducts = products.filter(p => isAccessoryProduct(p)).slice(0, 4);
      
      setPopularProducts([...menProducts, ...womenProducts, ...accessoryProducts]);
    };
    
    loadPopularProducts();
  }, []);

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        if (isMobile) {
          setIsSearchOpen(false);
        }
      }
      if (imageSearchRef.current && !imageSearchRef.current.contains(event.target as Node)) {
        setIsImageSearchOpen(false);
        setSelectedImage(null);
        setCameraPermission('prompt');
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobile]);

  // Search fetching
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
      setShowSuggestions(true);
    }

    return () => {
      if (debouncedSearch.current) clearTimeout(debouncedSearch.current);
    };
  }, [searchValue]);

  const handleSearch = (value?: string) => {
    const finalValue = (value ?? searchValue).trim().toLowerCase();

    if (!finalValue) {
      setShowSuggestions(true);
      return;
    }

    saveToRecentSearches(finalValue);
    setRecentSearches(getRecentSearches());

    const womenTerms = ['women', 'womens', 'woman', 'female', 'ladies', 'women\'s', "woman's"];
    const menTerms = ['men', 'mens', 'man', 'male', 'gentlemen', 'men\'s', "man's"];
    const nightTerms = ['night', 'nightdress', 'nightwear', 'nightgown', 'nightie', 'pajama', 'pyjama', 'sleepwear'];
    const sareeTerms = ['saree', 'sari', 'sarees'];
    const lehengaTerms = ['lehenga', 'lehengas'];
    const kurtiTerms = ['kurti', 'kurtis', 'kurta', 'kurtas'];
    
    if (nightTerms.some(term => finalValue.includes(term))) {
      navigate("/products?search=night+dress");
    } 
    else if (sareeTerms.some(term => finalValue.includes(term))) {
      navigate("/products?search=saree");
    }
    else if (lehengaTerms.some(term => finalValue.includes(term))) {
      navigate("/products?search=lehenga");
    }
    else if (kurtiTerms.some(term => finalValue.includes(term))) {
      navigate("/products?search=kurti");
    }
    else if (womenTerms.some(term => finalValue.includes(term))) {
      navigate("/products?category=women");
    } 
    else if (menTerms.some(term => finalValue.includes(term))) {
      navigate("/products?category=men");
    } 
    else if (finalValue.includes("accessory") || finalValue.includes("jewel") || finalValue.includes("watch")) {
      navigate("/products?category=accessories");
    } 
    else if (finalValue.includes("new") || finalValue.includes("arrival")) {
      navigate("/products?new=true");
    }
    else if (finalValue.includes("sale")) {
      navigate("/products?sale=true");
    }
    else {
      navigate(`/products?search=${encodeURIComponent(finalValue)}`);
    }

    setShowSuggestions(false);
    setSearchValue("");
    setIsSearchOpen(false);
    onSearch?.(finalValue);
  };

  const handleProductClick = (productId: string) => {
    // Find the full product object from search results or popular products
    const product = [...searchResults, ...popularProducts].find(p => p.id === productId);
    
    if (product) {
      // Add to recently viewed
      addToRecentlyViewed(product);
    }
    
    navigate(`/product/${productId}`);
    setShowSuggestions(false);
    setSearchValue("");
    setIsSearchOpen(false);
  };

  const handleCategoryClick = (category: string) => {
    const categoryMap: Record<string, string> = {
      "Today's Deals": "deals",
      "Best Sellers": "best-sellers",
      "New Arrivals": "new",
      "Men's Collection": "men",
      "Women's Collection": "women",
      "Kids Fashion": "kids",
      "Winter Wear": "winter",
      "Summer Collection": "summer",
      "Festive Special": "festive",
      "Wedding Collection": "wedding"
    };
    
    const routeCategory = categoryMap[category] || category.toLowerCase();
    
    if (routeCategory === 'deals') {
      navigate("/products?sale=true");
    } else if (routeCategory === 'best-sellers') {
      navigate("/products?popular=true");
    } else if (routeCategory === 'new') {
      navigate("/products?new=true");
    } else {
      navigate(`/products?category=${encodeURIComponent(routeCategory)}`);
    }
    
    setShowSuggestions(false);
    setSearchValue("");
    setIsSearchOpen(false);
  };

  const handleClearRecentSearches = () => {
    if (clearRecentSearches()) {
      setRecentSearches([]);
    }
  };

  const handleTrendingClick = (item: string) => {
    setSearchValue(item);
    setTimeout(() => handleSearch(item), 100);
  };

  // Check camera permission
  const checkCameraPermission = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('Camera API not supported');
        return false;
      }
      
      // Try to get camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      
      // Stop all tracks
      stream.getTracks().forEach(track => track.stop());
      
      setCameraPermission('granted');
      return true;
    } catch (error: any) {
      console.warn('Camera permission denied:', error);
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setCameraPermission('denied');
      } else {
        setCameraPermission('denied');
      }
      return false;
    }
  };

  // Request camera permission for direct camera access
  const handleTakePhoto = async () => {
    const hasPermission = await checkCameraPermission();
    
    if (hasPermission) {
      // Permission granted, open camera input
      cameraInputRef.current?.click();
    } else {
      // Permission denied, show permission denied state
      setCameraPermission('denied');
    }
  };

  const handleChooseFromGallery = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setIsUploading(false);
        
        setTimeout(() => {
          navigate("/products?search=shoes");
          setIsImageSearchOpen(false);
          setSelectedImage(null);
          setCameraPermission('prompt');
        }, 1000);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setIsUploading(false);
        
        setTimeout(() => {
          navigate("/products?search=shoes");
          setIsImageSearchOpen(false);
          setSelectedImage(null);
          setCameraPermission('prompt');
        }, 1000);
      };
      reader.readAsDataURL(file);
    }
  };

  const closeImageSearch = () => {
    setIsImageSearchOpen(false);
    setSelectedImage(null);
    setCameraPermission('prompt');
    
    // Reset file inputs
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  };

  const openCameraSettings = () => {
    if (isMobileDevice) {
      // For mobile devices, we can't programmatically open settings
      // Show instructions instead
      alert('To enable camera access:\n\n1. Open your device Settings\n2. Find Browser/App settings\n3. Enable Camera permission');
    } else {
      // For desktop browsers
      if (navigator.userAgent.includes('Chrome')) {
        window.open('chrome://settings/content/camera');
      } else if (navigator.userAgent.includes('Firefox')) {
        window.open('about:preferences#privacy');
      } else if (navigator.userAgent.includes('Safari')) {
        alert('To enable camera in Safari:\n\n1. Open Safari Preferences\n2. Go to Websites tab\n3. Find Camera settings');
      } else {
        alert('Please check your browser settings to enable camera access.');
      }
    }
  };

  // Render camera permission section
  const renderCameraPermissionSection = () => {
    if (cameraPermission === 'denied') {
      return (
        <div className="p-4 text-center bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-red-700 mb-2">
            Camera Access Denied
          </h3>
          <p className="text-gray-600 mb-4">
            We need camera access to take photos. Please enable camera permission in your browser settings.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={openCameraSettings}
              className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Open Settings
            </button>
            <button
              onClick={() => {
                setCameraPermission('prompt');
                fileInputRef.current?.click();
              }}
              className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Choose from Gallery Instead
            </button>
          </div>
        </div>
      );
    }

    if (cameraPermission === 'granted') {
      return (
        <div className="p-4 text-center bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-green-700 mb-2">
            Camera Access Granted
          </h3>
          <p className="text-gray-600 mb-4">
            Camera is ready to use. Click "Take a Photo" to use your camera.
          </p>
        </div>
      );
    }

    return null;
  };

  // Render image search modal (with proper camera permission handling)
  const renderImageSearchModal = () => {
    if (!isImageSearchOpen) return null;

    return (
      <div className="fixed inset-0 z-[10000] bg-black/50 flex items-center justify-center p-4">
        <div ref={imageSearchRef} className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
            <h2 className="font-heading text-xl font-semibold">
              Search by Image
            </h2>
            <button
              onClick={closeImageSearch}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">
                Upload an image to search for similar products
              </h3>
              <p className="text-gray-600 mb-6">
                Take a photo or choose from your gallery
              </p>
              
              {/* Camera Permission Status */}
              {renderCameraPermissionSection()}
              
              {!selectedImage ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <button
                      onClick={handleTakePhoto}
                      disabled={isUploading}
                      className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                        <Camera size={28} className="text-blue-600" />
                      </div>
                      <span className="font-semibold text-gray-800">Take a photo</span>
                      <span className="text-xs text-gray-500 mt-1">
                        {isMobileDevice ? 'Uses device camera' : 'Uses webcam'}
                      </span>
                    </button>
                    
                    <button
                      onClick={handleChooseFromGallery}
                      disabled={isUploading}
                      className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                        <ImageIcon size={28} className="text-blue-600" />
                      </div>
                      <span className="font-semibold text-gray-800">Choose from gallery</span>
                      <span className="text-xs text-gray-500 mt-1">
                        Upload existing photo
                      </span>
                    </button>
                  </div>

                  {/* Hidden file inputs */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*"
                    className="hidden"
                  />
                  <input
                    type="file"
                    ref={cameraInputRef}
                    onChange={handleCameraCapture}
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                  />
                </>
              ) : (
                /* Image Preview */
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Searching similar products...
                  </h3>
                  <div className="relative mx-auto w-64 h-64 mb-6">
                    <img
                      src={selectedImage}
                      alt="Selected"
                      className="w-full h-full object-cover rounded-lg border"
                    />
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mb-2"></div>
                          <div className="text-white">Processing image...</div>
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Finding similar fashion items for you...
                  </p>
                </div>
              )}

              {/* Cancel Button */}
              <button
                onClick={closeImageSearch}
                className="w-full py-3 mt-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render search suggestions - FASHION FOCUSED
  const renderSearchSuggestions = () => {
    return (
      <div className={`${isMobile ? 'fixed inset-x-0 top-16 bottom-0' : 'absolute top-12 left-0 right-0'} bg-white border border-gray-200 rounded-lg shadow-2xl z-[9999] overflow-y-auto ${isMobile ? 'h-[calc(100vh-4rem)]' : 'max-h-[80vh]'}`}>
        <div className="divide-y divide-gray-100">
          {/* Search Header */}
          {searchValue.trim().length === 0 && (
            <div className="p-4" style={{ backgroundColor: '#E9E1D8' }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Sparkles size={18} className="text-blue-600" />
                  Quick Fashion Categories
                </h3>
                <span className="text-xs bg-white px-2 py-1 rounded-full text-blue-600 font-medium">Explore</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {POPULAR_CATEGORIES.map((category, index) => (
                  <button
                    key={index}
                    onClick={() => handleCategoryClick(category.name)}
                    className={`flex flex-col items-center justify-center p-3 ${category.color} rounded-lg hover:shadow-md transition-all duration-200`}
                  >
                    <span className="text-2xl mb-1">{category.icon}</span>
                    <span className="text-xs font-medium text-gray-700 text-center">{category.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recent Searches Section */}
          {recentSearches.length > 0 && searchValue.trim().length === 0 && (
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <Clock size={16} className="text-gray-600" />
                  Recent Searches
                </p>
                <button
                  onClick={handleClearRecentSearches}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline"
                >
                  Clear All
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleTrendingClick(search)}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors group border border-gray-100"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <Clock size={12} className="text-gray-500" />
                      </div>
                      <span className="text-sm text-gray-700 truncate">{search}</span>
                    </div>
                    {/* Changed from button to div with button-like styling */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        const newRecent = recentSearches.filter((_, i) => i !== index);
                        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(newRecent));
                        setRecentSearches(newRecent);
                      }}
                      className="p-1 hover:bg-gray-200 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                      role="button"
                      tabIndex={0}
                      aria-label="Remove from recent searches"
                    >
                      <X size={12} className="text-gray-400" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Trending Searches Section */}
          {searchValue.trim().length === 0 && (
            <div className="p-4">
              <p className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Flame size={16} className="text-orange-500" />
                Trending Fashion Searches
              </p>
              <div className="flex flex-wrap gap-2">
                {TRENDING_SEARCHES.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleTrendingClick(item)}
                    className="px-3 py-1.5 text-xs bg-gradient-to-r from-orange-50 to-red-50 hover:from-orange-100 hover:to-red-100 text-gray-700 hover:text-gray-900 rounded-full transition-all duration-200 border border-orange-100 hover:border-orange-200 hover:shadow-sm"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Women's Fashion Section - UPDATED */}
          {searchValue.trim().length === 0 && (
            <div className="p-4" style={{ backgroundColor: '#E9E1D8' }}>
              <p className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-pink-500">👗</span>
                Women's Fashion
              </p>
              <div className="grid grid-cols-2 gap-2">
                {WOMENS_CATEGORIES.map((category, index) => (
                  <button
                    key={index}
                    onClick={() => navigate(`/products?search=${encodeURIComponent(category.toLowerCase())}`)}
                    className="flex items-center justify-between p-2 hover:bg-pink-50 rounded-lg transition-colors group border border-pink-100 hover:border-pink-200"
                  >
                    <span className="text-sm text-gray-700">{category}</span>
                    <ChevronRight size={14} className="text-gray-400 group-hover:text-pink-500" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Men's Fashion Section */}
          {searchValue.trim().length === 0 && (
            <div className="p-4" style={{ backgroundColor: '#E9E1D8' }}>
              <p className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-blue-500">👔</span>
                Men's Fashion
              </p>
              <div className="grid grid-cols-2 gap-2">
                {MENS_CATEGORIES.map((category, index) => (
                  <button
                    key={index}
                    onClick={() => navigate(`/products?category=${encodeURIComponent(category.toLowerCase().replace(' & ', '-').replace(' ', '-'))}`)}
                    className="flex items-center justify-between p-2 hover:bg-blue-50 rounded-lg transition-colors group border border-blue-100 hover:border-blue-200"
                  >
                    <span className="text-sm text-gray-700">{category}</span>
                    <ChevronRight size={14} className="text-gray-400 group-hover:text-blue-500" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Categories Section */}
          {searchValue.trim().length === 0 && (
            <div className="p-4">
              <p className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Grid size={16} className="text-blue-500" />
                Recommended Categories
              </p>
              <div className="grid grid-cols-2 gap-2">
                {RECOMMENDED_CATEGORIES.map((category, index) => (
                  <button
                    key={index}
                    onClick={() => handleCategoryClick(category)}
                    className="flex items-center justify-between p-2 hover:bg-blue-50 rounded-lg transition-colors group border border-gray-100 hover:border-blue-200"
                  >
                    <span className="text-sm text-gray-700">{category}</span>
                    <ChevronRight size={14} className="text-gray-400 group-hover:text-blue-500" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Featured Products Section - SIMPLIFIED WITH RECENTLY VIEWED TRACKING */}
          {searchValue.trim().length === 0 && popularProducts.length > 0 && (
            <div className="p-4" style={{ backgroundColor: '#E9E1D8' }}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <Zap size={16} className="text-yellow-500" />
                  Featured Fashion Products
                </p>
                <button
                  onClick={() => navigate("/products?popular=true")}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline"
                >
                  View All
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {popularProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => {
                      addToRecentlyViewed(product);
                      handleProductClick(product.id);
                    }}
                    className="flex flex-col items-start p-3 hover:shadow-lg rounded-xl transition-all duration-300 border border-gray-200 hover:border-blue-300 bg-white hover:-translate-y-1"
                  >
                    <div className="relative w-full h-28 mb-2 rounded-lg overflow-hidden border border-gray-200">
                      <img 
                        src={product.images?.[0] || '/placeholder.svg'} 
                        alt={product.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                      {product.is_new && (
                        <span className="absolute top-1 left-1 bg-green-500 text-white text-xs px-2 py-0.5 rounded">NEW</span>
                      )}
                      {product.is_on_sale && (
                        <span className="absolute top-1 right-1 bg-red-500 text-white text-xs px-2 py-0.5 rounded">SALE</span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-gray-900 truncate w-full text-left mb-1">
                      {product.name}
                    </p>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-baseline gap-1">
                        <p className="text-sm font-bold text-gray-900">
                          ₹{product.price}
                        </p>
                        {product.original_price && product.original_price > product.price && (
                          <>
                            <span className="text-xs text-gray-500 line-through">
                              ₹{product.original_price}
                            </span>
                            <span className="text-xs text-green-600 font-medium bg-green-50 px-1 py-0.5 rounded">
                              {Math.round((1 - product.price / product.original_price) * 100)}% off
                            </span>
                          </>
                        )}
                      </div>
                      {/* Changed from button to div with button-like styling */}
                      <div 
                        className="p-1 hover:bg-blue-100 rounded-full cursor-pointer transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Add to wishlist functionality here
                        }}
                        role="button"
                        tabIndex={0}
                        aria-label="Add to wishlist"
                      >
                        <Heart size={14} className="text-gray-400 hover:text-red-500" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Results Section */}
          {searchResults.length > 0 && searchValue.trim().length >= 2 && (
            <div className="p-4" style={{ backgroundColor: '#E9E1D8' }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-800">
                  <Search size={14} className="inline mr-2" />
                  Results for "{searchValue}" ({searchResults.length})
                </p>
                <span className="text-xs bg-white px-2 py-1 rounded-full text-blue-600 font-medium border border-blue-200">
                  Best Match
                </span>
              </div>
              <div className="space-y-2">
                {searchResults.slice(0, 5).map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleProductClick(product.id)}
                    className="flex items-center gap-3 w-full text-left p-3 hover:shadow-md rounded-xl transition-all duration-200 border border-gray-200 hover:border-blue-300 bg-white"
                  >
                    <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border border-gray-200">
                      <img 
                        src={product.images?.[0] || '/placeholder.svg'} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                      {product.is_on_sale && (
                        <span className="absolute top-0 right-0 bg-red-500 text-white text-xs px-1 py-0.5 rounded-bl">Sale</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {product.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                          {product.category}
                        </span>
                        {product.gender && (
                          <span className="text-xs px-2 py-0.5 bg-pink-100 text-pink-700 rounded-full capitalize">
                            {product.gender}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <p className="text-base font-bold text-gray-900">
                          ₹{product.price}
                        </p>
                        {product.original_price && product.original_price > product.price && (
                          <>
                            <span className="text-sm text-gray-500 line-through">
                              ₹{product.original_price}
                            </span>
                            <span className="text-xs text-green-600 font-medium bg-green-50 px-1.5 py-0.5 rounded">
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
            </div>
          )}

          {/* No Results */}
          {searchResults.length === 0 && searchValue.trim().length >= 2 && !isLoadingResults && (
            <div className="p-8 text-center" style={{ backgroundColor: '#E9E1D8' }}>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <Search size={24} className="text-gray-400" />
              </div>
              <p className="text-gray-600 mb-2 font-medium">No products found for "{searchValue}"</p>
              <p className="text-sm text-gray-500 mb-4">Try searching with different keywords</p>
              <div className="flex flex-wrap gap-2 justify-center">
                <button onClick={() => setSearchValue("shoes")} className="px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">
                  Try "shoes"
                </button>
                <button onClick={() => setSearchValue("dresses")} className="px-4 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors">
                  Try "dresses"
                </button>
                <button onClick={() => setSearchValue("jeans")} className="px-4 py-2 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors">
                  Try "jeans"
                </button>
              </div>
            </div>
          )}

          {/* Loading */}
          {isLoadingResults && (
            <div className="p-8 text-center" style={{ backgroundColor: '#E9E1D8' }}>
              <div className="inline-flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce" />
                <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce delay-100" />
                <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce delay-200" />
              </div>
              <p className="text-gray-600 mt-4">Searching products...</p>
            </div>
          )}

          {/* Search All Button */}
          {searchValue.trim().length >= 2 && searchResults.length > 0 && (
            <div className="p-4 border-t border-gray-200" style={{ backgroundColor: '#E9E1D8' }}>
              <button
                onClick={() => handleSearch()}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
              >
                <Search size={16} />
                View All {searchResults.length} Results for "{searchValue}"
                <ChevronRight size={16} />
              </button>
              <p className="text-xs text-gray-600 text-center mt-2">
                <Tag size={10} className="inline mr-1" />
                Free shipping available on orders above ₹499
              </p>
            </div>
          )}

          {/* Footer Section - REMOVED CAMERA ICON */}
          {searchValue.trim().length === 0 && (
            <div className="p-4" style={{ backgroundColor: '#E9E1D8' }}>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <ShoppingBag size={12} />
                    Free Delivery
                  </span>
                  <span className="flex items-center gap-1">
                    <Tag size={12} />
                    Best Price
                  </span>
                  <span className="flex items-center gap-1">
                    <Sparkles size={12} />
                    Quality Assured
                  </span>
                </div>
                {/* Camera icon button completely removed */}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Desktop Search Bar
  if (isDesktop) {
    return (
      <>
        <div className="flex items-center gap-2">
          <div ref={searchRef} className="relative flex-1 max-w-2xl">
            <div className="flex items-center h-12 w-full rounded-full bg-white px-6 border-2 border-transparent hover:border-blue-300 shadow-lg transition-all duration-300">
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
                onChange={(e) => {
                  setSearchValue(e.target.value);
                  if (e.target.value.trim().length > 0) {
                    setShowSuggestions(true);
                  }
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Search for fashion, clothing, accessories and more..."
                className="flex-1 h-full px-4 bg-transparent text-sm focus:outline-none placeholder:text-gray-500 text-gray-900 font-medium"
                aria-label="Search products"
              />
              
              {searchValue && (
                <button
                  onClick={() => setSearchValue("")}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Clear search"
                >
                  <X size={18} className="text-gray-500" />
                </button>
              )}
              
              <div className="h-6 w-px bg-gray-300 mx-2" />
              
              <button
                onClick={() => setIsImageSearchOpen(true)}
                className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 text-xs font-medium shadow-md hover:shadow-lg"
              >
                <Camera size={14} />
                Image
              </button>
            </div>

            {/* DESKTOP SEARCH SUGGESTIONS */}
            {showSuggestions && renderSearchSuggestions()}
          </div>
        </div>
        
        {/* Image Search Modal */}
        {renderImageSearchModal()}
      </>
    );
  }

  // Mobile Search Bar - FLEXIBLE LAYOUT
  if (isMobile) {
    if (isSearchOpen) {
      return (
        <div className="fixed inset-0 z-40 bg-white" ref={searchRef}>
          {/* Search Header */}
          <div className="fixed top-0 left-0 right-0 z-50" style={{ backgroundColor: '#E9E1D8' }}>
            <div className="w-full px-2 sm:px-3">
              <div className="flex items-center gap-2 py-3 w-full">
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
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center h-10 sm:h-12 bg-white rounded-full px-2 sm:px-3 border-2 border-blue-400 shadow-lg w-full">
                    <Search size={18} className="text-blue-600 flex-shrink-0" />
                    <input
                      type="text"
                      value={searchValue}
                      onChange={(e) => {
                        setSearchValue(e.target.value);
                        if (e.target.value.trim().length > 0) {
                          setShowSuggestions(true);
                        }
                      }}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      onFocus={() => setShowSuggestions(true)}
                      placeholder="Search for fashion, clothing..."
                      className="flex-1 h-full px-2 sm:px-3 bg-transparent text-gray-900 focus:outline-none text-sm placeholder:text-gray-500 min-w-0 truncate"
                      autoFocus
                    />
                    {searchValue && (
                      <button
                        onClick={() => setSearchValue("")}
                        className="p-1 hover:bg-gray-100 rounded-full flex-shrink-0"
                        aria-label="Clear search"
                      >
                        <X size={16} className="text-gray-500" />
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Image Search Button for Mobile - Always visible */}
                <button
                  onClick={() => {
                    setIsSearchOpen(false);
                    setIsImageSearchOpen(true);
                  }}
                  className="p-2 hover:bg-white/30 rounded-md transition-colors flex-shrink-0"
                >
                  <Camera size={20} className="text-gray-800" />
                </button>
              </div>
            </div>
          </div>

          {/* Search Suggestions */}
          <div className="pt-14 sm:pt-16">
            {showSuggestions && renderSearchSuggestions()}
          </div>
        </div>
      );
    } else {
      return (
        <>
          <div className="w-full flex items-center gap-2 px-1">
            {/* Main search container - Takes available space */}
            <div className="flex-1 min-w-0">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="w-full flex items-center h-10 sm:h-12 bg-white rounded-full px-3 sm:px-4 border border-gray-300 shadow-sm hover:shadow-md transition-shadow"
              >
                <Search size={18} className="text-gray-500 flex-shrink-0" />
                <span className="ml-2 text-sm text-gray-600 font-medium truncate">
                  Search for fashion, clothing...
                </span>
              </button>
            </div>
            
            {/* Image Search Button for Mobile - Always visible with proper sizing */}
            <button
              onClick={() => setIsImageSearchOpen(true)}
              className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 flex items-center justify-center bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg"
              aria-label="Search by image"
            >
              <Camera size={18} className="sm:size-5" />
            </button>
          </div>
          
          {/* Image Search Modal for Mobile */}
          {renderImageSearchModal()}
        </>
      );
    }
  }

  return null;
};

export default SearchBar;