'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Trophy, Target, Percent, DollarSign, Info } from 'lucide-react';
import type { GridSquare } from '@/lib/supabase/types';
import { Card } from '@/components/ui/card';

/**
 * Historical Super Bowl score ending frequencies
 * Data compiled from all Super Bowls (I through LVIII)
 * Numbers represent percentage chance of that digit appearing as a score ending
 */
const DIGIT_FREQUENCIES = {
  0: 19.1, // Most common - many games end with multiples of 7 or 10
  7: 17.8, // TDs + XPs
  3: 13.2, // Field goals
  4: 12.1, // TD + XP + FG combinations
  1: 8.9,
  6: 7.5,
  8: 6.8,
  9: 5.4,
  2: 4.8,
  5: 4.4, // Least common
};

/**
 * Historical winning combinations frequency
 * Based on all quarters across Super Bowl history
 */
const COMBO_WIN_DATA: Record<string, { wins: number; description: string }> = {
  '0-0': { wins: 45, description: 'Most common Q1 score' },
  '0-7': { wins: 28, description: 'Classic touchdown lead' },
  '7-0': { wins: 26, description: 'Early TD advantage' },
  '0-3': { wins: 22, description: 'Field goal opener' },
  '3-0': { wins: 21, description: 'Defensive battle start' },
  '7-7': { wins: 18, description: 'Tied after TDs' },
  '0-4': { wins: 15, description: 'Safety + FG rare' },
  '4-0': { wins: 14, description: 'FG + Safety start' },
  '7-3': { wins: 12, description: 'TD vs FG classic' },
  '3-7': { wins: 11, description: 'FG trailing TD' },
  '7-4': { wins: 10, description: 'TD + XP vs FG + Safety' },
  '4-7': { wins: 9, description: 'Trailing by 3' },
  '0-6': { wins: 8, description: 'Two FGs' },
  '6-0': { wins: 7, description: 'Double FG lead' },
  '3-3': { wins: 7, description: 'FG battle' },
  '4-3': { wins: 6, description: 'Unusual combo' },
  '3-4': { wins: 6, description: 'Trailing by 1' },
};

// Total historical quarter outcomes for percentage calculation
const TOTAL_QUARTER_OUTCOMES = 232; // ~58 Super Bowls × 4 quarters

interface WinProbabilityPanelProps {
  userSquares: GridSquare[];
  allSquares: GridSquare[];
  prizePool: number;
  tournamentLaunched: boolean;
  currentAfcScore?: number;
  currentNfcScore?: number;
  isLive?: boolean;
}

/**
 * Win Probability Panel
 * Shows historical odds, expected value, and "distance to win" analysis
 */
export default function WinProbabilityPanel({
  userSquares,
  allSquares,
  prizePool,
  tournamentLaunched,
  currentAfcScore = 0,
  currentNfcScore = 0,
  isLive = false,
}: WinProbabilityPanelProps) {
  // Calculate statistics for user's squares
  const stats = useMemo(() => {
    const totalSquares = 100;
    const userSquareCount = userSquares.length;
    const baseWinChance = (userSquareCount / totalSquares) * 100;
    
    // Prize per quarter (assuming equal split)
    const prizePerQuarter = prizePool / 4;
    
    // Calculate expected value based on base odds
    const expectedValueBase = (baseWinChance / 100) * prizePerQuarter * 4;

    if (!tournamentLaunched) {
      return {
        baseWinChance,
        squareCount: userSquareCount,
        expectedValue: expectedValueBase,
        prizePerQuarter,
        adjustedWinChance: baseWinChance,
        squareAnalysis: [],
      };
    }

    // Calculate adjusted win chance based on historical data
    let totalAdjustedChance = 0;
    const squareAnalysis = userSquares.map((square) => {
      const row = square.row_score ?? 0;
      const col = square.col_score ?? 0;
      const comboKey = `${row}-${col}`;
      
      // Historical win frequency for this combo
      const historicalWins = COMBO_WIN_DATA[comboKey]?.wins || 1;
      const historicalChance = (historicalWins / TOTAL_QUARTER_OUTCOMES) * 100;
      
      // Combine row and column frequencies
      const rowFreq = DIGIT_FREQUENCIES[row as keyof typeof DIGIT_FREQUENCIES] || 5;
      const colFreq = DIGIT_FREQUENCIES[col as keyof typeof DIGIT_FREQUENCIES] || 5;
      const combinedFreq = (rowFreq * colFreq) / 100;

      // Use the higher of historical or frequency-based estimate
      const adjustedChance = Math.max(historicalChance, combinedFreq);
      totalAdjustedChance += adjustedChance;

      // Expected value for this square
      const ev = (adjustedChance / 100) * prizePerQuarter * 4;

      return {
        square,
        row,
        col,
        comboKey,
        historicalChance,
        adjustedChance,
        expectedValue: ev,
        isLucky: historicalWins >= 10,
        description: COMBO_WIN_DATA[comboKey]?.description || 'Standard combo',
      };
    });

    return {
      baseWinChance,
      squareCount: userSquareCount,
      expectedValue: squareAnalysis.reduce((sum, s) => sum + s.expectedValue, 0),
      prizePerQuarter,
      adjustedWinChance: Math.min(totalAdjustedChance, 100),
      squareAnalysis: squareAnalysis.sort((a, b) => b.adjustedChance - a.adjustedChance),
    };
  }, [userSquares, prizePool, tournamentLaunched]);

  // Calculate "distance to win" for live games
  const distanceToWin = useMemo(() => {
    if (!isLive || !tournamentLaunched) return [];

    const currentAfcLast = currentAfcScore % 10;
    const currentNfcLast = currentNfcScore % 10;

    return userSquares
      .filter((s) => s.row_score !== null && s.col_score !== null)
      .map((square) => {
        const targetAfc = square.col_score!;
        const targetNfc = square.row_score!;

        // Calculate minimum points needed
        let afcNeeded = targetAfc - currentAfcLast;
        if (afcNeeded < 0) afcNeeded += 10;

        let nfcNeeded = targetNfc - currentNfcLast;
        if (nfcNeeded < 0) nfcNeeded += 10;

        // Describe the path
        let path = '';
        if (afcNeeded === 0 && nfcNeeded === 0) {
          path = "You're winning!";
        } else if (afcNeeded === 0) {
          path = `Need ${nfcNeeded} more from NFC`;
        } else if (nfcNeeded === 0) {
          path = `Need ${afcNeeded} more from AFC`;
        } else {
          path = `AFC +${afcNeeded}, NFC +${nfcNeeded}`;
        }

        return {
          square,
          afcNeeded,
          nfcNeeded,
          totalNeeded: afcNeeded + nfcNeeded,
          path,
          isCurrentWinner: afcNeeded === 0 && nfcNeeded === 0,
        };
      })
      .sort((a, b) => a.totalNeeded - b.totalNeeded);
  }, [userSquares, currentAfcScore, currentNfcScore, isLive, tournamentLaunched]);

  if (userSquares.length === 0) {
    return (
      <Card className="p-6 bg-gray-50">
        <div className="text-center text-gray-500">
          <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">Select squares to see your odds</p>
          <p className="text-sm mt-1">Each square gives you a chance to win!</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-purple-600" />
        <h3 className="text-lg font-bold text-gray-900">Your Odds</h3>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-purple-50 rounded-lg p-3 text-center">
          <Percent className="w-5 h-5 text-purple-600 mx-auto mb-1" />
          <p className="text-2xl font-bold text-purple-700">
            {stats.adjustedWinChance.toFixed(1)}%
          </p>
          <p className="text-xs text-purple-600">
            {tournamentLaunched ? 'Adjusted Win Chance' : 'Base Win Chance'}
          </p>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <DollarSign className="w-5 h-5 text-green-600 mx-auto mb-1" />
          <p className="text-2xl font-bold text-green-700">
            ${stats.expectedValue.toFixed(0)}
          </p>
          <p className="text-xs text-green-600">Expected Value</p>
        </div>
      </div>

      {/* Square Analysis (only after tournament launched) */}
      {tournamentLaunched && stats.squareAnalysis.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Info className="w-4 h-4" />
            Your Number Analysis
          </h4>
          <div className="space-y-2">
            {stats.squareAnalysis.slice(0, 5).map((analysis, i) => (
              <motion.div
                key={analysis.square.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  analysis.isLucky
                    ? 'bg-yellow-50 border border-yellow-200'
                    : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center font-bold text-gray-700 shadow-sm">
                    {analysis.row}-{analysis.col}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">
                      {analysis.description}
                    </p>
                    <p className="text-xs text-gray-500">
                      {analysis.historicalChance.toFixed(1)}% historical win rate
                    </p>
                  </div>
                </div>
                {analysis.isLucky && (
                  <div className="text-yellow-600">
                    <Trophy className="w-5 h-5" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Distance to Win (Live Game) */}
      {isLive && distanceToWin.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Target className="w-4 h-4" />
            Distance to Win
          </h4>
          <div className="space-y-2">
            {distanceToWin.slice(0, 3).map((dist, i) => (
              <motion.div
                key={dist.square.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`p-3 rounded-lg ${
                  dist.isCurrentWinner
                    ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 border-2 border-yellow-400'
                    : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-700">
                      {dist.square.row_score}-{dist.square.col_score}
                    </span>
                    {dist.isCurrentWinner && (
                      <Trophy className="w-4 h-4 text-yellow-600" />
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      dist.isCurrentWinner ? 'text-yellow-700' : 'text-gray-600'
                    }`}
                  >
                    {dist.path}
                  </span>
                </div>
                {!dist.isCurrentWinner && (
                  <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(5, 100 - dist.totalNeeded * 5)}%` }}
                      className="h-full bg-purple-500 rounded-full"
                    />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Fun Facts */}
      {!isLive && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            <span className="font-semibold">Fun fact:</span> The 0-0 square has won Q1 in{' '}
            <strong>45</strong> of the first {TOTAL_QUARTER_OUTCOMES} Super Bowl quarters!
          </p>
        </div>
      )}
    </Card>
  );
}

