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
  // Add rating fields
  average_rating: number | null;
  total_reviews: number;
}

export interface ProductInput {
  name: string;
  description?: string;
  price: number;
  original_price?: number;
  category: string;
  subcategory?: string;
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
        // First, get all products
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (productsError) throw productsError;
        
        // Then, get reviews for all products in one query
        const { data: reviews, error: reviewsError } = await supabase
          .from('product_reviews')
          .select('product_id, rating, is_approved')
          .eq('is_approved', true);
        
        if (reviewsError) throw reviewsError;
        
        // Calculate average rating and total reviews for each product
        const productRatingsMap = new Map<string, { totalRating: number; count: number }>();
        
        reviews?.forEach(review => {
          if (!productRatingsMap.has(review.product_id)) {
            productRatingsMap.set(review.product_id, { totalRating: 0, count: 0 });
          }
          const productRating = productRatingsMap.get(review.product_id)!;
          productRating.totalRating += review.rating;
          productRating.count += 1;
        });
        
        // Map products with their ratings
        const productsWithRatings = products.map(product => {
          const ratingInfo = productRatingsMap.get(product.id);
          const averageRating = ratingInfo 
            ? ratingInfo.totalRating / ratingInfo.count 
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
        console.error('Error fetching products with ratings:', error);
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
        // Get product data
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();
        
        if (productError) throw productError;
        
        // Get reviews for this product
        const { data: reviews, error: reviewsError } = await supabase
          .from('product_reviews')
          .select('rating, is_approved')
          .eq('product_id', id)
          .eq('is_approved', true);
        
        if (reviewsError) throw reviewsError;
        
        // Calculate average rating
        let averageRating = null;
        let totalReviews = 0;
        
        if (reviews && reviews.length > 0) {
          const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
          averageRating = totalRating / reviews.length;
          totalReviews = reviews.length;
        }
        
        return {
          ...product,
          colors: Array.isArray(product.colors) ? product.colors : [],
          average_rating: averageRating,
          total_reviews: totalReviews,
        } as Product;
      } catch (error) {
        console.error('Error fetching product with ratings:', error);
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
      const { data, error } = await supabase
        .from('products')
        .insert([{
          ...product,
          colors: product.colors || [],
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create product: ${error.message}`);
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...product }: ProductInput & { id: string }) => {
      const { data, error } = await supabase
        .from('products')
        .update({
          ...product,
          colors: product.colors || [],
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update product: ${error.message}`);
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete product: ${error.message}`);
    },
  });
};

// Optional: Function to get popular products (highest rated)
export const usePopularProducts = (limit = 4) => {
  return useQuery({
    queryKey: ['popular-products', limit],
    queryFn: async () => {
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Get reviews for all products
      const { data: reviews, error: reviewsError } = await supabase
        .from('product_reviews')
        .select('product_id, rating, is_approved')
        .eq('is_approved', true);
      
      if (reviewsError) throw reviewsError;
      
      // Calculate ratings for each product
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
      
      // Filter and sort products by rating
      const productsWithRatings = products
        .map(product => {
          const ratingInfo = productRatingsMap.get(product.id);
          return {
            ...product,
            colors: Array.isArray(product.colors) ? product.colors : [],
            average_rating: ratingInfo?.averageRating || null,
            total_reviews: ratingInfo?.totalReviews || 0,
          } as Product;
        })
        .filter(product => product.average_rating !== null)
        .sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0))
        .slice(0, limit);
      
      return productsWithRatings;
    },
  });
};