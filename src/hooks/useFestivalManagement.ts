// src/hooks/useFestivalManagement.ts
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useFestivalManagement = () => {
  // Function to convert Google Drive URL to direct image URL
  const convertGoogleDriveUrl = (url: string): string => {
    if (!url.includes('drive.google.com')) {
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
    
    // Format 3: https://drive.google.com/uc?id=FILE_ID (already direct)
    if (url.includes('uc?id=')) {
      return url;
    }
    
    if (fileId) {
      // Use Google Drive's thumbnail link for faster loading
      // Change w1000 to w800 for better compatibility
      return `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`;
    }
    
    return url;
  };

  const saveFestival = async (festivalData: any) => {
    try {
      console.log('🎯 Saving festival data:', festivalData);
      
      // Validate required fields
      const requiredFields = ['title', 'subtitle', 'image', 'color', 'offer'];
      for (const field of requiredFields) {
        if (!festivalData[field]?.trim()) {
          throw new Error(`${field.replace('color', 'background color')} is required`);
        }
      }

      // Convert Google Drive link to direct image URL
      const imageUrl = convertGoogleDriveUrl(festivalData.image);
      console.log('✅ Converted image URL:', imageUrl);

      // Prepare data for database
      const festival = {
        title: festivalData.title.trim(),
        subtitle: festivalData.subtitle.trim(),
        image_url: imageUrl.trim(),
        bg_color: festivalData.color.trim(),
        offer: festivalData.offer.trim(),
        category: festivalData.category?.trim() || null,
        custom_link: festivalData.link?.trim() || null,
        is_active: true
      };

      console.log('🎯 Inserting to database:', festival);

      const { data, error } = await supabase
        .from("festivals")
        .insert([festival])
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }
      
      console.log('✅ Festival created successfully:', data);
      toast.success("Festival created successfully");
      return data;
    } catch (error: any) {
      console.error('❌ Save festival error:', error);
      toast.error("Failed to create festival: " + error.message);
      throw error;
    }
  };

  const updateFestival = async (id: string, festivalData: any) => {
    try {
      console.log('🎯 Updating festival:', id, festivalData);
      
      // Validate required fields
      const requiredFields = ['title', 'subtitle', 'image', 'color', 'offer'];
      for (const field of requiredFields) {
        if (!festivalData[field]?.trim()) {
          throw new Error(`${field.replace('color', 'background color')} is required`);
        }
      }

      // Convert Google Drive link to direct image URL
      const imageUrl = convertGoogleDriveUrl(festivalData.image);
      console.log('✅ Converted image URL:', imageUrl);

      // Prepare data for database
      const festival = {
        title: festivalData.title.trim(),
        subtitle: festivalData.subtitle.trim(),
        image_url: imageUrl.trim(),
        bg_color: festivalData.color.trim(),
        offer: festivalData.offer.trim(),
        category: festivalData.category?.trim() || null,
        custom_link: festivalData.link?.trim() || null,
        is_active: festivalData.is_active !== undefined ? festivalData.is_active : true,
        updated_at: new Date().toISOString()
      };

      console.log('🎯 Updating in database:', festival);

      const { error } = await supabase
        .from("festivals")
        .update(festival)
        .eq("id", id);

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }
      
      toast.success("Festival updated successfully");
      return true;
    } catch (error: any) {
      console.error('❌ Update festival error:', error);
      toast.error("Failed to update festival: " + error.message);
      throw error;
    }
  };

  const deleteFestival = async (id: string) => {
    try {
      const { error } = await supabase
        .from("festivals")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Festival deleted successfully");
      return true;
    } catch (error: any) {
      toast.error("Failed to delete festival: " + error.message);
      throw error;
    }
  };

  return {
    saveFestival,
    updateFestival,
    deleteFestival
  };
};