'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import PoolGrid from '@/components/PoolGrid';
import type { GridSquare, GameState } from '@/lib/supabase/types';
import Link from 'next/link';
import Header from '@/components/Header';
import LiveScoreBanner from '@/components/LiveScoreBanner';

export default function GridPage() {
  const [selectedSquares, setSelectedSquares] = useState<GridSquare[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [stats, setStats] = useState({ sold: 0, available: 100 });
  const [poolActive, setPoolActive] = useState<boolean>(true);
  const [squarePrice, setSquarePrice] = useState<number>(50);
  const [tournamentLaunched, setTournamentLaunched] = useState<boolean>(false);
  const [prizes, setPrizes] = useState({ q1: 350, q2: 600, q3: 350, q4: 1200 });
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
        .in('key', ['pool_active', 'square_price', 'tournament_launched', 'prize_q1', 'prize_q2', 'prize_q3', 'prize_q4']);

      if (settings) {
        const poolSetting = settings.find(s => s.key === 'pool_active');
        const priceSetting = settings.find(s => s.key === 'square_price');
        const launchSetting = settings.find(s => s.key === 'tournament_launched');
        const q1Setting = settings.find(s => s.key === 'prize_q1');
        const q2Setting = settings.find(s => s.key === 'prize_q2');
        const q3Setting = settings.find(s => s.key === 'prize_q3');
        const q4Setting = settings.find(s => s.key === 'prize_q4');

        if (poolSetting) setPoolActive(poolSetting.value === 'true');
        if (priceSetting?.value) setSquarePrice(parseFloat(priceSetting.value) || 50);
        if (launchSetting) setTournamentLaunched(launchSetting.value === 'true');

        // Update prizes from settings (use defaults if not set)
        setPrizes({
          q1: q1Setting?.value ? parseFloat(q1Setting.value) : 350,
          q2: q2Setting?.value ? parseFloat(q2Setting.value) : 600,
          q3: q3Setting?.value ? parseFloat(q3Setting.value) : 350,
          q4: q4Setting?.value ? parseFloat(q4Setting.value) : 1200,
        });
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

  const totalPrizePool = useMemo(() => prizes.q1 + prizes.q2 + prizes.q3 + prizes.q4, [prizes]);
  const selectionTotal = useMemo(() => selectedSquares.length * squarePrice, [selectedSquares.length, squarePrice]);
  const isLive = gameState?.is_live || false;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Info Bar */}
      <div className="bg-gray-100 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
            {/* Countdown - hidden when game is live */}
            {countdown && !isLive && (
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

      {/* Main Content - Grid Focused Layout */}
      <main className="flex-1 px-2 sm:px-4 py-4">
        {/* Grid takes full width */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 overflow-x-auto">
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
          <div className="flex justify-center gap-6 mt-6 pt-4 border-t border-gray-200 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-emerald-50 border-2 border-emerald-300" />
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-[#d4af37] border-2 border-[#c49b2f]" />
              <span>Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-slate-100 border-2 border-slate-200" />
              <span>Taken</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar - Prize Info + Selection + Checkout */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Prizes */}
          <div className="bg-[#232842] rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-400 text-xs mb-1">PRIZE POOL</div>
                <div className="text-2xl font-bold text-[#d4af37]">${totalPrizePool.toLocaleString()}</div>
              </div>
              <div className="flex gap-2 text-center text-xs">
                <div className="bg-white/10 rounded px-2 py-1.5">
                  <div className="text-gray-400">Q1</div>
                  <div className="text-white font-semibold">${prizes.q1}</div>
                </div>
                <div className="bg-white/10 rounded px-2 py-1.5">
                  <div className="text-gray-400">Q2</div>
                  <div className="text-white font-semibold">${prizes.q2}</div>
                </div>
                <div className="bg-white/10 rounded px-2 py-1.5">
                  <div className="text-gray-400">Q3</div>
                  <div className="text-white font-semibold">${prizes.q3}</div>
                </div>
                <div className="bg-[#d4af37]/20 rounded px-2 py-1.5">
                  <div className="text-[#d4af37]">Q4</div>
                  <div className="text-[#d4af37] font-semibold">${prizes.q4}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Selection */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-[#232842] text-sm">Your Selection</div>
                {selectedSquares.length === 0 ? (
                  <div className="text-gray-400 text-sm">Click squares to select</div>
                ) : (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedSquares.slice(0, 8).map((square) => {
                      const boxNum = square.row_number * 10 + square.col_number + 1;
                      return (
                        <span key={square.id} className="w-7 h-7 bg-[#d4af37] rounded text-[#232842] font-bold text-xs flex items-center justify-center">
                          {boxNum}
                        </span>
                      );
                    })}
                    {selectedSquares.length > 8 && (
                      <span className="text-gray-500 text-xs self-center ml-1">+{selectedSquares.length - 8}</span>
                    )}
                  </div>
                )}
              </div>
              {selectedSquares.length > 0 && (
                <div className="text-right">
                  <div className="text-gray-500 text-xs">{selectedSquares.length} × ${squarePrice}</div>
                  <div className="text-xl font-bold text-[#232842]">${selectionTotal}</div>
                </div>
              )}
            </div>
          </div>

          {/* Checkout */}
          <div className="flex items-center">
            <Link
              href={selectedSquares.length > 0 ? "/payment" : "#"}
              onClick={(e) => {
                if (selectedSquares.length === 0) { e.preventDefault(); return; }
                sessionStorage.setItem('selectedSquares', JSON.stringify(selectedSquares.map(s => s.id)));
              }}
              className={`w-full py-4 rounded-xl font-bold text-lg text-center block transition-colors ${
                selectedSquares.length > 0
                  ? 'bg-[#d4af37] text-[#232842] hover:bg-[#c49b2f] shadow-lg'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {selectedSquares.length > 0 ? `Checkout - $${selectionTotal}` : 'Select squares to continue'}
            </Link>
          </div>
        </div>

        {/* Charity Note */}
        <div className="text-center text-sm text-gray-500 mt-4">
          100% of proceeds benefit the Michael Williams Memorial Scholarship Fund
        </div>
      </main>
    </div>
  );
}
