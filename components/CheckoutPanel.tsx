'use client';

import { useState, useEffect } from 'react';
import { X, ArrowRight } from 'lucide-react';
import type { GridSquare } from '@/lib/supabase/types';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

interface CheckoutPanelProps {
  selectedSquares: GridSquare[];
  onRemoveSquare?: (squareId: string) => void;
  isLoggedIn: boolean;
}

/**
 * Checkout Panel Component
 * Streamlined design - shows count, total, and checkout button
 * Apple HIG-inspired: minimal chrome, clear hierarchy
 */
export default function CheckoutPanel({ selectedSquares, onRemoveSquare }: CheckoutPanelProps) {
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
    router.push('/payment');
  };

  // Empty state - minimal
  if (selectedSquares.length === 0) {
    return (
      <div className="rounded-xl shadow-level-2 bg-card p-6">
        <p className="text-center text-muted-foreground">
          Tap squares to select
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl shadow-level-3 bg-card p-5"
    >
      {/* Selected Squares - Compact Grid */}
      <div className="flex flex-wrap gap-2 mb-5">
        <AnimatePresence mode="popLayout">
          {selectedSquares.map(square => (
            <motion.div
              key={square.id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="relative group"
            >
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-semibold text-sm">
                {square.row_number},{square.col_number}
              </div>
              {/* Remove Button */}
              {onRemoveSquare && (
                <button
                  onClick={() => onRemoveSquare(square.id)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-foreground text-background rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive focus:opacity-100"
                  aria-label={`Remove square ${square.row_number},${square.col_number}`}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Total - Clean typography */}
      <div className="flex items-baseline justify-between mb-5">
        <span className="text-muted-foreground">
          {selectedSquares.length} square{selectedSquares.length !== 1 ? 's' : ''} × ${squarePrice}
        </span>
        <span className="text-2xl font-semibold tabular-nums">
          ${total.toFixed(0)}
        </span>
      </div>

      {/* Checkout Button - Large, prominent */}
      <button
        onClick={handleCheckout}
        className="btn-primary w-full justify-center"
      >
        Continue to Payment
        <ArrowRight className="w-5 h-5" />
      </button>
    </motion.div>
  );
}
