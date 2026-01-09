'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Payment, Profile } from '@/lib/supabase/types';
import { Check, X, DollarSign } from 'lucide-react';

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<(Payment & { profile: Profile })[]>([]);
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
      if (data) setPayments(data);
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setLoading(false);
    }
  };

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
      <Badge variant="outline" className="bg-blue-50">Stripe</Badge>
    ) : (
      <Badge variant="outline" className="bg-teal-50">Venmo</Badge>
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
        <h1 className="text-3xl font-bold mb-8">Payment Management</h1>

        <Card className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 text-sm font-semibold">User</th>
                  <th className="text-left p-3 text-sm font-semibold">Amount</th>
                  <th className="text-left p-3 text-sm font-semibold">Method</th>
                  <th className="text-left p-3 text-sm font-semibold">Status</th>
                  <th className="text-left p-3 text-sm font-semibold">Date</th>
                  <th className="text-left p-3 text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b">
                    <td className="p-3">
                      <div>
                        <p className="font-medium">{payment.profile.name}</p>
                        <p className="text-sm text-muted-foreground">{payment.profile.email}</p>
                      </div>
                    </td>
                    <td className="p-3">${Number(payment.amount)}</td>
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
                ))}
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

