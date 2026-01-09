'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import PoolGrid from '@/components/PoolGrid';
import type { GridSquare, GameState } from '@/lib/supabase/types';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import LiveScoreBanner from '@/components/LiveScoreBanner';

export default function GridPage() {
  const [selectedSquares, setSelectedSquares] = useState<GridSquare[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [stats, setStats] = useState({ sold: 0, available: 100 });
  const [poolActive, setPoolActive] = useState<boolean>(true);
  const [squarePrice, setSquarePrice] = useState<number>(50);
  const [tournamentLaunched, setTournamentLaunched] = useState<boolean>(false);
  const prizes = { q1: 350, q2: 600, q3: 350, q4: 1200 };
  const [countdown, setCountdown] = useState<{ days: number; hours: number; mins: number } | null>(null);

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
        .in('key', ['pool_active', 'square_price', 'tournament_launched']);

      if (settings) {
        const poolSetting = settings.find(s => s.key === 'pool_active');
        const priceSetting = settings.find(s => s.key === 'square_price');
        const launchSetting = settings.find(s => s.key === 'tournament_launched');

        if (poolSetting) setPoolActive(poolSetting.value === 'true');
        if (priceSetting?.value) setSquarePrice(parseFloat(priceSetting.value) || 50);
        if (launchSetting) setTournamentLaunched(launchSetting.value === 'true');
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
      setStats({ sold, available: 100 - sold });
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const setupRealtime = () => {
    const supabase = createClient();
    const channel = supabase
      .channel('grid_page_updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'grid_squares' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, () => loadData())
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

  const handleSquareSelect = (square: GridSquare) => {
    if (!poolActive) return;
    setSelectedSquares(prev => {
      const isSelected = prev.some(s => s.id === square.id);
      return isSelected ? prev.filter(s => s.id !== square.id) : [...prev, square];
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

  const totalPrizePool = useMemo(() => prizes.q1 + prizes.q2 + prizes.q3 + prizes.q4, []);
  const selectionTotal = useMemo(() => selectedSquares.length * squarePrice, [selectedSquares.length, squarePrice]);
  const isLive = gameState?.is_live || false;

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Minimal Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/5">
        <div className="max-w-5xl mx-auto px-6">
          <div className="h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <Image src="/logo.png" alt="MWMS" width={32} height={32} className="rounded-full" />
              <span className="font-semibold text-[#1d1d1f]">Super Bowl Pool</span>
            </Link>

            <div className="flex items-center gap-6">
              {countdown && (
                <div className="hidden sm:flex items-center gap-1 text-sm text-[#86868b]">
                  <span className="font-medium text-[#1d1d1f]">{countdown.days}d</span>
                  <span className="font-medium text-[#1d1d1f]">{countdown.hours}h</span>
                  <span className="font-medium text-[#1d1d1f]">{countdown.mins}m</span>
                  <span className="ml-1">until kickoff</span>
                </div>
              )}

              <nav className="flex items-center gap-4">
                <Link href="/props" className="text-sm text-[#86868b] hover:text-[#1d1d1f] transition-colors">
                  Props
                </Link>
                {tournamentLaunched && (
                  <a href="/api/grid/pdf" target="_blank" className="text-sm text-[#86868b] hover:text-[#1d1d1f] transition-colors">
                    PDF
                  </a>
                )}
              </nav>

              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-[#1d1d1f]">{stats.available}</span>
                <span className="text-[#86868b]">left</span>
                <span className="text-[#d1d1d6]">·</span>
                <span className="font-semibold text-[#1d1d1f]">${squarePrice}</span>
                <span className="text-[#86868b]">each</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Pool Closed */}
        {!poolActive && (
          <div className="mb-6 px-4 py-3 bg-red-50 rounded-xl text-center">
            <span className="text-red-600 font-medium">Pool closed — not accepting purchases</span>
          </div>
        )}

        {/* Live Score */}
        {isLive && (
          <div className="mb-8">
            <LiveScoreBanner onScoreUpdate={handleScoreUpdate} refreshInterval={10000} showDetails={true} />
          </div>
        )}

        {/* Hero Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-[#1d1d1f] tracking-tight mb-2">
            Pick Your Squares
          </h1>
          <p className="text-[#86868b] text-lg">
            Win up to <span className="font-semibold text-[#1d1d1f]">${totalPrizePool.toLocaleString()}</span> in prizes
          </p>
        </div>

        {/* Prize Pills */}
        <div className="flex justify-center gap-3 mb-8">
          {[
            { label: 'Q1', amount: prizes.q1 },
            { label: 'Q2', amount: prizes.q2 },
            { label: 'Q3', amount: prizes.q3 },
            { label: 'Q4', amount: prizes.q4, highlight: true },
          ].map(({ label, amount, highlight }) => (
            <div
              key={label}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                highlight
                  ? 'bg-[#1d1d1f] text-white'
                  : 'bg-white text-[#1d1d1f] border border-black/10'
              }`}
            >
              {label} <span className={highlight ? 'text-white/80' : 'text-[#86868b]'}>${amount}</span>
            </div>
          ))}
        </div>

        {/* The Grid */}
        <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-6 mb-6">
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
        </div>

        {/* How it works - Minimal */}
        <div className="flex justify-center gap-8 text-sm text-[#86868b] mb-8">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-[#34c759]/20 border border-[#34c759]/30" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-[#ff9500]" />
            <span>Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-[#e5e5ea]" />
            <span>Taken</span>
          </div>
        </div>

        {/* Charity Note */}
        <p className="text-center text-sm text-[#86868b]">
          100% of proceeds benefit the <span className="text-[#1d1d1f]">Michael Williams Memorial Scholarship</span>
        </p>
      </main>

      {/* Selection Bar - Fixed Bottom */}
      <AnimatePresence>
        {selectedSquares.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="bg-[#1d1d1f] text-white rounded-full px-3 py-2 flex items-center gap-3 shadow-2xl shadow-black/20">
              {/* Selected squares preview */}
              <div className="flex items-center gap-1.5 pl-2">
                {selectedSquares.slice(0, 5).map((square) => {
                  const boxNum = square.row_number * 10 + square.col_number + 1;
                  return (
                    <motion.button
                      key={square.id}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      onClick={() => handleRemoveSquare(square.id)}
                      className="w-8 h-8 bg-[#ff9500] rounded-full text-xs font-semibold flex items-center justify-center hover:bg-[#ff9500]/80 transition-colors"
                    >
                      {boxNum}
                    </motion.button>
                  );
                })}
                {selectedSquares.length > 5 && (
                  <span className="text-white/60 text-sm pl-1">+{selectedSquares.length - 5}</span>
                )}
              </div>

              <div className="h-8 w-px bg-white/20" />

              {/* Total */}
              <div className="text-sm">
                <span className="text-white/60">{selectedSquares.length} squares</span>
                <span className="font-semibold ml-2">${selectionTotal}</span>
              </div>

              <div className="h-8 w-px bg-white/20" />

              {/* CTA */}
              <Link
                href="/payment"
                onClick={() => sessionStorage.setItem('selectedSquares', JSON.stringify(selectedSquares.map(s => s.id)))}
                className="bg-white text-[#1d1d1f] px-5 py-2 rounded-full font-semibold text-sm hover:bg-white/90 transition-colors"
              >
                Continue
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
