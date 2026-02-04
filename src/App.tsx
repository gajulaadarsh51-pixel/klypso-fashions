import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ScrollToTop from "@/components/ScrollToTop";

import { SettingsProvider } from "@/contexts/SettingsContext";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { WishlistProvider } from "@/contexts/WishlistContext";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MaintenanceMode } from "@/components/MaintenanceMode";

import Maintenance from "@/pages/Maintenance";
import Index from "./pages/Index";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Checkout from "./pages/Checkout";
import NotFound from "./pages/NotFound";
import Wishlist from "./pages/Wishlist";

import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import ShippingReturns from "./pages/legal/ShippingReturns";
import Faq from "./pages/legal/Faq";
import ContactUs from "./pages/legal/ContactUs";
import SizeGuide from "./pages/legal/SizeGuide";

import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminHeaderIcons from "./pages/admin/AdminHeaderIcons";
import AdminHeaderSlides from "./pages/admin/AdminHeaderSlides";
import AdminReviews from "./pages/admin/AdminReviews"; // ✅ ADDED
import HomeCategoryAdmin from "./pages/admin/HomeCategoryAdmin";


import AccountLayout from "./pages/account/AccountLayout";
import AccountProfile from "./pages/account/AccountProfile";
import AccountOrders from "./pages/account/AccountOrders";

import BottomNavigation from "./components/BottomNavigation";

const queryClient = new QueryClient();

/* 🔑 ROUTE HANDLER */
const AppContent = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <>
      {/* Padding for mobile bottom nav */}
      <div className="pb-20 md:pb-0">
        <Routes>
          {/* MAINTENANCE ROUTE - Always accessible */}
          <Route path="/maintenance" element={<Maintenance />} />

          {/* ADMIN ROUTES */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="header-icons" element={<AdminHeaderIcons />} />
            <Route path="header-slides" element={<AdminHeaderSlides />} />
            <Route path="reviews" element={<AdminReviews />} /> {/* ✅ FIXED */}
            <Route path="home-categories" element={<HomeCategoryAdmin />} />

          </Route>

          {/* PUBLIC ROUTES */}
          <Route path="/" element={<Index />} />
          <Route path="/products" element={<Products />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/wishlist" element={<Wishlist />} />

          {/* LEGAL PAGES */}
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/legal/contact" element={<ContactUs />} />
          <Route path="/legal/faq" element={<Faq />} />
          <Route path="/legal/shipping-returns" element={<ShippingReturns />} />
          <Route path="/legal/size-guide" element={<SizeGuide />} />

          {/* ACCOUNT */}
          <Route path="/account" element={<AccountLayout />}>
            <Route index element={<AccountProfile />} />
            <Route path="profile" element={<AccountProfile />} />
            <Route path="orders" element={<AccountOrders />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>

      {/* Mobile bottom nav (hidden on admin pages) */}
      {!isAdminRoute && <BottomNavigation />}
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <SettingsProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <MaintenanceMode>
                  <ScrollToTop />
                  <AppContent />
                </MaintenanceMode>
              </BrowserRouter>
            </SettingsProvider>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
