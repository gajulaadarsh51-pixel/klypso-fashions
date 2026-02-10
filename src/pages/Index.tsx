// pages/Index.tsx
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Gift, Loader2 } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import AuthModal from '@/components/AuthModal';
import { categories } from '@/data/products';
import { useProducts } from '@/hooks/useProducts';
import HomeCategoryGrid from '@/components/HomeCategoryGrid';
import BrandSpotlight from "@/components/BrandSpotlight";
import { useRef } from 'react';
import { useFestivals } from '@/hooks/useFestivals';
import { useSectionToggle } from '@/hooks/useSectionToggle';

const Index = () => {
  const { data: products = [], isLoading } = useProducts();
  const { data: festivals = [], isLoading: festivalsLoading } = useFestivals();
  const { isEnabled: isFestivalEnabled } = useSectionToggle("festivals_section");
  
  const featuredProducts = products.slice(0, 4);
  const newArrivals = products.filter((p) => p.is_new);
  const festivalScrollRef = useRef<HTMLDivElement>(null);

  // ✅ REAL PRODUCT COUNT CALCULATION FOR EACH CATEGORY
  const getCategoryCount = (categoryName: string) => {
    const categoryLower = categoryName.toLowerCase();
    
    // Special handling for Women Accessories
    if (categoryLower.includes('women') && categoryLower.includes('accessor')) {
      return products.filter((product) => {
        const productGender = product.gender?.toLowerCase() || '';
        const productCategory = product.category?.toLowerCase() || '';
        const productSubcategory = product.subcategory?.toLowerCase() || '';
        
        const isWomen = productGender === 'women' || productGender === 'female';
        const isAccessories = productCategory === 'accessories' || 
                             productSubcategory === 'accessories' ||
                             productCategory.includes('accessor') ||
                             productSubcategory.includes('accessor');
        
        return isWomen && isAccessories;
      }).length;
    }
    
    // Normal category calculation
    return products.filter((product) => {
      const productCategory = product.category?.toLowerCase() || '';
      const productGender = product.gender?.toLowerCase() || '';
      const productSubcategory = product.subcategory?.toLowerCase() || '';
      const productTags = product.tags?.map((tag: string) => tag.toLowerCase()) || [];

      return (
        productCategory === categoryLower ||
        productGender === categoryLower ||
        productSubcategory === categoryLower ||
        productCategory.includes(categoryLower) ||
        productGender.includes(categoryLower) ||
        productSubcategory.includes(categoryLower) ||
        productTags.some(tag => tag.includes(categoryLower)) ||
        (categoryLower === "men" && (productGender === "men" || productGender === "male")) ||
        (categoryLower === "women" && (productGender === "women" || productGender === "female")) ||
        (categoryLower === "kids" && (
          productGender === "kids" || 
          productGender === "children" || 
          productGender === "boy" || 
          productGender === "girl" ||
          productCategory === "kids" ||
          productSubcategory === "kids" ||
          productCategory.includes("kid") ||
          productSubcategory.includes("kid")
        )) ||
        (categoryLower === "watches" && (productCategory === "watches" || productSubcategory === "watches")) ||
        (categoryLower === "tshirts" && (productCategory === "t-shirts" || productSubcategory === "tshirts")) ||
        (categoryLower === "shoes" && (productCategory === "shoes" || productSubcategory === "footwear"))
      );
    }).length;
  };

  // ✅ Updated categories with real counts
  const updatedCategories = [
    ...categories,
    ...(categories.some(cat => cat.name.toLowerCase() === 'kids') ? [] : [{
      name: 'Kids',
      image: 'https://www.kidrovia.com/wp-content/uploads/2024/02/Kidrovia.png',
      count: getCategoryCount('Kids')
    }])
  ].map(cat => ({
    ...cat,
    count: getCategoryCount(cat.name)
  }));

  // ✅ Desire Categories Array (This was missing!)
  const desireCategories = [
    {
      name: "Men's Collection",
      image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      link: "/products?category=men"
    },
    {
      name: "Women's Elegance",
      image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      link: "/products?category=women"
    },
    {
      name: "Accessories",
      image: "https://th.bing.com/th/id/OIP.xNs5cDFrG-II_HdYG8JEFAHaFL?w=243&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",
      link: "/products?category=accessories"
    },
    {
      name: "Footwear",
      image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      link: "/products?category=shoes"
    }
  ];

  // Function to scroll left/right
  const scrollSection = (ref: React.RefObject<HTMLDivElement>, direction: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmount = 300;
      if (direction === 'left') {
        ref.current.scrollLeft -= scrollAmount;
      } else {
        ref.current.scrollLeft += scrollAmount;
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <AuthModal />

      <main className="flex-1">
        {/* ✅ ADDED: Home Category Strip */}
        <HomeCategoryGrid />
        
        {/* ✅ BRANDS IN SPOTLIGHT SECTION */}
        <BrandSpotlight />
        
        {/* ✅ FESTIVALS AND SPECIAL DAYS SECTION (Dynamic from Supabase) */}
        {isFestivalEnabled && (
          <section className="py-6 sm:py-8 md:py-10 bg-gradient-to-r from-amber-50 to-orange-50">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-3">
                  <Gift className="text-orange-600" size={24} />
                  <div>
                    <h2 className="font-heading text-lg sm:text-xl md:text-2xl font-semibold text-gray-900">
                      Festivals and Special Days
                    </h2>
                    <p className="text-muted-foreground text-xs sm:text-sm mt-1">
                      Celebrate with exclusive collections
                    </p>
                  </div>
                </div>
                
                {/* Scroll buttons for desktop */}
                {festivals && festivals.length > 4 && (
                  <div className="hidden md:flex items-center gap-2">
                    <button 
                      onClick={() => scrollSection(festivalScrollRef, 'left')}
                      className="p-2 rounded-full bg-white border shadow-sm hover:bg-gray-50 transition-colors"
                      aria-label="Scroll left"
                    >
                      <ChevronLeft size={20} className="text-gray-600" />
                    </button>
                    <button 
                      onClick={() => scrollSection(festivalScrollRef, 'right')}
                      className="p-2 rounded-full bg-white border shadow-sm hover:bg-gray-50 transition-colors"
                      aria-label="Scroll right"
                    >
                      <ChevronRight size={20} className="text-gray-600" />
                    </button>
                  </div>
                )}
              </div>

              {/* Festival Cards Container with Horizontal Scroll */}
              <div className="relative">
                {festivalsLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="animate-spin text-orange-500" size={24} />
                  </div>
                ) : festivals && festivals.length > 0 ? (
                  <>
                    <div 
                      ref={festivalScrollRef}
                      className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth"
                      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                      {festivals.map((festival) => {
                        // Check if it's a Google Drive URL and convert it
                        let imageUrl = festival.image_url;
                        if (imageUrl && imageUrl.includes('drive.google.com')) {
                          const fileId = imageUrl.match(/id=([^&]+)/)?.[1] || 
                                        imageUrl.match(/\/d\/([^\/]+)/)?.[1];
                          if (fileId) {
                            // Use Google Drive thumbnail for better performance
                            imageUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`;
                          }
                        }

                        return (
                          <div 
                            key={festival.id}
                            className="flex-shrink-0 w-full sm:w-64 md:w-72 bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow duration-300"
                          >
                            <div className={`h-32 ${festival.bg_color} relative`}>
                              <img
                                src={imageUrl}
                                alt={festival.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // Fallback if image fails to load
                                  console.error('Image failed to load:', imageUrl);
                                  (e.target as HTMLImageElement).src = '/placeholder.svg';
                                  
                                  // Try alternative Google Drive URL format
                                  if (imageUrl && imageUrl.includes('drive.google.com')) {
                                    const fileId = imageUrl.match(/id=([^&]+)/)?.[1];
                                    if (fileId) {
                                      setTimeout(() => {
                                        (e.target as HTMLImageElement).src = `https://lh3.googleusercontent.com/d/${fileId}=w800`;
                                      }, 100);
                                    }
                                  }
                                }}
                                loading="lazy"
                              />
                              <div className="absolute top-3 left-3">
                                <span className="px-2 py-1 text-xs font-medium bg-white/90 backdrop-blur-sm rounded-full text-gray-800">
                                  {festival.offer}
                                </span>
                              </div>
                            </div>
                            
                            <div className="p-4">
                              <h3 className="font-semibold text-gray-900 text-lg">{festival.title}</h3>
                              <p className="text-sm text-gray-600 mt-1">{festival.subtitle}</p>
                              
                              <div className="mt-3 pt-3 border-t border-gray-100">
                                <a
                                  href={
                                    festival.custom_link
                                      ? festival.custom_link
                                      : `/products?category=${festival.category || 'festival'}`
                                  }
                                  className="block w-full py-2 text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors text-center"
                                >
                                  Shop Collection →
                                </a>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Gradient fade effect on sides */}
                    <div className="absolute left-0 top-0 bottom-4 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none"></div>
                    <div className="absolute right-0 top-0 bottom-4 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No festivals available at the moment.</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* 🎯 CLASSIC ELEGANCE MEETS MODERN LUXURY: A World of Desire Section - COMPACT */}
        <section className="relative overflow-hidden py-8 md:py-16 bg-gradient-to-br from-amber-50 via-white to-amber-50/70">
          {/* Enhanced Background Elements - Softer amber tones */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Main gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 via-white/40 to-amber-50/50" />
            
            {/* Decorative circles - smaller */}
            <div className="absolute top-1/4 left-4 w-48 h-48 bg-gradient-to-br from-amber-200/30 to-transparent rounded-full blur-2xl" />
            <div className="absolute bottom-1/4 right-4 w-60 h-60 bg-gradient-to-tl from-amber-300/20 to-transparent rounded-full blur-2xl" />
            
            {/* Geometric pattern overlay - subtle gold */}
            <div className="absolute inset-0 opacity-[0.02]">
              <div className="absolute inset-0" style={{
                backgroundImage: `linear-gradient(45deg, #b45309 1px, transparent 1px),
                                 linear-gradient(-45deg, #b45309 1px, transparent 1px)`,
                backgroundSize: '50px 50px',
                backgroundPosition: '0 0, 25px 25px'
              }} />
            </div>
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            {/* ✅ MAIN BOX - COMPACT */}
            <div className="relative bg-gradient-to-br from-amber-50/95 via-white to-amber-50/95 backdrop-blur-sm rounded-xl shadow-md shadow-amber-900/5 border border-amber-200/40 overflow-hidden">
              {/* Classic Corner Accents - smaller */}
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-amber-600/40 rounded-tl-md" />
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-amber-600/40 rounded-tr-md" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-amber-600/40 rounded-bl-md" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-amber-600/40 rounded-br-md" />
              
              {/* Decorative Top Right Emblem - smaller */}
              <div className="absolute top-4 right-4 z-20 hidden md:block">
                <div className="relative">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden border border-amber-300 bg-gradient-to-br from-amber-100 to-white shadow-sm">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-200 to-amber-50 p-[1px]">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-300/40 to-transparent" />
                    </div>
                    
                    <div className="absolute inset-[1px] rounded-full bg-gradient-to-br from-amber-50 to-white flex items-center justify-center">
                      <div className="relative w-6 h-6">
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-amber-700 rotate-45 rounded-sm" />
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-px bg-white/90" />
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-2 w-px bg-white/90" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Content Area - COMPACT */}
              <div className="relative px-4 sm:px-5 md:px-8 py-6 sm:py-8 md:py-10">
                {/* Header - COMPACT */}
                <div className="flex justify-between items-start mb-6 sm:mb-8 md:mb-10">
                  {/* Top Left Title */}
                  <div>
                    <h1 className="font-serif text-lg sm:text-xl md:text-2xl font-normal text-gray-900 tracking-tight">
                      A World of <span className="font-semibold text-amber-800">Desire</span>
                    </h1>
                    
                    {/* Accent line below title - smaller */}
                    <div className="h-px w-12 sm:w-16 md:w-20 bg-gradient-to-r from-amber-500 to-transparent mt-1" />
                  </div>
                  
                  {/* Mobile emblem - smaller */}
                  <div className="md:hidden">
                    <div className="relative w-8 h-8 rounded-full overflow-hidden border border-amber-300 bg-gradient-to-br from-amber-100 to-white shadow-sm">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-200 to-amber-50 p-[1px]">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-300/40 to-transparent" />
                      </div>
                      <div className="absolute inset-[1px] rounded-full bg-gradient-to-br from-amber-50 to-white flex items-center justify-center">
                        <div className="relative w-4 h-4">
                          <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-amber-700 rotate-45 rounded-sm" />
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1.5 h-px bg-white/90" />
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-1.5 w-px bg-white/90" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Product Grid - COMPACT */}
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                  {desireCategories.map((category, index) => {
                    // Perfect warm luxury color schemes
                    const colorSchemes = [
                      {
                        bgFrom: 'from-amber-50',
                        bgTo: 'to-amber-100/40',
                        border: 'border-amber-300',
                        badgeFrom: 'from-amber-600',
                        badgeTo: 'to-amber-700',
                        hoverText: 'hover:text-amber-800',
                        accent: 'amber-500',
                        hoverBorder: 'hover:border-amber-400'
                      },
                      {
                        bgFrom: 'from-orange-50',
                        bgTo: 'to-orange-100/40',
                        border: 'border-orange-200',
                        badgeFrom: 'from-orange-600',
                        badgeTo: 'to-orange-700',
                        hoverText: 'hover:text-orange-800',
                        accent: 'orange-500',
                        hoverBorder: 'hover:border-orange-300'
                      },
                      {
                        bgFrom: 'from-yellow-50',
                        bgTo: 'to-yellow-100/40',
                        border: 'border-yellow-200',
                        badgeFrom: 'from-yellow-600',
                        badgeTo: 'to-yellow-700',
                        hoverText: 'hover:text-yellow-800',
                        accent: 'yellow-500',
                        hoverBorder: 'hover:border-yellow-300'
                      },
                      {
                        bgFrom: 'from-red-50',
                        bgTo: 'to-red-100/40',
                        border: 'border-red-200',
                        badgeFrom: 'from-red-600',
                        badgeTo: 'to-red-700',
                        hoverText: 'hover:text-red-800',
                        accent: 'red-500',
                        hoverBorder: 'hover:border-red-300'
                      }
                    ];
                    
                    const colors = colorSchemes[index % colorSchemes.length];
                    
                    return (
                      <div
                        key={category.name}
                        className={`group relative bg-gradient-to-br ${colors.bgFrom} ${colors.bgTo} border ${colors.border} rounded-md overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 shadow-sm ${colors.hoverBorder}`}
                      >
                        <Link
                          to={category.link}
                          className="block relative h-full"
                          aria-label={`Explore ${category.name} collection`}
                        >
                          {/* Image Container - COMPACT */}
                          <div className={`relative aspect-square overflow-hidden bg-gradient-to-br ${colors.bgFrom} ${colors.bgTo}`}>
                            <img
                              src={category.image}
                              alt={category.name}
                              loading="lazy"
                              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            
                            {/* Gradient Overlay */}
                            <div className={`absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent`} />
                            
                            {/* Featured Badge - SMALLER */}
                            <div className="absolute top-1.5 left-1.5">
                              <div className={`relative px-1.5 py-0.5 bg-gradient-to-r ${colors.badgeFrom} ${colors.badgeTo} rounded-sm shadow-sm`}>
                                <span className="text-[10px] font-semibold text-white uppercase tracking-wide">
                                  Featured
                                </span>
                              </div>
                            </div>
                            
                            {/* Hover Icon - SMALLER */}
                            <div className="absolute bottom-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <div className="w-5 h-5 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center shadow-sm">
                                <svg className={`w-2.5 h-2.5 text-${colors.accent}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                              </div>
                            </div>
                          </div>
                          
                          {/* Content Area - COMPACT */}
                          <div className="p-2 sm:p-3 border-t border-white/50 bg-gradient-to-b from-white/90 to-transparent">
                            <div className="flex items-center justify-between mb-0.5">
                              <h3 className={`font-serif text-xs sm:text-sm font-normal text-gray-900 ${colors.hoverText} transition-colors duration-200 truncate`}>
                                {category.name}
                              </h3>
                              <svg className={`w-2.5 h-2.5 text-${colors.accent}/60 group-hover:text-${colors.accent} transition-colors duration-200 flex-shrink-0 ml-0.5`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                              </svg>
                            </div>
                            
                            {/* Color-coded Separator - THINNER */}
                            <div className={`h-px w-full bg-gradient-to-r from-transparent via-${colors.accent}/10 to-transparent group-hover:via-${colors.accent}/30 transition-all duration-200 my-1 sm:my-1.5`} />
                            
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-gray-600 font-light truncate pr-1">
                                View Collection
                              </span>
                              <div className="flex items-center gap-0.5 flex-shrink-0">
                                {[...Array(2)].map((_, i) => (
                                  <div 
                                    key={i} 
                                    className={`w-1 h-1 rounded-full bg-${colors.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-200`} 
                                    style={{ 
                                      animationDelay: `${i * 100}ms`,
                                      animation: 'pulse 1.5s ease-in-out infinite'
                                    }} 
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        </Link>
                      </div>
                    );
                  })}
                </div>

                {/* CTA Section - COMPACT */}
                <div className="text-center mt-6 sm:mt-8 md:mt-10 pt-4 sm:pt-5 border-t border-amber-200/40">
                  <div className="relative inline-block">
                    <Link
                      to="/products"
                      className="relative inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-1.5 sm:py-2 bg-gradient-to-r from-amber-100 to-amber-50 border border-amber-300 text-amber-800 hover:bg-gradient-to-r hover:from-amber-200 hover:to-amber-100 hover:border-amber-400 hover:text-amber-900 rounded-full transition-all duration-200 group shadow-sm hover:shadow-md text-xs sm:text-sm"
                      aria-label="Explore all luxury collections"
                    >
                      <span className="font-medium tracking-wide whitespace-nowrap">
                        View All Collections
                      </span>
                      <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 transform group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </Link>
                  </div>
                  
                  {/* Classic Quote - SMALLER */}
                  <div className="mt-2 sm:mt-3">
                    <p className="font-serif text-[10px] sm:text-xs text-amber-700/60 italic">
                      "True luxury is found in the details"
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Bottom Accent Line - THINNER */}
              <div className="absolute bottom-0 left-0 w-full h-[0.5px] bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-8 sm:py-12 md:py-20">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-6 sm:mb-8 md:mb-12">
              <div>
                <h2 className="font-heading text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold mb-1">
                  Featured Products
                </h2>
                <p className="text-muted-foreground text-xs sm:text-sm md:text-base">
                  Handpicked for you
                </p>
              </div>
              <Link to="/products" className="hidden md:flex items-center gap-2 text-sm font-medium link-underline">
                VIEW ALL <ArrowRight size={16} />
              </Link>
            </div>

            {isLoading ? (
              <div className="text-center py-12 sm:py-20">Loading products...</div>
            ) : featuredProducts.length === 0 ? (
              <div className="text-center py-12 sm:py-20">No products found.</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                {featuredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            <div className="text-center mt-6 sm:mt-8 md:hidden">
              <Link to="/products" className="btn-outline inline-flex items-center gap-2 text-xs sm:text-sm py-2 px-4 sm:py-3 sm:px-6">
                VIEW ALL <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>

        {/* Banner */}
        <section className="relative py-12 sm:py-20 md:py-32 bg-charcoal text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <p className="text-yellow-300 text-[10px] sm:text-xs md:text-sm tracking-[0.1em] sm:tracking-[0.2em] md:tracking-[0.3em] mb-2 sm:mb-3 md:mb-4">
              LIMITED TIME OFFER
            </p>
            <h2 className="font-heading text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 md:mb-6">
              Up to 40% Off
            </h2>
            <p className="text-primary-foreground/70 mb-4 sm:mb-6 md:mb-8 max-w-md mx-auto text-[10px] sm:text-xs md:text-sm">
              Don't miss our seasonal sale. Shop now and save on premium styles.
            </p>
            <Link to="/products?sale=true" className="btn-gold py-2.5 sm:py-3 px-6 sm:px-8 text-xs sm:text-sm">
              SHOP SALE
            </Link>
          </div>
        </section>

        {/* New Arrivals */}
        {newArrivals.length > 0 && (
          <section className="py-8 sm:py-12 md:py-20">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between mb-6 sm:mb-8 md:mb-12">
                <div>
                  <h2 className="font-heading text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold mb-1">
                    New Arrivals
                  </h2>
                  <p className="text-muted-foreground text-xs sm:text-sm md:text-base">
                    Just landed this week
                  </p>
                </div>
                <Link to="/products" className="hidden md:flex items-center gap-2 text-sm font-medium link-underline">
                  VIEW ALL <ArrowRight size={16} />
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                {newArrivals.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Newsletter */}
        <section className="py-8 sm:py-12 md:py-20 bg-cream">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-heading text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold mb-2 sm:mb-3 md:mb-4">
              Join Our Newsletter
            </h2>
            <p className="text-muted-foreground mb-4 sm:mb-6 md:mb-8 max-w-md mx-auto text-xs sm:text-sm md:text-base">
              Subscribe to receive updates on new arrivals, exclusive offers, and styling tips.
            </p>
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 border border-border bg-background text-xs sm:text-sm outline-none focus:border-primary transition-colors rounded"
              />
              <button type="submit" className="btn-primary whitespace-nowrap py-2.5 sm:py-3 text-xs sm:text-sm">
                SUBSCRIBE
              </button>
            </form>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;