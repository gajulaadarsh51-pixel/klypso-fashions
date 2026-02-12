import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { 
  useAllTrendingSlides, 
  useTrendingDeals, 
  useCreateTrendingSlide,
  useUpdateTrendingSlide,
  useDeleteTrendingSlide,
  useCreateTrendingDeal,
  useUpdateTrendingDeal,
  useDeleteTrendingDeal,
  processGoogleDriveUrl,
  processGoogleDriveVideoUrl,
  type TrendingSlide,
  type TrendingDeal,
  type SlideType
} from '@/hooks/useTrendingSlides';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Loader2, 
  Plus, 
  Edit, 
  Trash2, 
  Link as LinkIcon, 
  Video, 
  Image as ImageIcon,
  ShoppingBag,
  Sparkles,
  Zap,
  LayoutGrid,
  AlertCircle,
  GripVertical,
  Tag
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// ============== CONSTANTS ==============
const slideTypeOptions = [
  { value: 'deals', label: 'Deals Grid (4 Products)', icon: ShoppingBag, description: 'Shows 4 product deals in a grid', color: 'bg-green-100 text-green-800' },
  { value: 'premium', label: 'Premium Suits', icon: Sparkles, description: 'Luxury collection with image', color: 'bg-blue-100 text-blue-800' },
  { value: 'street', label: 'Street Mode', icon: Zap, description: 'Street fashion with CTA button', color: 'bg-purple-100 text-purple-800' },
  { value: 'grid', label: 'Product Grid', icon: LayoutGrid, description: 'Custom product grid layout', color: 'bg-amber-100 text-amber-800' },
  { value: 'video', label: 'Video Slide', icon: Video, description: 'Embed YouTube/Google Drive video', color: 'bg-red-100 text-red-800' },
  { value: 'custom', label: 'Custom Slide', icon: LayoutGrid, description: 'Custom content with image', color: 'bg-gray-100 text-gray-800' },
];

const colorSchemes = [
  {
    name: 'Sage Green',
    background: 'from-[#E0E6D8] to-[#D0D8C8]',
    accent: 'bg-[#6C7F6C]',
    text: 'text-[#5C6F5C]',
    subtitle: 'text-[#7C8F7C]',
    preview: 'bg-gradient-to-br from-[#E0E6D8] to-[#D0D8C8]',
    button: 'bg-[#6C7F6C]'
  },
  {
    name: 'Steel Blue',
    background: 'from-[#D8E0E6] to-[#C8D0D8]',
    accent: 'bg-[#6C7F8A]',
    text: 'text-[#5C6F7A]',
    subtitle: 'text-[#7C8F9A]',
    preview: 'bg-gradient-to-br from-[#D8E0E6] to-[#C8D0D8]',
    button: 'bg-[#6C7F8A]'
  },
  {
    name: 'Dusty Mauve',
    background: 'from-[#E0D8E0] to-[#D0C8D0]',
    accent: 'bg-[#7C6C7C]',
    text: 'text-[#6C5C6C]',
    subtitle: 'text-[#8C7C8C]',
    preview: 'bg-gradient-to-br from-[#E0D8E0] to-[#D0C8D0]',
    button: 'bg-[#7C6C7C]'
  },
  {
    name: 'Old Paper',
    background: 'from-[#E8E0D8] to-[#D8D0C8]',
    accent: 'bg-[#7C6C5C]',
    text: 'text-[#6C5C4C]',
    subtitle: 'text-[#8C7C6C]',
    preview: 'bg-gradient-to-br from-[#E8E0D8] to-[#D8D0C8]',
    button: 'bg-[#7C6C5C]'
  },
  {
    name: 'Charcoal',
    background: 'from-[#4A4A4A] to-[#2C2C2C]',
    accent: 'bg-[#6B6B6B]',
    text: 'text-white',
    subtitle: 'text-gray-300',
    preview: 'bg-gradient-to-br from-[#4A4A4A] to-[#2C2C2C]',
    button: 'bg-[#6B6B6B]'
  },
  {
    name: 'Burgundy',
    background: 'from-[#800020] to-[#4A0010]',
    accent: 'bg-[#9B1B30]',
    text: 'text-white',
    subtitle: 'text-pink-200',
    preview: 'bg-gradient-to-br from-[#800020] to-[#4A0010]',
    button: 'bg-[#9B1B30]'
  }
];

// ============== MAIN COMPONENT ==============
const AdminTrendingSlides = () => {
  const { data: slides = [], isLoading } = useAllTrendingSlides();
  const [selectedSlide, setSelectedSlide] = useState<TrendingSlide | null>(null);
  const [isSlideDialogOpen, setIsSlideDialogOpen] = useState(false);
  const [isDealDialogOpen, setIsDealDialogOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<TrendingDeal | null>(null);
  const [selectedSlideForDeals, setSelectedSlideForDeals] = useState<TrendingSlide | null>(null);
  const [activeTab, setActiveTab] = useState('slides');

  const deleteSlide = useDeleteTrendingSlide();
  
  // ALL slides can have deals now - no filtering!
  const allSlides = slides;

  // Reset selected slide for deals when slides change
  useEffect(() => {
    if (allSlides.length > 0 && !selectedSlideForDeals) {
      setSelectedSlideForDeals(allSlides[0]);
    }
  }, [allSlides, selectedSlideForDeals]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Trending Slides</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage your trending slide deck
          </p>
        </div>
        <Button 
          size="lg"
          onClick={() => {
            setSelectedSlide(null);
            setIsSlideDialogOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Slide
        </Button>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin h-8 w-8" />
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="slides">
              All Slides ({allSlides.length})
            </TabsTrigger>
            <TabsTrigger value="deals" disabled={allSlides.length === 0}>
              Deals Management ({allSlides.length} slides)
            </TabsTrigger>
          </TabsList>

          {/* Slides Tab */}
          <TabsContent value="slides" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>All Slides</CardTitle>
                <CardDescription>
                  All slides in the trending section - Click edit to configure
                </CardDescription>
              </CardHeader>
              <CardContent>
                {allSlides.length === 0 ? (
                  <div className="text-center py-12">
                    <LayoutGrid className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No slides yet</h3>
                    <p className="text-muted-foreground mb-4">Create your first trending slide</p>
                    <Button onClick={() => setIsSlideDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Slide
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[80px]">Order</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Subtitle</TableHead>
                          <TableHead>Discount</TableHead>
                          <TableHead>Preview</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allSlides.map((slide) => {
                          const typeOption = slideTypeOptions.find(t => t.value === slide.slide_type);
                          const Icon = typeOption?.icon || LayoutGrid;
                          
                          return (
                            <TableRow key={slide.id}>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                                  <span className="font-mono text-sm">{slide.slide_order}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className={`p-1.5 rounded-md ${typeOption?.color || 'bg-gray-100'}`}>
                                    <Icon className="h-4 w-4" />
                                  </div>
                                  <span className="capitalize font-medium">{slide.slide_type}</span>
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">{slide.title}</TableCell>
                              <TableCell>{slide.subtitle || '-'}</TableCell>
                              <TableCell>
                                {slide.discount ? (
                                  <Badge variant="outline" className="bg-green-50">
                                    {slide.discount}
                                  </Badge>
                                ) : '-'}
                              </TableCell>
                              <TableCell>
                                <div className={`w-12 h-12 rounded bg-gradient-to-br ${slide.background_gradient} border flex items-center justify-center`}>
                                  {slide.slide_type === 'video' && <Video className="h-5 w-5 text-white" />}
                                  {slide.slide_type === 'deals' && <ShoppingBag className="h-5 w-5 text-white" />}
                                  {slide.slide_type === 'premium' && <Sparkles className="h-5 w-5 text-white" />}
                                  {slide.slide_type === 'street' && <Zap className="h-5 w-5 text-white" />}
                                  {slide.slide_type === 'grid' && <LayoutGrid className="h-5 w-5 text-white" />}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={slide.is_active ? 'default' : 'secondary'}>
                                  {slide.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  {/* EVERY slide can have deals now - button always shows */}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedSlideForDeals(slide);
                                      setActiveTab('deals');
                                    }}
                                  >
                                    <Tag className="w-4 h-4 mr-2" />
                                    Deals
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedSlide(slide);
                                      setIsSlideDialogOpen(true);
                                    }}
                                  >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => {
                                      if (confirm('Are you sure you want to delete this slide? This will also delete all associated deals.')) {
                                        deleteSlide.mutate(slide.id);
                                      }
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Deals Tab - NOW WORKS FOR ALL SLIDE TYPES */}
          <TabsContent value="deals">
            {allSlides.length > 0 ? (
              <DealsManagement 
                slides={allSlides} // Pass ALL slides, not just 'deals' type
                selectedSlideId={selectedSlideForDeals?.id}
                onEditDeal={(deal) => {
                  setEditingDeal(deal);
                  setIsDealDialogOpen(true);
                }}
                onSlideChange={(slideId) => {
                  const slide = allSlides.find(s => s.id === slideId);
                  setSelectedSlideForDeals(slide || null);
                }}
              />
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <LayoutGrid className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Slides Found</h3>
                  <p className="text-muted-foreground mb-4">
                    Create a slide first to manage deals
                  </p>
                  <Button onClick={() => {
                    setActiveTab('slides');
                    setIsSlideDialogOpen(true);
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Slide
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Slide Dialog */}
      <SlideDialog
        open={isSlideDialogOpen}
        onOpenChange={setIsSlideDialogOpen}
        slide={selectedSlide}
        onSuccess={() => {
          setIsSlideDialogOpen(false);
          setSelectedSlide(null);
        }}
      />

      {/* Deal Dialog - NOW RECEIVES ALL SLIDES */}
      <DealDialog
        open={isDealDialogOpen}
        onOpenChange={setIsDealDialogOpen}
        deal={editingDeal}
        slides={allSlides} // Pass ALL slides, not just 'deals' type
        selectedSlideId={selectedSlideForDeals?.id}
        onSuccess={() => {
          setIsDealDialogOpen(false);
          setEditingDeal(null);
        }}
      />
    </div>
  );
};

// ============== SLIDE DIALOG COMPONENT ==============
const SlideDialog = ({ 
  open, 
  onOpenChange, 
  slide, 
  onSuccess 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  slide: TrendingSlide | null; 
  onSuccess: () => void;
}) => {
  const [slideType, setSlideType] = useState<SlideType>(slide?.slide_type || 'deals');
  const [formData, setFormData] = useState({
    title: slide?.title || '',
    subtitle: slide?.subtitle || '',
    discount: slide?.discount || '',
    offer_text: slide?.offer_text || '',
    background_gradient: slide?.background_gradient || colorSchemes[0].background,
    accent_color: slide?.accent_color || colorSchemes[0].accent,
    text_color: slide?.text_color || colorSchemes[0].text,
    subtitle_color: slide?.subtitle_color || colorSchemes[0].subtitle,
    image_url: slide?.image_url || '',
    image_drive_id: slide?.image_drive_id || '',
    video_url: slide?.video_url || '',
    video_drive_id: slide?.video_drive_id || '',
    link: slide?.link || '',
    button_text: slide?.button_text || 'SHOP NOW',
    button_link: slide?.button_link || '',
    slide_order: slide?.slide_order || 0,
    is_active: slide?.is_active ?? true,
  });

  const [imagePreviewUrl, setImagePreviewUrl] = useState(
    slide?.image_url ? processGoogleDriveUrl(slide.image_url) : ''
  );
  const [videoPreviewUrl, setVideoPreviewUrl] = useState(
    slide?.video_url ? processGoogleDriveVideoUrl(slide.video_url) : ''
  );

  const createSlide = useCreateTrendingSlide();
  const updateSlide = useUpdateTrendingSlide();

  useEffect(() => {
    if (open) {
      setSlideType(slide?.slide_type || 'deals');
      setFormData({
        title: slide?.title || '',
        subtitle: slide?.subtitle || '',
        discount: slide?.discount || '',
        offer_text: slide?.offer_text || '',
        background_gradient: slide?.background_gradient || colorSchemes[0].background,
        accent_color: slide?.accent_color || colorSchemes[0].accent,
        text_color: slide?.text_color || colorSchemes[0].text,
        subtitle_color: slide?.subtitle_color || colorSchemes[0].subtitle,
        image_url: slide?.image_url || '',
        image_drive_id: slide?.image_drive_id || '',
        video_url: slide?.video_url || '',
        video_drive_id: slide?.video_drive_id || '',
        link: slide?.link || '',
        button_text: slide?.button_text || 'SHOP NOW',
        button_link: slide?.button_link || '',
        slide_order: slide?.slide_order || 0,
        is_active: slide?.is_active ?? true,
      });
      setImagePreviewUrl(slide?.image_url ? processGoogleDriveUrl(slide.image_url) : '');
      setVideoPreviewUrl(slide?.video_url ? processGoogleDriveVideoUrl(slide.video_url) : '');
    }
  }, [slide, open]);

  const handleColorSchemeChange = (schemeName: string) => {
    const scheme = colorSchemes.find(s => s.name === schemeName);
    if (scheme) {
      setFormData(prev => ({
        ...prev,
        background_gradient: scheme.background,
        accent_color: scheme.accent,
        text_color: scheme.text,
        subtitle_color: scheme.subtitle
      }));
    }
  };

  const handleImageUrlChange = (url: string) => {
    setFormData(prev => ({ ...prev, image_url: url }));
    setImagePreviewUrl(processGoogleDriveUrl(url));
  };

  const handleVideoUrlChange = (url: string) => {
    setFormData(prev => ({ ...prev, video_url: url }));
    setVideoPreviewUrl(processGoogleDriveVideoUrl(url));
  };

  const handleSubmit = async () => {
    if (!formData.title) {
      alert('Title is required');
      return;
    }

    const slideData = {
      ...formData,
      slide_type: slideType,
    };

    try {
      if (slide) {
        await updateSlide.mutateAsync({ id: slide.id, ...slideData });
      } else {
        await createSlide.mutateAsync(slideData as any);
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving slide:', error);
    }
  };

  const selectedScheme = colorSchemes.find(
    s => s.background === formData.background_gradient
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {slide ? 'Edit Slide' : 'Create New Slide'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Slide Type Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Slide Type</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {slideTypeOptions.map((type) => {
                const Icon = type.icon;
                const isSelected = slideType === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setSlideType(type.value as SlideType)}
                    className={`
                      relative flex items-start gap-2 p-3 rounded-lg border-2 transition-all
                      ${isSelected 
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                        : 'border-border hover:border-primary/50'
                      }
                    `}
                  >
                    <div className={`
                      p-1.5 rounded-md shrink-0
                      ${type.color}
                    `}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-sm">{type.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {type.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preview Badge */}
          {selectedScheme && (
            <Alert className="border-l-4" style={{ borderLeftColor: selectedScheme.accent.replace('bg-', '#') }}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center gap-3 flex-wrap">
                <div className={`w-4 h-4 rounded ${selectedScheme.preview}`} />
                <span className={selectedScheme.text}>Sample Text</span>
                <span className={selectedScheme.subtitle}>Sample Subtitle</span>
                <span className={`px-2 py-0.5 text-xs text-white rounded ${selectedScheme.accent}`}>
                  Button
                </span>
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Shopping Deals"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subtitle">Subtitle</Label>
                <Input
                  id="subtitle"
                  value={formData.subtitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                  placeholder="Flash Sale"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="discount">Discount</Label>
                  <Input
                    id="discount"
                    value={formData.discount}
                    onChange={(e) => setFormData(prev => ({ ...prev, discount: e.target.value }))}
                    placeholder="67%"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="offer_text">Offer Text</Label>
                  <Input
                    id="offer_text"
                    value={formData.offer_text}
                    onChange={(e) => setFormData(prev => ({ ...prev, offer_text: e.target.value }))}
                    placeholder="Hot Deals"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Color Scheme</Label>
                <Select onValueChange={handleColorSchemeChange} value={selectedScheme?.name}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a color scheme">
                      {selectedScheme?.name || 'Select a color scheme'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {colorSchemes.map((scheme) => (
                      <SelectItem key={scheme.name} value={scheme.name}>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded ${scheme.preview}`} />
                          {scheme.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="button_text">Button Text</Label>
                  <Input
                    id="button_text"
                    value={formData.button_text}
                    onChange={(e) => setFormData(prev => ({ ...prev, button_text: e.target.value }))}
                    placeholder="SHOP NOW"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="button_link">Button Link</Label>
                  <Input
                    id="button_link"
                    value={formData.button_link}
                    onChange={(e) => setFormData(prev => ({ ...prev, button_link: e.target.value }))}
                    placeholder="/products"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="link">General Link</Label>
                <Input
                  id="link"
                  value={formData.link}
                  onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                  placeholder="/products?category=..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="slide_order">Display Order</Label>
                  <Input
                    id="slide_order"
                    type="number"
                    value={formData.slide_order}
                    onChange={(e) => setFormData(prev => ({ ...prev, slide_order: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <div className="flex items-center gap-2 pt-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                    />
                    <Label htmlFor="is_active" className="text-sm">
                      {formData.is_active ? 'Active' : 'Inactive'}
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Image Section */}
          <div className="space-y-3 border rounded-lg p-4">
            <Label className="text-base font-semibold flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Image (Google Drive Supported)
            </Label>
            <div className="flex gap-2">
              <Input
                value={formData.image_url}
                onChange={(e) => handleImageUrlChange(e.target.value)}
                placeholder="https://images.unsplash.com/... or Google Drive URL"
                className="flex-1"
              />
              <Button variant="outline" size="icon" asChild>
                <a href="https://drive.google.com" target="_blank" rel="noopener noreferrer">
                  <LinkIcon className="w-4 h-4" />
                </a>
              </Button>
            </div>
            {imagePreviewUrl && (
              <div className="mt-2 rounded-lg overflow-hidden border w-40 h-40 bg-gray-50">
                <img 
                  src={imagePreviewUrl} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x400?text=Image+Not+Found';
                  }}
                />
              </div>
            )}
          </div>

          {/* Video Section */}
          {(slideType === 'video' || formData.video_url) && (
            <div className="space-y-3 border rounded-lg p-4">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Video className="h-4 w-4" />
                Video URL (YouTube / Google Drive)
              </Label>
              <div className="flex gap-2">
                <Input
                  value={formData.video_url}
                  onChange={(e) => handleVideoUrlChange(e.target.value)}
                  placeholder="https://youtube.com/watch?v=... or Google Drive URL"
                  className="flex-1"
                />
                <Button variant="outline" size="icon" asChild>
                  <a href="https://drive.google.com" target="_blank" rel="noopener noreferrer">
                    <LinkIcon className="w-4 h-4" />
                  </a>
                </Button>
              </div>
              {videoPreviewUrl && (
                <div className="mt-2 rounded-lg overflow-hidden border aspect-video w-full max-w-md bg-gray-50">
                  <iframe
                    src={videoPreviewUrl}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Video preview"
                  />
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={createSlide.isPending || updateSlide.isPending}
              className="min-w-[100px]"
            >
              {(createSlide.isPending || updateSlide.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {slide ? 'Update' : 'Create'} Slide
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ============== DEALS MANAGEMENT COMPONENT - NOW WORKS FOR ALL SLIDES ==============
const DealsManagement = ({ 
  slides, 
  selectedSlideId,
  onEditDeal,
  onSlideChange
}: { 
  slides: TrendingSlide[]; 
  selectedSlideId?: number;
  onEditDeal: (deal: TrendingDeal) => void;
  onSlideChange: (slideId: number) => void;
}) => {
  const [localSelectedSlideId, setLocalSelectedSlideId] = useState<number>(
    selectedSlideId || slides[0]?.id
  );
  const { data: deals = [], isLoading } = useTrendingDeals(localSelectedSlideId);
  const deleteDeal = useDeleteTrendingDeal();

  useEffect(() => {
    if (selectedSlideId) {
      setLocalSelectedSlideId(selectedSlideId);
    }
  }, [selectedSlideId]);

  useEffect(() => {
    if (slides.length > 0 && !localSelectedSlideId) {
      setLocalSelectedSlideId(slides[0].id);
    }
  }, [slides, localSelectedSlideId]);

  const handleSlideChange = (value: string) => {
    const slideId = parseInt(value);
    setLocalSelectedSlideId(slideId);
    onSlideChange(slideId);
  };

  const currentSlide = slides.find(s => s.id === localSelectedSlideId);
  const typeOption = slideTypeOptions.find(t => t.value === currentSlide?.slide_type);

  if (slides.length === 0) {
    return (
      <div className="text-center py-8">
        <LayoutGrid className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No Slides</h3>
        <p className="text-muted-foreground">Create a slide first to manage deals</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Deals Management</CardTitle>
            <CardDescription>
              Manage product deals for any slide type - each slide can have its own deals
            </CardDescription>
          </div>
          <Button 
            onClick={() => onEditDeal({} as TrendingDeal)}
            disabled={!localSelectedSlideId}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Deal
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Slide Selector - SHOWS ALL SLIDES */}
          <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
            <Label className="font-medium min-w-[120px]">Select Slide:</Label>
            <Select 
              value={localSelectedSlideId?.toString()} 
              onValueChange={handleSlideChange}
            >
              <SelectTrigger className="w-[450px]">
                <SelectValue placeholder="Select a slide" />
              </SelectTrigger>
              <SelectContent>
                {slides.map((slide) => {
                  const typeOption = slideTypeOptions.find(t => t.value === slide.slide_type);
                  const Icon = typeOption?.icon || LayoutGrid;
                  return (
                    <SelectItem key={slide.id} value={slide.id.toString()}>
                      <div className="flex items-center gap-3">
                        <div className={`p-1 rounded-md ${typeOption?.color || 'bg-gray-100'}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="font-medium">{slide.title}</span>
                        <span className="text-xs text-muted-foreground">
                          ({slide.slide_type} • Order: {slide.slide_order})
                        </span>
                        {slide.id === localSelectedSlideId && (
                          <Badge variant="secondary" className="ml-2 text-xs">Current</Badge>
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Current Slide Info - Shows type and color */}
          {currentSlide && (
            <Alert className="border-l-4" style={{ 
              borderLeftColor: currentSlide.accent_color?.replace('bg-', '#') || '#6C7F6C' 
            }}>
              <div className={`p-1 rounded-md ${typeOption?.color || 'bg-gray-100'} mr-2`}>
                {typeOption && <typeOption.icon className="h-4 w-4" />}
              </div>
              <AlertDescription className="flex justify-between items-center w-full">
                <span>
                  Managing deals for: <span className="font-semibold">{currentSlide.title}</span>
                  <span className="ml-2 text-xs text-muted-foreground capitalize">
                    ({currentSlide.slide_type})
                  </span>
                </span>
                <Badge className={currentSlide.accent_color + ' text-white'}>
                  Order: {currentSlide.slide_order}
                </Badge>
              </AlertDescription>
            </Alert>
          )}

          {/* Deals Grid */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin h-8 w-8" />
            </div>
          ) : deals.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No deals yet</h3>
              <p className="text-muted-foreground mb-4">
                Add your first product deal for "{currentSlide?.title}"
              </p>
              <Button onClick={() => onEditDeal({} as TrendingDeal)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Deal
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {deals.map((deal) => (
                <Card key={deal.id} className="overflow-hidden group hover:shadow-lg transition-all relative">
                  <div className="aspect-square bg-gradient-to-br from-[#FDF4E6] to-[#FEF9F0] relative">
                    {deal.image_url ? (
                      <img 
                        src={processGoogleDriveUrl(deal.image_url)} 
                        alt={deal.title}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x400?text=No+Image';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-7xl">{deal.emoji}</span>
                      </div>
                    )}
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-gradient-to-r from-[#C19A6B] to-[#8B5A2B] text-white border-0 shadow-lg">
                        {deal.discount} OFF
                      </Badge>
                    </div>
                    
                    {/* Edit Overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="shadow-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditDeal(deal);
                        }}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="shadow-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Delete this deal?')) {
                            deleteDeal.mutate({ id: deal.id, slide_id: deal.slide_id });
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 truncate">{deal.title}</h3>
                        <p className="text-sm text-muted-foreground capitalize truncate">{deal.category}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            Order: {deal.deal_order}
                          </Badge>
                          <Badge variant={deal.is_active ? 'default' : 'secondary'} className="text-xs">
                            {deal.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        {deal.link && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            Link: {deal.link}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {/* Add Deal Card */}
              <Card className="overflow-hidden border-2 border-dashed hover:border-primary/50 transition-colors">
                <button
                  onClick={() => onEditDeal({} as TrendingDeal)}
                  className="w-full h-full aspect-square flex flex-col items-center justify-center gap-2 p-6 hover:bg-muted/50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Plus className="w-6 h-6 text-primary" />
                  </div>
                  <span className="font-medium text-sm">Add New Deal</span>
                  <span className="text-xs text-muted-foreground text-center">
                    for {currentSlide?.title}
                  </span>
                </button>
              </Card>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// ============== DEAL DIALOG COMPONENT - NOW WORKS FOR ALL SLIDES ==============
const DealDialog = ({ 
  open, 
  onOpenChange, 
  deal, 
  slides,
  selectedSlideId,
  onSuccess 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  deal: TrendingDeal | null; 
  slides: TrendingSlide[]; // Now receives ALL slides
  selectedSlideId?: number;
  onSuccess: () => void;
}) => {
  const [formData, setFormData] = useState({
    discount: deal?.discount || '',
    title: deal?.title || '',
    emoji: deal?.emoji || '🛍️',
    category: deal?.category || '',
    link: deal?.link || '',
    image_url: deal?.image_url || '',
    image_drive_id: deal?.image_drive_id || '',
    deal_order: deal?.deal_order || 0,
    slide_id: deal?.slide_id || selectedSlideId || (slides.length > 0 ? slides[0].id : 0),
    is_active: deal?.is_active ?? true,
  });

  const [previewUrl, setPreviewUrl] = useState(
    deal?.image_url ? processGoogleDriveUrl(deal.image_url) : ''
  );

  const createDeal = useCreateTrendingDeal();
  const updateDeal = useUpdateTrendingDeal();

  useEffect(() => {
    if (open) {
      setFormData({
        discount: deal?.discount || '',
        title: deal?.title || '',
        emoji: deal?.emoji || '🛍️',
        category: deal?.category || '',
        link: deal?.link || '',
        image_url: deal?.image_url || '',
        image_drive_id: deal?.image_drive_id || '',
        deal_order: deal?.deal_order || 0,
        slide_id: deal?.slide_id || selectedSlideId || (slides.length > 0 ? slides[0].id : 0),
        is_active: deal?.is_active ?? true,
      });
      setPreviewUrl(deal?.image_url ? processGoogleDriveUrl(deal.image_url) : '');
    }
  }, [deal, open, selectedSlideId, slides]);

  const handleImageUrlChange = (url: string) => {
    setFormData(prev => ({ ...prev, image_url: url }));
    setPreviewUrl(processGoogleDriveUrl(url));
  };

  const handleSubmit = async () => {
    if (!formData.discount || !formData.title) {
      alert('Discount and Title are required');
      return;
    }

    if (!formData.slide_id) {
      alert('Please select a slide');
      return;
    }

    try {
      if (deal) {
        await updateDeal.mutateAsync({ id: deal.id, ...formData });
      } else {
        await createDeal.mutateAsync(formData as any);
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving deal:', error);
    }
  };

  const emojis = ['⌚', '👟', '🎧', '🧥', '👕', '👗', '👔', '👖', '🧣', '🧤', '🧦', '👞', '👠', '👡', '👢', '💍', '🕶️', '🧢', '🎩', '🛍️', '📱', '💻', '🎮', '📷', '🔊', '🎸', '🏀', '⚽', '🎾'];

  const currentSlide = slides.find(s => s.id === formData.slide_id);
  const typeOption = slideTypeOptions.find(t => t.value === currentSlide?.slide_type);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {deal ? 'Edit Deal' : 'Create New Deal'}
          </DialogTitle>
          {currentSlide && (
            <div className="flex items-center gap-2 mt-1">
              <div className={`p-1 rounded-md ${typeOption?.color || 'bg-gray-100'}`}>
                {typeOption && <typeOption.icon className="h-4 w-4" />}
              </div>
              <p className="text-sm text-muted-foreground">
                {deal ? 'Editing deal for:' : 'Adding deal to:'} 
                <span className="font-semibold ml-1">{currentSlide.title}</span>
                <span className="ml-1 text-xs capitalize">({currentSlide.slide_type})</span>
              </p>
            </div>
          )}
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Slide Selection - SHOWS ALL SLIDES with icons and colors */}
          <div className="space-y-2">
            <Label htmlFor="deal_slide_id">
              Assign to Slide <span className="text-red-500">*</span>
            </Label>
            <Select 
              value={formData.slide_id.toString()} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, slide_id: parseInt(value) }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a slide" />
              </SelectTrigger>
              <SelectContent>
                {slides.map((slide) => {
                  const typeOption = slideTypeOptions.find(t => t.value === slide.slide_type);
                  const Icon = typeOption?.icon || LayoutGrid;
                  return (
                    <SelectItem key={slide.id} value={slide.id.toString()}>
                      <div className="flex items-center gap-3">
                        <div className={`p-1 rounded-md ${typeOption?.color || 'bg-gray-100'}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="font-medium">{slide.title}</span>
                        <span className="text-xs text-muted-foreground">
                          ({slide.slide_type} • Order: {slide.slide_order})
                        </span>
                        {slide.id === formData.slide_id && (
                          <Badge variant="secondary" className="ml-2 text-xs">Selected</Badge>
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {slides.length === 0 && (
              <p className="text-sm text-red-500 mt-1">
                No slides available. Please create a slide first.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deal_discount">Discount <span className="text-red-500">*</span></Label>
              <Input
                id="deal_discount"
                value={formData.discount}
                onChange={(e) => setFormData(prev => ({ ...prev, discount: e.target.value }))}
                placeholder="67%"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deal_title">Title <span className="text-red-500">*</span></Label>
              <Input
                id="deal_title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Smart Watch"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emoji">Emoji</Label>
              <Select 
                value={formData.emoji} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, emoji: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select emoji" />
                </SelectTrigger>
                <SelectContent>
                  {emojis.map((emoji) => (
                    <SelectItem key={emoji} value={emoji}>
                      <span className="text-2xl mr-2">{emoji}</span> {emoji}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                placeholder="accessories"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deal_link">Product Link</Label>
            <Input
              id="deal_link"
              value={formData.link}
              onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
              placeholder="/products?category=..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deal_image_url">Image URL (Google Drive supported)</Label>
            <div className="flex gap-2">
              <Input
                id="deal_image_url"
                value={formData.image_url}
                onChange={(e) => handleImageUrlChange(e.target.value)}
                placeholder="https://images.unsplash.com/... or Google Drive URL"
                className="flex-1"
              />
              <Button variant="outline" size="icon" asChild>
                <a href="https://drive.google.com" target="_blank" rel="noopener noreferrer">
                  <LinkIcon className="w-4 h-4" />
                </a>
              </Button>
            </div>
            {previewUrl && (
              <div className="mt-2 rounded-md overflow-hidden border w-24 h-24 bg-gray-50">
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200x200?text=No+Image';
                  }}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deal_order">Display Order</Label>
              <Input
                id="deal_order"
                type="number"
                value={formData.deal_order}
                onChange={(e) => setFormData(prev => ({ ...prev, deal_order: parseInt(e.target.value) || 0 }))}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex items-center gap-2 pt-2">
                <Switch
                  id="deal_is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="deal_is_active" className="text-sm">
                  {formData.is_active ? 'Active' : 'Inactive'}
                </Label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={createDeal.isPending || updateDeal.isPending || slides.length === 0}
              className="min-w-[100px]"
            >
              {(createDeal.isPending || updateDeal.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {deal ? 'Update' : 'Create'} Deal
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminTrendingSlides;