'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { CheckCircle2, Home, Grid3x3, Heart, Trophy } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import confetti from 'canvas-confetti';

function ThankYouContent() {
  const searchParams = useSearchParams();
  const [squareCount, setSquareCount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    // Trigger confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    // Get square count from URL or session storage
    const count = searchParams.get('count');
    const amount = searchParams.get('amount');
    
    if (count) setSquareCount(parseInt(count));
    if (amount) setTotalAmount(parseFloat(amount));

    // Clear session storage
    sessionStorage.removeItem('selectedSquares');
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-2xl">
          <Card className="p-8 sm:p-12 text-center shadow-xl">
            {/* Success Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-50 mb-6">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Thank You!
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Your payment has been received and your squares are confirmed.
            </p>

            {/* Summary Box */}
            <div className="bg-blue-50 rounded-xl p-6 mb-8 border border-blue-100">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {squareCount || '—'}
                  </div>
                  <div className="text-sm text-gray-600">Squares Purchased</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    ${totalAmount.toFixed(2) || '—'}
                  </div>
                  <div className="text-sm text-gray-600">Total Contribution</div>
                </div>
              </div>
            </div>

            {/* Charity Message */}
            <div className="bg-red-50 rounded-xl p-6 mb-8 border border-red-100">
              <Heart className="w-8 h-8 text-red-500 mx-auto mb-3" fill="currentColor" />
              <p className="text-sm text-gray-700">
                <strong>Your contribution supports the Michael Williams Memorial Scholarship Fund.</strong>
                <br />
                Thank you for helping students pursue their dreams.
              </p>
            </div>

            {/* What's Next */}
            <div className="text-left mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-600" />
                What's Next?
              </h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                    1
                  </div>
                  <span>Numbers will be randomly assigned once all 100 squares are sold</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                    2
                  </div>
                  <span>You'll receive an email confirmation with your square details</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                    3
                  </div>
                  <span>Check back during the game to see if you're winning!</span>
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/my-squares" className="flex-1">
                <Button className="w-full h-12 gap-2" size="lg">
                  <Grid3x3 className="w-5 h-5" />
                  View My Squares
                </Button>
              </Link>
              <Link href="/" className="flex-1">
                <Button variant="outline" className="w-full h-12 gap-2" size="lg">
                  <Home className="w-5 h-5" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <ThankYouContent />
    </Suspense>
  );
}
