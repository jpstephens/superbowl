'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Clock,
  Grid3x3,
  Users,
  Trophy,
  ArrowRight,
  Info,
  DollarSign,
} from 'lucide-react';

interface PreGameViewProps {
  gameDate?: string;
  stats?: {
    totalSquares: number;
    soldSquares: number;
    availableSquares: number;
    totalRaised: number;
  };
  leaderboard?: Array<{
    name: string;
    squareCount: number;
  }>;
  userSquares?: Array<{
    row: number;
    col: number;
  }>;
  isLoggedIn?: boolean;
}

export default function PreGameView({
  gameDate,
  stats = { totalSquares: 100, soldSquares: 0, availableSquares: 100, totalRaised: 0 },
  leaderboard = [],
  userSquares = [],
  isLoggedIn = false,
}: PreGameViewProps) {
  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    if (!gameDate) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const target = new Date(gameDate).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setCountdown({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [gameDate]);

  const progressPercent = (stats.soldSquares / stats.totalSquares) * 100;

  return (
    <div className="space-y-8">
      {/* Countdown Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12 bg-gradient-to-br from-secondary/10 via-background to-primary/5 rounded-2xl"
      >
        <div className="flex items-center justify-center gap-2 mb-4">
          <Clock className="w-6 h-6 text-primary" />
          <span className="text-lg font-medium text-muted-foreground">Kickoff Countdown</span>
        </div>

        <div className="flex justify-center gap-4 sm:gap-8 mb-8">
          {[
            { value: countdown.days, label: 'Days' },
            { value: countdown.hours, label: 'Hours' },
            { value: countdown.minutes, label: 'Minutes' },
            { value: countdown.seconds, label: 'Seconds' },
          ].map((item, idx) => (
            <motion.div
              key={item.label}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="text-center"
            >
              <div className="w-16 sm:w-20 h-16 sm:h-20 bg-card rounded-xl shadow-lg flex items-center justify-center mb-2">
                <span className="text-3xl sm:text-4xl font-bold text-foreground">
                  {String(item.value).padStart(2, '0')}
                </span>
              </div>
              <span className="text-xs sm:text-sm text-muted-foreground">{item.label}</span>
            </motion.div>
          ))}
        </div>

        <div className="flex items-center justify-center">
          <Link href="/pool">
            <Button size="lg" className="min-h-[48px] px-8">
              <Grid3x3 className="w-5 h-5 mr-2" />
              Pick Your Squares
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 text-center">
            <Grid3x3 className="w-8 h-8 text-primary mx-auto mb-3" />
            <div className="text-3xl font-bold text-foreground mb-1">
              {stats.availableSquares}
            </div>
            <div className="text-sm text-muted-foreground">Available</div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6 text-center">
            <Users className="w-8 h-8 text-primary mx-auto mb-3" />
            <div className="text-3xl font-bold text-foreground mb-1">
              {stats.soldSquares}
            </div>
            <div className="text-sm text-muted-foreground">Sold</div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6 text-center">
            <DollarSign className="w-8 h-8 text-primary mx-auto mb-3" />
            <div className="text-3xl font-bold text-foreground mb-1">
              ${stats.totalRaised.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Raised</div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6 text-center">
            <Trophy className="w-8 h-8 text-primary mx-auto mb-3" />
            <div className="text-3xl font-bold text-foreground mb-1">
              {Math.round(progressPercent)}%
            </div>
            <div className="text-sm text-muted-foreground">Filled</div>
          </Card>
        </motion.div>
      </div>

      {/* Progress Bar */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="font-medium text-foreground">Pool Progress</span>
          <span className="text-sm text-muted-foreground">
            {stats.soldSquares} of {stats.totalSquares} squares sold
          </span>
        </div>
        <div className="h-4 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
        {stats.availableSquares <= 20 && stats.availableSquares > 0 && (
          <p className="mt-3 text-sm text-amber-600 font-medium">
            Only {stats.availableSquares} squares left! Don't miss out.
          </p>
        )}
      </Card>

      {/* Your Squares Section (if logged in) */}
      {isLoggedIn && userSquares.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Your Squares</h3>
            <Link href="/my-squares">
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {userSquares.slice(0, 10).map((square, idx) => (
              <div
                key={idx}
                className="px-3 py-2 bg-primary/10 text-primary rounded-lg font-mono text-sm font-medium"
              >
                [{square.row}, {square.col}]
              </div>
            ))}
            {userSquares.length > 10 && (
              <div className="px-3 py-2 bg-muted text-muted-foreground rounded-lg text-sm">
                +{userSquares.length - 10} more
              </div>
            )}
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Numbers will be assigned when all squares are sold.
          </p>
        </Card>
      )}

      {/* How It Works */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">How It Works</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
              <span className="text-xl font-bold">1</span>
            </div>
            <h4 className="font-medium text-foreground mb-2">Pick Your Squares</h4>
            <p className="text-sm text-muted-foreground">
              Select squares on the 10x10 grid. Each square costs $50.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
              <span className="text-xl font-bold">2</span>
            </div>
            <h4 className="font-medium text-foreground mb-2">Numbers Assigned</h4>
            <p className="text-sm text-muted-foreground">
              Once all squares are sold, random numbers 0-9 are assigned to rows and columns.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
              <span className="text-xl font-bold">3</span>
            </div>
            <h4 className="font-medium text-foreground mb-2">Win at Each Quarter</h4>
            <p className="text-sm text-muted-foreground">
              If the last digit of each team's score matches your numbers, you win!
            </p>
          </div>
        </div>
      </Card>

      {/* Leaderboard */}
      {leaderboard.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Top Participants</h3>
          </div>
          <div className="space-y-3">
            {leaderboard.slice(0, 5).map((entry, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-2 border-b border-border last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                      idx === 0
                        ? 'bg-primary text-primary-foreground'
                        : idx === 1
                        ? 'bg-secondary text-secondary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span className="font-medium text-foreground">{entry.name}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {entry.squareCount} square{entry.squareCount !== 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
