'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { GridSquare, GameState, QuarterWinner } from '@/lib/supabase/types';
import { motion } from 'framer-motion';
import {
  Grid3x3, Trophy, Target, DollarSign,
  ArrowRight, CreditCard, Receipt
} from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';

// Type for purchase history with joined squares
// Note: Supabase returns nested relations as arrays
interface PurchaseSquare {
  id: string;
  row_number: number;
  col_number: number;
  row_score: number | null;
  col_score: number | null;
}

interface PurchaseWithSquares {
  id: string;
  amount: number;
  base_amount: number | null;
  fee_donation: number | null;
  method: 'stripe' | 'venmo';
  status: string;
  created_at: string;
  purchase_squares: {
    square: PurchaseSquare | PurchaseSquare[];
  }[];
}

/**
 * User Dashboard - Personal Hub
 * Shows: My squares, My wins, Purchase history
 */
export default function DashboardPage() {
  const [userSquares, setUserSquares] = useState<GridSquare[]>([]);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [quarterWinners, setQuarterWinners] = useState<QuarterWinner[]>([]);
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseWithSquares[]>([]);
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

        // Load purchase history with squares
        const { data: purchases } = await supabase
          .from('payments')
          .select(`
            id,
            amount,
            base_amount,
            fee_donation,
            method,
            status,
            created_at,
            purchase_squares (
              square:grid_squares (
                id,
                row_number,
                col_number,
                row_score,
                col_score
              )
            )
          `)
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false });

        if (purchases) setPurchaseHistory(purchases as PurchaseWithSquares[]);
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
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

  // Calculate stats
  const totalInvested = userSquares.length * 50;
  const myWins = quarterWinners.filter(w =>
    userSquares.some(s => s.row_score === w.row_score && s.col_score === w.col_score)
  ).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-[#cda33b] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Page Title */}
        <h1 className="text-2xl font-bold text-[#232842] mb-6">My Dashboard</h1>
        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <Grid3x3 className="w-6 h-6 text-[#cda33b]" />
              <div className="text-3xl font-bold text-[#232842]">{userSquares.length}</div>
            </div>
            <div className="text-base text-gray-500 font-medium">My Squares</div>
          </div>

          <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-6 h-6 text-[#cda33b]" />
              <div className="text-3xl font-bold text-[#232842]">{myWins}</div>
            </div>
            <div className="text-base text-gray-500 font-medium">Quarter Wins</div>
          </div>

          <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-6 h-6 text-[#cda33b]" />
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
                <Link href="/" className="flex items-center gap-2 text-[#cda33b] font-semibold hover:text-[#c39931] transition-colors">
                  Buy More
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {userSquares.length === 0 ? (
                <div className="text-center py-12">
                  <Grid3x3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-4">No squares yet</p>
                  <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-[#cda33b] text-white rounded-xl font-bold hover:bg-[#dfc06a] transition-colors shadow-md">
                    Pick Your Squares
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-5 gap-3">
                  {userSquares.slice(0, 10).map(square => (
                    <div
                      key={square.id}
                      className="aspect-square bg-[#cda33b]/10 rounded-lg flex flex-col items-center justify-center border-2 border-[#cda33b]/30"
                    >
                      <div className="text-base font-bold text-[#cda33b]">
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

            {/* Purchase History */}
            <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-md mt-6">
              <div className="flex items-center gap-2 mb-6">
                <Receipt className="w-6 h-6 text-[#cda33b]" />
                <h2 className="text-2xl font-bold text-[#232842]">Purchase History</h2>
              </div>

              {purchaseHistory.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No purchases yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {purchaseHistory.map((purchase) => (
                    <div
                      key={purchase.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-[#cda33b]/50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="font-semibold text-[#232842]">
                            {new Date(purchase.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              purchase.method === 'stripe'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-teal-100 text-teal-700'
                            }`}>
                              {purchase.method === 'stripe' ? 'Card' : 'Venmo'}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              purchase.status === 'confirmed'
                                ? 'bg-green-100 text-green-700'
                                : purchase.status === 'completed'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {purchase.status}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg text-[#232842]">
                            ${Number(purchase.amount).toFixed(2)}
                          </div>
                          {purchase.fee_donation && Number(purchase.fee_donation) > 0 && (
                            <div className="text-xs text-green-600">
                              +${Number(purchase.fee_donation).toFixed(2)} fee covered
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Squares in this purchase */}
                      {purchase.purchase_squares && purchase.purchase_squares.length > 0 && (
                        <div className="pt-3 border-t border-gray-100">
                          <div className="text-xs text-gray-500 mb-2">
                            {purchase.purchase_squares.length} square{purchase.purchase_squares.length !== 1 ? 's' : ''} purchased
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {purchase.purchase_squares.map(({ square }, idx) => {
                              // Handle both array and single object from Supabase
                              const sq = Array.isArray(square) ? square[0] : square;
                              if (!sq) return null;
                              return (
                                <div
                                  key={sq.id || idx}
                                  className="px-2 py-1 bg-[#cda33b]/10 text-[#cda33b] rounded text-xs font-medium"
                                >
                                  [{sq.row_number},{sq.col_number}]
                                  {sq.row_score !== null && (
                                    <span className="text-gray-500 ml-1">
                                      ({sq.row_score}-{sq.col_score})
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
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
                  <Trophy className="w-5 h-5 text-[#cda33b]" />
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
                          isMyWin ? 'bg-[#cda33b]/10 border-2 border-[#cda33b]' : 'bg-gray-50 border border-gray-200'
                        }`}
                      >
                        <div className="font-semibold text-base text-[#232842]">
                          Q{winner.quarter} Winner
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {winner.row_score}-{winner.col_score}
                        </div>
                        {isMyWin && (
                          <div className="text-sm text-[#cda33b] font-bold mt-1">
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
                <Link href="/" className="flex items-center gap-3 w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-[#232842] font-medium hover:bg-gray-100 transition-colors">
                  <Grid3x3 className="w-5 h-5 text-[#cda33b]" />
                  Buy More Squares
                </Link>
                <Link href="/my-squares" className="flex items-center gap-3 w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-[#232842] font-medium hover:bg-gray-100 transition-colors">
                  <Target className="w-5 h-5 text-[#cda33b]" />
                  View My Squares
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
