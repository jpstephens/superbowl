'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function ProgressIndicator() {
  const [soldCount, setSoldCount] = useState(0);
  const totalSquares = 100;

  useEffect(() => {
    loadSoldCount();
    const interval = setInterval(loadSoldCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadSoldCount = async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('grid_squares')
        .select('id', { count: 'exact' })
        .eq('status', 'paid');

      setSoldCount(data?.length || 0);
    } catch (error) {
      console.error('Error loading sold count:', error);
    }
  };

  const progressPercentage = (soldCount / totalSquares) * 100;
  const remainingSquares = totalSquares - soldCount;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-gray-700">
          {soldCount} of {totalSquares} squares sold
        </span>
        <span className="text-sm font-semibold text-blue-600">
          {remainingSquares} remaining
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div 
          className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
}



