import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { 
  Edit2, 
  Trash2, 
  X, 
  Image as ImageIcon, 
  Star, 
  Upload,
  CheckCircle,
  AlertCircle,
  Plus,
  Shield
} from "lucide-react";

type Brand = {
  id: string;
  name: string;
  slug: string;
  image_url: string;
  category: string;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
};

const normalizeDriveUrl = (url: string) => {
  if (!url) return "";
  
  // Handle different Google Drive URL formats
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /\/d\/([a-zA-Z0-9_-]+)/,
    /id=([a-zA-Z0-9_-]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return `https://lh3.googleusercontent.com/d/${match[1]}=s400`;
    }
  }
  return url;
};

const AdminBrands = () => {
  const queryClient = useQueryClient();
  
  const { data: brands = [], isLoading, error: fetchError } = useQuery<Brand[]>({
    queryKey: ["admin-brands"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brands")
        .select("*")
        .order("sort_order", { ascending: true });
      
      if (error) {
        console.error("Error fetching brands:", error);
        throw error;
      }
      return data || [];
    },
  });

  const [form, setForm] = useState({
    name: "",
    slug: "",
    category: "",
    image_url: "",
    is_active: true,
    sort_order: 0
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setForm({ 
      name: "", 
      slug: "", 
      category: "", 
      image_url: "", 
      is_active: true, 
      sort_order: 0 
    });
    setEditingId(null);
    setPreviewUrl("");
    setImageError(false);
    setError(null);
  };

  const handleImageUrlChange = (url: string) => {
    setForm({ ...form, image_url: url });
    setImageError(false);
    setError(null);
    
    if (url) {
      const normalized = normalizeDriveUrl(url);
      setPreviewUrl(normalized);
      
      // Preload image to check if it's valid
      const img = new Image();
      img.onload = () => setImageError(false);
      img.onerror = () => setImageError(true);
      img.src = normalized;
    } else {
      setPreviewUrl("");
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (name: string) => {
    setForm({ 
      ...form, 
      name, 
      slug: generateSlug(name) 
    });
  };

  const saveBrand = async () => {
    // Validation
    if (!form.name?.trim()) {
      setError("Brand name is required");
      return;
    }
    if (!form.slug?.trim()) {
      setError("Slug is required");
      return;
    }
    if (!form.category?.trim()) {
      setError("Category is required");
      return;
    }
    if (!form.image_url?.trim()) {
      setError("Image URL is required");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const normalizedImageUrl = normalizeDriveUrl(form.image_url);
      
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim().toLowerCase(),
        category: form.category.trim().toLowerCase(),
        image_url: normalizedImageUrl,
        is_active: form.is_active,
        sort_order: Number(form.sort_order) || 0
      };

      console.log("Saving brand with payload:", payload);

      let result;
      if (editingId) {
        // Update existing brand
        result = await supabase
          .from("brands")
          .update(payload)
          .eq("id", editingId)
          .select();
      } else {
        // Insert new brand
        result = await supabase
          .from("brands")
          .insert([payload])
          .select();
      }

      const { data, error: supabaseError } = result;

      if (supabaseError) {
        console.error("Supabase error:", supabaseError);
        
        // Check for RLS policy error
        if (supabaseError.message?.includes("row-level security policy")) {
          setError(
            "Permission denied: You don't have access to add brands. " +
            "Please contact your administrator to set up the proper database permissions."
          );
        }
        // Check for duplicate slug error
        else if (supabaseError.code === '23505') {
          setError("A brand with this slug already exists. Please choose a different name or modify the slug.");
        } else {
          setError(supabaseError.message || "Failed to save brand");
        }
        return;
      }

      console.log("Brand saved successfully:", data);
      
      // Reset form and refresh data
      resetForm();
      
      // Invalidate and refetch
      await queryClient.invalidateQueries({ queryKey: ["admin-brands"] });
      await queryClient.invalidateQueries({ queryKey: ["brands"] });
      
    } catch (err) {
      console.error("Error in saveBrand:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const editBrand = (brand: Brand) => {
    setEditingId(brand.id);
    setForm({
      name: brand.name,
      slug: brand.slug,
      category: brand.category,
      image_url: brand.image_url,
      is_active: brand.is_active,
      sort_order: brand.sort_order
    });
    setPreviewUrl(normalizeDriveUrl(brand.image_url));
    setError(null);
  };

  const deleteBrand = async (id: string) => {
    if (!confirm("Are you sure you want to delete this brand? This action cannot be undone.")) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from("brands")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Delete error:", error);
        
        // Check for RLS policy error
        if (error.message?.includes("row-level security policy")) {
          alert("Permission denied: You don't have access to delete brands.");
        } else {
          alert("Failed to delete brand: " + error.message);
        }
        return;
      }

      // Refresh data
      await queryClient.invalidateQueries({ queryKey: ["admin-brands"] });
      await queryClient.invalidateQueries({ queryKey: ["brands"] });
      
    } catch (err) {
      console.error("Error deleting brand:", err);
      alert("An unexpected error occurred while deleting");
    }
  };

  // Check if user is authenticated
  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setError("You must be logged in to manage brands");
    }
    return session;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-3">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Brand Management
          </h1>
          <p className="text-sm text-gray-600">Manage your brand catalog</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-3">
            {/* Form Card */}
            <div className="bg-white rounded-lg border border-gray-100 p-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-gradient-to-br from-blue-500 to-purple-500 rounded">
                    {editingId ? <Edit2 className="w-3 h-3 text-white" /> : <Plus className="w-3 h-3 text-white" />}
                  </div>
                  <h2 className="text-sm font-bold text-gray-800">
                    {editingId ? "Edit Brand" : "Add New Brand"}
                  </h2>
                </div>
                {editingId && (
                  <button 
                    onClick={resetForm} 
                    className="text-xs text-gray-600 hover:text-gray-800 flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Cancel
                  </button>
                )}
              </div>

              {error && (
                <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-red-600">{error}</p>
                    {error.includes("permission denied") && (
                      <button
                        onClick={async () => {
                          const session = await checkAuth();
                          if (session) {
                            setError(null);
                          }
                        }}
                        className="mt-1 text-xs text-blue-600 hover:text-blue-800 underline"
                      >
                        Check authentication status
                      </button>
                    )}
                  </div>
                </div>
              )}

              {fetchError && (
                <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded flex items-center gap-2">
                  <Shield className="w-4 h-4 text-yellow-500" />
                  <p className="text-xs text-yellow-600">
                    Database error: {fetchError.message}. Please check your permissions.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                <div>
                  <label className="text-xs text-gray-700 font-medium">Brand Name *</label>
                  <input
                    placeholder="e.g., Nike"
                    value={form.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full text-xs border border-gray-200 rounded p-2 mt-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="text-xs text-gray-700 font-medium">Slug *</label>
                  <input
                    placeholder="e.g., nike"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    className="w-full text-xs border border-gray-200 rounded p-2 mt-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <p className="text-[10px] text-gray-500 mt-0.5">URL-friendly identifier (auto-generated from name)</p>
                </div>
                
                <div>
                  <label className="text-xs text-gray-700 font-medium">Category *</label>
                  <input
                    placeholder="e.g., shoes"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full text-xs border border-gray-200 rounded p-2 mt-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="text-xs text-gray-700 font-medium">Sort Order</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={form.sort_order}
                    onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                    className="w-full text-xs border border-gray-200 rounded p-2 mt-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Image Input */}
              <div className="mb-3">
                <label className="text-xs text-gray-700 font-medium flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" />
                  Google Drive Image URL *
                </label>
                <div className="flex gap-1 mt-1">
                  <input
                    placeholder="Paste Google Drive share link"
                    value={form.image_url}
                    onChange={(e) => handleImageUrlChange(e.target.value)}
                    className="flex-1 text-xs border border-gray-200 rounded p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    onClick={saveBrand}
                    disabled={loading}
                    className="px-4 text-xs bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 min-w-[60px]"
                  >
                    {loading ? "..." : editingId ? "Update" : "Save"}
                  </button>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">Share your Google Drive image with "Anyone with the link" permission</p>
              </div>

              {/* Preview */}
              {previewUrl && (
                <div className="bg-gray-50 rounded border border-gray-200 p-2">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs text-gray-700 font-medium">Image Preview</h3>
                    <label className="flex items-center gap-1 text-xs">
                      <input
                        type="checkbox"
                        checked={form.is_active}
                        onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                        className="w-3 h-3"
                      />
                      Active
                    </label>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className={`w-16 h-16 rounded border ${imageError ? 'border-red-200' : 'border-gray-200'} overflow-hidden bg-white flex items-center justify-center`}>
                      {imageError ? (
                        <AlertCircle className="w-6 h-6 text-red-400" />
                      ) : (
                        <img 
                          src={previewUrl} 
                          alt="Preview" 
                          className="w-full h-full object-contain p-1"
                          onError={() => setImageError(true)}
                        />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      {imageError ? (
                        <p className="text-xs text-red-600">Failed to load image. Please check the URL.</p>
                      ) : (
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Image loaded successfully
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Test URLs */}
              <div className="mt-3 flex gap-1">
                <button 
                  onClick={() => handleImageUrlChange("https://drive.google.com/file/d/1vUiB97ja8aTcfoIYgch1CTLPjpRLTZ_A/view?usp=sharing")} 
                  className="px-2 py-1 text-[10px] bg-blue-50 text-blue-600 rounded border border-blue-100 hover:bg-blue-100"
                >
                  Test Image 1
                </button>
                <button 
                  onClick={() => handleImageUrlChange("https://drive.google.com/file/d/1EzgXXIURJpGmg7lCbnOn8wQVjAxAKbWU/view?usp=sharing")} 
                  className="px-2 py-1 text-[10px] bg-blue-50 text-blue-600 rounded border border-blue-100 hover:bg-blue-100"
                >
                  Test Image 2
                </button>
              </div>
            </div>

            {/* Brands Grid */}
            <div className="bg-white rounded-lg border border-gray-100 p-3">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-gray-800">Brand Collection</h2>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs">
                  {brands.length} {brands.length === 1 ? 'brand' : 'brands'}
                </span>
              </div>

              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-xs">Loading brands...</p>
                </div>
              ) : brands.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-xs mb-2">No brands yet</p>
                  <p className="text-[10px] text-gray-400">Add your first brand using the form above</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {brands.map((brand) => (
                    <div
                      key={brand.id}
                      className={`border ${brand.is_active ? 'border-blue-100' : 'border-gray-200'} rounded-lg p-2 hover:shadow-sm`}
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="w-12 h-12 rounded border border-gray-200 overflow-hidden bg-white">
                            <img 
                              src={normalizeDriveUrl(brand.image_url)} 
                              alt={brand.name} 
                              className="w-full h-full object-contain p-1"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder-image.png';
                              }}
                            />
                          </div>
                          <div className="flex gap-1">
                            <button 
                              onClick={() => editBrand(brand)} 
                              className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                              title="Edit brand"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button 
                              onClick={() => deleteBrand(brand.id)} 
                              className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                              title="Delete brand"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-1 mb-1">
                            <h3 className="text-xs font-bold text-gray-800 truncate">{brand.name}</h3>
                            {!brand.is_active && (
                              <span className="px-1 py-0.5 bg-gray-100 text-gray-600 rounded-full text-[10px]">
                                Inactive
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-gray-600 space-y-0.5">
                            <div className="flex items-center gap-1">
                              <span className="text-gray-500">Slug:</span>
                              <code className="px-1 py-0.5 bg-gray-100 rounded">{brand.slug}</code>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-gray-500">Category:</span>
                              <span className="text-blue-600">{brand.category}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-gray-500">Order:</span>
                              <span className="text-purple-600">{brand.sort_order}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Stats */}
          <div className="space-y-3">
            <div className="bg-white rounded-lg border border-gray-100 p-3">
              <h3 className="text-sm font-bold text-gray-800 mb-2">Statistics</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                  <div>
                    <p className="text-xs text-gray-600">Active Brands</p>
                    <p className="text-lg font-bold text-blue-600">{brands.filter(b => b.is_active).length}</p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-blue-500" />
                </div>
                
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <p className="text-xs text-gray-600">Inactive Brands</p>
                    <p className="text-lg font-bold text-gray-600">{brands.filter(b => !b.is_active).length}</p>
                  </div>
                  <X className="w-5 h-5 text-gray-500" />
                </div>
                
                <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                  <div>
                    <p className="text-xs text-gray-600">Total Brands</p>
                    <p className="text-lg font-bold text-green-600">{brands.length}</p>
                  </div>
                  <Star className="w-5 h-5 text-green-500" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-100 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Upload className="w-3 h-3 text-purple-500" />
                <h3 className="text-sm font-bold text-gray-800">Quick Tips</h3>
              </div>
              <div className="text-xs text-gray-600 space-y-1.5">
                <p className="flex items-start gap-1">
                  <span className="text-blue-500">•</span>
                  Set Google Drive file to "Anyone with link"
                </p>
                <p className="flex items-start gap-1">
                  <span className="text-blue-500">•</span>
                  Use the test URLs to verify image loading
                </p>
                <p className="flex items-start gap-1">
                  <span className="text-blue-500">•</span>
                  Slug is auto-generated from brand name
                </p>
                <p className="flex items-start gap-1">
                  <span className="text-blue-500">•</span>
                  Higher sort order = appears later
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-100 p-3">
              <h3 className="text-sm font-bold text-gray-800 mb-2">Recently Added</h3>
              <div className="space-y-2">
                {brands.slice(0, 3).map((brand) => (
                  <div key={brand.id} className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded">
                    <div className="w-8 h-8 rounded border border-gray-200 overflow-hidden flex-shrink-0">
                      <img 
                        src={normalizeDriveUrl(brand.image_url)} 
                        alt={brand.name} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-image.png';
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{brand.name}</p>
                      <p className="text-[10px] text-gray-500">{brand.category}</p>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      brand.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {brand.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminBrands;