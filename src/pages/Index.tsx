import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import AuthModal from '@/components/AuthModal';
import { categories } from '@/data/products';
import { useProducts } from '@/hooks/useProducts';
import HomeCategoryGrid from '@/components/HomeCategoryGrid';

const Index = () => {
  const { data: products = [], isLoading } = useProducts();
  const featuredProducts = products.slice(0, 4);
  const newArrivals = products.filter((p) => p.is_new);

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

  // ✅ Updated categories with real counts - ADDED KIDS CATEGORY
  const updatedCategories = [
    ...categories,
    // Add Kids category if not already in categories array
    ...(categories.some(cat => cat.name.toLowerCase() === 'kids') ? [] : [{
      name: 'Kids',
      image: 'https://www.kidrovia.com/wp-content/uploads/2024/02/Kidrovia.png', // Kids fashion image
      count: getCategoryCount('Kids')
    }])
  ].map(cat => ({
    ...cat,
    count: getCategoryCount(cat.name)
  }));

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <AuthModal />

      <main className="flex-1">
        {/* ✅ ADDED: Home Category Strip */}
        <HomeCategoryGrid />

        {/* Categories Section */}
        <section className="py-8 sm:py-12 md:py-20 bg-cream">
          <div className="container mx-auto px-4">
            <div className="text-center mb-6 sm:mb-8 md:mb-12">
              <h2 className="font-heading text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold mb-1 sm:mb-2 md:mb-4">
                Shop by Category
              </h2>
              <p className="text-muted-foreground text-xs sm:text-sm md:text-base">
                Find your perfect style
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              {updatedCategories.map((category) => (
                <Link
                  key={category.name}
                  to={`/products?category=${category.name.toLowerCase()}`}
                  className="group relative h-[150px] sm:h-[200px] md:h-[300px] lg:h-[400px] overflow-hidden rounded-lg"
                >
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/70 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 md:p-6 lg:p-8 text-primary-foreground">
                    <h3 className="font-heading text-sm sm:text-base md:text-lg lg:text-xl font-semibold mb-1">
                      {category.name}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-primary-foreground/70 mb-1 sm:mb-2 md:mb-4">
                      {category.count} Products
                    </p>
                    <span className="hidden sm:inline-flex items-center gap-2 text-xs sm:text-sm font-medium group-hover:gap-4 transition-all">
                      SHOP NOW <ArrowRight size={14} />
                    </span>
                  </div>
                </Link>
              ))}
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