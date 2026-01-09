'use client';

import { motion } from 'framer-motion';
import { Trophy, DollarSign } from 'lucide-react';

interface PrizeBreakdownProps {
  className?: string;
}

// Hardcoded prize amounts for Super Bowl grid
const PRIZES = {
  q1: 350,
  q2: 600,
  q3: 350,
  q4: 1200,
  total: 2500,
};

export default function PrizeBreakdown({ className = '' }: PrizeBreakdownProps) {
  const quarterPrizes = [
    { label: 'Q1', description: 'End of 1st Quarter', amount: PRIZES.q1 },
    { label: 'Q2', description: 'Halftime', amount: PRIZES.q2 },
    { label: 'Q3', description: 'End of 3rd Quarter', amount: PRIZES.q3 },
    { label: 'Q4', description: 'Final Score', amount: PRIZES.q4 },
  ];

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
              ${PRIZES.total.toLocaleString()}
            </span>
          </div>
          <p className="text-gray-300 text-lg font-medium">Total Prize Pool</p>
        </motion.div>
      </div>
    </section>
  );
}
