'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import { Trophy, DollarSign } from 'lucide-react';

interface PrizeBreakdownProps {
  className?: string;
}

export default function PrizeBreakdown({ className = '' }: PrizeBreakdownProps) {
  const [prizes, setPrizes] = useState({
    squarePrice: 50,
    q1Percent: 20,
    q2Percent: 20,
    q3Percent: 20,
    q4Percent: 40,
    charityPercent: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPrizes();
  }, []);

  const loadPrizes = async () => {
    try {
      const supabase = createClient();

      const { data: settings } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', [
          'square_price',
          'payout_percent_q1',
          'payout_percent_q2',
          'payout_percent_q3',
          'payout_percent_q4',
          'charity_percentage',
        ]);

      if (settings) {
        const settingsMap: Record<string, string> = {};
        settings.forEach(s => {
          settingsMap[s.key] = s.value;
        });

        setPrizes({
          squarePrice: parseFloat(settingsMap['square_price'] || '50'),
          q1Percent: parseFloat(settingsMap['payout_percent_q1'] || '20'),
          q2Percent: parseFloat(settingsMap['payout_percent_q2'] || '20'),
          q3Percent: parseFloat(settingsMap['payout_percent_q3'] || '20'),
          q4Percent: parseFloat(settingsMap['payout_percent_q4'] || '40'),
          charityPercent: parseFloat(settingsMap['charity_percentage'] || '0'),
        });
      }
    } catch (error) {
      console.error('Error loading prizes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate prize amounts
  const totalRevenue = prizes.squarePrice * 100;
  const charityAmount = totalRevenue * (prizes.charityPercent / 100);
  const prizePool = totalRevenue - charityAmount;

  const q1Prize = prizePool * (prizes.q1Percent / 100);
  const q2Prize = prizePool * (prizes.q2Percent / 100);
  const q3Prize = prizePool * (prizes.q3Percent / 100);
  const q4Prize = prizePool * (prizes.q4Percent / 100);

  const quarterPrizes = [
    { label: 'Q1', description: 'End of 1st Quarter', amount: q1Prize, percent: prizes.q1Percent },
    { label: 'Q2', description: 'Halftime', amount: q2Prize, percent: prizes.q2Percent },
    { label: 'Q3', description: 'End of 3rd Quarter', amount: q3Prize, percent: prizes.q3Percent },
    { label: 'Q4', description: 'Final Score', amount: q4Prize, percent: prizes.q4Percent },
  ];

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="w-8 h-8 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <section id="prizes" className={`py-24 bg-white relative overflow-hidden ${className}`}>
      {/* Decorative elements */}
      <div className="absolute -left-20 top-1/2 -translate-y-1/2 w-64 h-64 rounded-full border border-[#d4af37]/20" />
      <div className="absolute -right-20 top-1/3 w-48 h-48 rounded-full border border-[#d4af37]/10" />

      <div className="relative max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#d4af37]/10 border border-[#d4af37]/30 rounded-full mb-6">
            <Trophy className="w-5 h-5 text-[#d4af37]" />
            <span className="text-base font-bold text-[#232842]">Prize Breakdown</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black mb-4 text-[#232842]">
            Win Big Every Quarter
          </h2>
          <p className="text-gray-600 max-w-lg mx-auto text-lg">
            Four chances to win based on the last digit of each team's score at the end of each quarter.
          </p>
        </motion.div>

        {/* Prize Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {quarterPrizes.map((prize, idx) => (
            <motion.div
              key={prize.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className={`relative p-6 rounded-2xl border-2 transition-all hover:scale-105 ${
                prize.label === 'Q4'
                  ? 'bg-gradient-to-br from-[#d4af37]/20 to-[#d4af37]/5 border-[#d4af37]'
                  : 'bg-white border-gray-200 shadow-md'
              }`}
            >
              {/* Quarter Badge */}
              <div
                className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${
                  prize.label === 'Q4'
                    ? 'bg-[#d4af37] text-white'
                    : 'bg-[#232842] text-white'
                }`}
              >
                <span className="text-lg font-black">{prize.label}</span>
              </div>

              {/* Prize Amount */}
              <div className="mb-2">
                <span className={`text-3xl sm:text-4xl font-black ${
                  prize.label === 'Q4' ? 'text-[#d4af37]' : 'text-[#232842]'
                }`}>
                  ${prize.amount.toLocaleString()}
                </span>
              </div>

              {/* Description */}
              <p className="text-gray-600 text-sm font-medium">{prize.description}</p>

              {/* Percentage Badge */}
              <div className="absolute top-4 right-4">
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                  prize.label === 'Q4'
                    ? 'bg-[#d4af37]/30 text-[#232842]'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {prize.percent}%
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Total Prize Pool */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-[#232842] rounded-2xl p-8 text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <DollarSign className="w-8 h-8 text-[#d4af37]" />
            <span className="text-5xl sm:text-6xl font-black text-white">
              ${prizePool.toLocaleString()}
            </span>
          </div>
          <p className="text-gray-300 text-lg font-medium">Total Prize Pool</p>
          <p className="text-gray-500 text-sm mt-2">
            Based on ${prizes.squarePrice} per square × 100 squares
            {prizes.charityPercent > 0 && ` (${prizes.charityPercent}% to scholarship fund)`}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
