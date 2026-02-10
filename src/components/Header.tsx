import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ShoppingBag,
  Menu,
  X,
  Shield,
  Home,
  User,
  Package,
  Heart,
  ArrowLeft,
} from "lucide-react";

import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useWishlist } from "@/contexts/WishlistContext";

import CartDrawer from "./CartDrawer";
import AccountDrawer from "./AccountDrawer";
import AutoSlide from "./AutoSlide";
import HeaderIconBar from "./HeaderIconBar";
import SearchBar from "./SearchBar";

/* HELPERS */
const normalize = (v?: string) =>
  v?.toString().toLowerCase().trim() || "";

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

interface HeaderProps {
  activeCategory?: string;
}

/* Main Header Component */
const Header = ({ activeCategory }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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

  /* ================= FLIPKART STYLE SCROLL HANDLER ================= */
  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          
          if (window.innerWidth < 1024) {
            if (currentScrollY > 100) {
              setIsScrolled(true);
            } else {
              setIsScrolled(false);
            }
          } else {
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

  /* ================= Hide HeaderIconBar on specific pages ================= */
  const shouldHideHeaderIconBar = () => {
    const currentPath = location.pathname;
    
    if (currentPath.startsWith("/account/orders") || currentPath === "/account/orders") {
      return true;
    }
    
    if (currentPath.startsWith("/product/")) {
      return true;
    }
    
    if (currentPath.startsWith("/products/")) {
      const pathParts = currentPath.split('/');
      if (pathParts.length >= 3 && pathParts[2]) {
        return true;
      }
    }
    
    const checkoutPaths = ["/cart", "/checkout", "/shipping", "/payment", "/order-confirmation"];
    if (checkoutPaths.some(path => currentPath.startsWith(path))) {
      return true;
    }
    
    if (currentPath === "/wishlist" || currentPath.startsWith("/wishlist/")) {
      return true;
    }
    
    if (currentPath.startsWith("/admin")) {
      return true;
    }
    
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

            {/* Desktop Search */}
            <div className="flex-1 max-w-2xl mx-8">
              <SearchBar isDesktop />
            </div>

            {/* Desktop Right Icons */}
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

          {/* Desktop Navigation */}
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
        {/* Fixed Top Header (shown when scrolled) */}
        {isScrolled && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-[#E9E1D8] shadow-lg border-b border-gray-300">
            <div className="container mx-auto px-3 sm:px-4">
              <div className="flex items-center justify-between py-3">
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

                <div className="flex-1 mx-3">
                  <SearchBar isMobile />
                </div>

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
              </div>
            </div>
          </div>
        )}

        {/* Normal Mobile Header (shown when NOT scrolled) */}
        {!isScrolled && (
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

                {/* WISHLIST ICON */}
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
                </Link>

                {/* CART ICON */}
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
                </button>
              </div>
            </div>

            {/* SEARCH BAR - Always visible at top in normal state */}
            <div className="bg-[#E9E1D8] border-b border-gray-300 py-2 px-3">
              <SearchBar isMobile />
            </div>
          </div>
        )}

        {/* Add padding when header is fixed (scrolled state) */}
        {isScrolled && (
          <div className="lg:hidden pt-16"></div>
        )}
      </div>

      {/* HEADER ICON BAR - Hide on order pages and product detail pages */}
      {!shouldHideHeaderIconBar() && (
        <div className="relative z-30">
          <HeaderIconBar onIconClick={handleHeaderIconClick} isScrolled={isScrolled} />
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