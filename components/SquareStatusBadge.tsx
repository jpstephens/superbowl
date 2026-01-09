'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SquareStatusBadgeProps {
  status: 'available' | 'claimed' | 'paid' | 'confirmed' | 'selected';
  className?: string;
}

export default function SquareStatusBadge({ status, className }: SquareStatusBadgeProps) {
  const statusConfig = {
    available: {
      label: 'Available',
      variant: 'outline' as const,
      className: 'border-green-500 text-green-700 bg-green-50',
    },
    claimed: {
      label: 'Claimed',
      variant: 'outline' as const,
      className: 'border-gray-400 text-gray-600 bg-gray-100',
    },
    paid: {
      label: 'Paid',
      variant: 'default' as const,
      className: 'border-blue-500 text-blue-700 bg-blue-50',
    },
    confirmed: {
      label: 'Confirmed',
      variant: 'default' as const,
      className: 'border-green-600 text-green-800 bg-green-100',
    },
    selected: {
      label: 'Selected',
      variant: 'default' as const,
      className: 'border-blue-600 text-blue-800 bg-blue-100',
    },
  };

  const config = statusConfig[status];

  return (
    <Badge
      variant={config.variant}
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  );
}



