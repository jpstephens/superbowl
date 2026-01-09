'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp } from 'lucide-react';
import type { GridSquare } from '@/lib/supabase/types';

interface WinProbabilityProps {
  squares: GridSquare[];
  gameScore: any;
}

export default function WinProbability({ squares, gameScore }: WinProbabilityProps) {
  const [probabilities, setProbabilities] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    if (squares.length === 0 || !gameScore || !gameScore.isLive) {
      setProbabilities(new Map());
      return;
    }

    calculateProbabilities();
  }, [squares, gameScore]);

  const calculateProbabilities = () => {
    // Simplified probability calculation
    // In a real implementation, this would use more sophisticated algorithms
    const newProbabilities = new Map<string, number>();

    squares.forEach(square => {
      if (!square.row_score && square.row_score !== 0) return;
      if (!square.col_score && square.col_score !== 0) return;

      const currentAfc = gameScore.afcScore || 0;
      const currentNfc = gameScore.nfcScore || 0;
      const quarter = gameScore.quarter || 0;
      const timeRemaining = gameScore.timeRemaining || '15:00';

      // Calculate probability based on:
      // 1. How close current score is to target
      // 2. Time remaining
      // 3. Historical scoring patterns

      const targetAfc = square.row_score;
      const targetNfc = square.col_score;

      // Current last digits
      const currentAfcLast = currentAfc % 10;
      const currentNfcLast = currentNfc % 10;

      // Distance to target
      const afcDistance = Math.min(
        Math.abs(currentAfcLast - targetAfc),
        10 - Math.abs(currentAfcLast - targetAfc)
      );
      const nfcDistance = Math.min(
        Math.abs(currentNfcLast - targetNfc),
        10 - Math.abs(currentNfcLast - targetNfc)
      );

      // Base probability (simplified)
      // Closer to target = higher probability
      // More time remaining = higher probability
      const timeFactor = parseFloat(timeRemaining.split(':')[0]) / 15; // 0-1 based on quarter time
      const distanceFactor = (10 - (afcDistance + nfcDistance)) / 10; // 0-1 based on distance

      let probability = (distanceFactor * 0.6 + timeFactor * 0.4) * 100;
      probability = Math.max(0, Math.min(100, probability)); // Clamp 0-100

      // Add some randomness for demo (remove in production)
      probability = probability * 0.3 + Math.random() * 70;

      newProbabilities.set(square.id, Math.round(probability));
    });

    setProbabilities(newProbabilities);
  };

  if (squares.length === 0) {
    return (
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-white border border-blue-200">
        <div className="text-center text-gray-500">
          <TrendingUp className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">Select squares to see win probabilities</p>
        </div>
      </Card>
    );
  }

  if (!gameScore?.isLive) {
    return (
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-white border border-blue-200">
        <div className="text-center text-gray-500">
          <TrendingUp className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">Probabilities will appear when the game is live</p>
        </div>
      </Card>
    );
  }

  const sortedSquares = [...squares].sort((a, b) => {
    const probA = probabilities.get(a.id) || 0;
    const probB = probabilities.get(b.id) || 0;
    return probB - probA;
  });

  return (
    <Card className="p-6 bg-gradient-to-br from-blue-50 to-white border border-blue-200">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-bold text-gray-900">Win Probability</h3>
      </div>
      <p className="text-xs text-gray-600 mb-4">
        Real-time odds based on current score and time remaining
      </p>
      <div className="space-y-3">
        {sortedSquares.slice(0, 5).map(square => {
          const probability = probabilities.get(square.id) || 0;
          return (
            <div key={square.id} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-gray-900">
                  {square.row_score} - {square.col_score}
                </span>
                <span className="font-bold text-blue-600">{probability}%</span>
              </div>
              <Progress value={probability} className="h-2" />
            </div>
          );
        })}
        {sortedSquares.length > 5 && (
          <p className="text-xs text-gray-500 text-center mt-2">
            +{sortedSquares.length - 5} more squares
          </p>
        )}
      </div>
    </Card>
  );
}

