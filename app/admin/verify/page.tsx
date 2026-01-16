'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Logo from '@/components/Logo';

export default function AdminVerifyPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    verifyAdmin();
  }, []);

  const verifyAdmin = async () => {
    try {
      const supabase = createClient();

      // Handle OAuth callback - check for code in URL (PKCE flow)
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');

      if (code) {
        // Exchange code for session
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          console.error('Code exchange error:', exchangeError);
        }
      }

      // Also check for tokens in URL hash (legacy flow)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      if (accessToken && refreshToken) {
        // Set the session from URL tokens
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
      }

      // Small delay to ensure session is set
      await new Promise(resolve => setTimeout(resolve, 100));

      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        setError('Authentication failed. Please try again.');
        setStatus('error');
        return;
      }

      // Check admin status
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('email', user.email)
        .single();

      if (profileError) {
        // Profile might not exist yet - create it
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          });

        if (insertError && !insertError.message.includes('duplicate')) {
          console.error('Error creating profile:', insertError);
        }

        // User is not admin
        await supabase.auth.signOut();
        setError('Access denied. Your account does not have admin privileges.');
        setStatus('error');
        return;
      }

      if (!profile?.is_admin) {
        await supabase.auth.signOut();
        setError('Access denied. Your account does not have admin privileges.');
        setStatus('error');
        return;
      }

      // User is verified admin
      setStatus('success');
      router.push('/admin/dashboard');
      router.refresh();
    } catch (err: any) {
      console.error('Verification error:', err);
      setError(err.message || 'An error occurred during verification.');
      setStatus('error');
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
        <Card className="w-full max-w-md p-8 bg-gray-800 border-gray-700 shadow-2xl">
          {status === 'loading' && (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-900/50 mb-4 border-2 border-blue-700">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">
                Verifying Admin Access
              </h2>
              <p className="text-gray-400">
                Please wait while we verify your credentials...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-900/50 mb-4 border-2 border-red-700">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">
                Access Denied
              </h2>
              <p className="text-gray-400 mb-6">
                {error}
              </p>
              <div className="space-y-3">
                <Button
                  onClick={() => router.push('/admin/login')}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  Try Again
                </Button>
                <Button
                  onClick={() => router.push('/')}
                  variant="outline"
                  className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Return Home
                </Button>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-900/50 mb-4 border-2 border-green-700">
                <Shield className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">
                Access Granted
              </h2>
              <p className="text-gray-400">
                Redirecting to admin dashboard...
              </p>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
