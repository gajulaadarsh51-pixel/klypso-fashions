import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  MoveUp, 
  MoveDown, 
  Eye, 
  EyeOff, 
  Sparkles,
  AlignLeft,
  AlignRight,
  AlignCenter,
  MinusCircle,
  PlusCircle,
  Save,
  ArrowUp,
  ArrowDown,
  MoveVertical
} from 'lucide-react';

interface FashionForecastItem {
  id: string;
  title: string;
  discount: string;
  image_url: string;
  link: string;
  display_order: number;
  alignment: 'left' | 'right' | 'center';
  focal_point: string;
  title_size: 'sm' | 'md' | 'lg' | 'xl';
  discount_size: 'sm' | 'md' | 'lg';
  text_color: string;
  overlay_opacity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const AdminFashionForecast = () => {
  const [items, setItems] = useState<FashionForecastItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FashionForecastItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    discount: '',
    image_url: '',
    link: '',
    alignment: 'left' as 'left' | 'right' | 'center',
    focal_point: 'center',
    title_size: 'lg' as 'sm' | 'md' | 'lg' | 'xl',
    discount_size: 'md' as 'sm' | 'md' | 'lg',
    text_color: '#FFFFFF',
    overlay_opacity: 15,
    is_active: true,
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('fashion_forecast')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, is_active: checked }));
  };

  const handleAlignmentChange = (alignment: 'left' | 'right' | 'center') => {
    setFormData(prev => ({ ...prev, alignment }));
  };

  const handleFocalPointChange = (point: string) => {
    setFormData(prev => ({ ...prev, focal_point: point }));
  };

  const handleTitleSizeChange = (size: 'sm' | 'md' | 'lg' | 'xl') => {
    setFormData(prev => ({ ...prev, title_size: size }));
  };

  const handleDiscountSizeChange = (size: 'sm' | 'md' | 'lg') => {
    setFormData(prev => ({ ...prev, discount_size: size }));
  };

  const handleOverlayChange = (value: number) => {
    setFormData(prev => ({ ...prev, overlay_opacity: Math.max(0, Math.min(100, value)) }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      discount: '',
      image_url: '',
      link: '',
      alignment: 'left',
      focal_point: 'center',
      title_size: 'lg',
      discount_size: 'md',
      text_color: '#FFFFFF',
      overlay_opacity: 15,
      is_active: true,
    });
    setEditingItem(null);
  };

  const openEditDialog = (item: FashionForecastItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      discount: item.discount,
      image_url: item.image_url,
      link: item.link,
      alignment: item.alignment || 'left',
      focal_point: item.focal_point || 'center',
      title_size: item.title_size || 'lg',
      discount_size: item.discount_size || 'md',
      text_color: item.text_color || '#FFFFFF',
      overlay_opacity: item.overlay_opacity || 15,
      is_active: item.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingItem) {
        // Update existing item
        const { error } = await supabase
          .from('fashion_forecast')
          .update({
            title: formData.title,
            discount: formData.discount,
            image_url: formData.image_url,
            link: formData.link,
            alignment: formData.alignment,
            focal_point: formData.focal_point,
            title_size: formData.title_size,
            discount_size: formData.discount_size,
            text_color: formData.text_color,
            overlay_opacity: formData.overlay_opacity,
            is_active: formData.is_active,
          })
          .eq('id', editingItem.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Fashion forecast item updated successfully',
        });
      } else {
        // Get max display order
        const maxOrder = items.length > 0 
          ? Math.max(...items.map(i => i.display_order)) 
          : -1;
        
        // Create new item
        const { error } = await supabase
          .from('fashion_forecast')
          .insert([{
            title: formData.title,
            discount: formData.discount,
            image_url: formData.image_url,
            link: formData.link,
            alignment: formData.alignment,
            focal_point: formData.focal_point,
            title_size: formData.title_size,
            discount_size: formData.discount_size,
            text_color: formData.text_color,
            overlay_opacity: formData.overlay_opacity,
            is_active: formData.is_active,
            display_order: maxOrder + 1,
          }]);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Fashion forecast item added successfully',
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchItems();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('fashion_forecast')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Fashion forecast item deleted successfully',
      });

      fetchItems();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const moveItem = async (id: string, direction: 'up' | 'down') => {
    const currentIndex = items.findIndex(item => item.id === id);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === items.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const currentItem = items[currentIndex];
    const swapItem = items[newIndex];

    try {
      // Swap display orders
      const { error: error1 } = await supabase
        .from('fashion_forecast')
        .update({ display_order: swapItem.display_order })
        .eq('id', currentItem.id);

      const { error: error2 } = await supabase
        .from('fashion_forecast')
        .update({ display_order: currentItem.display_order })
        .eq('id', swapItem.id);

      if (error1 || error2) throw error1 || error2;

      toast({
        title: 'Success',
        description: 'Order updated successfully',
      });

      fetchItems();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from('fashion_forecast')
        .update({ is_active: !currentActive })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Item ${!currentActive ? 'activated' : 'deactivated'} successfully`,
      });

      fetchItems();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getTitleSizeClass = (size: string) => {
    switch(size) {
      case 'sm': return 'text-xl md:text-3xl';
      case 'md': return 'text-2xl md:text-4xl';
      case 'lg': return 'text-3xl md:text-5xl';
      case 'xl': return 'text-4xl md:text-6xl';
      default: return 'text-3xl md:text-5xl';
    }
  };

  const getDiscountSizeClass = (size: string) => {
    switch(size) {
      case 'sm': return 'text-base md:text-lg';
      case 'md': return 'text-lg md:text-xl';
      case 'lg': return 'text-xl md:text-2xl';
      default: return 'text-lg md:text-xl';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 md:h-6 md:w-6" />
            Fashion Forecast Management
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="bg-gold hover:bg-gold/90 w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" /> Add New Item
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto p-0">
              <DialogHeader className="sticky top-0 bg-white z-10 px-6 py-4 border-b">
                <DialogTitle className="text-xl font-semibold">
                  {editingItem ? 'Edit Fashion Forecast Item' : 'Add New Fashion Forecast Item'}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="px-6 py-4 space-y-8">
                {/* Basic Information Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Basic Information</h3>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-sm font-medium">
                        Title <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="e.g., STRIKING SUITS"
                        className="w-full"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="discount" className="text-sm font-medium">
                        Discount Text <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="discount"
                        name="discount"
                        value={formData.discount}
                        onChange={handleInputChange}
                        placeholder="e.g., Min. 60% Off"
                        className="w-full"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="link" className="text-sm font-medium">
                        Link URL <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="link"
                        name="link"
                        value={formData.link}
                        onChange={handleInputChange}
                        placeholder="e.g., /products?category=men&search=suit"
                        className="w-full"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Image Settings Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Image Settings</h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="image_url" className="text-sm font-medium">
                        Image URL <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="image_url"
                        name="image_url"
                        value={formData.image_url}
                        onChange={handleInputChange}
                        placeholder="https://example.com/image.jpg"
                        className="w-full"
                        required
                      />
                    </div>

                    {formData.image_url && (
                      <div className="mt-4">
                        <Label className="text-sm font-medium mb-2 block">Preview</Label>
                        <div className="relative w-full overflow-hidden rounded-lg border bg-gray-50 aspect-video">
                          <img
                            src={formData.image_url}
                            alt="Preview"
                            className="w-full h-full object-cover"
                            style={{ 
                              objectPosition: formData.focal_point === 'top' ? 'center 0%' : 
                                             formData.focal_point === 'bottom' ? 'center 100%' : 
                                             'center' 
                            }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x400?text=Invalid+Image+URL';
                            }}
                          />
                          <div 
                            className="absolute inset-0 pointer-events-none" 
                            style={{ backgroundColor: `rgba(0,0,0,${formData.overlay_opacity / 100})` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Image Focus Point</Label>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant={formData.focal_point === 'top' ? 'default' : 'outline'}
                          onClick={() => handleFocalPointChange('top')}
                          className={formData.focal_point === 'top' ? 'bg-gold hover:bg-gold/90' : ''}
                        >
                          <ArrowUp className="h-4 w-4 mr-2" /> Top
                        </Button>
                        <Button
                          type="button"
                          variant={formData.focal_point === 'center' ? 'default' : 'outline'}
                          onClick={() => handleFocalPointChange('center')}
                          className={formData.focal_point === 'center' ? 'bg-gold hover:bg-gold/90' : ''}
                        >
                          <MoveVertical className="h-4 w-4 mr-2" /> Center
                        </Button>
                        <Button
                          type="button"
                          variant={formData.focal_point === 'bottom' ? 'default' : 'outline'}
                          onClick={() => handleFocalPointChange('bottom')}
                          className={formData.focal_point === 'bottom' ? 'bg-gold hover:bg-gold/90' : ''}
                        >
                          <ArrowDown className="h-4 w-4 mr-2" /> Bottom
                        </Button>
                      </div>
                      <p className="text-sm text-gray-500">
                        {formData.focal_point === 'top' && 'Shows the top part - good for faces'}
                        {formData.focal_point === 'center' && 'Shows the center part (default)'}
                        {formData.focal_point === 'bottom' && 'Shows the bottom part - crops top'}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Overlay Darkness ({formData.overlay_opacity}%)</Label>
                      <div className="flex items-center gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleOverlayChange(formData.overlay_opacity - 5)}
                          disabled={formData.overlay_opacity <= 0}
                          className="h-9 w-9"
                        >
                          <MinusCircle className="h-4 w-4" />
                        </Button>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={formData.overlay_opacity}
                          onChange={(e) => handleOverlayChange(parseInt(e.target.value))}
                          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleOverlayChange(formData.overlay_opacity + 5)}
                          disabled={formData.overlay_opacity >= 100}
                          className="h-9 w-9"
                        >
                          <PlusCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Text Settings Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Text Settings</h3>

                  <div className="space-y-4">
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Text Alignment</Label>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant={formData.alignment === 'left' ? 'default' : 'outline'}
                          onClick={() => handleAlignmentChange('left')}
                          className={formData.alignment === 'left' ? 'bg-gold hover:bg-gold/90' : ''}
                        >
                          <AlignLeft className="h-4 w-4 mr-2" /> Left
                        </Button>
                        <Button
                          type="button"
                          variant={formData.alignment === 'center' ? 'default' : 'outline'}
                          onClick={() => handleAlignmentChange('center')}
                          className={formData.alignment === 'center' ? 'bg-gold hover:bg-gold/90' : ''}
                        >
                          <AlignCenter className="h-4 w-4 mr-2" /> Center
                        </Button>
                        <Button
                          type="button"
                          variant={formData.alignment === 'right' ? 'default' : 'outline'}
                          onClick={() => handleAlignmentChange('right')}
                          className={formData.alignment === 'right' ? 'bg-gold hover:bg-gold/90' : ''}
                        >
                          <AlignRight className="h-4 w-4 mr-2" /> Right
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Title Size</Label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { value: 'sm', label: 'Small' },
                          { value: 'md', label: 'Medium' },
                          { value: 'lg', label: 'Large' },
                          { value: 'xl', label: 'X-Large' }
                        ].map((size) => (
                          <Button
                            key={size.value}
                            type="button"
                            variant={formData.title_size === size.value ? 'default' : 'outline'}
                            onClick={() => handleTitleSizeChange(size.value as any)}
                            className={formData.title_size === size.value ? 'bg-gold hover:bg-gold/90' : ''}
                          >
                            {size.label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Discount Size</Label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { value: 'sm', label: 'Small' },
                          { value: 'md', label: 'Medium' },
                          { value: 'lg', label: 'Large' }
                        ].map((size) => (
                          <Button
                            key={size.value}
                            type="button"
                            variant={formData.discount_size === size.value ? 'default' : 'outline'}
                            onClick={() => handleDiscountSizeChange(size.value as any)}
                            className={formData.discount_size === size.value ? 'bg-gold hover:bg-gold/90' : ''}
                          >
                            {size.label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="text_color" className="text-sm font-medium">Text Color</Label>
                      <div className="flex gap-3">
                        <input
                          type="color"
                          id="text_color"
                          name="text_color"
                          value={formData.text_color}
                          onChange={handleInputChange}
                          className="h-10 w-20 rounded border cursor-pointer"
                        />
                        <Input
                          name="text_color"
                          value={formData.text_color}
                          onChange={handleInputChange}
                          placeholder="#FFFFFF"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live Preview Section */}
                {formData.image_url && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Live Preview</Label>
                    <div className="relative w-full overflow-hidden rounded-xl border bg-gray-100 aspect-[21/9]">
                      <div className="absolute inset-0">
                        <img
                          src={formData.image_url}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          style={{ 
                            objectPosition: formData.focal_point === 'top' ? 'center 0%' : 
                                           formData.focal_point === 'bottom' ? 'center 100%' : 
                                           'center' 
                          }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x400?text=Invalid+Image';
                          }}
                        />
                        <div 
                          className="absolute inset-0" 
                          style={{ backgroundColor: `rgba(0,0,0,${formData.overlay_opacity / 100})` }}
                        />
                      </div>
                      <div className={`absolute inset-0 p-4 md:p-8 flex flex-col justify-center 
                        ${formData.alignment === 'left' ? 'items-start text-left' : 
                          formData.alignment === 'right' ? 'items-end text-right' : 
                          'items-center text-center'}`}>
                        <div className="max-w-[80%]" style={{ color: formData.text_color }}>
                          <h3 className={`${getTitleSizeClass(formData.title_size)} font-serif font-bold uppercase tracking-tight mb-1 drop-shadow-lg`}>
                            {formData.title || 'TITLE'}
                          </h3>
                          <p className={`${getDiscountSizeClass(formData.discount_size)} font-medium opacity-90 drop-shadow-md`}>
                            {formData.discount || 'DISCOUNT'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Active Switch */}
                <div className="flex items-center space-x-3 py-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={handleSwitchChange}
                  />
                  <Label htmlFor="is_active" className="text-sm font-medium cursor-pointer">
                    Active
                  </Label>
                </div>

                {/* Form Actions */}
                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t sticky bottom-0 bg-white py-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)} 
                    className="w-full sm:w-24 order-2 sm:order-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-gold hover:bg-gold/90 w-full sm:w-24 order-1 sm:order-2"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {editingItem ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        
        <CardContent className="overflow-x-auto">
          <div className="min-w-[1000px] lg:min-w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Order</TableHead>
                  <TableHead className="w-32">Preview</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Alignment</TableHead>
                  <TableHead>Focus</TableHead>
                  <TableHead>Sizes</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-gray-500">
                      No fashion forecast items found. Click "Add New Item" to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item, index) => (
                    <TableRow key={item.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => moveItem(item.id, 'up')}
                            disabled={index === 0}
                            className="h-8 w-8"
                            title="Move up"
                          >
                            <MoveUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => moveItem(item.id, 'down')}
                            disabled={index === items.length - 1}
                            className="h-8 w-8"
                            title="Move down"
                          >
                            <MoveDown className="h-4 w-4" />
                          </Button>
                          <span className="text-sm text-gray-500 ml-1">{index + 1}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="h-16 w-24 rounded-lg overflow-hidden border bg-gray-50 relative group">
                          <img
                            src={item.image_url}
                            alt={item.title}
                            className="h-full w-full object-cover"
                            style={{ 
                              objectPosition: item.focal_point === 'top' ? 'center 0%' : 
                                             item.focal_point === 'bottom' ? 'center 100%' : 
                                             'center' 
                            }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x200?text=Error';
                            }}
                          />
                          {item.overlay_opacity > 0 && (
                            <div 
                              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" 
                              style={{ backgroundColor: `rgba(0,0,0,${(item.overlay_opacity || 15) / 100})` }}
                            />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium max-w-[150px] truncate">{item.title}</TableCell>
                      <TableCell className="max-w-[120px] truncate">{item.discount}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          item.alignment === 'left' ? 'bg-blue-100 text-blue-800' :
                          item.alignment === 'right' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {item.alignment ? item.alignment.charAt(0).toUpperCase() + item.alignment.slice(1) : 'Left'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          item.focal_point === 'top' ? 'bg-green-100 text-green-800' :
                          item.focal_point === 'bottom' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {item.focal_point ? item.focal_point.charAt(0).toUpperCase() + item.focal_point.slice(1) : 'Center'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-gray-600">T: {item.title_size || 'lg'}</span>
                          <span className="text-xs text-gray-600">D: {item.discount_size || 'md'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleActive(item.id, item.is_active)}
                          className={item.is_active ? 'text-green-600 hover:text-green-700' : 'text-gray-400 hover:text-gray-500'}
                          title={item.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {item.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(item)}
                          className="mr-1 hover:text-gold"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setItemToDelete(item.id);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-red-600 hover:text-red-700"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              This action cannot be undone. This will permanently delete this fashion forecast item.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => itemToDelete && handleDelete(itemToDelete)}
              className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminFashionForecast;