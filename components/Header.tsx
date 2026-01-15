'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { LogIn, LogOut, User as UserIcon, Menu, X, Grid3x3, LayoutDashboard, Grid2X2, FileText, ExternalLink } from 'lucide-react';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

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

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-[#232842]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex h-16 sm:h-[80px] items-center justify-between">
          {/* Logo & Title */}
          <Link href="/" className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white p-0.5 shadow-lg flex-shrink-0">
              <Image
                src="/logo.png"
                alt="Michael Williams Memorial Scholarship"
                width={56}
                height={56}
                className="rounded-full"
              />
            </div>
            <div className="flex flex-col justify-center">
              <h1 className="text-[18px] sm:text-[20px] font-bold text-white leading-tight tracking-tight">
                Super Bowl Pool
              </h1>
              <p className="text-[13px] sm:text-[14px] text-[#cda33b] font-semibold tracking-wide">
                Michael Williams Scholarship
              </p>
            </div>
          </Link>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="sm:hidden flex items-center justify-center w-11 h-11 rounded-lg text-white hover:bg-white/10 transition-colors"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Desktop Auth */}
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

      {/* Mobile Menu Dropdown */}
      {menuOpen && (
        <div className="sm:hidden bg-[#1a1f35] border-t border-white/10">
          <nav className="px-4 py-3 space-y-1">
            <Link
              href="/"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-[15px] font-medium transition-colors ${pathname === '/' ? 'bg-[#cda33b] text-white' : 'text-white/80 hover:bg-white/10'}`}
            >
              <Grid3x3 className="w-5 h-5" />
              Pool Grid
            </Link>
            {user && (
              <>
                <Link
                  href="/dashboard"
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-[15px] font-medium transition-colors ${pathname === '/dashboard' ? 'bg-[#cda33b] text-white' : 'text-white/80 hover:bg-white/10'}`}
                >
                  <LayoutDashboard className="w-5 h-5" />
                  Dashboard
                </Link>
                <Link
                  href="/my-squares"
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-[15px] font-medium transition-colors ${pathname === '/my-squares' ? 'bg-[#cda33b] text-white' : 'text-white/80 hover:bg-white/10'}`}
                >
                  <Grid2X2 className="w-5 h-5" />
                  My Squares
                </Link>
              </>
            )}
            <div className="border-t border-white/10 my-2" />
            <Link
              href="/disclaimer"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-[15px] font-medium text-white/60 hover:bg-white/10 transition-colors"
            >
              <FileText className="w-5 h-5" />
              Terms & Rules
            </Link>
            <Link
              href="https://michaelwilliamsscholarship.com"
              target="_blank"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-[15px] font-medium text-white/60 hover:bg-white/10 transition-colors"
            >
              <ExternalLink className="w-5 h-5" />
              Main Website
            </Link>
            <div className="border-t border-white/10 my-2" />
            {!loading && (
              <>
                {user ? (
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-[15px] font-medium text-white/80 hover:bg-white/10 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                  </button>
                ) : (
                  <Link
                    href="/auth/login"
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-[15px] font-semibold bg-[#cda33b] text-white"
                  >
                    <LogIn className="w-5 h-5" />
                    Sign In
                  </Link>
                )}
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
