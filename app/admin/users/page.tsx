'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Users, Search, Mail, Phone, Grid3x3, DollarSign,
  ArrowLeft, Download, ChevronUp, ChevronDown
} from 'lucide-react';
import Link from 'next/link';

interface UserWithStats {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
  squares_count: number;
  total_spent: number;
}

type SortField = 'name' | 'email' | 'squares_count' | 'total_spent' | 'created_at';
type SortDirection = 'asc' | 'desc';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const supabase = createClient();

      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Get squares count per user
      const { data: squares, error: squaresError } = await supabase
        .from('grid_squares')
        .select('user_id')
        .in('status', ['paid', 'confirmed']);

      if (squaresError) throw squaresError;

      // Get payments per user
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('user_id, amount, status')
        .eq('status', 'completed');

      if (paymentsError) throw paymentsError;

      // Count squares per user
      const squaresCounts = new Map<string, number>();
      squares?.forEach((sq) => {
        if (sq.user_id) {
          squaresCounts.set(sq.user_id, (squaresCounts.get(sq.user_id) || 0) + 1);
        }
      });

      // Sum payments per user
      const paymentTotals = new Map<string, number>();
      payments?.forEach((p) => {
        if (p.user_id) {
          paymentTotals.set(p.user_id, (paymentTotals.get(p.user_id) || 0) + Number(p.amount));
        }
      });

      // Combine data
      const usersWithStats: UserWithStats[] = (profiles || []).map((profile) => ({
        id: profile.id,
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        created_at: profile.created_at,
        squares_count: squaresCounts.get(profile.id) || 0,
        total_spent: paymentTotals.get(profile.id) || 0,
      }));

      setUsers(usersWithStats);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedUsers = [...users].sort((a, b) => {
    let aVal: string | number = a[sortField] || '';
    let bVal: string | number = b[sortField] || '';

    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const filteredUsers = sortedUsers.filter((user) => {
    const search = searchTerm.toLowerCase();
    return (
      user.name?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search) ||
      user.phone?.includes(search)
    );
  });

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Squares', 'Total Spent', 'Joined'];
    const rows = filteredUsers.map((user) => [
      user.name || '',
      user.email || '',
      user.phone || '',
      user.squares_count.toString(),
      `$${user.total_spent.toFixed(2)}`,
      new Date(user.created_at).toLocaleDateString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'superbowl-pool-users.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4 inline ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 inline ml-1" />
    );
  };

  const totalSquares = users.reduce((sum, u) => sum + u.squares_count, 0);
  const totalRevenue = users.reduce((sum, u) => sum + u.total_spent, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-900/80 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/dashboard">
                <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-gray-800">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <div className="h-6 w-px bg-gray-700" />
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                <h1 className="text-lg font-bold text-white">User Management</h1>
              </div>
            </div>

            <Button
              onClick={exportToCSV}
              variant="outline"
              size="sm"
              className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </header>

      <main className="py-8">
        <div className="container mx-auto px-4 sm:px-6">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card className="p-4 bg-gray-800 border-gray-700">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{users.length}</p>
                  <p className="text-sm text-gray-400">Total Users</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-gray-800 border-gray-700">
              <div className="flex items-center gap-3">
                <Grid3x3 className="w-8 h-8 text-amber-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{totalSquares}</p>
                  <p className="text-sm text-gray-400">Squares Sold</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-gray-800 border-gray-700">
              <div className="flex items-center gap-3">
                <DollarSign className="w-8 h-8 text-green-400" />
                <div>
                  <p className="text-2xl font-bold text-white">${totalRevenue.toFixed(0)}</p>
                  <p className="text-sm text-gray-400">Total Revenue</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Search */}
          <Card className="p-4 mb-6 bg-gray-800 border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
              />
            </div>
          </Card>

          {/* Users Table */}
          <Card className="bg-gray-800 border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700 bg-gray-900/50">
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase cursor-pointer hover:text-white"
                      onClick={() => handleSort('name')}
                    >
                      Name <SortIcon field="name" />
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase cursor-pointer hover:text-white"
                      onClick={() => handleSort('email')}
                    >
                      Email <SortIcon field="email" />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">
                      Phone
                    </th>
                    <th
                      className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase cursor-pointer hover:text-white"
                      onClick={() => handleSort('squares_count')}
                    >
                      Squares <SortIcon field="squares_count" />
                    </th>
                    <th
                      className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase cursor-pointer hover:text-white"
                      onClick={() => handleSort('total_spent')}
                    >
                      Spent <SortIcon field="total_spent" />
                    </th>
                    <th
                      className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase cursor-pointer hover:text-white"
                      onClick={() => handleSort('created_at')}
                    >
                      Joined <SortIcon field="created_at" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                        {searchTerm ? 'No users found matching your search' : 'No users yet'}
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                        <td className="px-4 py-3">
                          <span className="font-medium text-white">{user.name || '—'}</span>
                        </td>
                        <td className="px-4 py-3">
                          {user.email ? (
                            <a
                              href={`mailto:${user.email}`}
                              className="flex items-center gap-2 text-blue-400 hover:text-blue-300"
                            >
                              <Mail className="w-4 h-4" />
                              {user.email}
                            </a>
                          ) : (
                            <span className="text-gray-500">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {user.phone ? (
                            <a
                              href={`tel:${user.phone}`}
                              className="flex items-center gap-2 text-green-400 hover:text-green-300"
                            >
                              <Phone className="w-4 h-4" />
                              {user.phone}
                            </a>
                          ) : (
                            <span className="text-gray-500">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500/20 text-amber-400 rounded text-sm font-medium">
                            <Grid3x3 className="w-3 h-3" />
                            {user.squares_count}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-green-400 font-medium">
                            ${user.total_spent.toFixed(0)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-400 text-sm">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Footer */}
          <div className="mt-4 text-center text-sm text-gray-500">
            Showing {filteredUsers.length} of {users.length} users
          </div>
        </div>
      </main>
    </div>
  );
}
