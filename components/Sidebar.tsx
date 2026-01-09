'use client';

import { Card } from '@/components/ui/card';
import { Trophy, Activity, TrendingUp } from 'lucide-react';
import GameMatchup from '@/components/GameMatchup';
import CurrentWinners from '@/components/CurrentWinners';
import ActivityFeed from '@/components/ActivityFeed';

interface SidebarProps {
  gameScore?: {
    afcScore?: number;
    nfcScore?: number;
    afcTeam?: string;
    nfcTeam?: string;
    quarter?: number;
    timeRemaining?: string;
    isLive?: boolean;
  } | null;
}

export default function Sidebar({ gameScore }: SidebarProps) {
  return (
    <div className="space-y-6">
      {/* Quarter Winners */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-amber-600" />
          <h3 className="text-lg font-bold text-gray-900">Quarter Winners</h3>
        </div>
        <CurrentWinners />
      </Card>

      {/* Recent Activity */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
        </div>
        <ActivityFeed />
      </Card>
    </div>
  );
}

