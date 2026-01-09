'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Trophy } from 'lucide-react';
import { LeaderboardSkeleton } from '@/components/SkeletonLoader';

interface LeaderboardEntry {
  name: string;
  total_squares: number;
}

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      setError(null);
      const supabase = createClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('name, total_squares')
        .order('total_squares', { ascending: false })
        .limit(10);

      if (error) throw error;

      if (data) {
        setEntries(data as LeaderboardEntry[]);
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LeaderboardSkeleton />;
  }

  if (error) {
    return (
      <div className="text-sm text-red-600">
        {error}
        <button onClick={loadLeaderboard} className="ml-2 text-blue-600 underline">
          Retry
        </button>
      </div>
    );
  }

  if (entries.length === 0) {
    return <div className="text-sm text-gray-500">No entries yet. Be the first!</div>;
  }

  return (
    <div className="space-y-1.5">
      {entries.slice(0, 5).map((entry, index) => (
        <div 
          key={index} 
          className="flex items-center justify-between p-2 bg-white rounded-md border border-gray-200 hover:border-amber-300 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-amber-200">
              {index === 0 ? (
                <Trophy className="h-3.5 w-3.5 text-amber-700" />
              ) : (
                <span className="text-xs font-bold text-amber-700">{index + 1}</span>
              )}
            </div>
            <span className="text-sm font-medium text-gray-900 truncate">{entry.name}</span>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-base font-bold text-gray-900">{entry.total_squares}</div>
            <div className="text-xs text-gray-500">
              {entry.total_squares === 1 ? 'sq' : 'sqs'}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

