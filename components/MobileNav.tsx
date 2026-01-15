'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Grid3x3, LayoutDashboard, Grid2X2, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  requiresAuth?: boolean;
}

const navItems: NavItem[] = [
  { href: '/', label: 'Pool', icon: Grid3x3 },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, requiresAuth: true },
  { href: '/my-squares', label: 'My Squares', icon: Grid2X2, requiresAuth: true },
];

export default function MobileNav() {
  const pathname = usePathname();
  const [user, setUser] = useState<SupabaseUser | null>(null);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Don't show on admin pages
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  // Filter items based on auth state
  const visibleItems = navItems.filter(item => !item.requiresAuth || user);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-gray-200 lg:hidden pb-safe">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname?.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 min-w-[64px] min-h-[44px] py-2 px-3 rounded-lg transition-colors',
                isActive
                  ? 'text-[#cda33b]'
                  : 'text-gray-500 hover:text-[#232842]'
              )}
            >
              <Icon className={cn('w-6 h-6', isActive && 'text-[#cda33b]')} />
              <span className={cn('text-[11px] font-medium tracking-[0.01em]', isActive && 'font-semibold')}>
                {item.label}
              </span>
            </Link>
          );
        })}
        {/* Show sign in if not logged in */}
        {!user && (
          <Link
            href="/auth/login"
            className={cn(
              'flex flex-col items-center justify-center gap-1 min-w-[64px] min-h-[44px] py-2 px-3 rounded-lg transition-colors',
              pathname === '/auth/login'
                ? 'text-[#cda33b]'
                : 'text-gray-500 hover:text-[#232842]'
            )}
          >
            <User className="w-6 h-6" />
            <span className="text-[11px] font-medium tracking-[0.01em]">Sign In</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
