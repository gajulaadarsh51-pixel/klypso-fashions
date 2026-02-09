 import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  Image as ImageIcon, 
  Star, 
  Upload,
  CheckCircle,
  AlertCircle
} from "lucide-react";

type Brand = {
  id: string;
  name: string;
  slug: string;
  image_url: string;
  category: string;
  is_active: boolean;
  sort_order: number;
};

const normalizeDriveUrl = (url: string) => {
  if (!url) return "";
  
  const pattern = /\/file\/d\/([a-zA-Z0-9_-]+)/;
  const match = url.match(pattern);
  if (match) {
    return `https://lh3.googleusercontent.com/d/${match[1]}=s400`;
  }
  return url;
};

const AdminBrands = () => {
  const { data: brands = [], refetch } = useQuery<Brand[]>({
    queryKey: ["admin-brands"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brands")
        .select("*")
        .order("sort_order");
      if (error) throw error;
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

  const resetForm = () => {
    setForm({ name: "", slug: "", category: "", image_url: "", is_active: true, sort_order: 0 });
    setEditingId(null);
    setPreviewUrl("");
    setImageError(false);
  };

  const handleImageUrlChange = (url: string) => {
    setForm({ ...form, image_url: url });
    setImageError(false);
    if (url) {
      const normalized = normalizeDriveUrl(url);
      setPreviewUrl(normalized);
      const img = new Image();
      img.onload = () => setImageError(false);
      img.onerror = () => setImageError(true);
      img.src = normalized;
    } else {
      setPreviewUrl("");
    }
  };

  const saveBrand = async () => {
    if (!form.name || !form.slug || !form.category || !form.image_url) {
      alert("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim().toLowerCase(),
        category: form.category.trim(),
        image_url: normalizeDriveUrl(form.image_url),
        is_active: form.is_active,
        sort_order: form.sort_order || 0
      };
      if (editingId) {
        await supabase.from("brands").update(payload).eq("id", editingId);
      } else {
        await supabase.from("brands").insert(payload);
      }
      resetForm();
      refetch();
    } catch (err) {
      console.error(err);
      alert("Error saving brand");
    } finally {
      setLoading(false);
    }
  };

  const editBrand = (b: Brand) => {
    setEditingId(b.id);
    setForm(b);
    setPreviewUrl(normalizeDriveUrl(b.image_url));
  };

  const deleteBrand = async (id: string) => {
    if (!confirm("Delete this brand?")) return;
    await supabase.from("brands").delete().eq("id", id);
    refetch();
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
            {/* Form Card - SMALLER WHITE BOX */}
            <div className="bg-white rounded-lg border border-gray-100 p-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-gradient-to-br from-blue-500 to-purple-500 rounded">
                    <Star className="w-3 h-3 text-white" />
                  </div>
                  <h2 className="text-sm font-bold text-gray-800">
                    {editingId ? "Edit Brand" : "Add Brand"}
                  </h2>
                </div>
                {editingId && (
                  <button onClick={resetForm} className="text-xs text-gray-600 hover:text-gray-800">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                <div>
                  <label className="text-xs text-gray-700">Brand Name *</label>
                  <input
                    placeholder="e.g., Nike"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full text-xs border border-gray-200 rounded p-2 mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-xs text-gray-700">Slug *</label>
                  <input
                    placeholder="e.g., nike"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className="w-full text-xs border border-gray-200 rounded p-2 mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-xs text-gray-700">Category *</label>
                  <input
                    placeholder="e.g., shoes"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full text-xs border border-gray-200 rounded p-2 mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-xs text-gray-700">Sort Order</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={form.sort_order}
                    onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                    className="w-full text-xs border border-gray-200 rounded p-2 mt-1"
                  />
                </div>
              </div>

              {/* Image Input */}
              <div className="mb-3">
                <label className="text-xs text-gray-700 flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" />
                  Google Drive URL *
                </label>
                <div className="flex gap-1 mt-1">
                  <input
                    placeholder="Paste Google Drive link"
                    value={form.image_url}
                    onChange={(e) => handleImageUrlChange(e.target.value)}
                    className="flex-1 text-xs border border-gray-200 rounded p-2"
                  />
                  <button
                    onClick={saveBrand}
                    disabled={loading}
                    className="px-3 text-xs bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
                  >
                    {loading ? "..." : editingId ? "Update" : "Save"}
                  </button>
                </div>
              </div>

              {/* Preview - SMALLER */}
              <div className="bg-gray-50 rounded border border-gray-200 p-2">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs text-gray-700">Preview</h3>
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

                <div className="flex items-center gap-2">
                  <div className={`w-20 h-20 rounded border ${imageError ? 'border-red-200' : 'border-gray-200'} overflow-hidden bg-white flex items-center justify-center`}>
                    {previewUrl ? (
                      imageError ? (
                        <AlertCircle className="w-6 h-6 text-red-400" />
                      ) : (
                        <img src={previewUrl} alt="Preview" className="w-full h-full object-contain p-2" />
                      )
                    ) : (
                      <ImageIcon className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    {previewUrl && (
                      <div className="text-xs">
                        <div className="flex items-center gap-1 mb-1">
                          {imageError ? (
                            <span className="text-red-600">Invalid URL</span>
                          ) : (
                            <span className="text-green-600">URL Valid</span>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => handleImageUrlChange("https://drive.google.com/file/d/1vUiB97ja8aTcfoIYgch1CTLPjpRLTZ_A/view?usp=sharing")} className="px-2 py-0.5 text-xs bg-blue-50 text-blue-600 rounded border border-blue-100">
                            Test 1
                          </button>
                          <button onClick={() => handleImageUrlChange("https://drive.google.com/file/d/1EzgXXIURJpGmg7lCbnOn8wQVjAxAKbWU/view?usp=sharing")} className="px-2 py-0.5 text-xs bg-blue-50 text-blue-600 rounded border border-blue-100">
                            Test 2
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Brands Grid - SMALLER WHITE BOX */}
            <div className="bg-white rounded-lg border border-gray-100 p-3">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-gray-800">Brand Collection</h2>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs">
                  {brands.length} brands
                </span>
              </div>

              {brands.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500 text-xs">No brands yet</p>
                </div>
              ) : (
                <div className="flex overflow-x-auto pb-3 gap-2 scrollbar-hide">
                  {brands.map((b) => (
                    <div
                      key={b.id}
                      className={`flex-shrink-0 w-56 border ${b.is_active ? 'border-blue-100' : 'border-gray-200'} rounded-lg p-2 hover:shadow-sm`}
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="w-16 h-16 rounded border border-gray-200 overflow-hidden bg-white">
                            <img src={normalizeDriveUrl(b.image_url)} alt={b.name} className="w-full h-full object-contain p-2" />
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => editBrand(b)} className="p-1 text-blue-600 hover:text-blue-800">
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button onClick={() => deleteBrand(b.id)} className="p-1 text-red-600 hover:text-red-800">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-1 mb-1">
                            <h3 className="text-sm font-bold text-gray-800 truncate">{b.name}</h3>
                            {!b.is_active && (
                              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                                Inactive
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-600 space-y-1">
                            <div className="flex items-center gap-1">
                              <span>Slug:</span>
                              <code className="px-1.5 py-0.5 bg-gray-100 rounded">{b.slug}</code>
                            </div>
                            <div className="flex items-center gap-1">
                              <span>Category:</span>
                              <span className="text-blue-600">{b.category}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span>Order:</span>
                              <span className="text-purple-600">{b.sort_order}</span>
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

          {/* Right Column - Stats - SMALLER WHITE BOXES */}
          <div className="space-y-3">
            <div className="bg-white rounded-lg border border-gray-100 p-3">
              <h3 className="text-sm font-bold text-gray-800 mb-2">Stats</h3>
              <div className="space-y-1">
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                  <div>
                    <p className="text-xs text-gray-600">Active</p>
                    <p className="text-base font-bold text-blue-600">{brands.filter(b => b.is_active).length}</p>
                  </div>
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                </div>
                
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <p className="text-xs text-gray-600">Inactive</p>
                    <p className="text-base font-bold text-gray-600">{brands.filter(b => !b.is_active).length}</p>
                  </div>
                  <X className="w-4 h-4 text-gray-500" />
                </div>
                
                <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                  <div>
                    <p className="text-xs text-gray-600">Total</p>
                    <p className="text-base font-bold text-green-600">{brands.length}</p>
                  </div>
                  <Star className="w-4 h-4 text-green-500" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-100 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Upload className="w-3 h-3 text-purple-500" />
                <h3 className="text-sm font-bold text-gray-800">Tips</h3>
              </div>
              <div className="text-xs text-gray-600 space-y-1">
                <p>• Set "Anyone with link" permission</p>
                <p>• Use test URLs to verify</p>
                <p>• Use consistent categories</p>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-100 p-3">
              <h3 className="text-sm font-bold text-gray-800 mb-2">Recent</h3>
              <div className="space-y-1">
                {brands.slice(0, 3).map((b) => (
                  <div key={b.id} className="flex items-center gap-2 p-1">
                    <div className="w-6 h-6 rounded border border-gray-200 overflow-hidden">
                      <img src={normalizeDriveUrl(b.image_url)} alt={b.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-800 truncate">{b.name}</p>
                      <p className="text-xs text-gray-500">{b.category}</p>
                    </div>
                    <span className={`text-xs ${b.is_active ? 'text-green-600' : 'text-gray-500'}`}>
                      {b.is_active ? 'On' : 'Off'}
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