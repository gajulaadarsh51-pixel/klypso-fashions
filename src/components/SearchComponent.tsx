// SearchComponent.tsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  X,
  Clock,
  Flame,
  Store,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Reuse the same constants and helpers from Header
const normalize = (v?: string) =>
  v?.toString().toLowerCase().trim() || "";

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

const RECOMMENDED_STORES = [
  "Body and Fashion",
  "Women's Style",
  "Bath Essentials",
  "Home Decor",
  "Electronics Hub",
  "Grocery Store",
];

const RECENT_SEARCHES_KEY = 'recent_searches';

const getRecentSearches = (): string[] => {
  try {
    const searches = localStorage.getItem(RECENT_SEARCHES_KEY);
    return searches ? JSON.parse(searches) : [];
  } catch {
    return [];
  }
};

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

const clearRecentSearches = () => {
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
    return true;
  } catch (error) {
    console.error("Error clearing recent searches:", error);
    return false;
  }
};

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

const getAllSearchVariations = (searchTerm: string): string[] => {
  const normalizedTerm = normalize(searchTerm);
  const allVariations = new Set<string>();
  
  allVariations.add(normalizedTerm);
  
  if (normalizedTerm.endsWith('s')) {
    allVariations.add(normalizedTerm.slice(0, -1));
  } else {
    allVariations.add(normalizedTerm + 's');
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

const isMenProduct = (product: any): boolean => {
  const productGender = normalize(product.gender || '');
  const productCategory = normalize(product.category || '');
  const productName = normalize(product.name || '');
  const productSubcategory = normalize(product.subcategory || '');
  
  const menExactTerms = ['men', 'male', 'gentlemen', 'boy', 'boys'];
  const womenExactTerms = ['women', 'female', 'ladies', 'girl', 'girls'];
  
  const genderIsMen = menExactTerms.some(term => productGender === term);
  const genderIsWomen = womenExactTerms.some(term => productGender === term);
  
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
  
  const menExactTerms = ['men', 'male', 'gentlemen', 'boy', 'boys'];
  const womenExactTerms = ['women', 'female', 'ladies', 'girl', 'girls'];
  
  const genderIsWomen = womenExactTerms.some(term => productGender === term);
  const genderIsMen = menExactTerms.some(term => productGender === term);
  
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
  
  return (
    (genderIsWomen || categoryHasWomen || nameHasWomen || subcategoryHasWomen) &&
    !(genderIsMen || categoryHasMen || nameHasMen || subcategoryHasMen)
  );
};

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
    
    if (menTerms.includes(term) || searchVariations.some(v => menTerms.includes(v))) {
      console.log("Searching for MEN products only with STRICT filtering");
      
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .limit(100);

      if (error) {
        console.error("Error fetching men products:", error);
        return [];
      }
      
      const filteredData = (data || []).filter(product => {
        return isMenProduct(product);
      });
      
      console.log(`Found ${filteredData.length} men's products after strict filtering`);
      
      return filteredData.slice(0, 30);
    }
    
    if (womenTerms.includes(term) || searchVariations.some(v => womenTerms.includes(v))) {
      console.log("Searching for WOMEN products only with STRICT filtering");
      
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .limit(100);

      if (error) {
        console.error("Error fetching women products:", error);
        return [];
      }
      
      const filteredData = (data || []).filter(product => {
        return isWomenProduct(product);
      });
      
      console.log(`Found ${filteredData.length} women's products after strict filtering`);
      
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

interface SearchComponentProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'mobile' | 'desktop';
  initialSearchValue?: string;
}

const SearchComponent = ({ 
  isOpen, 
  onClose, 
  mode, 
  initialSearchValue = "" 
}: SearchComponentProps) => {
  const [searchValue, setSearchValue] = useState(initialSearchValue);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [popularCategories, setPopularCategories] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedSearch = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setRecentSearches(getRecentSearches());
      loadPopularCategories();
    }
  }, [isOpen]);

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
        
        if (menTerms.includes(term)) {
          filteredResults = results.filter(product => isMenProduct(product));
        } else if (womenTerms.includes(term)) {
          filteredResults = results.filter(product => isWomenProduct(product));
        } else {
          const variations = getAllSearchVariations(searchValue);
          filteredResults = results.sort((a, b) =>
            calculateRelevanceScore(b, variations) -
            calculateRelevanceScore(a, variations)
          );
        }

        setSearchResults(filteredResults);
        setIsLoadingResults(false);
        setShowSuggestions(true);
      }, 300);
    } else {
      setSearchResults([]);
      setIsLoadingResults(false);
      if (searchValue.trim().length === 0) {
        setShowSuggestions(true);
      }
    }

    return () => {
      if (debouncedSearch.current) clearTimeout(debouncedSearch.current);
    };
  }, [searchValue]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        if (mode === 'desktop') {
          onClose();
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [mode, onClose]);

  const loadPopularCategories = async () => {
    const categories = await fetchPopularCategories();
    setPopularCategories(categories);
  };

  const handleSearch = (value?: string) => {
    const finalValue = (value ?? searchValue).trim().toLowerCase();

    if (!finalValue) {
      setShowSuggestions(true);
      return;
    }

    saveToRecentSearches(finalValue);
    setRecentSearches(getRecentSearches());

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
    onClose();
  };

  const handleProductClick = (productId: string) => {
    navigate(`/product/${productId}`);
    setShowSuggestions(false);
    setSearchValue("");
    setSearchResults([]);
    onClose();
  };

  const handleCategoryClick = (category: string) => {
    navigate(`/products?category=${encodeURIComponent(category.toLowerCase())}`);
    setShowSuggestions(false);
    setSearchValue("");
    setSearchResults([]);
    onClose();
  };

  const handleClearRecentSearches = () => {
    if (clearRecentSearches()) {
      setRecentSearches([]);
    }
  };

  const renderDesktopSearch = () => {
    return (
      <div ref={searchRef} className="relative">
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
            ref={inputRef}
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

        {showSuggestions && (
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
        )}
      </div>
    );
  };

  const renderMobileSearch = () => {
    return (
      <div className="fixed inset-0 z-40 bg-white">
        {/* Search Header */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-[#E9E1D8] border-b border-gray-300">
          <div className="container mx-auto px-3 sm:px-4">
            <div className="flex items-center gap-2 py-3">
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-white/30 rounded-md transition-colors"
                aria-label="Close search"
              >
                <X size={20} className="text-gray-800" />
              </button>
              
              <div className="flex-1">
                <div className="flex items-center h-12 bg-white rounded-lg px-4 border border-gray-300 shadow-sm">
                  <Search size={20} className="text-gray-500" />
                  <input
                    ref={inputRef}
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
          <div className="w-full bg-white">
            <div className="divide-y divide-gray-100">
              {searchValue.trim().length === 0 && (
                <>
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
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return mode === 'desktop' ? renderDesktopSearch() : renderMobileSearch();
};

export default SearchComponent;