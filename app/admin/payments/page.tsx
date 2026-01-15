'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Payment, Profile } from '@/lib/supabase/types';
import { DollarSign, CreditCard, Users } from 'lucide-react';

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
    const stripePayments = completed.filter(p => p.method === 'stripe').length;
    const venmoPayments = completed.filter(p => p.method === 'venmo').length;

    return {
      totalRevenue,
      paymentCount: completed.length,
      stripePayments,
      venmoPayments,
    };
  }, [payments]);


  const getStatusBadge = (status: string) => {
    if (status === 'completed') {
      return <Badge className="bg-[#cda33b]/20 text-[#cda33b] border-[#cda33b]/30">Paid</Badge>;
    }
    if (status === 'pending') {
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pending</Badge>;
    }
    return <Badge className="bg-white/10 text-white/60 border-white/20">{status}</Badge>;
  };

  const getMethodBadge = (method: string) => {
    if (method === 'stripe') {
      return <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30">Stripe</Badge>;
    }
    return <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30">Venmo</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-3 border-[#cda33b] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Payments</h1>
        <p className="text-white/60">View and manage payment records</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-5 bg-white/5 border-white/10">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-500/20">
              <DollarSign className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">${stats.totalRevenue.toLocaleString()}</p>
              <p className="text-sm text-white/60">Total Revenue</p>
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-white/5 border-white/10">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/20">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.paymentCount}</p>
              <p className="text-sm text-white/60">Payments</p>
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-white/5 border-white/10">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-500/20">
              <CreditCard className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.stripePayments}</p>
              <p className="text-sm text-white/60">Stripe</p>
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-white/5 border-white/10">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-cyan-500/20">
              <CreditCard className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.venmoPayments}</p>
              <p className="text-sm text-white/60">Venmo</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Payments Table */}
      <Card className="bg-white/5 border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">Method</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-medium text-white">{payment.profile?.name || 'Unknown'}</p>
                      <p className="text-sm text-white/50">{payment.profile?.email || '-'}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-white font-semibold">${Number(payment.amount).toFixed(2)}</span>
                  </td>
                  <td className="px-4 py-4">{getMethodBadge(payment.method)}</td>
                  <td className="px-4 py-4">{getStatusBadge(payment.status)}</td>
                  <td className="px-4 py-4 text-sm text-white/60">
                    {new Date(payment.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {payments.length === 0 && (
            <div className="text-center py-12 text-white/50">
              No payments yet
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
