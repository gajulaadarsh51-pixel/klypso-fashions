// components/ReviewsDebug.tsx
import { useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'

export const ReviewsDebug = () => {
  useEffect(() => {
    const checkReviews = async () => {
      console.log('=== REVIEWS DEBUG ===')
      
      try {
        // Check total count
        const { count, error: countError } = await supabase
          .from('product_reviews')
          .select('*', { count: 'exact', head: true })
        
        console.log('Total reviews in DB:', count, 'Error:', countError)
        
        // Check a few reviews with user info
        const { data: sampleReviews, error: sampleError } = await supabase
          .from('product_reviews')
          .select(`
            *,
            products:product_id (name)
          `)
          .limit(5)
        
        console.log('Sample reviews:', sampleReviews)
        console.log('Sample error:', sampleError)
        
        if (sampleReviews && sampleReviews.length > 0) {
          const userIds = sampleReviews.map(r => r.user_id).filter(Boolean)
          console.log('User IDs in sample:', userIds)
          
          // Test the RPC function
          try {
            const { data: usersData, error: rpcError } = await supabase.rpc('get_users_by_ids', {
              user_ids: userIds
            })
            console.log('RPC users result:', usersData)
            console.log('RPC error:', rpcError)
          } catch (rpcErr) {
            console.error('RPC test failed:', rpcErr)
          }
        }
        
        // Check RLS
        const { data: session } = await supabase.auth.getSession()
        console.log('Current session:', session)
      } catch (error) {
        console.error('Debug error:', error)
      }
    }
    
    checkReviews()
  }, [])
  
  return null
}