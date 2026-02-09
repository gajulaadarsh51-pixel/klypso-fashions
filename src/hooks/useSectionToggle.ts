// src/hooks/useSectionToggle.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useSectionToggle = (key: string) => {
  const queryClient = useQueryClient();
  
  const { data: isEnabled } = useQuery({
    queryKey: ["section", key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_sections")
        .select("is_enabled")
        .eq("section_key", key)
        .single();

      if (error) {
        console.error("Error fetching section:", error);
        return true; // Default to enabled if not found
      }
      return data?.is_enabled ?? true;
    }
  });

  const toggleMutation = useMutation({
    mutationFn: async (value: boolean) => {
      const { error } = await supabase
        .from("site_sections")
        .update({ is_enabled: value })
        .eq("section_key", key);

      if (error) throw error;
      return value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["section", key] });
    }
  });

  return {
    isEnabled,
    toggleSection: toggleMutation.mutate,
    isToggling: toggleMutation.isPending
  };
};