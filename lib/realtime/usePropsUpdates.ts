'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { PropBet, PropAnswer, PropCategory, PropLeaderboardEntry } from '@/lib/supabase/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Hook for fetching and subscribing to prop bets
 */
export function useProps() {
  const [props, setProps] = useState<PropBet[]>([]);
  const [categories, setCategories] = useState<PropCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProps = useCallback(async () => {
    try {
      const supabase = createClient();

      // Fetch categories
      const { data: catData } = await supabase
        .from('prop_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (catData) setCategories(catData);

      // Fetch props with their categories
      const { data: propsData, error } = await supabase
        .from('prop_bets')
        .select(`
          *,
          category:prop_categories(*)
        `)
        .in('status', ['open', 'locked', 'graded'])
        .order('display_order');

      if (error) throw error;
      setProps(propsData || []);
    } catch (error) {
      console.error('Error fetching props:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let channel: RealtimeChannel;

    fetchProps();

    // Subscribe to prop updates (status changes, grading)
    channel = supabase
      .channel('prop_bets_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'prop_bets',
        },
        (payload) => {
          console.log('Prop update:', payload);
          if (payload.eventType === 'UPDATE') {
            setProps((prev) =>
              prev.map((p) =>
                p.id === (payload.new as PropBet).id ? (payload.new as PropBet) : p
              )
            );
          } else if (payload.eventType === 'INSERT') {
            fetchProps(); // Refetch to get category join
          }
        }
      )
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [fetchProps]);

  return { props, categories, loading, refetch: fetchProps };
}

/**
 * Hook for a user's prop answers
 */
export function useUserPropAnswers(userId: string | null) {
  const [answers, setAnswers] = useState<PropAnswer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnswers = useCallback(async () => {
    if (!userId) {
      setAnswers([]);
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('prop_answers')
        .select(`
          *,
          prop:prop_bets(*)
        `)
        .eq('user_id', userId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setAnswers(data || []);
    } catch (error) {
      console.error('Error fetching answers:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    const supabase = createClient();
    let channel: RealtimeChannel;

    fetchAnswers();

    if (userId) {
      // Subscribe to answer updates for this user
      channel = supabase
        .channel(`prop_answers_${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'prop_answers',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            console.log('Answer update:', payload);
            fetchAnswers(); // Refetch to get prop join
          }
        )
        .subscribe();
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [userId, fetchAnswers]);

  // Submit or update an answer
  const submitAnswer = async (propId: string, answer: string, confidencePoints?: number) => {
    if (!userId) return { error: new Error('Not logged in') };

    const supabase = createClient();
    const { data, error } = await supabase
      .from('prop_answers')
      .upsert(
        {
          user_id: userId,
          prop_id: propId,
          answer,
          confidence_points: confidencePoints,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,prop_id' }
      )
      .select()
      .single();

    if (!error) {
      await fetchAnswers();
    }

    return { data, error };
  };

  return { answers, loading, refetch: fetchAnswers, submitAnswer };
}

/**
 * Hook for the props leaderboard
 */
export function usePropsLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<PropLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const supabase = createClient();
      
      // Build leaderboard from prop_answers
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

      const entries: PropLeaderboardEntry[] = (data || [])
        .map((profile: any) => {
          const answers = profile.prop_answers || [];
          const totalAnswers = answers.length;
          const correctAnswers = answers.filter((a: any) => a.is_correct === true).length;
          const incorrectAnswers = answers.filter((a: any) => a.is_correct === false).length;
          const pendingAnswers = answers.filter((a: any) => a.is_correct === null).length;
          const totalPoints = answers.reduce((sum: number, a: any) => sum + (a.points_earned || 0), 0);
          const totalConfidence = answers.reduce((sum: number, a: any) => sum + (a.confidence_points || 0), 0);
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
            accuracy_percentage: gradedCount > 0 ? Math.round((correctAnswers / gradedCount) * 100) : 0,
          };
        })
        .filter((e) => e.total_answers > 0)
        .sort((a, b) => b.total_points - a.total_points || b.correct_answers - a.correct_answers);

      setLeaderboard(entries);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let channel: RealtimeChannel;

    fetchLeaderboard();

    // Subscribe to answer changes to update leaderboard
    channel = supabase
      .channel('leaderboard_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'prop_answers',
        },
        () => {
          fetchLeaderboard();
        }
      )
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [fetchLeaderboard]);

  return { leaderboard, loading, refetch: fetchLeaderboard };
}

/**
 * Hook for calculating user's prop stats
 */
export function usePropStats(answers: PropAnswer[]) {
  const stats = {
    totalAnswered: answers.length,
    correct: answers.filter((a) => a.is_correct === true).length,
    incorrect: answers.filter((a) => a.is_correct === false).length,
    pending: answers.filter((a) => a.is_correct === null).length,
    totalPoints: answers.reduce((sum, a) => sum + a.points_earned, 0),
    accuracy: 0,
  };

  const graded = stats.correct + stats.incorrect;
  stats.accuracy = graded > 0 ? Math.round((stats.correct / graded) * 100) : 0;

  return stats;
}

