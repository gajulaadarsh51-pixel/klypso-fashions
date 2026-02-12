// hooks/useWorldOfDesireAdmin.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useWorldOfDesireAdmin = () => {
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ["admin-world-of-desire"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("world_of_desire")
        .select("*")
        .order("position", { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async (payload: any) => {
      const { error } = await supabase
        .from("world_of_desire")
        .insert(payload);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-world-of-desire"] }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...payload }: any) => {
      const { error } = await supabase
        .from("world_of_desire")
        .update(payload)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-world-of-desire"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("world_of_desire")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-world-of-desire"] }),
  });

  return { list, create, update, remove };
};