'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import type { GridSquare } from '@/lib/supabase/types';
import { ArrowLeft, Loader2, Heart, Check, FileText, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function PaymentPage() {
  const router = useRouter();
  const [selectedSquares, setSelectedSquares] = useState<GridSquare[]>([]);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [squarePrice, setSquarePrice] = useState(50);
  const [coversFee, setCoversFee] = useState(true); // Default checked
  const [displayName, setDisplayName] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Email check state
  const [email, setEmail] = useState('');
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [existingUserName, setExistingUserName] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedInEmail, setLoggedInEmail] = useState('');

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
    checkLoginStatus();
  }, [router]);

  const checkLoginStatus = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      setIsLoggedIn(true);
      setLoggedInEmail(user.email);
      setEmail(user.email);
    }
  };

  const handleEmailBlur = async () => {
    if (!email || isLoggedIn) return;

    const trimmedEmail = email.toLowerCase().trim();
    if (!trimmedEmail.includes('@')) return;

    setCheckingEmail(true);
    try {
      const response = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      const data = await response.json();
      setEmailExists(data.exists);
      setExistingUserName(data.name || '');
    } catch (error) {
      console.error('Error checking email:', error);
    } finally {
      setCheckingEmail(false);
    }
  };

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
          displayName: displayName.trim() || undefined,
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
              <div className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-3">Your Squares</div>
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

            {/* Email Input - Check for existing account */}
            {!isLoggedIn && (
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <label htmlFor="email" className="block text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Your Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailExists(false);
                    }}
                    onBlur={handleEmailBlur}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 text-[15px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#cda33b] focus:border-transparent"
                  />
                  {checkingEmail && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />
                  )}
                </div>
                <p className="mt-2 text-[13px] text-gray-500">
                  Receipt and purchase confirmation will be sent here.
                </p>

                {/* Existing account warning */}
                {emailExists && !isLoggedIn && (
                  <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-800">
                          Welcome back{existingUserName ? `, ${existingUserName.split(' ')[0]}` : ''}!
                        </p>
                        <p className="text-sm text-amber-700 mt-1">
                          You've purchased squares before. Sign in to keep all your squares in one account.
                        </p>
                        <Link
                          href={`/auth/login?redirect=/payment`}
                          className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 transition-colors"
                        >
                          Sign In
                        </Link>
                        <button
                          onClick={() => setEmailExists(false)}
                          className="ml-3 text-sm text-amber-700 hover:text-amber-800 underline"
                        >
                          Continue as new
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Logged in indicator */}
            {isLoggedIn && (
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-800">
                    Signed in as {loggedInEmail}
                  </span>
                </div>
              </div>
            )}

            {/* Display Name Input */}
            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
              <label htmlFor="displayName" className="block text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Name on Squares <span className="text-gray-400 font-normal normal-case">(optional)</span>
              </label>
              <input
                type="text"
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g., John S., The Smiths, Go Chiefs!"
                maxLength={20}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 text-[15px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#cda33b] focus:border-transparent"
              />
              <p className="mt-2 text-[13px] text-gray-500">
                This is what will show on your squares. Leave blank to use your billing name.
              </p>
            </div>

            {/* Pricing */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Header Row */}
              <div className="flex justify-between items-center px-5 py-3 bg-gray-50 border-b border-gray-200">
                <span className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Description</span>
                <span className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Amount</span>
              </div>

              {/* Price breakdown */}
              <div className="p-5">
                {/* Subtotal Row */}
                <div className="flex justify-between items-baseline">
                  <span className="text-[15px] text-gray-700">
                    {selectedSquares.length} square{selectedSquares.length !== 1 ? 's' : ''} × ${squarePrice}
                  </span>
                  <span className="text-[17px] font-semibold text-[#232842] tabular-nums">
                    ${baseAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Cover Fee Election */}
            <label className={`block rounded-xl border-2 p-4 cursor-pointer transition-all ${coversFee ? 'bg-[#cda33b]/10 border-[#cda33b]' : 'bg-gray-50 border-gray-200 hover:border-gray-300'}`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={coversFee}
                      onChange={(e) => setCoversFee(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${coversFee ? 'border-[#cda33b] bg-[#cda33b]' : 'border-gray-300 bg-white'}`}>
                      {coversFee && <Check className="w-4 h-4 text-white" />}
                    </div>
                  </div>
                  <div>
                    <div className="text-[15px] font-semibold text-[#232842]">Cover processing fee</div>
                    <div className="text-[13px] text-gray-500">100% of your purchase supports the scholarship</div>
                  </div>
                </div>
                <span className={`text-[17px] font-semibold tabular-nums ${coversFee ? 'text-[#232842]' : 'text-gray-400'}`}>
                  +${processingFee.toFixed(2)}
                </span>
              </div>
            </label>

            {/* Total */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex justify-between items-baseline">
                <span className="text-[17px] font-bold text-[#232842]">Total</span>
                <span className="text-[28px] font-bold text-[#232842] tabular-nums">
                  ${totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Thank You Note */}
            <div className="bg-[#cda33b]/10 border border-[#cda33b]/30 rounded-xl p-4 flex items-center gap-3">
              <Heart className="w-6 h-6 text-[#cda33b] flex-shrink-0" fill="currentColor" />
              <p className="text-sm text-gray-700">
                Thank you for supporting the <strong className="text-[#232842]">Michael Williams Memorial Scholarship Fund</strong>
              </p>
            </div>

            {/* Terms Agreement */}
            <label className={`block rounded-xl border-2 p-4 cursor-pointer transition-all ${agreedToTerms ? 'bg-blue-50 border-blue-500' : 'bg-gray-50 border-gray-200 hover:border-gray-300'}`}>
              <div className="flex items-start gap-3">
                <div className="relative mt-0.5">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${agreedToTerms ? 'border-blue-500 bg-blue-500' : 'border-gray-300 bg-white'}`}>
                    {agreedToTerms && <Check className="w-4 h-4 text-white" />}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4 text-gray-600" />
                    <span className="text-[15px] font-semibold text-[#232842]">I agree to the terms</span>
                  </div>
                  <p className="text-[13px] text-gray-600 leading-relaxed">
                    I have read and agree to the{' '}
                    <Link href="/terms" target="_blank" className="text-blue-600 hover:underline font-medium">
                      Terms of Service
                    </Link>
                    ,{' '}
                    <Link href="/privacy" target="_blank" className="text-blue-600 hover:underline font-medium">
                      Privacy Policy
                    </Link>
                    , and{' '}
                    <Link href="/rules" target="_blank" className="text-blue-600 hover:underline font-medium">
                      Official Contest Rules
                    </Link>
                    . I confirm I am 18 years or older.
                  </p>
                </div>
              </div>
            </label>

            {/* Checkout Button */}
            <button
              onClick={redirectToStripe}
              disabled={redirecting || !agreedToTerms}
              className="w-full bg-[#cda33b] text-white py-4 px-6 rounded-xl font-bold text-lg hover:bg-[#c39931] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
            >
              {redirecting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Redirecting...
                </>
              ) : !agreedToTerms ? (
                <>Please agree to terms above</>
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
