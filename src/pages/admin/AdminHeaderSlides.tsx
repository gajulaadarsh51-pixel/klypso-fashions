import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Edit,
  Trash2,
  Image as ImageIcon,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Link as LinkIcon,
  ExternalLink,
  Type,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface HeaderSlide {
  id: string;
  title?: string;
  subtitle?: string;
  image_url: string;
  button_text?: string;
  button_link?: string;
  background_color: string;
  text_color: string;
  button_color: string;
  button_text_color: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  slide_type: "text_image" | "text_only" | "image_only";
}

const AdminHeaderSlides = () => {
  const [slides, setSlides] = useState<HeaderSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeaderSlide | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    image_url: "",
    button_text: "",
    button_link: "",
    background_color: "#ffffff",
    text_color: "#000000",
    button_color: "#3b82f6",
    button_text_color: "#ffffff",
    is_active: true,
    sort_order: 0,
    slide_type: "text_image" as "text_image" | "text_only" | "image_only",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadSlides();
  }, []);

  const loadSlides = async () => {
    try {
      const { data, error } = await supabase
        .from("header_slides")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) {
        console.error("Supabase error details:", error);
        throw error;
      }
      
      // Ensure slide_type has a valid default value if null
      const processedData = (data || []).map(slide => ({
        ...slide,
        slide_type: slide.slide_type || "text_image" as "text_image" | "text_only" | "image_only"
      }));
      
      setSlides(processedData);
    } catch (error: any) {
      console.error("Error loading slides:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to load slides: ${error.message || 'Unknown error'}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      console.log("Submitting form data:", formData);
      
      // Validate based on slide type
      if (formData.slide_type === "text_image" || formData.slide_type === "image_only") {
        if (!formData.image_url.trim()) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Image URL is required for this slide type",
          });
          setIsSubmitting(false);
          return;
        }
      }
      
      if (formData.slide_type === "text_only") {
        if (!formData.title.trim() && !formData.subtitle.trim()) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "At least title or subtitle is required for text-only slides",
          });
          setIsSubmitting(false);
          return;
        }
      }

      // Prepare data for database
      const slideData: any = {
        title: formData.title.trim() || null,
        subtitle: formData.subtitle.trim() || null,
        image_url: formData.image_url.trim() || null,
        button_text: formData.button_text.trim() || null,
        button_link: formData.button_link.trim() || null,
        background_color: formData.background_color,
        text_color: formData.text_color,
        button_color: formData.button_color,
        button_text_color: formData.button_text_color,
        is_active: formData.is_active,
        sort_order: formData.sort_order,
        slide_type: formData.slide_type,
      };

      console.log("Saving slide data:", slideData);

      let result;
      if (editingSlide) {
        result = await supabase
          .from("header_slides")
          .update(slideData)
          .eq("id", editingSlide.id)
          .select();
      } else {
        result = await supabase
          .from("header_slides")
          .insert([slideData])
          .select();
      }

      const { data, error } = result;

      if (error) {
        console.error("Supabase save error:", error);
        // Check if it's a specific constraint error
        if (error.code === '23502') {
          throw new Error(`Database constraint error: ${error.message}. Make sure all required fields are filled.`);
        }
        throw new Error(error.message || 'Failed to save slide');
      }

      console.log("Save successful:", data);

      toast({
        title: "Success",
        description: editingSlide ? "Slide updated successfully" : "Slide created successfully",
      });

      setIsDialogOpen(false);
      setEditingSlide(null);
      resetForm();
      await loadSlides(); // Reload slides to get fresh data
    } catch (error: any) {
      console.error("Error saving slide:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to save slide: ${error.message || 'Unknown error'}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (slide: HeaderSlide) => {
    console.log("Editing slide:", slide);
    setEditingSlide(slide);
    setFormData({
      title: slide.title || "",
      subtitle: slide.subtitle || "",
      image_url: slide.image_url || "",
      button_text: slide.button_text || "",
      button_link: slide.button_link || "",
      background_color: slide.background_color || "#ffffff",
      text_color: slide.text_color || "#000000",
      button_color: slide.button_color || "#3b82f6",
      button_text_color: slide.button_text_color || "#ffffff",
      is_active: slide.is_active !== undefined ? slide.is_active : true,
      sort_order: slide.sort_order || 0,
      slide_type: slide.slide_type || "text_image",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this slide?")) return;

    try {
      const { error } = await supabase
        .from("header_slides")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({
        title: "Success",
        description: "Slide deleted successfully",
      });
      loadSlides();
    } catch (error: any) {
      console.error("Error deleting slide:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to delete slide: ${error.message || 'Unknown error'}`,
      });
    }
  };

  const handleMove = async (index: number, direction: "up" | "down") => {
    const newSlides = [...slides];
    const newIndex = direction === "up" ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= newSlides.length) return;

    // Swap sort_order
    const tempOrder = newSlides[index].sort_order;
    newSlides[index].sort_order = newSlides[newIndex].sort_order;
    newSlides[newIndex].sort_order = tempOrder;

    // Swap positions in array
    [newSlides[index], newSlides[newIndex]] = [newSlides[newIndex], newSlides[index]];

    try {
      // Update both slides in database
      const updatePromises = [
        supabase
          .from("header_slides")
          .update({ sort_order: newSlides[index].sort_order })
          .eq("id", newSlides[index].id),
        supabase
          .from("header_slides")
          .update({ sort_order: newSlides[newIndex].sort_order })
          .eq("id", newSlides[newIndex].id),
      ];

      await Promise.all(updatePromises);

      setSlides(newSlides);
      toast({
        title: "Success",
        description: "Slide order updated",
      });
    } catch (error: any) {
      console.error("Error updating slide order:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update slide order: ${error.message || 'Unknown error'}`,
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      subtitle: "",
      image_url: "",
      button_text: "",
      button_link: "",
      background_color: "#ffffff",
      text_color: "#000000",
      button_color: "#3b82f6",
      button_text_color: "#ffffff",
      is_active: true,
      sort_order: slides.length,
      slide_type: "text_image",
    });
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingSlide(null);
      resetForm();
    }
  };

  const handleAddNewClick = () => {
    setEditingSlide(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const getSlideTypeBadge = (type: string) => {
    const slideType = type || "text_image";
    switch (slideType) {
      case "text_only":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><Type className="h-3 w-3 mr-1" /> Text Only</Badge>;
      case "image_only":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><ImageIcon className="h-3 w-3 mr-1" /> Image Only</Badge>;
      default:
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200"><ImageIcon className="h-3 w-3 mr-1" /> Text + Image</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Header Slides</h1>
          <p className="text-gray-600">Manage autosliding banner slides</p>
          <p className="text-sm text-blue-600 mt-1">
            <strong>Important:</strong> When a button link is set, the entire slide image will be clickable on the homepage
          </p>
        </div>
        
        <Button onClick={handleAddNewClick}>
          <Plus className="mr-2 h-4 w-4" />
          Add New Slide
        </Button>

        {/* Dialog for creating/editing slides */}
        <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingSlide ? "Edit Slide" : "Create New Slide"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label className="mb-2 block">Slide Type *</Label>
                  <RadioGroup
                    value={formData.slide_type}
                    onValueChange={(value: "text_image" | "text_only" | "image_only") =>
                      setFormData({ ...formData, slide_type: value })
                    }
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="text_image" id="text_image" />
                      <Label htmlFor="text_image" className="cursor-pointer flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Text + Image
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="text_only" id="text_only" />
                      <Label htmlFor="text_only" className="cursor-pointer flex items-center gap-2">
                        <Type className="h-4 w-4" />
                        Text Only
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="image_only" id="image_only" />
                      <Label htmlFor="image_only" className="cursor-pointer flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Image Only
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {(formData.slide_type === "text_image" || formData.slide_type === "text_only") && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">
                        Title {formData.slide_type === "text_only" ? "(Optional)" : ""}
                      </Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) =>
                          setFormData({ ...formData, title: e.target.value })
                        }
                        placeholder="Slide title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subtitle">Subtitle (Optional)</Label>
                      <Input
                        id="subtitle"
                        value={formData.subtitle}
                        onChange={(e) =>
                          setFormData({ ...formData, subtitle: e.target.value })
                        }
                        placeholder="Optional subtitle"
                      />
                    </div>
                  </div>
                )}

                {(formData.slide_type === "text_image" || formData.slide_type === "image_only") && (
                  <div className="space-y-2">
                    <Label htmlFor="image_url">Image URL *</Label>
                    <div className="flex gap-2">
                      <Input
                        id="image_url"
                        value={formData.image_url}
                        onChange={(e) =>
                          setFormData({ ...formData, image_url: e.target.value })
                        }
                        placeholder="https://example.com/image.jpg"
                        required={formData.slide_type !== "text_only"}
                      />
                      {formData.image_url && (
                        <div className="w-20 h-20 border rounded overflow-hidden">
                          <img
                            src={formData.image_url}
                            alt="Preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "/placeholder-slide.jpg";
                            }}
                          />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {formData.slide_type === "text_image" 
                        ? "Required for text+image slides"
                        : "Required for image-only slides"}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="button_text">Button Text (Optional)</Label>
                    <Input
                      id="button_text"
                      value={formData.button_text}
                      onChange={(e) =>
                        setFormData({ ...formData, button_text: e.target.value })
                      }
                      placeholder="Shop Now"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="button_link">
                      <div className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4" />
                        Button Link (Makes slide clickable)
                      </div>
                    </Label>
                    <Input
                      id="button_link"
                      value={formData.button_link}
                      onChange={(e) =>
                        setFormData({ ...formData, button_link: e.target.value })
                      }
                      placeholder="/products?category=men"
                      className="mb-2"
                    />
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>• This link will be used for both the button AND the slide click</p>
                      <p>• Use <code className="bg-gray-100 px-1 rounded">/products?category=men</code> for categories</p>
                      <p>• Use <code className="bg-gray-100 px-1 rounded">/products/123</code> for specific product</p>
                      <p>• Use full URL for external links</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="background_color">Background Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="background_color"
                        value={formData.background_color}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            background_color: e.target.value,
                          })
                        }
                        type="color"
                        className="w-12 h-12 p-1"
                      />
                      <Input
                        value={formData.background_color}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            background_color: e.target.value,
                          })
                        }
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>
                  {(formData.slide_type === "text_image" || formData.slide_type === "text_only") && (
                    <div className="space-y-2">
                      <Label htmlFor="text_color">Text Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="text_color"
                          value={formData.text_color}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              text_color: e.target.value,
                            })
                          }
                          type="color"
                          className="w-12 h-12 p-1"
                        />
                        <Input
                          value={formData.text_color}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              text_color: e.target.value,
                            })
                          }
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {formData.button_text && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="button_color">Button Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="button_color"
                          value={formData.button_color}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              button_color: e.target.value,
                            })
                          }
                          type="color"
                          className="w-12 h-12 p-1"
                        />
                        <Input
                          value={formData.button_color}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              button_color: e.target.value,
                            })
                          }
                          placeholder="#3b82f6"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="button_text_color">Button Text Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="button_text_color"
                          value={formData.button_text_color}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              button_text_color: e.target.value,
                            })
                          }
                          type="color"
                          className="w-12 h-12 p-1"
                        />
                        <Input
                          value={formData.button_text_color}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              button_text_color: e.target.value,
                            })
                          }
                          placeholder="#ffffff"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_active: checked })
                      }
                      id="is_active"
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sort_order">Sort Order</Label>
                    <Input
                      id="sort_order"
                      type="number"
                      value={formData.sort_order}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          sort_order: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-24"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDialogOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {editingSlide ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    <>
                      {editingSlide ? "Update" : "Create"} Slide
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {slides.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ImageIcon className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No slides yet</h3>
            <p className="text-gray-600 text-center mb-4">
              Create your first autoslide banner to display on the homepage
            </p>
            <Button onClick={handleAddNewClick}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Slide
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {slides.map((slide, index) => (
            <Card key={slide.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {slide.slide_type !== "text_only" && slide.image_url && (
                      <div className="relative w-40 h-24 rounded-lg overflow-hidden border">
                        <img
                          src={slide.image_url}
                          alt={slide.title || "Slide image"}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "/placeholder-slide.jpg";
                          }}
                        />
                        {!slide.is_active && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <EyeOff className="h-6 w-6 text-white" />
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {getSlideTypeBadge(slide.slide_type || "text_image")}
                        {(slide.title || slide.subtitle) && (
                          <h3 className="font-semibold">
                            {slide.title || slide.subtitle}
                          </h3>
                        )}
                        {!slide.title && !slide.subtitle && slide.slide_type === "text_only" && (
                          <span className="text-gray-500 italic">No text content</span>
                        )}
                        <Badge
                          variant={slide.is_active ? "default" : "secondary"}
                        >
                          {slide.is_active ? "Active" : "Inactive"}
                        </Badge>
                        {slide.button_text && (
                          <Badge variant="outline">
                            Button: {slide.button_text}
                          </Badge>
                        )}
                        {slide.button_link && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <LinkIcon className="h-3 w-3" />
                            Clickable
                          </Badge>
                        )}
                      </div>
                      {slide.title && slide.subtitle && (
                        <div className="mb-2">
                          {slide.title && <div className="font-medium">{slide.title}</div>}
                          {slide.subtitle && <div className="text-gray-600 text-sm">{slide.subtitle}</div>}
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Order: {slide.sort_order}</span>
                        {slide.slide_type === "text_only" && (
                          <span className="flex items-center gap-1">
                            <Type className="h-3 w-3" />
                            <strong>Text-only slide</strong>
                          </span>
                        )}
                        {slide.slide_type === "image_only" && (
                          <span className="flex items-center gap-1">
                            <ImageIcon className="h-3 w-3" />
                            <strong>Image-only slide</strong>
                          </span>
                        )}
                        {slide.button_link && (
                          <span className="flex items-center gap-1">
                            <LinkIcon className="h-3 w-3" />
                            <strong>Link:</strong> {slide.button_link}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMove(index, "up")}
                      disabled={index === 0}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMove(index, "down")}
                      disabled={index === slides.length - 1}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(slide)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(slide.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminHeaderSlides;