'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { GridSquare, GameState, QuarterWinner } from '@/lib/supabase/types';
import {
  Grid3x3, Trophy, DollarSign, ArrowRight,
  CreditCard, Receipt, TrendingUp, Calendar
} from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';

/**
 * User Dashboard - Personal Hub
 * Overview with links to detailed pages
 */
export default function DashboardPage() {
  const [userSquares, setUserSquares] = useState<GridSquare[]>([]);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [quarterWinners, setQuarterWinners] = useState<QuarterWinner[]>([]);
  const [purchaseHistory, setPurchaseHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const supabase = createClient();

      // Get the logged-in user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      // Get the user's profile by their email
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('email', user.email)
        .single();

      if (profile) {
        setUserName(profile.name || '');

        // Load user squares
        const { data: squares } = await supabase
          .from('grid_squares')
          .select('*')
          .eq('user_id', profile.id)
          .eq('status', 'paid');

        if (squares) setUserSquares(squares);

        // Load purchase history
        const { data: purchases } = await supabase
          .from('payments')
          .select('id, amount, method, status, created_at')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false });

        if (purchases) setPurchaseHistory(purchases);
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

  // Calculate stats
  const totalInvested = purchaseHistory.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const myWins = quarterWinners.filter(w =>
    userSquares.some(s => s.row_score === w.row_score && s.col_score === w.col_score)
  ).length;

  // Get square numbers for display
  const squareNumbers = userSquares
    .map(s => (s.row_number * 10) + s.col_number + 1)
    .sort((a, b) => a - b);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-[#cda33b] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#232842]">
            Welcome back{userName ? `, ${userName.split(' ')[0]}` : ''}!
          </h1>
          <p className="text-gray-500 mt-1">Here's your Super Bowl Pool overview</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Link href="/my-squares" className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md hover:border-[#cda33b]/50 transition-all group">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-gray-500 text-sm font-medium mb-1">
                  <Grid3x3 className="w-4 h-4" />
                  My Squares
                </div>
                <div className="text-3xl font-bold text-[#232842]">{userSquares.length}</div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-[#cda33b] transition-colors" />
            </div>
          </Link>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 text-sm font-medium mb-1">
              <Trophy className="w-4 h-4" />
              Quarter Wins
            </div>
            <div className="text-3xl font-bold text-[#232842]">{myWins}</div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 text-sm font-medium mb-1">
              <DollarSign className="w-4 h-4" />
              Total Invested
            </div>
            <div className="text-3xl font-bold text-[#cda33b]">${totalInvested.toFixed(0)}</div>
          </div>
        </div>

        {/* My Squares Summary */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#232842]">My Squares</h2>
            <Link href="/my-squares" className="text-sm text-[#cda33b] font-medium hover:underline flex items-center gap-1">
              View Details <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {userSquares.length === 0 ? (
            <div className="text-center py-8">
              <Grid3x3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">You haven't purchased any squares yet</p>
              <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#cda33b] text-white rounded-lg font-semibold hover:bg-[#b8922f] transition-colors">
                Buy Squares
              </Link>
            </div>
          ) : (
            <div>
              <div className="flex flex-wrap gap-2 mb-4">
                {squareNumbers.map(num => (
                  <span
                    key={num}
                    className="inline-flex items-center justify-center w-12 h-12 bg-[#cda33b]/10 text-[#cda33b] font-bold rounded-lg border border-[#cda33b]/30"
                  >
                    #{num}
                  </span>
                ))}
              </div>
              <Link href="/" className="text-sm text-[#cda33b] font-medium hover:underline">
                + Buy more squares
              </Link>
            </div>
          )}
        </div>

        {/* Live Score (when game is live) */}
        {gameState?.is_live && (
          <div className="bg-gradient-to-r from-[#232842] to-[#3a4063] rounded-xl p-6 mb-6 text-white">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-400 font-bold text-sm uppercase tracking-wide">Live</span>
            </div>
            <div className="text-center">
              <div className="text-5xl font-black mb-2">
                {gameState.afc_score} - {gameState.nfc_score}
              </div>
              <div className="text-white/70">
                Q{gameState.quarter} · {gameState.time_remaining || '0:00'}
              </div>
            </div>
          </div>
        )}

        {/* Quarter Winners */}
        {quarterWinners.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
            <h2 className="text-lg font-bold text-[#232842] mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#cda33b]" />
              Quarter Winners
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {quarterWinners.map(winner => {
                const isMyWin = userSquares.some(s =>
                  s.row_score === winner.row_score && s.col_score === winner.col_score
                );
                return (
                  <div
                    key={winner.id}
                    className={`p-4 rounded-lg text-center ${
                      isMyWin
                        ? 'bg-[#cda33b]/10 border-2 border-[#cda33b]'
                        : 'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div className="text-sm text-gray-500 mb-1">Q{winner.quarter}</div>
                    <div className="font-bold text-[#232842]">{winner.row_score}-{winner.col_score}</div>
                    {isMyWin && <div className="text-xs text-[#cda33b] font-bold mt-1">🎉 You won!</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Purchase History */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[#232842] mb-4 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-[#cda33b]" />
            Purchase History
          </h2>

          {purchaseHistory.length === 0 ? (
            <div className="text-center py-6">
              <CreditCard className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No purchases yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {purchaseHistory.map((purchase: any) => (
                <div
                  key={purchase.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#cda33b]/10 rounded-full flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-[#cda33b]" />
                    </div>
                    <div>
                      <div className="font-medium text-[#232842]">
                        {new Date(purchase.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-medium">
                          {purchase.method === 'stripe' ? 'Card' : 'Venmo'}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded font-medium">
                          Paid
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-lg font-bold text-[#232842]">
                    ${Number(purchase.amount).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions Footer */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Link href="/" className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#cda33b] text-white rounded-xl font-semibold hover:bg-[#b8922f] transition-colors">
            <Grid3x3 className="w-5 h-5" />
            Buy More Squares
          </Link>
          <Link href="/pool" className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#232842] text-white rounded-xl font-semibold hover:bg-[#1a1f35] transition-colors">
            <TrendingUp className="w-5 h-5" />
            View Pool Grid
          </Link>
        </div>
      </main>
    </div>
  );
}
