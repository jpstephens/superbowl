'use client';

import { Card } from '@/components/ui/card';
import { Trophy, DollarSign, Calendar } from 'lucide-react';

interface UserStatsProps {
  totalSquares: number;
  totalAmount: number;
  daysUntilGame: number;
}

export default function UserStats({
  totalSquares,
  totalAmount,
  daysUntilGame,
}: UserStatsProps) {
  const stats = [
    {
      label: 'Total Squares',
      value: totalSquares,
      icon: Trophy,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Total Invested',
      value: `$${totalAmount}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      label: 'Days Until Game',
      value: daysUntilGame,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="p-4 border-2 hover:border-primary/40 transition-all">
            <div className="flex items-center gap-3">
              <div className={`${stat.bgColor} p-2 rounded-lg`}>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

