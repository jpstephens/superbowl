'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Grid3x3, LogOut, Settings, Search, Download, Edit2, X, Check,
  ArrowLeft, Filter
} from 'lucide-react';
import Link from 'next/link';
import Logo from '@/components/Logo';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface GridSquareWithProfile {
  id: string;
  row_number: number;
  col_number: number;
  row_score: number | null;
  col_score: number | null;
  status: string;
  user_id: string | null;
  profiles: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  } | null;
}

interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

export default function AdminSquaresPage() {
  const router = useRouter();
  const [squares, setSquares] = useState<GridSquareWithProfile[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingSquare, setEditingSquare] = useState<GridSquareWithProfile | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/admin/login');
        return;
      }

      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('id, role')
        .eq('email', user.email)
        .single();

      if (!adminUser) {
        await supabase.auth.signOut();
        router.push('/admin/login');
        return;
      }

      setIsAdmin(true);
      setAuthChecked(true);
      loadData();
    } catch (error) {
      console.error('Auth check error:', error);
      router.push('/admin/login');
    }
  };

  const loadData = async () => {
    try {
      const supabase = createClient();

      // Load squares with profiles
      const { data: squaresData, error: squaresError } = await supabase
        .from('grid_squares')
        .select(`
          *,
          profiles:user_id (id, name, email, phone)
        `)
        .order('row_number', { ascending: true })
        .order('col_number', { ascending: true });

      if (squaresError) throw squaresError;
      setSquares(squaresData || []);

      // Load all profiles for dropdown
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, email, phone')
        .order('name', { ascending: true });

      if (profilesError) throw profilesError;
      setProfiles(profilesData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (square: GridSquareWithProfile) => {
    setEditingSquare(square);
    setSelectedUserId(square.user_id || 'available');
  };

  const handleSave = async () => {
    if (!editingSquare) return;
    setSaving(true);

    try {
      const response = await fetch('/api/admin/update-square', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          squareId: editingSquare.id,
          userId: selectedUserId === 'available' ? null : selectedUserId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Failed to update square');
        return;
      }

      // Reload data
      await loadData();
      setEditingSquare(null);
    } catch (error) {
      console.error('Error updating square:', error);
      alert('An error occurred while updating the square');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  const exportToCSV = () => {
    const headers = ['Square #', 'Row', 'Col', 'Row Score', 'Col Score', 'Owner Name', 'Email', 'Phone', 'Status'];
    const rows = filteredSquares.map(sq => [
      getSquareNumber(sq.row_number, sq.col_number),
      sq.row_number,
      sq.col_number,
      sq.row_score ?? '-',
      sq.col_score ?? '-',
      sq.profiles?.name || '-',
      sq.profiles?.email || '-',
      sq.profiles?.phone || '-',
      sq.status,
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `squares-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getSquareNumber = (row: number, col: number) => row * 10 + col + 1;

  const filteredSquares = squares.filter(sq => {
    // Status filter
    if (statusFilter !== 'all' && sq.status !== statusFilter) return false;

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const squareNum = getSquareNumber(sq.row_number, sq.col_number).toString();
      const ownerName = sq.profiles?.name?.toLowerCase() || '';
      const ownerEmail = sq.profiles?.email?.toLowerCase() || '';

      if (!squareNum.includes(search) && !ownerName.includes(search) && !ownerEmail.includes(search)) {
        return false;
      }
    }

    return true;
  });

  const stats = {
    total: squares.length,
    available: squares.filter(s => s.status === 'available').length,
    paid: squares.filter(s => s.status === 'paid').length,
    confirmed: squares.filter(s => s.status === 'confirmed').length,
  };

  if (loading || !authChecked) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-900/80 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <Logo size="small" />
              <div>
                <h1 className="text-sm font-bold text-white leading-tight">
                  Square Management
                </h1>
                <p className="text-xs text-gray-400">Admin Dashboard</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/admin/dashboard">
                <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-gray-800">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <Link href="/admin/settings">
                <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-gray-800">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </Link>
              <Button
                onClick={handleSignOut}
                variant="ghost"
                size="sm"
                className="text-gray-300 hover:text-white hover:bg-gray-800"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="py-8">
        <div className="container mx-auto px-4 sm:px-6">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <Card className="p-4 bg-gray-800 border-gray-700">
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <div className="text-sm text-gray-400">Total Squares</div>
            </Card>
            <Card className="p-4 bg-gray-800 border-gray-700">
              <div className="text-2xl font-bold text-green-400">{stats.available}</div>
              <div className="text-sm text-gray-400">Available</div>
            </Card>
            <Card className="p-4 bg-gray-800 border-gray-700">
              <div className="text-2xl font-bold text-yellow-400">{stats.paid}</div>
              <div className="text-sm text-gray-400">Paid</div>
            </Card>
            <Card className="p-4 bg-gray-800 border-gray-700">
              <div className="text-2xl font-bold text-blue-400">{stats.confirmed}</div>
              <div className="text-sm text-gray-400">Confirmed</div>
            </Card>
          </div>

          {/* Filters and Actions */}
          <Card className="p-4 bg-gray-800 border-gray-700 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-3 flex-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search by square #, name, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40 bg-gray-700 border-gray-600 text-white">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="all" className="text-white">All Status</SelectItem>
                    <SelectItem value="available" className="text-white">Available</SelectItem>
                    <SelectItem value="paid" className="text-white">Paid</SelectItem>
                    <SelectItem value="confirmed" className="text-white">Confirmed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={exportToCSV} className="bg-green-600 hover:bg-green-700">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </Card>

          {/* Squares Table */}
          <Card className="bg-gray-800 border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700 bg-gray-900/50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Square #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Position
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Scores
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Owner
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredSquares.map((square) => (
                    <tr key={square.id} className="hover:bg-gray-700/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-lg font-bold text-white">
                          {getSquareNumber(square.row_number, square.col_number)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-300">
                        Row {square.row_number}, Col {square.col_number}
                      </td>
                      <td className="px-4 py-3 text-gray-300">
                        {square.row_score !== null && square.col_score !== null ? (
                          <span className="font-mono text-amber-400">
                            {square.row_score}-{square.col_score}
                          </span>
                        ) : (
                          <span className="text-gray-500">Not assigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {square.profiles?.name ? (
                          <span className="text-white font-medium">{square.profiles.name}</span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {square.profiles?.email ? (
                          <a
                            href={`mailto:${square.profiles.email}`}
                            className="text-blue-400 hover:underline"
                          >
                            {square.profiles.email}
                          </a>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {square.profiles?.phone ? (
                          <a
                            href={`tel:${square.profiles.phone}`}
                            className="text-blue-400 hover:underline"
                          >
                            {square.profiles.phone}
                          </a>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            square.status === 'available'
                              ? 'bg-green-500/20 text-green-400'
                              : square.status === 'paid'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : square.status === 'confirmed'
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-gray-500/20 text-gray-400'
                          }`}
                        >
                          {square.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          onClick={() => handleEditClick(square)}
                          size="sm"
                          variant="ghost"
                          className="text-gray-400 hover:text-white hover:bg-gray-700"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredSquares.length === 0 && (
              <div className="p-8 text-center text-gray-400">
                No squares match your search criteria.
              </div>
            )}
          </Card>
        </div>
      </main>

      {/* Edit Dialog */}
      <Dialog open={!!editingSquare} onOpenChange={(open) => !open && setEditingSquare(null)}>
        <DialogContent className="bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">
              Edit Square #{editingSquare && getSquareNumber(editingSquare.row_number, editingSquare.col_number)}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Reassign this square to a different user or make it available.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Assign to User
            </label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="w-full bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600 max-h-60">
                <SelectItem value="available" className="text-green-400">
                  Make Available (No Owner)
                </SelectItem>
                {profiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id} className="text-white">
                    {profile.name} ({profile.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {editingSquare?.profiles && (
              <div className="mt-4 p-3 bg-gray-700/50 rounded-lg">
                <p className="text-sm text-gray-400">Current Owner:</p>
                <p className="text-white font-medium">{editingSquare.profiles.name}</p>
                <p className="text-gray-400 text-sm">{editingSquare.profiles.email}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingSquare(null)}
              className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-amber-600 hover:bg-amber-700"
            >
              <Check className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
