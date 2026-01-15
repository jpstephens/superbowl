'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Payment, Profile } from '@/lib/supabase/types';
import { Check, DollarSign, Heart, TrendingUp, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// Extended payment type with fee fields
interface ExtendedPayment extends Payment {
  base_amount?: number | null;
  fee_donation?: number | null;
  covers_fee?: boolean;
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
        .select(`
          *,
          profile:profiles(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setPayments(data as ExtendedPayment[]);
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate summary stats
  const stats = useMemo(() => {
    const completed = payments.filter(p => p.status === 'completed' || p.status === 'confirmed');
    const totalRevenue = completed.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const totalDonations = completed.reduce((sum, p) => sum + Number(p.fee_donation || 0), 0);
    const baseRevenue = completed.reduce((sum, p) => sum + Number(p.base_amount || p.amount || 0), 0);
    const donorCount = completed.filter(p => Number(p.fee_donation || 0) > 0).length;

    return {
      totalRevenue,
      totalDonations,
      baseRevenue,
      donorCount,
      paymentCount: completed.length,
    };
  }, [payments]);

  const handleConfirmPayment = async (paymentId: string, userId: string) => {
    try {
      const supabase = createClient();

      // Update payment status
      const { error: paymentError } = await supabase
        .from('payments')
        .update({ status: 'confirmed' })
        .eq('id', paymentId);

      if (paymentError) throw paymentError;

      // Also update the user's grid squares from 'paid' to 'confirmed'
      const { error: squaresError } = await supabase
        .from('grid_squares')
        .update({
          status: 'confirmed',
          paid_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('status', 'paid');

      if (squaresError) {
        console.error('Error updating squares:', squaresError);
        // Don't throw - payment is still confirmed
      }

      loadPayments();
    } catch (error) {
      console.error('Error confirming payment:', error);
      alert('Error confirming payment. Please try again.');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: 'outline' as const, label: 'Pending' },
      completed: { variant: 'default' as const, label: 'Completed' },
      confirmed: { variant: 'default' as const, label: 'Confirmed', className: 'bg-green-600' },
    };

    const { variant, label, className } = variants[status] || { variant: 'outline', label: status };

    return <Badge variant={variant} className={className}>{label}</Badge>;
  };

  const getMethodBadge = (method: string) => {
    return method === 'stripe' ? (
      <Badge variant="outline" className="bg-blue-50 text-blue-700">Stripe</Badge>
    ) : (
      <Badge variant="outline" className="bg-teal-50 text-teal-700">Venmo</Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/admin/dashboard"
            className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-3xl font-bold">Payment Management</h1>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">${stats.baseRevenue.toFixed(0)}</p>
                <p className="text-sm text-muted-foreground">Base Revenue</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Heart className="w-8 h-8 text-pink-500" />
              <div>
                <p className="text-2xl font-bold text-pink-600">${stats.totalDonations.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Fee Donations</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">${stats.totalRevenue.toFixed(0)}</p>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Heart className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{stats.donorCount}</p>
                <p className="text-sm text-muted-foreground">Donors Covered Fees</p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 text-sm font-semibold">User</th>
                  <th className="text-left p-3 text-sm font-semibold">Base Amount</th>
                  <th className="text-left p-3 text-sm font-semibold">Fee Donation</th>
                  <th className="text-left p-3 text-sm font-semibold">Total</th>
                  <th className="text-left p-3 text-sm font-semibold">Method</th>
                  <th className="text-left p-3 text-sm font-semibold">Status</th>
                  <th className="text-left p-3 text-sm font-semibold">Date</th>
                  <th className="text-left p-3 text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => {
                  const baseAmount = Number(payment.base_amount || payment.amount || 0);
                  const feeDonation = Number(payment.fee_donation || 0);
                  const total = Number(payment.amount || 0);

                  return (
                    <tr key={payment.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div>
                          <p className="font-medium">{payment.profile?.name || 'Unknown'}</p>
                          <p className="text-sm text-muted-foreground">{payment.profile?.email || '-'}</p>
                        </div>
                      </td>
                      <td className="p-3">${baseAmount.toFixed(2)}</td>
                      <td className="p-3">
                        {feeDonation > 0 ? (
                          <span className="text-green-600 font-medium">+${feeDonation.toFixed(2)}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-3 font-semibold">${total.toFixed(2)}</td>
                      <td className="p-3">{getMethodBadge(payment.method)}</td>
                      <td className="p-3">{getStatusBadge(payment.status)}</td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {new Date(payment.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        {payment.status === 'completed' && (
                          <Button
                            size="sm"
                            onClick={() => handleConfirmPayment(payment.id, payment.user_id)}
                          >
                            <Check className="mr-1 h-4 w-4" />
                            Confirm
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {payments.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No payments yet
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
