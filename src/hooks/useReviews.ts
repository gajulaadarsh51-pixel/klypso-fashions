// hooks/useReviews.ts
import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

// Define types
export interface Review {
  id: string
  product_id: string
  user_id: string
  rating: number
  comment: string
  is_approved: boolean
  created_at: string
  updated_at: string
  user_name: string | null
  user_avatar: string | null
  product_name: string
  product_images: string[]
}

export interface ReviewStats {
  avg_rating: number
  total_reviews: number
  rating_breakdown: {
    '1': number
    '2': number
    '3': number
    '4': number
    '5': number
  }
}

export interface ReviewWithDetails {
  id: string
  product_id: string
  user_id: string
  rating: number
  comment: string
  is_approved: boolean
  created_at: string
  updated_at: string
  product_name: string
  user_name: string | null
  user_email: string | null
  user_full_name: string | null
  user_phone: string | null
}

// FIXED: Function to fetch user profiles with email
const fetchUserProfiles = async (userIds: string[]) => {
  if (!userIds.length) return {}

  const profilesMap: Record<string, any> = {}
  
  try {
    console.log('Fetching profiles for user IDs:', userIds)
    
    // FIRST: Try to get ALL user data from auth table using RPC
    try {
      // Use RPC function to get user data safely
      const { data: usersData, error: rpcError } = await supabase.rpc('get_users_by_ids', {
        user_ids: userIds
      })
      
      if (!rpcError && usersData && usersData.length > 0) {
        console.log('Got users from RPC:', usersData)
        usersData.forEach((user: any) => {
          profilesMap[user.id] = {
            full_name: user.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            email: user.email || null,
            phone: user.phone || user.user_metadata?.phone || null
          }
        })
      } else {
        console.warn('RPC failed, trying alternative methods:', rpcError)
      }
    } catch (rpcErr) {
      console.warn('RPC call failed:', rpcErr)
    }

    // SECOND: Fetch from profiles table as fallback
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, full_name, phone, avatar_type')
      .in('user_id', userIds)

    if (!profilesError && profilesData) {
      console.log('Got profiles from profiles table:', profilesData)
      profilesData.forEach(profile => {
        if (profilesMap[profile.user_id]) {
          // Update existing profile with more data
          profilesMap[profile.user_id] = {
            ...profilesMap[profile.user_id],
            full_name: profile.full_name || profilesMap[profile.user_id].full_name,
            phone: profile.phone || profilesMap[profile.user_id].phone,
            avatar_type: profile.avatar_type
          }
        } else {
          profilesMap[profile.user_id] = {
            full_name: profile.full_name,
            phone: profile.phone,
            avatar_type: profile.avatar_type,
            email: `${profile.user_id?.slice(0, 8)}@user.com` // Fallback email
          }
        }
      })
    }

    // THIRD: For any remaining users without data, fetch from auth.users via admin API
    const missingUserIds = userIds.filter(id => !profilesMap[id])
    
    if (missingUserIds.length > 0) {
      try {
        console.log('Fetching missing users from admin API:', missingUserIds)
        
        // Try admin listUsers
        const { data: { users }, error: adminError } = await supabase.auth.admin.listUsers()
        
        if (!adminError && users) {
          users.forEach((user: any) => {
            if (missingUserIds.includes(user.id)) {
              profilesMap[user.id] = {
                full_name: user.user_metadata?.full_name || 
                          user.email?.split('@')[0] || 
                          user.id?.slice(0, 8) || 
                          'User',
                email: user.email || null,
                phone: user.user_metadata?.phone || null
              }
            }
          })
        }
      } catch (adminErr) {
        console.warn('Admin API failed, trying direct auth.users query:', adminErr)
        
        // Try direct query to auth.users (requires proper RLS)
        try {
          const { data: authData, error: authError } = await supabase
            .from('auth.users')
            .select('id, email, raw_user_meta_data')
            .in('id', missingUserIds)

          if (!authError && authData) {
            authData.forEach(user => {
              profilesMap[user.id] = {
                full_name: user.raw_user_meta_data?.full_name || 
                          user.email?.split('@')[0] || 
                          user.id?.slice(0, 8) || 
                          'User',
                email: user.email,
                phone: user.raw_user_meta_data?.phone || null
              }
            })
          }
        } catch (authTableError) {
          console.warn('Direct auth.users query failed:', authTableError)
        }
      }
    }

    // FINAL: Ensure all user IDs have at least some data
    userIds.forEach(userId => {
      if (!profilesMap[userId]) {
        profilesMap[userId] = {
          full_name: `User ${userId.slice(0, 6)}`,
          email: `${userId.slice(0, 8)}@user.com`,
          phone: null
        }
      }
    })

    console.log('Final profiles map:', profilesMap)
    return profilesMap

  } catch (error) {
    console.error('Error fetching user profiles:', error)
    // Return fallback for all users
    const fallbackMap: Record<string, any> = {}
    userIds.forEach(userId => {
      fallbackMap[userId] = {
        full_name: `User ${userId.slice(0, 6)}`,
        email: `${userId.slice(0, 8)}@user.com`,
        phone: null
      }
    })
    return fallbackMap
  }
}

// Hook for product-specific reviews
export const useProductReviews = (productId: string) => {
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const fetchReviews = async () => {
    try {
      setIsLoading(true)
      
      console.log('Fetching reviews for product:', productId)
      
      // First try to fetch from the view
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('approved_product_reviews')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false })

      if (reviewsError) {
        console.error('Error fetching from view:', reviewsError)
        // Fallback to direct table query
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('product_reviews')
          .select(`
            *,
            products(name, images)
          `)
          .eq('product_id', productId)
          .eq('is_approved', true)
          .order('created_at', { ascending: false })

        if (fallbackError) {
          throw fallbackError
        }

        // Transform fallback data
        const transformedReviews = (fallbackData || []).map(item => ({
          ...item,
          product_name: item.products?.name || '',
          product_images: item.products?.images || [],
          user_name: 'Customer',
          user_avatar: null,
        })) as Review[]

        setReviews(transformedReviews)
      } else {
        setReviews(reviewsData || [])
      }

      // Fetch or calculate review statistics
      try {
        const { data: statsData, error: statsError } = await supabase
          .rpc('get_product_avg_rating', { product_uuid: productId })

        if (statsError) {
          console.warn('Error fetching stats, calculating manually:', statsError)
          // Calculate manually from fetched reviews
          const approvedReviews = reviewsData || []
          const total = approvedReviews.length
          const avg = total > 0 
            ? approvedReviews.reduce((sum, r) => sum + r.rating, 0) / total
            : 0
          
          const breakdown = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }
          approvedReviews.forEach(r => {
            breakdown[r.rating.toString() as keyof typeof breakdown]++
          })

          setStats({
            avg_rating: parseFloat(avg.toFixed(1)),
            total_reviews: total,
            rating_breakdown: breakdown
          })
        } else {
          setStats(statsData?.[0] || null)
        }
      } catch (statsErr) {
        console.error('Error calculating stats:', statsErr)
        setStats({
          avg_rating: 0,
          total_reviews: 0,
          rating_breakdown: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }
        })
      }

    } catch (error) {
      console.error('Error fetching reviews:', error)
      toast({
        title: 'Error',
        description: 'Failed to load reviews',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const addReview = async (userId: string, rating: number, comment: string) => {
    try {
      // Check if user already reviewed this product
      const { data: existingReview } = await supabase
        .from('product_reviews')
        .select('id')
        .eq('product_id', productId)
        .eq('user_id', userId)
        .single()

      if (existingReview) {
        toast({
          title: 'Already Reviewed',
          description: 'You have already reviewed this product',
          variant: 'destructive',
        })
        return false
      }

      const { error } = await supabase
        .from('product_reviews')
        .insert({
          product_id: productId,
          user_id: userId,
          rating,
          comment,
          is_approved: false, // Set to false initially for admin approval
        })

      if (error) throw error

      toast({
        title: 'Review Submitted',
        description: 'Thank you for your review! It will be visible after approval.',
        duration: 5000,
      })

      fetchReviews() // Refresh reviews
      return true

    } catch (error) {
      console.error('Error adding review:', error)
      toast({
        title: 'Error',
        description: 'Failed to submit review',
        variant: 'destructive',
      })
      return false
    }
  }

  useEffect(() => {
    if (productId) {
      fetchReviews()
    }
  }, [productId])

  return {
    reviews,
    stats,
    isLoading,
    addReview,
    refetch: fetchReviews,
  }
}

// Hook for admin to see all reviews
export const useAllReviews = () => {
  const [reviews, setReviews] = useState<ReviewWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const fetchAllReviews = async () => {
    try {
      setIsLoading(true)
      console.log('Fetching all reviews for admin...')
      
      // First, fetch all reviews with product info using a more robust query
      let reviewsData: any[] = []
      
      try {
        // Try with join first
        const { data, error } = await supabase
          .from('product_reviews')
          .select(`
            *,
            products:product_id (name)
          `)
          .order('created_at', { ascending: false })

        if (error) {
          console.warn('Join query failed, trying simple query:', error)
          // Fallback to simple query
          const { data: simpleData, error: simpleError } = await supabase
            .from('product_reviews')
            .select('*')
            .order('created_at', { ascending: false })

          if (simpleError) throw simpleError
          reviewsData = simpleData || []
        } else {
          reviewsData = data || []
        }
      } catch (queryError) {
        console.error('All query attempts failed:', queryError)
        throw queryError
      }

      // Get all unique user IDs from reviews
      const userIds = [...new Set(reviewsData?.map(review => review.user_id).filter(Boolean) || [])]
      console.log('Found user IDs:', userIds)

      // Fetch user profiles using the FIXED function
      const profilesMap = await fetchUserProfiles(userIds)
      console.log('Profiles map:', profilesMap)

      // Transform the data with user profiles
      const transformedData = (reviewsData || []).map(review => {
        const profile = profilesMap[review.user_id] || {}
        console.log('Processing review for user', review.user_id, 'profile:', profile)
        
        // Use real user name instead of "Customer"
        const userName = profile.full_name || 
                        review.user_id?.slice(0, 8) + '...' || 
                        'User' // Changed from 'Customer' to 'User'
        
        return {
          id: review.id,
          product_id: review.product_id,
          user_id: review.user_id,
          rating: review.rating,
          comment: review.comment,
          is_approved: review.is_approved,
          created_at: review.created_at,
          updated_at: review.updated_at,
          product_name: (review.products as any)?.name || 'Unknown Product',
          user_name: userName,
          user_email: profile.email || 
                     `${review.user_id?.slice(0, 8)}@user.com` || 
                     null,
          user_full_name: profile.full_name || userName,
          user_phone: profile.phone || null
        }
      })
      
      console.log('Final transformed reviews:', transformedData)
      setReviews(transformedData)

    } catch (error) {
      console.error('Error fetching all reviews:', error)
      toast({
        title: 'Error',
        description: 'Failed to load reviews. Please check your database connection.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const approveReview = async (reviewId: string) => {
    try {
      console.log('Approving review:', reviewId)
      
      const { error } = await supabase
        .from('product_reviews')
        .update({ 
          is_approved: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', reviewId)

      if (error) throw error

      toast({
        title: 'Review Approved',
        description: 'The review is now visible to customers',
      })

      // Update local state immediately
      setReviews(prev => prev.map(review => 
        review.id === reviewId 
          ? { ...review, is_approved: true }
          : review
      ))

    } catch (error) {
      console.error('Error approving review:', error)
      toast({
        title: 'Error',
        description: 'Failed to approve review',
        variant: 'destructive',
      })
    }
  }

  const deleteReview = async (reviewId: string) => {
    try {
      console.log('Deleting review:', reviewId)
      
      const { error } = await supabase
        .from('product_reviews')
        .delete()
        .eq('id', reviewId)

      if (error) throw error

      toast({
        title: 'Review Deleted',
        description: 'The review has been removed',
      })

      // Update local state immediately
      setReviews(prev => prev.filter(review => review.id !== reviewId))

    } catch (error) {
      console.error('Error deleting review:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete review',
        variant: 'destructive',
      })
    }
  }

  useEffect(() => {
    fetchAllReviews()
  }, [])

  return {
    reviews,
    isLoading,
    approveReview,
    deleteReview,
    refetch: fetchAllReviews,
  }
}