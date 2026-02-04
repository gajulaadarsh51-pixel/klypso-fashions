import { Home, ShoppingCart, Package, User } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";

type Tab = "home" | "cart" | "orders" | "profile";

const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { items, setIsCartOpen, isCartOpen } = useCart();
  const {
    user,
    isAuthenticated,
    setIsAuthModalOpen,
    setAuthMode,
    setIsAccountDrawerOpen,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [hoveredTab, setHoveredTab] = useState<Tab | null>(null);
  const [isHovering, setIsHovering] = useState(false);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // 🚫 Hide bottom nav on admin pages
  if (location.pathname.startsWith("/admin")) return null;

  const openLogin = () => {
    setAuthMode("login");
    setIsAuthModalOpen(true);
  };

  // 🔁 Sync active tab with route + drawers
  useEffect(() => {
    if (isCartOpen) {
      setActiveTab("cart");
      return;
    }

    if (location.pathname === "/") {
      setActiveTab("home");
    } else if (location.pathname.startsWith("/account/orders")) {
      setActiveTab("orders");
    } else if (location.pathname.startsWith("/account")) {
      setActiveTab("profile");
    }
  }, [location.pathname, isCartOpen]);

  // Get icon animation class
  const getIconAnimation = (tab: Tab) => {
    if (activeTab === tab) {
      return "animate-bounce-once";
    }
    if (hoveredTab === tab && isHovering) {
      return "animate-pulse";
    }
    return "";
  };

  // Get text animation class
  const getTextAnimation = (tab: Tab) => {
    if (activeTab === tab) {
      return "animate-text-pop";
    }
    if (hoveredTab === tab && isHovering) {
      return "animate-text-pop";
    }
    return "";
  };

  // Handle tab hover with proper state management
  const handleTabHover = (tab: Tab) => {
    setHoveredTab(tab);
    setIsHovering(true);
  };

  // Clear all hover states
  const clearHoverStates = () => {
    setIsHovering(false);
    setHoveredTab(null);
  };

  // Handle nav container mouse leave
  const handleNavMouseLeave = () => {
    clearHoverStates();
  };

  // Handle individual tab mouse leave
  const handleTabMouseLeave = () => {
    // Only clear if no other tab is being hovered
    if (!isHovering) {
      clearHoverStates();
    }
  };

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-sky-200 shadow-lg md:hidden"
      onMouseLeave={handleNavMouseLeave}
    >
      <div className="flex items-center justify-around h-16">
        {/* HOME */}
        <NavLink
          to="/"
          onClick={() => {
            setIsCartOpen(false);
            setIsAccountDrawerOpen(false);
            setActiveTab("home");
            clearHoverStates();
          }}
          onMouseEnter={() => handleTabHover("home")}
          onMouseLeave={handleTabMouseLeave}
          className={({ isActive }) => 
            `flex flex-col items-center justify-center gap-1 text-xs transition-all duration-300 group ${
              isActive || activeTab === "home"
                ? "text-sky-600 font-semibold"
                : "text-gray-600 hover:text-sky-500"
            }`
          }
        >
          <div className="relative p-2 rounded-lg group-hover:bg-sky-50/80 transition-all duration-300">
            <Home 
              size={20} 
              className={`transition-all duration-300 ${getIconAnimation("home")} ${
                activeTab === "home" ? "scale-110" : ""
              } ${hoveredTab === "home" && isHovering && activeTab !== "home" ? "scale-105" : ""}`} 
            />
            {/* Active indicator - Emoji style dot */}
            {(activeTab === "home" || location.pathname === "/") && (
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                <div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-ping-slow"></div>
                <div className="w-2 h-2 bg-sky-500 rounded-full mt-0.5"></div>
              </div>
            )}
          </div>
          <span className={`transition-all duration-300 ${getTextAnimation("home")} ${
            hoveredTab === "home" && isHovering && activeTab !== "home" ? "font-medium" : ""
          }`}>
            Home
          </span>
        </NavLink>

        {/* CART — DRAWER */}
        <button
          onClick={() => {
            setIsAccountDrawerOpen(false);
            setIsCartOpen(true);
            setActiveTab("cart");
            clearHoverStates();
          }}
          onMouseEnter={() => handleTabHover("cart")}
          onMouseLeave={handleTabMouseLeave}
          className={`flex flex-col items-center justify-center gap-1 text-xs transition-all duration-300 group ${
            activeTab === "cart"
              ? "text-sky-600 font-semibold"
              : "text-gray-600 hover:text-sky-500"
          }`}
        >
          <div className="relative p-2 rounded-lg group-hover:bg-sky-50/80 transition-all duration-300">
            <ShoppingCart 
              size={20} 
              className={`transition-all duration-300 ${getIconAnimation("cart")} ${
                activeTab === "cart" ? "scale-110" : ""
              } ${hoveredTab === "cart" && isHovering && activeTab !== "cart" ? "scale-105" : ""}`} 
            />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-orange-400 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold shadow-sm animate-pulse-slow">
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            )}
            {/* Active indicator - Emoji style dot */}
            {activeTab === "cart" && (
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                <div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-ping-slow"></div>
                <div className="w-2 h-2 bg-sky-500 rounded-full mt-0.5"></div>
              </div>
            )}
          </div>
          <span className={`transition-all duration-300 ${getTextAnimation("cart")} ${
            hoveredTab === "cart" && isHovering && activeTab !== "cart" ? "font-medium" : ""
          }`}>
            Cart
          </span>
        </button>

        {/* ORDERS */}
        {isAuthenticated ? (
          <NavLink
            to="/account/orders"
            onClick={() => {
              setIsCartOpen(false);
              setIsAccountDrawerOpen(false);
              setActiveTab("orders");
              clearHoverStates();
            }}
            onMouseEnter={() => handleTabHover("orders")}
            onMouseLeave={handleTabMouseLeave}
            className={({ isActive }) => 
              `flex flex-col items-center justify-center gap-1 text-xs transition-all duration-300 group ${
                isActive || activeTab === "orders"
                  ? "text-sky-600 font-semibold"
                  : "text-gray-600 hover:text-sky-500"
              }`
            }
          >
            <div className="relative p-2 rounded-lg group-hover:bg-sky-50/80 transition-all duration-300">
              <Package 
                size={20} 
                className={`transition-all duration-300 ${getIconAnimation("orders")} ${
                  activeTab === "orders" ? "scale-110" : ""
                } ${hoveredTab === "orders" && isHovering && activeTab !== "orders" ? "scale-105" : ""}`} 
              />
              {/* Active indicator - Emoji style dot */}
              {(activeTab === "orders" || location.pathname.startsWith("/account/orders")) && (
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                  <div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-ping-slow"></div>
                  <div className="w-2 h-2 bg-sky-500 rounded-full mt-0.5"></div>
                </div>
              )}
            </div>
            <span className={`transition-all duration-300 ${getTextAnimation("orders")} ${
              hoveredTab === "orders" && isHovering && activeTab !== "orders" ? "font-medium" : ""
            }`}>
              Orders
            </span>
          </NavLink>
        ) : (
          <button
            onClick={() => {
              openLogin();
              clearHoverStates();
            }}
            onMouseEnter={() => handleTabHover("orders")}
            onMouseLeave={handleTabMouseLeave}
            className="flex flex-col items-center justify-center gap-1 text-xs text-gray-600 hover:text-sky-500 transition-all duration-300 group"
          >
            <div className="relative p-2 rounded-lg group-hover:bg-sky-50/80 transition-all duration-300">
              <Package 
                size={20} 
                className={`transition-all duration-300 ${hoveredTab === "orders" && isHovering ? "animate-pulse scale-105" : ""}`} 
              />
            </div>
            <span className={`transition-all duration-300 ${hoveredTab === "orders" && isHovering ? "animate-text-pop font-medium" : ""}`}>
              Orders
            </span>
          </button>
        )}

        {/* PROFILE — DRAWER */}
        <button
          onClick={() => {
            setIsCartOpen(false);
            clearHoverStates();

            if (!isAuthenticated) {
              openLogin();
            } else {
              setIsAccountDrawerOpen(true);
              setActiveTab("profile");
            }
          }}
          onMouseEnter={() => handleTabHover("profile")}
          onMouseLeave={handleTabMouseLeave}
          className={`flex flex-col items-center justify-center gap-1 text-xs transition-all duration-300 group ${
            activeTab === "profile"
              ? "text-sky-600 font-semibold"
              : "text-gray-600 hover:text-sky-500"
          }`}
        >
          <div className="relative p-2 rounded-lg group-hover:bg-sky-50/80 transition-all duration-300">
            <User 
              size={20} 
              className={`transition-all duration-300 ${getIconAnimation("profile")} ${
                activeTab === "profile" ? "scale-110" : ""
              } ${hoveredTab === "profile" && isHovering && activeTab !== "profile" ? "scale-105" : ""}`} 
            />
            {/* Active indicator - Emoji style dot */}
            {activeTab === "profile" && (
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                <div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-ping-slow"></div>
                <div className="w-2 h-2 bg-sky-500 rounded-full mt-0.5"></div>
              </div>
            )}
          </div>
          <span className={`transition-all duration-300 ${getTextAnimation("profile")} ${
            hoveredTab === "profile" && isHovering && activeTab !== "profile" ? "font-medium" : ""
          }`}>
            {isAuthenticated ? "Profile" : "Login"}
          </span>
        </button>
      </div>

      {/* Add CSS for animations */}
      <style jsx>{`
        @keyframes bounce-once {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes ping-slow {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(2); opacity: 0; }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes text-pop {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .animate-bounce-once {
          animation: bounce-once 0.3s ease-in-out;
        }
        .animate-ping-slow {
          animation: ping-slow 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .animate-text-pop {
          animation: text-pop 0.2s ease-out;
        }
        .animate-pulse {
          animation: pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </nav>
  );
};

export default BottomNavigation;