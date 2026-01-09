'use client';

import { Button } from '@/components/ui/button';
import { ShoppingCart, ArrowRight } from 'lucide-react';
import type { GridSquare } from '@/lib/supabase/types';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface MobileCheckoutBarProps {
  selectedSquares: GridSquare[];
  isLoggedIn: boolean;
}

export default function MobileCheckoutBar({ selectedSquares, isLoggedIn }: MobileCheckoutBarProps) {
  const router = useRouter();
  const [squarePrice, setSquarePrice] = useState(50);

  useEffect(() => {
    loadPrice();
  }, []);

  const loadPrice = async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'square_price')
        .single();
      
      if (data?.value) {
        setSquarePrice(parseFloat(data.value));
      }
    } catch (error) {
      console.error('Error loading price:', error);
    }
  };

  const total = selectedSquares.length * squarePrice;

  const handleCheckout = () => {
    sessionStorage.setItem('selectedSquares', JSON.stringify(selectedSquares));
    
    if (!isLoggedIn) {
      router.push('/auth/login?redirect=/checkout');
    } else {
      router.push('/checkout');
    }
  };

  if (selectedSquares.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-40 lg:hidden">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#CDA33B]/10 rounded-lg flex items-center justify-center">
            <ShoppingCart className="w-5 h-5 text-[#CDA33B]" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">{selectedSquares.length} Selected</p>
            <p className="text-xs text-gray-600">${total.toFixed(2)}</p>
          </div>
        </div>
        
        <Button
          onClick={handleCheckout}
          size="default"
          className="gap-2 bg-[#CDA33B] hover:bg-[#B8942F] text-white border-0"
        >
          Checkout
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

