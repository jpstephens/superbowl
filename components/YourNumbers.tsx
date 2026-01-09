'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Trophy, Target, Sparkles } from 'lucide-react';

interface UserSquare {
  id: string;
  rowNumber: number;
  colNumber: number;
  rowScore: number | null;
  colScore: number | null;
}

interface YourNumbersProps {
  squares: UserSquare[];
  currentScore?: {
    afcScore: number;
    nfcScore: number;
    afcTeam: string;
    nfcTeam: string;
  };
  isLive?: boolean;
  showHero?: boolean;
  userName?: string;
}

/**
 * YourNumbers Component
 * Prominently displays the user's assigned numbers after tournament launch
 * Highlights winning numbers when game is live
 */
export default function YourNumbers({
  squares,
  currentScore,
  isLive = false,
  showHero = true,
  userName,
}: YourNumbersProps) {
  // Get unique row and column scores
  const { uniqueRowScores, uniqueColScores } = useMemo(() => {
    const rowScores = new Set<number>();
    const colScores = new Set<number>();

    squares.forEach((sq) => {
      if (sq.rowScore !== null) rowScores.add(sq.rowScore);
      if (sq.colScore !== null) colScores.add(sq.colScore);
    });

    return {
      uniqueRowScores: Array.from(rowScores).sort((a, b) => a - b),
      uniqueColScores: Array.from(colScores).sort((a, b) => a - b),
    };
  }, [squares]);

  // Check if numbers are assigned yet
  const numbersAssigned = uniqueRowScores.length > 0 || uniqueColScores.length > 0;

  // Calculate current winning digits
  const winningDigits = useMemo(() => {
    if (!currentScore) return null;
    return {
      afc: currentScore.afcScore % 10,
      nfc: currentScore.nfcScore % 10,
    };
  }, [currentScore]);

  // Check if user is winning
  const isWinning = useMemo(() => {
    if (!winningDigits || !isLive) return false;
    return squares.some(
      (sq) =>
        sq.rowScore === winningDigits.afc && sq.colScore === winningDigits.nfc
    );
  }, [winningDigits, isLive, squares]);

  // Find the winning square
  const winningSquare = useMemo(() => {
    if (!winningDigits || !isLive) return null;
    return squares.find(
      (sq) =>
        sq.rowScore === winningDigits.afc && sq.colScore === winningDigits.nfc
    );
  }, [winningDigits, isLive, squares]);

  if (squares.length === 0) {
    return null;
  }

  if (!numbersAssigned) {
    return (
      <Card className="p-6 text-center bg-muted/30">
        <Target className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Numbers Coming Soon
        </h3>
        <p className="text-sm text-muted-foreground">
          You have {squares.length} square{squares.length !== 1 ? 's' : ''}. Numbers
          will be randomly assigned once all 100 squares are sold.
        </p>
      </Card>
    );
  }

  // Hero display for game day
  if (showHero) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative overflow-hidden rounded-2xl p-6 sm:p-8 ${
          isWinning
            ? 'bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 border-2 border-primary'
            : 'bg-gradient-to-br from-secondary/10 via-background to-primary/5'
        }`}
      >
        {/* Winning Animation */}
        <AnimatePresence>
          {isWinning && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-4 right-4"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                <Trophy className="w-10 h-10 text-primary" fill="currentColor" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Target className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-muted-foreground">
              {userName ? `${userName}'s` : 'Your'} Numbers
            </h2>
          </div>
          {isWinning && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center gap-2 text-primary font-bold"
            >
              <Sparkles className="w-5 h-5" />
              You're Winning!
              <Sparkles className="w-5 h-5" />
            </motion.div>
          )}
        </div>

        {/* Numbers Display */}
        <div className="grid grid-cols-2 gap-6">
          {/* AFC Team Numbers (Rows) */}
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-3">
              {currentScore?.afcTeam || 'AFC'} (Row)
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {uniqueRowScores.map((num) => (
                <motion.div
                  key={num}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center text-2xl font-bold ${
                    isLive && winningDigits?.afc === num
                      ? 'bg-primary text-primary-foreground shadow-lg ring-2 ring-primary ring-offset-2'
                      : 'bg-card border border-border text-foreground'
                  }`}
                >
                  {num}
                </motion.div>
              ))}
            </div>
          </div>

          {/* NFC Team Numbers (Columns) */}
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-3">
              {currentScore?.nfcTeam || 'NFC'} (Column)
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {uniqueColScores.map((num) => (
                <motion.div
                  key={num}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center text-2xl font-bold ${
                    isLive && winningDigits?.nfc === num
                      ? 'bg-primary text-primary-foreground shadow-lg ring-2 ring-primary ring-offset-2'
                      : 'bg-card border border-border text-foreground'
                  }`}
                >
                  {num}
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Square Count */}
        <div className="text-center mt-6 pt-4 border-t border-border/50">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{squares.length}</span>{' '}
            square{squares.length !== 1 ? 's' : ''} in the pool
          </p>
        </div>

        {/* Winning Square Info */}
        {winningSquare && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-primary/10 rounded-xl text-center"
          >
            <p className="text-sm text-foreground">
              Your winning square:{' '}
              <span className="font-bold">
                [{winningSquare.rowNumber}, {winningSquare.colNumber}]
              </span>
            </p>
          </motion.div>
        )}
      </motion.div>
    );
  }

  // Compact display for sidebar/inline use
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Target className="w-4 h-4 text-primary" />
        <span className="font-semibold text-foreground text-sm">Your Numbers</span>
        {isWinning && (
          <span className="ml-auto px-2 py-0.5 bg-primary/20 text-primary text-xs font-medium rounded-full">
            Winning!
          </span>
        )}
      </div>

      <div className="flex gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Row: </span>
          <span className="font-mono font-bold text-foreground">
            {uniqueRowScores.join(', ')}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Col: </span>
          <span className="font-mono font-bold text-foreground">
            {uniqueColScores.join(', ')}
          </span>
        </div>
      </div>
    </Card>
  );
}
