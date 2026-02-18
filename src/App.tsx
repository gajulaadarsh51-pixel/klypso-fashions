// App.tsx
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
import AdminReviews from "./pages/admin/AdminReviews";
import HomeCategoryAdmin from "./pages/admin/HomeCategoryAdmin";
import AdminBrands from "./pages/admin/AdminBrands";
import AdminFestivals from "./pages/admin/AdminFestivals";
import AdminWorldOfDesire from "./pages/admin/AdminWorldOfDesire";
import AdminTrendingSlides from "./pages/admin/AdminTrendingSlides";
import AdminFashionForecast from "./pages/admin/AdminFashionForecast";

import AccountLayout from "./pages/account/AccountLayout";
import AccountProfile from "./pages/account/AccountProfile";
import AccountOrders from "./pages/account/AccountOrders";

import BottomNavigation from "./components/BottomNavigation";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const AppContent = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <>
      <div className="pb-20 md:pb-0">
        <Routes>
          <Route path="/maintenance" element={<Maintenance />} />

          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="header-icons" element={<AdminHeaderIcons />} />
            <Route path="header-slides" element={<AdminHeaderSlides />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="home-categories" element={<HomeCategoryAdmin />} />
            <Route path="brands" element={<AdminBrands />} />
            <Route path="festivals" element={<AdminFestivals />} />
            <Route path="world-of-desire" element={<AdminWorldOfDesire />} />
            <Route path="trending-slides" element={<AdminTrendingSlides />} />
            <Route path="fashion-forecast" element={<AdminFashionForecast />} />
          </Route>

          <Route path="/" element={<Index />} />
          <Route path="/products" element={<Products />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/wishlist" element={<Wishlist />} />

          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/legal/contact" element={<ContactUs />} />
          <Route path="/legal/faq" element={<Faq />} />
          <Route path="/legal/shipping-returns" element={<ShippingReturns />} />
          <Route path="/legal/size-guide" element={<SizeGuide />} />

          <Route path="/account" element={<AccountLayout />}>
            <Route index element={<AccountProfile />} />
            <Route path="profile" element={<AccountProfile />} />
            <Route path="orders" element={<AccountOrders />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>

      {!isAdminRoute && <BottomNavigation />}
    </>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <SettingsProvider>
                <Toaster />
                <Sonner />
                {/* ✅ FIXED: Added future flags to BrowserRouter */}
                <BrowserRouter
                  future={{
                    v7_startTransition: true,
                    v7_relativeSplatPath: true,
                  }}
                >
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
};

export default App;