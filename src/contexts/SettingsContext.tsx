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
  first_name_color: string;
  second_name_color: string;
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
  store_name: 'SS Fashions',
  store_email: 'contact@ssfashions.com',
  store_phone: '+91 98765 43210',
  currency: 'INR',
  free_shipping_threshold: 2000,
  enable_notifications: true,
  enable_reviews: true,
  maintenance_mode: false,
  first_name_color: '#8B5CF6',
  second_name_color: '#000000',
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

  useEffect(() => {
    console.log('SettingsProvider mounted, loading settings...');
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      console.log('Loading settings from database...');
      setLoading(true);
      
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      console.log('Load response:', { data, error });

      if (error) {
        console.error('Error loading settings:', error);
        throw error;
      }

      if (data && data.length > 0) {
        console.log('Settings loaded:', data[0]);
        setSettings(data[0]);
      } else {
        console.log('No settings found, creating defaults...');
        await createDefaultSettings();
      }
    } catch (error: any) {
      console.error('Error in loadSettings:', error);
      toast({
        title: 'Error loading settings',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createDefaultSettings = async () => {
    try {
      console.log('Creating default settings...');
      
      const { data, error } = await supabase
        .from('store_settings')
        .insert([defaultSettings])
        .select();

      console.log('Create response:', { data, error });

      if (error) throw error;

      if (data && data.length > 0) {
        console.log('Default settings created:', data[0]);
        setSettings(data[0]);
      }
    } catch (error: any) {
      console.error('Error creating default settings:', error);
      toast({
        title: 'Error creating settings',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const saveSettings = async (newSettings: Partial<StoreSettings>) => {
    try {
      console.log('Saving settings...', { newSettings, currentId: settings.id });
      setLoading(true);
      
      if (settings.id) {
        // Update existing
        console.log('Updating existing settings with ID:', settings.id);
        
        // First, perform the update
        const { error: updateError } = await supabase
          .from('store_settings')
          .update({
            ...newSettings,
            updated_at: new Date().toISOString()
          })
          .eq('id', settings.id);

        console.log('Update error:', updateError);

        if (updateError) throw updateError;

        // Then fetch the updated record
        console.log('Fetching updated settings...');
        const { data: fetchData, error: fetchError } = await supabase
          .from('store_settings')
          .select('*')
          .eq('id', settings.id)
          .single();

        console.log('Fetch response:', { fetchData, fetchError });

        if (fetchError) throw fetchError;

        if (fetchData) {
          console.log('Settings saved successfully:', fetchData);
          setSettings(fetchData);
          toast({
            title: 'Success',
            description: 'Settings updated successfully!',
          });
        } else {
          throw new Error('Could not retrieve updated settings');
        }
      } else {
        // Insert new
        console.log('Inserting new settings');
        
        const { data, error } = await supabase
          .from('store_settings')
          .insert([{ ...defaultSettings, ...newSettings }])
          .select();

        console.log('Insert response:', { data, error });

        if (error) throw error;

        if (data && data.length > 0) {
          console.log('Settings saved successfully:', data[0]);
          setSettings(data[0]);
          toast({
            title: 'Success',
            description: 'Settings saved successfully!',
          });
        } else {
          throw new Error('No data returned after insert');
        }
      }
      
    } catch (error: any) {
      console.error('Error in saveSettings:', error);
      toast({
        title: 'Failed to save settings',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const refreshSettings = async () => {
    await loadSettings();
  };

  const getStoreNameParts = () => {
    const fullName = settings.store_name?.trim() || 'SS Fashions';
    
    const words = fullName.split(' ');
    
    if (words.length >= 2) {
      return {
        firstPart: words[0],
        secondPart: words.slice(1).join(' ')
      };
    } else {
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