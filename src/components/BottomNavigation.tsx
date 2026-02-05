import { Home, ShoppingCart, Package, User } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";

type Tab = "home" | "cart" | "orders" | "profile";

const BottomNavigation = () => {
  const location = useLocation();
  const { items, setIsCartOpen, isCartOpen } = useCart();
  const { 
    isAuthenticated, 
    setIsAuthModalOpen, 
    setAuthMode, 
    setIsAccountDrawerOpen,
    isAccountDrawerOpen 
  } = useAuth();

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // 🚫 Hide bottom nav on admin pages
  if (location.pathname.startsWith("/admin")) return null;

  // State to track active tab
  const [activeTab, setActiveTab] = useState<Tab>("home");

  // Determine active tab based on route and drawer state
  useEffect(() => {
    if (isCartOpen) {
      setActiveTab("cart");
      return;
    }

    if (isAccountDrawerOpen) {
      setActiveTab("profile");
      return;
    }

    if (location.pathname === "/") {
      setActiveTab("home");
    } else if (location.pathname.startsWith("/account/orders")) {
      setActiveTab("orders");
    } else if (location.pathname.startsWith("/account")) {
      setActiveTab("profile");
    } else {
      setActiveTab("home");
    }
  }, [location.pathname, isCartOpen, isAccountDrawerOpen]);

  const openLogin = () => {
    setAuthMode("login");
    setIsAuthModalOpen(true);
  };

  const handleProfileClick = () => {
    setIsCartOpen(false);
    if (!isAuthenticated) {
      openLogin();
    } else {
      setIsAccountDrawerOpen(true);
    }
    setActiveTab("profile");
  };

  return (
    <div className="fixed bottom-2 left-0 right-0 z-50 flex justify-center md:hidden">
      {/* Floating circular navigation container with INCREASED WIDTH and CLOSER TO BOTTOM */}
      <nav className="flex items-center justify-between bg-gradient-to-b from-[#2A2D35] to-[#1A1C20] border border-white/10 px-8 py-4 rounded-full shadow-2xl w-full max-w-[500px] h-[80px] backdrop-blur-md mx-4">
        
        {/* HOME */}
        <NavLink
          to="/"
          onClick={() => { 
            setIsCartOpen(false); 
            setIsAccountDrawerOpen(false);
            setActiveTab("home");
          }}
          className="relative flex flex-1 items-center justify-center h-full group"
        >
          <div className={`z-10 transition-all duration-300 flex flex-col items-center ${
            activeTab === "home" ? "text-[#E9E1D8]" : "text-gray-400 group-hover:text-[#E9E1D8]"
          }`}>
            <div className="relative">
              <Home 
                size={24} 
                strokeWidth={activeTab === "home" ? 2.5 : 2} 
                className={activeTab === "home" ? "animate-bounce-once" : ""}
              />
            </div>
            <span className="text-[11px] mt-2 font-medium">Home</span>
          </div>
          
          {/* Active indicator - ROUNDED circle behind icon */}
          {activeTab === "home" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 bg-[#E9E1D8]/10 rounded-full blur-sm"></div>
            </div>
          )}
        </NavLink>

        {/* CART */}
        <button
          onClick={() => { 
            setIsAccountDrawerOpen(false); 
            setIsCartOpen(true);
            setActiveTab("cart");
          }}
          className="relative flex flex-1 items-center justify-center h-full group"
        >
          <div className={`z-10 transition-all duration-300 flex flex-col items-center ${
            activeTab === "cart" ? "text-[#E9E1D8]" : "text-gray-400 group-hover:text-[#E9E1D8]"
          }`}>
            <div className="relative">
              <ShoppingCart 
                size={24} 
                strokeWidth={activeTab === "cart" ? 2.5 : 2}
                className={activeTab === "cart" ? "animate-bounce-once" : ""}
              />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-orange-400 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-lg animate-pulse-slow">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </div>
            <span className="text-[11px] mt-2 font-medium">Cart</span>
          </div>
          
          {/* Active indicator - ROUNDED circle behind icon */}
          {activeTab === "cart" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 bg-[#E9E1D8]/10 rounded-full blur-sm"></div>
            </div>
          )}
        </button>

        {/* ORDERS */}
        {isAuthenticated ? (
          <NavLink
            to="/account/orders"
            onClick={() => { 
              setIsCartOpen(false); 
              setIsAccountDrawerOpen(false);
              setActiveTab("orders");
            }}
            className={({ isActive }) => `relative flex flex-1 items-center justify-center h-full group ${
              activeTab === "orders" ? "" : ""
            }`}
          >
            <div className={`z-10 transition-all duration-300 flex flex-col items-center ${
              activeTab === "orders" ? "text-[#E9E1D8]" : "text-gray-400 group-hover:text-[#E9E1D8]"
            }`}>
              <Package 
                size={24} 
                strokeWidth={activeTab === "orders" ? 2.5 : 2}
                className={activeTab === "orders" ? "animate-bounce-once" : ""}
              />
              <span className="text-[11px] mt-2 font-medium">Orders</span>
            </div>
            
            {/* Active indicator - ROUNDED circle behind icon */}
            {activeTab === "orders" && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 bg-[#E9E1D8]/10 rounded-full blur-sm"></div>
              </div>
            )}
          </NavLink>
        ) : (
          <button
            onClick={() => {
              openLogin();
            }}
            className="relative flex flex-1 items-center justify-center h-full group"
          >
            <div className="z-10 transition-all duration-300 flex flex-col items-center text-gray-400 group-hover:text-[#E9E1D8]">
              <Package size={24} />
              <span className="text-[11px] mt-2 font-medium">Orders</span>
            </div>
          </button>
        )}

        {/* PROFILE */}
        <button
          onClick={handleProfileClick}
          className="relative flex flex-1 items-center justify-center h-full group"
        >
          <div className={`z-10 transition-all duration-300 flex flex-col items-center ${
            activeTab === "profile" ? "text-[#E9E1D8]" : "text-gray-400 group-hover:text-[#E9E1D8]"
          }`}>
            <User 
              size={24} 
              strokeWidth={activeTab === "profile" ? 2.5 : 2}
              className={activeTab === "profile" ? "animate-bounce-once" : ""}
            />
            <span className="text-[11px] mt-2 font-medium">
              {isAuthenticated ? "Profile" : "Login"}
            </span>
          </div>
          
          {/* Active indicator - ROUNDED circle behind icon */}
          {activeTab === "profile" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 bg-[#E9E1D8]/10 rounded-full blur-sm"></div>
            </div>
          )}
        </button>
      </nav>
      
      {/* Animation styles */}
      <style>{`
        @keyframes bounce-once {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.1); }
        }
        .animate-bounce-once {
          animation: bounce-once 0.3s ease-in-out;
        }
        .animate-pulse-slow {
          animation: pulse-slow 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default BottomNavigation;