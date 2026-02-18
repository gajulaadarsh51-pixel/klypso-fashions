import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  original_price: number | null;
  category: string;
  subcategory: string | null;
  images: string[];
  sizes: string[];
  colors: { name: string; hex: string }[];
  stock: number;
  is_new: boolean;
  is_on_sale: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  average_rating: number | null;
  total_reviews: number;
}

export interface ProductInput {
  name: string;
  description?: string | null;
  price: number;
  original_price?: number | null;
  category: string;
  subcategory?: string | null;
  images?: string[];
  sizes?: string[];
  colors?: { name: string; hex: string }[];
  stock: number;
  is_new?: boolean;
  is_on_sale?: boolean;
  is_active?: boolean;
}

export const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      try {
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (productsError) {
          console.error('Products fetch error:', productsError);
          throw productsError;
        }
        
        // Get reviews if the table exists
        let reviews = [];
        try {
          const { data: reviewsData, error: reviewsError } = await supabase
            .from('product_reviews')
            .select('product_id, rating, is_approved')
            .eq('is_approved', true);
          
          if (!reviewsError) {
            reviews = reviewsData || [];
          }
        } catch (reviewError) {
          console.warn('Could not fetch reviews:', reviewError);
          // Continue without reviews
        }
        
        const productRatingsMap = new Map<string, { totalRating: number; count: number }>();
        
        reviews?.forEach(review => {
          if (!productRatingsMap.has(review.product_id)) {
            productRatingsMap.set(review.product_id, { totalRating: 0, count: 0 });
          }
          const productRating = productRatingsMap.get(review.product_id)!;
          productRating.totalRating += review.rating;
          productRating.count += 1;
        });
        
        const productsWithRatings = products.map(product => {
          const ratingInfo = productRatingsMap.get(product.id);
          const averageRating = ratingInfo 
            ? Number((ratingInfo.totalRating / ratingInfo.count).toFixed(1))
            : null;
          const totalReviews = ratingInfo?.count || 0;
          
          return {
            ...product,
            colors: Array.isArray(product.colors) ? product.colors : [],
            average_rating: averageRating,
            total_reviews: totalReviews,
          } as Product;
        });
        
        return productsWithRatings;
      } catch (error) {
        console.error('Error fetching products:', error);
        throw error;
      }
    },
  });
};

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      try {
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();
        
        if (productError) throw productError;
        
        // Get reviews if table exists
        let reviews = [];
        try {
          const { data: reviewsData, error: reviewsError } = await supabase
            .from('product_reviews')
            .select('rating, is_approved')
            .eq('product_id', id)
            .eq('is_approved', true);
          
          if (!reviewsError) {
            reviews = reviewsData || [];
          }
        } catch (reviewError) {
          console.warn('Could not fetch reviews:', reviewError);
        }
        
        let averageRating = null;
        let totalReviews = 0;
        
        if (reviews && reviews.length > 0) {
          const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
          averageRating = Number((totalRating / reviews.length).toFixed(1));
          totalReviews = reviews.length;
        }
        
        return {
          ...product,
          colors: Array.isArray(product.colors) ? product.colors : [],
          average_rating: averageRating,
          total_reviews: totalReviews,
        } as Product;
      } catch (error) {
        console.error('Error fetching product:', error);
        throw error;
      }
    },
    enabled: !!id,
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (product: ProductInput) => {
      try {
        // Ensure proper data formatting
        const productData = {
          name: product.name,
          description: product.description || null,
          price: product.price,
          original_price: product.original_price || null,
          category: product.category,
          subcategory: product.subcategory || null,
          images: product.images?.filter(img => img && img.trim() !== '') || [],
          sizes: product.sizes || [],
          colors: product.colors || [],
          stock: product.stock,
          is_new: product.is_new || false,
          is_on_sale: product.is_on_sale || false,
          is_active: product.is_active !== undefined ? product.is_active : true,
        };

        console.log('Creating product:', productData);

        const { data, error } = await supabase
          .from('products')
          .insert([productData])
          .select()
          .single();
        
        if (error) {
          console.error('Supabase insert error:', error);
          throw error;
        }
        
        return data;
      } catch (error) {
        console.error('Error in create product:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product created successfully');
    },
    onError: (error: any) => {
      console.error('Create product error:', error);
      toast.error(`Failed to create product: ${error.message || 'Unknown error'}`);
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...product }: ProductInput & { id: string }) => {
      try {
        const productData = {
          name: product.name,
          description: product.description || null,
          price: product.price,
          original_price: product.original_price || null,
          category: product.category,
          subcategory: product.subcategory || null,
          images: product.images?.filter(img => img && img.trim() !== '') || [],
          sizes: product.sizes || [],
          colors: product.colors || [],
          stock: product.stock,
          is_new: product.is_new || false,
          is_on_sale: product.is_on_sale || false,
          is_active: product.is_active !== undefined ? product.is_active : true,
          updated_at: new Date().toISOString(),
        };

        console.log('Updating product:', productData);

        const { data, error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', id)
          .select()
          .single();
        
        if (error) {
          console.error('Supabase update error:', error);
          throw error;
        }
        
        return data;
      } catch (error) {
        console.error('Error in update product:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product updated successfully');
    },
    onError: (error: any) => {
      console.error('Update product error:', error);
      toast.error(`Failed to update product: ${error.message || 'Unknown error'}`);
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      try {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
      } catch (error) {
        console.error('Error in delete product:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deleted successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete product: ${error.message}`);
    },
  });
};

export const usePopularProducts = (limit = 4) => {
  return useQuery({
    queryKey: ['popular-products', limit],
    queryFn: async () => {
      try {
        const { data: products, error } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Get reviews if table exists
        let reviews = [];
        try {
          const { data: reviewsData, error: reviewsError } = await supabase
            .from('product_reviews')
            .select('product_id, rating, is_approved')
            .eq('is_approved', true);
          
          if (!reviewsError) {
            reviews = reviewsData || [];
          }
        } catch (reviewError) {
          console.warn('Could not fetch reviews:', reviewError);
        }
        
        const productRatingsMap = new Map<string, { averageRating: number; totalReviews: number }>();
        
        reviews?.forEach(review => {
          if (!productRatingsMap.has(review.product_id)) {
            productRatingsMap.set(review.product_id, { averageRating: 0, totalReviews: 0 });
          }
          const productRating = productRatingsMap.get(review.product_id)!;
          productRating.averageRating = 
            (productRating.averageRating * productRating.totalReviews + review.rating) / (productRating.totalReviews + 1);
          productRating.totalReviews += 1;
        });
        
        const productsWithRatings = products
          .map(product => {
            const ratingInfo = productRatingsMap.get(product.id);
            return {
              ...product,
              colors: Array.isArray(product.colors) ? product.colors : [],
              average_rating: ratingInfo?.averageRating ? Number(ratingInfo.averageRating.toFixed(1)) : null,
              total_reviews: ratingInfo?.totalReviews || 0,
            } as Product;
          })
          .filter(product => product.average_rating !== null)
          .sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0))
          .slice(0, limit);
        
        return productsWithRatings;
      } catch (error) {
        console.error('Error fetching popular products:', error);
        throw error;
      }
    },
  });
};