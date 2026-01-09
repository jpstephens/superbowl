'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { GameState } from '@/lib/supabase/types';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import PrizeBreakdown from '@/components/PrizeBreakdown';
import Header from '@/components/Header';

/**
 * HOMEPAGE
 *
 * Design Intent:
 * - The 10x10 grid IS the visual identity
 * - Michael Williams story provides emotional anchor
 * - Countdown creates urgency
 * - Simple, bold, memorable
 */
export default function Home() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [tournamentLaunched, setTournamentLaunched] = useState(false);
  const [stats, setStats] = useState({
    sold: 0,
    available: 100,
    raised: 0,
    price: 50
  });
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });
  const [gridPreview, setGridPreview] = useState<boolean[]>(Array(100).fill(false));
  const [loading, setLoading] = useState(true);

  // Super Bowl LIX - February 9, 2025
  const GAME_DATE = new Date('2025-02-09T18:30:00-05:00');

  useEffect(() => {
    loadData();

    // Countdown timer
    const timer = setInterval(() => {
      const now = new Date();
      const diff = GAME_DATE.getTime() - now.getTime();

      if (diff > 0) {
        setCountdown({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          mins: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          secs: Math.floor((diff % (1000 * 60)) / 1000)
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const loadData = async () => {
    try {
      const supabase = createClient();

      // Game state
      const { data: game } = await supabase
        .from('game_state')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (game) setGameState(game);

      // Check tournament state
      const { data: tournamentSetting } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'tournament_launched')
        .single();
      setTournamentLaunched(tournamentSetting?.value === 'true');

      // Grid squares for preview
      const { data: squares } = await supabase
        .from('grid_squares')
        .select('row_number, col_number, status');

      if (squares) {
        const preview = Array(100).fill(false);
        squares.forEach(sq => {
          if (sq.status === 'paid' || sq.status === 'confirmed') {
            const idx = sq.row_number * 10 + sq.col_number;
            preview[idx] = true;
          }
        });
        setGridPreview(preview);
      }

      // Stats
      const sold = squares?.filter(s => s.status === 'paid' || s.status === 'confirmed').length || 0;

      const { data: priceData } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'square_price')
        .single();

      const price = priceData?.value ? parseFloat(priceData.value) : 50;

      setStats({
        sold,
        available: 100 - sold,
        raised: sold * price,
        price
      });
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const isLive = gameState?.is_live || false;
  const isFinal = gameState?.is_final || false;

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a] overflow-x-hidden">

      {/* ===== NAVIGATION ===== */}
      <Header />

      {/* ===== HERO ===== */}
      <section className="relative min-h-screen flex items-center justify-center pt-24">
        {/* Decorative circular elements inspired by logo */}
        <div className="absolute top-40 right-10 w-64 h-64 rounded-full border-2 border-[#d4af37]/10 opacity-50" />
        <div className="absolute top-48 right-18 w-48 h-48 rounded-full border border-[#d4af37]/5" />
        <div className="absolute bottom-40 left-10 w-40 h-40 rounded-full border-2 border-[#d4af37]/10 opacity-30" />

        {/* Subtle background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#d4af37]/3 via-transparent to-transparent" />

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left: Copy */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              {/* Badge - State aware */}
              {isLive ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 rounded-full text-base mb-6 animate-pulse">
                  <span className="w-2.5 h-2.5 bg-white rounded-full animate-ping" />
                  <span className="text-white font-bold">GAME IS LIVE</span>
                </div>
              ) : tournamentLaunched ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 rounded-full text-base mb-6">
                  <span className="w-2.5 h-2.5 bg-white rounded-full" />
                  <span className="text-white font-medium">Numbers Assigned • Ready for Kickoff</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#232842] rounded-full text-base mb-6">
                  <span className="w-2.5 h-2.5 bg-[#30d158] rounded-full animate-pulse" />
                  <span className="text-white font-medium">Super Bowl LIX • Feb 9, 2025</span>
                </div>
              )}

              {/* Headline - State aware */}
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[0.9] tracking-tight mb-6 text-[#232842]">
                {isLive ? (
                  <>
                    Watch the
                    <br />
                    <span className="text-red-600">Action</span>
                  </>
                ) : tournamentLaunched ? (
                  <>
                    View Your
                    <br />
                    <span className="text-[#d4af37]">Numbers</span>
                  </>
                ) : (
                  <>
                    Pick Your
                    <br />
                    <span className="text-[#d4af37]">Squares</span>
                  </>
                )}
              </h1>

              {/* Subheadline - State aware */}
              <p className="text-xl text-gray-600 mb-8 max-w-md leading-relaxed">
                {isLive ? (
                  <>
                    The game is on! Check your squares and watch the winners update in real-time.
                    <span className="text-[#232842] font-semibold"> Good luck!</span>
                  </>
                ) : tournamentLaunched ? (
                  <>
                    All squares are sold and numbers have been assigned. Check your squares to see your winning numbers!
                    <span className="text-[#232842] font-semibold"> Game day is coming!</span>
                  </>
                ) : (
                  <>
                    Join our Super Bowl pool and support the
                    <span className="text-[#232842] font-semibold"> Michael Williams Memorial Scholarship</span>.
                    Every square funds a student's future.
                  </>
                )}
              </p>

              {/* CTA - State aware */}
              <div className="flex flex-wrap gap-4">
                {isLive ? (
                  <>
                    <Link
                      href="/pool"
                      className="group inline-flex items-center gap-3 px-8 py-4 bg-red-600 text-white font-bold text-lg rounded-xl hover:bg-red-700 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg animate-pulse"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                      Watch Live
                    </Link>
                    <Link
                      href="/grid"
                      className="inline-flex items-center gap-2 px-6 py-4 bg-[#232842] text-white font-semibold rounded-xl hover:bg-[#1a1f33] transition-colors shadow-lg"
                    >
                      View Grid
                    </Link>
                  </>
                ) : tournamentLaunched ? (
                  <>
                    <Link
                      href="/grid"
                      className="group inline-flex items-center gap-3 px-8 py-4 bg-[#d4af37] text-white font-bold text-lg rounded-xl hover:bg-[#c49b2f] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                    >
                      View Your Numbers
                      <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </Link>
                    <Link
                      href="/my-squares"
                      className="inline-flex items-center gap-2 px-6 py-4 bg-[#232842] text-white font-semibold rounded-xl hover:bg-[#1a1f33] transition-colors shadow-lg"
                    >
                      My Squares
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/grid"
                      className="group inline-flex items-center gap-3 px-8 py-4 bg-[#d4af37] text-white font-bold text-lg rounded-xl hover:bg-[#c49b2f] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                    >
                      Pick Your Squares
                      <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </Link>
                    <Link
                      href="/pool"
                      className="inline-flex items-center gap-2 px-6 py-4 bg-[#232842] text-white font-semibold rounded-xl hover:bg-[#1a1f33] transition-colors shadow-lg"
                    >
                      View Pool
                    </Link>
                  </>
                )}
              </div>

              {/* Quick stats - State aware */}
              <div className="mt-12 flex gap-8">
                {isLive && gameState ? (
                  <>
                    <div>
                      <div className="text-4xl font-black text-[#232842]">{gameState.afc_score || 0}</div>
                      <div className="text-base text-gray-600 mt-1 font-medium">{gameState.afc_team || 'AFC'}</div>
                    </div>
                    <div>
                      <div className="text-4xl font-black text-[#232842]">{gameState.nfc_score || 0}</div>
                      <div className="text-base text-gray-600 mt-1 font-medium">{gameState.nfc_team || 'NFC'}</div>
                    </div>
                    <div>
                      <div className="text-4xl font-black text-red-600">Q{gameState.quarter || 1}</div>
                      <div className="text-base text-gray-600 mt-1 font-medium">Quarter</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <div className="text-4xl font-black text-[#d4af37]">{stats.sold}</div>
                      <div className="text-base text-gray-600 mt-1 font-medium">Squares Sold</div>
                    </div>
                    <div>
                      <div className="text-4xl font-black text-[#232842]">{stats.available}</div>
                      <div className="text-base text-gray-600 mt-1 font-medium">{tournamentLaunched ? 'Total Squares' : 'Still Available'}</div>
                    </div>
                    <div>
                      <div className="text-4xl font-black text-[#30d158]">${stats.raised.toLocaleString()}</div>
                      <div className="text-base text-gray-600 mt-1 font-medium">Raised</div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>

            {/* Right: Mini Grid Preview */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              {/* Subtle glow */}
              <div className="absolute -inset-10 bg-[#d4af37]/10 blur-3xl rounded-full" />

              {/* The Grid */}
              <div className="relative bg-white rounded-2xl p-6 border border-gray-200 shadow-xl">
                {/* Grid header - State aware */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-base font-bold text-[#232842]">
                    {isLive ? 'LIVE GAME' : tournamentLaunched ? 'NUMBERS ASSIGNED' : 'LIVE GRID'}
                  </span>
                  <span className={`text-base font-bold ${isLive ? 'text-red-600' : 'text-[#d4af37]'}`}>
                    {isLive ? `Q${gameState?.quarter || 1}` : tournamentLaunched ? 'READY' : `$${stats.price}/square`}
                  </span>
                </div>

                {/* Mini grid */}
                <div className="grid grid-cols-10 gap-1">
                  {gridPreview.map((sold, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.005 }}
                      className={`aspect-square rounded-sm transition-all ${
                        sold
                          ? 'bg-[#d4af37]'
                          : 'bg-[#30d158]/20 hover:bg-[#30d158]/40 cursor-pointer border border-[#30d158]/30'
                      }`}
                    />
                  ))}
                </div>

                {/* Grid footer */}
                <div className="mt-4 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 bg-[#30d158]/30 rounded-sm border border-[#30d158]/50" />
                      <span className="text-gray-600 font-medium">Available</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 bg-[#d4af37] rounded-sm" />
                      <span className="text-gray-600 font-medium">Taken</span>
                    </div>
                  </div>
                  <Link href="/grid" className="text-[#d4af37] font-bold hover:underline">
                    View Full Grid →
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 border-2 border-gray-300 rounded-full flex justify-center pt-2">
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-1.5 bg-gray-400 rounded-full"
            />
          </div>
        </motion.div>
      </section>

      {/* ===== COUNTDOWN ===== */}
      <section className="py-24 relative overflow-hidden bg-gray-50">
        {/* Decorative circles */}
        <div className="absolute -left-20 top-1/2 -translate-y-1/2 w-80 h-80 rounded-full border border-[#d4af37]/20" />
        <div className="absolute -right-20 top-1/2 -translate-y-1/2 w-80 h-80 rounded-full border border-[#d4af37]/20" />

        <div className="relative max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            {/* Badge-style header */}
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full border-2 border-[#d4af37] bg-[#d4af37]/10 mb-8">
              <span className="w-3 h-3 rounded-full bg-[#d4af37] animate-pulse" />
              <span className="text-base font-bold tracking-[0.1em] text-[#232842] uppercase">
                Countdown to Kickoff
              </span>
            </div>

            <div className="flex items-center justify-center gap-4 sm:gap-8">
              {[
                { value: countdown.days, label: 'Days' },
                { value: countdown.hours, label: 'Hours' },
                { value: countdown.mins, label: 'Mins' },
                { value: countdown.secs, label: 'Secs' },
              ].map((item, idx) => (
                <div key={idx} className="text-center">
                  {/* Badge-style countdown box */}
                  <div className="w-20 sm:w-28 h-24 sm:h-32 bg-white border-2 border-gray-200 rounded-2xl flex items-center justify-center mb-2 relative shadow-lg">
                    <div className="absolute inset-1 rounded-xl border border-[#d4af37]/20" />
                    <span className="text-4xl sm:text-6xl font-black tabular-nums text-[#232842]">
                      {String(item.value).padStart(2, '0')}
                    </span>
                  </div>
                  <span className="text-sm sm:text-base text-gray-600 uppercase tracking-wider font-semibold">{item.label}</span>
                </div>
              ))}
            </div>

            <p className="mt-10 text-gray-600 text-base font-medium">
              Numbers will be randomly assigned once the grid is full
            </p>
          </motion.div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-24 bg-white relative overflow-hidden">
        {/* Decorative circle */}
        <div className="absolute -right-40 top-20 w-96 h-96 rounded-full border border-[#d4af37]/20" />

        <div className="relative max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-black mb-4 text-[#232842]">How It Works</h2>
            <p className="text-gray-600 max-w-lg mx-auto text-lg">
              Simple rules, big excitement. Here's how the pool works.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: '1',
                title: 'Pick Your Squares',
                description: `Choose any available squares on the 10×10 grid. Each square costs $${stats.price} and your money goes directly to the scholarship fund.`,
              },
              {
                step: '2',
                title: 'Numbers Get Assigned',
                description: 'Once the grid is full, numbers 0-9 are randomly assigned to each row and column. Your winning numbers are determined by where your squares land.',
              },
              {
                step: '3',
                title: 'Win Each Quarter',
                description: 'At the end of each quarter, the last digit of each team\'s score determines the winning square. Match both numbers and you win that quarter\'s prize!',
              },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="relative p-8 bg-white border border-gray-200 rounded-2xl shadow-lg"
              >
                {/* Circular badge step number */}
                <div className="absolute -top-5 left-8 w-10 h-10 rounded-full bg-[#d4af37] flex items-center justify-center border-4 border-white shadow-md">
                  <span className="text-lg font-black text-white">{item.step}</span>
                </div>
                <h3 className="text-xl font-bold mb-3 mt-2 text-[#232842]">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed text-base">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PRIZE BREAKDOWN ===== */}
      <PrizeBreakdown />

      {/* ===== THE CAUSE ===== */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Story */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              {/* Large logo */}
              <div className="mb-8">
                <Image src="/logo.png" alt="Michael Williams Memorial Scholarship" width={130} height={130} />
              </div>

              <h2 className="text-3xl sm:text-4xl font-black mb-6 leading-tight text-[#232842]">
                Honoring Michael Williams Through Education
              </h2>

              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                Every square you purchase directly supports the Michael Williams Memorial Scholarship Fund.
                We're not just playing a game—we're investing in students who will carry forward Michael's legacy of
                kindness, determination, and community spirit.
              </p>

              <p className="text-gray-600 mb-8 text-base">
                100% of proceeds from this pool go directly to scholarship awards for deserving students.
              </p>

              <Link
                href="https://michaelwilliamsscholarship.com"
                target="_blank"
                className="inline-flex items-center gap-2 text-[#d4af37] font-bold text-lg hover:underline"
              >
                Learn more about the scholarship
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </motion.div>

            {/* Right: Impact */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-4"
            >
              <div className="col-span-2 p-8 bg-gradient-to-br from-[#d4af37]/20 to-[#d4af37]/10 border-2 border-[#d4af37]/30 rounded-2xl">
                <div className="text-5xl font-black text-[#d4af37] mb-2">${stats.raised.toLocaleString()}</div>
                <div className="text-gray-600 text-lg font-medium">Raised This Year</div>
              </div>
              <div className="p-6 bg-white border-2 border-gray-200 rounded-2xl shadow-md">
                <div className="text-4xl font-black mb-2 text-[#232842]">{stats.sold}</div>
                <div className="text-base text-gray-600 font-medium">Squares Sold</div>
              </div>
              <div className="p-6 bg-white border-2 border-gray-200 rounded-2xl shadow-md">
                <div className="text-4xl font-black mb-2 text-[#232842]">{stats.available}</div>
                <div className="text-base text-gray-600 font-medium">Still Available</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA - State aware ===== */}
      <section className={`py-24 relative overflow-hidden ${isLive ? 'bg-red-700' : 'bg-[#232842]'}`}>
        {/* Decorative circles */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-[#d4af37]/20" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-[#d4af37]/10" />

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl sm:text-5xl font-black mb-6 text-white">
              {isLive ? (
                <>The Game is <span className="text-white animate-pulse">LIVE</span>!</>
              ) : tournamentLaunched ? (
                <>Check Your <span className="text-[#d4af37]">Numbers</span></>
              ) : (
                <>Ready to <span className="text-[#d4af37]">Play</span>?</>
              )}
            </h2>
            <p className="text-xl text-gray-300 mb-10 max-w-lg mx-auto">
              {isLive
                ? 'Watch the winners update in real-time as the game unfolds!'
                : tournamentLaunched
                ? 'Numbers have been assigned. See your winning combinations and get ready for kickoff!'
                : "Don't wait until the squares are gone. Pick your numbers and join the excitement."}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {isLive ? (
                <>
                  <Link
                    href="/pool"
                    className="group w-full sm:w-auto inline-flex items-center justify-center gap-3 px-10 py-5 bg-white text-red-700 font-bold text-lg rounded-xl hover:bg-gray-100 transition-all shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                    Watch Live Now
                  </Link>
                  <Link
                    href="/grid"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-5 bg-white/10 border-2 border-white/20 text-white font-bold rounded-xl hover:bg-white/20 transition-colors"
                  >
                    View Grid
                  </Link>
                </>
              ) : tournamentLaunched ? (
                <>
                  <Link
                    href="/grid"
                    className="group w-full sm:w-auto inline-flex items-center justify-center gap-3 px-10 py-5 bg-[#d4af37] text-white font-bold text-lg rounded-xl hover:bg-[#c49b2f] transition-all shadow-lg"
                  >
                    View Your Numbers
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                  <Link
                    href="/props"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-5 bg-white/10 border-2 border-white/20 text-white font-bold rounded-xl hover:bg-white/20 transition-colors"
                  >
                    Make Your Picks
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/grid"
                    className="group w-full sm:w-auto inline-flex items-center justify-center gap-3 px-10 py-5 bg-[#d4af37] text-white font-bold text-lg rounded-xl hover:bg-[#c49b2f] transition-all shadow-lg"
                  >
                    Pick Your Squares
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                  <Link
                    href="/props"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-5 bg-white/10 border-2 border-white/20 text-white font-bold rounded-xl hover:bg-white/20 transition-colors"
                  >
                    Try Prop Bets
                  </Link>
                </>
              )}
            </div>

            {!tournamentLaunched && stats.available <= 20 && stats.available > 0 && (
              <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 bg-[#ff9f0a]/20 border border-[#ff9f0a]/40 rounded-full">
                <span className="w-2 h-2 bg-[#ff9f0a] rounded-full animate-pulse" />
                <span className="text-[#ff9f0a] text-base font-bold">
                  Only {stats.available} squares left!
                </span>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="py-12 bg-white border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <Image src="/logo.png" alt="Michael Williams Memorial Scholarship" width={70} height={70} />
              <div className="text-center sm:text-left">
                <div className="font-bold text-xl mb-1 text-[#232842]">
                  Michael Williams Memorial Scholarship
                </div>
                <div className="text-base text-gray-600">
                  100% of proceeds support educational scholarships
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 text-base font-semibold">
              <Link href="https://michaelwilliamsscholarship.com" target="_blank" className="text-gray-600 hover:text-[#232842] transition-colors">
                Main Website
              </Link>
              <Link href="/admin" className="text-gray-600 hover:text-[#232842] transition-colors">
                Admin
              </Link>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Michael Williams Memorial Scholarship Fund
          </div>
        </div>
      </footer>
    </div>
  );
}
