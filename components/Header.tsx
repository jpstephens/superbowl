'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { LogIn, LogOut, User as UserIcon } from 'lucide-react';

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-[#232842]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex h-16 sm:h-[80px] items-center justify-between">
          {/* Logo & Title */}
          <Link href="/" className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white p-0.5 sm:p-1 shadow-lg flex-shrink-0">
              <Image
                src="/logo.png"
                alt="Michael Williams Memorial Scholarship"
                width={60}
                height={60}
                className="rounded-full"
              />
            </div>
            <div>
              <h1 className="text-[17px] sm:text-[22px] font-bold text-white leading-tight">
                Super Bowl Pool
              </h1>
              <p className="text-[12px] sm:text-[14px] text-[#cda33b] font-medium">
                Michael Williams Scholarship
              </p>
            </div>
          </Link>

          {/* Auth - Hidden on mobile, shown in bottom nav */}
          <div className="hidden sm:flex items-center gap-2">
            {!loading && (
              <>
                {user ? (
                  <>
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl text-[15px] font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all"
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl text-[15px] font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all"
                    >
                      <UserIcon className="w-5 h-5" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <Link
                    href="/auth/login"
                    className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-[#cda33b] text-[15px] font-semibold text-white hover:bg-[#b8960c] transition-all"
                  >
                    <LogIn className="w-5 h-5" />
                    Sign In
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
