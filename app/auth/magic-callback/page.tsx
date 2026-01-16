'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

/**
 * Auth Callback Page
 *
 * This page handles Supabase magic link tokens from the URL hash fragment.
 * When Supabase sends a magic link, the tokens are in the hash (#access_token=...).
 * This page extracts them, establishes the session, and redirects to the dashboard.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const supabase = createClient();

        // The hash fragment contains the tokens from Supabase magic link
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        console.log('Auth callback - type:', type, 'has access token:', !!accessToken);

        if (accessToken && refreshToken) {
          // Set the session using the tokens from the hash
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            console.error('Session error:', sessionError);
            setError('Failed to authenticate. Please try again.');
            return;
          }

          console.log('Session established for:', data.user?.email);

          // Redirect to dashboard with welcome param
          router.replace('/dashboard?welcome=true');
        } else {
          // No tokens in hash - check if there's an existing session
          const { data: { session } } = await supabase.auth.getSession();

          if (session) {
            router.replace('/dashboard');
          } else {
            // No session and no tokens - redirect to login
            router.replace('/auth/login');
          }
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        setError('An error occurred during authentication.');
      }
    };

    handleCallback();
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Authentication Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/auth/login')}
            className="px-6 py-3 bg-[#cda33b] text-white rounded-lg font-semibold hover:bg-[#b8922f] transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-[#cda33b] animate-spin mx-auto mb-4" />
        <p className="text-gray-600 font-medium">Signing you in...</p>
      </div>
    </div>
  );
}
