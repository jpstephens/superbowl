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
  const [error, setError] = useState<string | null>(null);
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

      // Fetch grid squares without the join first (more reliable)
      const { data, error } = await supabase
        .from('grid_squares')
        .select('*')
        .order('row_number', { ascending: true })
        .order('col_number', { ascending: true });

      if (error) {
        console.error('Error fetching grid squares:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.error('No grid squares found in database');
        setError('No grid squares found');
        setSquares([]);
        return;
      }

      // Fetch profile names separately for claimed squares
      const claimedUserIds = data
        .filter(sq => sq.user_id)
        .map(sq => sq.user_id);

      let profileMap = new Map<string, string>();
      if (claimedUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', claimedUserIds);

        profiles?.forEach(p => profileMap.set(p.id, p.name || ''));
      }

      const processedSquares = data.map((square) => ({
        ...square,
        user_name: square.user_id ? profileMap.get(square.user_id) || null : null,
      }));

      console.log(`Loaded ${processedSquares.length} squares`);
      setSquares(processedSquares);
    } catch (err) {
      console.error('Error loading grid:', err);
      setError(err instanceof Error ? err.message : 'Failed to load grid');
    } finally {
      setLoading(false);
    }
  };

  const { gridMap, rowScores, colScores } = useMemo(() => {
    const gridMap = new Map<string, GridSquare>();
    const rowScores = new Map<number, number>();
    const colScores = new Map<number, number>();

    console.log(`Building gridMap from ${squares.length} squares`);

    squares.forEach((square, idx) => {
      const key = `${square.row_number}-${square.col_number}`;
      gridMap.set(key, square);
      if (idx === 0) {
        console.log(`First square: row=${square.row_number} (${typeof square.row_number}), col=${square.col_number} (${typeof square.col_number}), key=${key}`);
      }
      if (tournamentLaunched && square.row_score !== null) {
        rowScores.set(square.row_number, square.row_score);
      }
      if (tournamentLaunched && square.col_score !== null) {
        colScores.set(square.col_number, square.col_score);
      }
    });

    console.log(`GridMap has ${gridMap.size} entries`);
    return { gridMap, rowScores, colScores };
  }, [squares, tournamentLaunched]);

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
      <div className="w-full flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-10 h-10 border-3 border-[#cda33b] border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm font-medium animate-pulse">Loading grid...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-16 gap-4">
        <p className="text-red-500 font-medium">Error: {error}</p>
        <button
          onClick={() => { setError(null); setLoading(true); loadGrid(); }}
          className="px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600"
        >
          Retry
        </button>
      </div>
    );
  }

  if (squares.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-16 gap-4">
        <p className="text-gray-500 font-medium">No squares loaded. Check console for errors.</p>
        <button
          onClick={() => { setLoading(true); loadGrid(); }}
          className="px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600"
        >
          Reload Grid
        </button>
      </div>
    );
  }

  // Get first name only for cleaner display
  const getFirstName = (name: string | null) => {
    if (!name) return 'Taken';
    return name.trim().split(' ')[0];
  };

  // Cell size - larger for desktop
  const cellSize = 'w-[52px] h-[52px] sm:w-[62px] sm:h-[62px] md:w-[72px] md:h-[72px] lg:w-[82px] lg:h-[82px]';
  const headerSize = 'w-[52px] h-[44px] sm:w-[62px] sm:h-[50px] md:w-[72px] md:h-[56px] lg:w-[82px] lg:h-[60px]';
  const rowHeaderSize = 'w-[44px] h-[52px] sm:w-[50px] sm:h-[62px] md:w-[56px] md:h-[72px] lg:w-[60px] lg:h-[82px]';

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
        <table className="border-2 border-gray-400 border-collapse">
          {/* Header Row - Blue */}
          <thead>
            <tr>
              {/* Empty corner cell */}
              <th className={`${rowHeaderSize} bg-white border-r border-b border-gray-300`} />
              {/* Column headers */}
              {numbers.map((col, idx) => (
                <th
                  key={`col-${col}`}
                  className={`${headerSize} bg-blue-500 border-r border-b border-gray-300 ${idx === 9 ? 'border-r-0' : ''}`}
                >
                  <span className="text-xl sm:text-2xl font-bold text-white">
                    {tournamentLaunched ? colScores.get(col) ?? '' : ''}
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          {/* Data Rows */}
          <tbody>
          {numbers.map((row) => (
            <tr key={`row-${row}`}>
              {/* Row header - Red */}
              <td className={`${rowHeaderSize} bg-red-500 border-r border-b border-gray-300 text-center ${row === 9 ? 'border-b-0' : ''}`}>
                <span className="text-xl sm:text-2xl font-bold text-white">
                  {tournamentLaunched ? rowScores.get(row) ?? '' : ''}
                </span>
              </td>

              {/* Cells */}
              {numbers.map((col) => {
                const square = gridMap.get(`${row}-${col}`);
                if (!square) return <td key={`cell-${row}-${col}`} className={`${cellSize} border-r border-b border-gray-300 ${row === 9 ? 'border-b-0' : ''} ${col === 9 ? 'border-r-0' : ''}`} />;

                const isSelected = selectedSquareIds.has(square.id);
                const isClaimed = square.status === 'paid';
                const isAvailable = square.status === 'available';
                const boxNum = row * 10 + col + 1;

                const tooltipText = isClaimed
                  ? `#${boxNum} · ${square.user_name || 'Claimed'}`
                  : `#${boxNum} · Available`;

                return (
                  <td
                    key={`cell-${row}-${col}`}
                    className={`${cellSize} p-0 border-r border-b border-gray-300 ${row === 9 ? 'border-b-0' : ''} ${col === 9 ? 'border-r-0' : ''}`}
                  >
                    <motion.button
                      onClick={() => handleSquareClick(square)}
                      disabled={!isAvailable || tournamentLaunched || disabled}
                      whileHover={isAvailable && !tournamentLaunched && !disabled ? { scale: 1.05, zIndex: 20 } : {}}
                      whileTap={isAvailable && !tournamentLaunched && !disabled ? { scale: 0.95 } : {}}
                      title={tooltipText}
                      aria-label={`Square ${boxNum}. ${
                        isClaimed ? `Owned by ${square.user_name || 'Unknown'}` : 'Available for purchase'
                      }${isSelected ? '. Currently selected' : ''}`}
                      aria-pressed={isSelected}
                      className={`
                        w-full h-full flex items-center justify-center transition-all duration-150 relative
                        ${isSelected ? 'bg-gradient-to-br from-[#cda33b] to-[#b8960c] text-white font-bold cursor-pointer z-10 shadow-lg ring-2 ring-[#cda33b]/50' : ''}
                        ${isAvailable && !isSelected ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 hover:shadow-md cursor-pointer font-semibold' : ''}
                        ${isClaimed && !isSelected ? 'bg-gray-200 text-gray-700' : ''}
                      `}
                    >
                      {isSelected && <span className="text-lg font-bold drop-shadow-sm">{boxNum}</span>}
                      {isAvailable && !isSelected && <span className="text-base sm:text-lg">{boxNum}</span>}
                      {isClaimed && !isSelected && (
                        <span className="text-xs sm:text-sm font-medium leading-tight text-center truncate px-0.5">
                          {getFirstName(square.user_name ?? null)}
                        </span>
                      )}
                    </motion.button>
                  </td>
                );
              })}
            </tr>
          ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
