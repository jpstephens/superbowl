'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import type { GridSquare } from '@/lib/supabase/types';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function PaymentPage() {
  const router = useRouter();
  const [selectedSquares, setSelectedSquares] = useState<GridSquare[]>([]);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [squarePrice, setSquarePrice] = useState(50);

  useEffect(() => {
    const saved = sessionStorage.getItem('selectedSquares');

    if (!saved) {
      router.push('/');
      return;
    }

    try {
      setSelectedSquares(JSON.parse(saved));
    } catch (error) {
      console.error('Error parsing squares:', error);
      router.push('/');
      return;
    }

    loadPriceAndRedirect(JSON.parse(saved));
  }, [router]);

  const loadPriceAndRedirect = async (squares: GridSquare[]) => {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'square_price')
        .single();

      const price = data?.value ? parseFloat(data.value) : 50;
      setSquarePrice(price);
      setLoading(false);

      // Redirect to Stripe immediately
      redirectToStripe(squares, price);
    } catch (error) {
      console.error('Error loading price:', error);
      setLoading(false);
    }
  };

  const redirectToStripe = async (squares: GridSquare[], price: number) => {
    setRedirecting(true);
    try {
      const totalAmount = squares.length * price;

      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedSquares: squares,
          totalAmount,
          baseAmount: totalAmount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
      setRedirecting(false);
    }
  };

  const totalAmount = selectedSquares.length * squarePrice;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* Back Link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to grid
          </Link>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            {loading ? (
              <div className="py-8">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Loading...</p>
              </div>
            ) : (
              <>
                {/* Order Summary */}
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Order Summary
                </h1>
                <p className="text-gray-500 mb-8">
                  {selectedSquares.length} square{selectedSquares.length !== 1 ? 's' : ''} × ${squarePrice}
                </p>

                {/* Total */}
                <div className="bg-gray-50 rounded-xl p-6 mb-8">
                  <div className="text-sm text-gray-500 mb-1">Total</div>
                  <div className="text-4xl font-bold text-gray-900">
                    ${totalAmount.toFixed(2)}
                  </div>
                </div>

                {/* Redirecting State */}
                <div className="flex items-center justify-center gap-3 text-gray-600">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Redirecting to secure checkout...</span>
                </div>

                {/* Manual Button (fallback) */}
                {!redirecting && (
                  <button
                    onClick={() => redirectToStripe(selectedSquares, squarePrice)}
                    className="mt-6 w-full bg-[#232842] text-white py-3 px-6 rounded-xl font-semibold hover:bg-[#2d3452] transition-colors"
                  >
                    Continue to Payment
                  </button>
                )}

                {/* Security Note */}
                <p className="text-xs text-gray-400 mt-6">
                  Secure payment powered by Stripe
                </p>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
