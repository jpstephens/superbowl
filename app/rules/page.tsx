'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Trophy, Calendar, Users, Gift, Scale, Heart } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function ContestRulesPage() {
  const lastUpdated = 'January 15, 2026';

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
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-50 mb-4">
                <Trophy className="w-8 h-8 text-amber-600" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Official Contest Rules
              </h1>
              <p className="text-gray-600">
                Super Bowl Squares Pool — Last updated: {lastUpdated}
              </p>
            </div>

            {/* Content */}
            <div className="prose prose-gray max-w-none">
              {/* Sponsor Information */}
              <section className="mb-8 pb-8 border-b">
                <div className="flex items-center gap-3 mb-4">
                  <Heart className="w-6 h-6 text-red-500" fill="currentColor" />
                  <h2 className="text-2xl font-bold text-gray-900 m-0">Sponsor Information</h2>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg text-gray-700">
                  <p className="mb-2"><strong>Organization:</strong> Michael Williams Memorial Scholarship Fund</p>
                  <p className="mb-2"><strong>501(c)(3) EIN:</strong> 88-0683423</p>
                  <p className="mb-2"><strong>Address:</strong> 1973 Route 34, Ste 201, Wall Township, NJ 07719</p>
                  <p className="mb-2"><strong>Contact:</strong> jasonpaulstephens@gmail.com</p>
                  <p>
                    <strong>Learn More:</strong>{' '}
                    <a
                      href="https://michaelwilliamsscholarship.com/about-us/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 font-semibold"
                    >
                      About the Scholarship Fund
                    </a>
                  </p>
                </div>
                <p className="text-gray-700 mt-4">
                  100% of proceeds from this pool support the Michael Williams Memorial Scholarship Fund,
                  a charitable organization providing educational opportunities for deserving students.
                </p>
              </section>

              {/* Eligibility */}
              <section className="mb-8 pb-8 border-b">
                <div className="flex items-center gap-3 mb-4">
                  <Users className="w-6 h-6 text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-900 m-0">Eligibility</h2>
                </div>
                <ul className="space-y-2 text-gray-700">
                  <li>Open to individuals 18 years of age or older</li>
                  <li>Participation is void where prohibited by law</li>
                  <li>Employees and immediate family members of the Michael Williams Memorial Scholarship Fund are eligible to participate</li>
                  <li>No purchase necessary to view the pool; purchase required to participate</li>
                </ul>
              </section>

              {/* Entry Period */}
              <section className="mb-8 pb-8 border-b">
                <div className="flex items-center gap-3 mb-4">
                  <Calendar className="w-6 h-6 text-green-600" />
                  <h2 className="text-2xl font-bold text-gray-900 m-0">Entry Period</h2>
                </div>
                <div className="space-y-4 text-gray-700">
                  <p>
                    <strong>Pool Opens:</strong> When announced on the website (typically 2-4 weeks before the Super Bowl)
                  </p>
                  <p>
                    <strong>Pool Closes:</strong> When all 100 squares are sold OR at kickoff of the Super Bowl, whichever occurs first
                  </p>
                  <p>
                    <strong>Number Assignment:</strong> Random numbers will be assigned after all squares are sold or at kickoff
                  </p>
                </div>
              </section>

              {/* How to Enter */}
              <section className="mb-8 pb-8 border-b">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">How to Enter</h2>
                <ol className="space-y-3 text-gray-700">
                  <li><strong>Step 1:</strong> Visit superbowlpool.com and view the available squares on the 10x10 grid</li>
                  <li><strong>Step 2:</strong> Select one or more available squares (there is no limit on the number of squares you may purchase)</li>
                  <li><strong>Step 3:</strong> Complete the checkout process using a credit or debit card via Stripe</li>
                  <li><strong>Step 4:</strong> Receive email confirmation of your purchase with your square positions</li>
                  <li><strong>Step 5:</strong> After the pool closes, receive notification of your assigned numbers</li>
                </ol>
              </section>

              {/* Entry Fee */}
              <section className="mb-8 pb-8 border-b">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Entry Fee</h2>
                <div className="space-y-4 text-gray-700">
                  <p>
                    <strong>Cost Per Square:</strong> $50.00 USD
                  </p>
                  <p>
                    <strong>Total Pool:</strong> 100 squares × $50 = $5,000 maximum prize pool
                  </p>
                  <p>
                    <strong>Optional Fee Coverage:</strong> During checkout, you may elect to cover the payment processing
                    fee (approximately 2.9% + $0.30) as an additional charitable donation
                  </p>
                  <p>
                    <strong>No Limit:</strong> There is no limit to the number of squares a single participant may purchase
                  </p>
                </div>
              </section>

              {/* Prize Description */}
              <section className="mb-8 pb-8 border-b">
                <div className="flex items-center gap-3 mb-4">
                  <Gift className="w-6 h-6 text-amber-600" />
                  <h2 className="text-2xl font-bold text-gray-900 m-0">Prize Description</h2>
                </div>
                <div className="space-y-4 text-gray-700">
                  <p>Four (4) prizes will be awarded, one at the end of each quarter of the Super Bowl:</p>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 px-4 py-2 text-left">Prize</th>
                          <th className="border border-gray-300 px-4 py-2 text-left">Timing</th>
                          <th className="border border-gray-300 px-4 py-2 text-left">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-300 px-4 py-2">Q1 Prize</td>
                          <td className="border border-gray-300 px-4 py-2">End of 1st Quarter</td>
                          <td className="border border-gray-300 px-4 py-2">$1,000</td>
                        </tr>
                        <tr className="bg-gray-50">
                          <td className="border border-gray-300 px-4 py-2">Q2 Prize</td>
                          <td className="border border-gray-300 px-4 py-2">Halftime</td>
                          <td className="border border-gray-300 px-4 py-2">$1,000</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-4 py-2">Q3 Prize</td>
                          <td className="border border-gray-300 px-4 py-2">End of 3rd Quarter</td>
                          <td className="border border-gray-300 px-4 py-2">$1,000</td>
                        </tr>
                        <tr className="bg-gray-50">
                          <td className="border border-gray-300 px-4 py-2">Q4 Prize (Grand Prize)</td>
                          <td className="border border-gray-300 px-4 py-2">Final Score</td>
                          <td className="border border-gray-300 px-4 py-2">$2,000</td>
                        </tr>
                        <tr className="bg-amber-50 font-semibold">
                          <td className="border border-gray-300 px-4 py-2" colSpan={2}>Total Prize Pool</td>
                          <td className="border border-gray-300 px-4 py-2">$5,000</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    *Prize amounts may be adjusted by the Sponsor and will be displayed on the website before the pool closes
                  </p>
                </div>
              </section>

              {/* Winner Selection */}
              <section className="mb-8 pb-8 border-b">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Winner Selection Method</h2>
                <div className="space-y-4 text-gray-700">
                  <h3 className="text-lg font-semibold text-gray-800">Number Assignment</h3>
                  <p>
                    After all 100 squares are sold (or at game kickoff), numbers 0-9 will be randomly assigned
                    to each row and each column of the grid using a cryptographically secure Fisher-Yates shuffle
                    algorithm. This ensures completely fair and unpredictable number assignment.
                  </p>

                  <h3 className="text-lg font-semibold text-gray-800 mt-6">Determining Winners</h3>
                  <p>
                    At the end of each quarter, the winning square is determined by:
                  </p>
                  <ul className="space-y-2">
                    <li>Taking the <strong>last digit</strong> of the AFC team's score (row number)</li>
                    <li>Taking the <strong>last digit</strong> of the NFC team's score (column number)</li>
                    <li>The square at the intersection of that row and column wins</li>
                  </ul>

                  <div className="p-4 bg-gray-50 rounded-lg mt-4">
                    <p className="font-semibold">Example:</p>
                    <p>If the score at halftime is AFC 17 - NFC 14:</p>
                    <ul className="mt-2">
                      <li>AFC last digit: 7 (row)</li>
                      <li>NFC last digit: 4 (column)</li>
                      <li>The owner of the square at Row 7, Column 4 wins the Q2 prize</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Winner Notification */}
              <section className="mb-8 pb-8 border-b">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Winner Notification</h2>
                <div className="space-y-4 text-gray-700">
                  <p>
                    Winners will be notified via email within 24 hours of each quarter ending. If you provided
                    a phone number during checkout, you may also receive an SMS notification.
                  </p>
                  <p>
                    Winners will be publicly displayed on the website by first name and last initial (e.g., "John S.").
                  </p>
                </div>
              </section>

              {/* Prize Claim */}
              <section className="mb-8 pb-8 border-b">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Prize Claim Period</h2>
                <div className="space-y-4 text-gray-700">
                  <p>
                    Winners must respond to the notification email within <strong>90 days</strong> to claim their prize.
                    Prizes will be distributed via check, Venmo, PayPal, or electronic transfer at the Sponsor's discretion.
                  </p>
                  <p>
                    Unclaimed prizes after 90 days will be donated to the Michael Williams Memorial Scholarship Fund.
                  </p>
                </div>
              </section>

              {/* Tax Responsibility */}
              <section className="mb-8 pb-8 border-b">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Tax Responsibility</h2>
                <div className="space-y-4 text-gray-700">
                  <p>
                    Winners are solely responsible for any federal, state, or local taxes on their prizes.
                  </p>
                  <p>
                    <strong>IRS Reporting:</strong> For prizes of $600 or more, we are required to report the winnings
                    to the IRS and may request your Social Security Number to issue a Form 1099-MISC.
                  </p>
                </div>
              </section>

              {/* General Conditions */}
              <section className="mb-8 pb-8 border-b">
                <div className="flex items-center gap-3 mb-4">
                  <Scale className="w-6 h-6 text-gray-600" />
                  <h2 className="text-2xl font-bold text-gray-900 m-0">General Conditions</h2>
                </div>
                <div className="space-y-4 text-gray-700">
                  <p><strong>All Sales Final:</strong> Square purchases are non-refundable except in the event the Super Bowl is canceled.</p>

                  <p><strong>Disqualification:</strong> The Sponsor reserves the right to disqualify any participant who:</p>
                  <ul className="space-y-1 ml-4">
                    <li>Provides false or misleading information</li>
                    <li>Attempts to manipulate or tamper with the pool</li>
                    <li>Violates these Official Rules</li>
                  </ul>

                  <p><strong>Disputes:</strong> All decisions made by the Sponsor regarding winner selection and prize distribution are final and binding.</p>

                  <p><strong>Technical Issues:</strong> The Sponsor is not responsible for any technical malfunctions, human errors, or other issues that may affect participation or winner determination.</p>

                  <p><strong>Limitation of Liability:</strong> Participants agree to release and hold harmless the Sponsor and its affiliates from any claims, damages, or liability arising from participation in this pool.</p>

                  <p><strong>Modification:</strong> The Sponsor reserves the right to modify, suspend, or cancel this pool at any time for any reason. In the event of cancellation before the game, all purchases will be refunded.</p>
                </div>
              </section>

              {/* Governing Law */}
              <section className="mb-8 pb-8 border-b">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Governing Law</h2>
                <p className="text-gray-700">
                  These Official Rules and any disputes arising from this pool shall be governed by the laws of the
                  State of New Jersey, without regard to conflicts of law principles. Any legal action must be brought
                  in the state or federal courts located in Monmouth County, New Jersey.
                </p>
              </section>

              {/* Charitable Purpose */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Charitable Purpose Statement</h2>
                <div className="p-4 bg-green-50 rounded-lg text-gray-700">
                  <p>
                    This Super Bowl Squares Pool is operated by the Michael Williams Memorial Scholarship Fund,
                    a 501(c)(3) tax-exempt charitable organization (EIN: 88-0683423). 100% of proceeds from this
                    pool support the scholarship fund's mission to provide educational opportunities for deserving students.
                  </p>
                  <p className="mt-4">
                    <a
                      href="https://michaelwilliamsscholarship.com/about-us/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 font-semibold"
                    >
                      Learn more about the Michael Williams Memorial Scholarship Fund →
                    </a>
                  </p>
                </div>
              </section>
            </div>

            {/* Action */}
            <div className="mt-12 pt-8 border-t text-center">
              <Link href="/">
                <Button size="lg" className="px-8">
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
