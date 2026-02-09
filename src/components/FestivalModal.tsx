// components/FestivalModal.tsx
import { useState, useEffect } from 'react';
import { X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface FestivalItem {
  id?: string;
  title: string;
  subtitle: string;
  image: string;
  color: string;
  offer: string;
  category?: string;
  link?: string;
  is_active?: boolean;
}

interface FestivalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (festival: Omit<FestivalItem, 'id'>) => void;
  festival: FestivalItem | null;
}

const FestivalModal = ({ isOpen, onClose, onSave, festival }: FestivalModalProps) => {
  const [formData, setFormData] = useState<Omit<FestivalItem, 'id'>>({
    title: '',
    subtitle: '',
    image: '',
    color: 'bg-orange-500',
    offer: '',
    category: '',
    link: ''
  });

  const colorOptions = [
    { value: 'bg-orange-500', label: 'Orange', color: 'bg-orange-500', textColor: 'text-white' },
    { value: 'bg-red-500', label: 'Red', color: 'bg-red-500', textColor: 'text-white' },
    { value: 'bg-pink-500', label: 'Pink', color: 'bg-pink-500', textColor: 'text-white' },
    { value: 'bg-blue-500', label: 'Blue', color: 'bg-blue-500', textColor: 'text-white' },
    { value: 'bg-yellow-500', label: 'Yellow', color: 'bg-yellow-500', textColor: 'text-gray-900' },
    { value: 'bg-green-500', label: 'Green', color: 'bg-green-500', textColor: 'text-white' },
    { value: 'bg-purple-500', label: 'Purple', color: 'bg-purple-500', textColor: 'text-white' },
    { value: 'bg-teal-500', label: 'Teal', color: 'bg-teal-500', textColor: 'text-white' },
  ];

  useEffect(() => {
    if (festival) {
      setFormData({
        title: festival.title,
        subtitle: festival.subtitle,
        image: festival.image,
        color: festival.color || 'bg-orange-500',
        offer: festival.offer,
        category: festival.category || '',
        link: festival.link || ''
      });
    } else {
      setFormData({
        title: '',
        subtitle: '',
        image: '',
        color: 'bg-orange-500',
        offer: '',
        category: '',
        link: ''
      });
    }
  }, [festival]);

  const handleImageChange = (url: string) => {
    let processedUrl = url;
    
    // Auto-convert Google Drive links
    if (url.includes('drive.google.com')) {
      const fileId = url.match(/\/d\/([^\/]+)/)?.[1] || 
                    url.match(/id=([^&]+)/)?.[1];
      if (fileId) {
        processedUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`;
        toast.info("Google Drive link converted to thumbnail URL");
        
        // Show preview of the converted URL
        console.log('Converted URL for preview:', processedUrl);
      } else {
        toast.warning("Could not extract Google Drive file ID. Make sure the link is correct.");
      }
    }
    
    setFormData({ ...formData, image: processedUrl });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!formData.subtitle.trim()) {
      toast.error("Subtitle is required");
      return;
    }
    if (!formData.image.trim()) {
      toast.error("Image URL is required");
      return;
    }
    if (!formData.color.trim()) {
      toast.error("Background color is required");
      return;
    }
    if (!formData.offer.trim()) {
      toast.error("Offer text is required");
      return;
    }
    
    console.log('Submitting form data:', formData);
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">
              {festival ? 'Edit Festival' : 'Add New Festival'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Diwali Collection"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Subtitle *</label>
              <input
                type="text"
                required
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Traditional Wear"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                <span className="flex items-center gap-1">
                  <ImageIcon size={14} />
                  Image URL *
                </span>
              </label>
              <input
                type="url"
                required
                value={formData.image}
                onChange={(e) => handleImageChange(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="https://drive.google.com/file/d/..."
              />
              {formData.image && (
                <div className="mt-2">
                  <div className="w-full h-32 overflow-hidden rounded-lg border">
                    <img
                      src={formData.image}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('Image failed to load:', formData.image);
                        (e.target as HTMLImageElement).src = '/placeholder.svg';
                        
                        // Try alternative URL format if it's Google Drive
                        if (formData.image.includes('drive.google.com')) {
                          const fileId = formData.image.match(/id=([^&]+)/)?.[1];
                          if (fileId) {
                            // Try UC format
                            setTimeout(() => {
                              (e.target as HTMLImageElement).src = `https://drive.google.com/uc?id=${fileId}`;
                            }, 500);
                          }
                        }
                      }}
                    />
                  </div>
                  {formData.image.includes('drive.google.com') && (
                    <p className="text-xs mt-1 flex items-center gap-1">
                      {formData.image.includes('thumbnail') ? (
                        <>
                          <span className="h-2 w-2 bg-green-600 rounded-full"></span>
                          <span className="text-green-600">Using Google Drive thumbnail link</span>
                        </>
                      ) : formData.image.includes('uc?id=') ? (
                        <>
                          <span className="h-2 w-2 bg-blue-600 rounded-full"></span>
                          <span className="text-blue-600">Using Google Drive direct link</span>
                        </>
                      ) : (
                        <>
                          <span className="h-2 w-2 bg-yellow-600 rounded-full"></span>
                          <span className="text-yellow-600">Original Google Drive link</span>
                        </>
                      )}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Background Color *</label>
              <div className="grid grid-cols-4 gap-2">
                {colorOptions.map((color) => (
                  <button
                    type="button"
                    key={color.value}
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    className={`p-2 rounded-lg border-2 ${formData.color === color.value ? 'border-orange-500 ring-2 ring-orange-200' : 'border-gray-200'} flex flex-col items-center gap-1`}
                  >
                    <div className={`w-8 h-8 rounded ${color.color} ${color.textColor} flex items-center justify-center text-xs font-bold`}>
                      Aa
                    </div>
                    <span className={`text-xs ${color.textColor}`}>{color.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Offer Text *</label>
              <input
                type="text"
                required
                value={formData.offer}
                onChange={(e) => setFormData({ ...formData, offer: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Up to 60% OFF"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Category (optional)</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="festival-wear, diwali, christmas"
              />
              <p className="text-xs text-gray-500 mt-1">
                When clicked, will navigate to /products?category=[this-value]
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Custom Link (optional)</label>
              <input
                type="url"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="https://example.com/custom-page"
              />
              <p className="text-xs text-gray-500 mt-1">
                If provided, will open this link instead of category page
              </p>
            </div>

            <div className="pt-4 border-t">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  {festival ? 'Update Festival' : 'Create Festival'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FestivalModal;