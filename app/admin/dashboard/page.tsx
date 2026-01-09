'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users, DollarSign, Grid3x3, Trophy, Rocket,
  Settings, CreditCard, LogOut, AlertCircle, Shield,
  TrendingUp, CheckCircle2, Download, Mail, Loader2
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

export default function AdminDashboardPage() {
  const router = useRouter();
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [sendingEmails, setSendingEmails] = useState(false);
  const [emailResult, setEmailResult] = useState<{ sent: number; failed: number } | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const supabase = createClient();

      // Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/admin/login');
        return;
      }

      // Check if user is an admin
      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('id, role')
        .eq('email', user.email)
        .single();

      if (!adminUser) {
        // Not an admin - sign them out and redirect
        await supabase.auth.signOut();
        router.push('/admin/login');
        return;
      }

      setIsAdmin(true);
      setAuthChecked(true);

      // Now load data
      loadStats();
      checkTournamentStatus();
    } catch (error) {
      console.error('Auth check error:', error);
      router.push('/admin/login');
    }
  };

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

      // Get total users
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id', { count: 'exact' });

      // Get square stats
      const { data: squares } = await supabase
        .from('grid_squares')
        .select('status');

      const soldSquares = squares?.filter(s => 
        s.status === 'paid' || s.status === 'confirmed'
      ).length || 0;

      // Get revenue
      const { data: payments } = await supabase
        .from('payments')
        .select('amount, status');

      const totalRevenue = payments
        ?.filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      setStats({
        totalUsers: profiles?.length || 0,
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

      alert('Tournament launched successfully! Numbers have been randomized.');
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

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  const handleDownloadPDF = () => {
    window.open('/api/grid/pdf', '_blank');
  };

  const handleSendEmails = async () => {
    if (!confirm('Send grid announcement email to all participants?')) {
      return;
    }

    setSendingEmails(true);
    setEmailResult(null);

    try {
      const response = await fetch('/api/admin/send-grid-email', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Failed to send emails');
        return;
      }

      setEmailResult({ sent: data.sent, failed: data.failed });
      alert(`Emails sent! ${data.sent} successful, ${data.failed} failed.`);
    } catch (error) {
      console.error('Error sending emails:', error);
      alert('An error occurred while sending emails');
    } finally {
      setSendingEmails(false);
    }
  };

  if (loading || !authChecked) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect in useEffect
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
                  Admin Dashboard
                </h1>
                <p className="text-xs text-gray-400">Michael Williams Memorial</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
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
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="p-6 bg-gray-800 border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 text-blue-400" />
                <span className="text-3xl font-bold text-white">{stats.totalUsers}</span>
              </div>
              <p className="text-sm text-gray-400">Total Users</p>
            </Card>

            <Card className="p-6 bg-gray-800 border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-8 h-8 text-green-400" />
                <span className="text-3xl font-bold text-white">${stats.totalRevenue.toFixed(0)}</span>
              </div>
              <p className="text-sm text-gray-400">Total Revenue</p>
            </Card>

            <Card className="p-6 bg-gray-800 border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <Grid3x3 className="w-8 h-8 text-amber-400" />
                <span className="text-3xl font-bold text-white">{stats.soldSquares}</span>
              </div>
              <p className="text-sm text-gray-400">Squares Sold</p>
              <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-amber-400 h-2 rounded-full transition-all"
                  style={{ width: `${stats.soldSquares}%` }}
                />
              </div>
            </Card>

            <Card className="p-6 bg-gray-800 border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <Trophy className="w-8 h-8 text-purple-400" />
                <span className="text-3xl font-bold text-white">{stats.availableSquares}</span>
              </div>
              <p className="text-sm text-gray-400">Available Squares</p>
            </Card>
          </div>

          {/* Launch Tournament Section */}
          <Card className="p-6 mb-8 bg-gray-800 border-gray-700">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                  <Rocket className="w-6 h-6 text-red-400" />
                  Tournament Status
                </h2>
                {tournamentLaunched ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    <span className="text-green-400 font-semibold">Tournament Launched</span>
                  </div>
                ) : (
                  <p className="text-gray-400">
                    {canLaunch
                      ? 'All squares sold! Ready to launch.'
                      : `${stats.availableSquares} squares remaining before launch.`
                    }
                  </p>
                )}
              </div>

              {!tournamentLaunched && (
                <Button
                  onClick={() => setShowLaunchDialog(true)}
                  disabled={!canLaunch}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-500"
                  size="lg"
                >
                  <Rocket className="w-4 h-4 mr-2" />
                  Launch Tournament
                </Button>
              )}
            </div>

            {/* Post-Launch Actions */}
            {tournamentLaunched && (
              <div className="mt-6 pt-6 border-t border-gray-700">
                <h3 className="text-sm font-semibold text-gray-400 mb-4">GRID DISTRIBUTION</h3>
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={handleDownloadPDF}
                    variant="outline"
                    className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Grid PDF
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
                        Email Grid to Participants
                      </>
                    )}
                  </Button>
                </div>
                {emailResult && (
                  <div className="mt-3 text-sm text-gray-400">
                    Last send: {emailResult.sent} delivered, {emailResult.failed} failed
                  </div>
                )}
              </div>
            )}

            {!canLaunch && !tournamentLaunched && (
              <div className="mt-4 p-4 bg-amber-900/30 border border-amber-700 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-200">
                    <strong>Important:</strong> Tournament can only be launched when all 100 squares are sold.
                    Numbers will be randomly assigned at launch time.
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/admin/squares">
              <Card className="p-6 bg-gray-800 border-gray-700 hover:border-amber-600 transition-all cursor-pointer group">
                <Grid3x3 className="w-8 h-8 text-amber-400 mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-bold text-white mb-1">Square Management</h3>
                <p className="text-sm text-gray-400">Edit ownership & view contact info</p>
              </Card>
            </Link>

            <Link href="/admin/live">
              <Card className="p-6 bg-gray-800 border-gray-700 hover:border-red-600 transition-all cursor-pointer group">
                <Rocket className="w-8 h-8 text-red-400 mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-bold text-white mb-1">Live Game Control</h3>
                <p className="text-sm text-gray-400">Manage scores during the game</p>
              </Card>
            </Link>

            <Link href="/admin/props">
              <Card className="p-6 bg-gray-800 border-gray-700 hover:border-yellow-600 transition-all cursor-pointer group">
                <Trophy className="w-8 h-8 text-yellow-400 mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-bold text-white mb-1">Prop Bets</h3>
                <p className="text-sm text-gray-400">Create and manage prop bets</p>
              </Card>
            </Link>

            <Link href="/admin/settings">
              <Card className="p-6 bg-gray-800 border-gray-700 hover:border-gray-600 transition-all cursor-pointer group">
                <Settings className="w-8 h-8 text-blue-400 mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-bold text-white mb-1">Settings</h3>
                <p className="text-sm text-gray-400">Configure pool settings and prizes</p>
              </Card>
            </Link>

            <Link href="/admin/payments">
              <Card className="p-6 bg-gray-800 border-gray-700 hover:border-gray-600 transition-all cursor-pointer group">
                <CreditCard className="w-8 h-8 text-green-400 mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-bold text-white mb-1">Payments</h3>
                <p className="text-sm text-gray-400">View payment history and status</p>
              </Card>
            </Link>

            <Link href="/">
              <Card className="p-6 bg-gray-800 border-gray-700 hover:border-gray-600 transition-all cursor-pointer group">
                <TrendingUp className="w-8 h-8 text-purple-400 mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-bold text-white mb-1">View Pool</h3>
                <p className="text-sm text-gray-400">See public-facing pool page</p>
              </Card>
            </Link>

            <Link href="/watch">
              <Card className="p-6 bg-gray-800 border-gray-700 hover:border-gray-600 transition-all cursor-pointer group">
                <Grid3x3 className="w-8 h-8 text-cyan-400 mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-bold text-white mb-1">Watch Mode</h3>
                <p className="text-sm text-gray-400">Game day live view</p>
              </Card>
            </Link>
          </div>
        </div>
      </main>

      {/* Launch Dialog */}
      <Dialog open={showLaunchDialog} onOpenChange={setShowLaunchDialog}>
        <DialogContent className="bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Launch Tournament?</DialogTitle>
            <DialogDescription className="text-gray-400">
              This will randomly assign numbers 0-9 to rows and columns. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="p-4 bg-amber-900/30 border border-amber-700 rounded-lg">
              <p className="text-sm text-amber-200">
                <strong>Confirm:</strong> All 100 squares are sold and payments confirmed?
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowLaunchDialog(false)}
              className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
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
