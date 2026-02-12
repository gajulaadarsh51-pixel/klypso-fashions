import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export type SlideType = 'deals' | 'premium' | 'street' | 'video' | 'custom';

export interface TrendingSlide {
  id: number;
  slide_type: SlideType;
  title: string;
  subtitle?: string;
  discount?: string;
  offer_text?: string;
  background_gradient: string;
  accent_color: string;
  text_color: string;
  subtitle_color: string;
  image_url?: string;
  image_drive_id?: string;
  video_url?: string;
  video_drive_id?: string;
  link?: string;
  button_text?: string;
  button_link?: string;
  slide_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface TrendingDeal {
  id: number;
  slide_id: number;
  discount: string;
  title: string;
  emoji: string;
  category: string;
  link: string;
  image_url?: string;
  image_drive_id?: string;
  deal_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export const useTrendingSlides = () => {
  return useQuery({
    queryKey: ['trendingSlides'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trending_slides')
        .select('*')
        .eq('is_active', true)
        .order('slide_order', { ascending: true });

      if (error) throw error;
      return data as TrendingSlide[];
    },
  });
};

export const useAllTrendingSlides = () => {
  return useQuery({
    queryKey: ['allTrendingSlides'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trending_slides')
        .select('*')
        .order('slide_order', { ascending: true });

      if (error) throw error;
      return data as TrendingSlide[];
    },
  });
};

export const useTrendingDeals = (slideId?: number) => {
  return useQuery({
    queryKey: ['trendingDeals', slideId],
    queryFn: async () => {
      if (!slideId) return [];
      
      const { data, error } = await supabase
        .from('trending_deals')
        .select('*')
        .eq('slide_id', slideId)
        .eq('is_active', true)
        .order('deal_order', { ascending: true });

      if (error) throw error;
      return data as TrendingDeal[];
    },
    enabled: !!slideId,
  });
};

export const useCreateTrendingSlide = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (slide: Omit<TrendingSlide, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('trending_slides')
        .insert([slide])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trendingSlides'] });
      queryClient.invalidateQueries({ queryKey: ['allTrendingSlides'] });
      toast({
        title: 'Success',
        description: 'Trending slide created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create trending slide: ' + error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateTrendingSlide = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...slide }: Partial<TrendingSlide> & { id: number }) => {
      const { data, error } = await supabase
        .from('trending_slides')
        .update(slide)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trendingSlides'] });
      queryClient.invalidateQueries({ queryKey: ['allTrendingSlides'] });
      toast({
        title: 'Success',
        description: 'Trending slide updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update trending slide: ' + error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteTrendingSlide = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('trending_slides')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trendingSlides'] });
      queryClient.invalidateQueries({ queryKey: ['allTrendingSlides'] });
      toast({
        title: 'Success',
        description: 'Trending slide deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete trending slide: ' + error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useCreateTrendingDeal = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (deal: Omit<TrendingDeal, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('trending_deals')
        .insert([deal])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['trendingDeals', data.slide_id] });
      toast({
        title: 'Success',
        description: 'Deal created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create deal: ' + error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateTrendingDeal = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...deal }: Partial<TrendingDeal> & { id: number }) => {
      const { data, error } = await supabase
        .from('trending_deals')
        .update(deal)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['trendingDeals', data.slide_id] });
      toast({
        title: 'Success',
        description: 'Deal updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update deal: ' + error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteTrendingDeal = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, slide_id }: { id: number; slide_id: number }) => {
      const { error } = await supabase
        .from('trending_deals')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id, slide_id };
    },
    onSuccess: ({ slide_id }) => {
      queryClient.invalidateQueries({ queryKey: ['trendingDeals', slide_id] });
      toast({
        title: 'Success',
        description: 'Deal deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete deal: ' + error.message,
        variant: 'destructive',
      });
    },
  });
};

export const processGoogleDriveUrl = (url: string): string => {
  if (!url) return '';
  
  if (url.includes('drive.google.com')) {
    const fileId = url.match(/id=([^&]+)/)?.[1] || 
                  url.match(/\/d\/([^\/]+)/)?.[1] ||
                  url.match(/file\/d\/([^\/]+)/)?.[1];
    
    if (fileId) {
      return `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`;
    }
  }
  
  return url;
};

export const processGoogleDriveVideoUrl = (url: string): string => {
  if (!url) return '';
  
  if (url.includes('drive.google.com')) {
    const fileId = url.match(/id=([^&]+)/)?.[1] || 
                  url.match(/\/d\/([^\/]+)/)?.[1] ||
                  url.match(/file\/d\/([^\/]+)/)?.[1];
    
    if (fileId) {
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }
  }
  
  return url;
};