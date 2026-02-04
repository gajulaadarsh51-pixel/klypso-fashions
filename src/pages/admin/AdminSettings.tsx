import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useSettings } from '@/contexts/SettingsContext';

const AdminSettings = () => {
  const { settings, saveSettings, getStoreNameParts } = useSettings();
  const [localSettings, setLocalSettings] = useState(settings);
  const nameParts = getStoreNameParts();

  // Update local settings when context settings change
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = async () => {
    try {
      await saveSettings(localSettings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Configure your store settings</p>
      </div>

      <div className="max-w-2xl space-y-8">
        {/* Store Information */}
        <div className="bg-background border rounded-lg p-6">
          <h2 className="font-heading text-xl font-semibold mb-4">Store Information</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="storeName">Store Name</Label>
              <Input
                id="storeName"
                value={localSettings.store_name}
                onChange={(e) => setLocalSettings((prev) => ({ ...prev, store_name: e.target.value }))}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Current display:{" "}
                <span style={{ color: localSettings.first_name_color, fontWeight: 'bold' }}>
                  {nameParts.firstPart}
                </span>
                <span style={{ color: localSettings.second_name_color, fontWeight: 'bold' }}>
                  {nameParts.secondPart}
                </span>
              </p>
            </div>
            <div>
              <Label htmlFor="storeEmail">Contact Email</Label>
              <Input
                id="storeEmail"
                type="email"
                value={localSettings.store_email}
                onChange={(e) => setLocalSettings((prev) => ({ ...prev, store_email: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="storePhone">Contact Phone</Label>
              <Input
                id="storePhone"
                value={localSettings.store_phone}
                onChange={(e) => setLocalSettings((prev) => ({ ...prev, store_phone: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {/* Store Name Colors */}
        <div className="bg-background border rounded-lg p-6">
          <h2 className="font-heading text-xl font-semibold mb-4">Store Name Colors</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="firstNameColor">
                First Part Color (e.g., "Klypso")
              </Label>
              <div className="flex items-center gap-4 mt-2">
                <div 
                  className="w-12 h-12 rounded-md border flex items-center justify-center"
                  style={{ backgroundColor: localSettings.first_name_color }}
                >
                  <span className="text-white font-bold">{nameParts.firstPart}</span>
                </div>
                <div className="flex flex-col gap-2">
                  <Input
                    id="firstNameColor"
                    type="color"
                    value={localSettings.first_name_color}
                    onChange={(e) => setLocalSettings((prev) => ({ ...prev, first_name_color: e.target.value }))}
                    className="w-32 h-10 p-1"
                  />
                  <Input
                    type="text"
                    value={localSettings.first_name_color}
                    onChange={(e) => setLocalSettings((prev) => ({ ...prev, first_name_color: e.target.value }))}
                    className="w-32"
                    placeholder="#8B5CF6"
                  />
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="secondNameColor">
                Second Part Color (e.g., "Fashions")
              </Label>
              <div className="flex items-center gap-4 mt-2">
                <div 
                  className="w-12 h-12 rounded-md border flex items-center justify-center"
                  style={{ backgroundColor: localSettings.second_name_color }}
                >
                  <span className="text-white font-bold">{nameParts.secondPart}</span>
                </div>
                <div className="flex flex-col gap-2">
                  <Input
                    id="secondNameColor"
                    type="color"
                    value={localSettings.second_name_color}
                    onChange={(e) => setLocalSettings((prev) => ({ ...prev, second_name_color: e.target.value }))}
                    className="w-32 h-10 p-1"
                  />
                  <Input
                    type="text"
                    value={localSettings.second_name_color}
                    onChange={(e) => setLocalSettings((prev) => ({ ...prev, second_name_color: e.target.value }))}
                    className="w-32"
                    placeholder="#000000"
                  />
                </div>
              </div>
            </div>
            
            {/* Preview */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <Label>Preview:</Label>
              <div className="mt-2">
                <h2 className="font-heading text-2xl font-bold">
                  <span style={{ color: localSettings.first_name_color }}>
                    {nameParts.firstPart}
                  </span>
                  <span style={{ color: localSettings.second_name_color }}>
                    {nameParts.secondPart}
                  </span>
                </h2>
              </div>
            </div>
          </div>
        </div>

        {/* Shipping */}
        <div className="bg-background border rounded-lg p-6">
          <h2 className="font-heading text-xl font-semibold mb-4">Shipping</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="freeShipping">Free Shipping Threshold (₹)</Label>
              <Input
                id="freeShipping"
                type="number"
                value={localSettings.free_shipping_threshold}
                onChange={(e) =>
                  setLocalSettings((prev) => ({ ...prev, free_shipping_threshold: parseInt(e.target.value) || 0 }))
                }
              />
              <p className="text-sm text-muted-foreground mt-1">
                Orders above this amount get free shipping
              </p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-background border rounded-lg p-6">
          <h2 className="font-heading text-xl font-semibold mb-4">Features</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notifications">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Send order updates to customers</p>
              </div>
              <Switch
                id="notifications"
                checked={localSettings.enable_notifications}
                onCheckedChange={(checked) => setLocalSettings((prev) => ({ ...prev, enable_notifications: checked }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="reviews">Product Reviews</Label>
                <p className="text-sm text-muted-foreground">Allow customers to leave reviews</p>
              </div>
              <Switch
                id="reviews"
                checked={localSettings.enable_reviews}
                onCheckedChange={(checked) => setLocalSettings((prev) => ({ ...prev, enable_reviews: checked }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="maintenance" className="text-destructive">Maintenance Mode</Label>
                <p className="text-sm text-muted-foreground">Temporarily disable the store</p>
              </div>
              <Switch
                id="maintenance"
                checked={localSettings.maintenance_mode}
                onCheckedChange={(checked) => setLocalSettings((prev) => ({ ...prev, maintenance_mode: checked }))}
              />
            </div>
          </div>
        </div>

        <Button onClick={handleSave} className="bg-gold hover:bg-gold/90 text-primary">
          Save Settings
        </Button>
      </div>
    </div>
  );
};

export default AdminSettings;