'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { GameState } from '@/lib/supabase/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Hook for real-time game state updates
 * Subscribes to the game_state table and provides live score, quarter, and game status
 */
export function useGameState() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch initial game state
  const fetchGameState = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from('game_state')
        .select('*')
        .single();

      if (fetchError) throw fetchError;
      setGameState(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching game state:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch game state'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let channel: RealtimeChannel;

    // Initial fetch
    fetchGameState();

    // Subscribe to real-time updates
    channel = supabase
      .channel('game_state_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_state',
        },
        (payload) => {
          console.log('Game state update:', payload);
          if (payload.new) {
            setGameState(payload.new as GameState);
          }
        }
      )
      .subscribe((status) => {
        console.log('Game state subscription status:', status);
      });

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [fetchGameState]);

  return {
    gameState,
    loading,
    error,
    refetch: fetchGameState,
  };
}

/**
 * Hook for tracking score changes with animation triggers
 * Returns previous and current scores to enable transition animations
 */
export function useScoreAnimation(gameState: GameState | null) {
  const [prevScore, setPrevScore] = useState({ afc: 0, nfc: 0 });
  const [scoreChanged, setScoreChanged] = useState<'afc' | 'nfc' | null>(null);

  useEffect(() => {
    if (!gameState) return;

    const newAfcScore = gameState.afc_score;
    const newNfcScore = gameState.nfc_score;

    // Detect which team scored
    if (newAfcScore > prevScore.afc) {
      setScoreChanged('afc');
      setTimeout(() => setScoreChanged(null), 3000);
    } else if (newNfcScore > prevScore.nfc) {
      setScoreChanged('nfc');
      setTimeout(() => setScoreChanged(null), 3000);
    }

    setPrevScore({ afc: newAfcScore, nfc: newNfcScore });
  }, [gameState?.afc_score, gameState?.nfc_score]);

  return {
    prevScore,
    scoreChanged,
  };
}

