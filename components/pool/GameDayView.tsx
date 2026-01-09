'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Trophy,
  Target,
  Grid3x3,
  TrendingUp,
  CheckCircle,
  Circle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface GameScore {
  afcScore: number;
  nfcScore: number;
  afcTeam: string;
  nfcTeam: string;
  quarter: number;
  timeRemaining: string;
  isLive: boolean;
  isHalftime: boolean;
  isFinal: boolean;
}

interface UserSquare {
  id: string;
  row: number;
  col: number;
  rowScore: number | null;
  colScore: number | null;
}

interface QuarterWinner {
  quarter: number;
  name: string;
  prize: number;
  afcScore: number;
  nfcScore: number;
}

interface GameDayViewProps {
  gameScore: GameScore;
  userSquares: UserSquare[];
  quarterWinners: QuarterWinner[];
  prizes: {
    q1: number;
    q2: number;
    q3: number;
    q4: number;
  };
  isLoggedIn: boolean;
  userName?: string;
}

export default function GameDayView({
  gameScore,
  userSquares,
  quarterWinners,
  prizes,
  isLoggedIn,
  userName,
}: GameDayViewProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  // Calculate if user is currently winning
  const currentWinningNumbers = useMemo(() => {
    if (!gameScore.isLive && !gameScore.isFinal) return null;
    return {
      afc: gameScore.afcScore % 10,
      nfc: gameScore.nfcScore % 10,
    };
  }, [gameScore.afcScore, gameScore.nfcScore, gameScore.isLive, gameScore.isFinal]);

  const userIsWinning = useMemo(() => {
    if (!currentWinningNumbers) return false;
    return userSquares.some(
      (sq) =>
        sq.rowScore === currentWinningNumbers.afc &&
        sq.colScore === currentWinningNumbers.nfc
    );
  }, [currentWinningNumbers, userSquares]);

  // Calculate odds for remaining quarters
  const calculateOdds = (quarter: number): number => {
    if (quarter <= gameScore.quarter) return 0;
    // Each user has squareCount out of 100 chances
    const squareCount = userSquares.length;
    return (squareCount / 100) * 100; // Percentage
  };

  // Get user's winning numbers display
  const getUserNumbers = () => {
    if (userSquares.length === 0) return null;
    const uniqueRows = [...new Set(userSquares.map((s) => s.rowScore))].filter(
      (n) => n !== null
    ) as number[];
    const uniqueCols = [...new Set(userSquares.map((s) => s.colScore))].filter(
      (n) => n !== null
    ) as number[];
    return { rows: uniqueRows, cols: uniqueCols };
  };

  const userNumbers = getUserNumbers();

  // Trigger confetti when user wins
  useEffect(() => {
    if (userIsWinning) {
      setShowConfetti(true);
      const timeout = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timeout);
    }
  }, [userIsWinning]);

  const getQuarterStatus = (quarter: number) => {
    if (quarter < gameScore.quarter) return 'completed';
    if (quarter === gameScore.quarter) return 'active';
    return 'upcoming';
  };

  return (
    <div className="space-y-6">
      {/* Live Score Hero */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-secondary via-secondary/95 to-secondary/90 text-white p-6 sm:p-8"
      >
        {/* Live Indicator */}
        {gameScore.isLive && (
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span className="text-sm font-semibold text-red-400">LIVE</span>
          </div>
        )}

        {gameScore.isFinal && (
          <div className="absolute top-4 right-4">
            <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-semibold">
              FINAL
            </span>
          </div>
        )}

        <div className="text-center">
          {/* Score */}
          <div className="grid grid-cols-3 items-center gap-4 mb-6">
            <div className="text-center">
              <div className="text-sm text-white/70 mb-2">{gameScore.afcTeam}</div>
              <motion.div
                key={gameScore.afcScore}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="text-5xl sm:text-7xl font-bold"
              >
                {gameScore.afcScore}
              </motion.div>
            </div>

            <div className="text-center">
              <div className="text-2xl text-white/50">vs</div>
            </div>

            <div className="text-center">
              <div className="text-sm text-white/70 mb-2">{gameScore.nfcTeam}</div>
              <motion.div
                key={gameScore.nfcScore}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="text-5xl sm:text-7xl font-bold"
              >
                {gameScore.nfcScore}
              </motion.div>
            </div>
          </div>

          {/* Quarter and Time */}
          <div className="text-white/80">
            {gameScore.isHalftime ? (
              <span className="text-lg font-medium">Halftime</span>
            ) : gameScore.isFinal ? (
              <span className="text-lg font-medium">Final</span>
            ) : (
              <span className="text-lg">
                Q{gameScore.quarter} · {gameScore.timeRemaining}
              </span>
            )}
          </div>

          {/* Current Winning Numbers */}
          <div className="mt-6 pt-6 border-t border-white/20">
            <div className="text-sm text-white/60 mb-2">Current Winning Numbers</div>
            <div className="text-2xl font-bold text-primary">
              {currentWinningNumbers?.afc ?? '-'} - {currentWinningNumbers?.nfc ?? '-'}
            </div>
          </div>
        </div>
      </motion.div>

      {/* User Winning Alert */}
      <AnimatePresence>
        {userIsWinning && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 border-2 border-primary rounded-xl p-6 text-center"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              <Trophy className="w-12 h-12 text-primary mx-auto mb-3" fill="currentColor" />
            </motion.div>
            <h3 className="text-2xl font-bold text-foreground mb-2">
              You're Winning!
            </h3>
            <p className="text-muted-foreground">
              Your square matches the current score. Good luck!
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Your Numbers Section */}
      {isLoggedIn && userSquares.length > 0 && userNumbers && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">
              {userName ? `${userName}'s` : 'Your'} Numbers
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-2">
                {gameScore.afcTeam} (Rows)
              </div>
              <div className="flex flex-wrap gap-2">
                {userNumbers.rows.map((num) => (
                  <span
                    key={num}
                    className={`px-3 py-1 rounded-lg font-bold text-lg ${
                      currentWinningNumbers?.afc === num
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card border border-border text-foreground'
                    }`}
                  >
                    {num}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-2">
                {gameScore.nfcTeam} (Columns)
              </div>
              <div className="flex flex-wrap gap-2">
                {userNumbers.cols.map((num) => (
                  <span
                    key={num}
                    className={`px-3 py-1 rounded-lg font-bold text-lg ${
                      currentWinningNumbers?.nfc === num
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card border border-border text-foreground'
                    }`}
                  >
                    {num}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            You have <strong>{userSquares.length}</strong> square
            {userSquares.length !== 1 ? 's' : ''} in the pool.
          </div>
        </Card>
      )}

      {/* Quarter Progress */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Quarter Progress</h3>
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4].map((quarter) => {
            const status = getQuarterStatus(quarter);
            const winner = quarterWinners.find((w) => w.quarter === quarter);
            const prize = prizes[`q${quarter}` as keyof typeof prizes];

            return (
              <div key={quarter} className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                    status === 'completed'
                      ? 'bg-primary text-primary-foreground'
                      : status === 'active'
                      ? 'bg-primary/20 text-primary border-2 border-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {status === 'completed' ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : status === 'active' ? (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <Circle className="w-4 h-4 fill-current" />
                    </motion.div>
                  ) : (
                    <span className="font-bold">Q{quarter}</span>
                  )}
                </div>
                <span className="text-sm font-medium text-foreground">Q{quarter}</span>
                <span className="text-xs text-muted-foreground">${prize}</span>
                {winner && (
                  <span className="text-xs text-primary font-medium mt-1 truncate max-w-[80px]">
                    {winner.name}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Winners History */}
      {quarterWinners.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Quarter Winners</h3>
          </div>
          <div className="space-y-3">
            {quarterWinners.map((winner) => (
              <div
                key={winner.quarter}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                    Q{winner.quarter}
                  </div>
                  <div>
                    <div className="font-medium text-foreground">{winner.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Score: {winner.afcScore}-{winner.nfcScore}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-primary">${winner.prize}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Odds Calculator */}
      {isLoggedIn && userSquares.length > 0 && !gameScore.isFinal && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Your Odds</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((quarter) => {
              const status = getQuarterStatus(quarter);
              const odds = calculateOdds(quarter);

              return (
                <div
                  key={quarter}
                  className={`text-center p-4 rounded-lg ${
                    status === 'completed'
                      ? 'bg-muted/30'
                      : status === 'active'
                      ? 'bg-primary/10 border border-primary/30'
                      : 'bg-muted/50'
                  }`}
                >
                  <div className="text-sm text-muted-foreground mb-1">Q{quarter}</div>
                  <div
                    className={`text-xl font-bold ${
                      status === 'completed'
                        ? 'text-muted-foreground'
                        : 'text-foreground'
                    }`}
                  >
                    {status === 'completed' ? 'Done' : `${odds.toFixed(0)}%`}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Based on your {userSquares.length} square{userSquares.length !== 1 ? 's' : ''} out of 100.
          </p>
        </Card>
      )}

      {/* View Grid Button */}
      <div className="flex justify-center">
        <Link href="/grid">
          <Button variant="outline" size="lg">
            <Grid3x3 className="w-5 h-5 mr-2" />
            View Full Grid
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
