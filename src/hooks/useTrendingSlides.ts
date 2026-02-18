// hooks/useTrendingSlides.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TrendingSlide {
  id: number;
  slide_type: 'deals' | 'premium_suits' | 'street_mode' | 'video_grid';
  title: string | null;
  subtitle: string | null;
  discount: string | null;
  discount_up_to: string | null;
  discount_min: string | null;
  button_text: string | null;
  button_link: string | null;
  image_url: string | null;
  video_url: string | null;
  emoji: string | null;
  category: string | null;
  bg_color: string | null;
  border_color: string | null;
  accent_color: string | null;
  text_color: string | null;
  features: string[] | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface TrendingDeal {
  id: number;
  slide_id: number;
  discount: string;
  link: string;
  image_url: string | null;
  title: string;
  emoji: string | null;
  category: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export const useTrendingSlides = () => {
  const queryClient = useQueryClient();

  // Fetch ALL slides (including inactive for admin)
  const { data: allSlides = [], isLoading: allSlidesLoading } = useQuery({
    queryKey: ['trending-slides-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trending_slides')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as TrendingSlide[];
    },
  });

  // Fetch ONLY active slides (for frontend)
  const { data: slides = [], isLoading: slidesLoading } = useQuery({
    queryKey: ['trending-slides'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trending_slides')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as TrendingSlide[];
    },
  });

  // Fetch deals for a specific slide
  const useSlideDeals = (slideId: number) => {
    return useQuery({
      queryKey: ['trending-deals', slideId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('trending_deals')
          .select('*')
          .eq('slide_id', slideId)
          .order('display_order', { ascending: true });

        if (error) throw error;
        return data as TrendingDeal[];
      },
      enabled: !!slideId,
    });
  };

  // Create slide
  const createSlide = useMutation({
    mutationFn: async (slideData: Partial<TrendingSlide>) => {
      const { data, error } = await supabase
        .from('trending_slides')
        .insert([slideData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trending-slides'] });
      queryClient.invalidateQueries({ queryKey: ['trending-slides-all'] });
      toast.success('Slide created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create slide');
      console.error('Error:', error);
    },
  });

  // Update slide
  const updateSlide = useMutation({
    mutationFn: async ({ id, ...data }: Partial<TrendingSlide> & { id: number }) => {
      const { error } = await supabase
        .from('trending_slides')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trending-slides'] });
      queryClient.invalidateQueries({ queryKey: ['trending-slides-all'] });
      toast.success('Slide updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update slide');
      console.error('Error:', error);
    },
  });

  // Delete slide
  const deleteSlide = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('trending_slides')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trending-slides'] });
      queryClient.invalidateQueries({ queryKey: ['trending-slides-all'] });
      toast.success('Slide deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete slide');
      console.error('Error:', error);
    },
  });

  // Duplicate slide
  const duplicateSlide = useMutation({
    mutationFn: async (slide: TrendingSlide) => {
      // Create a new object without the id and with modified title
      const { id, created_at, updated_at, ...slideData } = slide;
      
      const newSlide = {
        ...slideData,
        title: slide.title ? `${slide.title} (Copy)` : `${slide.slide_type} (Copy)`,
        is_active: false,
        display_order: allSlides.length, // Add to the end
      };

      const { data, error } = await supabase
        .from('trending_slides')
        .insert([newSlide])
        .select()
        .single();

      if (error) throw error;
      
      // If it's a deals slide, duplicate all deals
      if (slide.slide_type === 'deals' && data) {
        const { data: deals } = await supabase
          .from('trending_deals')
          .select('*')
          .eq('slide_id', slide.id);
          
        if (deals && deals.length > 0) {
          const newDeals = deals.map(deal => {
            const { id, created_at, updated_at, slide_id, ...dealData } = deal;
            return {
              ...dealData,
              slide_id: data.id,
            };
          });
          
          const { error: dealsError } = await supabase
            .from('trending_deals')
            .insert(newDeals);
            
          if (dealsError) throw dealsError;
        }
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trending-slides-all'] });
      queryClient.invalidateQueries({ queryKey: ['trending-slides'] });
      toast.success('Slide duplicated successfully');
    },
    onError: (error) => {
      toast.error('Failed to duplicate slide');
      console.error('Error:', error);
    },
  });

  // Create deal
  const createDeal = useMutation({
    mutationFn: async (dealData: Partial<TrendingDeal>) => {
      const { data, error } = await supabase
        .from('trending_deals')
        .insert([dealData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['trending-deals', data.slide_id] });
      toast.success('Deal created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create deal');
      console.error('Error:', error);
    },
  });

  // Update deal
  const updateDeal = useMutation({
    mutationFn: async ({ id, ...data }: Partial<TrendingDeal> & { id: number }) => {
      const { error } = await supabase
        .from('trending_deals')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trending-deals', variables.slide_id] });
      toast.success('Deal updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update deal');
      console.error('Error:', error);
    },
  });

  // Delete deal
  const deleteDeal = useMutation({
    mutationFn: async ({ id, slide_id }: { id: number; slide_id: number }) => {
      const { error } = await supabase
        .from('trending_deals')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id, slide_id };
    },
    onSuccess: ({ slide_id }) => {
      queryClient.invalidateQueries({ queryKey: ['trending-deals', slide_id] });
      toast.success('Deal deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete deal');
      console.error('Error:', error);
    },
  });

  // Update slide order
  const updateSlideOrder = useMutation({
    mutationFn: async (orderedSlides: { id: number; display_order: number }[]) => {
      const promises = orderedSlides.map(({ id, display_order }) =>
        supabase
          .from('trending_slides')
          .update({ display_order })
          .eq('id', id)
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trending-slides'] });
      queryClient.invalidateQueries({ queryKey: ['trending-slides-all'] });
      toast.success('Order updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update order');
      console.error('Error:', error);
    },
  });

  // Bulk delete deals
  const bulkDeleteDeals = useMutation({
    mutationFn: async ({ slide_id, deal_ids }: { slide_id: number; deal_ids: number[] }) => {
      const { error } = await supabase
        .from('trending_deals')
        .delete()
        .in('id', deal_ids);

      if (error) throw error;
      return { slide_id };
    },
    onSuccess: ({ slide_id }) => {
      queryClient.invalidateQueries({ queryKey: ['trending-deals', slide_id] });
      toast.success('Deals deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete deals');
      console.error('Error:', error);
    },
  });

  return {
    slides,
    allSlides,
    slidesLoading,
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
  };
};