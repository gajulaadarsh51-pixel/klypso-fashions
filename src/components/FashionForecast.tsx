import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface ForecastItem {
  id: string;
  title: string;
  discount: string;
  image_url: string;
  link: string;
  alignment: 'left' | 'right' | 'center';
  focal_point: string;
  title_size: 'sm' | 'md' | 'lg' | 'xl';
  discount_size: 'sm' | 'md' | 'lg';
  text_color: string;
  overlay_opacity: number;
}

const FashionForecast = () => {
  const [items, setItems] = useState<ForecastItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('fashion_forecast')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching fashion forecast:', error);
    } finally {
      setLoading(false);
    }
  };

  // Function to get object position based on focal point
  const getObjectPosition = (focalPoint: string) => {
    switch(focalPoint) {
      case 'top':
        return 'center 0%'; // Shows top part (crops bottom)
      case 'bottom':
        return 'center 100%'; // Shows bottom part (crops top)
      case 'center':
        return 'center'; // Shows center (crops both top and bottom equally)
      default:
        return 'center';
    }
  };

  // Function to get title size classes
  const getTitleSizeClass = (size: string) => {
    switch(size) {
      case 'sm': return 'text-xl md:text-3xl';
      case 'md': return 'text-2xl md:text-4xl';
      case 'lg': return 'text-3xl md:text-5xl';
      case 'xl': return 'text-4xl md:text-6xl';
      default: return 'text-3xl md:text-5xl';
    }
  };

  // Function to get discount size classes
  const getDiscountSizeClass = (size: string) => {
    switch(size) {
      case 'sm': return 'text-base md:text-lg';
      case 'md': return 'text-lg md:text-xl';
      case 'lg': return 'text-xl md:text-2xl';
      default: return 'text-lg md:text-xl';
    }
  };

  // Function to get alignment classes
  const getAlignmentClasses = (alignment: string) => {
    switch(alignment) {
      case 'left':
        return 'items-start text-left';
      case 'right':
        return 'items-end text-right';
      case 'center':
        return 'items-center text-center';
      default:
        return 'items-start text-left';
    }
  };

  if (loading) {
    return (
      <div className="w-full bg-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="animate-pulse space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-200 rounded-[2.5rem] aspect-[21/9]"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="w-full bg-white py-12">
      {/* Main Title Header */}
      <div className="max-w-5xl mx-auto text-center mb-14">
        <h2 className="relative inline-block text-4xl md:text-6xl font-serif tracking-[0.25em] uppercase pb-4">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-600 to-gray-900">
            FASHION FORECAST
          </span>
          <span className="absolute bottom-0 left-1/4 right-1/4 h-[1.5px] bg-gray-200"></span>
        </h2>
      </div>

      {/* Cards Container */}
      <div className="max-w-4xl mx-auto px-4 flex flex-col gap-6">
        {items.map((card) => (
          <Link
            key={card.id}
            to={card.link}
            className="group relative block w-full overflow-hidden rounded-[1.5rem] md:rounded-[2.5rem] aspect-[16/9] md:aspect-[21/9] bg-gray-100"
          >
            {/* Background Image - With dynamic focal point */}
            <div className="absolute inset-0">
              <img
                src={card.image_url}
                alt={card.title}
                className="w-full h-full object-cover"
                style={{ 
                  objectPosition: getObjectPosition(card.focal_point)
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/1600x900?text=Image+Not+Found';
                }}
              />
              {/* Dynamic overlay based on admin settings */}
              <div 
                className="absolute inset-0 transition-opacity duration-300" 
                style={{ 
                  backgroundColor: `rgba(0,0,0,${(card.overlay_opacity || 15) / 100})` 
                }}
              />
            </div>

            {/* Content Overlay */}
            <div 
              className={`absolute inset-0 p-6 md:p-12 lg:p-16 flex flex-col justify-center ${getAlignmentClasses(card.alignment)}`}
            >
              <div 
                className="max-w-[80%] transition-all duration-300"
                style={{ color: card.text_color || '#FFFFFF' }}
              >
                <h3 
                  className={`${getTitleSizeClass(card.title_size)} font-serif font-bold uppercase tracking-tight mb-2 drop-shadow-lg`}
                >
                  {card.title}
                </h3>
                <p 
                  className={`${getDiscountSizeClass(card.discount_size)} font-medium opacity-90 drop-shadow-md`}
                >
                  {card.discount}
                </p>
              </div>
            </div>

            {/* Optional hover effect */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
          </Link>
        ))}
      </div>
    </div>
  );
};

export default FashionForecast;