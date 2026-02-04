import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface StoreSettings {
  id?: string;
  store_name: string;
  store_email: string;
  store_phone: string;
  currency: string;
  free_shipping_threshold: number;
  enable_notifications: boolean;
  enable_reviews: boolean;
  maintenance_mode: boolean;
  first_name_color: string; // Color for first part of store name
  second_name_color: string; // Color for second part of store name
  created_at?: string;
  updated_at?: string;
}

interface SettingsContextType {
  settings: StoreSettings;
  loading: boolean;
  saveSettings: (newSettings: Partial<StoreSettings>) => Promise<void>;
  refreshSettings: () => Promise<void>;
  getStoreNameParts: () => { firstPart: string; secondPart: string };
}

const defaultSettings: StoreSettings = {
  store_name: '',
  store_email: '',
  store_phone: '',
  currency: 'INR',
  free_shipping_threshold: 2000,
  enable_notifications: true,
  enable_reviews: true,
  maintenance_mode: false,
  first_name_color: '#8B5CF6', // Purple color for first part
  second_name_color: '#000000', // Black color for second part
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        // Ensure color fields exist in loaded data
        const loadedSettings = {
          ...defaultSettings,
          ...data[0],
        };
        setSettings(loadedSettings);
      } else {
        // Create default settings if none exist
        await createDefaultSettings();
      }
    } catch (error: any) {
      console.error('Error loading settings:', error);
      toast({
        title: 'Error loading settings',
        description: 'Using default settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const createDefaultSettings = async () => {
    try {
      const defaultStoreSettings = {
        store_name: 'SS Fashions',
        store_email: 'contact@ssfashions.com',
        store_phone: '+91 98765 43210',
        currency: 'INR',
        free_shipping_threshold: 2000,
        enable_notifications: true,
        enable_reviews: true,
        maintenance_mode: false,
        first_name_color: '#8B5CF6', // Purple
        second_name_color: '#000000', // Black
      };
      
      const { data, error } = await supabase
        .from('store_settings')
        .insert([defaultStoreSettings])
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        setSettings(data[0]);
      }
    } catch (error: any) {
      console.error('Error creating default settings:', error);
    }
  };

  const saveSettings = async (newSettings: Partial<StoreSettings>) => {
    try {
      let updatedSettings;
      
      // If we have an ID, update existing settings
      if (settings.id) {
        const { data, error } = await supabase
          .from('store_settings')
          .update({
            ...newSettings,
            updated_at: new Date().toISOString()
          })
          .eq('id', settings.id)
          .select();

        if (error) throw error;

        if (data && data.length > 0) {
          updatedSettings = data[0];
          setSettings(updatedSettings);
          toast({
            title: 'Settings updated successfully!',
          });
        }
      } else {
        // Otherwise, insert new settings
        const { data, error } = await supabase
          .from('store_settings')
          .insert([{ ...defaultSettings, ...newSettings }])
          .select();

        if (error) throw error;

        if (data && data.length > 0) {
          updatedSettings = data[0];
          setSettings(updatedSettings);
          toast({
            title: 'Settings saved successfully!',
          });
        }
      }
      
      // Force a re-fetch to ensure we have the latest data
      await loadSettings();
      
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Failed to save settings',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const refreshSettings = async () => {
    await loadSettings();
  };

  // Function to split store name into two parts
  const getStoreNameParts = () => {
    const fullName = settings.store_name.trim();
    const words = fullName.split(' ');
    
    if (words.length >= 2) {
      // Join first word(s) as first part, rest as second part
      const firstPart = words[0];
      const secondPart = words.slice(1).join(' ');
      return { firstPart, secondPart };
    } else {
      // If only one word, split it in half
      const mid = Math.ceil(fullName.length / 2);
      return {
        firstPart: fullName.slice(0, mid),
        secondPart: fullName.slice(mid)
      };
    }
  };

  return (
    <SettingsContext.Provider value={{ 
      settings, 
      loading, 
      saveSettings, 
      refreshSettings,
      getStoreNameParts 
    }}>
      {children}
    </SettingsContext.Provider>
  );
};