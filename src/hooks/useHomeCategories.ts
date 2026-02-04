import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CategoryItem {
  id: string;
  title: string;
  image: string;
  link: string;
  is_active: boolean;
  sort_order?: number;
  created_at?: string;
}

export const useHomeCategories = () => {
  return useQuery({
    queryKey: ["home-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("home_categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });
};