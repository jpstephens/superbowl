'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { LayoutDashboard, Share2, Target, Grid3x3, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
    } catch (error) {
      console.error('Error checking auth:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Super Bowl Pool - Michael Williams Memorial Scholarship',
          text: 'Join our Super Bowl pool and support the scholarship fund!',
          url: window.location.href,
        });
      } catch (err) {}
    } else {
      await navigator.clipboard.writeText(window.location.href);
      alert('Link copied!');
    }
  };

  const navItems = [
    { href: '/grid', label: 'Grid', icon: Grid3x3 },
    { href: '/props', label: 'Props', icon: Target },
    { href: '/pool', label: 'Pool', icon: LayoutDashboard },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#1a1f33] bg-[#232842] shadow-lg">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex h-24 items-center justify-between">
          {/* Logo & Title */}
          <Link href="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
            <div className="w-20 h-20 rounded-full bg-white p-1.5 shadow-md">
              <Image src="/logo.png" alt="Michael Williams Memorial Scholarship" width={72} height={72} className="rounded-full" />
            </div>
            <div className="hidden md:block">
              <h1 className="text-lg font-bold text-white leading-tight">
                Super Bowl Pool
              </h1>
              <p className="text-sm text-[#d4af37] font-semibold">Michael Williams Scholarship</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden sm:flex items-center gap-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    size="default"
                    className={cn(
                      'gap-2 text-base font-semibold transition-colors px-5 py-2.5',
                      isActive
                        ? 'text-[#d4af37] bg-[#d4af37]/20'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="default"
              onClick={handleShare}
              className="gap-2 text-gray-300 hover:text-[#d4af37] text-base font-semibold hidden sm:flex hover:bg-white/10"
            >
              <Share2 className="h-5 w-5" />
              <span>Share</span>
            </Button>

            <Link href="/grid">
              <Button
                variant="default"
                size="default"
                className="gap-2 bg-[#d4af37] hover:bg-[#e5c65c] text-[#232842] border-0 text-base font-bold px-6 py-2.5 shadow-md"
              >
                Play Now
              </Button>
            </Link>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="default"
              className="sm:hidden p-2 text-white hover:bg-white/10"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="sm:hidden py-4 border-t border-white/10">
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg text-base font-semibold transition-colors',
                      isActive
                        ? 'text-[#d4af37] bg-[#d4af37]/20'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
              <button
                onClick={() => {
                  handleShare();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Share2 className="h-5 w-5" />
                Share
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
