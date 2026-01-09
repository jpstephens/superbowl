'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function Logo({ size = 'medium' }: { size?: 'small' | 'medium' | 'large' }) {
  const [imageError, setImageError] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>('/logo.png');
  const [loading, setLoading] = useState(true);
  
  const sizeClasses = {
    small: 'w-10 h-10',
    medium: 'w-14 h-14',
    large: 'w-20 h-20'
  };

  const iconSizes = {
    small: 24,
    medium: 32,
    large: 48
  };

  useEffect(() => {
    loadLogoUrl();
  }, []);

  const loadLogoUrl = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'logo_url')
        .single();

      if (!error && data?.value) {
        setLogoUrl(data.value);
      }
    } catch (error) {
      console.error('Error loading logo URL:', error);
    } finally {
      setLoading(false);
    }
  };

  if (imageError) {
    // Fallback UI with icon
    return (
      <div className={`${sizeClasses[size]} relative flex-shrink-0 flex items-center justify-center bg-primary/10 rounded-lg`}>
        <Trophy className={`text-primary`} size={iconSizes[size]} />
      </div>
    );
  }

  if (loading) {
    // Show a placeholder while loading
    return (
      <div className={`${sizeClasses[size]} relative flex-shrink-0 bg-white/10 rounded-lg p-1 border border-white/20 flex items-center justify-center animate-pulse`}>
        <Trophy className={`text-primary/50`} size={iconSizes[size]} />
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} relative flex-shrink-0 bg-gray-100 rounded-lg p-1 border border-gray-200 flex items-center justify-center`}>
      <img
        src={logoUrl}
        alt="Michael Williams Memorial Scholarship"
        className="object-contain w-full h-full"
        onError={() => {
          // Silently fail and show fallback
          setImageError(true);
        }}
      />
    </div>
  );
}

