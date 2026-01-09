'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import type { GridSquare } from '@/lib/supabase/types';
import { cn } from '@/lib/utils';

interface PoolGridProps {
  onSquareSelect?: (square: GridSquare) => void;
  selectedSquareIds?: Set<string>;
  userId?: string | null;
  disabled?: boolean;
  gameScore?: {
    afcScore?: number;
    nfcScore?: number;
    afcTeam?: string;
    nfcTeam?: string;
    quarter?: number;
    isLive?: boolean;
  } | null;
}

export default function PoolGrid({
  onSquareSelect,
  selectedSquareIds = new Set(),
  userId,
  disabled = false,
  gameScore,
}: PoolGridProps) {
  const [squares, setSquares] = useState<GridSquare[]>([]);
  const [loading, setLoading] = useState(true);
  const [tournamentLaunched, setTournamentLaunched] = useState(false);

  useEffect(() => {
    loadGrid();

    const supabase = createClient();
    const channel = supabase
      .channel('grid_updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'grid_squares' },
        (payload) => {
          const updated = payload.new as GridSquare;
          setSquares((prev) =>
            prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadGrid = async () => {
    try {
      const supabase = createClient();

      const { data: settingsData } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'tournament_launched')
        .single();

      setTournamentLaunched(settingsData?.value === 'true');

      const { data, error } = await supabase
        .from('grid_squares')
        .select(`
          *,
          profiles:user_id (name)
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
      console.error('Error loading grid:', error);
    } finally {
      setLoading(false);
    }
  };

  // Build grid data
  const { gridMap, rowScores, colScores } = useMemo(() => {
    const gridMap = new Map<string, GridSquare>();
    const rowScores = new Map<number, number>();
    const colScores = new Map<number, number>();

    squares.forEach((square) => {
      gridMap.set(`${square.row_number}-${square.col_number}`, square);
      if (tournamentLaunched && square.row_score !== null) {
        rowScores.set(square.row_number, square.row_score);
      }
      if (tournamentLaunched && square.col_score !== null) {
        colScores.set(square.col_number, square.col_score);
      }
    });

    return { gridMap, rowScores, colScores };
  }, [squares, tournamentLaunched]);

  // Current winner calculation
  const currentWinner = useMemo(() => {
    if (!gameScore?.isLive || gameScore.afcScore === undefined || gameScore.nfcScore === undefined) {
      return null;
    }
    const afcLast = gameScore.afcScore % 10;
    const nfcLast = gameScore.nfcScore % 10;
    return squares.find(
      (s) => s.row_score === afcLast && s.col_score === nfcLast && (s.status === 'paid' || s.status === 'confirmed')
    ) || null;
  }, [squares, gameScore?.afcScore, gameScore?.nfcScore, gameScore?.isLive]);

  const handleSquareClick = (square: GridSquare) => {
    if (!onSquareSelect || tournamentLaunched || disabled) return;
    if (square.status !== 'available') return;
    onSquareSelect(square);
  };

  const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const afcTeam = gameScore?.isLive ? (gameScore?.afcTeam || 'AFC') : 'AFC';
  const nfcTeam = gameScore?.isLive ? (gameScore?.nfcTeam || 'NFC') : 'NFC';

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[600px]">
        {/* Grid Container */}
        <div className="relative">
          {/* NFC Label - Top */}
          <div className="flex justify-center mb-3">
            <div className="flex items-center gap-2 px-4 py-1.5 bg-blue-50 border border-blue-200 rounded-full">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-sm font-semibold text-blue-700">{nfcTeam}</span>
            </div>
          </div>

          <div className="flex">
            {/* AFC Label - Left */}
            <div className="flex items-center justify-center pr-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-full"
                   style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}>
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-sm font-semibold text-red-700">{afcTeam}</span>
              </div>
            </div>

            {/* Main Grid */}
            <div className="flex-1">
              {/* Column Numbers */}
              <div className="grid grid-cols-10 gap-1 mb-1 ml-8">
                {numbers.map((col) => (
                  <div key={`col-${col}`} className="h-6 flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-400">
                      {tournamentLaunched ? colScores.get(col) ?? '-' : ''}
                    </span>
                  </div>
                ))}
              </div>

              {/* Rows */}
              {numbers.map((row) => (
                <div key={`row-${row}`} className="flex gap-1 mb-1">
                  {/* Row Number */}
                  <div className="w-8 flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-400">
                      {tournamentLaunched ? rowScores.get(row) ?? '-' : ''}
                    </span>
                  </div>

                  {/* Cells */}
                  <div className="flex-1 grid grid-cols-10 gap-1">
                    {numbers.map((col) => {
                      const square = gridMap.get(`${row}-${col}`);
                      if (!square) return <div key={`cell-${row}-${col}`} className="aspect-square" />;

                      const isSelected = selectedSquareIds.has(square.id);
                      const isClaimed = square.status === 'paid' || square.status === 'confirmed';
                      const isAvailable = square.status === 'available';
                      const isWinner = currentWinner?.id === square.id;
                      const boxNum = row * 10 + col + 1;

                      // Get initials (max 2 chars)
                      const getInitials = () => {
                        if (!square.user_name) return '';
                        const parts = square.user_name.trim().split(' ');
                        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
                        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
                      };

                      return (
                        <motion.button
                          key={`cell-${row}-${col}`}
                          onClick={() => handleSquareClick(square)}
                          disabled={!isAvailable || tournamentLaunched || disabled}
                          whileHover={isAvailable && !tournamentLaunched && !disabled ? { scale: 1.05 } : {}}
                          whileTap={isAvailable && !tournamentLaunched && !disabled ? { scale: 0.95 } : {}}
                          className={cn(
                            'aspect-square rounded flex items-center justify-center transition-all text-xs font-semibold',
                            // Available
                            isAvailable && !disabled && 'bg-emerald-50 border border-emerald-300 text-emerald-600 hover:bg-emerald-100 hover:border-emerald-400 cursor-pointer',
                            isAvailable && disabled && 'bg-gray-50 border border-gray-200 text-gray-400 cursor-not-allowed',
                            // Claimed
                            isClaimed && !isSelected && !isWinner && 'bg-gray-100 border border-gray-200 text-gray-500',
                            // Selected
                            isSelected && 'bg-amber-500 border-2 border-amber-600 text-white shadow-lg',
                            // Winner
                            isWinner && 'bg-amber-500 border-2 border-amber-600 text-white shadow-[0_0_12px_rgba(245,158,11,0.5)] animate-pulse'
                          )}
                        >
                          {isWinner && '★'}
                          {isSelected && !isWinner && '✓'}
                          {isAvailable && !isSelected && boxNum}
                          {isClaimed && !isSelected && !isWinner && getInitials()}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-emerald-50 border border-emerald-300" />
            <span className="text-xs text-gray-500">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-amber-500 border border-amber-600" />
            <span className="text-xs text-gray-500">Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-100 border border-gray-200" />
            <span className="text-xs text-gray-500">Taken</span>
          </div>
        </div>

        {/* Winner Banner */}
        <AnimatePresence>
          {currentWinner && currentWinner.user_name && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-center"
            >
              <span className="text-amber-600 font-semibold">
                ★ {currentWinner.user_name} is currently winning! ({gameScore?.afcScore}-{gameScore?.nfcScore})
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
