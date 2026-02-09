import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles } from "lucide-react";

const BrandSpotlight = () => {
  const { data: brands = [] } = useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brands")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  if (!brands.length) return null;

  return (
    <section className="py-6 bg-gradient-to-b from-white to-blue-50/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-1 mb-1 px-2 py-0.5 bg-gradient-to-r from-blue-50 to-purple-50 rounded-full">
            <Sparkles className="w-2.5 h-2.5 text-purple-500" />
            <span className="text-[10px] font-medium text-purple-600">Featured</span>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-0.5">
            Brands in <span className="text-blue-600">Spotlight</span>
          </h2>
          <p className="text-xs text-gray-600">Discover our curated collection of premium brands</p>
        </div>

        {/* Horizontal scroll container with TINY white boxes */}
        <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-hide">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              to={`/products?category=${brand.category}&brand=${brand.slug}`}
              className="group bg-white rounded border border-gray-200 p-2 text-center hover:shadow hover:border-blue-200 flex-shrink-0 w-32"
            >
              <div className="w-16 h-16 mx-auto mb-1.5 rounded bg-gray-50 border border-gray-100 overflow-hidden p-1">
                <img
                  src={brand.image_url}
                  alt={brand.name}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                />
              </div>
              
              <p className="text-xs font-medium text-gray-800 truncate">{brand.name}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{brand.category}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BrandSpotlight;