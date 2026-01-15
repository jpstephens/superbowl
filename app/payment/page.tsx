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
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-[15px] font-medium text-[#232842] bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to grid
        </Link>

        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="w-10 h-10 animate-spin text-[#cda33b] mx-auto mb-4" />
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-[#232842] mb-2">Complete Your Purchase</h1>
              <p className="text-gray-500">
                {selectedSquares.length} square{selectedSquares.length !== 1 ? 's' : ''} selected
              </p>
            </div>

            {/* Selected Squares Display */}
            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
              <div className="text-sm text-gray-500 mb-3">Your Squares</div>
              <div className="flex flex-wrap gap-2">
                {selectedSquares.map((square) => {
                  const boxNum = square.row_number * 10 + square.col_number + 1;
                  return (
                    <div
                      key={square.id}
                      className="w-12 h-12 bg-[#cda33b] rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm"
                    >
                      {boxNum}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Header Row */}
              <div className="flex justify-between items-center px-5 py-3 bg-gray-50 border-b border-gray-200">
                <span className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Description</span>
                <span className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Amount</span>
              </div>

              {/* Price breakdown */}
              <div className="p-5 space-y-4">
                {/* Subtotal Row */}
                <div className="flex justify-between items-baseline">
                  <span className="text-[15px] text-gray-700">
                    {selectedSquares.length} square{selectedSquares.length !== 1 ? 's' : ''} × ${squarePrice}
                  </span>
                  <span className="text-[17px] font-semibold text-[#232842] tabular-nums">
                    ${baseAmount.toFixed(2)}
                  </span>
                </div>

                {/* Fee Option Row */}
                <label className="flex items-center justify-between gap-4 border-t border-gray-100 pt-4 cursor-pointer">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={coversFee}
                        onChange={(e) => setCoversFee(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-5 h-5 rounded-md border-2 border-gray-300 peer-checked:border-[#cda33b] peer-checked:bg-[#cda33b] transition-colors flex items-center justify-center">
                        {coversFee && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                    </div>
                    <span className="text-[15px] text-gray-700 truncate">Cover processing fee <span className="text-gray-400 hidden sm:inline">· 100% to scholarship</span></span>
                  </div>
                  <span className={`text-[17px] tabular-nums flex-shrink-0 ${coversFee ? 'font-semibold text-[#232842]' : 'text-gray-400'}`}>
                    +${processingFee.toFixed(2)}
                  </span>
                </label>

                {/* Total Row */}
                <div className="flex justify-between items-baseline border-t-2 border-[#232842]/20 pt-4 mt-4">
                  <span className="text-[17px] font-bold text-[#232842]">Total</span>
                  <span className="text-[26px] font-bold text-[#232842] tabular-nums">
                    ${totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Charity Note */}
            <div className="bg-[#cda33b]/10 border border-[#cda33b]/30 rounded-xl p-4 flex items-center gap-3">
              <Heart className="w-6 h-6 text-[#cda33b] flex-shrink-0" fill="currentColor" />
              <p className="text-sm text-gray-700">
                Supporting the <strong className="text-[#232842]">Michael Williams Memorial Scholarship Fund</strong>
              </p>
            </div>

            {/* Checkout Button */}
            <button
              onClick={redirectToStripe}
              disabled={redirecting}
              className="w-full bg-[#cda33b] text-white py-4 px-6 rounded-xl font-bold text-lg hover:bg-[#c39931] transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
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
              Secure payment powered by Stripe
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
