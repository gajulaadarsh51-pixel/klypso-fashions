// src/pages/admin/Brands.tsx
import { AddBrandForm } from '@/components/admin/AddBrandForm';
import { useBrands } from '@/hooks/useBrands';
import { Trash2, Edit, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Brands = () => {
  const { data: brands, isLoading, refetch } = useBrands();

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await supabase
        .from('brands')
        .update({ is_active: !currentStatus })
        .eq('id', id);
      refetch();
    } catch (error) {
      console.error('Error updating brand:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this brand?')) return;
    
    try {
      await supabase.from('brands').delete().eq('id', id);
      refetch();
    } catch (error) {
      console.error('Error deleting brand:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Brand Management</h1>
          <p className="text-gray-600">Add and manage brands for your store</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <AddBrandForm />
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold">All Brands</h2>
              </div>
              
              {isLoading ? (
                <div className="p-6 text-center">Loading brands...</div>
              ) : brands?.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No brands added yet. Add your first brand using the form.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Brand
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Products
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {brands?.map((brand) => (
                        <tr key={brand.id}>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0">
                                <img
                                  src={brand.image_url}
                                  alt={brand.name}
                                  className="h-10 w-10 rounded-full object-cover"
                                />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {brand.name}
                                </div>
                                {brand.description && (
                                  <div className="text-sm text-gray-500">
                                    {brand.description.substring(0, 50)}...
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {brand.product_count}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleToggleActive(brand.id, brand.is_active)}
                              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                                brand.is_active
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {brand.is_active ? (
                                <>
                                  <Eye size={12} /> Active
                                </>
                              ) : (
                                <>
                                  <EyeOff size={12} /> Inactive
                                </>
                              )}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <button
                                className="text-blue-600 hover:text-blue-900"
                                onClick={() => {/* Add edit functionality */}}
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                className="text-red-600 hover:text-red-900"
                                onClick={() => handleDelete(brand.id)}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default Brands;