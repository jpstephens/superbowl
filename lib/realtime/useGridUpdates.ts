'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { GridSquare } from '@/lib/supabase/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Hook for real-time grid square updates
 * Tracks purchases, claims, and status changes across the grid
 */
export function useGridUpdates() {
  const [squares, setSquares] = useState<GridSquare[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentPurchase, setRecentPurchase] = useState<GridSquare | null>(null);

  // Fetch all squares
  const fetchSquares = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('grid_squares')
        .select(`
          *,
          profiles:user_id (name, photo_url)
        `)
        .order('row_number', { ascending: true })
        .order('col_number', { ascending: true });

      if (error) throw error;

      const processedSquares = data.map((square) => ({
        ...square,
        user_name: square.profiles?.name || null,
      }));

      setSquares(processedSquares);
    } catch (error) {
      console.error('Error fetching grid:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let channel: RealtimeChannel;

    // Initial fetch
    fetchSquares();

    // Subscribe to real-time updates
    channel = supabase
      .channel('grid_squares_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'grid_squares',
        },
        async (payload) => {
          console.log('Grid square update:', payload);
          const updatedSquare = payload.new as GridSquare;

          // Fetch the profile for the updated square if it has a user
          if (updatedSquare.user_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('name, photo_url')
              .eq('id', updatedSquare.user_id)
              .single();

            updatedSquare.profiles = profile;
            updatedSquare.user_name = profile?.name || null;
          }

          // Update the squares array
          setSquares((prev) =>
            prev.map((s) => (s.id === updatedSquare.id ? updatedSquare : s))
          );

          // Trigger recent purchase animation if newly paid
          if (updatedSquare.status === 'paid') {
            setRecentPurchase(updatedSquare);
            setTimeout(() => setRecentPurchase(null), 5000);
          }
        }
      )
      .subscribe((status) => {
        console.log('Grid subscription status:', status);
      });

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [fetchSquares]);

  return {
    squares,
    loading,
    recentPurchase,
    refetch: fetchSquares,
  };
}

/**
 * Hook for calculating the current winning square based on game state
 */
export function useWinningSquare(
  squares: GridSquare[],
  afcScore: number,
  nfcScore: number,
  isLive: boolean
) {
  const [winningSquare, setWinningSquare] = useState<GridSquare | null>(null);

  useEffect(() => {
    if (!isLive || squares.length === 0) {
      setWinningSquare(null);
      return;
    }

    const afcLast = afcScore % 10;
    const nfcLast = nfcScore % 10;

    const winner = squares.find(
      (s) =>
        s.row_score === afcLast &&
        s.col_score === nfcLast &&
        s.status === 'paid'
    );

    setWinningSquare(winner || null);
  }, [squares, afcScore, nfcScore, isLive]);

  return winningSquare;
}

/**
 * Hook for calculating "distance to win" for a user's squares
 */
export function useDistanceToWin(
  userSquares: GridSquare[],
  afcScore: number,
  nfcScore: number
) {
  const [nearestSquares, setNearestSquares] = useState<
    Array<{
      square: GridSquare;
      afcNeeded: number;
      nfcNeeded: number;
      totalNeeded: number;
    }>
  >([]);

  useEffect(() => {
    if (userSquares.length === 0) {
      setNearestSquares([]);
      return;
    }

    const currentAfcLast = afcScore % 10;
    const currentNfcLast = nfcScore % 10;

    const distances = userSquares
      .filter((s) => s.row_score !== null && s.col_score !== null)
      .map((square) => {
        // Calculate minimum points needed to reach this square's numbers
        const targetAfc = square.row_score!;
        const targetNfc = square.col_score!;

        // Points needed (could be 0 to 10+)
        let afcNeeded = targetAfc - currentAfcLast;
        if (afcNeeded < 0) afcNeeded += 10;

        let nfcNeeded = targetNfc - currentNfcLast;
        if (nfcNeeded < 0) nfcNeeded += 10;

        return {
          square,
          afcNeeded,
          nfcNeeded,
          totalNeeded: afcNeeded + nfcNeeded,
        };
      })
      .sort((a, b) => a.totalNeeded - b.totalNeeded);

    setNearestSquares(distances.slice(0, 3)); // Top 3 closest
  }, [userSquares, afcScore, nfcScore]);

  return nearestSquares;
}

