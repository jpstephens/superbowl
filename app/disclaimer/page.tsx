'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, AlertCircle, Scale, Heart } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
          {/* Back Button */}
          <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-[15px] font-medium text-[#232842] bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>

          <Card className="p-8 sm:p-12">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 mb-4">
                <Scale className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Legal Disclaimer & Rules
              </h1>
              <p className="text-gray-600">
                Please read carefully before participating
              </p>
            </div>

            {/* Content */}
            <div className="prose prose-gray max-w-none">
              {/* Charity Purpose */}
              <section className="mb-8 pb-8 border-b">
                <div className="flex items-center gap-3 mb-4">
                  <Heart className="w-6 h-6 text-red-500" fill="currentColor" />
                  <h2 className="text-2xl font-bold text-gray-900 m-0">Charitable Purpose</h2>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  This Super Bowl pool is organized to raise funds for the <strong>Michael Williams Memorial Scholarship Fund</strong>, 
                  a charitable organization dedicated to providing educational opportunities for deserving students. All proceeds from 
                  this pool, after prize payouts, are donated to the scholarship fund.
                </p>
              </section>

              {/* How It Works */}
              <section className="mb-8 pb-8 border-b">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">How It Works</h2>
                <ol className="space-y-3 text-gray-700">
                  <li><strong>Purchase Squares:</strong> Each square costs $50. Select your desired squares on the grid.</li>
                  <li><strong>Random Number Assignment:</strong> Once all 100 squares are sold, numbers 0-9 will be randomly assigned to rows and columns.</li>
                  <li><strong>Winning:</strong> At the end of each quarter, the person whose square matches the last digit of each team's score wins a prize.</li>
                  <li><strong>Prizes:</strong> Quarter 1, 2, and 3 typically pay 20% each. Quarter 4 (final) pays 40% of the prize pool.</li>
                </ol>
              </section>

              {/* Legal Information */}
              <section className="mb-8 pb-8 border-b">
                <div className="flex items-center gap-3 mb-4">
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                  <h2 className="text-2xl font-bold text-gray-900 m-0">Legal Information</h2>
                </div>
                <div className="space-y-4 text-gray-700">
                  <p>
                    <strong>Age Requirement:</strong> Participants must be 18 years or older to purchase squares.
                  </p>
                  <p>
                    <strong>No Gambling:</strong> This is a social pool organized for entertainment and charitable purposes. 
                    It is not considered gambling under applicable state and federal laws.
                  </p>
                  <p>
                    <strong>Payment:</strong> All payments are final. Refunds are only available if the event is canceled or 
                    postponed beyond a reasonable timeframe.
                  </p>
                  <p>
                    <strong>Prizes:</strong> Winners are responsible for any applicable taxes on prizes. A 1099 form may be 
                    issued for prizes over $600.
                  </p>
                  <p>
                    <strong>Fairness:</strong> Numbers are assigned using a cryptographically secure random number generator 
                    to ensure complete fairness.
                  </p>
                </div>
              </section>

              {/* Terms & Conditions */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Terms & Conditions</h2>
                <div className="space-y-4 text-gray-700">
                  <p>
                    By participating in this Super Bowl pool, you agree to the following terms:
                  </p>
                  <ul className="space-y-2">
                    <li>You are 18 years of age or older</li>
                    <li>You understand this is for entertainment and charitable purposes</li>
                    <li>You agree to the random number assignment process</li>
                    <li>You accept that all sales are final</li>
                    <li>You acknowledge that organizers are not liable for technical issues, errors, or disputes</li>
                    <li>You agree that organizers' decisions regarding winners and payouts are final</li>
                  </ul>
                </div>
              </section>

              {/* Contact */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Questions?</h2>
                <p className="text-gray-700">
                  If you have any questions about these terms or the pool operation, please contact us at{' '}
                  <a href="mailto:jasonpaulstephens@gmail.com" className="text-blue-600 hover:text-blue-700 font-semibold">
                    jasonpaulstephens@gmail.com
                  </a>
                </p>
              </section>
            </div>

            {/* Action */}
            <div className="mt-12 pt-8 border-t text-center">
              <Link href="/">
                <Button size="lg" className="px-8">
                  I Understand, Take Me Back
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
