'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Trophy,
  Target,
  Grid3x3,
  CheckCircle,
  ArrowRight,
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

        </div>
      </motion.div>

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
                    className="px-3 py-1 rounded-lg font-bold text-lg bg-card border border-border text-foreground"
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
                    className="px-3 py-1 rounded-lg font-bold text-lg bg-card border border-border text-foreground"
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
        <h3 className="text-lg font-semibold text-foreground mb-4">Quarter Results</h3>
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4].map((quarter) => {
            const winner = quarterWinners.find((w) => w.quarter === quarter);
            const prize = prizes[`q${quarter}` as keyof typeof prizes];

            return (
              <div key={quarter} className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                    winner
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {winner ? (
                    <CheckCircle className="w-6 h-6" />
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
