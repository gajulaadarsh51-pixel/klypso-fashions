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
        
// pages/Index.tsx (Festival Section Only - Updated Part)
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