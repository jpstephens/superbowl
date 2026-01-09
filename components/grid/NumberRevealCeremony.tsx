'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Trophy, Sparkles, Star } from 'lucide-react';
import type { GridSquare } from '@/lib/supabase/types';

// Historical "good" numbers - these combinations have won frequently
const LUCKY_NUMBERS = new Set(['0', '7', '3', '4']);

interface NumberRevealCeremonyProps {
  squares: GridSquare[];
  userSquares: GridSquare[];
  afcTeam: string;
  nfcTeam: string;
  onComplete?: () => void;
  isRevealing?: boolean;
}

/**
 * Number Reveal Ceremony Component
 * Dramatic slot-machine style reveal of row/column numbers after tournament launch
 */
export default function NumberRevealCeremony({
  squares,
  userSquares,
  afcTeam,
  nfcTeam,
  onComplete,
  isRevealing = false,
}: NumberRevealCeremonyProps) {
  const [stage, setStage] = useState<'countdown' | 'spinning' | 'revealing' | 'complete'>('countdown');
  const [countdown, setCountdown] = useState(3);
  const [revealedRows, setRevealedRows] = useState<number[]>([]);
  const [revealedCols, setRevealedCols] = useState<number[]>([]);
  const [showUserNumbers, setShowUserNumbers] = useState(false);

  // Get the final number mappings
  const rowNumbers = Array.from({ length: 10 }, (_, i) => {
    const square = squares.find((s) => s.row_number === i);
    return square?.row_score ?? i;
  });

  const colNumbers = Array.from({ length: 10 }, (_, i) => {
    const square = squares.find((s) => s.col_number === i);
    return square?.col_score ?? i;
  });

  // Launch confetti
  const fireConfetti = useCallback(() => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 9999,
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
  }, []);

  // Countdown effect
  useEffect(() => {
    if (!isRevealing) return;
    if (stage !== 'countdown') return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setStage('spinning');
    }
  }, [countdown, stage, isRevealing]);

  // Spinning phase
  useEffect(() => {
    if (stage !== 'spinning') return;

    const spinDuration = 2000;
    const timer = setTimeout(() => {
      setStage('revealing');
    }, spinDuration);

    return () => clearTimeout(timer);
  }, [stage]);

  // Reveal numbers one by one
  useEffect(() => {
    if (stage !== 'revealing') return;

    const revealInterval = 300;
    const totalNumbers = 10;

    // Reveal columns first, then rows
    const revealSequence = async () => {
      // Reveal columns
      for (let i = 0; i < totalNumbers; i++) {
        await new Promise((resolve) => setTimeout(resolve, revealInterval));
        setRevealedCols((prev) => [...prev, i]);
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      // Reveal rows
      for (let i = 0; i < totalNumbers; i++) {
        await new Promise((resolve) => setTimeout(resolve, revealInterval));
        setRevealedRows((prev) => [...prev, i]);
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
      
      // Show user's numbers and fire confetti
      setShowUserNumbers(true);
      fireConfetti();
      
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setStage('complete');
      onComplete?.();
    };

    revealSequence();
  }, [stage, fireConfetti, onComplete]);

  // Get user's assigned numbers
  const getUserNumbers = () => {
    return userSquares.map((square) => ({
      row: square.row_score,
      col: square.col_score,
      isLucky:
        LUCKY_NUMBERS.has(String(square.row_score)) ||
        LUCKY_NUMBERS.has(String(square.col_score)),
    }));
  };

  if (!isRevealing && stage === 'countdown') {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
      >
        <div className="max-w-4xl w-full">
          {/* Countdown Stage */}
          {stage === 'countdown' && (
            <motion.div
              key="countdown"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              className="text-center"
            >
              <h2 className="text-4xl font-bold text-white mb-8">Numbers Reveal!</h2>
              <motion.div
                key={countdown}
                initial={{ scale: 2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                className="text-9xl font-black text-[#CDA33B]"
              >
                {countdown}
              </motion.div>
            </motion.div>
          )}

          {/* Spinning Stage */}
          {stage === 'spinning' && (
            <motion.div
              key="spinning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <h2 className="text-3xl font-bold text-white mb-8">
                <Sparkles className="inline w-8 h-8 mr-2" />
                Randomizing Numbers...
                <Sparkles className="inline w-8 h-8 ml-2" />
              </h2>
              
              <div className="flex justify-center gap-8">
                {/* AFC Numbers Spinner */}
                <div className="text-center">
                  <p className="text-[#CDA33B] font-semibold mb-4">{afcTeam}</p>
                  <div className="flex gap-2">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-10 h-14 bg-gray-800 rounded-lg flex items-center justify-center text-2xl font-bold text-white overflow-hidden"
                      >
                        <motion.div
                          animate={{ y: [-100, 100] }}
                          transition={{
                            duration: 0.15,
                            repeat: Infinity,
                            ease: 'linear',
                            delay: i * 0.05,
                          }}
                        >
                          {Math.floor(Math.random() * 10)}
                        </motion.div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center gap-8 mt-8">
                {/* NFC Numbers Spinner */}
                <div className="text-center">
                  <p className="text-[#CDA33B] font-semibold mb-4">{nfcTeam}</p>
                  <div className="flex gap-2">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-10 h-14 bg-gray-800 rounded-lg flex items-center justify-center text-2xl font-bold text-white overflow-hidden"
                      >
                        <motion.div
                          animate={{ y: [100, -100] }}
                          transition={{
                            duration: 0.15,
                            repeat: Infinity,
                            ease: 'linear',
                            delay: i * 0.05,
                          }}
                        >
                          {Math.floor(Math.random() * 10)}
                        </motion.div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Revealing Stage */}
          {(stage === 'revealing' || stage === 'complete') && (
            <motion.div
              key="revealing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <h2 className="text-3xl font-bold text-white mb-8">
                {stage === 'complete' ? (
                  <>
                    <Trophy className="inline w-8 h-8 mr-2 text-[#CDA33B]" />
                    Your Numbers Are Set!
                    <Trophy className="inline w-8 h-8 ml-2 text-[#CDA33B]" />
                  </>
                ) : (
                  'Revealing Numbers...'
                )}
              </h2>

              {/* Column Numbers (AFC) */}
              <div className="mb-8">
                <p className="text-[#CDA33B] font-semibold mb-4 text-lg">{afcTeam} (Columns)</p>
                <div className="flex justify-center gap-2">
                  {colNumbers.map((num, i) => (
                    <motion.div
                      key={`col-${i}`}
                      initial={{ rotateX: 90, opacity: 0 }}
                      animate={
                        revealedCols.includes(i)
                          ? { rotateX: 0, opacity: 1 }
                          : { rotateX: 90, opacity: 0.3 }
                      }
                      transition={{ duration: 0.3 }}
                      className={`w-12 h-16 rounded-lg flex items-center justify-center text-2xl font-bold ${
                        revealedCols.includes(i)
                          ? LUCKY_NUMBERS.has(String(num))
                            ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-yellow-900'
                            : 'bg-gray-700 text-white'
                          : 'bg-gray-800 text-gray-600'
                      }`}
                    >
                      {revealedCols.includes(i) ? num : '?'}
                      {revealedCols.includes(i) && LUCKY_NUMBERS.has(String(num)) && (
                        <Star className="absolute -top-1 -right-1 w-4 h-4 text-yellow-300 fill-yellow-300" />
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Row Numbers (NFC) */}
              <div className="mb-8">
                <p className="text-[#CDA33B] font-semibold mb-4 text-lg">{nfcTeam} (Rows)</p>
                <div className="flex justify-center gap-2">
                  {rowNumbers.map((num, i) => (
                    <motion.div
                      key={`row-${i}`}
                      initial={{ rotateX: 90, opacity: 0 }}
                      animate={
                        revealedRows.includes(i)
                          ? { rotateX: 0, opacity: 1 }
                          : { rotateX: 90, opacity: 0.3 }
                      }
                      transition={{ duration: 0.3 }}
                      className={`w-12 h-16 rounded-lg flex items-center justify-center text-2xl font-bold relative ${
                        revealedRows.includes(i)
                          ? LUCKY_NUMBERS.has(String(num))
                            ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-yellow-900'
                            : 'bg-gray-700 text-white'
                          : 'bg-gray-800 text-gray-600'
                      }`}
                    >
                      {revealedRows.includes(i) ? num : '?'}
                      {revealedRows.includes(i) && LUCKY_NUMBERS.has(String(num)) && (
                        <Star className="absolute -top-1 -right-1 w-4 h-4 text-yellow-300 fill-yellow-300" />
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* User's Numbers Summary */}
              <AnimatePresence>
                {showUserNumbers && userSquares.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 bg-gray-800/50 rounded-xl p-6 backdrop-blur"
                  >
                    <h3 className="text-xl font-bold text-white mb-4">
                      🎯 Your Squares
                    </h3>
                    <div className="flex flex-wrap justify-center gap-3">
                      {getUserNumbers().map((combo, i) => (
                        <motion.div
                          key={i}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: i * 0.1 }}
                          className={`px-4 py-2 rounded-lg font-bold ${
                            combo.isLucky
                              ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900'
                              : 'bg-gray-700 text-white'
                          }`}
                        >
                          {afcTeam.split(' ').pop()} {combo.col} - {nfcTeam.split(' ').pop()} {combo.row}
                          {combo.isLucky && ' 🍀'}
                        </motion.div>
                      ))}
                    </div>
                    {getUserNumbers().some((c) => c.isLucky) && (
                      <p className="text-yellow-400 mt-4 text-sm">
                        ✨ You have historically lucky number combinations!
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Close Button */}
              {stage === 'complete' && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  onClick={onComplete}
                  className="mt-8 px-8 py-3 bg-[#CDA33B] text-white font-bold rounded-full hover:bg-[#b8922f] transition-colors"
                >
                  View Grid
                </motion.button>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

