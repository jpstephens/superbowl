'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Clock, TrendingUp, Award } from 'lucide-react';

interface TeamProps {
  name: string;
  abbreviation: string;
  city: string;
  record: string;
  conference: 'AFC' | 'NFC';
  score: number;
}

interface LiveGameScoreProps {
  afcTeam: TeamProps;
  nfcTeam: TeamProps;
  quarter: number;
  timeRemaining: string;
  isLive?: boolean;
  down?: string;
  distance?: string;
  possession?: string;
  yardLine?: string;
}

export default function LiveGameScore({
  afcTeam,
  nfcTeam,
  quarter,
  timeRemaining,
  isLive = false,
  down,
  distance,
  possession,
  yardLine,
}: LiveGameScoreProps) {
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
  const scoreDiff = Math.abs(afcTeam.score - nfcTeam.score);
  const isTied = afcTeam.score === nfcTeam.score;

  return (
    <Card className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white border-0 shadow-xl overflow-hidden">
      {/* Top Status Bar */}
      <div className="bg-black/30 px-3 py-1.5 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-white/30 text-white bg-white/10 text-xs px-1.5 py-0.5">
            {getQuarterLabel(quarter)}
          </Badge>
          {!isPreGame && quarter > 0 && quarter < 5 && (
            <div className="flex items-center gap-1 text-xs text-gray-300">
              <Clock className="w-3 h-3" />
              <span className="font-semibold">{timeRemaining}</span>
            </div>
          )}
          {down && distance && (
            <div className="flex items-center gap-1 text-xs text-gray-300">
              <span className="font-semibold">{down} & {distance}</span>
            </div>
          )}
          {possession && (
            <div className="flex items-center gap-1 text-xs">
              <TrendingUp className="w-3 h-3 text-blue-400" />
              <span className="text-blue-400 font-semibold">{possession} Ball</span>
            </div>
          )}
        </div>
        
        {isLive && (
          <div className="flex items-center gap-1.5">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </div>
            <Badge className="bg-red-600 text-white border-0 text-xs px-2 py-0.5">
              <Play className="h-2.5 w-2.5 mr-1 inline" />
              LIVE
            </Badge>
          </div>
        )}
      </div>

      {/* Main Game Display */}
      <div className="p-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* AFC Team */}
          <div className={`relative p-3 rounded-lg transition-all ${
            leadingTeam?.abbreviation === afcTeam.abbreviation && !isTied
              ? 'bg-blue-600/40 border-2 border-blue-400 shadow-lg ring-2 ring-blue-500/50'
              : isTied
              ? 'bg-gray-700/40 border-2 border-gray-500'
              : 'bg-gray-700/30 border-2 border-gray-600'
          }`}>
            {leadingTeam?.abbreviation === afcTeam.abbreviation && !isTied && (
              <div className="absolute top-1.5 right-1.5">
                <Award className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" />
              </div>
            )}
            <div className="flex items-center justify-between mb-2">
              <Badge className="bg-blue-600 text-white text-xs px-1.5 py-0.5">{afcTeam.conference}</Badge>
              {leadingTeam?.abbreviation === afcTeam.abbreviation && !isTied && (
                <span className="text-xs text-yellow-400 font-semibold">+{scoreDiff}</span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-bold mb-0.5 truncate">{afcTeam.name}</h3>
            <p className="text-xs text-gray-300 mb-2">{afcTeam.city} • {afcTeam.record}</p>
            <div className="text-4xl sm:text-5xl font-black text-white leading-none">{afcTeam.score}</div>
          </div>

          {/* NFC Team */}
          <div className={`relative p-3 rounded-lg transition-all ${
            leadingTeam?.abbreviation === nfcTeam.abbreviation && !isTied
              ? 'bg-red-600/40 border-2 border-red-400 shadow-lg ring-2 ring-red-500/50'
              : isTied
              ? 'bg-gray-700/40 border-2 border-gray-500'
              : 'bg-gray-700/30 border-2 border-gray-600'
          }`}>
            {leadingTeam?.abbreviation === nfcTeam.abbreviation && !isTied && (
              <div className="absolute top-1.5 right-1.5">
                <Award className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" />
              </div>
            )}
            <div className="flex items-center justify-between mb-2">
              <Badge className="bg-red-600 text-white text-xs px-1.5 py-0.5">{nfcTeam.conference}</Badge>
              {leadingTeam?.abbreviation === nfcTeam.abbreviation && !isTied && (
                <span className="text-xs text-yellow-400 font-semibold">+{scoreDiff}</span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-bold mb-0.5 truncate">{nfcTeam.name}</h3>
            <p className="text-xs text-gray-300 mb-2">{nfcTeam.city} • {nfcTeam.record}</p>
            <div className="text-4xl sm:text-5xl font-black text-white leading-none">{nfcTeam.score}</div>
          </div>
        </div>

        {/* Additional Game Info */}
        {yardLine && (
          <div className="mt-2 pt-2 border-t border-white/10">
            <div className="flex items-center justify-center gap-4 text-xs text-gray-300">
              <span className="font-semibold">Ball on {yardLine}</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

