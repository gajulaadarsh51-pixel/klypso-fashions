// pages/admin/AdminTrendingSlides.tsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import {
  Plus,
  Edit,
  Trash2,
  GripVertical,
  Eye,
  EyeOff,
  Loader2,
  Copy,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Image as ImageIcon,
  Video,
  Link2,
  Palette,
  Type,
  Percent,
  Sparkles,
} from 'lucide-react';
import { useTrendingSlides, TrendingSlide, TrendingDeal } from '@/hooks/useTrendingSlides';
import { processGoogleDriveUrl, getVideoEmbedUrl } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Color presets for quick selection
const COLOR_PRESETS = {
  deals: [
    { name: 'Forest', bg: 'from-[#1B4D3E] to-[#2A6E4B]', border: 'border-[#9DC183]', accent: 'text-[#E6D5B8]' },
    { name: 'Ocean', bg: 'from-[#0B3B5C] to-[#1A5F7A]', border: 'border-[#3B9EBF]', accent: 'text-[#B0E0FF]' },
    { name: 'Royal', bg: 'from-[#301934] to-[#4B0082]', border: 'border-[#9370DB]', accent: 'text-[#E6E6FA]' },
    { name: 'Slate', bg: 'from-[#4A4A4A] to-[#2C3E50]', border: 'border-[#BDC3C7]', accent: 'text-white' },
    { name: 'Warm', bg: 'from-[#8B5A2B] to-[#C19A6B]', border: 'border-[#E6B17E]', accent: 'text-[#FDF4E6]' },
    { name: 'Cool', bg: 'from-[#1A5276] to-[#2980B9]', border: 'border-[#5DADE2]', accent: 'text-[#EBF5FB]' },
  ],
  premium_suits: [
    { name: 'Navy', bg: 'from-[#0B3B5C] to-[#1A5F7A]', border: 'border-[#3B9EBF]', accent: 'text-[#B0E0FF]' },
    { name: 'Charcoal', bg: 'from-[#2C3E50] to-[#34495E]', border: 'border-[#7F8C8D]', accent: 'text-[#BDC3C7]' },
    { name: 'Burgundy', bg: 'from-[#6C3483] to-[#8E44AD]', border: 'border-[#C39BD3]', accent: 'text-[#E8DAEF]' },
  ],
  street_mode: [
    { name: 'Purple', bg: 'from-[#301934] to-[#4B0082]', border: 'border-[#9370DB]', accent: 'text-[#E6E6FA]' },
    { name: 'Magenta', bg: 'from-[#8B0A50] to-[#C2185B]', border: 'border-[#F06292]', accent: 'text-[#FCE4EC]' },
    { name: 'Indigo', bg: 'from-[#1A237E] to-[#283593]', border: 'border-[#7986CB]', accent: 'text-[#E8EAF6]' },
  ],
  video_grid: [
    { name: 'Dark', bg: 'from-[#4A4A4A] to-[#2C3E50]', border: 'border-[#BDC3C7]', accent: 'text-white' },
    { name: 'Midnight', bg: 'from-[#0F0F0F] to-[#1A1A1A]', border: 'border-[#4A4A4A]', accent: 'text-[#E0E0E0]' },
    { name: 'Graphite', bg: 'from-[#424242] to-[#616161]', border: 'border-[#9E9E9E]', accent: 'text-[#F5F5F5]' },
  ],
};

const slideSchema = z.object({
  slide_type: z.enum(['deals', 'premium_suits', 'street_mode', 'video_grid']),
  title: z.string().nullable().optional(),
  subtitle: z.string().nullable().optional(),
  discount: z.string().nullable().optional(),
  discount_up_to: z.string().nullable().optional(),
  discount_min: z.string().nullable().optional(),
  button_text: z.string().nullable().optional(),
  button_link: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  video_url: z.string().nullable().optional(),
  emoji: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  bg_color: z.string().nullable().optional(),
  border_color: z.string().nullable().optional(),
  accent_color: z.string().nullable().optional(),
  text_color: z.string().nullable().optional(),
  features: z.array(z.string()).nullable().optional(),
  is_active: z.boolean().default(true),
  display_order: z.number().default(0),
});

const dealSchema = z.object({
  discount: z.string().min(1, 'Discount is required'),
  link: z.string().min(1, 'Link is required'),
  image_url: z.string().nullable().optional(),
  title: z.string().min(1, 'Title is required'),
  emoji: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  display_order: z.number().default(0),
});

type SlideFormData = z.infer<typeof slideSchema>;
type DealFormData = z.infer<typeof dealSchema>;

const AdminTrendingSlides = () => {
  const {
    allSlides,
    allSlidesLoading,
    useSlideDeals,
    createSlide,
    updateSlide,
    deleteSlide,
    duplicateSlide,
    createDeal,
    updateDeal,
    deleteDeal,
    bulkDeleteDeals,
    updateSlideOrder,
  } = useTrendingSlides();

  const [selectedSlide, setSelectedSlide] = useState<TrendingSlide | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<TrendingDeal | null>(null);
  const [isSlideDialogOpen, setIsSlideDialogOpen] = useState(false);
  const [isDealDialogOpen, setIsDealDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewVideo, setPreviewVideo] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('slides');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterActive, setFilterActive] = useState<string>('all');
  const [selectedDeals, setSelectedDeals] = useState<number[]>([]);
  const [expandedSections, setExpandedSections] = useState<string[]>(['basic', 'colors', 'media']);
  const [deleteSlideId, setDeleteSlideId] = useState<number | null>(null);
  const [deleteDealInfo, setDeleteDealInfo] = useState<{ id: number; slide_id: number } | null>(null);

  const slideForm = useForm<SlideFormData>({
    resolver: zodResolver(slideSchema),
    defaultValues: {
      slide_type: 'deals',
      title: '',
      subtitle: '',
      discount: '',
      discount_up_to: '',
      discount_min: '',
      button_text: 'SHOP NOW',
      button_link: '',
      image_url: '',
      video_url: '',
      emoji: '',
      category: '',
      bg_color: '',
      border_color: '',
      accent_color: '',
      text_color: '',
      features: [],
      is_active: true,
      display_order: 0,
    },
  });

  const dealForm = useForm<DealFormData>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      discount: '',
      link: '',
      image_url: '',
      title: '',
      emoji: '',
      category: '',
      display_order: 0,
    },
  });

  // Watch slide type for color presets
  const watchSlideType = slideForm.watch('slide_type');

  useEffect(() => {
    if (isSlideDialogOpen && !selectedSlide) {
      // Reset previews when opening create dialog
      setPreviewImage(null);
      setPreviewVideo(null);
      slideForm.reset({
        slide_type: 'deals',
        title: '',
        subtitle: '',
        discount: '',
        discount_up_to: '',
        discount_min: '',
        button_text: 'SHOP NOW',
        button_link: '',
        image_url: '',
        video_url: '',
        emoji: '',
        category: '',
        bg_color: '',
        border_color: '',
        accent_color: '',
        text_color: '',
        features: [],
        is_active: true,
        display_order: allSlides.length,
      });
    }
  }, [isSlideDialogOpen, selectedSlide, allSlides.length, slideForm]);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(allSlides);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const orderedSlides = items.map((item, index) => ({
      id: item.id,
      display_order: index,
    }));

    await updateSlideOrder.mutateAsync(orderedSlides);
  };

  const handleCreateSlide = () => {
    setSelectedSlide(null);
    slideForm.reset({
      slide_type: 'deals',
      title: '',
      subtitle: '',
      discount: '',
      discount_up_to: '',
      discount_min: '',
      button_text: 'SHOP NOW',
      button_link: '',
      image_url: '',
      video_url: '',
      emoji: '',
      category: '',
      bg_color: '',
      border_color: '',
      accent_color: '',
      text_color: '',
      features: [],
      is_active: true,
      display_order: allSlides.length,
    });
    setIsSlideDialogOpen(true);
  };

  const handleEditSlide = (slide: TrendingSlide) => {
    setSelectedSlide(slide);
    slideForm.reset({
      ...slide,
      features: slide.features || [],
      title: slide.title || '',
      subtitle: slide.subtitle || '',
      discount: slide.discount || '',
      discount_up_to: slide.discount_up_to || '',
      discount_min: slide.discount_min || '',
      button_text: slide.button_text || 'SHOP NOW',
      button_link: slide.button_link || '',
      image_url: slide.image_url || '',
      video_url: slide.video_url || '',
      emoji: slide.emoji || '',
      category: slide.category || '',
      bg_color: slide.bg_color || '',
      border_color: slide.border_color || '',
      accent_color: slide.accent_color || '',
      text_color: slide.text_color || '',
    });
    setIsSlideDialogOpen(true);
  };

  const handleDeleteClick = (id: number) => {
    setDeleteSlideId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteSlideId) {
      await deleteSlide.mutateAsync(deleteSlideId);
      setIsDeleteDialogOpen(false);
      setDeleteSlideId(null);
    }
  };

  const handleDuplicateSlide = async (slide: TrendingSlide) => {
    try {
      await duplicateSlide.mutateAsync(slide);
    } catch (error) {
      console.error('Error duplicating slide:', error);
    }
  };

  const handleSlideSubmit = async (data: SlideFormData) => {
    try {
      // Filter out empty values
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value !== '' && value !== null)
      );
      
      if (selectedSlide) {
        await updateSlide.mutateAsync({ id: selectedSlide.id, ...cleanData });
      } else {
        await createSlide.mutateAsync(cleanData);
      }
      setIsSlideDialogOpen(false);
    } catch (error) {
      console.error('Error saving slide:', error);
    }
  };

  const handleCreateDeal = (slideId: number) => {
    setSelectedDeal(null);
    dealForm.reset({
      discount: '',
      link: '',
      image_url: '',
      title: '',
      emoji: '',
      category: '',
      display_order: 0,
    });
    setIsDealDialogOpen(true);
    const slide = allSlides.find(s => s.id === slideId);
    setSelectedSlide(slide || null);
  };

  const handleEditDeal = (deal: TrendingDeal, slide: TrendingSlide) => {
    setSelectedDeal(deal);
    setSelectedSlide(slide);
    dealForm.reset({
      ...deal,
      image_url: deal.image_url || '',
      emoji: deal.emoji || '',
      category: deal.category || '',
    });
    setIsDealDialogOpen(true);
  };

  const handleDeleteDealClick = (id: number, slideId: number) => {
    setDeleteDealInfo({ id, slide_id: slideId });
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDeleteDeal = async () => {
    if (deleteDealInfo) {
      await deleteDeal.mutateAsync(deleteDealInfo);
      setIsDeleteDialogOpen(false);
      setDeleteDealInfo(null);
    }
  };

  const handleBulkDeleteDeals = async () => {
    if (!selectedSlide || selectedDeals.length === 0) return;
    await bulkDeleteDeals.mutateAsync({ 
      slide_id: selectedSlide.id, 
      deal_ids: selectedDeals 
    });
    setSelectedDeals([]);
    setIsBulkDeleteDialogOpen(false);
  };

  const handleDealSubmit = async (data: DealFormData) => {
    if (!selectedSlide) {
      toast.error('No slide selected');
      return;
    }

    try {
      // Filter out empty values
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value !== '' && value !== null)
      );
      
      if (selectedDeal) {
        await updateDeal.mutateAsync({
          id: selectedDeal.id,
          slide_id: selectedSlide.id,
          ...cleanData,
        });
      } else {
        await createDeal.mutateAsync({
          slide_id: selectedSlide.id,
          ...cleanData,
        });
      }
      setIsDealDialogOpen(false);
    } catch (error) {
      console.error('Error saving deal:', error);
    }
  };

  const handleImagePreview = (url: string) => {
    if (url) {
      setPreviewImage(processGoogleDriveUrl(url));
    } else {
      setPreviewImage(null);
    }
  };

  const handleVideoPreview = (url: string) => {
    if (url) {
      setPreviewVideo(getVideoEmbedUrl(url));
    } else {
      setPreviewVideo(null);
    }
  };

  const applyColorPreset = (preset: any) => {
    slideForm.setValue('bg_color', preset.bg);
    slideForm.setValue('border_color', preset.border);
    slideForm.setValue('accent_color', preset.accent);
    if (preset.text) {
      slideForm.setValue('text_color', preset.text);
    }
  };

  const getSlideTypeLabel = (type: string) => {
    const types = {
      deals: 'Shopping Deals Box',
      premium_suits: 'Premium Suits',
      street_mode: 'Street Mode',
      video_grid: 'Video Grid',
    };
    return types[type as keyof typeof types] || type;
  };

  const getSlideIcon = (type: string) => {
    const icons = {
      deals: '🛍️',
      premium_suits: '👔',
      street_mode: '👕',
      video_grid: '🎬',
    };
    return icons[type as keyof typeof icons] || '📦';
  };

  // Filter slides
  const filteredSlides = allSlides.filter(slide => {
    const matchesSearch = searchTerm === '' || 
      slide.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      slide.subtitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      slide.slide_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || slide.slide_type === filterType;
    const matchesActive = filterActive === 'all' || 
      (filterActive === 'active' && slide.is_active) ||
      (filterActive === 'inactive' && !slide.is_active);
    
    return matchesSearch && matchesType && matchesActive;
  });

  if (allSlidesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Trending Slides</h1>
          <p className="text-muted-foreground mt-1">
            Manage your trending slides and deals with full customization
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCreateSlide} size="lg">
            <Plus className="w-4 h-4 mr-2" />
            Create New Slide
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="slides">📋 Slides Manager</TabsTrigger>
          <TabsTrigger value="preview">👁️ Live Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="slides" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Filters & Search</CardTitle>
              <CardDescription>Filter slides by type, status, or search by title</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search slides..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="deals">Shopping Deals</SelectItem>
                    <SelectItem value="premium_suits">Premium Suits</SelectItem>
                    <SelectItem value="street_mode">Street Mode</SelectItem>
                    <SelectItem value="video_grid">Video Grid</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterActive} onValueChange={setFilterActive}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <Eye className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Slides List */}
          {filteredSlides.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-xl font-semibold mb-2">No slides found</h3>
                <p className="text-muted-foreground text-center mb-6 max-w-md">
                  {allSlides.length === 0 
                    ? "Get started by creating your first trending slide"
                    : "No slides match your current filters"}
                </p>
                {allSlides.length === 0 ? (
                  <Button onClick={handleCreateSlide} size="lg">
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Slide
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="slides">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-4"
                  >
                    {filteredSlides.map((slide, index) => (
                      <SlideCard
                        key={slide.id}
                        slide={slide}
                        index={index}
                        onEdit={handleEditSlide}
                        onDelete={handleDeleteClick}
                        onDuplicate={handleDuplicateSlide}
                        onCreateDeal={handleCreateDeal}
                        onEditDeal={handleEditDeal}
                        onDeleteDeal={handleDeleteDealClick}
                        useSlideDeals={useSlideDeals}
                        getSlideIcon={getSlideIcon}
                        getSlideTypeLabel={getSlideTypeLabel}
                        selectedDeals={selectedDeals}
                        setSelectedDeals={setSelectedDeals}
                        setSelectedSlide={setSelectedSlide}
                        setIsBulkDeleteDialogOpen={setIsBulkDeleteDialogOpen}
                      />
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>Live Preview</CardTitle>
              <CardDescription>
                View how your slides appear on the homepage. Changes are saved immediately.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/30 rounded-lg p-6 text-center">
                <p className="text-muted-foreground">
                  Your slides are configured and ready to be viewed on the homepage.
                </p>
              </div>
              <div className="flex justify-center gap-4">
                <Button 
                  variant="default" 
                  size="lg"
                  onClick={() => window.open('/', '_blank')}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Homepage
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => window.open('/?preview=trending', '_blank')}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Preview Trending Section
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Slide Dialog - Enhanced with more options */}
      <Dialog open={isSlideDialogOpen} onOpenChange={setIsSlideDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {selectedSlide ? '✏️ Edit Slide' : '✨ Create New Slide'}
            </DialogTitle>
            <DialogDescription>
              {selectedSlide 
                ? 'Modify the slide settings and content below'
                : 'Configure your new trending slide with custom colors, content, and media'}
            </DialogDescription>
          </DialogHeader>

          <Form {...slideForm}>
            <form onSubmit={slideForm.handleSubmit(handleSlideSubmit)} className="space-y-6">
              <Accordion 
                type="multiple" 
                value={expandedSections}
                onValueChange={setExpandedSections}
                className="w-full"
              >
                {/* Basic Information */}
                <AccordionItem value="basic">
                  <AccordionTrigger className="text-lg font-semibold">
                    <div className="flex items-center gap-2">
                      <Type className="w-4 h-4" />
                      Basic Information
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <FormField
                      control={slideForm.control}
                      name="slide_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Slide Type *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select slide type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="deals">
                                <div className="flex items-center gap-2">
                                  <span>🛍️</span>
                                  <span>Shopping Deals Box</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="premium_suits">
                                <div className="flex items-center gap-2">
                                  <span>👔</span>
                                  <span>Premium Suits</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="street_mode">
                                <div className="flex items-center gap-2">
                                  <span>👕</span>
                                  <span>Street Mode</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="video_grid">
                                <div className="flex items-center gap-2">
                                  <span>🎬</span>
                                  <span>Video Grid</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Choose the layout and functionality for this slide
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={slideForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                value={field.value || ''} 
                                placeholder="e.g., Hot Deals For You" 
                              />
                            </FormControl>
                            <FormDescription>
                              Main heading text
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={slideForm.control}
                        name="subtitle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Subtitle</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                value={field.value || ''} 
                                placeholder="e.g., ⚡ Flash Sale" 
                              />
                            </FormControl>
                            <FormDescription>
                              Secondary text or tagline
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={slideForm.control}
                        name="discount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Discount Text</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="e.g., Up to 65% Off" 
                                value={field.value || ''} 
                              />
                            </FormControl>
                            <FormDescription>
                              Displayed in the discount badge
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={slideForm.control}
                        name="discount_min"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Minimum Discount %</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="e.g., 55" 
                                value={field.value || ''} 
                              />
                            </FormControl>
                            <FormDescription>
                              For "Min. X%" display
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={slideForm.control}
                        name="button_text"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Button Text</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="SHOP NOW" 
                                value={field.value || 'SHOP NOW'} 
                              />
                            </FormControl>
                            <FormDescription>
                              Call-to-action button label
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={slideForm.control}
                        name="button_link"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Button Link</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                value={field.value || ''} 
                                placeholder="/products?category=men" 
                              />
                            </FormControl>
                            <FormDescription>
                              Where the button redirects to
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {watchSlideType === 'street_mode' && (
                      <FormField
                        control={slideForm.control}
                        name="features"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Features (one per line)</FormLabel>
                            <FormControl>
                              <Textarea
                                value={field.value?.join('\n') || ''}
                                onChange={(e) => {
                                  const features = e.target.value
                                    .split('\n')
                                    .map(f => f.trim())
                                    .filter(f => f !== '');
                                  field.onChange(features);
                                }}
                                placeholder="Top Brands&#10;New Styles&#10;Free Delivery"
                                rows={4}
                              />
                            </FormControl>
                            <FormDescription>
                              Bullet points to highlight key features
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={slideForm.control}
                      name="is_active"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Active Status</FormLabel>
                            <FormDescription>
                              When active, this slide will appear on the homepage
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </AccordionContent>
                </AccordionItem>

                {/* Colors & Styling */}
                <AccordionItem value="colors">
                  <AccordionTrigger className="text-lg font-semibold">
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4" />
                      Colors & Styling
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Quick Color Presets</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {COLOR_PRESETS[watchSlideType as keyof typeof COLOR_PRESETS]?.map((preset, index) => (
                          <Button
                            key={index}
                            type="button"
                            variant="outline"
                            className="h-auto py-3 px-2 flex flex-col items-start gap-1"
                            onClick={() => applyColorPreset(preset)}
                          >
                            <span className="text-xs font-medium">{preset.name}</span>
                            <div className="w-full h-6 rounded bg-gradient-to-r flex" style={{
                              background: `linear-gradient(to right, ${preset.bg.split(' ')[1]}, ${preset.bg.split(' ')[3]})`
                            }} />
                            <span className="text-[10px] text-muted-foreground">{preset.bg}</span>
                          </Button>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={slideForm.control}
                        name="bg_color"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Background Gradient</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="from-[#1B4D3E] to-[#2A6E4B]" 
                                value={field.value || ''} 
                              />
                            </FormControl>
                            <FormDescription>
                              Tailwind gradient classes
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={slideForm.control}
                        name="border_color"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Border Color</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="border-[#9DC183]" 
                                value={field.value || ''} 
                              />
                            </FormControl>
                            <FormDescription>
                              Tailwind border class
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={slideForm.control}
                        name="accent_color"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Accent Color</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="text-[#E6D5B8]" 
                                value={field.value || ''} 
                              />
                            </FormControl>
                            <FormDescription>
                              For highlights and accents
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={slideForm.control}
                        name="text_color"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Text Color</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="text-white" 
                                value={field.value || ''} 
                              />
                            </FormControl>
                            <FormDescription>
                              Main text color
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Media */}
                <AccordionItem value="media">
                  <AccordionTrigger className="text-lg font-semibold">
                    <div className="flex items-center gap-2">
                      {watchSlideType === 'video_grid' ? (
                        <Video className="w-4 h-4" />
                      ) : (
                        <ImageIcon className="w-4 h-4" />
                      )}
                      Media & Assets
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <FormField
                      control={slideForm.control}
                      name="image_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {watchSlideType === 'video_grid' ? 'Poster/Background Image' : 'Main Image'} 
                            <span className="text-xs ml-2 text-muted-foreground">
                              (Google Drive supported)
                            </span>
                          </FormLabel>
                          <FormControl>
                            <div className="space-y-3">
                              <div className="flex gap-2">
                                <Input
                                  {...field}
                                  value={field.value || ''}
                                  onChange={(e) => {
                                    field.onChange(e);
                                    handleImagePreview(e.target.value);
                                  }}
                                  placeholder="https://drive.google.com/file/d/..."
                                  className="flex-1"
                                />
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        type="button" 
                                        variant="outline"
                                        onClick={() => {
                                          const url = prompt('Enter Google Drive URL:');
                                          if (url) {
                                            field.onChange(url);
                                            handleImagePreview(url);
                                          }
                                        }}
                                      >
                                        <Link2 className="w-4 h-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Add Google Drive URL</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                              {previewImage && (
                                <div className="relative w-40 h-40 border rounded-lg overflow-hidden">
                                  <img
                                    src={previewImage}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = '/placeholder.svg';
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {watchSlideType === 'video_grid' && (
                      <FormField
                        control={slideForm.control}
                        name="video_url"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Video URL 
                              <span className="text-xs ml-2 text-muted-foreground">
                                (Google Drive, YouTube, Vimeo)
                              </span>
                            </FormLabel>
                            <FormControl>
                              <div className="space-y-3">
                                <div className="flex gap-2">
                                  <Input
                                    {...field}
                                    value={field.value || ''}
                                    onChange={(e) => {
                                      field.onChange(e);
                                      handleVideoPreview(e.target.value);
                                    }}
                                    placeholder="https://drive.google.com/file/d/... or YouTube URL"
                                    className="flex-1"
                                  />
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button 
                                          type="button" 
                                          variant="outline"
                                          onClick={() => {
                                            const url = prompt('Enter video URL:');
                                            if (url) {
                                              field.onChange(url);
                                              handleVideoPreview(url);
                                            }
                                          }}
                                        >
                                          <Link2 className="w-4 h-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Add video URL</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                                {previewVideo && (
                                  <div className="relative aspect-video w-full max-w-md border rounded-lg overflow-hidden">
                                    <iframe
                                      src={previewVideo}
                                      className="w-full h-full"
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                      allowFullScreen
                                    />
                                  </div>
                                )}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {watchSlideType === 'deals' && (
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={slideForm.control}
                          name="emoji"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Fallback Emoji</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  placeholder="🛍️" 
                                  value={field.value || ''} 
                                />
                              </FormControl>
                              <FormDescription>
                                Displayed when image fails to load
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={slideForm.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Default Category</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  placeholder="accessories" 
                                  value={field.value || ''} 
                                />
                              </FormControl>
                              <FormDescription>
                                Filter category for deals
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsSlideDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createSlide.isPending || updateSlide.isPending}
                  size="lg"
                >
                  {(createSlide.isPending || updateSlide.isPending) && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {selectedSlide ? 'Update Slide' : 'Create Slide'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Deal Dialog - Enhanced */}
      <Dialog open={isDealDialogOpen} onOpenChange={setIsDealDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {selectedDeal ? '✏️ Edit Deal' : '✨ Add New Deal'}
            </DialogTitle>
            <DialogDescription>
              {selectedSlide?.title 
                ? `Adding deal to: ${selectedSlide.title}` 
                : 'Create a new product deal'}
            </DialogDescription>
          </DialogHeader>

          <Form {...dealForm}>
            <form onSubmit={dealForm.handleSubmit(handleDealSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={dealForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Title *</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} placeholder="Smart Watch" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={dealForm.control}
                  name="discount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount *</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} placeholder="50%" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={dealForm.control}
                  name="emoji"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emoji</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="⌚" value={field.value || ''} />
                      </FormControl>
                      <FormDescription>
                        Fallback if image fails
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={dealForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="accessories" value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={dealForm.control}
                name="link"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Link *</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} placeholder="/products?category=accessories&search=watch" />
                    </FormControl>
                    <FormDescription>
                      Where the deal card redirects to
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={dealForm.control}
                name="image_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Image URL</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <Input 
                          {...field} 
                          value={field.value || ''} 
                          placeholder="https://images.unsplash.com/..." 
                        />
                        {field.value && (
                          <div className="relative w-20 h-20 border rounded-lg overflow-hidden">
                            <img
                              src={processGoogleDriveUrl(field.value)}
                              alt="Preview"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder.svg';
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDealDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createDeal.isPending || updateDeal.isPending}>
                  {(createDeal.isPending || updateDeal.isPending) && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {selectedDeal ? 'Update Deal' : 'Create Deal'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDealInfo 
                ? "This action cannot be undone. This will permanently delete this deal."
                : "This action cannot be undone. This will permanently delete this slide and all associated deals."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={deleteDealInfo ? handleConfirmDeleteDeal : handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Deals</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedDeals.length} selected deal(s)? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkDeleteDeals}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Image Preview Modal */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Image Preview</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center">
            <img
              src={previewImage || ''}
              alt="Preview"
              className="max-w-full max-h-[70vh] object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder.svg';
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface SlideCardProps {
  slide: TrendingSlide;
  index: number;
  onEdit: (slide: TrendingSlide) => void;
  onDelete: (id: number) => void;
  onDuplicate: (slide: TrendingSlide) => void;
  onCreateDeal: (slideId: number) => void;
  onEditDeal: (deal: TrendingDeal, slide: TrendingSlide) => void;
  onDeleteDeal: (id: number, slideId: number) => void;
  useSlideDeals: (slideId: number) => any;
  getSlideIcon: (type: string) => string;
  getSlideTypeLabel: (type: string) => string;
  selectedDeals: number[];
  setSelectedDeals: React.Dispatch<React.SetStateAction<number[]>>;
  setSelectedSlide: React.Dispatch<React.SetStateAction<TrendingSlide | null>>;
  setIsBulkDeleteDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const SlideCard: React.FC<SlideCardProps> = ({
  slide,
  index,
  onEdit,
  onDelete,
  onDuplicate,
  onCreateDeal,
  onEditDeal,
  onDeleteDeal,
  useSlideDeals,
  getSlideIcon,
  getSlideTypeLabel,
  selectedDeals,
  setSelectedDeals,
  setSelectedSlide,
  setIsBulkDeleteDialogOpen,
}) => {
  const { data: deals = [], isLoading: dealsLoading } = useSlideDeals(slide.id);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSelectAllDeals = () => {
    if (selectedDeals.length === deals.length) {
      setSelectedDeals([]);
    } else {
      setSelectedDeals(deals.map((d: TrendingDeal) => d.id));
    }
  };

  const handleSelectDeal = (dealId: number) => {
    if (selectedDeals.includes(dealId)) {
      setSelectedDeals(selectedDeals.filter(id => id !== dealId));
    } else {
      setSelectedDeals([...selectedDeals, dealId]);
    }
  };

  const handleBulkDelete = () => {
    setSelectedSlide(slide);
    setIsBulkDeleteDialogOpen(true);
  };

  const handleDuplicateClick = () => {
    onDuplicate(slide);
  };

  return (
    <Draggable draggableId={`slide-${slide.id}`} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`border-l-4 transition-all ${
            snapshot.isDragging ? 'shadow-lg ring-2 ring-primary scale-[1.02]' : ''
          }`}
          style={{
            ...provided.draggableProps.style,
            borderLeftColor: slide.is_active ? '#10b981' : '#6b7280',
            borderLeftWidth: '4px',
          }}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div
                  {...provided.dragHandleProps}
                  className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
                >
                  <GripVertical className="w-5 h-5 text-gray-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-2xl">{getSlideIcon(slide.slide_type)}</span>
                    <CardTitle className="text-lg">
                      {slide.title || getSlideTypeLabel(slide.slide_type)}
                    </CardTitle>
                    <Badge variant={slide.is_active ? 'default' : 'secondary'}>
                      {slide.is_active ? (
                        <Eye className="w-3 h-3 mr-1" />
                      ) : (
                        <EyeOff className="w-3 h-3 mr-1" />
                      )}
                      {slide.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {getSlideTypeLabel(slide.slide_type)}
                    </Badge>
                    {slide.discount && (
                      <Badge variant="secondary" className="bg-primary/10">
                        <Percent className="w-3 h-3 mr-1" />
                        {slide.discount}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <span>{slide.subtitle || 'No subtitle'}</span>
                    {slide.button_link && (
                      <>
                        <span>•</span>
                        <span className="truncate max-w-[200px]">{slide.button_link}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <span className="sr-only">Open menu</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onEdit(slide)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Slide
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDuplicateClick}>
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => onDelete(slide.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>

          {isExpanded && (
            <CardContent className="pt-0">
              {slide.slide_type === 'deals' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <h3 className="font-semibold">Deals ({deals.length})</h3>
                      {deals.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`select-all-${slide.id}`}
                            checked={selectedDeals.length === deals.length && deals.length > 0}
                            onCheckedChange={handleSelectAllDeals}
                          />
                          <Label htmlFor={`select-all-${slide.id}`} className="text-sm">
                            Select All
                          </Label>
                          {selectedDeals.length > 0 && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={handleBulkDelete}
                            >
                              <Trash2 className="w-3 h-3 mr-2" />
                              Delete Selected ({selectedDeals.length})
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => onCreateDeal(slide.id)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Deal
                    </Button>
                  </div>

                  {dealsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : deals.length === 0 ? (
                    <div className="text-center py-8 bg-muted/30 rounded-lg">
                      <p className="text-muted-foreground">No deals added yet</p>
                      <Button
                        variant="link"
                        onClick={() => onCreateDeal(slide.id)}
                        className="mt-2"
                      >
                        Click here to add your first deal
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {deals.map((deal: TrendingDeal) => (
                        <div
                          key={deal.id}
                          className="relative group border rounded-lg p-3 hover:border-primary transition-all hover:shadow-md"
                        >
                          <div className="absolute top-2 left-2 z-10">
                            <Checkbox
                              checked={selectedDeals.includes(deal.id)}
                              onCheckedChange={() => handleSelectDeal(deal.id)}
                              className="bg-white"
                            />
                          </div>
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 bg-white shadow-sm hover:bg-gray-100"
                              onClick={() => onEditDeal(deal, slide)}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 bg-white shadow-sm text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => onDeleteDeal(deal.id, slide.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                          <div className="aspect-square bg-gray-100 rounded-md overflow-hidden mb-2">
                            {deal.image_url ? (
                              <img
                                src={processGoogleDriveUrl(deal.image_url)}
                                alt={deal.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/placeholder.svg';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-3xl">{deal.emoji || '🛍️'}</span>
                              </div>
                            )}
                          </div>
                          <p className="font-medium text-sm truncate" title={deal.title}>
                            {deal.title}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs font-bold text-primary">
                              {deal.discount} OFF
                            </span>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {deal.category || 'general'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {slide.slide_type === 'video_grid' && slide.video_url && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-3">Video Preview</h3>
                  <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden max-w-2xl">
                    <iframe
                      src={getVideoEmbedUrl(slide.video_url)}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}

              {slide.features && slide.features.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-3">Features</h3>
                  <div className="flex flex-wrap gap-2">
                    {slide.features.map((feature, i) => (
                      <Badge key={i} variant="secondary" className="px-3 py-1">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
                <div className="flex gap-4 flex-wrap">
                  <span>ID: {slide.id}</span>
                  <span>Order: {slide.display_order}</span>
                  <span>Created: {new Date(slide.created_at).toLocaleDateString()}</span>
                  <span>Updated: {new Date(slide.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </Draggable>
  );
};

export default AdminTrendingSlides;