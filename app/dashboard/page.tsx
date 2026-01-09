'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { GridSquare, PropAnswer, PropBet, GameState, QuarterWinner } from '@/lib/supabase/types';
import { motion } from 'framer-motion';
import { 
  Grid3x3, Trophy, Target, TrendingUp, DollarSign, 
  ArrowRight, Clock, CheckCircle2, XCircle, Activity
} from 'lucide-react';
import Link from 'next/link';

/**
 * User Dashboard - Personal Hub
 * Shows: My squares, My props, My wins, Activity
 */
export default function DashboardPage() {
  const [userSquares, setUserSquares] = useState<GridSquare[]>([]);
  const [myPropAnswers, setMyPropAnswers] = useState<(PropAnswer & { prop?: PropBet })[]>([]);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [quarterWinners, setQuarterWinners] = useState<QuarterWinner[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    setupRealtime();
  }, []);

  const loadData = async () => {
    try {
      const supabase = createClient();
      
      // Get user profile (bypass auth for now)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      const profile = profiles?.[0];
      if (profile) {
        setUserId(profile.id);
        
        // Load user squares
        const { data: squares } = await supabase
          .from('grid_squares')
          .select('*')
          .eq('user_id', profile.id)
          .in('status', ['paid', 'confirmed']);
        
        if (squares) setUserSquares(squares);

        // Load user prop answers
        const { data: answers } = await supabase
          .from('prop_answers')
          .select('*, prop:prop_bets(*)')
          .eq('user_id', profile.id);
        
        if (answers) setMyPropAnswers(answers);
      }

      // Load game state
      const { data: gameData } = await supabase
        .from('game_state')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
      
      if (gameData) setGameState(gameData);

      // Load quarter winners
      const { data: winners } = await supabase
        .from('quarterly_winners')
        .select('*')
        .order('quarter', { ascending: true });
      
      if (winners) setQuarterWinners(winners);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtime = () => {
    const supabase = createClient();
    
    const channel = supabase
      .channel('dashboard_updates')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'grid_squares' },
        () => loadData()
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'prop_answers' },
        () => loadData()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

  // Calculate stats
  const totalInvested = userSquares.length * 50;
  const propCorrect = myPropAnswers.filter(a => a.is_correct === true).length;
  const propTotal = myPropAnswers.length;
  const myWins = quarterWinners.filter(w => 
    userSquares.some(s => s.row_score === w.row_score && s.col_score === w.col_score)
  ).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#232842] border-b border-[#1a1f33] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">My Dashboard</h1>
          <nav className="flex items-center gap-1">
            <Link href="/" className="px-4 py-2 text-base font-medium text-gray-300 hover:text-white transition-colors">
              Home
            </Link>
            <Link href="/grid" className="px-4 py-2 text-base font-medium text-gray-300 hover:text-white transition-colors">
              Grid
            </Link>
            <Link href="/props" className="px-4 py-2 text-base font-medium text-gray-300 hover:text-white transition-colors">
              Props
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <Grid3x3 className="w-6 h-6 text-[#d4af37]" />
              <div className="text-3xl font-bold text-[#232842]">{userSquares.length}</div>
            </div>
            <div className="text-base text-gray-500 font-medium">My Squares</div>
          </div>

          <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-6 h-6 text-[#d4af37]" />
              <div className="text-3xl font-bold text-[#232842]">{propTotal}</div>
            </div>
            <div className="text-base text-gray-500 font-medium">Prop Bets</div>
          </div>

          <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-6 h-6 text-[#d4af37]" />
              <div className="text-3xl font-bold text-[#232842]">{myWins}</div>
            </div>
            <div className="text-base text-gray-500 font-medium">Quarter Wins</div>
          </div>

          <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-6 h-6 text-[#d4af37]" />
              <div className="text-3xl font-bold text-[#232842]">${totalInvested}</div>
            </div>
            <div className="text-base text-gray-500 font-medium">Invested</div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* My Squares */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mb-6 shadow-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#232842]">My Squares</h2>
                <Link href="/grid" className="flex items-center gap-2 text-[#d4af37] font-semibold hover:text-[#c49b2f] transition-colors">
                  Buy More
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {userSquares.length === 0 ? (
                <div className="text-center py-12">
                  <Grid3x3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-4">No squares yet</p>
                  <Link href="/grid" className="inline-flex items-center gap-2 px-6 py-3 bg-[#d4af37] text-white rounded-xl font-bold hover:bg-[#e5c65c] transition-colors shadow-md">
                    Pick Your Squares
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-5 gap-3">
                  {userSquares.slice(0, 10).map(square => (
                    <div
                      key={square.id}
                      className="aspect-square bg-[#d4af37]/10 rounded-lg flex flex-col items-center justify-center border-2 border-[#d4af37]/30"
                    >
                      <div className="text-base font-bold text-[#d4af37]">
                        {square.row_number},{square.col_number}
                      </div>
                      {square.row_score !== null && (
                        <div className="text-sm text-gray-500 mt-1">
                          {square.row_score}-{square.col_score}
                        </div>
                      )}
                    </div>
                  ))}
                  {userSquares.length > 10 && (
                    <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-base font-bold text-gray-500">
                        +{userSquares.length - 10}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* My Prop Bets */}
            <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#232842]">My Prop Bets</h2>
                <Link href="/props" className="flex items-center gap-2 text-[#d4af37] font-semibold hover:text-[#c49b2f] transition-colors">
                  View All
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {myPropAnswers.length === 0 ? (
                <div className="text-center py-12">
                  <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-4">No prop bets yet</p>
                  <Link href="/props" className="inline-flex items-center gap-2 px-6 py-3 bg-[#d4af37] text-white rounded-xl font-bold hover:bg-[#e5c65c] transition-colors shadow-md">
                    Make Prop Bets
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {myPropAnswers.slice(0, 5).map(answer => (
                    <div
                      key={answer.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex-1">
                        <div className="font-semibold text-base text-[#232842]">{answer.prop?.question}</div>
                        <div className="text-sm text-gray-500 mt-1">
                          Your answer: <span className="font-medium text-[#d4af37]">{answer.answer}</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        {answer.is_correct === null ? (
                          <Clock className="w-6 h-6 text-gray-400" />
                        ) : answer.is_correct ? (
                          <CheckCircle2 className="w-6 h-6 text-green-600" />
                        ) : (
                          <XCircle className="w-6 h-6 text-red-600" />
                        )}
                      </div>
                    </div>
                  ))}
                  {myPropAnswers.length > 5 && (
                    <Link href="/props" className="block text-center text-base text-[#d4af37] font-semibold py-2 hover:text-[#c49b2f]">
                      View all {myPropAnswers.length} prop bets →
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Live Score */}
            {gameState?.is_live && (
              <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-md">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2 h-2 bg-[#ff3b30] rounded-full animate-pulse" />
                  <span className="text-[#ff3b30] font-bold text-sm">LIVE</span>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-black text-[#232842] mb-2">
                    {gameState.afc_score} - {gameState.nfc_score}
                  </div>
                  <div className="text-base text-gray-500 font-medium">
                    Q{gameState.quarter} · {gameState.time_remaining || '0:00'}
                  </div>
                </div>
              </div>
            )}

            {/* Quarter Winners */}
            {quarterWinners.length > 0 && (
              <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-md">
                <h3 className="font-bold text-lg text-[#232842] mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-[#d4af37]" />
                  Quarter Winners
                </h3>
                <div className="space-y-3">
                  {quarterWinners.map(winner => {
                    const isMyWin = userSquares.some(s =>
                      s.row_score === winner.row_score && s.col_score === winner.col_score
                    );
                    return (
                      <div
                        key={winner.id}
                        className={`p-3 rounded-lg ${
                          isMyWin ? 'bg-[#d4af37]/10 border-2 border-[#d4af37]' : 'bg-gray-50 border border-gray-200'
                        }`}
                      >
                        <div className="font-semibold text-base text-[#232842]">
                          Q{winner.quarter} Winner
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {winner.row_score}-{winner.col_score}
                        </div>
                        {isMyWin && (
                          <div className="text-sm text-[#d4af37] font-bold mt-1">
                            🎉 You won!
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-md">
              <h3 className="font-bold text-lg text-[#232842] mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link href="/grid" className="flex items-center gap-3 w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-[#232842] font-medium hover:bg-gray-100 transition-colors">
                  <Grid3x3 className="w-5 h-5 text-[#d4af37]" />
                  Buy More Squares
                </Link>
                <Link href="/props" className="flex items-center gap-3 w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-[#232842] font-medium hover:bg-gray-100 transition-colors">
                  <Target className="w-5 h-5 text-[#d4af37]" />
                  Make Prop Bets
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
