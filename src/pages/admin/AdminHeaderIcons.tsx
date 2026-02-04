import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Edit, Trash2, Check, X, MoveUp, MoveDown } from "lucide-react";

interface IconItem {
  id: string;
  title: string;
  image_url: string;
  link_url: string;
  badge_text?: string;
  badge_color?: string;
  sort_order: number;
  is_active: boolean;
}

const AdminHeaderIcons = () => {
  const [icons, setIcons] = useState<IconItem[]>([]);
  const [form, setForm] = useState({
    title: "",
    image_url: "",
    link_url: "",
    badge_text: "",
    badge_color: "#ff3b30",
    sort_order: 0,
    is_active: true,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Enhanced Google Drive URL converter
  const convertDriveUrl = (url: string) => {
    if (!url || typeof url !== 'string') return "";
    
    // If it's already a direct image URL or not a drive URL, return as is
    if (!url.includes("drive.google.com")) return url.trim();
    
    // Clean URL - remove any URL parameters after view
    const cleanUrl = url.split('?')[0];
    
    // Handle different Google Drive URL formats
    let fileId = "";
    
    // Format 1: https://drive.google.com/file/d/1QOzkXSP4Mwkzy7DV7gPgyTfKH7qzTahG/view
    const fileIdMatch = cleanUrl.match(/\/file\/d\/([^\/]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
      fileId = fileIdMatch[1];
    }
    
    // Format 2: https://drive.google.com/uc?id=...
    const idMatch = url.match(/[?&]id=([^&]+)/);
    if (idMatch && idMatch[1]) {
      fileId = idMatch[1];
    }
    
    // If no file ID found, return original URL
    if (!fileId) return url.trim();
    
    // Return direct image URL
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  };

  // Get Google Drive thumbnail URL
  const getDriveThumbnailUrl = (fileId: string, size = "400") => {
    return `https://lh3.googleusercontent.com/d/${fileId}=w${size}?authuser=0`;
  };

  useEffect(() => {
    loadIcons();
  }, []);

  const loadIcons = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("header_icons")
      .select("*")
      .order("sort_order", { ascending: true });

    if (!error && data) setIcons(data);
    setLoading(false);
  };

  const resetForm = () => {
    setForm({
      title: "",
      image_url: "",
      link_url: "",
      badge_text: "",
      badge_color: "#ff3b30",
      sort_order: icons.length,
      is_active: true,
    });
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!form.title || !form.image_url || !form.link_url) {
      alert("Please fill all required fields: Title, Image URL, and Link URL");
      return;
    }

    setLoading(true);
    
    try {
      // Convert Google Drive URL if needed
      const processedImageUrl = convertDriveUrl(form.image_url);

      if (editingId) {
        // Update existing icon
        const { error } = await supabase
          .from("header_icons")
          .update({
            ...form,
            image_url: processedImageUrl
          })
          .eq("id", editingId);

        if (error) throw error;
      } else {
        // Add new icon
        const { error } = await supabase.from("header_icons").insert([{
          ...form,
          image_url: processedImageUrl,
          sort_order: icons.length,
        }]);

        if (error) throw error;
      }

      resetForm();
      await loadIcons();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (icon: IconItem) => {
    setForm({
      title: icon.title,
      image_url: icon.image_url,
      link_url: icon.link_url,
      badge_text: icon.badge_text || "",
      badge_color: icon.badge_color || "#ff3b30",
      sort_order: icon.sort_order,
      is_active: icon.is_active,
    });
    setEditingId(icon.id);
  };

  const toggleActive = async (icon: IconItem) => {
    setLoading(true);
    await supabase
      .from("header_icons")
      .update({ is_active: !icon.is_active })
      .eq("id", icon.id);

    await loadIcons();
    setLoading(false);
  };

  const deleteIcon = async (id: string) => {
    if (!confirm("Are you sure you want to delete this icon?")) return;
    
    setLoading(true);
    await supabase.from("header_icons").delete().eq("id", id);
    await loadIcons();
    setLoading(false);
  };

  const moveIcon = async (id: string, direction: 'up' | 'down') => {
    const currentIndex = icons.findIndex(icon => icon.id === id);
    if (currentIndex === -1) return;

    let targetIndex;
    if (direction === 'up' && currentIndex > 0) {
      targetIndex = currentIndex - 1;
    } else if (direction === 'down' && currentIndex < icons.length - 1) {
      targetIndex = currentIndex + 1;
    } else {
      return;
    }

    // Swap sort_order values
    const updatedIcons = [...icons];
    const tempOrder = updatedIcons[currentIndex].sort_order;
    updatedIcons[currentIndex].sort_order = updatedIcons[targetIndex].sort_order;
    updatedIcons[targetIndex].sort_order = tempOrder;

    setLoading(true);
    try {
      await supabase
        .from("header_icons")
        .update({ sort_order: updatedIcons[currentIndex].sort_order })
        .eq("id", updatedIcons[currentIndex].id);

      await supabase
        .from("header_icons")
        .update({ sort_order: updatedIcons[targetIndex].sort_order })
        .eq("id", updatedIcons[targetIndex].id);

      await loadIcons();
    } catch (error: any) {
      alert(`Error reordering: ${error.message}`);
    }
    setLoading(false);
  };

  // Enhanced image error handler for Google Drive
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>, originalUrl: string) => {
    const img = e.currentTarget as HTMLImageElement;
    
    // If it's a Google Drive URL
    if (originalUrl.includes("drive.google.com")) {
      // Extract file ID from the original URL
      const fileIdMatch = originalUrl.match(/\/file\/d\/([^\/]+)/) || originalUrl.match(/[?&]id=([^&]+)/);
      if (fileIdMatch && fileIdMatch[1]) {
        const fileId = fileIdMatch[1];
        
        // Try Google Drive thumbnail URL
        img.src = getDriveThumbnailUrl(fileId, "400");
        
        // If thumbnail fails, try direct download URL
        img.onerror = () => {
          img.src = `https://drive.google.com/uc?export=download&id=${fileId}`;
          
          // If download URL fails, try alternative thumbnail
          img.onerror = () => {
            img.src = `https://lh3.googleusercontent.com/d/${fileId}=s400`;
            
            // Final fallback to placeholder
            img.onerror = () => {
              img.src = "https://via.placeholder.com/40/cccccc/969696?text=Icon";
            };
          };
        };
      } else {
        // Fallback to placeholder
        img.src = "https://via.placeholder.com/40/cccccc/969696?text=Icon";
      }
    } else {
      // For non-Google Drive URLs, use placeholder
      img.src = "https://via.placeholder.com/40/cccccc/969696?text=Icon";
    }
  };

  // Extract file ID for testing
  const extractFileId = (url: string) => {
    const match = url.match(/\/file\/d\/([^\/]+)/) || url.match(/[?&]id=([^&]+)/);
    return match ? match[1] : null;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          🔥 Header Icons Manager
        </h1>
        {editingId && (
          <button
            onClick={resetForm}
            className="flex items-center gap-2 px-4 py-2 text-sm border rounded hover:bg-gray-50"
          >
            <X size={16} />
            Cancel Edit
          </button>
        )}
      </div>

      {/* Google Drive URL Helper */}
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-medium mb-2 text-blue-700">📌 Google Drive URL Help:</h3>
        <p className="text-sm text-blue-600 mb-2">
          For Google Drive URLs like: <code className="bg-blue-100 px-1 py-0.5 rounded">https://drive.google.com/file/d/1QOzkXSP4Mwkzy7DV7gPgyTfKH7qzTahG/view?usp=sharing</code>
        </p>
        <p className="text-sm text-blue-600">
          The system will automatically convert it to: <code className="bg-blue-100 px-1 py-0.5 rounded">https://drive.google.com/uc?export=view&id=1QOzkXSP4Mwkzy7DV7gPgyTfKH7qzTahG</code>
        </p>
      </div>

      {/* ADD/EDIT FORM */}
      <div className="mb-8 p-6 bg-white border rounded-lg shadow-sm">
        <h3 className="font-medium mb-4 text-gray-700">
          {editingId ? `Edit Icon: ${form.title}` : "Add New Icon"}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-3">
            <label className="block text-sm font-medium mb-1">Title *</label>
            <input
              placeholder="e.g., Men, Women, Sale"
              className="w-full border p-3 rounded-lg"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              disabled={loading}
            />
          </div>

          <div className="md:col-span-4">
            <label className="block text-sm font-medium mb-1">Image URL *</label>
            <input
              placeholder="https://drive.google.com/file/d/1QOzkXSP4Mwkzy7DV7gPgyTfKH7qzTahG/view"
              className="w-full border p-3 rounded-lg"
              value={form.image_url}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Paste Google Drive URL (format: https://drive.google.com/file/d/FILE_ID/view)
            </p>
            {form.image_url && (
              <div className="mt-2">
                <p className="text-xs font-medium mb-1">Preview:</p>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 border rounded overflow-hidden bg-gray-50 flex items-center justify-center">
                    <img 
                      src={convertDriveUrl(form.image_url)} 
                      alt="Preview" 
                      className="w-12 h-12 object-contain"
                      onError={(e) => handleImageError(e, form.image_url)}
                    />
                  </div>
                  <div>
                    {form.badge_text && (
                      <div 
                        className="text-xs text-white px-2 py-1 rounded-full font-bold mb-1"
                        style={{ backgroundColor: form.badge_color || "#ff3b30" }}
                      >
                        {form.badge_text}
                      </div>
                    )}
                    <p className="text-xs text-gray-500">
                      Converted URL: {convertDriveUrl(form.image_url)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="md:col-span-3">
            <label className="block text-sm font-medium mb-1">Link URL *</label>
            <input
              placeholder="/products?category=men"
              className="w-full border p-3 rounded-lg"
              value={form.link_url}
              onChange={(e) => setForm({ ...form, link_url: e.target.value })}
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Format: /products?category=name or /products?sale=true
            </p>
          </div>

          <div className="md:col-span-1">
            <label className="block text-sm font-medium mb-1">Badge Text</label>
            <input
              placeholder="e.g., 50% OFF, NEW"
              className="w-full border p-3 rounded-lg"
              value={form.badge_text}
              onChange={(e) => setForm({ ...form, badge_text: e.target.value })}
              disabled={loading}
            />
          </div>

          <div className="md:col-span-1">
            <label className="block text-sm font-medium mb-1">Badge Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                className="w-full h-12 border rounded-lg cursor-pointer"
                value={form.badge_color}
                onChange={(e) => setForm({ ...form, badge_color: e.target.value })}
                disabled={loading}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          {editingId ? (
            <>
              <button
                onClick={resetForm}
                className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Check size={18} />
                Update Icon
              </button>
            </>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Adding..." : "Add Custom Icon"}
            </button>
          )}
        </div>
      </div>

      {/* ICONS LIST */}
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium text-gray-700">Manage Icons ({icons.length})</h3>
          {loading && <span className="text-sm text-gray-500">Loading...</span>}
        </div>

        {icons.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No icons added yet. Add your first icon above!</p>
          </div>
        ) : (
          icons.map((icon) => {
            const fileId = extractFileId(icon.image_url);
            return (
              <div
                key={icon.id}
                className={`flex items-center justify-between border p-4 rounded-lg bg-white shadow-sm ${
                  editingId === icon.id ? "ring-2 ring-blue-500" : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Order Controls */}
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => moveIcon(icon.id, 'up')}
                      disabled={loading || icon.sort_order === 0}
                      className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                    >
                      <MoveUp size={16} />
                    </button>
                    <button
                      onClick={() => moveIcon(icon.id, 'down')}
                      disabled={loading || icon.sort_order === icons.length - 1}
                      className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                    >
                      <MoveDown size={16} />
                    </button>
                  </div>

                  {/* Icon Preview with Badge */}
                  <div className="relative w-20 h-20 bg-gray-50 rounded-lg flex items-center justify-center p-2">
                    <img
                      src={convertDriveUrl(icon.image_url)}
                      alt={icon.title}
                      className="w-12 h-12 object-contain"
                      onError={(e) => handleImageError(e, icon.image_url)}
                    />
                    {icon.badge_text && (
                      <div 
                        className="absolute -top-2 -right-2 text-[10px] text-white px-2 py-0.5 rounded-full font-bold whitespace-nowrap shadow-sm"
                        style={{ backgroundColor: icon.badge_color || "#ff3b30" }}
                      >
                        {icon.badge_text}
                      </div>
                    )}
                  </div>

                  {/* Icon Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-lg truncate">{icon.title}</h4>
                      <span className={`px-2 py-1 text-xs rounded ${icon.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                        {icon.is_active ? 'Active' : 'Hidden'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate mb-1">
                      <span className="font-medium">Link:</span> {icon.link_url}
                    </p>
                    <div className="text-xs text-gray-500 space-y-1">
                      <p><span className="font-medium">Order:</span> {icon.sort_order}</p>
                      {fileId && (
                        <p className="truncate">
                          <span className="font-medium">File ID:</span> {fileId}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => startEdit(icon)}
                    disabled={loading}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Edit"
                  >
                    <Edit size={18} />
                  </button>

                  <button
                    onClick={() => toggleActive(icon)}
                    disabled={loading}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${icon.is_active 
                      ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                      : 'bg-green-100 text-green-800 hover:bg-green-200'
                    } disabled:opacity-50`}
                  >
                    {icon.is_active ? 'Hide' : 'Activate'}
                  </button>

                  <button
                    onClick={() => deleteIcon(icon.id)}
                    disabled={loading}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminHeaderIcons;