// pages/admin/AdminWorldOfDesire.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useWorldOfDesireAdmin } from "@/hooks/useWorldOfDesireAdmin";
import { processGoogleDriveUrl } from "@/hooks/useWorldOfDesire";
import { Pencil, Trash2, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const AdminWorldOfDesire = () => {
  const queryClient = useQueryClient();
  const { list, create, update, remove } = useWorldOfDesireAdmin();

  // Predefined category links for the dropdown
  const categoryLinks = [
    { label: "All Products", value: "/products" },
    { label: "Men's Collection", value: "/products?category=men" },
    { label: "Women's Collection", value: "/products?category=women" },
    { label: "Kids Collection", value: "/products?category=kids" },
    { label: "Accessories", value: "/products?category=accessories" },
    { label: "Shoes", value: "/products?category=shoes" },
    { label: "Watches", value: "/products?category=watches" },
    { label: "Festival Collection", value: "/products?category=festival" },
    { label: "New Arrivals", value: "/products?category=new" },
    { label: "On Sale", value: "/products?sale=true" },
  ];

  const [form, setForm] = useState({
    title: "",
    image_url: "",
    link: "/products",
    offer: "Featured",
    position: 0,
    is_active: true,
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setEditForm({ ...item });
    setError(null);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editForm) return;
    
    if (!editForm.title?.trim()) {
      setError("Title is required");
      return;
    }
    
    if (!editForm.image_url?.trim()) {
      setError("Image URL is required");
      return;
    }
    
    try {
      await update.mutateAsync({ id: editingId, ...editForm });
      setEditingId(null);
      setEditForm(null);
      setSuccessMessage("Item updated successfully");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError("Failed to update item");
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
    setError(null);
  };

  const handleSubmit = async () => {
    // Validation
    if (!form.title?.trim()) {
      setError("Title is required");
      return;
    }
    
    if (!form.image_url?.trim()) {
      setError("Image URL is required");
      return;
    }

    setError(null);
    
    try {
      // Ensure link starts with / if it's not a full URL
      let finalLink = form.link;
      if (finalLink && !finalLink.startsWith('http') && !finalLink.startsWith('/')) {
        finalLink = `/${finalLink}`;
      }
      
      const payload = {
        title: form.title.trim(),
        image_url: form.image_url.trim(),
        link: finalLink,
        offer: form.offer?.trim() || "Featured",
        position: Number(form.position) || 0,
        is_active: form.is_active,
      };

      console.log("Submitting payload:", payload);
      
      await create.mutateAsync(payload);
      
      // Reset form on success
      setForm({
        title: "",
        image_url: "",
        link: "/products",
        offer: "Featured",
        position: 0,
        is_active: true,
      });
      
      setSuccessMessage("Collection added successfully");
      setTimeout(() => setSuccessMessage(null), 3000);
      
    } catch (err: any) {
      console.error("Submit error:", err);
      
      // Check for RLS policy error
      if (err.message?.includes("row-level security policy")) {
        setError("Permission denied: You don't have access to add items. Please check your authentication.");
      } else {
        setError(err.message || "Failed to add collection");
      }
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">A World of Desire - Admin</h1>
        <div className="text-sm text-muted-foreground">
          {list.data?.length || 0} items
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* CREATE FORM */}
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Add New Collection</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Luxury Watches"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              disabled={create.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_url">Google Drive Image URL *</Label>
            <div className="flex gap-2">
              <Input
                id="image_url"
                placeholder="https://drive.google.com/..."
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                required
                disabled={create.isPending}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => {
                  if (form.image_url) {
                    window.open(form.image_url, '_blank');
                  }
                }}
                disabled={!form.image_url || create.isPending}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Paste Google Drive shareable link
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="link">Destination Link</Label>
            <select
              id="link"
              value={form.link}
              onChange={(e) => setForm({ ...form, link: e.target.value })}
              className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
              disabled={create.isPending}
            >
              {categoryLinks.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Input
              placeholder="Or enter custom link"
              value={form.link}
              onChange={(e) => setForm({ ...form, link: e.target.value })}
              className="mt-1"
              disabled={create.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="offer">Offer Badge</Label>
            <Input
              id="offer"
              placeholder="Featured, New, Limited"
              value={form.offer}
              onChange={(e) => setForm({ ...form, offer: e.target.value })}
              disabled={create.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="position">Position</Label>
            <Input
              id="position"
              type="number"
              placeholder="0"
              value={form.position}
              onChange={(e) => setForm({ ...form, position: Number(e.target.value) })}
              disabled={create.isPending}
            />
          </div>

          <div className="space-y-2 flex flex-col justify-end">
            <Button 
              onClick={handleSubmit} 
              className="w-full"
              disabled={create.isPending}
            >
              {create.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Collection"
              )}
            </Button>
          </div>
        </div>

        {/* Image Preview */}
        {form.image_url && (
          <div className="mt-4 p-4 border rounded-lg">
            <Label className="text-sm font-medium">Preview</Label>
            <div className="mt-2 flex items-center gap-4">
              <div className="w-24 h-24 border rounded overflow-hidden bg-gray-50">
                <img
                  src={processGoogleDriveUrl(form.image_url)}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder.svg';
                  }}
                />
              </div>
              <div className="text-sm">
                <p className="font-medium">{form.title || "Untitled"}</p>
                <p className="text-muted-foreground truncate max-w-xs">{form.link}</p>
                <p className="text-xs text-blue-600 mt-1">Offer: {form.offer}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* LIST */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Collections ({list.data?.length || 0})</h2>
        </div>

        <div className="divide-y">
          {list.isLoading ? (
            <div className="p-8 text-center flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : list.data?.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No collections added yet. Add your first collection above.
            </div>
          ) : (
            list.data?.map((item) => (
              <div key={item.id} className="p-6">
                {editingId === item.id ? (
                  // EDIT MODE
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>Title *</Label>
                        <Input
                          value={editForm?.title || ""}
                          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                          disabled={update.isPending}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Image URL *</Label>
                        <div className="flex gap-2">
                          <Input
                            value={editForm?.image_url || ""}
                            onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
                            disabled={update.isPending}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              if (editForm?.image_url) {
                                window.open(editForm.image_url, '_blank');
                              }
                            }}
                            disabled={!editForm?.image_url || update.isPending}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Link</Label>
                        <select
                          value={editForm?.link || "/products"}
                          onChange={(e) => setEditForm({ ...editForm, link: e.target.value })}
                          className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                          disabled={update.isPending}
                        >
                          {categoryLinks.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <Input
                          value={editForm?.link || ""}
                          onChange={(e) => setEditForm({ ...editForm, link: e.target.value })}
                          className="mt-1"
                          placeholder="Custom link"
                          disabled={update.isPending}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Offer</Label>
                        <Input
                          value={editForm?.offer || ""}
                          onChange={(e) => setEditForm({ ...editForm, offer: e.target.value })}
                          disabled={update.isPending}
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={editForm?.is_active || false}
                            onCheckedChange={(checked) => setEditForm({ ...editForm, is_active: checked })}
                            disabled={update.isPending}
                          />
                          <Label>Active</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Label>Position:</Label>
                          <Input
                            type="number"
                            className="w-20"
                            value={editForm?.position || 0}
                            onChange={(e) => setEditForm({ ...editForm, position: Number(e.target.value) })}
                            disabled={update.isPending}
                          />
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          onClick={handleCancelEdit}
                          disabled={update.isPending}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleSaveEdit}
                          disabled={update.isPending}
                        >
                          {update.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            "Save Changes"
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  // VIEW MODE
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-lg border overflow-hidden flex-shrink-0 bg-gray-50">
                        <img
                          src={processGoogleDriveUrl(item.image_url)}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.svg';
                          }}
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate">{item.title}</h3>
                          {item.offer && (
                            <span className="px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded-full whitespace-nowrap">
                              {item.offer}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 flex-wrap">
                          <a 
                            href={item.link.startsWith('/') ? item.link : `/${item.link}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-800 hover:underline truncate max-w-xs"
                          >
                            Link: {item.link}
                          </a>
                          <span className="text-xs whitespace-nowrap">Position: {item.position}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${item.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {item.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(item)}
                        disabled={remove.isPending}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Delete "${item.title}"?`)) {
                            remove.mutate(item.id);
                          }
                        }}
                        disabled={remove.isPending}
                      >
                        {remove.isPending && remove.variables === item.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* INSTRUCTIONS */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-800 mb-2">How to use:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
          <li>Upload image to Google Drive and get shareable link</li>
          <li>Set the file permissions to "Anyone with the link"</li>
          <li>Select a destination link from dropdown or enter custom link</li>
          <li>Valid links: /products, /products?category=men, /products?sale=true</li>
          <li>Make sure the Products page supports your selected category</li>
        </ol>
        
        <h3 className="font-semibold text-blue-800 mt-4 mb-2">Supported Categories:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-blue-700">
          <li>men, women, kids, accessories, shoes, watches</li>
          <li>festival (festival collection)</li>
          <li>new (new arrivals)</li>
          <li>sale=true (sale items)</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminWorldOfDesire;