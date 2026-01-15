'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import type { GridSquare } from '@/lib/supabase/types';
import { ArrowLeft, Loader2, Heart, Check } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function PaymentPage() {
  const router = useRouter();
  const [selectedSquares, setSelectedSquares] = useState<GridSquare[]>([]);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [squarePrice, setSquarePrice] = useState(50);
  const [coversFee, setCoversFee] = useState(true); // Default checked

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

    loadPrice();
  }, [router]);

  const loadPrice = async () => {
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
    } catch (error) {
      console.error('Error loading price:', error);
      setLoading(false);
    }
  };

  // Calculate base amount and processing fee
  const baseAmount = selectedSquares.length * squarePrice;

  // Stripe fee: 2.9% + $0.30
  const processingFee = useMemo(() => {
    return Math.round(((baseAmount * 0.029) + 0.30) * 100) / 100;
  }, [baseAmount]);

  const totalAmount = coversFee ? baseAmount + processingFee : baseAmount;

  const redirectToStripe = async () => {
    setRedirecting(true);
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedSquares,
          totalAmount,
          baseAmount,
          coversFee,
          feeAmount: coversFee ? processingFee : 0,
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
          <div className="bg-white rounded-2xl shadow-lg p-8">
            {loading ? (
              <div className="py-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Loading...</p>
              </div>
            ) : (
              <>
                {/* Order Summary Header */}
                <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
                  Order Summary
                </h1>
                <p className="text-gray-500 mb-6 text-center">
                  {selectedSquares.length} square{selectedSquares.length !== 1 ? 's' : ''} for the Super Bowl Pool
                </p>

                {/* Breakdown */}
                <div className="bg-gray-50 rounded-xl p-5 mb-6">
                  {/* Subtotal */}
                  <div className="flex justify-between text-sm mb-3">
                    <span className="text-gray-600">
                      {selectedSquares.length} square{selectedSquares.length !== 1 ? 's' : ''} × ${squarePrice}
                    </span>
                    <span className="text-gray-900 font-medium">${baseAmount.toFixed(2)}</span>
                  </div>

                  {/* Fee Donation Option */}
                  <div className="border-t border-gray-200 pt-3 mb-3">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div className="relative mt-0.5">
                        <input
                          type="checkbox"
                          checked={coversFee}
                          onChange={(e) => setCoversFee(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-5 h-5 rounded border-2 border-gray-300 peer-checked:border-[#d4af37] peer-checked:bg-[#d4af37] transition-colors flex items-center justify-center">
                          {coversFee && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-700 font-medium group-hover:text-gray-900">
                            Cover processing fee
                          </span>
                          <span className="text-sm text-gray-600">${processingFee.toFixed(2)}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                          Help ensure 100% of your contribution goes directly to the Michael Williams Memorial Scholarship Fund
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Total */}
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-base font-semibold text-gray-900">Total</span>
                      <span className="text-2xl font-bold text-gray-900">${totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Charity Message */}
                <div className="bg-red-50 rounded-xl p-4 mb-6 flex items-start gap-3">
                  <Heart className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" />
                  <p className="text-sm text-gray-700">
                    Your contribution supports the <strong>Michael Williams Memorial Scholarship Fund</strong>, helping students pursue their dreams.
                  </p>
                </div>

                {/* Continue Button */}
                <button
                  onClick={redirectToStripe}
                  disabled={redirecting}
                  className="w-full bg-[#232842] text-white py-3.5 px-6 rounded-xl font-semibold hover:bg-[#2d3452] transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {redirecting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Redirecting to checkout...
                    </>
                  ) : (
                    <>Continue to Payment</>
                  )}
                </button>

                {/* Security Note */}
                <p className="text-xs text-gray-400 mt-4 text-center">
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
