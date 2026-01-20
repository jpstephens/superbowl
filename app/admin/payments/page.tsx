'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import type { Payment, Profile } from '@/lib/supabase/types';
import { DollarSign, CreditCard } from 'lucide-react';

interface ExtendedPayment extends Payment {
  profile: Profile;
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<ExtendedPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('payments')
        .select(`*, profile:profiles(*)`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setPayments(data as ExtendedPayment[]);
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const completed = payments.filter(p => p.status === 'completed');
    const totalRevenue = completed.reduce((sum, p) => sum + Number(p.amount || 0), 0);

    return {
      totalRevenue,
      paymentCount: completed.length,
    };
  }, [payments]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-3 border-[#cda33b] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 lg:p-8 max-w-6xl">
      {/* Page Title */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-white">Payments</h1>
        <p className="text-xs sm:text-base text-white/60">View payment records</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <Card className="p-3 sm:p-5 bg-white/5 border-white/10">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="p-2 sm:p-3 rounded-xl bg-green-500/20 flex-shrink-0">
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-2xl font-bold text-white truncate">${stats.totalRevenue.toLocaleString()}</p>
              <p className="text-xs sm:text-sm text-white/60">Revenue</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-5 bg-white/5 border-white/10">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="p-2 sm:p-3 rounded-xl bg-[#cda33b]/20 flex-shrink-0">
              <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-[#cda33b]" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-2xl font-bold text-white">{stats.paymentCount}</p>
              <p className="text-xs sm:text-sm text-white/60">Payments</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Payments Table */}
      <Card className="bg-white/5 border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">User</th>
                <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">Amount</th>
                <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-2 sm:px-4 py-2 sm:py-4 min-w-0">
                    <div>
                      <p className="font-medium text-white text-xs sm:text-base truncate">{payment.profile?.name || 'Unknown'}</p>
                      <p className="text-xs sm:text-sm text-white/50 truncate">{payment.profile?.email || '-'}</p>
                    </div>
                  </td>
                  <td className="px-2 sm:px-4 py-2 sm:py-4 whitespace-nowrap">
                    <span className="text-white font-semibold text-xs sm:text-base">${Number(payment.amount).toFixed(2)}</span>
                  </td>
                  <td className="px-2 sm:px-4 py-2 sm:py-4 text-xs sm:text-sm text-white/60 whitespace-nowrap">
                    {new Date(payment.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {payments.length === 0 && (
            <div className="text-center py-8 sm:py-12 text-white/50 text-xs sm:text-base">
              No payments yet
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
