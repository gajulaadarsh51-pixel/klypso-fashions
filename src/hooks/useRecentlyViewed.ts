// hooks/useRecentlyViewed.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { Product } from './useProducts';

const RECENTLY_VIEWED_KEY = 'recently_viewed_products';
const MAX_RECENT_ITEMS = 10;

export const useRecentlyViewed = () => {
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const isInitialized = useRef(false);

  // Load recently viewed from localStorage on mount - only once
  useEffect(() => {
    if (isInitialized.current) return;
    
    try {
      const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
      if (stored) {
        setRecentlyViewed(JSON.parse(stored));
      }
      isInitialized.current = true;
    } catch (error) {
      console.error('Error loading recently viewed:', error);
    }
  }, []);

  // Add product to recently viewed - memoized with useCallback
  const addToRecentlyViewed = useCallback((product: Product) => {
    setRecentlyViewed(prev => {
      // Remove if already exists
      const filtered = prev.filter(p => p.id !== product.id);
      
      // Add to beginning
      const updated = [product, ...filtered].slice(0, MAX_RECENT_ITEMS);
      
      // Save to localStorage
      try {
        localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Error saving recently viewed:', error);
      }
      
      return updated;
    });
  }, []); // Empty dependency array - stable function reference

  // Clear all recently viewed
  const clearRecentlyViewed = useCallback(() => {
    setRecentlyViewed([]);
    localStorage.removeItem(RECENTLY_VIEWED_KEY);
  }, []);

  // Remove single product
  const removeFromRecentlyViewed = useCallback((productId: string) => {
    setRecentlyViewed(prev => {
      const updated = prev.filter(p => p.id !== productId);
      localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return {
    recentlyViewed,
    addToRecentlyViewed,
    clearRecentlyViewed,
    removeFromRecentlyViewed
  };
};