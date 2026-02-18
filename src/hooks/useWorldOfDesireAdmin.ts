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
        .order("position", { ascending: true, nullsFirst: false });

      if (error) {
        console.error("Error fetching world of desire:", error);
        throw error;
      }
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async (payload: any) => {
      console.log("Creating new world of desire item with payload:", payload);
      
      const { data, error } = await supabase
        .from("world_of_desire")
        .insert([payload])
        .select();

      if (error) {
        console.error("Supabase insert error:", error);
        throw error;
      }
      
      console.log("Successfully created:", data);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-world-of-desire"] });
      qc.invalidateQueries({ queryKey: ["world-of-desire"] });
    },
    onError: (error) => {
      console.error("Create mutation error:", error);
    }
  });

  const update = useMutation({
    mutationFn: async ({ id, ...payload }: any) => {
      console.log("Updating item:", id, payload);
      
      const { data, error } = await supabase
        .from("world_of_desire")
        .update(payload)
        .eq("id", id)
        .select();

      if (error) {
        console.error("Supabase update error:", error);
        throw error;
      }
      
      console.log("Successfully updated:", data);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-world-of-desire"] });
      qc.invalidateQueries({ queryKey: ["world-of-desire"] });
    },
    onError: (error) => {
      console.error("Update mutation error:", error);
    }
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      console.log("Deleting item:", id);
      
      const { error } = await supabase
        .from("world_of_desire")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Supabase delete error:", error);
        throw error;
      }
      
      console.log("Successfully deleted:", id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-world-of-desire"] });
      qc.invalidateQueries({ queryKey: ["world-of-desire"] });
    },
    onError: (error) => {
      console.error("Delete mutation error:", error);
    }
  });

  return { list, create, update, remove };
};