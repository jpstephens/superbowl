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
      {/* Header - Clean and Simple */}
      <header className="bg-[#232842]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between">
            {/* Logo + Title - Large and prominent */}
            <Link href="/" className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-white p-1 shadow-lg flex-shrink-0">
                <Image src="/logo.png" alt="MWMS" width={72} height={72} className="rounded-full" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">Super Bowl Pool</h1>
                <p className="text-base text-[#d4af37]">Michael Williams Memorial Scholarship</p>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center gap-6">
              <Link href="/props" className="text-base text-gray-300 hover:text-white transition-colors font-medium">
                Prop Bets
              </Link>
              {tournamentLaunched && (
                <a href="/api/grid/pdf" target="_blank" className="text-base text-gray-300 hover:text-white transition-colors font-medium">
                  Download PDF
                </a>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Info Bar - Countdown + Stats */}
      <div className="bg-gray-100 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
            {/* Countdown */}
            {countdown && (
              <div className="flex items-center gap-3">
                <span className="text-gray-500 font-medium">Kickoff in</span>
                <div className="flex items-center gap-2">
                  <div className="bg-[#232842] text-white px-3 py-1.5 rounded-lg">
                    <span className="text-xl font-bold">{countdown.days}</span>
                    <span className="text-xs ml-1">days</span>
                  </div>
                  <div className="bg-[#232842] text-white px-3 py-1.5 rounded-lg">
                    <span className="text-xl font-bold">{countdown.hours}</span>
                    <span className="text-xs ml-1">hrs</span>
                  </div>
                  <div className="bg-[#232842] text-white px-3 py-1.5 rounded-lg">
                    <span className="text-xl font-bold">{countdown.mins}</span>
                    <span className="text-xs ml-1">min</span>
                  </div>
                </div>
              </div>
            )}

            <div className="h-8 w-px bg-gray-300 hidden sm:block" />

            {/* Stats */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-[#30d158]">{stats.available}</span>
                <span className="text-gray-500 font-medium">squares left</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-[#232842]">${squarePrice}</span>
                <span className="text-gray-500 font-medium">per square</span>
              </div>
            </div>
          </div>
        </div>
      </div>

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

        {/* Legend */}
        <div className="flex justify-center gap-6 text-sm text-gray-500 mb-6">
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

        {/* Cart - Always Visible */}
        <div className="bg-[#232842] rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Cart Icon */}
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>

              {/* Selection Info */}
              <div>
                <div className="text-white font-semibold">
                  {selectedSquares.length === 0 ? (
                    'No squares selected'
                  ) : (
                    `${selectedSquares.length} square${selectedSquares.length !== 1 ? 's' : ''} selected`
                  )}
                </div>
                <div className="text-gray-400 text-sm">
                  {selectedSquares.length === 0 ? (
                    'Click on green squares to add them'
                  ) : (
                    selectedSquares.map(s => `#${s.row_number * 10 + s.col_number + 1}`).join(', ')
                  )}
                </div>
              </div>
            </div>

            {/* Price + CTA */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-[#d4af37]">${selectionTotal}</div>
                <div className="text-gray-400 text-sm">${squarePrice} each</div>
              </div>
              <Link
                href="/payment"
                onClick={() => sessionStorage.setItem('selectedSquares', JSON.stringify(selectedSquares.map(s => s.id)))}
                className={`px-6 py-3 rounded-xl font-bold transition-colors ${
                  selectedSquares.length > 0
                    ? 'bg-[#d4af37] text-[#232842] hover:bg-[#c49b2f]'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
                aria-disabled={selectedSquares.length === 0}
              >
                Checkout
              </Link>
            </div>
          </div>
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
