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
    <div className="min-h-screen bg-[#232842]">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to grid
        </Link>

        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="w-10 h-10 animate-spin text-[#d4af37] mx-auto mb-4" />
            <p className="text-gray-400">Loading...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-white mb-2">Complete Your Purchase</h1>
              <p className="text-gray-400">
                {selectedSquares.length} square{selectedSquares.length !== 1 ? 's' : ''} selected
              </p>
            </div>

            {/* Selected Squares Display */}
            <div className="bg-white/5 rounded-xl p-5">
              <div className="text-sm text-gray-400 mb-3">Your Squares</div>
              <div className="flex flex-wrap gap-2">
                {selectedSquares.map((square) => {
                  const boxNum = square.row_number * 10 + square.col_number + 1;
                  return (
                    <div
                      key={square.id}
                      className="w-12 h-12 bg-[#d4af37] rounded-lg flex items-center justify-center text-[#232842] font-bold text-lg"
                    >
                      {boxNum}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-white rounded-xl p-6">
              {/* Subtotal */}
              <div className="flex justify-between items-center py-3">
                <span className="text-gray-600">
                  {selectedSquares.length} square{selectedSquares.length !== 1 ? 's' : ''} × ${squarePrice}
                </span>
                <span className="text-xl font-semibold text-gray-900">${baseAmount.toFixed(2)}</span>
              </div>

              {/* Fee Option */}
              <div className="border-t border-gray-100 py-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={coversFee}
                        onChange={(e) => setCoversFee(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-6 h-6 rounded-md border-2 border-gray-300 peer-checked:border-[#d4af37] peer-checked:bg-[#d4af37] transition-colors flex items-center justify-center">
                        {coversFee && <Check className="w-4 h-4 text-white" />}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-900 font-medium">Cover processing fee</span>
                      <p className="text-xs text-gray-500">100% goes to the scholarship fund</p>
                    </div>
                  </div>
                  <span className="text-gray-600 font-medium">+${processingFee.toFixed(2)}</span>
                </label>
              </div>

              {/* Total */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total</span>
                  <span className="text-3xl font-bold text-[#232842]">${totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Charity Note */}
            <div className="bg-[#d4af37]/10 border border-[#d4af37]/30 rounded-xl p-4 flex items-center gap-3">
              <Heart className="w-6 h-6 text-[#d4af37] flex-shrink-0" fill="currentColor" />
              <p className="text-sm text-gray-300">
                Supporting the <strong className="text-white">Michael Williams Memorial Scholarship Fund</strong>
              </p>
            </div>

            {/* Checkout Button */}
            <button
              onClick={redirectToStripe}
              disabled={redirecting}
              className="w-full bg-[#d4af37] text-[#232842] py-4 px-6 rounded-xl font-bold text-lg hover:bg-[#c49b2f] transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {redirecting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Redirecting...
                </>
              ) : (
                <>Pay ${totalAmount.toFixed(2)}</>
              )}
            </button>

            {/* Security */}
            <p className="text-xs text-gray-500 text-center">
              🔒 Secure payment powered by Stripe
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
