'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Shield, Database, Mail, Phone, CreditCard, Lock } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function PrivacyPolicyPage() {
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
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 mb-4">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Privacy Policy
              </h1>
              <p className="text-gray-600">
                Last updated: {lastUpdated}
              </p>
            </div>

            {/* Content */}
            <div className="prose prose-gray max-w-none">
              {/* Introduction */}
              <section className="mb-8 pb-8 border-b">
                <p className="text-gray-700 leading-relaxed">
                  The Michael Williams Memorial Scholarship Fund ("we," "us," or "our") operates the Super Bowl Pool
                  website at superbowlpool.com. This Privacy Policy describes how we collect, use, and protect your
                  personal information when you participate in our charitable Super Bowl squares pool.
                </p>
                <p className="text-gray-700 leading-relaxed mt-4">
                  <strong>EIN:</strong> 88-0683423<br />
                  <strong>Address:</strong> 1973 Route 34, Ste 201, Wall Township, NJ 07719
                </p>
              </section>

              {/* Information We Collect */}
              <section className="mb-8 pb-8 border-b">
                <div className="flex items-center gap-3 mb-4">
                  <Database className="w-6 h-6 text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-900 m-0">Information We Collect</h2>
                </div>

                <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">Information You Provide</h3>
                <ul className="space-y-2 text-gray-700">
                  <li><strong>Account Information:</strong> Name, email address, and password when you create an account</li>
                  <li><strong>Contact Information:</strong> Phone number (optional, collected during checkout for game updates)</li>
                  <li><strong>Display Name:</strong> Optional custom name to display on your squares</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">Payment Information</h3>
                <ul className="space-y-2 text-gray-700">
                  <li><strong>Billing Details:</strong> Name and billing address collected by our payment processor, Stripe</li>
                  <li><strong>Payment Card:</strong> Credit/debit card information is collected and processed securely by Stripe—we never see or store your full card number</li>
                  <li><strong>Transaction Records:</strong> We store the amount paid, date, and a reference ID for your purchase</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">Automatically Collected</h3>
                <ul className="space-y-2 text-gray-700">
                  <li><strong>Session Data:</strong> We use cookies to keep you logged in and remember your preferences</li>
                  <li><strong>Device Information:</strong> Basic browser type for website functionality</li>
                </ul>
              </section>

              {/* How We Use Your Information */}
              <section className="mb-8 pb-8 border-b">
                <div className="flex items-center gap-3 mb-4">
                  <Mail className="w-6 h-6 text-green-600" />
                  <h2 className="text-2xl font-bold text-gray-900 m-0">How We Use Your Information</h2>
                </div>
                <div className="space-y-4 text-gray-700">
                  <p>We use the information we collect to:</p>
                  <ul className="space-y-2">
                    <li><strong>Process Purchases:</strong> Complete your square purchases and send confirmation emails</li>
                    <li><strong>Provide Updates:</strong> Send you game-day notifications, including your assigned numbers and quarter results</li>
                    <li><strong>Notify Winners:</strong> Contact you by email if you win a quarter prize</li>
                    <li><strong>SMS Notifications:</strong> If you provide a phone number, send text message updates about your squares and game results</li>
                    <li><strong>Customer Support:</strong> Respond to your questions and resolve any issues</li>
                    <li><strong>Legal Compliance:</strong> Issue 1099 tax forms for prizes over $600 as required by law</li>
                  </ul>
                </div>
              </section>

              {/* Information Sharing */}
              <section className="mb-8 pb-8 border-b">
                <div className="flex items-center gap-3 mb-4">
                  <CreditCard className="w-6 h-6 text-purple-600" />
                  <h2 className="text-2xl font-bold text-gray-900 m-0">Information Sharing</h2>
                </div>
                <div className="space-y-4 text-gray-700">
                  <p><strong>We do not sell your personal information.</strong> We share data only with these service providers:</p>
                  <ul className="space-y-3">
                    <li>
                      <strong>Stripe</strong> (Payment Processing)<br />
                      <span className="text-gray-600">Processes your payments securely. Stripe's privacy policy: stripe.com/privacy</span>
                    </li>
                    <li>
                      <strong>Resend</strong> (Email Service)<br />
                      <span className="text-gray-600">Sends transaction confirmations and game notifications to your email</span>
                    </li>
                    <li>
                      <strong>Twilio</strong> (SMS Service)<br />
                      <span className="text-gray-600">Sends text message updates if you provide a phone number</span>
                    </li>
                    <li>
                      <strong>Supabase</strong> (Database Hosting)<br />
                      <span className="text-gray-600">Securely stores your account and transaction data</span>
                    </li>
                  </ul>
                  <p className="mt-4">
                    We may also disclose information when required by law or to protect our rights and the safety of participants.
                  </p>
                </div>
              </section>

              {/* Data Security */}
              <section className="mb-8 pb-8 border-b">
                <div className="flex items-center gap-3 mb-4">
                  <Lock className="w-6 h-6 text-amber-600" />
                  <h2 className="text-2xl font-bold text-gray-900 m-0">Data Security</h2>
                </div>
                <div className="space-y-4 text-gray-700">
                  <p>We implement security measures to protect your information:</p>
                  <ul className="space-y-2">
                    <li><strong>Encrypted Connections:</strong> All data transmitted via HTTPS/TLS encryption</li>
                    <li><strong>Password Security:</strong> Passwords are hashed and never stored in plain text</li>
                    <li><strong>Access Controls:</strong> Row-level security ensures you can only access your own data</li>
                    <li><strong>PCI Compliance:</strong> Stripe handles all payment card data in compliance with PCI-DSS standards</li>
                  </ul>
                </div>
              </section>

              {/* Cookies */}
              <section className="mb-8 pb-8 border-b">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Cookies & Session Data</h2>
                <div className="space-y-4 text-gray-700">
                  <p>
                    We use essential cookies to keep you logged in and maintain your session. We do not use
                    third-party tracking cookies, advertising cookies, or analytics services like Google Analytics.
                  </p>
                  <p>
                    Temporary session storage is used during checkout to remember your selected squares. This
                    data is cleared after your purchase is complete.
                  </p>
                </div>
              </section>

              {/* Your Rights */}
              <section className="mb-8 pb-8 border-b">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Rights</h2>
                <div className="space-y-4 text-gray-700">
                  <p>You have the right to:</p>
                  <ul className="space-y-2">
                    <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
                    <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                    <li><strong>Deletion:</strong> Request deletion of your personal data (subject to legal retention requirements)</li>
                    <li><strong>Opt-Out:</strong> Unsubscribe from promotional emails at any time</li>
                  </ul>
                  <p className="mt-4">
                    To exercise these rights, contact us at{' '}
                    <a href="mailto:jasonpaulstephens@gmail.com" className="text-blue-600 hover:text-blue-700 font-semibold">
                      jasonpaulstephens@gmail.com
                    </a>
                  </p>
                </div>
              </section>

              {/* Children's Privacy */}
              <section className="mb-8 pb-8 border-b">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Children's Privacy</h2>
                <p className="text-gray-700">
                  This website is intended for users 18 years and older. We do not knowingly collect personal
                  information from children under 18. If you believe a child has provided us with personal
                  information, please contact us immediately.
                </p>
              </section>

              {/* Data Retention */}
              <section className="mb-8 pb-8 border-b">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Retention</h2>
                <p className="text-gray-700">
                  We retain your personal information for as long as necessary to fulfill the purposes described
                  in this policy, including maintaining records for tax and legal compliance. Transaction records
                  are retained for a minimum of 7 years as required for tax purposes.
                </p>
              </section>

              {/* Changes to Policy */}
              <section className="mb-8 pb-8 border-b">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to This Policy</h2>
                <p className="text-gray-700">
                  We may update this Privacy Policy periodically. We will notify you of any material changes
                  by posting the new policy on this page and updating the "Last updated" date. Your continued
                  use of the website after changes constitutes acceptance of the updated policy.
                </p>
              </section>

              {/* Contact */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <Phone className="w-6 h-6 text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-900 m-0">Contact Us</h2>
                </div>
                <p className="text-gray-700">
                  If you have questions about this Privacy Policy or our data practices, contact us at:
                </p>
                <div className="mt-4 p-4 bg-gray-50 rounded-lg text-gray-700">
                  <p><strong>Michael Williams Memorial Scholarship Fund</strong></p>
                  <p>1973 Route 34, Ste 201</p>
                  <p>Wall Township, NJ 07719</p>
                  <p className="mt-2">
                    Email:{' '}
                    <a href="mailto:jasonpaulstephens@gmail.com" className="text-blue-600 hover:text-blue-700 font-semibold">
                      jasonpaulstephens@gmail.com
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
