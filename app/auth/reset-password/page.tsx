'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Mail, ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react';
import Logo from '@/components/Logo';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;
      setSuccess(true);
    } catch (error: any) {
      setError(error.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex flex-col">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex h-16 items-center">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <Logo size="small" />
              <div>
                <h1 className="text-sm font-bold text-gray-900 leading-tight">
                  Michael Williams Memorial
                </h1>
                <p className="text-xs text-gray-600">Scholarship Fund</p>
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md">
          {/* Back Button */}
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-[15px] font-medium text-[#232842] bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>

          <Card className="p-6 sm:p-8 shadow-lg">
            {!success ? (
              <>
                {/* Icon & Title */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 mb-4">
                    <KeyRound className="w-8 h-8 text-blue-600" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                    Reset Password
                  </h2>
                  <p className="text-gray-600">
                    Enter your email and we'll send you a reset link
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="pl-10 h-12"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 text-base font-semibold"
                  >
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </Button>
                </form>
              </>
            ) : (
              <>
                {/* Success State */}
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Check Your Email
                  </h2>
                  <p className="text-gray-600 mb-6">
                    We've sent a password reset link to <strong>{email}</strong>
                  </p>
                  <p className="text-sm text-gray-500 mb-6">
                    Didn't receive it? Check your spam folder or try again in a few minutes.
                  </p>
                  <Button
                    onClick={() => setSuccess(false)}
                    variant="outline"
                    className="w-full"
                  >
                    Send Again
                  </Button>
                </div>
              </>
            )}
          </Card>

          {/* Additional Help */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Need help?{' '}
              <Link
                href="mailto:support@example.com"
                className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                Contact support
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
