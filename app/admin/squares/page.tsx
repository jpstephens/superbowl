'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Download, Edit2, X, Check } from 'lucide-react';
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
  const [squares, setSquares] = useState<GridSquareWithProfile[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingSquare, setEditingSquare] = useState<GridSquareWithProfile | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const supabase = createClient();

      const { data: squaresData, error: squaresError } = await supabase
        .from('grid_squares')
        .select(`*, profiles:user_id (id, name, email, phone)`)
        .order('row_number', { ascending: true })
        .order('col_number', { ascending: true });

      if (squaresError) throw squaresError;
      setSquares(squaresData || []);

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
    setSelectedStatus(square.status);
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
          status: selectedStatus,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Failed to update square');
        return;
      }

      await loadData();
      setEditingSquare(null);
    } catch (error) {
      console.error('Error updating square:', error);
      alert('An error occurred while updating the square');
    } finally {
      setSaving(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Square #', 'Row', 'Col', 'Row Score', 'Col Score', 'Owner', 'Email', 'Phone', 'Status'];
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
    if (statusFilter !== 'all' && sq.status !== statusFilter) return false;
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
    available: squares.filter(s => s.status === 'available').length,
    paid: squares.filter(s => s.status === 'paid' || s.status === 'confirmed').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-3 border-[#cda33b] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Squares</h1>
        <p className="text-white/60">Manage square ownership and status</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="p-4 bg-white/5 border-white/10">
          <p className="text-2xl font-bold text-green-400">{stats.available}</p>
          <p className="text-sm text-white/60">Available</p>
        </Card>
        <Card className="p-4 bg-white/5 border-white/10">
          <p className="text-2xl font-bold text-[#cda33b]">{stats.paid}</p>
          <p className="text-sm text-white/60">Sold</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 bg-white/5 border-white/10 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                placeholder="Search by #, name, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36 bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1f35] border-white/10">
                <SelectItem value="all" className="text-white">All</SelectItem>
                <SelectItem value="available" className="text-green-400">Available</SelectItem>
                <SelectItem value="paid" className="text-[#cda33b]">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={exportToCSV} className="bg-green-600 hover:bg-green-700">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card className="bg-white/5 border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/60 uppercase">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/60 uppercase">Position</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/60 uppercase">Numbers</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/60 uppercase">Owner</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/60 uppercase">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/60 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-white/60 uppercase">Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredSquares.map((square) => (
                <tr key={square.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-lg font-bold text-white">
                      {getSquareNumber(square.row_number, square.col_number)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/70 text-sm">
                    R{square.row_number} C{square.col_number}
                  </td>
                  <td className="px-4 py-3">
                    {square.row_score !== null && square.col_score !== null ? (
                      <span className="font-mono text-[#cda33b] font-bold">
                        {square.row_score}-{square.col_score}
                      </span>
                    ) : (
                      <span className="text-white/30">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-white font-medium">
                      {square.profiles?.name || <span className="text-white/30">—</span>}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {square.profiles?.email ? (
                      <a href={`mailto:${square.profiles.email}`} className="text-blue-400 hover:underline text-sm">
                        {square.profiles.email}
                      </a>
                    ) : (
                      <span className="text-white/30">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      square.status === 'available' ? 'bg-green-500/20 text-green-400' :
                      square.status === 'paid' ? 'bg-[#cda33b]/20 text-[#cda33b]' :
                      'bg-white/10 text-white/60'
                    }`}>
                      {square.status === 'paid' ? 'Sold' : square.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      onClick={() => handleEditClick(square)}
                      size="sm"
                      variant="ghost"
                      className="text-white/60 hover:text-white hover:bg-white/10"
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
          <div className="p-8 text-center text-white/50">
            No squares match your search.
          </div>
        )}
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingSquare} onOpenChange={(open) => !open && setEditingSquare(null)}>
        <DialogContent className="bg-[#1a1f35] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">
              Edit Square #{editingSquare && getSquareNumber(editingSquare.row_number, editingSquare.col_number)}
            </DialogTitle>
            <DialogDescription className="text-white/60">
              Change ownership or status for this square.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Owner</label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="w-full bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1f35] border-white/10 max-h-60">
                  <SelectItem value="available" className="text-green-400">
                    Make Available
                  </SelectItem>
                  {profiles.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id} className="text-white">
                      {profile.name} ({profile.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1f35] border-white/10">
                  <SelectItem value="available" className="text-green-400">Available</SelectItem>
                  <SelectItem value="paid" className="text-[#cda33b]">Paid (Sold)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {editingSquare?.profiles && (
              <div className="p-3 bg-white/5 rounded-lg">
                <p className="text-sm text-white/60">Current: <span className="text-white">{editingSquare.profiles.name}</span></p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingSquare(null)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#cda33b] hover:bg-[#b8922f]"
            >
              <Check className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
