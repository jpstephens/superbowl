'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Shield, Mail, Lock, ArrowLeft } from 'lucide-react';
import Logo from '@/components/Logo';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      
      // Sign in
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      // Verify admin status
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('email', email)
        .single();

      if (!profile?.is_admin) {
        await supabase.auth.signOut();
        setError('Access denied. Admin privileges required.');
        setLoading(false);
        return;
      }

      router.push('/admin/dashboard');
      router.refresh();
    } catch (error: any) {
      setError(error.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/admin/verify`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      setError(error.message || 'Failed to sign in with Google');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-900/80 backdrop-blur">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex h-16 items-center">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <Logo size="small" />
              <div>
                <h1 className="text-sm font-bold text-white leading-tight">
                  Michael Williams Memorial
                </h1>
                <p className="text-xs text-gray-400">Scholarship Fund</p>
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
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-[15px] font-medium text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>

          <Card className="p-6 sm:p-8 bg-gray-800 border-gray-700 shadow-2xl">
            {/* Icon & Title */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-900/50 mb-4 border-2 border-red-700">
                <Shield className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                Admin Access
              </h2>
              <p className="text-gray-400">
                Restricted area - administrators only
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg">
                <p className="text-sm text-red-200">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                  style={{ paddingLeft: '3rem' }}
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                  style={{ paddingLeft: '3rem' }}
                />
              </div>

              <Button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full h-12 text-base font-semibold bg-red-600 hover:bg-red-700"
              >
                {loading ? 'Verifying...' : 'Access Admin Panel'}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-gray-800 text-gray-400">or continue with</span>
              </div>
            </div>

            {/* Google Sign In */}
            <Button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading || googleLoading}
              variant="outline"
              className="w-full h-12 text-base font-medium bg-white hover:bg-gray-100 text-gray-900 border-gray-300"
            >
              {googleLoading ? (
                'Redirecting...'
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Sign in with Google
                </>
              )}
            </Button>

            {/* Warning */}
            <div className="mt-6 p-4 bg-gray-900 rounded-lg border border-gray-700">
              <p className="text-xs text-gray-400 text-center">
                <Shield className="w-4 h-4 inline mr-1" />
                This area is monitored. Unauthorized access attempts are logged.
              </p>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
