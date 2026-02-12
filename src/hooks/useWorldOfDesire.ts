// hooks/useWorldOfDesire.ts
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useWorldOfDesire = () => {
  return useQuery({
    queryKey: ["world-of-desire"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("world_of_desire")
        .select("*")
        .eq("is_active", true)
        .order("position", { ascending: true });

      if (error) throw error;
      
      // Process Google Drive URLs
      const processedData = data?.map(item => ({
        ...item,
        image_url: processGoogleDriveUrl(item.image_url)
      })) || [];
      
      return processedData;
    },
  });
};

// Function to convert Google Drive URLs to display format
export const processGoogleDriveUrl = (url: string): string => {
  if (!url) return '/placeholder.svg';
  
  // If it's already a direct image URL, return as is
  if (url.includes('drive.google.com/thumbnail') || url.includes('lh3.googleusercontent.com')) {
    return url;
  }
  
  // Extract file ID from various Google Drive URL formats
  let fileId = '';
  
  // Format 1: https://drive.google.com/file/d/FILE_ID/view
  const match1 = url.match(/\/d\/([^\/]+)/);
  if (match1) {
    fileId = match1[1];
  }
  
  // Format 2: https://drive.google.com/open?id=FILE_ID
  const match2 = url.match(/id=([^&]+)/);
  if (!fileId && match2) {
    fileId = match2[1];
  }
  
  // Format 3: https://drive.google.com/uc?id=FILE_ID
  const match3 = url.match(/uc\?id=([^&]+)/);
  if (!fileId && match3) {
    fileId = match3[1];
  }
  
  // If we have a file ID, return the thumbnail URL
  if (fileId) {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`;
  }
  
  // Return original URL if no pattern matches
  return url;
};