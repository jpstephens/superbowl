'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import PoolGrid from '@/components/PoolGrid';
import type { GridSquare, GameState, QuarterWinner } from '@/lib/supabase/types';
import Link from 'next/link';
import Header from '@/components/Header';
import LiveScoreBanner from '@/components/LiveScoreBanner';

interface QuarterWinnerWithProfile extends QuarterWinner {
  profiles?: { name: string } | null;
}

export default function GridPage() {
  const [selectedSquares, setSelectedSquares] = useState<GridSquare[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [stats, setStats] = useState({ sold: 0, available: 100 });
  const [poolActive, setPoolActive] = useState<boolean>(true);
  const [squarePrice, setSquarePrice] = useState<number>(50);
  const [tournamentLaunched, setTournamentLaunched] = useState<boolean>(false);
  const [prizes, setPrizes] = useState({ q1: 1000, q2: 1000, q3: 1000, q4: 2000 });
  const [quarterWinners, setQuarterWinners] = useState<QuarterWinnerWithProfile[]>([]);
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
        .in('key', ['pool_active', 'square_price', 'tournament_launched', 'payout_q1', 'payout_q2', 'payout_q3', 'payout_q4']);

      if (settings) {
        const poolSetting = settings.find(s => s.key === 'pool_active');
        const priceSetting = settings.find(s => s.key === 'square_price');
        const launchSetting = settings.find(s => s.key === 'tournament_launched');
        const q1Setting = settings.find(s => s.key === 'payout_q1');
        const q2Setting = settings.find(s => s.key === 'payout_q2');
        const q3Setting = settings.find(s => s.key === 'payout_q3');
        const q4Setting = settings.find(s => s.key === 'payout_q4');

        if (poolSetting) setPoolActive(poolSetting.value === 'true');
        if (priceSetting?.value) setSquarePrice(parseFloat(priceSetting.value) || 50);
        if (launchSetting) setTournamentLaunched(launchSetting.value === 'true');

        setPrizes({
          q1: q1Setting?.value ? parseFloat(q1Setting.value) : 1000,
          q2: q2Setting?.value ? parseFloat(q2Setting.value) : 1000,
          q3: q3Setting?.value ? parseFloat(q3Setting.value) : 1000,
          q4: q4Setting?.value ? parseFloat(q4Setting.value) : 2000,
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

      const sold = allSquares?.filter(s => s.status === 'paid').length || 0;
      setStats({ sold, available: 100 - sold });

      // Load quarter winners
      const { data: winners } = await supabase
        .from('quarterly_winners')
        .select('*, profiles:user_id(name)')
        .order('quarter', { ascending: true });

      if (winners) setQuarterWinners(winners);
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quarterly_winners' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_state' }, () => loadData())
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

  const getQuarterWinner = (quarter: number) => {
    return quarterWinners.find(w => w.quarter === quarter);
  };

  const totalPrizePool = useMemo(() => prizes.q1 + prizes.q2 + prizes.q3 + prizes.q4, [prizes]);
  const selectionTotal = useMemo(() => selectedSquares.length * squarePrice, [selectedSquares.length, squarePrice]);
  const isLive = gameState?.is_live || false;
  const isFinal = gameState?.is_final || false;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Info Bar - Hide countdown when game is live */}
      {!isLive && !isFinal && (
        <div className="bg-gradient-to-b from-gray-50 to-gray-100 border-b border-gray-200 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5">
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12">
              {/* Countdown */}
              {countdown && (
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
      )}

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

      {/* Main Content - Two Column Layout */}
      <main className="flex-1 pb-28 lg:pb-4">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Column - Grid */}
            <div className="flex-shrink-0 flex justify-center lg:justify-start">
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

            {/* Right Column - Info Cards */}
            <div className="flex-1 space-y-3 min-w-0 lg:max-w-[340px]">

              {/* Desktop Checkout - Primary CTA at top */}
              {!isLive && !isFinal && (
                <div className="hidden lg:block bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-[#232842] to-[#1a1f35] px-4 py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-semibold">Your Squares</span>
                      <span className="text-white/60 text-sm">${squarePrice} each</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    {selectedSquares.length === 0 ? (
                      <div className="text-center py-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                        <p className="text-gray-500 text-sm">Click squares on the grid to add them</p>
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {selectedSquares.map((square) => {
                            const boxNum = square.row_number * 10 + square.col_number + 1;
                            return (
                              <span key={square.id} className="w-10 h-10 bg-gradient-to-br from-[#cda33b] to-[#b8960c] rounded-lg text-white font-bold text-sm flex items-center justify-center shadow-sm">
                                {boxNum}
                              </span>
                            );
                          })}
                        </div>
                        <div className="border-t border-gray-100 pt-4">
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-gray-600">{selectedSquares.length} square{selectedSquares.length !== 1 ? 's' : ''}</span>
                            <span className="text-3xl font-bold text-[#232842]">${selectionTotal}</span>
                          </div>
                        </div>
                      </>
                    )}
                    <Link
                      href={selectedSquares.length > 0 ? "/payment" : "#"}
                      onClick={(e) => {
                        if (selectedSquares.length === 0) { e.preventDefault(); return; }
                        sessionStorage.setItem('selectedSquares', JSON.stringify(selectedSquares));
                      }}
                      className={`block w-full py-3.5 rounded-xl font-bold text-center transition-all duration-200 ${
                        selectedSquares.length > 0
                          ? 'bg-gradient-to-r from-[#cda33b] to-[#b8960c] text-white shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {selectedSquares.length > 0 ? `Checkout · $${selectionTotal}` : 'Select Squares to Begin'}
                    </Link>
                  </div>
                </div>
              )}

              {/* Prize Pool / Winners */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-amber-50 rounded-xl flex items-center justify-center">
                    <span className="text-xl">🏆</span>
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#232842]">
                      {isLive || isFinal ? 'Quarter Winners' : 'Prize Pool'}
                    </h2>
                    <p className="text-2xl font-bold text-[#cda33b]">${totalPrizePool.toLocaleString()}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {/* Q1 */}
                  {(() => {
                    const winner = getQuarterWinner(1);
                    return (
                      <div className={`flex items-center justify-between py-2 px-3 rounded-lg ${winner ? 'bg-green-50 border border-green-200' : 'border-b border-gray-50'}`}>
                        <div>
                          <span className="text-gray-500 text-sm">End of Q1</span>
                          {winner && (
                            <p className="text-green-700 font-semibold text-sm">{winner.profiles?.name || 'Winner'}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className={`font-semibold ${winner ? 'text-green-600' : 'text-[#232842]'}`}>${prizes.q1.toLocaleString()}</span>
                          {winner && <p className="text-xs text-green-600">{winner.row_score}-{winner.col_score}</p>}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Q2 */}
                  {(() => {
                    const winner = getQuarterWinner(2);
                    return (
                      <div className={`flex items-center justify-between py-2 px-3 rounded-lg ${winner ? 'bg-green-50 border border-green-200' : 'border-b border-gray-50'}`}>
                        <div>
                          <span className="text-gray-500 text-sm">Halftime</span>
                          {winner && (
                            <p className="text-green-700 font-semibold text-sm">{winner.profiles?.name || 'Winner'}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className={`font-semibold ${winner ? 'text-green-600' : 'text-[#232842]'}`}>${prizes.q2.toLocaleString()}</span>
                          {winner && <p className="text-xs text-green-600">{winner.row_score}-{winner.col_score}</p>}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Q3 */}
                  {(() => {
                    const winner = getQuarterWinner(3);
                    return (
                      <div className={`flex items-center justify-between py-2 px-3 rounded-lg ${winner ? 'bg-green-50 border border-green-200' : 'border-b border-gray-50'}`}>
                        <div>
                          <span className="text-gray-500 text-sm">End of Q3</span>
                          {winner && (
                            <p className="text-green-700 font-semibold text-sm">{winner.profiles?.name || 'Winner'}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className={`font-semibold ${winner ? 'text-green-600' : 'text-[#232842]'}`}>${prizes.q3.toLocaleString()}</span>
                          {winner && <p className="text-xs text-green-600">{winner.row_score}-{winner.col_score}</p>}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Q4 / Final */}
                  {(() => {
                    const winner = getQuarterWinner(4);
                    return (
                      <div className={`flex items-center justify-between py-2 px-3 rounded-lg ${winner ? 'bg-gradient-to-r from-[#cda33b]/20 to-[#cda33b]/10 border border-[#cda33b]/30' : 'bg-gradient-to-r from-[#cda33b]/10 to-transparent'}`}>
                        <div>
                          <span className="font-semibold text-[#232842]">Final Score</span>
                          {winner && (
                            <p className="text-[#cda33b] font-semibold text-sm">{winner.profiles?.name || 'Winner'}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className={`font-bold text-lg ${winner ? 'text-[#cda33b]' : 'text-[#cda33b]'}`}>${prizes.q4.toLocaleString()}</span>
                          {winner && <p className="text-xs text-[#cda33b]">{winner.row_score}-{winner.col_score}</p>}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* How to Play - Collapsed by default, hide when game is live */}
              {!isLive && !isFinal && (
                <details className="bg-white rounded-2xl shadow-sm border border-gray-100 group">
                  <summary className="px-4 py-3 cursor-pointer flex items-center justify-between list-none">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                        <span className="text-base">📖</span>
                      </div>
                      <span className="font-semibold text-[#232842]">How to Play</span>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="px-4 pb-4 pt-1 space-y-3 text-sm border-t border-gray-50 mt-1">
                    <div className="flex gap-3 items-start">
                      <span className="flex-shrink-0 w-6 h-6 bg-[#232842] text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                      <div>
                        <p className="font-medium text-[#232842]">Pick your squares</p>
                        <p className="text-gray-500 text-xs">Click any green square on the grid</p>
                      </div>
                    </div>
                    <div className="flex gap-3 items-start">
                      <span className="flex-shrink-0 w-6 h-6 bg-[#232842] text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                      <div>
                        <p className="font-medium text-[#232842]">Pay ${squarePrice} per square</p>
                        <p className="text-gray-500 text-xs">Credit card accepted</p>
                      </div>
                    </div>
                    <div className="flex gap-3 items-start">
                      <span className="flex-shrink-0 w-6 h-6 bg-[#232842] text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                      <div>
                        <p className="font-medium text-[#232842]">Numbers revealed</p>
                        <p className="text-gray-500 text-xs">Random 0-9 assigned before kickoff</p>
                      </div>
                    </div>
                    <div className="flex gap-3 items-start">
                      <span className="flex-shrink-0 w-6 h-6 bg-[#cda33b] text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                      <div>
                        <p className="font-medium text-[#232842]">Win prizes!</p>
                        <p className="text-gray-500 text-xs">Match last digit of each team&apos;s score</p>
                      </div>
                    </div>
                  </div>
                </details>
              )}

              {/* Scholarship Banner */}
              <Link href="/about" className="block bg-gradient-to-br from-[#232842] to-[#1a1f35] rounded-2xl p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">💛</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">
                      <span className="text-[#cda33b]">100%</span> goes to scholarship
                    </p>
                    <p className="text-white/50 text-xs truncate">Michael Williams Memorial Fund</p>
                  </div>
                  <svg className="w-5 h-5 text-white/40 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Sticky Checkout Footer - Mobile Only, hide when game is live */}
      {!isLive && !isFinal && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-50">
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
      )}
    </div>
  );
}
