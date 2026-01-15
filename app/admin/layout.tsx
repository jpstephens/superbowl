'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Grid3x3,
  CreditCard,
  Settings,
  LogOut,
  ExternalLink,
  Menu,
  X,
} from 'lucide-react';

// Pages that don't need the admin layout (login, verify)
const PUBLIC_PATHS = ['/admin/login', '/admin/verify'];

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Skip auth for public paths
  const isPublicPath = PUBLIC_PATHS.includes(pathname);

  useEffect(() => {
    if (!isPublicPath) {
      checkAuth();
    } else {
      setLoading(false);
    }
  }, [pathname]);

  const checkAuth = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/admin/login');
        return;
      }

      // Check is_admin in profiles table
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('email', user.email)
        .single();

      if (!profile?.is_admin) {
        await supabase.auth.signOut();
        router.push('/admin/login');
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error('Auth check error:', error);
      router.push('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  // For public paths, render children directly
  if (isPublicPath) {
    return <>{children}</>;
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#232842] flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-[#cda33b] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not admin - will redirect
  if (!isAdmin) {
    return null;
  }

  const navItems = [
    { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/admin/squares', icon: Grid3x3, label: 'Squares' },
    { href: '/admin/payments', icon: CreditCard, label: 'Payments' },
    { href: '/admin/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-[#232842]">
      {/* Mobile Header */}
      <header className="lg:hidden border-b border-white/10 bg-[#1a1f35] sticky top-0 z-50">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Logo size="small" />
            <span className="text-white font-semibold text-sm">Admin</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-white"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`
            fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-[#1a1f35] border-r border-white/10
            transform transition-transform duration-200 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:translate-x-0
          `}
        >
          {/* Logo - Desktop */}
          <div className="hidden lg:flex h-16 items-center gap-3 px-6 border-b border-white/10">
            <Logo size="small" />
            <div>
              <p className="text-white font-semibold text-sm">Admin Panel</p>
              <p className="text-white/50 text-xs">Super Bowl Pool</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-1 mt-14 lg:mt-0">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                    ${isActive
                      ? 'bg-[#cda33b] text-white'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                    }
                  `}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Bottom Section */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-3 px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-all"
            >
              <ExternalLink className="w-5 h-5" />
              <span className="font-medium">View Site</span>
            </Link>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 text-white/70 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-h-screen lg:min-h-[calc(100vh)]">
          {children}
        </main>
      </div>
    </div>
  );
}
