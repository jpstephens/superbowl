'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, FileText, AlertTriangle, CreditCard, RefreshCcw, Scale, Mail } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function TermsOfServicePage() {
  const lastUpdated = 'January 15, 2026';
  const effectiveDate = 'January 15, 2026';

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
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50 mb-4">
                <FileText className="w-8 h-8 text-indigo-600" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Terms of Service
              </h1>
              <p className="text-gray-600">
                Effective Date: {effectiveDate} | Last Updated: {lastUpdated}
              </p>
            </div>

            {/* Content */}
            <div className="prose prose-gray max-w-none">
              {/* Introduction */}
              <section className="mb-8 pb-8 border-b">
                <p className="text-gray-700 leading-relaxed">
                  Welcome to the Super Bowl Pool operated by the Michael Williams Memorial Scholarship Fund
                  ("Organization," "we," "us," or "our"). By accessing or using superbowlpool.com (the "Website")
                  or participating in our Super Bowl squares pool (the "Pool"), you agree to be bound by these
                  Terms of Service ("Terms").
                </p>
                <p className="text-gray-700 leading-relaxed mt-4">
                  <strong>Please read these Terms carefully before participating.</strong> If you do not agree to
                  these Terms, you may not use the Website or participate in the Pool.
                </p>
              </section>

              {/* Acceptance */}
              <section className="mb-8 pb-8 border-b">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
                <div className="space-y-4 text-gray-700">
                  <p>
                    By creating an account, purchasing squares, or otherwise using the Website, you acknowledge
                    that you have read, understood, and agree to be bound by these Terms, our{' '}
                    <Link href="/privacy" className="text-blue-600 hover:text-blue-700 font-semibold">Privacy Policy</Link>,
                    and our{' '}
                    <Link href="/rules" className="text-blue-600 hover:text-blue-700 font-semibold">Official Contest Rules</Link>.
                  </p>
                  <p>
                    We may update these Terms from time to time. Your continued use of the Website after changes
                    are posted constitutes your acceptance of the updated Terms.
                  </p>
                </div>
              </section>

              {/* Eligibility */}
              <section className="mb-8 pb-8 border-b">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Eligibility Requirements</h2>
                <div className="space-y-4 text-gray-700">
                  <p>To participate in the Pool, you must:</p>
                  <ul className="space-y-2">
                    <li>Be at least 18 years of age</li>
                    <li>Be legally capable of entering into a binding agreement</li>
                    <li>Reside in a jurisdiction where participation is legal</li>
                    <li>Provide accurate and complete registration information</li>
                  </ul>
                  <p>
                    By participating, you represent and warrant that you meet all eligibility requirements.
                    We reserve the right to verify eligibility and disqualify any participant who does not
                    meet these requirements.
                  </p>
                </div>
              </section>

              {/* Account Registration */}
              <section className="mb-8 pb-8 border-b">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Account Registration</h2>
                <div className="space-y-4 text-gray-700">
                  <p>
                    When you purchase squares, an account will be created for you automatically using the
                    information provided during checkout. You are responsible for:
                  </p>
                  <ul className="space-y-2">
                    <li>Providing accurate, current, and complete information</li>
                    <li>Maintaining the security of your account credentials</li>
                    <li>All activity that occurs under your account</li>
                    <li>Notifying us immediately of any unauthorized access</li>
                  </ul>
                  <p>
                    We reserve the right to suspend or terminate accounts that violate these Terms or
                    engage in fraudulent activity.
                  </p>
                </div>
              </section>

              {/* Payment Terms */}
              <section className="mb-8 pb-8 border-b">
                <div className="flex items-center gap-3 mb-4">
                  <CreditCard className="w-6 h-6 text-green-600" />
                  <h2 className="text-2xl font-bold text-gray-900 m-0">4. Payment Terms</h2>
                </div>
                <div className="space-y-4 text-gray-700">
                  <p><strong>Square Price:</strong> Each square costs $50.00 USD.</p>
                  <p><strong>Payment Processing:</strong> All payments are processed securely through Stripe.
                    By making a purchase, you agree to Stripe's terms of service.</p>
                  <p><strong>Optional Fee Donation:</strong> During checkout, you may elect to cover the payment
                    processing fee (approximately 2.9% + $0.30 per transaction) as an additional charitable
                    donation to the Michael Williams Memorial Scholarship Fund.</p>
                  <p><strong>Currency:</strong> All prices are in United States Dollars (USD).</p>
                  <p><strong>Receipt:</strong> You will receive an email confirmation of your purchase including
                    the squares purchased and total amount paid.</p>
                </div>
              </section>

              {/* Refund Policy */}
              <section className="mb-8 pb-8 border-b">
                <div className="flex items-center gap-3 mb-4">
                  <RefreshCcw className="w-6 h-6 text-amber-600" />
                  <h2 className="text-2xl font-bold text-gray-900 m-0">5. Refund Policy</h2>
                </div>
                <div className="space-y-4 text-gray-700">
                  <p className="font-semibold">All sales are final. Square purchases are non-refundable.</p>
                  <p><strong>Exceptions:</strong> Refunds will only be issued in the following circumstances:</p>
                  <ul className="space-y-2">
                    <li><strong>Event Cancellation:</strong> If the Super Bowl is canceled entirely, full refunds
                      will be issued to all participants</li>
                    <li><strong>Event Postponement:</strong> If the Super Bowl is postponed more than 30 days
                      beyond the originally scheduled date, you may request a full refund</li>
                    <li><strong>Technical Error:</strong> If a verified technical error results in duplicate
                      charges or incorrect purchases, we will correct the error and issue appropriate refunds</li>
                  </ul>
                  <p>
                    To request a refund under these exceptions, contact us at{' '}
                    <a href="mailto:jasonpaulstephens@gmail.com" className="text-blue-600 hover:text-blue-700 font-semibold">
                      jasonpaulstephens@gmail.com
                    </a>{' '}
                    within 14 days of the qualifying event.
                  </p>
                </div>
              </section>

              {/* Pool Operation */}
              <section className="mb-8 pb-8 border-b">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Pool Operation</h2>
                <div className="space-y-4 text-gray-700">
                  <p>
                    The Pool operates according to the{' '}
                    <Link href="/rules" className="text-blue-600 hover:text-blue-700 font-semibold">
                      Official Contest Rules
                    </Link>, which are incorporated into these Terms by reference. Key points:
                  </p>
                  <ul className="space-y-2">
                    <li>Numbers are assigned randomly using a cryptographically secure algorithm after all
                      100 squares are sold or at game kickoff</li>
                    <li>Winners are determined by matching the last digit of each team's score at the end
                      of each quarter</li>
                    <li>Prizes are distributed according to the posted prize structure</li>
                    <li>All decisions by the Organization regarding winners and prizes are final</li>
                  </ul>
                </div>
              </section>

              {/* Intellectual Property */}
              <section className="mb-8 pb-8 border-b">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Intellectual Property</h2>
                <div className="space-y-4 text-gray-700">
                  <p>
                    The Website and its original content, features, and functionality are owned by the
                    Michael Williams Memorial Scholarship Fund and are protected by copyright, trademark,
                    and other intellectual property laws.
                  </p>
                  <p>
                    "Super Bowl" is a registered trademark of the National Football League. This Pool is
                    not sponsored, endorsed, or affiliated with the NFL or any NFL team.
                  </p>
                </div>
              </section>

              {/* User Conduct */}
              <section className="mb-8 pb-8 border-b">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">8. User Conduct</h2>
                <div className="space-y-4 text-gray-700">
                  <p>You agree not to:</p>
                  <ul className="space-y-2">
                    <li>Use the Website for any unlawful purpose</li>
                    <li>Attempt to gain unauthorized access to any part of the Website</li>
                    <li>Interfere with or disrupt the Website or its servers</li>
                    <li>Use automated systems (bots, scrapers) to access the Website</li>
                    <li>Impersonate another person or entity</li>
                    <li>Provide false or misleading information</li>
                    <li>Engage in any conduct that restricts others' use of the Website</li>
                  </ul>
                </div>
              </section>

              {/* Limitation of Liability */}
              <section className="mb-8 pb-8 border-b">
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                  <h2 className="text-2xl font-bold text-gray-900 m-0">9. Limitation of Liability</h2>
                </div>
                <div className="space-y-4 text-gray-700">
                  <p>
                    TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE ORGANIZATION, ITS DIRECTORS, OFFICERS,
                    EMPLOYEES, AND VOLUNTEERS SHALL NOT BE LIABLE FOR:
                  </p>
                  <ul className="space-y-2">
                    <li>Any indirect, incidental, special, consequential, or punitive damages</li>
                    <li>Any loss of profits, data, or goodwill</li>
                    <li>Any damages arising from your use or inability to use the Website</li>
                    <li>Any technical malfunctions, errors, or interruptions</li>
                    <li>Any unauthorized access to your account or personal information</li>
                  </ul>
                  <p>
                    OUR TOTAL LIABILITY FOR ANY CLAIM ARISING FROM YOUR USE OF THE WEBSITE OR
                    PARTICIPATION IN THE POOL SHALL NOT EXCEED THE AMOUNT YOU PAID FOR SQUARES.
                  </p>
                </div>
              </section>

              {/* Indemnification */}
              <section className="mb-8 pb-8 border-b">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Indemnification</h2>
                <p className="text-gray-700">
                  You agree to indemnify, defend, and hold harmless the Organization and its directors,
                  officers, employees, and volunteers from any claims, damages, losses, liabilities, and
                  expenses (including reasonable attorneys' fees) arising from your use of the Website,
                  violation of these Terms, or infringement of any third-party rights.
                </p>
              </section>

              {/* Dispute Resolution */}
              <section className="mb-8 pb-8 border-b">
                <div className="flex items-center gap-3 mb-4">
                  <Scale className="w-6 h-6 text-indigo-600" />
                  <h2 className="text-2xl font-bold text-gray-900 m-0">11. Dispute Resolution</h2>
                </div>
                <div className="space-y-4 text-gray-700">
                  <p>
                    <strong>Informal Resolution:</strong> Before filing any legal claim, you agree to contact
                    us at{' '}
                    <a href="mailto:jasonpaulstephens@gmail.com" className="text-blue-600 hover:text-blue-700 font-semibold">
                      jasonpaulstephens@gmail.com
                    </a>{' '}
                    and attempt to resolve the dispute informally for at least 30 days.
                  </p>
                  <p>
                    <strong>Governing Law:</strong> These Terms shall be governed by and construed in accordance
                    with the laws of the State of New Jersey, without regard to its conflict of law provisions.
                  </p>
                  <p>
                    <strong>Jurisdiction:</strong> Any legal action arising from these Terms or your use of the
                    Website must be brought exclusively in the state or federal courts located in Monmouth County,
                    New Jersey, and you consent to the personal jurisdiction of such courts.
                  </p>
                </div>
              </section>

              {/* Severability */}
              <section className="mb-8 pb-8 border-b">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Severability</h2>
                <p className="text-gray-700">
                  If any provision of these Terms is found to be unenforceable or invalid, that provision
                  shall be limited or eliminated to the minimum extent necessary, and the remaining provisions
                  shall remain in full force and effect.
                </p>
              </section>

              {/* Entire Agreement */}
              <section className="mb-8 pb-8 border-b">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Entire Agreement</h2>
                <p className="text-gray-700">
                  These Terms, together with our{' '}
                  <Link href="/privacy" className="text-blue-600 hover:text-blue-700 font-semibold">Privacy Policy</Link>{' '}
                  and{' '}
                  <Link href="/rules" className="text-blue-600 hover:text-blue-700 font-semibold">Official Contest Rules</Link>,
                  constitute the entire agreement between you and the Organization regarding the use of the
                  Website and participation in the Pool, superseding any prior agreements.
                </p>
              </section>

              {/* Contact */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <Mail className="w-6 h-6 text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-900 m-0">14. Contact Information</h2>
                </div>
                <p className="text-gray-700 mb-4">
                  If you have questions about these Terms of Service, please contact us:
                </p>
                <div className="p-4 bg-gray-50 rounded-lg text-gray-700">
                  <p><strong>Michael Williams Memorial Scholarship Fund</strong></p>
                  <p>EIN: 88-0683423</p>
                  <p className="mt-2">1973 Route 34, Ste 201</p>
                  <p>Wall Township, NJ 07719</p>
                  <p className="mt-2">
                    Email:{' '}
                    <a href="mailto:jasonpaulstephens@gmail.com" className="text-blue-600 hover:text-blue-700 font-semibold">
                      jasonpaulstephens@gmail.com
                    </a>
                  </p>
                  <p className="mt-2">
                    Website:{' '}
                    <a
                      href="https://michaelwilliamsscholarship.com/about-us/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 font-semibold"
                    >
                      michaelwilliamsscholarship.com
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
