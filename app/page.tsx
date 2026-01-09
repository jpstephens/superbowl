'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import PoolGrid from '@/components/PoolGrid';
import type { GridSquare, GameState } from '@/lib/supabase/types';
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
    <div className="min-h-screen bg-gray-50">
      {/* Header - Navy with Gold accents */}
      <header className="sticky top-0 z-50 bg-[#232842] shadow-lg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="h-16 flex items-center justify-between">
            {/* Logo + Title */}
            <Link href="/" className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white p-0.5 shadow flex-shrink-0">
                <Image src="/logo.png" alt="MWMS" width={44} height={44} className="rounded-full" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-white leading-tight">Super Bowl Pool</h1>
                <p className="text-sm text-[#d4af37]">Michael Williams Memorial Scholarship</p>
              </div>
            </Link>

            {/* Countdown */}
            {countdown && (
              <div className="hidden md:flex items-center gap-1 text-white">
                <span className="text-2xl font-bold">{countdown.days}</span>
                <span className="text-xs text-gray-400 mr-2">d</span>
                <span className="text-2xl font-bold">{countdown.hours}</span>
                <span className="text-xs text-gray-400 mr-2">h</span>
                <span className="text-2xl font-bold">{countdown.mins}</span>
                <span className="text-xs text-gray-400 mr-3">m</span>
                <span className="text-sm text-gray-400">to kickoff</span>
              </div>
            )}

            {/* Right side */}
            <div className="flex items-center gap-4">
              <nav className="hidden sm:flex items-center gap-4">
                <Link href="/props" className="text-sm text-gray-300 hover:text-white transition-colors">
                  Prop Bets
                </Link>
                {tournamentLaunched && (
                  <a href="/api/grid/pdf" target="_blank" className="text-sm text-gray-300 hover:text-white transition-colors">
                    PDF
                  </a>
                )}
              </nav>

              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                <span className="text-xl font-bold text-[#30d158]">{stats.available}</span>
                <span className="text-xs text-gray-400">left</span>
                <span className="text-gray-500 mx-1">·</span>
                <span className="text-xl font-bold text-[#d4af37]">${squarePrice}</span>
                <span className="text-xs text-gray-400">each</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Pool Closed */}
        {!poolActive && (
          <div className="mb-6 px-4 py-3 bg-red-100 border border-red-300 rounded-xl text-center">
            <span className="text-red-700 font-semibold">Pool Closed — Not accepting purchases</span>
          </div>
        )}

        {/* Live Score */}
        {isLive && (
          <div className="mb-8">
            <LiveScoreBanner onScoreUpdate={handleScoreUpdate} refreshInterval={10000} showDetails={true} />
          </div>
        )}

        {/* Hero + Prize Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-[#232842] tracking-tight mb-3">
            Pick Your Squares
          </h1>
          <p className="text-gray-500 text-lg mb-6">
            Match the last digit of each team's score to win
          </p>

          {/* Prize Breakdown */}
          <div className="inline-flex items-center gap-2 bg-[#232842] rounded-2xl p-2">
            {[
              { label: 'Q1', amount: prizes.q1 },
              { label: 'Q2', amount: prizes.q2 },
              { label: 'Q3', amount: prizes.q3 },
              { label: 'Q4', amount: prizes.q4, highlight: true },
            ].map(({ label, amount, highlight }) => (
              <div
                key={label}
                className={`px-4 py-2 rounded-xl text-sm font-semibold ${
                  highlight
                    ? 'bg-[#d4af37] text-[#232842]'
                    : 'text-white'
                }`}
              >
                {label} <span className={highlight ? 'text-[#232842]/70' : 'text-[#d4af37]'}>${amount}</span>
              </div>
            ))}
            <div className="px-4 py-2 border-l border-white/20">
              <span className="text-[#d4af37] font-bold text-lg">${totalPrizePool.toLocaleString()}</span>
              <span className="text-gray-400 text-xs ml-1">total</span>
            </div>
          </div>
        </div>

        {/* The Grid */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-4 sm:p-6 mb-4">
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

        {/* Legend + Selection inline */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-emerald-100 border border-emerald-300" />
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-[#d4af37]" />
              <span>Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-gray-200 border border-gray-300" />
              <span>Taken</span>
            </div>
          </div>

          {/* Selection summary - inline */}
          {selectedSquares.length > 0 && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">
                {selectedSquares.length} selected
              </span>
              <span className="text-lg font-bold text-[#232842]">
                ${selectionTotal}
              </span>
              <Link
                href="/payment"
                onClick={() => sessionStorage.setItem('selectedSquares', JSON.stringify(selectedSquares.map(s => s.id)))}
                className="bg-[#d4af37] text-[#232842] px-5 py-2 rounded-lg font-semibold text-sm hover:bg-[#c49b2f] transition-colors"
              >
                Continue to Payment
              </Link>
            </div>
          )}
        </div>

        {/* Prop Bets CTA */}
        <div className="bg-[#232842] rounded-2xl p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-white font-bold text-lg">Want more action?</h3>
              <p className="text-gray-400 text-sm">Place prop bets on game events for extra chances to win</p>
            </div>
            <Link
              href="/props"
              className="bg-white text-[#232842] px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors whitespace-nowrap"
            >
              View Prop Bets
            </Link>
          </div>
        </div>

        {/* Charity Note */}
        <p className="text-center text-sm text-gray-400">
          100% of proceeds benefit the <span className="text-[#232842] font-medium">Michael Williams Memorial Scholarship</span>
        </p>
      </main>
    </div>
  );
}
