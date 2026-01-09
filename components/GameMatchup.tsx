'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pause, Play } from 'lucide-react';

interface TeamProps {
  name: string;
  abbreviation: string;
  city: string;
  record: string;
  conference: 'AFC' | 'NFC';
  score: number;
}

interface GameMatchupProps {
  afcTeam: TeamProps;
  nfcTeam: TeamProps;
  quarter: number; // 0 for pre-game, 1-4 for quarters, 5 for overtime
  timeRemaining: string;
  isLive?: boolean;
}

export default function GameMatchup({
  afcTeam,
  nfcTeam,
  quarter,
  timeRemaining,
  isLive = false,
}: GameMatchupProps) {
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
    <Card className="p-3 bg-gradient-to-br from-gray-900 to-gray-800 text-white border-0 shadow-xl">
      {/* Header with game status - COMPACT - LIVE on same row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-white/30 text-white bg-white/10 text-xs px-1.5 py-0.5">
            {getQuarterLabel(quarter)}
          </Badge>
          {!isPreGame && quarter > 0 && quarter < 5 && (
            <span className="text-xs text-gray-300 font-medium">{timeRemaining}</span>
          )}
          {isLive && (
            <div className="flex items-center gap-1.5 ml-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <Badge className="bg-red-600 text-white border-0 text-xs px-1.5 py-0.5">
                <Play className="h-3 w-3 mr-1 inline" />
                LIVE
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Teams and Scores - COMPACT */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* AFC Team */}
        <div className={`text-center p-3 rounded-lg transition-all ${
          leadingTeam?.abbreviation === afcTeam.abbreviation
            ? 'bg-blue-700/50 border border-blue-500 shadow-lg'
            : 'bg-gray-700/30 border border-gray-600'
        }`}>
          <Badge className="bg-blue-600 text-white mb-1 text-xs px-1.5 py-0.5">{afcTeam.conference}</Badge>
          <h3 className="text-base font-bold mb-0.5 truncate">{afcTeam.name}</h3>
          <p className="text-xs text-gray-300 mb-2">{afcTeam.city} • {afcTeam.record}</p>
          <p className="text-4xl font-extrabold text-white">{afcTeam.score}</p>
        </div>

        {/* NFC Team */}
        <div className={`text-center p-3 rounded-lg transition-all ${
          leadingTeam?.abbreviation === nfcTeam.abbreviation
            ? 'bg-red-700/50 border border-red-500 shadow-lg'
            : 'bg-gray-700/30 border border-gray-600'
        }`}>
          <Badge className="bg-red-600 text-white mb-1 text-xs px-1.5 py-0.5">{nfcTeam.conference}</Badge>
          <h3 className="text-base font-bold mb-0.5 truncate">{nfcTeam.name}</h3>
          <p className="text-xs text-gray-300 mb-2">{nfcTeam.city} • {nfcTeam.record}</p>
          <p className="text-4xl font-extrabold text-white">{nfcTeam.score}</p>
        </div>
      </div>
    </Card>
  );
}

