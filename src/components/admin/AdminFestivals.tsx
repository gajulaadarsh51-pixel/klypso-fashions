// src/components/admin/AdminFestivals.tsx
import { useState } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, Loader2, Image as ImageIcon, Gift } from 'lucide-react';
import { toast } from 'sonner';
import FestivalModal from '@/components/FestivalModal';
import { useAllFestivals } from '@/hooks/useFestivals';
import { useFestivalManagement } from '@/hooks/useFestivalManagement';
import { useSectionToggle } from '@/hooks/useSectionToggle';
import { useQueryClient } from '@tanstack/react-query';

const AdminFestivals = () => {
  const { data: festivals = [], isLoading, refetch } = useAllFestivals();
  const { saveFestival, updateFestival, deleteFestival } = useFestivalManagement();
  const { isEnabled: sectionEnabled, toggleSection, isToggling } = useSectionToggle("festivals_section");
  const queryClient = useQueryClient();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFestival, setEditingFestival] = useState<any>(null);

  const handleSaveFestival = async (festivalData: any) => {
    console.log('🎯 Form data received:', festivalData);
    
    try {
      let success;
      if (editingFestival) {
        success = await updateFestival(editingFestival.id, { 
          ...festivalData, 
          is_active: editingFestival.is_active 
        });
      } else {
        const result = await saveFestival(festivalData);
        success = !!result;
      }

      if (success) {
        queryClient.invalidateQueries({ queryKey: ["all-festivals"] });
        queryClient.invalidateQueries({ queryKey: ["festivals"] });
        setIsModalOpen(false);
        setEditingFestival(null);
        toast.success(editingFestival ? "Festival updated!" : "Festival created!");
        
        // Refresh the data
        await refetch();
      }
    } catch (error) {
      console.error('Error saving festival:', error);
      // Error is already shown in the hook
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this festival?")) return;
    
    try {
      const success = await deleteFestival(id);
      if (success) {
        queryClient.invalidateQueries({ queryKey: ["all-festivals"] });
        queryClient.invalidateQueries({ queryKey: ["festivals"] });
        await refetch();
      }
    } catch (error) {
      console.error('Error deleting festival:', error);
    }
  };

  const handleToggleActive = async (festival: any) => {
    try {
      const success = await updateFestival(festival.id, {
        ...festival,
        is_active: !festival.is_active
      });
      
      if (success) {
        queryClient.invalidateQueries({ queryKey: ["all-festivals"] });
        queryClient.invalidateQueries({ queryKey: ["festivals"] });
        toast.success(`Festival ${!festival.is_active ? 'activated' : 'deactivated'}`);
        await refetch();
      }
    } catch (error) {
      console.error('Error toggling festival:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Gift className="text-orange-600" />
            Manage Festivals
          </h1>
          <p className="text-gray-600 mt-1">Create, edit, and manage festival cards</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => toggleSection(!sectionEnabled)}
            disabled={isToggling}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              sectionEnabled 
                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            } ${isToggling ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isToggling ? (
              <Loader2 size={16} className="animate-spin" />
            ) : sectionEnabled ? (
              <Eye size={16} />
            ) : (
              <EyeOff size={16} />
            )}
            {sectionEnabled ? 'Section Enabled' : 'Section Disabled'}
          </button>
          
          <button
            onClick={() => {
              setEditingFestival(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Plus size={16} />
            Add Festival
          </button>
        </div>
      </div>

      {/* Google Drive Instructions */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <h3 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
          <ImageIcon size={18} />
          Google Drive Image Instructions
        </h3>
        <div className="text-sm text-blue-700 space-y-2">
          <div className="flex items-start gap-2">
            <span className="bg-white px-2 py-1 rounded">1.</span>
            <span>Upload image to Google Drive</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="bg-white px-2 py-1 rounded">2.</span>
            <span>Right-click → <strong>Share</strong> → Change to <strong>"Anyone with the link"</strong> → <strong>"Viewer"</strong></span>
          </div>
          <div className="flex items-start gap-2">
            <span className="bg-white px-2 py-1 rounded">3.</span>
            <span>Copy the share link</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="bg-white px-2 py-1 rounded">4.</span>
            <span>Paste in image URL field (auto-converts to direct link)</span>
          </div>
          <div className="mt-3 p-3 bg-white rounded border border-blue-300">
            <p className="font-medium mb-1">Example Google Drive Link:</p>
            <code className="text-xs break-all">
              https://drive.google.com/file/d/1uiTB4Q9YyFev_m0VkIDdDVByo9-RiXWS/view?usp=sharing
            </code>
            <p className="text-xs mt-2 text-green-700">
              ✅ System auto-converts to: https://drive.google.com/uc?id=1uiTB4Q9YyFev_m0VkIDdDVByo9-RiXWS
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="animate-spin text-gray-400" size={32} />
          </div>
        ) : festivals.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Gift size={48} className="mx-auto opacity-50" />
            </div>
            <p className="text-gray-500">No festivals created yet.</p>
            <p className="text-gray-400 text-sm mt-1">Click "Add Festival" to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Preview
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {festivals.map((festival) => (
                  <tr key={festival.id} className="hover:bg-gray-50">
                    <td className="px-4 lg:px-6 py-4">
                      <div className="flex flex-col items-center gap-2">
                        <div className={`w-20 h-12 ${festival.bg_color || 'bg-gray-200'} rounded overflow-hidden border`}>
                          {festival.image_url ? (
                            <img
                              src={festival.image_url}
                              alt={festival.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder.svg';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                              <ImageIcon size={20} className="text-gray-400" />
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 truncate max-w-[80px]">
                          {(festival.bg_color || '').replace('bg-', '').replace('-500', '')}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <div>
                        <h4 className="font-medium text-gray-900">{festival.title}</h4>
                        <p className="text-sm text-gray-600">{festival.subtitle}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="inline-block px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded">
                            {festival.offer || 'No offer'}
                          </span>
                          {festival.category && (
                            <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                              {festival.category}
                            </span>
                          )}
                          {festival.custom_link && (
                            <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                              Custom Link
                            </span>
                          )}
                        </div>
                        {festival.image_url && (
                          <p className="text-xs text-gray-500 mt-2 truncate max-w-[300px]">
                            Image: {festival.image_url.substring(0, 50)}...
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(festival)}
                        className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                          festival.is_active
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {festival.is_active ? 'Active' : 'Inactive'}
                      </button>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(festival.created_at).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingFestival({
                              ...festival,
                              image: festival.image_url,
                              color: festival.bg_color,
                              link: festival.custom_link
                            });
                            setIsModalOpen(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(festival.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-6 text-sm text-gray-500">
        <p>Total Festivals: <span className="font-medium">{festivals.length}</span></p>
        <p className="mt-1">Active Festivals: <span className="font-medium text-green-600">
          {festivals.filter(f => f.is_active).length}
        </span></p>
      </div>

      <FestivalModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingFestival(null);
        }}
        onSave={handleSaveFestival}
        festival={editingFestival}
      />
    </div>
  );
};

export default AdminFestivals;