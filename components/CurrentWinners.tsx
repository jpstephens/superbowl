'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Clock } from 'lucide-react';
import type { QuarterWinner } from '@/lib/supabase/types';

export default function CurrentWinners() {
  const [winners, setWinners] = useState<QuarterWinner[]>([]);
  const [loading, setLoading] = useState(true);
  const [prizeAmounts, setPrizeAmounts] = useState<Record<number, string>>({
    1: '250',
    2: '250',
    3: '250',
    4: '250',
  });

  useEffect(() => {
    loadPrizeAmounts();
    loadWinners();

    // Set up real-time subscription
    const supabase = createClient();
    const channel = supabase
      .channel('quarterly_winners')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quarterly_winners',
        },
        () => {
          loadWinners();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadPrizeAmounts = async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', ['prize_q1', 'prize_q2', 'prize_q3', 'prize_q4']);

      if (data) {
        const amounts: Record<number, string> = {};
        data.forEach((item) => {
          const quarter = parseInt(item.key.replace('prize_q', ''));
          amounts[quarter] = item.value || '250';
        });
        setPrizeAmounts(amounts);
      }
    } catch (error) {
      console.error('Error loading prize amounts:', error);
    }
  };

  const loadWinners = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('quarterly_winners')
        .select(`
          *,
          profiles!quarterly_winners_user_id_fkey (
            name
          )
        `)
        .order('quarter', { ascending: true });

      if (error) throw error;

      if (data) {
        setWinners(data as any);
      }
    } catch (error) {
      console.error('Error loading winners:', error);
    } finally {
      setLoading(false);
    }
  };

  const quarters = [1, 2, 3, 4];
  const getQuarterWinner = (quarter: number) => {
    return winners.find(w => w.quarter === quarter);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {quarters.map(q => (
          <Card key={q} className="p-4 animate-pulse">
            <div className="h-20 bg-gray-200 rounded"></div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {quarters.map(quarter => {
        const winner = getQuarterWinner(quarter);
        const winnerName = winner ? (winner as any).profiles?.name : null;

        return (
          <Card
            key={quarter}
            className={`p-3 text-left transition-all ${
              winner
                ? 'bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-300 shadow-sm'
                : 'bg-gray-50 border border-gray-200'
            }`}
          >
            {winner ? (
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-sm font-bold text-amber-700">Q{quarter}</span>
                    <span className="text-base font-extrabold text-amber-700">
                      {winner.row_score}-{winner.col_score}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-gray-900 break-words" title={winnerName || 'Winner'}>
                    {winnerName || 'Winner'}
                  </div>
                  {winner.prize_amount && (
                    <div className="text-xs font-semibold text-gray-700 mt-1">
                      ${winner.prize_amount}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                  <Clock className="h-5 w-5 text-gray-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-500">Q{quarter}</span>
                  </div>
                  <div className="text-sm text-gray-400 font-medium">Pending</div>
                  <div className="text-xs font-semibold text-gray-500 mt-0.5">
                    ${prizeAmounts[quarter] || '250'}
                  </div>
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

