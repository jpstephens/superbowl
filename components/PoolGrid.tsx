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

  return (
    <div className="w-full">
      {/* NFC Label - Top */}
      <div className="flex justify-center mb-4">
        <div className="bg-blue-600 text-white px-8 py-3 rounded-full text-2xl sm:text-3xl font-bold tracking-wide shadow-lg">
          {nfcTeam}
        </div>
      </div>

      <div className="flex items-stretch">
        {/* AFC Label - Left Side */}
        <div className="flex items-center justify-center pr-3">
          <div
            className="bg-red-600 text-white px-6 py-3 rounded-full text-2xl sm:text-3xl font-bold tracking-wide shadow-lg whitespace-nowrap"
            style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}
          >
            {afcTeam}
          </div>
        </div>

        {/* Grid Container */}
        <div className="flex-1 overflow-x-auto">
          {/* Column Headers */}
          <div className="grid grid-cols-10 gap-1 mb-1" style={{ minWidth: '600px' }}>
            {numbers.map((col) => (
              <div key={`col-${col}`} className="h-10 flex items-center justify-center">
                <span className="text-lg font-bold text-gray-500">
                  {tournamentLaunched ? colScores.get(col) ?? '-' : ''}
                </span>
              </div>
            ))}
          </div>

          {/* Rows */}
          {numbers.map((row) => (
            <div key={`row-${row}`} className="flex gap-1 mb-1" style={{ minWidth: '600px' }}>
              {/* Row Header */}
              <div className="w-10 flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold text-gray-500">
                  {tournamentLaunched ? rowScores.get(row) ?? '-' : ''}
                </span>
              </div>

              {/* Cells */}
              <div className="flex-1 grid grid-cols-10 gap-1">
                {numbers.map((col) => {
                  const square = gridMap.get(`${row}-${col}`);
                  if (!square) return <div key={`cell-${row}-${col}`} className="aspect-square min-w-[50px] min-h-[50px]" />;

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
                      whileHover={isAvailable && !tournamentLaunched && !disabled ? { scale: 1.05 } : {}}
                      whileTap={isAvailable && !tournamentLaunched && !disabled ? { scale: 0.95 } : {}}
                      title={tooltipText}
                      className={`
                        aspect-square min-w-[50px] min-h-[50px] rounded-md flex items-center justify-center transition-all duration-100
                        ${isSelected ? 'bg-[#d4af37] border-2 border-[#c49b2f] text-[#232842] shadow-lg font-bold cursor-pointer' : ''}
                        ${isAvailable && !disabled && !isSelected && 'bg-emerald-50 border-2 border-emerald-300 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-400 cursor-pointer font-bold'}
                        ${isAvailable && disabled && !isSelected && 'bg-gray-100 border-2 border-gray-200 text-gray-400 cursor-not-allowed'}
                        ${isClaimed && !isSelected && !isWinner && 'bg-slate-100 border-2 border-slate-200 text-slate-600'}
                        ${isWinner && !isSelected && 'bg-[#d4af37] border-2 border-[#c49b2f] text-white shadow-lg animate-pulse font-bold'}
                      `}
                    >
                      {isWinner && <span className="text-xl">★</span>}
                      {isSelected && !isWinner && <span className="text-base font-bold">{boxNum}</span>}
                      {isAvailable && !isSelected && <span className="text-base font-bold">{boxNum}</span>}
                      {isClaimed && !isSelected && !isWinner && (
                        <span className="text-sm font-bold leading-tight text-center truncate px-1">
                          {getFirstName(square.user_name ?? null)}
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
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
