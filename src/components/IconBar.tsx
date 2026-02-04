import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface IconBarItem {
  id: string;
  icon_url: string;
  label: string;
  url: string;
  order: number;
}

const IconBar = () => {
  const [items, setItems] = useState<IconBarItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIconBarItems();
  }, []);

  const fetchIconBarItems = async () => {
    try {
      // Try localStorage first
      const savedItems = localStorage.getItem("iconBarItems");
      if (savedItems) {
        const parsedItems = JSON.parse(savedItems);
        setItems(parsedItems.sort((a: IconBarItem, b: IconBarItem) => a.order - b.order));
      }
      
      // If no items in localStorage, use mock data
      if (!savedItems || JSON.parse(savedItems).length === 0) {
        const mockItems = [
          { id: "1", icon_url: "📱", label: "Mobiles", url: "/products?category=electronics", order: 0 },
          { id: "2", icon_url: "👕", label: "Fashion", url: "/products?category=fashion", order: 1 },
          { id: "3", icon_url: "🏠", label: "Home", url: "/products?category=home", order: 2 },
          { id: "4", icon_url: "💄", label: "Beauty", url: "/products?category=beauty", order: 3 },
          { id: "5", icon_url: "💻", label: "Electronics", url: "/products?category=electronics", order: 4 },
        ];
        setItems(mockItems);
      }
    } catch (error) {
      console.error("Failed to fetch icon bar items:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || items.length === 0) return null;

  return (
    <div className="bg-white border-b shadow-sm">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between overflow-x-auto scrollbar-hide">
          {items.map((item) => (
            <Link
              key={item.id}
              to={item.url}
              className="flex flex-col items-center min-w-20 px-2 py-1 hover:text-primary transition-colors"
            >
              <div className="w-10 h-10 flex items-center justify-center mb-1">
                {item.icon_url.includes("http") || item.icon_url.startsWith("/") ? (
                  <img
                    src={item.icon_url}
                    alt={item.label}
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder-icon.png";
                    }}
                  />
                ) : (
                  <span className="text-2xl">{item.icon_url}</span>
                )}
              </div>
              <span className="text-xs text-center font-medium whitespace-nowrap">
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default IconBar;