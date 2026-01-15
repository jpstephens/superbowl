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
      <div className="bg-gradient-to-b from-gray-50 to-gray-100 border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12">
            {/* Countdown - hidden when game is live */}
            {countdown && !isLive && (
              <div className="flex items-center gap-4">
                <span className="text-gray-600 font-semibold text-sm uppercase tracking-wide">Kickoff</span>
                <div className="flex items-center gap-2">
                  <div className="bg-gradient-to-br from-[#232842] to-[#1a1f35] text-white px-4 py-2 rounded-xl shadow-md">
                    <span className="text-2xl font-bold tabular-nums">{countdown.days}</span>
                    <span className="text-xs ml-1 opacity-80">d</span>
                  </div>
                  <span className="text-gray-400 font-bold">:</span>
                  <div className="bg-gradient-to-br from-[#232842] to-[#1a1f35] text-white px-4 py-2 rounded-xl shadow-md">
                    <span className="text-2xl font-bold tabular-nums">{countdown.hours}</span>
                    <span className="text-xs ml-1 opacity-80">h</span>
                  </div>
                  <span className="text-gray-400 font-bold">:</span>
                  <div className="bg-gradient-to-br from-[#232842] to-[#1a1f35] text-white px-4 py-2 rounded-xl shadow-md">
                    <span className="text-2xl font-bold tabular-nums">{countdown.mins}</span>
                    <span className="text-xs ml-1 opacity-80">m</span>
                  </div>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center gap-8">
              <div className="text-center bg-white px-5 py-3 rounded-xl shadow-sm border border-gray-100">
                <div className="text-3xl font-bold text-emerald-500">{stats.available}</div>
                <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">available</div>
              </div>
              <div className="text-center bg-white px-5 py-3 rounded-xl shadow-sm border border-gray-100">
                <div className="text-3xl font-bold text-[#cda33b]">${squarePrice}</div>
                <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">per square</div>
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

      {/* Main Content - Grid Focused */}
      <main className="flex-1 px-2 py-4 pb-32">
        <div className="flex justify-center">
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

        {/* Prize Pool & How to Play */}
        <div className="max-w-4xl mx-auto mt-8 px-4 space-y-6">
          {/* Prize Pool */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-[#232842] mb-4 flex items-center gap-2">
              <span className="text-2xl">🏆</span> Prize Pool — ${totalPrizePool.toLocaleString()}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <div className="text-sm text-gray-500 font-medium mb-1">Q1</div>
                <div className="text-2xl font-bold text-[#232842]">${prizes.q1}</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <div className="text-sm text-gray-500 font-medium mb-1">Halftime</div>
                <div className="text-2xl font-bold text-[#cda33b]">${prizes.q2}</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <div className="text-sm text-gray-500 font-medium mb-1">Q3</div>
                <div className="text-2xl font-bold text-[#232842]">${prizes.q3}</div>
              </div>
              <div className="bg-gradient-to-br from-[#cda33b] to-[#b8960c] rounded-xl p-4 text-center">
                <div className="text-sm text-white/80 font-medium mb-1">Final</div>
                <div className="text-2xl font-bold text-white">${prizes.q4}</div>
              </div>
            </div>
          </div>

          {/* How to Play */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-[#232842] mb-4 flex items-center gap-2">
              <span className="text-2xl">📋</span> How to Play
            </h2>
            <div className="space-y-3 text-gray-600">
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-[#cda33b] text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                <p><strong>Pick your squares</strong> — Tap any available square on the grid to select it. You can choose as many as you want.</p>
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-[#cda33b] text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                <p><strong>Complete payment</strong> — Each square is ${squarePrice}. Pay securely with credit card or Venmo.</p>
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-[#cda33b] text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                <p><strong>Numbers assigned</strong> — Before kickoff, random numbers (0-9) are assigned to each row and column.</p>
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-[#cda33b] text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
                <p><strong>Win prizes</strong> — If your square matches the last digit of each team&apos;s score at the end of Q1, halftime, Q3, or the final, you win!</p>
              </div>
            </div>
            <div className="mt-4 p-4 bg-[#232842]/5 rounded-xl">
              <p className="text-sm text-gray-500">
                <strong className="text-[#232842]">100% of proceeds</strong> benefit the Michael Williams Memorial Scholarship Fund.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Sticky Checkout Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          {/* Selection Info */}
          <div className="flex items-center gap-4">
            {selectedSquares.length === 0 ? (
              <div className="flex items-center gap-2 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
                <span className="font-medium">Tap squares to select</span>
              </div>
            ) : (
              <>
                <div className="flex gap-1.5">
                  {selectedSquares.slice(0, 5).map((square) => {
                    const boxNum = square.row_number * 10 + square.col_number + 1;
                    return (
                      <span key={square.id} className="w-9 h-9 bg-gradient-to-br from-[#cda33b] to-[#b8960c] rounded-lg text-white font-bold text-sm flex items-center justify-center shadow-sm">
                        {boxNum}
                      </span>
                    );
                  })}
                  {selectedSquares.length > 5 && (
                    <span className="w-9 h-9 bg-gray-100 rounded-lg text-gray-600 font-bold text-sm flex items-center justify-center">
                      +{selectedSquares.length - 5}
                    </span>
                  )}
                </div>
                <div className="text-right pl-2 border-l border-gray-200">
                  <div className="text-xs text-gray-500 font-medium">{selectedSquares.length} × ${squarePrice}</div>
                  <div className="text-2xl font-bold text-[#232842]">${selectionTotal}</div>
                </div>
              </>
            )}
          </div>

          {/* Checkout Button */}
          <Link
            href={selectedSquares.length > 0 ? "/payment" : "#"}
            onClick={(e) => {
              if (selectedSquares.length === 0) { e.preventDefault(); return; }
              sessionStorage.setItem('selectedSquares', JSON.stringify(selectedSquares));
            }}
            className={`px-8 py-3.5 rounded-xl font-bold text-lg transition-all duration-200 ${
              selectedSquares.length > 0
                ? 'bg-gradient-to-r from-[#cda33b] to-[#b8960c] text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {selectedSquares.length > 0 ? `Checkout · $${selectionTotal}` : 'Select squares'}
          </Link>
        </div>
      </div>
    </div>
  );
}
