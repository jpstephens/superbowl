'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import PoolGrid from '@/components/PoolGrid';
import type { GridSquare, GameState } from '@/lib/supabase/types';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import LiveScoreBanner from '@/components/LiveScoreBanner';
import { cn } from '@/lib/utils';

/**
 * GRID PAGE - Light Mode
 *
 * Design Intent:
 * - Clean, bright, professional
 * - The grid IS the visual focus
 * - Selection should feel tactile and satisfying
 * - Clear visual hierarchy
 */
export default function GridPage() {
  const [selectedSquares, setSelectedSquares] = useState<GridSquare[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [stats, setStats] = useState({ sold: 0, available: 100 });
  const [poolActive, setPoolActive] = useState<boolean>(true);
  const [squarePrice, setSquarePrice] = useState<number>(50);
  // Hardcoded prizes
  const prizes = { q1: 350, q2: 600, q3: 350, q4: 1200 };
  const [countdown, setCountdown] = useState<{ days: number; hours: number; mins: number } | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  // Super Bowl LX - February 8, 2026
  const GAME_DATE = new Date('2026-02-08T18:30:00-05:00');

  useEffect(() => {
    loadData();
    setupRealtime();

    const timer = setInterval(() => {
      const now = new Date();
      const diff = GAME_DATE.getTime() - now.getTime();

      if (diff > 0) {
        setCountdown({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          mins: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        });
      } else {
        setCountdown(null);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const loadData = async () => {
    try {
      const supabase = createClient();

      const { data: settings } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', ['pool_active', 'square_price']);

      if (settings) {
        const poolSetting = settings.find(s => s.key === 'pool_active');
        const priceSetting = settings.find(s => s.key === 'square_price');

        if (poolSetting) setPoolActive(poolSetting.value === 'true');
        if (priceSetting?.value) setSquarePrice(parseFloat(priceSetting.value) || 50);
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);

      const { data: gameData } = await supabase
        .from('game_state')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (gameData) setGameState(gameData);

      const { data: allSquares } = await supabase
        .from('grid_squares')
        .select('status');

      const sold = allSquares?.filter(s => s.status === 'paid' || s.status === 'confirmed').length || 0;

      setStats({
        sold,
        available: 100 - sold
      });
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const setupRealtime = () => {
    const supabase = createClient();

    const channel = supabase
      .channel('grid_page_updates')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'grid_squares' },
        () => loadData()
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'settings' },
        () => loadData()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

  const handleSquareSelect = (square: GridSquare) => {
    if (!poolActive) return;

    setSelectedSquares(prev => {
      const isSelected = prev.some(s => s.id === square.id);
      return isSelected
        ? prev.filter(s => s.id !== square.id)
        : [...prev, square];
    });
  };

  const handleRemoveSquare = (squareId: string) => {
    setSelectedSquares(prev => prev.filter(s => s.id !== squareId));
  };

  const handleScoreUpdate = (data: any) => {
    setGameState({
      ...gameState,
      afc_score: data.afcScore,
      nfc_score: data.nfcScore,
      afc_team: data.afcTeam,
      nfc_team: data.nfcTeam,
      quarter: data.quarter,
      time_remaining: data.timeRemaining,
      is_live: data.isLive,
      is_halftime: data.isHalftime,
      is_final: data.isFinal,
    } as GameState);
  };

  const totalPrizePool = useMemo(() => prizes.q1 + prizes.q2 + prizes.q3 + prizes.q4, [prizes]);
  const selectionTotal = useMemo(() => selectedSquares.length * squarePrice, [selectedSquares.length, squarePrice]);
  const isLive = gameState?.is_live || false;

  return (
    <div className="min-h-screen bg-white text-[#232842]">

      {/* ===== HEADER ===== */}
      <header className="sticky top-0 z-50 bg-[#232842] border-b border-[#1a1f33] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="h-24 flex items-center justify-between">
            {/* Left: Logo + Back */}
            <Link href="/" className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-white p-1.5 shadow-md">
                <Image src="/logo.png" alt="Michael Williams Memorial Scholarship" width={72} height={72} className="rounded-full" />
              </div>
              <div className="hidden sm:block">
                <div className="text-lg font-bold text-white">Michael Williams</div>
                <div className="text-base text-[#d4af37] font-semibold">Memorial Scholarship</div>
              </div>
            </Link>

            {/* Center: Title + Nav + Countdown */}
            <div className="flex items-center gap-6">
              <h1 className="font-bold text-2xl text-white hidden sm:block">Super Bowl Pool</h1>
              <Link
                href="/props"
                className="text-gray-300 hover:text-[#d4af37] font-semibold transition-colors"
              >
                Prop Bets
              </Link>
              {countdown && (
                <div className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-white/10 border border-white/20 rounded-full text-base">
                  <span className="text-[#d4af37] font-bold">
                    {countdown.days}d {countdown.hours}h {countdown.mins}m
                  </span>
                  <span className="text-gray-300 font-medium">to kickoff</span>
                </div>
              )}
            </div>

            {/* Right: Stats */}
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-2xl font-bold text-[#30d158]">{stats.available}</div>
                <div className="text-sm text-gray-400 font-medium">available</div>
              </div>
              <div className="text-right hidden sm:block">
                <div className="text-2xl font-bold text-[#d4af37]">${squarePrice}</div>
                <div className="text-sm text-gray-400 font-medium">per square</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* Pool Closed Banner */}
        {!poolActive && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <div>
                <span className="font-bold text-red-600 text-lg">Pool Closed</span>
                <span className="text-gray-600 ml-2 text-base">Not accepting purchases at this time</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Live Score Banner - Only show when game is live */}
        {isLive && (
          <div className="mb-6">
            <LiveScoreBanner
              onScoreUpdate={handleScoreUpdate}
              refreshInterval={10000}
              showDetails={true}
            />
          </div>
        )}

        {/* Main Layout */}
        <div className="grid lg:grid-cols-[1fr_360px] gap-6">

          {/* LEFT: The Grid */}
          <div className="space-y-4">
            {/* Prize Info Bar - Always visible */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-5 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#d4af37]/10 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-[#d4af37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-bold text-lg text-[#232842]">Total Prize Pool</div>
                    <div className="text-sm text-gray-500">Win at each quarter end</div>
                  </div>
                </div>
                <span className="text-3xl font-black text-[#d4af37]">${totalPrizePool.toLocaleString()}</span>
              </div>

              {/* Quarter prizes */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { q: 'Q1', prize: prizes.q1 },
                  { q: 'Q2', prize: prizes.q2 },
                  { q: 'Q3', prize: prizes.q3 },
                  { q: 'Q4', prize: prizes.q4 },
                ].map(({ q, prize }) => (
                  <div key={q} className="text-center p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="text-sm text-gray-500 font-medium mb-1">{q}</div>
                    <div className="font-bold text-xl text-[#d4af37]">${prize}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* The Grid */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-4 sm:p-6 shadow-md">
              <PoolGrid
                onSquareSelect={handleSquareSelect}
                selectedSquareIds={new Set(selectedSquares.map(s => s.id))}
                userId={userId}
                disabled={!poolActive}
                gameScore={gameState ? {
                  afcScore: gameState.afc_score,
                  nfcScore: gameState.nfc_score,
                  afcTeam: gameState.afc_team,
                  nfcTeam: gameState.nfc_team,
                  quarter: gameState.quarter,
                  isLive: gameState.is_live,
                } : null}
              />

              {/* Legend */}
              <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-[#30d158]/20 border-2 border-[#30d158]/50 rounded" />
                  <span className="text-gray-600 font-medium">Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-[#d4af37] rounded" />
                  <span className="text-gray-600 font-medium">Selected</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-gray-200 border-2 border-gray-300 rounded" />
                  <span className="text-gray-600 font-medium">Taken</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Sidebar - Desktop */}
          <div className="hidden lg:block">
            <div className="sticky top-28 space-y-4">
              {/* When game is live: Show Quarter Winners */}
              {isLive ? (
                <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-md">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    <h3 className="font-bold text-xl text-[#232842]">Quarter Winners</h3>
                  </div>

                  <div className="space-y-3">
                    {[
                      { q: 'Q1', label: 'End of 1st', prize: prizes.q1, completed: (gameState?.quarter || 0) > 1 },
                      { q: 'Q2', label: 'Halftime', prize: prizes.q2, completed: (gameState?.quarter || 0) > 2 },
                      { q: 'Q3', label: 'End of 3rd', prize: prizes.q3, completed: (gameState?.quarter || 0) > 3 },
                      { q: 'Q4', label: 'Final', prize: prizes.q4, completed: gameState?.is_final },
                    ].map(({ q, label, prize, completed }) => (
                      <div
                        key={q}
                        className={cn(
                          'p-4 rounded-xl border-2 transition-all',
                          completed
                            ? 'bg-[#d4af37]/10 border-[#d4af37]'
                            : 'bg-gray-50 border-gray-200'
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              'font-bold',
                              completed ? 'text-[#d4af37]' : 'text-gray-400'
                            )}>
                              {q}
                            </span>
                            <span className="text-sm text-gray-500">{label}</span>
                          </div>
                          <span className={cn(
                            'font-bold',
                            completed ? 'text-[#d4af37]' : 'text-gray-400'
                          )}>
                            ${prize}
                          </span>
                        </div>
                        {completed ? (
                          <div className="text-sm font-semibold text-[#232842]">
                            Winner announced!
                          </div>
                        ) : (
                          <div className="text-sm text-gray-400">
                            Pending...
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Pre-game: Selection Panel */
                <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-md">
                  <h3 className="font-bold text-xl mb-4 text-[#232842]">Your Selection</h3>

                  {selectedSquares.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                        </svg>
                      </div>
                      <p className="text-gray-500 text-base mb-1 font-medium">No squares selected</p>
                      <p className="text-gray-400 text-sm">Tap squares on the grid to select them</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Selected squares grid */}
                      <div className="flex flex-wrap gap-2">
                        {selectedSquares.map((square) => {
                          const boxNumber = square.row_number * 10 + square.col_number + 1;
                          return (
                            <motion.button
                              key={square.id}
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              onClick={() => handleRemoveSquare(square.id)}
                              className="w-12 h-12 bg-[#d4af37] text-white rounded-lg flex items-center justify-center font-bold text-base hover:bg-[#c49b2f] transition-colors group relative shadow-md"
                              title="Click to remove"
                            >
                              <span className="group-hover:opacity-0 transition-opacity">
                                #{boxNumber}
                              </span>
                              <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xl">
                                ×
                              </span>
                            </motion.button>
                          );
                        })}
                      </div>

                      {/* Pricing */}
                      <div className="pt-4 border-t border-gray-200 space-y-2">
                        <div className="flex justify-between text-base">
                          <span className="text-gray-500 font-medium">
                            {selectedSquares.length} square{selectedSquares.length !== 1 ? 's' : ''} × ${squarePrice}
                          </span>
                          <span className="font-bold text-[#232842] text-xl">${selectionTotal}</span>
                        </div>
                      </div>

                      {/* CTA */}
                      <Link
                        href="/payment"
                        onClick={() => {
                          sessionStorage.setItem('selectedSquares', JSON.stringify(selectedSquares.map(s => s.id)));
                        }}
                        className="w-full flex items-center justify-center gap-2 py-4 bg-[#d4af37] text-white rounded-xl font-bold text-lg hover:bg-[#c49b2f] transition-colors shadow-lg"
                      >
                        Continue to Payment
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* Scholarship reminder */}
              <div className="bg-[#d4af37]/10 border-2 border-[#d4af37]/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#d4af37]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-[#d4af37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-bold text-[#232842] text-base">Supporting a Good Cause</div>
                    <div className="text-sm text-gray-600 mt-1">
                      100% of proceeds support the Michael Williams Memorial Scholarship
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Checkout - Fixed Bottom */}
      <AnimatePresence>
        {selectedSquares.length > 0 && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 lg:hidden bg-white border-t-2 border-gray-200 pb-safe z-40 shadow-2xl"
          >
            <div className="px-4 py-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-base text-gray-500 font-medium">
                    {selectedSquares.length} square{selectedSquares.length !== 1 ? 's' : ''}
                  </div>
                  <div className="text-3xl font-black text-[#232842]">${selectionTotal}</div>
                </div>
                <Link
                  href="/payment"
                  onClick={() => {
                    sessionStorage.setItem('selectedSquares', JSON.stringify(selectedSquares.map(s => s.id)));
                  }}
                  className="px-8 py-4 bg-[#d4af37] text-white rounded-xl font-bold text-lg hover:bg-[#c49b2f] transition-colors shadow-lg"
                >
                  Continue
                </Link>
              </div>

              {/* Selected preview */}
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {selectedSquares.map((square) => {
                  const boxNumber = square.row_number * 10 + square.col_number + 1;
                  return (
                    <div
                      key={square.id}
                      className="flex-shrink-0 w-10 h-10 bg-[#d4af37] text-white rounded-lg flex items-center justify-center font-bold text-sm shadow-md"
                    >
                      #{boxNumber}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
