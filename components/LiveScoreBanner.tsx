'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface LiveScoreData {
  afcScore: number;
  nfcScore: number;
  afcTeam: string;
  nfcTeam: string;
  quarter: number;
  timeRemaining: string;
  isLive: boolean;
  isHalftime: boolean;
  isFinal: boolean;
  source: string;
  fetchedAt: string;
}

interface LiveScoreBannerProps {
  onScoreUpdate?: (data: LiveScoreData) => void;
  refreshInterval?: number;
  showDetails?: boolean;
}

/**
 * Compact Live Score Banner
 * Shows score in a single row, minimal footprint
 */
export default function LiveScoreBanner({
  onScoreUpdate,
  refreshInterval = 15000,
}: LiveScoreBannerProps) {
  const [score, setScore] = useState<LiveScoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchScore = async () => {
    try {
      const response = await fetch('/api/game-score/live');
      if (!response.ok) throw new Error('Failed to fetch score');

      const data: LiveScoreData = await response.json();
      setScore(data);
      setError(null);

      if (onScoreUpdate) {
        onScoreUpdate(data);
      }
    } catch (err) {
      console.error('Error fetching live score:', err);
      setError('Unable to fetch live score');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScore();
    const interval = setInterval(fetchScore, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const winningNumbers = score ? {
    afc: score.afcScore % 10,
    nfc: score.nfcScore % 10,
  } : null;

  const getQuarterText = () => {
    if (!score) return '';
    if (score.isFinal) return 'FINAL';
    if (score.isHalftime) return 'HALF';
    if (score.quarter === 5) return 'OT';
    return `Q${score.quarter}`;
  };

  if (loading) {
    return (
      <div className="bg-white border-2 border-gray-200 rounded-lg px-4 py-3 shadow-md">
        <div className="flex items-center justify-center gap-2 text-gray-500 text-base">
          <div className="w-5 h-5 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
          <span className="font-medium">Loading score...</span>
        </div>
      </div>
    );
  }

  if (error && !score) {
    return (
      <div className="bg-white border-2 border-gray-200 rounded-lg px-4 py-3 shadow-md">
        <div className="text-center text-gray-500 text-base font-medium">
          Live score unavailable
        </div>
      </div>
    );
  }

  if (!score) return null;

  return (
    <div className="bg-white border-2 border-gray-200 rounded-lg px-5 py-4 shadow-md">
      <div className="flex items-center justify-between gap-4">
        {/* Live indicator */}
        <div className="flex items-center gap-2">
          {score.isLive ? (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-[#ff453a] rounded text-sm font-bold uppercase text-white">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              Live
            </div>
          ) : score.isFinal ? (
            <div className="px-3 py-1 bg-gray-200 rounded text-sm font-bold uppercase text-[#232842]">
              Final
            </div>
          ) : (
            <div className="px-3 py-1 bg-gray-100 rounded text-sm font-semibold text-gray-500">
              Pre-Game
            </div>
          )}
        </div>

        {/* Score */}
        <div className="flex items-center gap-3">
          {/* AFC */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 uppercase hidden sm:inline font-semibold">{score.afcTeam}</span>
            <motion.span
              key={score.afcScore}
              initial={{ scale: 1.2, color: '#d4af37' }}
              animate={{ scale: 1, color: '#232842' }}
              className="text-3xl font-black tabular-nums"
            >
              {score.afcScore}
            </motion.span>
          </div>

          {/* Divider with quarter */}
          <div className="flex flex-col items-center">
            <span className="text-gray-400 text-xl font-bold">-</span>
            <span className="text-xs text-gray-500 font-bold">{getQuarterText()}</span>
          </div>

          {/* NFC */}
          <div className="flex items-center gap-2">
            <motion.span
              key={score.nfcScore}
              initial={{ scale: 1.2, color: '#d4af37' }}
              animate={{ scale: 1, color: '#232842' }}
              className="text-3xl font-black tabular-nums"
            >
              {score.nfcScore}
            </motion.span>
            <span className="text-sm text-gray-500 uppercase hidden sm:inline font-semibold">{score.nfcTeam}</span>
          </div>
        </div>

        {/* Winning numbers */}
        {winningNumbers && (score.isLive || score.isFinal) && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 hidden sm:inline font-medium">Numbers:</span>
            <div className="flex items-center gap-1 px-3 py-1 bg-[#d4af37]/15 border-2 border-[#d4af37]/30 rounded">
              <span className="text-base font-bold text-[#d4af37]">{winningNumbers.afc}</span>
              <span className="text-gray-400 font-bold">-</span>
              <span className="text-base font-bold text-[#d4af37]">{winningNumbers.nfc}</span>
            </div>
          </div>
        )}

        {/* Time remaining */}
        {score.isLive && score.timeRemaining && (
          <div className="text-base font-mono text-[#232842] font-bold">
            {score.timeRemaining}
          </div>
        )}
      </div>
    </div>
  );
}
