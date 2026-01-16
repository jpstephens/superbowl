'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users, DollarSign, Grid3x3, Trophy, Rocket,
  CheckCircle2, Download, Mail, Loader2, AlertCircle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRevenue: 0,
    soldSquares: 0,
    availableSquares: 100,
  });
  const [loading, setLoading] = useState(true);
  const [tournamentLaunched, setTournamentLaunched] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [showLaunchDialog, setShowLaunchDialog] = useState(false);
  const [canLaunch, setCanLaunch] = useState(false);
  const [sendingEmails, setSendingEmails] = useState(false);

  useEffect(() => {
    loadStats();
    checkTournamentStatus();
  }, []);

  const checkTournamentStatus = async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'tournament_launched')
        .single();

      setTournamentLaunched(data?.value === 'true');
    } catch (error) {
      console.error('Error checking tournament status:', error);
    }
  };

  const loadStats = async () => {
    try {
      const supabase = createClient();

      const [squaresResult, settingsResult] = await Promise.all([
        // Get all squares with user_id to count unique participants
        supabase.from('grid_squares').select('status, user_id'),
        supabase.from('settings').select('value').eq('key', 'square_price').single(),
      ]);

      const { data: squares } = squaresResult;
      const { data: priceSetting } = settingsResult;

      const squarePrice = priceSetting?.value ? parseFloat(priceSetting.value) : 50;

      const paidSquares = squares?.filter(s => s.status === 'paid') || [];
      const soldSquares = paidSquares.length;

      // Count unique participants (unique user_ids from paid squares)
      const uniqueUserIds = new Set(paidSquares.map(s => s.user_id).filter(Boolean));
      const totalUsers = uniqueUserIds.size;

      // Calculate revenue from sold squares × price
      const totalRevenue = soldSquares * squarePrice;

      setStats({
        totalUsers,
        totalRevenue,
        soldSquares,
        availableSquares: 100 - soldSquares,
      });

      setCanLaunch(soldSquares === 100);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLaunchTournament = async () => {
    setLaunching(true);
    try {
      const response = await fetch('/api/admin/launch-tournament', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Failed to launch tournament');
        return;
      }

      alert('Tournament launched! Numbers have been randomized.');
      setTournamentLaunched(true);
      setShowLaunchDialog(false);
      window.location.reload();
    } catch (error) {
      console.error('Error launching tournament:', error);
      alert('An error occurred while launching the tournament');
    } finally {
      setLaunching(false);
    }
  };

  const handleDownloadPDF = () => {
    window.open('/api/grid/pdf', '_blank');
  };

  const handleSendEmails = async () => {
    if (!confirm('Send grid announcement email to all participants?')) {
      return;
    }

    setSendingEmails(true);
    try {
      const response = await fetch('/api/admin/send-grid-email', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Failed to send emails');
        return;
      }

      alert(`Emails sent! ${data.sent} successful, ${data.failed} failed.`);
    } catch (error) {
      console.error('Error sending emails:', error);
      alert('An error occurred while sending emails');
    } finally {
      setSendingEmails(false);
    }
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
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-white/60">Overview of your Super Bowl pool</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-5 bg-white/5 border-white/10">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/20">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
              <p className="text-sm text-white/60">Participants</p>
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-white/5 border-white/10">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-500/20">
              <DollarSign className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-3xl font-bold text-white">${stats.totalRevenue.toLocaleString()}</p>
              <p className="text-sm text-white/60">Revenue</p>
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-white/5 border-white/10">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-[#cda33b]/20">
              <Grid3x3 className="w-6 h-6 text-[#cda33b]" />
            </div>
            <div>
              <p className="text-3xl font-bold text-white">{stats.soldSquares}</p>
              <p className="text-sm text-white/60">Sold</p>
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-white/5 border-white/10">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-500/20">
              <Trophy className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-3xl font-bold text-white">{stats.availableSquares}</p>
              <p className="text-sm text-white/60">Available</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card className="p-5 bg-white/5 border-white/10 mb-8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-white font-medium">Sales Progress</span>
          <span className="text-[#cda33b] font-bold">{stats.soldSquares}%</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-[#cda33b] to-[#e8c547] h-3 rounded-full transition-all duration-500"
            style={{ width: `${stats.soldSquares}%` }}
          />
        </div>
      </Card>

      {/* Tournament Launch Section */}
      <Card className="p-6 bg-white/5 border-white/10 mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${tournamentLaunched ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
              <Rocket className={`w-6 h-6 ${tournamentLaunched ? 'text-green-400' : 'text-red-400'}`} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Tournament Status</h2>
              {tournamentLaunched ? (
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Launched - Numbers Assigned</span>
                </div>
              ) : (
                <p className="text-white/60">
                  {canLaunch ? 'Ready to launch!' : `${stats.availableSquares} squares remaining`}
                </p>
              )}
            </div>
          </div>

          {!tournamentLaunched && (
            <Button
              onClick={() => setShowLaunchDialog(true)}
              disabled={!canLaunch}
              className="bg-red-600 hover:bg-red-700 disabled:bg-white/10 disabled:text-white/40"
              size="lg"
            >
              <Rocket className="w-4 h-4 mr-2" />
              Launch Tournament
            </Button>
          )}
        </div>

        {/* Post-Launch Actions */}
        {tournamentLaunched && (
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-sm font-medium text-white/60 mb-4">GRID DISTRIBUTION</p>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleDownloadPDF}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
              <Button
                onClick={handleSendEmails}
                disabled={sendingEmails}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {sendingEmails ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Email Participants
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {!canLaunch && !tournamentLaunched && (
          <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-200">
                Tournament can only be launched when all 100 squares are sold.
                Numbers will be randomly assigned at launch time.
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Launch Dialog */}
      <Dialog open={showLaunchDialog} onOpenChange={setShowLaunchDialog}>
        <DialogContent className="bg-[#1a1f35] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Launch Tournament?</DialogTitle>
            <DialogDescription className="text-white/60">
              This will randomly assign numbers 0-9 to rows and columns. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="text-sm text-amber-200">
                <strong>Confirm:</strong> All 100 squares are sold and paid?
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowLaunchDialog(false)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleLaunchTournament}
              disabled={launching}
              className="bg-red-600 hover:bg-red-700"
            >
              {launching ? 'Launching...' : 'Launch Now'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
