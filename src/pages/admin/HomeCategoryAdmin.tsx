import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CategoryItem {
  id: string;
  title: string;
  image: string;
  link: string;
  is_active: boolean;
}

const HomeCategoryAdmin = () => {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [title, setTitle] = useState("");
  const [image, setImage] = useState("");
  const [link, setLink] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Helper function to convert Google Drive URL to embeddable format
  const convertDriveUrl = (url: string) => {
    if (!url) return "";
    
    // If it's already a direct image URL or not a drive URL, return as is
    if (!url.includes("drive.google.com")) return url;
    
    // Handle different Google Drive URL formats
    if (url.includes("/file/d/")) {
      // Extract file ID from URL
      const match = url.match(/\/file\/d\/([^/]+)/);
      if (match && match[1]) {
        return `https://drive.google.com/uc?export=view&id=${match[1]}`;
      }
    } else if (url.includes("id=")) {
      // Handle URL with id parameter
      const match = url.match(/id=([^&]+)/);
      if (match && match[1]) {
        return `https://drive.google.com/uc?export=view&id=${match[1]}`;
      }
    }
    
    return url;
  };

  // 🔄 LOAD CATEGORIES
  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("home_categories")
      .select("*")
      .order("sort_order");

    if (!error && data) {
      setCategories(data);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // ➕ CREATE / ✏️ UPDATE
  const saveCategory = async () => {
    if (!title || !image || !link) {
      alert("All fields required!");
      return;
    }

    setLoading(true);

    // Convert Google Drive URL if needed
    const processedImage = convertDriveUrl(image);

    if (editingId) {
      // UPDATE
      const { error } = await supabase
        .from("home_categories")
        .update({ 
          title, 
          image: processedImage, 
          link 
        })
        .eq("id", editingId);

      if (!error) {
        alert("Category Updated!");
      } else {
        console.error("Update error:", error);
        alert("Error updating category");
      }
    } else {
      // CREATE
      const { error } = await supabase
        .from("home_categories")
        .insert([{ 
          title, 
          image: processedImage, 
          link 
        }]);

      if (!error) {
        alert("Category Added!");
      } else {
        console.error("Create error:", error);
        alert("Error adding category");
      }
    }

    setTitle("");
    setImage("");
    setLink("");
    setEditingId(null);
    setLoading(false);
    fetchCategories();
  };

  // 🗑 DELETE
  const deleteCategory = async (id: string) => {
    if (!confirm("Delete this category?")) return;

    const { error } = await supabase
      .from("home_categories")
      .delete()
      .eq("id", id);
    
    if (error) {
      console.error("Delete error:", error);
      alert("Error deleting category");
    } else {
      fetchCategories();
    }
  };

  // 👁 ACTIVE TOGGLE
  const toggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from("home_categories")
      .update({ is_active: !current })
      .eq("id", id);

    if (error) {
      console.error("Toggle error:", error);
      alert("Error updating status");
    } else {
      fetchCategories();
    }
  };

  // ✏️ EDIT MODE
  const startEdit = (cat: CategoryItem) => {
    setTitle(cat.title);
    setImage(cat.image);
    setLink(cat.link);
    setEditingId(cat.id);
  };

  // Handle image error - fallback to original URL
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const src = img.src;
    
    // If it's a Google Drive converted URL and fails, try the original
    if (src.includes("drive.google.com/uc")) {
      // Try with different parameters
      const idMatch = src.match(/id=([^&]+)/);
      if (idMatch) {
        // Try direct thumbnail URL
        img.src = `https://lh3.googleusercontent.com/d/${idMatch[1]}=s400`;
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* FORM */}
      <div className="max-w-xl space-y-3">
        <h1 className="text-2xl font-bold">
          {editingId ? "Edit Category" : "Create Category"}
        </h1>

        <input
          placeholder="Category Title"
          className="w-full border p-2 rounded"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <input
          placeholder="Image URL"
          className="w-full border p-2 rounded"
          value={image}
          onChange={(e) => setImage(e.target.value)}
        />

        <input
          placeholder="Product Link (ex: /products?category=shirts)"
          className="w-full border p-2 rounded"
          value={link}
          onChange={(e) => setLink(e.target.value)}
        />

        <button
          onClick={saveCategory}
          disabled={loading}
          className="bg-black text-white px-4 py-2 rounded"
        >
          {loading
            ? "Saving..."
            : editingId
            ? "Update Category"
            : "Create Category"}
        </button>

        {editingId && (
          <button
            onClick={() => {
              setEditingId(null);
              setTitle("");
              setImage("");
              setLink("");
            }}
            className="ml-3 text-sm underline"
          >
            Cancel Edit
          </button>
        )}
      </div>

      {/* LIST - Smaller cards like in your original design */}
      <div className="bg-background border rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-3">All Categories</h2>

        {categories.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No categories created yet.
          </p>
        )}

        <div className="space-y-3">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center gap-4 border rounded p-3"
            >
              <div className="w-14 h-14 rounded overflow-hidden bg-muted flex-shrink-0">
                <img
                  src={cat.image}
                  alt={cat.title}
                  className="w-full h-full object-cover"
                  onError={handleImageError}
                />
              </div>

              <div className="flex-1">
                <p className="font-medium">{cat.title}</p>
                <p className="text-xs text-muted-foreground">{cat.link}</p>
                <p
                  className={`text-xs ${
                    cat.is_active ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {cat.is_active ? "Active" : "Inactive"}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(cat)}
                  className="px-3 py-1 text-xs rounded bg-blue-600 text-white"
                >
                  Edit
                </button>

                <button
                  onClick={() => toggleActive(cat.id, cat.is_active)}
                  className="px-3 py-1 text-xs rounded bg-yellow-500 text-black"
                >
                  {cat.is_active ? "Disable" : "Enable"}
                </button>

                <button
                  onClick={() => deleteCategory(cat.id)}
                  className="px-3 py-1 text-xs rounded bg-red-600 text-white"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomeCategoryAdmin;