'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, X, Check } from 'lucide-react';
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
    const headers = ['Square #', 'Row', 'Col', 'Row Score', 'Col Score', 'Owner', 'Email', 'Status'];
    const rows = squares.map(sq => [
      getSquareNumber(sq.row_number, sq.col_number),
      sq.row_number,
      sq.col_number,
      sq.row_score ?? '-',
      sq.col_score ?? '-',
      sq.profiles?.name || '-',
      sq.profiles?.email || '-',
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

  const getFirstName = (name: string | null) => {
    if (!name) return '';
    return name.trim().split(' ')[0];
  };

  // Create a map for quick lookup
  const squareMap = new Map<string, GridSquareWithProfile>();
  squares.forEach(sq => {
    squareMap.set(`${sq.row_number}-${sq.col_number}`, sq);
  });

  const stats = {
    available: squares.filter(s => s.status === 'available').length,
    sold: squares.filter(s => s.status === 'paid').length,
  };

  const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Squares</h1>
          <p className="text-white/60">Click any square to edit</p>
        </div>
        <Button onClick={exportToCSV} className="bg-green-600 hover:bg-green-700">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6 max-w-md">
        <Card className="p-4 bg-white/5 border-white/10">
          <p className="text-2xl font-bold text-green-400">{stats.available}</p>
          <p className="text-sm text-white/60">Available</p>
        </Card>
        <Card className="p-4 bg-white/5 border-white/10">
          <p className="text-2xl font-bold text-[#cda33b]">{stats.sold}</p>
          <p className="text-sm text-white/60">Sold</p>
        </Card>
      </div>

      {/* Grid */}
      <Card className="p-6 bg-white/5 border-white/10 overflow-x-auto">
        <table className="border-collapse mx-auto">
          <thead>
            <tr>
              <th className="w-16 h-12" />
              {numbers.map(col => (
                <th key={col} className="w-28 h-12 text-center text-white/60 text-base font-medium">
                  Col {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {numbers.map(row => (
              <tr key={row}>
                <td className="w-16 h-28 text-center text-white/60 text-base font-medium">
                  Row {row}
                </td>
                {numbers.map(col => {
                  const square = squareMap.get(`${row}-${col}`);
                  if (!square) return <td key={col} className="w-28 h-28" />;

                  const isAvailable = square.status === 'available';
                  const boxNum = row * 10 + col + 1;

                  return (
                    <td key={col} className="p-1">
                      <button
                        onClick={() => handleEditClick(square)}
                        className={`
                          w-28 h-28 rounded-xl border-2 transition-all
                          flex flex-col items-center justify-center gap-1
                          hover:scale-105 hover:z-10 cursor-pointer
                          ${isAvailable
                            ? 'bg-green-500/20 border-green-500/40 hover:border-green-400'
                            : 'bg-[#cda33b]/20 border-[#cda33b]/40 hover:border-[#cda33b]'
                          }
                        `}
                      >
                        <span className={`text-lg font-bold ${isAvailable ? 'text-green-400' : 'text-[#cda33b]'}`}>
                          #{boxNum}
                        </span>
                        {square.profiles?.name ? (
                          <span className="text-sm text-white/70 truncate max-w-24 px-1">
                            {getFirstName(square.profiles.name)}
                          </span>
                        ) : (
                          <span className="text-sm text-white/40">Available</span>
                        )}
                        {square.row_score !== null && (
                          <span className="text-xs text-white/50">
                            {square.row_score}-{square.col_score}
                          </span>
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Legend */}
      <div className="flex items-center gap-8 mt-6 text-base">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded bg-green-500/20 border-2 border-green-500/40" />
          <span className="text-white/60">Available</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded bg-[#cda33b]/20 border-2 border-[#cda33b]/40" />
          <span className="text-white/60">Sold</span>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingSquare} onOpenChange={(open) => !open && setEditingSquare(null)}>
        <DialogContent className="bg-[#1a1f35] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">
              Edit Square #{editingSquare && getSquareNumber(editingSquare.row_number, editingSquare.col_number)}
            </DialogTitle>
            <DialogDescription className="text-white/60">
              Row {editingSquare?.row_number}, Column {editingSquare?.col_number}
              {editingSquare?.row_score !== null && (
                <span className="ml-2 text-[#cda33b]">
                  (Numbers: {editingSquare?.row_score}-{editingSquare?.col_score})
                </span>
              )}
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
                    Make Available (No Owner)
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
                  <SelectItem value="paid" className="text-[#cda33b]">Sold (Paid)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {editingSquare?.profiles && (
              <div className="p-3 bg-white/5 rounded-lg space-y-1">
                <p className="text-sm text-white/60">
                  Current Owner: <span className="text-white font-medium">{editingSquare.profiles.name}</span>
                </p>
                <p className="text-sm text-white/60">
                  Email: <span className="text-white">{editingSquare.profiles.email}</span>
                </p>
                {editingSquare.profiles.phone && (
                  <p className="text-sm text-white/60">
                    Phone: <span className="text-white">{editingSquare.profiles.phone}</span>
                  </p>
                )}
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
