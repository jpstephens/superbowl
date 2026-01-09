'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Heart, TrendingUp, Users } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface WelcomeProps {
  isLoggedIn: boolean;
}

export default function Welcome({ isLoggedIn }: WelcomeProps) {
  const [soldCount, setSoldCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const totalSquares = 100;

  useEffect(() => {
    loadProgress();
    const interval = setInterval(loadProgress, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadProgress = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('grid_squares')
        .select('id', { count: 'exact' })
        .in('status', ['paid', 'confirmed']);

      if (error) throw error;
      setSoldCount(data?.length || 0);
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const progress = (soldCount / totalSquares) * 100;
  const remaining = totalSquares - soldCount;

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left: Title & Description */}
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#CDA33B]/10">
                <Heart className="w-6 h-6 text-[#CDA33B]" fill="currentColor" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                Super Bowl Pool
              </h1>
              <p className="text-sm text-gray-600">
                Supporting the <strong>Michael Williams Memorial Scholarship Fund</strong>
              </p>
            </div>
          </div>

          {/* Right: Stats & Progress */}
          <div className="flex items-center gap-6">
            {/* Stats */}
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="flex items-center gap-1 text-[#CDA33B]">
                  <Users className="w-4 h-4" />
                  <span className="text-xl font-bold">{soldCount}</span>
                </div>
                <p className="text-xs text-gray-500">Sold</p>
              </div>
              <div className="h-8 w-px bg-gray-300"></div>
              <div className="text-center">
                <div className="flex items-center gap-1 text-[#CDA33B]">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xl font-bold">{remaining}</span>
                </div>
                <p className="text-xs text-gray-500">Available</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="hidden sm:block w-32">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-1">
                <div
                  className="h-full bg-[#CDA33B] transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 text-center">
                {progress.toFixed(0)}% funded
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

