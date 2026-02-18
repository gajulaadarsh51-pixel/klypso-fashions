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
  const [scrollProgress, setScrollProgress] = useState(0); // 0 to 1, where 1 means fully scrolled

  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);

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

  /* ================= SMOOTH SCROLL HANDLER - WITH PROGRESS ================= */
  useEffect(() => {
    const SCROLL_THRESHOLD = 80; // pixels to reach full scroll state
    
    const handleScroll = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      
      rafRef.current = requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        
        // Only for mobile (below lg breakpoint)
        if (window.innerWidth < 1024) {
          // Calculate scroll progress (0 to 1)
          const progress = Math.min(currentScrollY / SCROLL_THRESHOLD, 1);
          setScrollProgress(progress);
          
          // Also maintain the isScrolled state for backward compatibility
          if (currentScrollY > SCROLL_THRESHOLD * 0.8) {
            setIsScrolled(true);
          } else if (currentScrollY < SCROLL_THRESHOLD * 0.3) {
            setIsScrolled(false);
          }
        } else {
          setScrollProgress(0);
          setIsScrolled(false);
        }
        
        setLastScrollY(currentScrollY);
        rafRef.current = null;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
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

  // Calculate opacity and transform styles based on scroll progress
  const getHeaderStyles = () => {
    // For desktop, no changes
    if (window.innerWidth >= 1024) return {};
    
    // Smooth opacity transitions
    const menuOpacity = Math.max(1 - scrollProgress * 1.5, 0); // Menu button fades out
    const iconsOpacity = Math.max(1 - scrollProgress * 1.2, 0); // Icons fade out
    const titleOpacity = Math.max(1 - scrollProgress * 1.5, 0); // Title fades out
    const searchOpacity = Math.max(1 - scrollProgress * 0.5, 0.8); // Search bar slightly fades but stays visible
    
    // Increased transformY from 15 to 25 for more upward movement
    const transformY = scrollProgress * 25; // More upward movement (25px max)
    
    return {
      menuContainer: {
        opacity: menuOpacity,
        transform: `translateY(-${transformY}px)`,
        transition: 'opacity 0.2s ease-out, transform 0.2s ease-out',
        pointerEvents: menuOpacity < 0.1 ? 'none' : 'auto' as const,
      },
      iconsContainer: {
        opacity: iconsOpacity,
        transform: `translateY(-${transformY}px)`,
        transition: 'opacity 0.2s ease-out, transform 0.2s ease-out',
        pointerEvents: iconsOpacity < 0.1 ? 'none' : 'auto' as const,
      },
      titleContainer: {
        opacity: titleOpacity,
        transform: `translateY(-${transformY}px)`,
        transition: 'opacity 0.2s ease-out, transform 0.2s ease-out',
        pointerEvents: titleOpacity < 0.1 ? 'none' : 'auto' as const,
      },
      searchContainer: {
        opacity: searchOpacity,
        transform: `translateY(-${transformY}px)`,
        transition: 'opacity 0.2s ease-out, transform 0.2s ease-out',
      },
    };
  };

  const headerStyles = getHeaderStyles();

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
                  <h1 
                    key={`desktop-logo-${settings.first_name_color}-${settings.second_name_color}`} 
                    className="text-3xl font-bold whitespace-nowrap"
                  >
                    <span style={{ color: settings.first_name_color }}>
                      {nameParts.firstPart}
                    </span>
                    <span style={{ color: settings.second_name_color }}>
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
      <div className="lg:hidden" ref={headerRef}>
        {/* Fixed Mobile Header */}
        <div 
          className={`fixed top-0 left-0 right-0 z-50 bg-[#E9E1D8] shadow-lg transition-all duration-300 ${
            isScrolled ? 'border-b border-gray-300' : ''
          }`}
        >
          {/* Always visible section - Menu button and Search */}
          <div className="container mx-auto px-3 sm:px-4">
            {/* Top Row: Menu, Logo, Icons */}
            <div className="flex items-center justify-between py-2">
              {/* Menu Button - Fades out on scroll */}
              <div 
                style={headerStyles.menuContainer}
              >
                <button
                  onClick={() => setIsMenuOpen(true)}
                  className="p-1.5 hover:bg-white/30 rounded-md transition-colors flex-shrink-0"
                  aria-label="Open menu"
                >
                  <Menu size={20} className="text-gray-800" />
                </button>
              </div>

              {/* Logo - Fades out smoothly on scroll */}
              <div 
                className="flex-1 flex justify-center min-w-0 px-2"
                style={headerStyles.titleContainer}
              >
                <Link 
                  to="/" 
                  className="flex-shrink-0"
                  onClick={handleLogoClick}
                >
                  {loading ? (
                    <h1 className="text-lg sm:text-xl font-bold text-gray-800 truncate">Loading...</h1>
                  ) : (
                    <h1 
                      key={`mobile-logo-${settings.first_name_color}-${settings.second_name_color}`} 
                      className="text-lg sm:text-xl font-bold whitespace-nowrap"
                    >
                      <span style={{ color: settings.first_name_color }}>
                        {nameParts.firstPart}
                      </span>
                      <span style={{ color: settings.second_name_color }}>
                        {nameParts.secondPart}
                      </span>
                    </h1>
                  )}
                </Link>
              </div>

              {/* Right Icons - Fade out on scroll */}
              <div 
                className="flex items-center gap-1 sm:gap-2 flex-shrink-0"
                style={headerStyles.iconsContainer}
              >
                <Link 
                  to="/wishlist" 
                  className="relative p-1.5 hover:bg-white/30 rounded-md transition-colors group"
                  aria-label="Wishlist"
                >
                  <Heart size={20} className="text-gray-800" />
                  {wishlistItems.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-orange-400 text-xs rounded-full flex items-center justify-center text-gray-900 font-bold">
                      {wishlistItems.length}
                    </span>
                  )}
                </Link>

                <button
                  onClick={() => setIsCartOpen(true)}
                  className="relative p-1.5 hover:bg-white/30 rounded-md transition-colors group"
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

            {/* Search Bar - Always visible with upward movement */}
            <div 
              className="pb-2"
              style={headerStyles.searchContainer}
            >
              <SearchBar isMobile />
            </div>
          </div>
        </div>

        {/* Dynamic Spacer - Smooth shrinking with more reduction */}
        <div
          className="transition-all duration-300"
          style={{
            height: `${105 - scrollProgress * 70}px`
          }}
        ></div>
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