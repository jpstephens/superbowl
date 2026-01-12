'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { LogIn, LogOut, User as UserIcon } from 'lucide-react';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const isPropsPage = pathname === '/props';
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
              <p className="text-sm text-[#d4af37] font-medium">
                Michael Williams Memorial Scholarship
              </p>
            </div>
          </Link>

          {/* Navigation & Auth */}
          <div className="flex items-center gap-3">
            {/* Nav Buttons - Hidden on mobile */}
            <div className="hidden sm:flex items-center gap-2">
              <Link
                href="/"
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-bold transition-all",
                  isPropsPage
                    ? "bg-white/10 text-white hover:bg-white/20"
                    : "bg-[#d4af37] text-[#232842] hover:bg-[#e5c65c]"
                )}
              >
                Super Bowl Pool
              </Link>
              <Link
                href="/props"
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-bold transition-all",
                  isPropsPage
                    ? "bg-[#d4af37] text-[#232842] hover:bg-[#e5c65c]"
                    : "bg-white/10 text-white hover:bg-white/20"
                )}
              >
                Prop Bets
              </Link>
            </div>

            {/* Divider */}
            <div className="hidden sm:block w-px h-8 bg-white/20" />

            {/* Auth Button */}
            {!loading && (
              <>
                {user ? (
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <UserIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">Sign Out</span>
                    <LogOut className="w-4 h-4 sm:hidden" />
                  </button>
                ) : (
                  <Link
                    href="/auth/login"
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <LogIn className="w-4 h-4" />
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
