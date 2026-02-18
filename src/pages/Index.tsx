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
import RecentlyViewedProducts from '@/components/RecentlyViewedProducts';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { useRef, useState } from 'react';
import { useFestivals } from '@/hooks/useFestivals';
import { useSectionToggle } from '@/hooks/useSectionToggle';
import { useWorldOfDesire } from "@/hooks/useWorldOfDesire";
import TrendingSlideDeck from '@/components/TrendingSlideDeck';
import ExclusiveDrops from '@/components/ExclusiveDrops';
import FashionForecast from '@/components/FashionForecast'; // Add this import

const Index = () => {
  const { data: products = [], isLoading } = useProducts();
  const { data: festivals = [], isLoading: festivalsLoading } = useFestivals();
  const { isEnabled: isFestivalEnabled } = useSectionToggle("festivals_section");
  const { data: desireCategories = [] } = useWorldOfDesire();
  const { recentlyViewed } = useRecentlyViewed();
  
  const featuredProducts = products.slice(0, 4);
  const newArrivals = products.filter((p) => p.is_new);
  const festivalScrollRef = useRef<HTMLDivElement>(null);

  const getCategoryCount = (categoryName: string) => {
    const categoryLower = categoryName.toLowerCase();
    
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

  // Auto-scroll back to beginning for festivals section
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const isHorizontalScrollRef = useRef<boolean>(false);

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

  // Handle touch start to detect horizontal vs vertical scroll
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    isHorizontalScrollRef.current = false;
  };

  // Handle touch move to determine scroll direction
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!festivalScrollRef.current || touchStartXRef.current === null || touchStartYRef.current === null || isAutoScrolling) return;

    const touchMoveX = e.touches[0].clientX;
    const touchMoveY = e.touches[0].clientY;
    
    const deltaX = Math.abs(touchMoveX - touchStartXRef.current);
    const deltaY = Math.abs(touchMoveY - touchStartYRef.current);
    
    // If horizontal movement is greater than vertical, it's a horizontal scroll
    if (deltaX > deltaY && deltaX > 10) {
      isHorizontalScrollRef.current = true;
    }
  };

  // Handle touch end to detect swipe past last slide for festivals
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!festivalScrollRef.current || touchStartXRef.current === null || isAutoScrolling || !isHorizontalScrollRef.current) {
      touchStartXRef.current = null;
      touchStartYRef.current = null;
      return;
    }

    const container = festivalScrollRef.current;
    const touchEndX = e.changedTouches[0].clientX;
    const swipeDistance = touchStartXRef.current - touchEndX;
    
    // Check if this is a left swipe (positive distance)
    if (swipeDistance > 50) {
      // Check if we're at the last slide and trying to swipe left
      const slideWidth = container.querySelector('.festival-item')?.clientWidth || 250;
      const gap = 16;
      const totalWidth = slideWidth + gap;
      const maxScroll = (festivals.length - 1) * totalWidth;
      const currentScroll = container.scrollLeft;
      
      // If we're at or near the last slide and swiping left, scroll to first
      if (currentScroll >= maxScroll - 50) {
        setIsAutoScrolling(true);
        
        container.scrollTo({
          left: 0,
          behavior: 'smooth'
        });
        
        setTimeout(() => {
          setIsAutoScrolling(false);
        }, 500);
      }
    }
    
    touchStartXRef.current = null;
    touchStartYRef.current = null;
    isHorizontalScrollRef.current = false;
  };

  // Handle wheel events for desktop for festivals
  const handleWheel = (e: React.WheelEvent) => {
    if (!festivalScrollRef.current || isAutoScrolling) return;

    const container = festivalScrollRef.current;
    const slideWidth = container.querySelector('.festival-item')?.clientWidth || 250;
    const gap = 16;
    const totalWidth = slideWidth + gap;
    const maxScroll = (festivals.length - 1) * totalWidth;
    const currentScroll = container.scrollLeft;
    
    // If scrolling right (positive deltaY) and at the last slide
    if (e.deltaY > 0 && currentScroll >= maxScroll - 10) {
      e.preventDefault();
      setIsAutoScrolling(true);
      
      container.scrollTo({
        left: 0,
        behavior: 'smooth'
      });
      
      setTimeout(() => {
        setIsAutoScrolling(false);
      }, 500);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Header />
      <AuthModal />

      <main className="flex-1">
        <HomeCategoryGrid />
        
        <BrandSpotlight />
        
        {/* Recently Viewed Products Section */}
        {recentlyViewed.length > 0 && (
          <RecentlyViewedProducts products={recentlyViewed} />
        )}
        
        {isFestivalEnabled && (
          <section className="py-6 sm:py-8 md:py-10 bg-gradient-to-r from-amber-50 to-orange-50">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-3">
                  <Gift className="text-orange-600" size={24} />
                  <div>
                    <h2 className="font-sans text-lg sm:text-xl md:text-2xl font-semibold text-gray-900">
                      Festivals and Special Days
                    </h2>
                    <p className="font-sans text-muted-foreground text-xs sm:text-sm mt-1">
                      Celebrate with exclusive collections
                    </p>
                  </div>
                </div>
                
                {festivals && festivals.length > 4 && (
                  <div className="hidden md:flex items-center gap-2">
                    <button 
                      onClick={() => scrollSection(festivalScrollRef, 'left')}
                      className="p-2 rounded-full bg-white border shadow-sm hover:bg-gray-50"
                      aria-label="Scroll left"
                    >
                      <ChevronLeft size={20} className="text-gray-600" />
                    </button>
                    <button 
                      onClick={() => scrollSection(festivalScrollRef, 'right')}
                      className="p-2 rounded-full bg-white border shadow-sm hover:bg-gray-50"
                      aria-label="Scroll right"
                    >
                      <ChevronRight size={20} className="text-gray-600" />
                    </button>
                  </div>
                )}
              </div>

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
                      onTouchStart={handleTouchStart}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                      onWheel={handleWheel}
                    >
                      {festivals.map((festival) => {
                        let imageUrl = festival.image_url;
                        if (imageUrl && imageUrl.includes('drive.google.com')) {
                          const fileId = imageUrl.match(/id=([^&]+)/)?.[1] || 
                                        imageUrl.match(/\/d\/([^\/]+)/)?.[1];
                          if (fileId) {
                            imageUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`;
                          }
                        }

                        return (
                          <div 
                            key={festival.id}
                            className="festival-item flex-shrink-0 w-full sm:w-64 md:w-72 bg-white border overflow-hidden"
                          >
                            <div className={`h-32 ${festival.bg_color} relative`}>
                              <img
                                src={imageUrl}
                                alt={festival.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  console.error('Image failed to load:', imageUrl);
                                  (e.target as HTMLImageElement).src = '/placeholder.svg';
                                  
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
                                <span className="font-sans px-2 py-1 text-xs font-medium bg-white/90 rounded-full text-gray-800">
                                  {festival.offer}
                                </span>
                              </div>
                            </div>
                            
                            <div className="p-4">
                              <h3 className="font-sans font-semibold text-gray-900 text-lg">{festival.title}</h3>
                              <p className="font-sans text-sm text-gray-600 mt-1">{festival.subtitle}</p>
                              
                              <div className="mt-3 pt-3 border-t border-gray-100">
                                <a
                                  href={
                                    festival.custom_link
                                      ? festival.custom_link
                                      : `/products?category=${festival.category || 'festival'}`
                                  }
                                  className="font-sans block w-full py-2 text-sm font-medium text-orange-600 hover:text-orange-700 text-center"
                                >
                                  Shop Collection →
                                </a>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="absolute left-0 top-0 bottom-4 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none"></div>
                    <div className="absolute right-0 top-0 bottom-4 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="font-sans text-gray-500">No festivals available at the moment.</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* A World of Desire Section - NO ANIMATIONS */}
        {desireCategories.length > 0 && (
          <section className="py-8 md:py-16 bg-gradient-to-br from-amber-50 via-white to-amber-50/70">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-gradient-to-br from-amber-50/95 via-white to-amber-50/95 border border-amber-200/40">
                <div className="px-4 sm:px-5 md:px-8 py-6 sm:py-8 md:py-10">
                  <div className="flex justify-between items-start mb-6 sm:mb-8 md:mb-10">
                    <div>
                      <h1 className="font-sans text-lg sm:text-xl md:text-2xl font-normal text-gray-900">
                        A World of <span className="font-sans font-semibold text-amber-800">Desire</span>
                      </h1>
                      <div className="h-px w-12 sm:w-16 md:w-20 bg-gradient-to-r from-amber-500 to-transparent mt-1"></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                    {desireCategories.map((category, index) => {
                      const colorSchemes = [
                        { bg: 'from-amber-50 to-amber-100/40', border: 'border-amber-300', badgeFrom: 'from-amber-600', badgeTo: 'to-amber-700', accent: 'amber-500' },
                        { bg: 'from-orange-50 to-orange-100/40', border: 'border-orange-200', badgeFrom: 'from-orange-600', badgeTo: 'to-orange-700', accent: 'orange-500' },
                        { bg: 'from-yellow-50 to-yellow-100/40', border: 'border-yellow-200', badgeFrom: 'from-yellow-600', badgeTo: 'to-yellow-700', accent: 'yellow-500' },
                        { bg: 'from-red-50 to-red-100/40', border: 'border-red-200', badgeFrom: 'from-red-600', badgeTo: 'to-red-700', accent: 'red-500' }
                      ];
                      
                      const colors = colorSchemes[index % colorSchemes.length];
                      
                      return (
                        <div
                          key={category.id}
                          className={`bg-gradient-to-br ${colors.bg} border ${colors.border} shadow-sm`}
                        >
                          <Link
                            to={category.link}
                            className="block"
                            aria-label={`Explore ${category.title} collection`}
                          >
                            <div className={`aspect-square overflow-hidden bg-gradient-to-br ${colors.bg}`}>
                              <img
                                src={category.image_url}
                                alt={category.title}
                                loading="lazy"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/placeholder.svg';
                                }}
                              />
                              
                              {category.offer && (
                                <div className="absolute top-1.5 left-1.5">
                                  <div className={`px-1.5 py-0.5 bg-gradient-to-r ${colors.badgeFrom} ${colors.badgeTo} shadow-sm`}>
                                    <span className="font-sans text-[10px] font-semibold text-white uppercase tracking-wide">
                                      {category.offer}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <div className="p-2 sm:p-3 border-t border-white/50 bg-gradient-to-b from-white/90 to-transparent">
                              <div className="flex items-center justify-between mb-0.5">
                                <h3 className={`font-sans text-xs sm:text-sm font-normal text-gray-900 truncate`}>
                                  {category.title}
                                </h3>
                                <svg className={`w-2.5 h-2.5 text-${colors.accent}/60 flex-shrink-0 ml-0.5`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                              </div>
                              
                              <div className={`h-px w-full bg-gradient-to-r from-transparent via-${colors.accent}/10 to-transparent my-1 sm:my-1.5`} />
                              
                              <div className="flex items-center justify-between">
                                <span className="font-sans text-[10px] text-gray-600 font-light truncate pr-1">
                                  View Collection
                                </span>
                              </div>
                            </div>
                          </Link>
                        </div>
                      );
                    })}
                  </div>

                  <div className="text-center mt-6 sm:mt-8 md:mt-10 pt-4 sm:pt-5 border-t border-amber-200/40">
                    <div className="relative inline-block">
                      <Link
                        to="/products"
                        className="font-sans inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-1.5 sm:py-2 bg-gradient-to-r from-amber-100 to-amber-50 border border-amber-300 text-amber-800 hover:bg-gradient-to-r hover:from-amber-200 hover:to-amber-100 rounded-full text-xs sm:text-sm"
                        aria-label="Explore all luxury collections"
                      >
                        <span className="font-sans font-medium tracking-wide whitespace-nowrap">
                          View All Collections
                        </span>
                        <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </Link>
                    </div>
                    
                    <div className="mt-2 sm:mt-3">
                      <p className="font-sans text-[10px] sm:text-xs text-amber-700/60 italic">
                        "True luxury is found in the details"
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* TRENDING SLIDE DECK SECTION */}
        <TrendingSlideDeck />


        {/* 🎯 EXCLUSIVE DROPS SECTION */}
        <ExclusiveDrops />

        {/* 🎯 FASHION FORECAST SECTION */}
        <FashionForecast />

        <section className="py-8 sm:py-12 md:py-20">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-6 sm:mb-8 md:mb-12">
              <div>
                <h2 className="font-sans text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold mb-1">
                  Featured Products
                </h2>
                <p className="font-sans text-muted-foreground text-xs sm:text-sm md:text-base">
                  Handpicked for you
                </p>
              </div>
              <Link to="/products" className="font-sans hidden md:flex items-center gap-2 text-sm font-medium link-underline">
                VIEW ALL <ArrowRight size={16} />
              </Link>
            </div>

            {isLoading ? (
              <div className="font-sans text-center py-12 sm:py-20">Loading products...</div>
            ) : featuredProducts.length === 0 ? (
              <div className="font-sans text-center py-12 sm:py-20">No products found.</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                {featuredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            <div className="text-center mt-6 sm:mt-8 md:hidden">
              <Link to="/products" className="font-sans btn-outline inline-flex items-center gap-2 text-xs sm:text-sm py-2 px-4 sm:py-3 sm:px-6">
                VIEW ALL <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>

        <section className="py-12 sm:py-20 md:py-32 bg-charcoal text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <p className="font-sans text-yellow-300 text-[10px] sm:text-xs md:text-sm tracking-[0.1em] sm:tracking-[0.2em] md:tracking-[0.3em] mb-2 sm:mb-3 md:mb-4">
              LIMITED TIME OFFER
            </p>
            <h2 className="font-sans text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 md:mb-6">
              Up to 40% Off
            </h2>
            <p className="font-sans text-primary-foreground/70 mb-4 sm:mb-6 md:mb-8 max-w-md mx-auto text-[10px] sm:text-xs md:text-sm">
              Don't miss our seasonal sale. Shop now and save on premium styles.
            </p>
            <Link to="/products?sale=true" className="font-sans btn-gold py-2.5 sm:py-3 px-6 sm:px-8 text-xs sm:text-sm">
              SHOP SALE
            </Link>
          </div>
        </section>

        {newArrivals.length > 0 && (
          <section className="py-8 sm:py-12 md:py-20">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between mb-6 sm:mb-8 md:mb-12">
                <div>
                  <h2 className="font-sans text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold mb-1">
                    New Arrivals
                  </h2>
                  <p className="font-sans text-muted-foreground text-xs sm:text-sm md:text-base">
                    Just landed this week
                  </p>
                </div>
                <Link to="/products" className="font-sans hidden md:flex items-center gap-2 text-sm font-medium link-underline">
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

        <section className="py-8 sm:py-12 md:py-20 bg-cream">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-sans text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold mb-2 sm:mb-3 md:mb-4">
              Join Our Newsletter
            </h2>
            <p className="font-sans text-muted-foreground mb-4 sm:mb-6 md:mb-8 max-w-md mx-auto text-xs sm:text-sm md:text-base">
              Subscribe to receive updates on new arrivals, exclusive offers, and styling tips.
            </p>
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="font-sans flex-1 px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 border border-border bg-background text-xs sm:text-sm focus:border-primary rounded"
              />
              <button type="submit" className="font-sans btn-primary whitespace-nowrap py-2.5 sm:py-3 text-xs sm:text-sm">
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