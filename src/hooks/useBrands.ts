// src/hooks/useBrands.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Brand {
  id: string;
  name: string;
  image_url: string;
  description?: string;
  is_active: boolean;
  product_count: number;
  created_at: string;
  updated_at: string;
}

export const useBrands = () => {
  return useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data as Brand[];
    },
    staleTime: 5 * 60 * 1000,
  });
};