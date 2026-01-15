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
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex h-20 items-center justify-between">
          {/* Logo & Title */}
          <Link href="/" className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-white p-0.5 shadow-lg flex-shrink-0">
              <Image
                src="/logo.png"
                alt="Michael Williams Memorial Scholarship"
                width={52}
                height={52}
                className="rounded-full"
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-white leading-tight">
                Super Bowl Pool
              </h1>
              <p className="text-sm text-[#cda33b] font-medium">
                Michael Williams Memorial Scholarship
              </p>
            </div>
          </Link>

          {/* Auth */}
          <div className="flex items-center gap-2">
            {!loading && (
              <>
                {user ? (
                  <>
                    <Link
                      href="/dashboard"
                      className="hidden sm:flex items-center gap-2 px-4 py-3 min-h-[44px] rounded-full text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all"
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-2 px-4 py-3 min-h-[44px] rounded-full text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all"
                    >
                      <UserIcon className="w-5 h-5" />
                      <span className="hidden sm:inline">Sign Out</span>
                      <LogOut className="w-5 h-5 sm:hidden" />
                    </button>
                  </>
                ) : (
                  <Link
                    href="/auth/login"
                    className="flex items-center gap-2 px-4 py-3 min-h-[44px] rounded-full text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <LogIn className="w-5 h-5" />
                    <span className="hidden sm:inline">Sign In</span>
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
