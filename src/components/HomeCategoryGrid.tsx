import { Link } from "react-router-dom";
import { useHomeCategories } from "@/hooks/useHomeCategories";
import { CategoryItem } from "@/hooks/useHomeCategories";

const HomeCategoryGrid = () => {
  const { data: categories = [], isLoading, error } = useHomeCategories();

  // Handle Google Drive image errors
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const src = img.src;
    
    // If it's a Google Drive URL and fails, try alternative formats
    if (src.includes("drive.google.com")) {
      const idMatch = src.match(/id=([^&]+)/);
      if (idMatch) {
        // Try different Google Drive URL formats
        const fileId = idMatch[1];
        
        // Format 1: Direct thumbnail
        img.src = `https://lh3.googleusercontent.com/d/${fileId}=s400`;
        
        // If that fails, the onError will fire again and we'll try next format
        img.onerror = () => {
          // Format 2: Web content link
          img.src = `https://drive.google.com/uc?export=download&id=${fileId}`;
          
          img.onerror = () => {
            // Format 3: View link
            img.src = `https://drive.google.com/file/d/${fileId}/view`;
          };
        };
      }
    }
  };

  if (isLoading) {
    return (
      <section className="py-3">
        <div className="px-4">
          {/* Mobile loading skeleton */}
          <div className="md:hidden overflow-x-auto scrollbar-hide">
            <div
              className="grid grid-rows-2 grid-flow-col gap-3"
              style={{ gridAutoColumns: "72px" }}
            >
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl bg-gradient-to-br from-gray-100 to-gray-200
                             p-2 animate-pulse"
                >
                  <div className="h-10 w-full bg-gray-300 rounded mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded"></div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Desktop loading skeleton */}
          <div className="hidden md:grid grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="rounded-xl bg-gradient-to-br from-gray-100 to-gray-200
                           p-4 animate-pulse"
              >
                <div className="h-6 bg-gray-300 rounded mb-3"></div>
                <div className="h-24 bg-gray-300 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <div className="py-4 text-center text-sm text-muted-foreground">
        Failed to load categories
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="py-4 text-center text-sm text-muted-foreground">
        No categories available
      </div>
    );
  }

  return (
    <section className="py-3">
      <div className="px-4">
        {/* MOBILE VIEW - 2 rows with horizontal scroll (like in your image) */}
        <div className="md:hidden overflow-x-auto scrollbar-hide">
          <div
            className="grid grid-rows-2 grid-flow-col gap-3"
            style={{ gridAutoColumns: "72px" }}
          >
            {categories.map((cat: CategoryItem) => (
              <Link
                key={cat.id}
                to={cat.link}
                className="rounded-xl bg-gradient-to-br from-pink-50 to-orange-50
                           p-2 flex flex-col items-center justify-between
                           hover:shadow-sm transition-shadow"
              >
                <div className="h-10 w-full flex items-center justify-center">
                  <img
                    src={cat.image}
                    alt={cat.title}
                    className="max-h-full object-contain"
                    loading="lazy"
                    onError={handleImageError}
                  />
                </div>

                <div className="flex items-center justify-between w-full text-[11px] font-semibold text-gray-800 mt-1">
                  <span className="truncate">{cat.title}</span>
                  <span className="text-gray-400">›</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* DESKTOP VIEW */}
        <div className="hidden md:grid grid-cols-5 gap-4">
          {categories.map((cat: CategoryItem) => (
            <Link
              key={cat.id}
              to={cat.link}
              className="rounded-2xl bg-gradient-to-br from-pink-50 to-orange-50
                         p-4 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between text-sm font-semibold text-gray-800 mb-2">
                <span>{cat.title}</span>
                <span className="text-gray-400">›</span>
              </div>

              <div className="h-28 flex items-center justify-center">
                <img
                  src={cat.image}
                  alt={cat.title}
                  className="max-h-full object-contain"
                  onError={handleImageError}
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeCategoryGrid;