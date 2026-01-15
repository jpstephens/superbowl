'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PreGameView from '@/components/pool/PreGameView';
import GameDayView from '@/components/pool/GameDayView';
import PoolGrid from '@/components/PoolGrid';
import LiveScoreBanner from '@/components/LiveScoreBanner';
import type { GridSquare, GameState } from '@/lib/supabase/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Grid3x3, Trophy } from 'lucide-react';

interface UserSquare {
  id: string;
  row: number;
  col: number;
  rowScore: number | null;
  colScore: number | null;
}

interface QuarterWinner {
  quarter: number;
  name: string;
  prize: number;
  afcScore: number;
  nfcScore: number;
}

export default function PoolPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [userSquares, setUserSquares] = useState<UserSquare[]>([]);
  const [quarterWinners, setQuarterWinners] = useState<QuarterWinner[]>([]);
  const [stats, setStats] = useState({
    totalSquares: 100,
    soldSquares: 0,
    availableSquares: 100,
    totalRaised: 0,
  });
  const [prizes, setPrizes] = useState({
    q1: 250,
    q2: 250,
    q3: 250,
    q4: 250,
  });
  const [leaderboard, setLeaderboard] = useState<Array<{ name: string; squareCount: number }>>([]);
  const [gameDate, setGameDate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadData();
  }, []);

  // Handle live score updates from the banner
  const handleScoreUpdate = (data: any) => {
    setGameState({
      ...gameState,
      afc_score: data.afcScore,
      nfc_score: data.nfcScore,
      afc_team: data.afcTeam,
      nfc_team: data.nfcTeam,
      quarter: data.quarter,
      time_remaining: data.timeRemaining,
      is_live: data.isLive,
      is_halftime: data.isHalftime,
      is_final: data.isFinal,
    } as GameState);
  };

  const loadData = async () => {
    try {
      const supabase = createClient();

      // Load user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, name')
          .eq('email', user.email)
          .single();

        if (profile) {
          setUserId(profile.id);
          setUserName(profile.name || '');

          // Load user's squares
          const { data: squares } = await supabase
            .from('grid_squares')
            .select('id, row_number, col_number, row_score, col_score')
            .eq('user_id', profile.id)
            .in('status', ['paid', 'confirmed']);

          if (squares) {
            setUserSquares(
              squares.map((s) => ({
                id: s.id,
                row: s.row_number,
                col: s.col_number,
                rowScore: s.row_score,
                colScore: s.col_score,
              }))
            );
          }
        }
      }

      // Load game state
      await loadGameScore();

      // Load settings
      const { data: settings } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', [
          'game_date',
          'square_price',
          'prize_q1',
          'prize_q2',
          'prize_q3',
          'prize_q4',
          'payout_percent_q1',
          'payout_percent_q2',
          'payout_percent_q3',
          'payout_percent_q4',
        ]);

      if (settings) {
        const gameDateSetting = settings.find((s) => s.key === 'game_date');
        if (gameDateSetting?.value) setGameDate(gameDateSetting.value);

        const squarePrice = parseFloat(
          settings.find((s) => s.key === 'square_price')?.value || '50'
        );

        // Load stats
        const { data: allSquares } = await supabase
          .from('grid_squares')
          .select('status');

        const sold =
          allSquares?.filter(
            (s) => s.status === 'paid' || s.status === 'confirmed'
          ).length || 0;

        const totalRaised = sold * squarePrice;

        setStats({
          totalSquares: 100,
          soldSquares: sold,
          availableSquares: 100 - sold,
          totalRaised,
        });

        // Calculate prizes from percentages or use fixed amounts
        const q1Percent = parseFloat(
          settings.find((s) => s.key === 'payout_percent_q1')?.value || '0'
        );
        if (q1Percent > 0) {
          const prizePool = totalRaised;
          setPrizes({
            q1: Math.round(
              (prizePool *
                parseFloat(
                  settings.find((s) => s.key === 'payout_percent_q1')?.value || '20'
                )) /
                100
            ),
            q2: Math.round(
              (prizePool *
                parseFloat(
                  settings.find((s) => s.key === 'payout_percent_q2')?.value || '20'
                )) /
                100
            ),
            q3: Math.round(
              (prizePool *
                parseFloat(
                  settings.find((s) => s.key === 'payout_percent_q3')?.value || '20'
                )) /
                100
            ),
            q4: Math.round(
              (prizePool *
                parseFloat(
                  settings.find((s) => s.key === 'payout_percent_q4')?.value || '40'
                )) /
                100
            ),
          });
        } else {
          setPrizes({
            q1: parseFloat(settings.find((s) => s.key === 'prize_q1')?.value || '250'),
            q2: parseFloat(settings.find((s) => s.key === 'prize_q2')?.value || '250'),
            q3: parseFloat(settings.find((s) => s.key === 'prize_q3')?.value || '250'),
            q4: parseFloat(settings.find((s) => s.key === 'prize_q4')?.value || '250'),
          });
        }
      }

      // Load leaderboard (top buyers)
      const { data: leaderboardData } = await supabase
        .from('grid_squares')
        .select('user_id, profiles:user_id(name)')
        .in('status', ['paid', 'confirmed'])
        .not('user_id', 'is', null);

      if (leaderboardData) {
        const counts: Record<string, { name: string; count: number }> = {};
        leaderboardData.forEach((sq: any) => {
          if (sq.profiles?.name) {
            if (!counts[sq.user_id]) {
              counts[sq.user_id] = { name: sq.profiles.name, count: 0 };
            }
            counts[sq.user_id].count++;
          }
        });

        const sorted = Object.values(counts)
          .sort((a, b) => b.count - a.count)
          .slice(0, 10)
          .map((item) => ({ name: item.name, squareCount: item.count }));

        setLeaderboard(sorted);
      }

      // Load quarter winners
      const { data: winners } = await supabase
        .from('quarterly_winners')
        .select('*, profiles:user_id(name)')
        .order('quarter', { ascending: true });

      if (winners) {
        setQuarterWinners(
          winners.map((w: any) => ({
            quarter: w.quarter,
            name: w.profiles?.name || 'Unknown',
            prize: w.prize_amount,
            afcScore: w.afc_score,
            nfcScore: w.nfc_score,
          }))
        );
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGameScore = async () => {
    try {
      const supabase = createClient();
      const { data: gameData } = await supabase
        .from('game_state')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (gameData) {
        setGameState(gameData);
      }
    } catch (error) {
      console.error('Error loading game score:', error);
    }
  };

  // Determine if game is live or in pre-game state
  const isGameLive = gameState?.is_live || false;
  const isGameFinal = gameState?.is_final || false;
  const isPreGame = !isGameLive && !isGameFinal;

  const gameScore = useMemo(() => {
    if (!gameState) return null;
    return {
      afcScore: gameState.afc_score || 0,
      nfcScore: gameState.nfc_score || 0,
      afcTeam: gameState.afc_team || 'AFC Team',
      nfcTeam: gameState.nfc_team || 'NFC Team',
      quarter: gameState.quarter || 0,
      timeRemaining: gameState.time_remaining || '0:00',
      isLive: gameState.is_live || false,
      isHalftime: gameState.is_halftime || false,
      isFinal: gameState.is_final || false,
    };
  }, [gameState]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 py-6">
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
          {/* Live Score Banner - Always visible, auto-updates */}
          <div className="mb-6">
            <LiveScoreBanner
              onScoreUpdate={handleScoreUpdate}
              refreshInterval={10000}
              showDetails={true}
            />
          </div>

          {/* Page Header */}
          <div className="mb-6 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">
              Super Bowl Pool
            </h1>
            <p className="text-sm text-muted-foreground">
              Michael Williams Memorial Scholarship Fund
            </p>
          </div>

          {/* Tabs for different views */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
              <TabsTrigger value="overview" className="gap-2">
                <Trophy className="w-4 h-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="grid" className="gap-2">
                <Grid3x3 className="w-4 h-4" />
                <span className="hidden sm:inline">Grid</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              {isPreGame ? (
                <PreGameView
                  gameDate={gameDate}
                  stats={stats}
                  leaderboard={leaderboard}
                  userSquares={userSquares.map((s) => ({ row: s.row, col: s.col }))}
                  isLoggedIn={!!userId}
                />
              ) : (
                <GameDayView
                  gameScore={gameScore!}
                  userSquares={userSquares}
                  quarterWinners={quarterWinners}
                  prizes={prizes}
                  isLoggedIn={!!userId}
                  userName={userName}
                />
              )}
            </TabsContent>

            <TabsContent value="grid">
              <div className="max-w-4xl mx-auto">
                <PoolGrid
                  userId={userId}
                  gameScore={
                    gameState
                      ? {
                          afcScore: gameState.afc_score,
                          nfcScore: gameState.nfc_score,
                          afcTeam: gameState.afc_team,
                          nfcTeam: gameState.nfc_team,
                          quarter: gameState.quarter,
                          isLive: gameState.is_live,
                        }
                      : null
                  }
                />
              </div>
            </TabsContent>

          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}
