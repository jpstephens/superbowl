'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Pause } from 'lucide-react';

interface GameScoreProps {
  afcTeam: {
    name: string;
    abbreviation: string;
    score: number;
  };
  nfcTeam: {
    name: string;
    abbreviation: string;
    score: number;
  };
  quarter: number;
  timeRemaining: string;
  isLive?: boolean;
}

export default function GameScore({
  afcTeam,
  nfcTeam,
  quarter,
  timeRemaining,
  isLive = false,
}: GameScoreProps) {
  const [isPaused, setIsPaused] = useState(false);

  const getQuarterLabel = (q: number) => {
    switch (q) {
      case 1:
        return '1st Quarter';
      case 2:
        return '2nd Quarter';
      case 3:
        return '3rd Quarter';
      case 4:
        return '4th Quarter';
      case 5:
        return 'Overtime';
      case 0:
      default:
        return 'Pre-Game';
    }
  };

  const isPreGame = quarter === 0 || !isLive;

  const leadingTeam = afcTeam.score > nfcTeam.score ? afcTeam : nfcTeam.score > afcTeam.score ? nfcTeam : null;

  return (
    <Card className="p-6 bg-gradient-to-br from-gray-900 to-gray-800 text-white border-0 shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {isLive && !isPreGame && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold text-red-400">LIVE</span>
            </div>
          )}
          <Badge variant="outline" className="border-white/30 text-white bg-white/10">
            {getQuarterLabel(quarter)}
          </Badge>
          {!isPreGame && quarter > 0 && quarter < 5 && (
            <span className="text-sm text-gray-300">{timeRemaining}</span>
          )}
          {isPreGame && (
            <span className="text-sm text-gray-300">Game starts soon</span>
          )}
        </div>
        {isLive && !isPreGame && (
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title={isPaused ? 'Resume' : 'Pause'}
          >
            {isPaused ? (
              <Play className="h-5 w-5 text-white" />
            ) : (
              <Pause className="h-5 w-5 text-white" />
            )}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* AFC Team */}
        <div className={`text-center p-4 rounded-xl transition-all ${
          leadingTeam?.abbreviation === afcTeam.abbreviation
            ? 'bg-blue-600/30 ring-2 ring-blue-400'
            : 'bg-white/5'
        }`}>
          <div className="text-xs uppercase tracking-wider text-gray-400 mb-2">AFC</div>
          <div className="text-2xl font-bold mb-1">{afcTeam.name}</div>
          <div className="text-xs text-gray-400 mb-3">{afcTeam.abbreviation}</div>
          <div className="text-5xl font-bold text-white">{afcTeam.score}</div>
        </div>

        {/* NFC Team */}
        <div className={`text-center p-4 rounded-xl transition-all ${
          leadingTeam?.abbreviation === nfcTeam.abbreviation
            ? 'bg-red-600/30 ring-2 ring-red-400'
            : 'bg-white/5'
        }`}>
          <div className="text-xs uppercase tracking-wider text-gray-400 mb-2">NFC</div>
          <div className="text-2xl font-bold mb-1">{nfcTeam.name}</div>
          <div className="text-xs text-gray-400 mb-3">{nfcTeam.abbreviation}</div>
          <div className="text-5xl font-bold text-white">{nfcTeam.score}</div>
        </div>
      </div>

      {leadingTeam && (
        <div className="mt-4 text-center">
          <div className="text-sm text-gray-300">
            <span className="font-semibold">{leadingTeam.name}</span> is leading
          </div>
        </div>
      )}
    </Card>
  );
}

