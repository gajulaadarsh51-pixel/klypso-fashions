// src/components/admin/AddBrandForm.tsx
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const AddBrandForm = () => {
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Convert Google Drive URL to direct image URL
      let directImageUrl = imageUrl;
      if (imageUrl.includes('drive.google.com')) {
        directImageUrl = imageUrl
          .replace('/file/d/', '/uc?export=view&id=')
          .replace('/view?usp=sharing', '')
          .replace('/view?usp=drive_link', '')
          .split('/view')[0];
      }

      const { data, error } = await supabase
        .from('brands')
        .insert([
          {
            name,
            image_url: directImageUrl,
            description: description || null,
            product_count: 0,
          }
        ])
        .select();

      if (error) throw error;

      setMessage('Brand added successfully!');
      setName('');
      setImageUrl('');
      setDescription('');
    } catch (error: any) {
      setMessage(error.message || 'Failed to add brand');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Add New Brand</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Brand Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            placeholder="e.g., Nike, Adidas, Puma, Zara, H&M"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">
            Google Drive Image URL
          </label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            placeholder="https://drive.google.com/file/d/..."
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Steps: 1) Upload logo to Google Drive → 2) Click "Share" → 3) Copy link → 4) Paste here
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">
            Description (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            rows={2}
            placeholder="Brief description of the brand..."
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} />
          {loading ? 'Adding...' : 'Add Brand'}
        </button>
        
        {message && (
          <p className={`text-sm ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
            {message}
          </p>
        )}
      </form>
    </div>
  );
};