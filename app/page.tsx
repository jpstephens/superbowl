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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#232842]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between">
            {/* Logo + Title */}
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
            <nav className="flex items-center gap-4">
              <Link href="/props" className="bg-[#d4af37] text-[#232842] px-4 py-2 rounded-full font-semibold hover:bg-[#e5c04a] transition-colors">
                Place Prop Bets
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

      {/* Info Bar */}
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

            {/* Stats */}
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#30d158]">{stats.available}</div>
                <div className="text-xs text-gray-500">squares left</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#d4af37]">${squarePrice}</div>
                <div className="text-xs text-gray-500">per square</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pool Closed */}
      {!poolActive && (
        <div className="bg-red-600 text-white text-center py-1.5 text-sm font-medium">
          Pool Closed — Not accepting purchases
        </div>
      )}

      {/* Live Score */}
      {isLive && (
        <div className="bg-white border-b py-2">
          <div className="max-w-7xl mx-auto px-4">
            <LiveScoreBanner onScoreUpdate={handleScoreUpdate} refreshInterval={10000} showDetails={true} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col lg:flex-row gap-4">

          {/* Grid Column */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
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
              <div className="flex justify-center gap-5 mt-4 pt-4 border-t border-gray-200 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded bg-emerald-50 border-2 border-emerald-300" />
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded bg-[#d4af37] border-2 border-[#c49b2f]" />
                  <span>Selected</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded bg-slate-100 border-2 border-slate-200" />
                  <span>Taken</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-72 flex-shrink-0">
            <div className="lg:sticky lg:top-4 space-y-3">

              {/* Prizes */}
              <div className="bg-[#232842] rounded-xl p-4">
                <div className="text-gray-400 text-xs mb-2">PRIZE POOL</div>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-2xl font-bold text-[#d4af37]">${totalPrizePool.toLocaleString()}</span>
                  <span className="text-gray-400 text-sm">total</span>
                </div>
                <div className="grid grid-cols-4 gap-1 text-center text-xs">
                  <div className="bg-white/5 rounded py-1.5">
                    <div className="text-gray-400">Q1</div>
                    <div className="text-white font-semibold">${prizes.q1}</div>
                  </div>
                  <div className="bg-white/5 rounded py-1.5">
                    <div className="text-gray-400">Q2</div>
                    <div className="text-white font-semibold">${prizes.q2}</div>
                  </div>
                  <div className="bg-white/5 rounded py-1.5">
                    <div className="text-gray-400">Q3</div>
                    <div className="text-white font-semibold">${prizes.q3}</div>
                  </div>
                  <div className="bg-[#d4af37]/20 rounded py-1.5">
                    <div className="text-[#d4af37]">Q4</div>
                    <div className="text-[#d4af37] font-semibold">${prizes.q4}</div>
                  </div>
                </div>
              </div>

              {/* Cart */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="font-semibold text-[#232842] mb-3">Your Selection</div>

                {selectedSquares.length === 0 ? (
                  <div className="text-gray-400 text-sm py-4 text-center">
                    Click squares to select
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {selectedSquares.map((square) => {
                        const boxNum = square.row_number * 10 + square.col_number + 1;
                        return (
                          <button
                            key={square.id}
                            onClick={() => handleRemoveSquare(square.id)}
                            className="w-8 h-8 bg-[#d4af37] rounded text-[#232842] font-bold text-xs flex items-center justify-center hover:bg-[#c49b2f]"
                          >
                            {boxNum}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                      <span className="text-gray-500 text-sm">{selectedSquares.length} × ${squarePrice}</span>
                      <span className="text-xl font-bold text-[#232842]">${selectionTotal}</span>
                    </div>
                  </>
                )}

                <Link
                  href={selectedSquares.length > 0 ? "/payment" : "#"}
                  onClick={(e) => {
                    if (selectedSquares.length === 0) { e.preventDefault(); return; }
                    sessionStorage.setItem('selectedSquares', JSON.stringify(selectedSquares.map(s => s.id)));
                  }}
                  className={`w-full py-2.5 rounded-lg font-semibold text-sm text-center block mt-3 transition-colors ${
                    selectedSquares.length > 0
                      ? 'bg-[#d4af37] text-[#232842] hover:bg-[#c49b2f]'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {selectedSquares.length > 0 ? 'Checkout' : 'Select squares'}
                </Link>
              </div>

              {/* Prop Bets */}
              <Link href="/props" className="block bg-gradient-to-r from-[#232842] to-[#2d3454] rounded-xl p-3 hover:from-[#2d3454] hover:to-[#373f5c] transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-white text-sm">Want more action?</div>
                    <div className="text-gray-300 text-xs">Place side bets for extra chances to win</div>
                  </div>
                  <span className="text-[#d4af37] text-lg">→</span>
                </div>
              </Link>

              {/* Charity */}
              <div className="text-center text-xs text-gray-400 px-2">
                100% benefits the Michael Williams Memorial Scholarship
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
