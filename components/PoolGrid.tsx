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

/**
 * Pool Grid Component
 * 10x10 Super Bowl squares grid
 * Dark, premium design with gold/green accents
 */
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
  const [recentlyPurchased, setRecentlyPurchased] = useState<Set<string>>(new Set());

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

          if (updated.status === 'paid' || updated.status === 'confirmed') {
            setRecentlyPurchased((prev) => new Set(prev).add(updated.id));
            setTimeout(() => {
              setRecentlyPurchased((prev) => {
                const next = new Set(prev);
                next.delete(updated.id);
                return next;
              });
            }, 5000);
          }
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
      console.error('Error loading grid:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate current winning square
  const currentWinner = useMemo(() => {
    if (!gameScore?.isLive || gameScore.afcScore === undefined || gameScore.nfcScore === undefined) {
      return null;
    }

    const afcLast = gameScore.afcScore % 10;
    const nfcLast = gameScore.nfcScore % 10;

    return squares.find(
      (s) =>
        s.row_score === afcLast &&
        s.col_score === nfcLast &&
        (s.status === 'paid' || s.status === 'confirmed')
    ) || null;
  }, [squares, gameScore?.afcScore, gameScore?.nfcScore, gameScore?.isLive]);

  // Build grid data structures
  const { gridMap, userSquares, rowScoreMap, colScoreMap } = useMemo(() => {
    const gridMap = new Map<string, GridSquare>();
    const userSquares = new Set<string>();
    const rowScoreMap = new Map<number, number | string>();
    const colScoreMap = new Map<number, number | string>();

    squares.forEach((square) => {
      gridMap.set(`${square.row_number}-${square.col_number}`, square);
      if (square.user_id === userId) userSquares.add(square.id);

      if (tournamentLaunched && square.row_score !== null && square.col_score !== null) {
        rowScoreMap.set(square.row_number, square.row_score);
        colScoreMap.set(square.col_number, square.col_score);
      } else {
        rowScoreMap.set(square.row_number, '?');
        colScoreMap.set(square.col_number, '?');
      }
    });

    return { gridMap, userSquares, rowScoreMap, colScoreMap };
  }, [squares, userId, tournamentLaunched]);

  const handleSquareClick = (square: GridSquare) => {
    if (!onSquareSelect || tournamentLaunched || disabled) return;
    if (square.status !== 'available') return;
    onSquareSelect(square);
  };

  const afcTeam = gameScore?.afcTeam || 'AFC';
  const nfcTeam = gameScore?.nfcTeam || 'NFC';
  const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* NFC Team Header (Columns) */}
      <div className="flex mb-2">
        <div className="w-12 sm:w-14" /> {/* Spacer for row headers */}
        <div className="flex-1 text-center">
          <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 border-2 border-gray-200 rounded-lg text-lg font-bold text-[#232842]">
            <span className="w-3 h-3 rounded-full bg-[#0a84ff]" />
            {gameScore?.isLive ? nfcTeam : 'NFC'}
          </span>
        </div>
      </div>

      <div className="flex">
        {/* AFC Team Header (Rows) - Vertical */}
        <div className="flex flex-col items-center justify-center mr-2">
          <div
            className="px-2.5 py-4 bg-gray-100 border-2 border-gray-200 rounded-lg text-lg font-bold text-[#232842] whitespace-nowrap"
            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)' }}
          >
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#ff453a]" />
              {gameScore?.isLive ? afcTeam : 'AFC'}
            </span>
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-x-auto scrollbar-hide">
          <div style={{ minWidth: '600px' }}>
            {/* Column Headers - Only show after tournament launch */}
            <div className="flex mb-1">
              <div className="w-12 sm:w-14 h-10 sm:h-12" /> {/* Corner */}
              {numbers.map((num) => (
                <div
                  key={`col-${num}`}
                  className="flex-1 h-10 sm:h-12 flex items-center justify-center text-gray-500 font-bold text-lg"
                >
                  {tournamentLaunched ? colScoreMap.get(num) : ''}
                </div>
              ))}
            </div>

            {/* Rows */}
            {numbers.map((rowNum) => (
              <div key={`row-${rowNum}`} className="flex mb-1">
                {/* Row Header - Only show after tournament launch */}
                <div className="w-12 sm:w-14 h-16 sm:h-20 flex items-center justify-center text-gray-500 font-bold text-lg">
                  {tournamentLaunched ? rowScoreMap.get(rowNum) : ''}
                </div>

                {/* Cells */}
                {numbers.map((colNum) => {
                  const square = gridMap.get(`${rowNum}-${colNum}`);
                  if (!square) return <div key={`cell-${rowNum}-${colNum}`} className="flex-1" />;

                  const isSelected = selectedSquareIds.has(square.id);
                  const isClaimed = square.status === 'paid' || square.status === 'confirmed';
                  const isAvailable = square.status === 'available';
                  const isWinner = currentWinner?.id === square.id;
                  const isUserSquare = userSquares.has(square.id);
                  const isRecentlyPurchased = recentlyPurchased.has(square.id);
                  const squareNumber = rowNum * 10 + colNum + 1;

                  // Get display name - full first name + last initial, or truncate if too long
                  const getDisplayName = () => {
                    if (!square.user_name) return '';
                    const parts = square.user_name.split(' ');
                    if (parts.length === 1) return parts[0].slice(0, 8);
                    const firstName = parts[0];
                    const lastInitial = parts[parts.length - 1][0];
                    const display = `${firstName} ${lastInitial}.`;
                    return display.length > 10 ? `${firstName.slice(0, 6)}...` : display;
                  };

                  return (
                    <div key={`cell-${rowNum}-${colNum}`} className="flex-1 p-0.5">
                      <motion.button
                        onClick={() => handleSquareClick(square)}
                        disabled={!isAvailable || tournamentLaunched || disabled}
                        whileHover={isAvailable && !tournamentLaunched && !disabled ? { scale: 1.05 } : {}}
                        whileTap={isAvailable && !tournamentLaunched && !disabled ? { scale: 0.95 } : {}}
                        className={cn(
                          'w-full h-16 sm:h-20 rounded-lg transition-all duration-150 relative overflow-hidden',
                          'flex flex-col items-center justify-center gap-0.5 text-sm font-bold',
                          // Available
                          isAvailable && !disabled && 'bg-[#30d158]/15 border-2 border-[#30d158]/40 hover:bg-[#30d158]/25 hover:border-[#30d158]/60 cursor-pointer',
                          isAvailable && disabled && 'bg-gray-100 border-2 border-gray-200 cursor-not-allowed',
                          // Claimed
                          isClaimed && !isSelected && !isWinner && !isUserSquare && 'bg-gray-100 border-2 border-gray-200',
                          // User's square (not selected)
                          isUserSquare && !isSelected && !isWinner && 'bg-[#0a84ff]/15 border-2 border-[#0a84ff]/40',
                          // Selected
                          isSelected && 'bg-[#d4af37] border-2 border-[#c49b2f] text-white shadow-md',
                          // Winner
                          isWinner && 'bg-[#d4af37] border-2 border-[#c49b2f] text-white shadow-[0_0_20px_rgba(212,175,55,0.5)]'
                        )}
                      >
                        {/* Pulse for recent purchases */}
                        <AnimatePresence>
                          {isRecentlyPurchased && (
                            <motion.div
                              initial={{ scale: 0, opacity: 0.6 }}
                              animate={{ scale: 2.5, opacity: 0 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 1, repeat: 2 }}
                              className="absolute inset-0 bg-[#d4af37] rounded-full"
                            />
                          )}
                        </AnimatePresence>

                        {/* Winner icon */}
                        {isWinner && (
                          <motion.span
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                            className="text-xl"
                          >
                            ★
                          </motion.span>
                        )}

                        {/* Selected checkmark */}
                        {isSelected && !isWinner && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="text-xl"
                          >
                            ✓
                          </motion.span>
                        )}

                        {/* Available squares: Show number */}
                        {isAvailable && !isSelected && (
                          <span className="text-base sm:text-lg font-bold text-gray-500">
                            {squareNumber}
                          </span>
                        )}

                        {/* Claimed squares (not selected, not winner): Show name + number */}
                        {isClaimed && !isSelected && !isWinner && (
                          <>
                            <span className={`text-xs sm:text-sm font-semibold truncate max-w-full px-1 ${
                              isUserSquare ? 'text-[#0a84ff]' : 'text-gray-600'
                            }`}>
                              {getDisplayName()}
                            </span>
                            <span className={`text-[10px] sm:text-xs ${
                              isUserSquare ? 'text-[#0a84ff]/70' : 'text-gray-400'
                            }`}>
                              #{squareNumber}
                            </span>
                          </>
                        )}
                      </motion.button>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Winner Banner */}
      <AnimatePresence>
        {currentWinner && currentWinner.user_name && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-4 bg-[#d4af37]/15 border-2 border-[#d4af37]/30 rounded-xl p-4 text-center"
          >
            <div className="flex items-center justify-center gap-2">
              <span className="text-xl">★</span>
              <span className="font-bold text-[#d4af37] text-lg">
                {currentWinner.user_name} is winning!
              </span>
            </div>
            <p className="text-gray-500 text-base mt-1 font-medium">
              Score: {gameScore?.afcScore}-{gameScore?.nfcScore}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
