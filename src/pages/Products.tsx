import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import { SlidersHorizontal, X } from "lucide-react";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import AuthModal from "@/components/AuthModal";

import { categories } from "@/data/products";
import { useProducts } from "@/hooks/useProducts";

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const { data: products = [] } = useProducts();

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);
  const [sortBy, setSortBy] = useState("newest");

  // ✅ REAL PRODUCT COUNT CALCULATION FUNCTION
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
        (categoryLower === "watches" && (productCategory === "watches" || productSubcategory === "watches")) ||
        (categoryLower === "tshirts" && (productCategory === "t-shirts" || productSubcategory === "tshirts")) ||
        (categoryLower === "shoes" && (productCategory === "shoes" || productSubcategory === "footwear"))
      );
    }).length;
  };

  // Check if we have state from navigation (for opening specific category)
  useEffect(() => {
    if (location.state?.openCategory) {
      const category = location.state.openCategory;
      const newParams = new URLSearchParams(searchParams);
      newParams.set("category", category);
      setSearchParams(newParams);
    }
    
    if (location.state?.sale) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set("sale", "true");
      setSearchParams(newParams);
    }
  }, [location.state]);

  // 🔥 URL IS SOURCE OF TRUTH
  const selectedCategory = searchParams.get("category");
  const isSale = searchParams.get("sale") === "true";
  const searchTerm = (searchParams.get("search") || "")
    .toLowerCase()
    .trim();

  /* ================= URL HELPERS ================= */
  const setSelectedCategory = (category: string | null) => {
    const newParams = new URLSearchParams(searchParams);

    if (category) {
      newParams.set("category", category.toLowerCase());
    } else {
      newParams.delete("category");
    }

    newParams.delete("sale");
    newParams.delete("search");
    setSearchParams(newParams);
  };

  const formatCategoryName = (cat: string | null) => {
    if (!cat) return "All Products";
    return cat.charAt(0).toUpperCase() + cat.slice(1);
  };

  const clearAllFilters = () => {
    setSearchParams({});
    setPriceRange([0, 50000]);
    setSortBy("newest");
  };

  /* ================= ENHANCED FILTER LOGIC ================= */
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // 🔍 SEARCH FIRST
    if (searchTerm) {
      filtered = filtered.filter((p) => {
        return (
          p.name?.toLowerCase().includes(searchTerm) ||
          p.category?.toLowerCase().includes(searchTerm) ||
          p.gender?.toLowerCase().includes(searchTerm) ||
          p.subcategory?.toLowerCase().includes(searchTerm) ||
          p.tags?.some((tag: string) =>
            tag.toLowerCase().includes(searchTerm)
          )
        );
      });
    }
    // 📂 CATEGORY FILTER
    else if (selectedCategory) {
      const cat = selectedCategory.toLowerCase();

      filtered = filtered.filter((p) => {
        const productCategory = p.category?.toLowerCase() || "";
        const productGender = p.gender?.toLowerCase() || "";
        const productSubcategory = p.subcategory?.toLowerCase() || "";
        const productTags = p.tags?.map((tag: string) => tag.toLowerCase()) || [];

        return (
          productCategory === cat ||
          productGender === cat ||
          productSubcategory === cat ||
          productCategory.includes(cat) ||
          productGender.includes(cat) ||
          productSubcategory.includes(cat) ||
          productTags.some(tag => tag.includes(cat)) ||
          (cat === "men" && (productGender === "men" || productGender === "male")) ||
          (cat === "women" && (productGender === "women" || productGender === "female")) ||
          (cat === "watches" && (productCategory === "watches" || productSubcategory === "watches")) ||
          (cat === "tshirts" && (productCategory === "t-shirts" || productSubcategory === "tshirts")) ||
          (cat === "shoes" && (productCategory === "shoes" || productSubcategory === "footwear"))
        );
      });
    }

    // 🔥 SALE FILTER
    if (isSale) {
      filtered = filtered.filter((p) => p.is_on_sale);
    }

    // 💰 PRICE FILTER
    filtered = filtered.filter(
      (p) => p.price >= priceRange[0] && p.price <= priceRange[1]
    );

    // 🔃 SORT
    switch (sortBy) {
      case "price-low":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }

    return filtered;
  }, [products, selectedCategory, isSale, searchTerm, priceRange, sortBy]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header activeCategory={selectedCategory || undefined} />
      <AuthModal />

      <main className="flex-1">
        {/* HEADER */}
        <div className="bg-cream py-12">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-semibold">
              {isSale
                ? "Sale"
                : searchTerm
                ? `Search results for "${searchTerm}"`
                : formatCategoryName(selectedCategory)}
            </h1>
            <p className="text-muted-foreground mt-2">
              {filteredProducts.length} products
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* TOOLBAR */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center gap-2 text-sm font-medium"
            >
              <SlidersHorizontal size={18} />
              FILTERS
            </button>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-sm bg-transparent border border-border px-4 py-2 rounded"
            >
              <option value="newest">Newest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name">Name</option>
            </select>
          </div>

          <div className="flex gap-8">
            {/* SIDEBAR */}
            <aside
              className={`${
                isFilterOpen ? "block" : "hidden"
              } lg:block w-full lg:w-64`}
            >
              <div className="space-y-8">
                <div className="flex justify-between lg:hidden">
                  <h3 className="font-medium">Filters</h3>
                  <button onClick={() => setIsFilterOpen(false)}>
                    <X size={20} />
                  </button>
                </div>

                {/* CATEGORIES */}
                <div className="bg-white p-4 rounded-lg border">
                  <h4 className="text-sm font-semibold mb-4 text-gray-800 uppercase tracking-wide">
                    CATEGORIES
                  </h4>

                  <div className="space-y-3">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className={`w-full flex items-center justify-between p-2 rounded transition-all ${
                        !selectedCategory
                          ? "bg-primary/10 text-primary font-medium border-l-4 border-primary pl-3"
                          : "text-gray-700 hover:bg-gray-50 hover:text-primary"
                      }`}
                    >
                      <span>All Products</span>
                      {!selectedCategory && (
                        <span className="bg-primary text-white text-xs px-2 py-1 rounded-full">
                          {products.length}
                        </span>
                      )}
                    </button>

                    {categories.map((cat) => {
                      const isActive =
                        selectedCategory?.toLowerCase() ===
                        cat.name.toLowerCase();

                      // ✅ USING REAL COUNT CALCULATION
                      const categoryProductCount = getCategoryCount(cat.name);

                      return (
                        <button
                          key={cat.name}
                          onClick={() => setSelectedCategory(cat.name)}
                          className={`w-full flex items-center justify-between p-2 rounded transition-all ${
                            isActive
                              ? "bg-primary/10 text-primary font-medium border-l-4 border-primary pl-3"
                              : "text-gray-700 hover:bg-gray-50 hover:text-primary"
                          }`}
                        >
                          <span>{cat.name}</span>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              isActive
                                ? "bg-primary text-white"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {categoryProductCount}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* SALE FILTER */}
                <div className="bg-white p-4 rounded-lg border">
                  <h4 className="text-sm font-semibold mb-4 text-gray-800 uppercase tracking-wide">
                    SPECIAL OFFERS
                  </h4>

                  <button
                    onClick={() => {
                      const newParams = new URLSearchParams(searchParams);
                      if (isSale) {
                        newParams.delete("sale");
                      } else {
                        newParams.set("sale", "true");
                        newParams.delete("category");
                        newParams.delete("search");
                      }
                      setSearchParams(newParams);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded transition-all ${
                      isSale
                        ? "bg-red-50 text-red-700 font-medium border-l-4 border-red-500 pl-3"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span>On Sale</span>
                    {isSale && (
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        Sale
                      </span>
                    )}
                  </button>
                </div>

                {/* CLEAR */}
                <button
                  onClick={clearAllFilters}
                  className="w-full py-3 border border-gray-300 text-gray-700 font-medium rounded hover:bg-gray-50 transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            </aside>

            {/* PRODUCTS */}
            <div className="flex-1">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-gray-600 mb-6 text-lg font-medium">
                    No products found
                  </p>
                  <button
                    onClick={clearAllFilters}
                    className="px-6 py-3 bg-primary text-white font-medium rounded hover:bg-primary/90 transition-colors"
                  >
                    CLEAR FILTERS
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                      />
                    ))}
                  </div>

                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <p className="text-sm text-gray-600 text-center">
                      Showing {filteredProducts.length} of{" "}
                      {products.length} products
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Products;