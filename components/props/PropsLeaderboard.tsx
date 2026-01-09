'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Trophy, Medal, TrendingUp, Target, ChevronUp, ChevronDown } from 'lucide-react';
import type { PropLeaderboardEntry } from '@/lib/supabase/types';

interface PropsLeaderboardProps {
  currentUserId?: string | null;
  limit?: number;
  showFullList?: boolean;
}

/**
 * Props Leaderboard Component
 * Real-time updating standings for prop bet participants
 */
export default function PropsLeaderboard({
  currentUserId,
  limit = 10,
  showFullList = false,
}: PropsLeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<PropLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [previousRanks, setPreviousRanks] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchLeaderboard();

    // Subscribe to real-time updates
    const supabase = createClient();
    const channel = supabase
      .channel('props_leaderboard')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'prop_answers' },
        () => {
          fetchLeaderboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const supabase = createClient();

      // Get all profiles with their prop answers
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          photo_url,
          prop_answers(
            is_correct,
            points_earned,
            confidence_points
          )
        `);

      if (error) throw error;

      // Save previous ranks for animation
      const prevRanks: Record<string, number> = {};
      leaderboard.forEach((entry, i) => {
        prevRanks[entry.user_id] = i + 1;
      });
      setPreviousRanks(prevRanks);

      // Calculate leaderboard entries
      const entries: PropLeaderboardEntry[] = (data || [])
        .map((profile: any) => {
          const answers = profile.prop_answers || [];
          const totalAnswers = answers.length;
          const correctAnswers = answers.filter((a: any) => a.is_correct === true).length;
          const incorrectAnswers = answers.filter((a: any) => a.is_correct === false).length;
          const pendingAnswers = answers.filter((a: any) => a.is_correct === null).length;
          const totalPoints = answers.reduce(
            (sum: number, a: any) => sum + (a.points_earned || 0),
            0
          );
          const totalConfidence = answers.reduce(
            (sum: number, a: any) => sum + (a.confidence_points || 0),
            0
          );
          const gradedCount = correctAnswers + incorrectAnswers;

          return {
            user_id: profile.id,
            user_name: profile.name,
            photo_url: profile.photo_url,
            total_answers: totalAnswers,
            correct_answers: correctAnswers,
            incorrect_answers: incorrectAnswers,
            pending_answers: pendingAnswers,
            total_points: totalPoints,
            total_confidence_used: totalConfidence,
            accuracy_percentage:
              gradedCount > 0 ? Math.round((correctAnswers / gradedCount) * 100) : 0,
          };
        })
        .filter((e) => e.total_answers > 0)
        .sort(
          (a, b) =>
            b.total_points - a.total_points ||
            b.correct_answers - a.correct_answers ||
            b.accuracy_percentage - a.accuracy_percentage
        );

      setLeaderboard(entries);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankChange = (userId: string, currentRank: number): 'up' | 'down' | 'same' => {
    const prevRank = previousRanks[userId];
    if (!prevRank) return 'same';
    if (currentRank < prevRank) return 'up';
    if (currentRank > prevRank) return 'down';
    return 'same';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="text-gray-500 font-bold">{rank}</span>;
  };

  const displayLeaderboard = showFullList ? leaderboard : leaderboard.slice(0, limit);

  // Find current user's position
  const currentUserRank = leaderboard.findIndex((e) => e.user_id === currentUserId) + 1;
  const currentUserEntry =
    currentUserId && currentUserRank > limit
      ? leaderboard.find((e) => e.user_id === currentUserId)
      : null;

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <h3 className="text-lg font-bold text-gray-900">Props Leaderboard</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-12"></div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <h3 className="text-lg font-bold text-gray-900">Props Leaderboard</h3>
        </div>
        <div className="text-center py-8 text-gray-500">
          <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No one has answered props yet!</p>
          <p className="text-sm mt-1">Be the first to make your picks.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <h3 className="text-lg font-bold text-gray-900">Props Leaderboard</h3>
        </div>
        <span className="text-sm text-gray-500">{leaderboard.length} players</span>
      </div>

      <div className="space-y-2">
        <AnimatePresence>
          {displayLeaderboard.map((entry, index) => {
            const rank = index + 1;
            const isCurrentUser = entry.user_id === currentUserId;
            const rankChange = getRankChange(entry.user_id, rank);

            return (
              <motion.div
                key={entry.user_id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  isCurrentUser
                    ? 'bg-[#CDA33B]/10 ring-2 ring-[#CDA33B] ring-inset'
                    : rank <= 3
                    ? 'bg-gray-50'
                    : 'hover:bg-gray-50'
                }`}
              >
                {/* Rank */}
                <div className="w-8 flex items-center justify-center">
                  {getRankIcon(rank)}
                </div>

                {/* Rank Change Indicator */}
                <div className="w-4">
                  {rankChange === 'up' && (
                    <ChevronUp className="w-4 h-4 text-green-500" />
                  )}
                  {rankChange === 'down' && (
                    <ChevronDown className="w-4 h-4 text-red-500" />
                  )}
                </div>

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {entry.photo_url ? (
                    <img
                      src={entry.photo_url}
                      alt={entry.user_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-600 font-bold text-sm">
                      {entry.user_name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </span>
                  )}
                </div>

                {/* Name & Stats */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">
                    {entry.user_name}
                    {isCurrentUser && (
                      <span className="ml-2 text-xs text-[#CDA33B] font-normal">(You)</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500">
                    {entry.correct_answers}/{entry.correct_answers + entry.incorrect_answers} correct
                    {entry.pending_answers > 0 && ` • ${entry.pending_answers} pending`}
                  </p>
                </div>

                {/* Points */}
                <div className="text-right">
                  <p className="font-bold text-gray-900">{entry.total_points}</p>
                  <p className="text-xs text-gray-500">
                    {entry.accuracy_percentage}%
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Current User (if not in top list) */}
        {currentUserEntry && (
          <>
            <div className="text-center text-gray-400 text-sm py-2">• • •</div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3 p-3 rounded-lg bg-[#CDA33B]/10 ring-2 ring-[#CDA33B] ring-inset"
            >
              <div className="w-8 flex items-center justify-center">
                <span className="text-gray-500 font-bold">{currentUserRank}</span>
              </div>
              <div className="w-4"></div>
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {currentUserEntry.photo_url ? (
                  <img
                    src={currentUserEntry.photo_url}
                    alt={currentUserEntry.user_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-600 font-bold text-sm">
                    {currentUserEntry.user_name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">
                  {currentUserEntry.user_name}
                  <span className="ml-2 text-xs text-[#CDA33B] font-normal">(You)</span>
                </p>
                <p className="text-xs text-gray-500">
                  {currentUserEntry.correct_answers}/
                  {currentUserEntry.correct_answers + currentUserEntry.incorrect_answers} correct
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">{currentUserEntry.total_points}</p>
                <p className="text-xs text-gray-500">{currentUserEntry.accuracy_percentage}%</p>
              </div>
            </motion.div>
          </>
        )}
      </div>

      {/* View All Link */}
      {!showFullList && leaderboard.length > limit && (
        <div className="mt-4 text-center">
          <a
            href="/props/leaderboard"
            className="text-sm text-[#CDA33B] hover:underline font-medium"
          >
            View Full Leaderboard ({leaderboard.length} players)
          </a>
        </div>
      )}
    </Card>
  );
}

