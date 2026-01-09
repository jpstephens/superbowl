'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  LayoutDashboard, Share2, Target, Grid3x3, Menu, X,
  LogIn, LogOut, User, Ticket, Trophy, Radio
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [tournamentLaunched, setTournamentLaunched] = useState(false);
  const [isGameLive, setIsGameLive] = useState(false);
  const [availableSquares, setAvailableSquares] = useState(100);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    loadState();

    // Set up realtime subscription for state changes
    const supabase = createClient();
    const channel = supabase
      .channel('header_state')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'settings' },
        () => loadState()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'game_state' },
        () => loadState()
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'grid_squares' },
        () => loadState()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadState = async () => {
    try {
      const supabase = createClient();

      // Check auth
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', user.id)
          .single();
        setUserName(profile?.name || user.email?.split('@')[0] || null);
      }

      // Check tournament state
      const { data: settings } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', ['tournament_launched']);

      const settingsMap: Record<string, string> = {};
      settings?.forEach(s => { settingsMap[s.key] = s.value; });
      setTournamentLaunched(settingsMap['tournament_launched'] === 'true');

      // Check game state
      const { data: gameState } = await supabase
        .from('game_state')
        .select('is_live')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
      setIsGameLive(gameState?.is_live || false);

      // Get available squares count
      const { data: squares } = await supabase
        .from('grid_squares')
        .select('status');
      const available = squares?.filter(s => s.status === 'available').length || 0;
      setAvailableSquares(available);

    } catch (error) {
      console.error('Error loading header state:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setUserName(null);
    router.push('/');
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

  // Build nav items based on state
  const getNavItems = () => {
    const items = [
      { href: '/grid', label: 'Grid', icon: Grid3x3 },
      { href: '/props', label: 'Props', icon: Target },
    ];

    if (isLoggedIn) {
      items.push({ href: '/my-squares', label: 'My Squares', icon: Ticket });
      items.push({ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard });
    }

    // Add Watch/Live link when tournament is launched
    if (tournamentLaunched) {
      items.push({ href: '/pool', label: isGameLive ? 'Live' : 'Pool', icon: isGameLive ? Radio : Trophy });
    }

    return items;
  };

  // Get CTA button config based on state
  const getCTA = () => {
    if (tournamentLaunched) {
      if (isGameLive) {
        return { href: '/pool', label: 'Watch Live', variant: 'live' as const };
      }
      return { href: '/grid', label: 'View Grid', variant: 'default' as const };
    }
    // Pre-launch: sales mode
    if (availableSquares > 0) {
      return { href: '/grid', label: 'Pick Squares', variant: 'default' as const };
    }
    return { href: '/grid', label: 'Grid Full', variant: 'disabled' as const };
  };

  const navItems = getNavItems();
  const cta = getCTA();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#1a1f33] bg-[#232842] shadow-lg">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex h-20 items-center justify-between">
          {/* Logo & Title */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-14 h-14 rounded-full bg-white p-1 shadow-md">
              <Image src="/logo.png" alt="Michael Williams Memorial Scholarship" width={52} height={52} className="rounded-full" />
            </div>
            <div className="hidden md:block">
              <h1 className="text-base font-bold text-white leading-tight">
                Super Bowl Pool
              </h1>
              <p className="text-xs text-[#d4af37] font-semibold">Michael Williams Scholarship</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'gap-2 text-sm font-semibold transition-colors px-3 py-2',
                      isActive
                        ? 'text-[#d4af37] bg-[#d4af37]/20'
                        : 'text-gray-300 hover:text-white hover:bg-white/10',
                      item.label === 'Live' && 'text-red-400 hover:text-red-300'
                    )}
                  >
                    <Icon className={cn('h-4 w-4', item.label === 'Live' && 'animate-pulse')} />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Share button - desktop only */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="gap-2 text-gray-300 hover:text-[#d4af37] text-sm font-semibold hidden lg:flex hover:bg-white/10"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>

            {/* Auth buttons */}
            {!loading && (
              <>
                {isLoggedIn ? (
                  <div className="hidden sm:flex items-center gap-2">
                    {userName && (
                      <span className="text-sm text-gray-400 hidden lg:inline">
                        Hi, {userName.split(' ')[0]}
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSignOut}
                      className="gap-2 text-gray-300 hover:text-white hover:bg-white/10 text-sm"
                    >
                      <LogOut className="h-4 w-4" />
                      <span className="hidden lg:inline">Sign Out</span>
                    </Button>
                  </div>
                ) : (
                  <div className="hidden sm:flex items-center gap-2">
                    <Link href="/auth/login">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2 text-gray-300 hover:text-white hover:bg-white/10 text-sm"
                      >
                        <LogIn className="h-4 w-4" />
                        Log In
                      </Button>
                    </Link>
                  </div>
                )}
              </>
            )}

            {/* Main CTA */}
            <Link href={cta.href}>
              <Button
                variant="default"
                size="sm"
                disabled={cta.variant === 'disabled'}
                className={cn(
                  'gap-2 border-0 text-sm font-bold px-4 py-2 shadow-md',
                  cta.variant === 'live'
                    ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                    : 'bg-[#d4af37] hover:bg-[#e5c65c] text-[#232842]',
                  cta.variant === 'disabled' && 'opacity-50 cursor-not-allowed'
                )}
              >
                {cta.variant === 'live' && <Radio className="h-4 w-4" />}
                {cta.label}
                {!tournamentLaunched && availableSquares > 0 && availableSquares <= 20 && (
                  <span className="ml-1 text-xs opacity-80">({availableSquares})</span>
                )}
              </Button>
            </Link>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden p-2 text-white hover:bg-white/10"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/10">
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-colors',
                      isActive
                        ? 'text-[#d4af37] bg-[#d4af37]/20'
                        : 'text-gray-300 hover:text-white hover:bg-white/10',
                      item.label === 'Live' && 'text-red-400'
                    )}
                  >
                    <Icon className={cn('h-5 w-5', item.label === 'Live' && 'animate-pulse')} />
                    {item.label}
                  </Link>
                );
              })}

              {/* Mobile auth section */}
              <div className="mt-2 pt-2 border-t border-white/10">
                {isLoggedIn ? (
                  <>
                    {userName && (
                      <div className="px-4 py-2 text-sm text-gray-400">
                        Signed in as {userName}
                      </div>
                    )}
                    <button
                      onClick={() => {
                        handleSignOut();
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition-colors w-full"
                    >
                      <LogOut className="h-5 w-5" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <Link
                    href="/auth/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <LogIn className="h-5 w-5" />
                    Log In / Sign Up
                  </Link>
                )}
              </div>

              {/* Mobile share */}
              <button
                onClick={() => {
                  handleShare();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Share2 className="h-5 w-5" />
                Share
              </button>
            </nav>

            {/* Status indicator */}
            <div className="mt-4 px-4">
              {tournamentLaunched ? (
                <div className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold',
                  isGameLive
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-green-500/20 text-green-400'
                )}>
                  <span className={cn(
                    'w-2 h-2 rounded-full',
                    isGameLive ? 'bg-red-500 animate-pulse' : 'bg-green-500'
                  )} />
                  {isGameLive ? 'Game is LIVE' : 'Tournament Active - Numbers Assigned'}
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#d4af37]/20 text-[#d4af37] text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-[#d4af37] animate-pulse" />
                  {availableSquares > 0
                    ? `${availableSquares} squares available`
                    : 'All squares sold - Awaiting launch'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

    </header>
  );
}
