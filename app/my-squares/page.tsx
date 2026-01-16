'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import type { GridSquare } from '@/lib/supabase/types';
import { Grid3x3, Trophy, Download, Share2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function MySquaresPage() {
  const router = useRouter();
  const [squares, setSquares] = useState<GridSquare[]>([]);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [tournamentLaunched, setTournamentLaunched] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const supabase = createClient();
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', user.email)
        .single();

      if (profile) {
        setUserName(profile.name || '');

        const { data: userSquares } = await supabase
          .from('grid_squares')
          .select('*')
          .eq('user_id', profile.id)
          .eq('status', 'paid')
          .order('row_number', { ascending: true });

        if (userSquares) {
          setSquares(userSquares);
        }
      }

      const { data: settings } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'tournament_launched')
        .single();

      setTournamentLaunched(settings?.value === 'true');
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    const text = `I'm in the Super Bowl pool! I have ${squares.length} squares. Join me and support the scholarship fund!`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Super Bowl Pool',
        text: text,
        url: window.location.origin,
      });
    } else {
      navigator.clipboard.writeText(`${text} ${window.location.origin}`);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
          {/* Back Button */}
          <Link href="/dashboard" className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-[15px] font-medium text-[#232842] bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to dashboard
          </Link>

          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
                My Squares
              </h1>
              <p className="text-muted-foreground">
                {userName}'s {squares.length} square{squares.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleShare} variant="outline" className="gap-2">
                <Share2 className="w-4 h-4" />
                Share
              </Button>
            </div>
          </div>

          {squares.length === 0 ? (
            <Card className="p-12 text-center">
              <Grid3x3 className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-foreground mb-2">
                No Squares Yet
              </h2>
              <p className="text-muted-foreground mb-6">
                You haven't purchased any squares yet. Get started now!
              </p>
              <Link href="/pool">
                <Button size="lg">
                  Pick Your Squares
                </Button>
              </Link>
            </Card>
          ) : (
            <>
              {/* Summary Card */}
              <Card className="p-6 mb-6 bg-gradient-to-br from-primary/5 to-background border-primary/20">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div>
                    <div className="text-3xl font-bold text-primary mb-1">
                      {squares.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Squares</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-primary mb-1">
                      ${(squares.length * 50).toFixed(2)}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Invested</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-primary mb-1">
                      {tournamentLaunched ? 'Assigned' : 'Pending'}
                    </div>
                    <div className="text-sm text-muted-foreground">Number Status</div>
                  </div>
                </div>
              </Card>

              {/* Squares Grid */}
              <Card className="p-6">
                <h2 className="text-xl font-bold text-foreground mb-6">Your Squares</h2>

                {!tournamentLaunched && (
                  <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800">
                      <strong>Numbers not yet assigned.</strong> Once all 100 squares are sold, numbers will be randomly assigned to rows and columns.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {squares.map((square, index) => (
                    <div
                      key={square.id}
                      className="bg-card rounded-lg border-2 border-primary/20 p-4 hover:border-primary/50 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-muted-foreground">
                          #{index + 1}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {square.status}
                        </Badge>
                      </div>

                      <div className="text-center mb-2">
                        <div className="text-2xl font-bold text-primary">
                          [{square.row_number}, {square.col_number}]
                        </div>
                      </div>

                      {tournamentLaunched && square.row_score !== null && (
                        <div className="text-center pt-2 border-t border-border">
                          <div className="text-xs text-muted-foreground mb-1">Numbers</div>
                          <div className="text-lg font-bold text-foreground">
                            {square.row_score} - {square.col_score}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>

              {/* Add More CTA */}
              <Card className="p-8 mt-6 text-center bg-gradient-to-br from-secondary/5 to-background">
                <Trophy className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Want more chances to win?
                </h3>
                <p className="text-muted-foreground mb-6">
                  Purchase additional squares to increase your odds!
                </p>
                <Link href="/pool">
                  <Button size="lg">
                    Buy More Squares
                  </Button>
                </Link>
              </Card>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
