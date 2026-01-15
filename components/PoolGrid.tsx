'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import type { GridSquare } from '@/lib/supabase/types';

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
        .select(`*, profiles:user_id (name)`)
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
        <div className="w-6 h-6 border-2 border-[#232842] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Get first name only for cleaner display
  const getFirstName = (name: string | null) => {
    if (!name) return '?';
    return name.trim().split(' ')[0];
  };

  // Cell size
  const cellSize = 'w-[58px] h-[58px] sm:w-[65px] sm:h-[65px] md:w-[72px] md:h-[72px]';
  const headerSize = 'w-[58px] h-[50px] sm:w-[65px] sm:h-[55px] md:w-[72px] md:h-[60px]';
  const rowHeaderSize = 'w-[50px] h-[58px] sm:w-[55px] sm:h-[65px] md:w-[60px] md:h-[72px]';

  return (
    <div className="w-full flex flex-col items-center overflow-x-auto">
      {/* Team Label - Top */}
      <div className="text-center mb-2">
        <span className="text-2xl sm:text-3xl font-bold text-blue-600">{nfcTeam}</span>
      </div>

      <div className="flex">
        {/* Team Label - Left (rotated) */}
        <div className="flex items-center justify-center mr-2">
          <span
            className="text-2xl sm:text-3xl font-bold text-red-600"
            style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}
          >
            {afcTeam}
          </span>
        </div>

        {/* Grid Table */}
        <div className="border-2 border-gray-400 inline-block">
          {/* Header Row - Blue */}
          <div className="flex">
            {/* Empty corner cell */}
            <div className={`${rowHeaderSize} bg-white border-r border-b border-gray-300`} />
            {/* Column headers */}
            {numbers.map((col) => (
              <div
                key={`col-${col}`}
                className={`${headerSize} bg-blue-500 border-r border-b border-gray-300 flex items-center justify-center last:border-r-0`}
              >
                <span className="text-xl sm:text-2xl font-bold text-white">
                  {tournamentLaunched ? colScores.get(col) ?? '' : ''}
                </span>
              </div>
            ))}
          </div>

          {/* Data Rows */}
          {numbers.map((row) => (
            <div key={`row-${row}`} className="flex">
              {/* Row header - Red */}
              <div className={`${rowHeaderSize} bg-red-500 border-r border-b border-gray-300 flex items-center justify-center last:border-b-0`}>
                <span className="text-xl sm:text-2xl font-bold text-white">
                  {tournamentLaunched ? rowScores.get(row) ?? '' : ''}
                </span>
              </div>

              {/* Cells */}
              {numbers.map((col) => {
                const square = gridMap.get(`${row}-${col}`);
                if (!square) return <div key={`cell-${row}-${col}`} className={`${cellSize} border-r border-b border-gray-300`} />;

                const isSelected = selectedSquareIds.has(square.id);
                const isClaimed = square.status === 'paid' || square.status === 'confirmed';
                const isAvailable = square.status === 'available';
                const isWinner = currentWinner?.id === square.id;
                const boxNum = row * 10 + col + 1;

                const tooltipText = isClaimed
                  ? `#${boxNum} · ${square.user_name || 'Claimed'}`
                  : `#${boxNum} · Available`;

                return (
                  <motion.button
                    key={`cell-${row}-${col}`}
                    onClick={() => handleSquareClick(square)}
                    disabled={!isAvailable || tournamentLaunched || disabled}
                    whileHover={isAvailable && !tournamentLaunched && !disabled ? { scale: 1.02 } : {}}
                    whileTap={isAvailable && !tournamentLaunched && !disabled ? { scale: 0.98 } : {}}
                    title={tooltipText}
                    className={`
                      ${cellSize} border-r border-b border-gray-300 flex items-center justify-center transition-all duration-100
                      ${row === 9 ? 'border-b-0' : ''}
                      ${col === 9 ? 'border-r-0' : ''}
                      ${isSelected ? 'bg-[#d4af37] text-[#232842] font-bold cursor-pointer z-10 relative shadow-md' : ''}
                      ${isAvailable && !disabled && !isSelected && 'bg-white text-gray-700 hover:bg-emerald-50 cursor-pointer font-medium'}
                      ${isAvailable && disabled && !isSelected && 'bg-gray-50 text-gray-400 cursor-not-allowed'}
                      ${isClaimed && !isSelected && !isWinner && 'bg-gray-100 text-gray-600'}
                      ${isWinner && !isSelected && 'bg-[#d4af37] text-white font-bold animate-pulse'}
                    `}
                  >
                    {isWinner && <span className="text-xl">★</span>}
                    {isSelected && !isWinner && <span className="text-lg font-bold">{boxNum}</span>}
                    {isAvailable && !isSelected && <span className="text-base sm:text-lg">{boxNum}</span>}
                    {isClaimed && !isSelected && !isWinner && (
                      <span className="text-sm sm:text-base font-medium leading-tight text-center truncate px-1">
                        {getFirstName(square.user_name ?? null)}
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Winner Banner */}
      {currentWinner && currentWinner.user_name && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-[#d4af37]/10 border border-[#d4af37]/30 rounded-lg text-center"
        >
          <span className="text-[#232842] font-semibold">
            ★ {currentWinner.user_name} is winning! ({gameScore?.afcScore}-{gameScore?.nfcScore})
          </span>
        </motion.div>
      )}
    </div>
  );
}
