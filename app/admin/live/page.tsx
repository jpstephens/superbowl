'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Logo from '@/components/Logo';
import Link from 'next/link';
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Minus,
  Trophy,
  Clock,
  Users,
  Activity,
  CheckCircle2,
  AlertCircle,
  Send,
  RefreshCw,
} from 'lucide-react';
import type { GameState, QuarterWinner } from '@/lib/supabase/types';

/**
 * Admin Live Game Panel
 * Real-time score management and game control during the Super Bowl
 */
export default function AdminLivePage() {
  const router = useRouter();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [quarterWinners, setQuarterWinners] = useState<QuarterWinner[]>([]);

  // Form state for score updates
  const [scoreForm, setScoreForm] = useState({
    afcScore: 0,
    nfcScore: 0,
    quarter: 0,
    timeRemaining: '15:00',
    playDescription: '',
  });

  useEffect(() => {
    // Bypass auth for testing
    loadGameState();
    loadQuarterWinners();

    // Set up real-time subscription
    const supabase = createClient();
    const channel = supabase
      .channel('admin_game_state')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'game_state' },
        (payload) => {
          if (payload.new) {
            setGameState(payload.new as GameState);
            setScoreForm({
              afcScore: (payload.new as GameState).afc_score,
              nfcScore: (payload.new as GameState).nfc_score,
              quarter: (payload.new as GameState).quarter,
              timeRemaining: (payload.new as GameState).time_remaining || '15:00',
              playDescription: '',
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadGameState = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('game_state')
        .select('*')
        .single();

      if (error) throw error;

      setGameState(data);
      setScoreForm({
        afcScore: data.afc_score,
        nfcScore: data.nfc_score,
        quarter: data.quarter,
        timeRemaining: data.time_remaining || '15:00',
        playDescription: '',
      });
    } catch (error) {
      console.error('Error loading game state:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadQuarterWinners = async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('quarterly_winners')
        .select(`*, profiles:user_id(name)`)
        .order('quarter');

      if (data) setQuarterWinners(data);
    } catch (error) {
      console.error('Error loading winners:', error);
    }
  };

  const updateGameState = async (updates: Partial<GameState>) => {
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', user?.email)
        .single();

      const { error } = await supabase
        .from('game_state')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
          updated_by: profile?.id,
        })
        .eq('id', gameState?.id);

      if (error) throw error;

      // Log score change if score was updated
      if (updates.afc_score !== undefined || updates.nfc_score !== undefined) {
        await supabase.from('score_history').insert({
          afc_score: updates.afc_score ?? gameState?.afc_score,
          nfc_score: updates.nfc_score ?? gameState?.nfc_score,
          quarter: updates.quarter ?? gameState?.quarter,
          time_remaining: updates.time_remaining ?? gameState?.time_remaining,
          play_description: scoreForm.playDescription || null,
          scoring_type: 'manual',
        });
      }

      await loadGameState();
    } catch (error) {
      console.error('Error updating game state:', error);
      alert('Error updating game state');
    } finally {
      setSaving(false);
    }
  };

  const handleScoreChange = (team: 'afc' | 'nfc', delta: number) => {
    if (team === 'afc') {
      setScoreForm((prev) => ({
        ...prev,
        afcScore: Math.max(0, prev.afcScore + delta),
      }));
    } else {
      setScoreForm((prev) => ({
        ...prev,
        nfcScore: Math.max(0, prev.nfcScore + delta),
      }));
    }
  };

  const handleQuickScore = async (team: 'afc' | 'nfc', points: number, type: string) => {
    const newScore = team === 'afc'
      ? { afc_score: (gameState?.afc_score || 0) + points }
      : { nfc_score: (gameState?.nfc_score || 0) + points };

    setScoreForm((prev) => ({
      ...prev,
      playDescription: type,
    }));

    await updateGameState(newScore);
  };

  const handleEndQuarter = async () => {
    if (!gameState) return;

    const currentQuarter = gameState.quarter;
    if (currentQuarter >= 4 && !gameState.is_final) {
      // Check if we need overtime
      if (gameState.afc_score === gameState.nfc_score) {
        await updateGameState({
          quarter: 5,
          time_remaining: '10:00',
          is_halftime: false,
        });
        return;
      }
    }

    // Record quarter winner
    const afcLast = gameState.afc_score % 10;
    const nfcLast = gameState.nfc_score % 10;

    const supabase = createClient();
    
    // Find winning square
    const { data: winningSquare } = await supabase
      .from('grid_squares')
      .select('user_id')
      .eq('row_score', afcLast)
      .eq('col_score', nfcLast)
      .in('status', ['paid', 'confirmed'])
      .single();

    // Get prize amount from settings
    const { data: prizeSetting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', `prize_q${currentQuarter}`)
      .single();

    // Record winner
    await supabase.from('quarterly_winners').upsert({
      quarter: currentQuarter,
      user_id: winningSquare?.user_id || null,
      row_score: afcLast,
      col_score: nfcLast,
      prize_amount: prizeSetting?.value ? parseFloat(prizeSetting.value) : null,
    }, { onConflict: 'quarter' });

    // Update game state
    if (currentQuarter === 2) {
      await updateGameState({
        is_halftime: true,
        time_remaining: '0:00',
      });
    } else if (currentQuarter >= 4) {
      await updateGameState({
        is_final: true,
        is_live: false,
        time_remaining: '0:00',
      });
    } else {
      await updateGameState({
        quarter: currentQuarter + 1,
        time_remaining: '15:00',
        is_halftime: false,
      });
    }

    await loadQuarterWinners();
    alert(`Q${currentQuarter} ended! Winner recorded.`);
  };

  const handleStartGame = async () => {
    await updateGameState({
      is_live: true,
      quarter: 1,
      time_remaining: '15:00',
      is_halftime: false,
      is_final: false,
    });
  };

  const handleResetGame = async () => {
    if (!confirm('Reset game to pre-game state? This will clear all scores.')) return;

    await updateGameState({
      afc_score: 0,
      nfc_score: 0,
      quarter: 0,
      time_remaining: '15:00',
      is_live: false,
      is_halftime: false,
      is_final: false,
      possession: null,
      down: null,
      yards_to_go: null,
      yard_line: null,
      last_play: null,
    });

    // Clear quarter winners
    const supabase = createClient();
    await supabase.from('quarterly_winners').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('score_history').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    await loadQuarterWinners();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CDA33B]"></div>
      </div>
    );
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
                <h1 className="text-sm font-bold text-white leading-tight">Live Game Control</h1>
                <p className="text-xs text-gray-400">Manage scores and game state</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Users className="w-4 h-4" />
                <span>{onlineUsers} online</span>
              </div>
              <Link href="/admin/dashboard">
                <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-gray-800">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="py-8">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
          {/* Game Status */}
          <Card className="p-6 bg-gray-800 border-gray-700 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {gameState?.is_live ? (
                  <>
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    <span className="text-red-500 font-bold">LIVE</span>
                  </>
                ) : gameState?.is_final ? (
                  <span className="text-gray-400 font-bold">FINAL</span>
                ) : (
                  <span className="text-gray-400 font-bold">PRE-GAME</span>
                )}
                <span className="text-gray-500">|</span>
                <span className="text-gray-400">
                  Q{gameState?.quarter || 0} • {gameState?.time_remaining || '15:00'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {!gameState?.is_live && !gameState?.is_final && (
                  <Button
                    onClick={handleStartGame}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Game
                  </Button>
                )}
                {gameState?.is_live && (
                  <Button
                    onClick={handleEndQuarter}
                    className="bg-yellow-600 hover:bg-yellow-700"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    End Q{gameState.quarter}
                  </Button>
                )}
                <Button
                  onClick={handleResetGame}
                  variant="outline"
                  className="border-red-600 text-red-400 hover:bg-red-900/20"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            </div>

            {/* Score Display */}
            <div className="grid grid-cols-3 gap-4 text-center">
              {/* AFC Score */}
              <div>
                <p className="text-gray-400 text-sm mb-2">{gameState?.afc_team}</p>
                <div className="text-6xl font-black text-white mb-4">
                  {scoreForm.afcScore}
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Button
                    onClick={() => handleScoreChange('afc', -1)}
                    size="sm"
                    variant="outline"
                    className="border-gray-600"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => handleScoreChange('afc', 1)}
                    size="sm"
                    variant="outline"
                    className="border-gray-600"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Middle */}
              <div className="flex flex-col items-center justify-center">
                <span className="text-4xl text-gray-600">-</span>
                <Button
                  onClick={() =>
                    updateGameState({
                      afc_score: scoreForm.afcScore,
                      nfc_score: scoreForm.nfcScore,
                    })
                  }
                  disabled={saving}
                  className="mt-4 bg-[#CDA33B] hover:bg-[#b8922f]"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${saving ? 'animate-spin' : ''}`} />
                  Update Score
                </Button>
              </div>

              {/* NFC Score */}
              <div>
                <p className="text-gray-400 text-sm mb-2">{gameState?.nfc_team}</p>
                <div className="text-6xl font-black text-white mb-4">
                  {scoreForm.nfcScore}
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Button
                    onClick={() => handleScoreChange('nfc', -1)}
                    size="sm"
                    variant="outline"
                    className="border-gray-600"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => handleScoreChange('nfc', 1)}
                    size="sm"
                    variant="outline"
                    className="border-gray-600"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Winning Numbers */}
            <div className="mt-6 text-center">
              <p className="text-gray-400 text-sm">
                Current Winning Numbers:{' '}
                <span className="font-bold text-[#CDA33B]">
                  {scoreForm.afcScore % 10}-{scoreForm.nfcScore % 10}
                </span>
              </p>
            </div>
          </Card>

          {/* Quick Score Buttons */}
          <Card className="p-6 bg-gray-800 border-gray-700 mb-6">
            <h3 className="text-lg font-bold text-white mb-4">Quick Score</h3>
            <div className="grid grid-cols-2 gap-4">
              {/* AFC Quick Scores */}
              <div>
                <p className="text-gray-400 text-sm mb-2">{gameState?.afc_team}</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => handleQuickScore('afc', 6, 'Touchdown')}
                    variant="outline"
                    className="border-gray-600 text-gray-300"
                  >
                    +6 TD
                  </Button>
                  <Button
                    onClick={() => handleQuickScore('afc', 1, 'Extra Point')}
                    variant="outline"
                    className="border-gray-600 text-gray-300"
                  >
                    +1 XP
                  </Button>
                  <Button
                    onClick={() => handleQuickScore('afc', 2, 'Two-Point Conversion')}
                    variant="outline"
                    className="border-gray-600 text-gray-300"
                  >
                    +2 2PT
                  </Button>
                  <Button
                    onClick={() => handleQuickScore('afc', 3, 'Field Goal')}
                    variant="outline"
                    className="border-gray-600 text-gray-300"
                  >
                    +3 FG
                  </Button>
                </div>
              </div>

              {/* NFC Quick Scores */}
              <div>
                <p className="text-gray-400 text-sm mb-2">{gameState?.nfc_team}</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => handleQuickScore('nfc', 6, 'Touchdown')}
                    variant="outline"
                    className="border-gray-600 text-gray-300"
                  >
                    +6 TD
                  </Button>
                  <Button
                    onClick={() => handleQuickScore('nfc', 1, 'Extra Point')}
                    variant="outline"
                    className="border-gray-600 text-gray-300"
                  >
                    +1 XP
                  </Button>
                  <Button
                    onClick={() => handleQuickScore('nfc', 2, 'Two-Point Conversion')}
                    variant="outline"
                    className="border-gray-600 text-gray-300"
                  >
                    +2 2PT
                  </Button>
                  <Button
                    onClick={() => handleQuickScore('nfc', 3, 'Field Goal')}
                    variant="outline"
                    className="border-gray-600 text-gray-300"
                  >
                    +3 FG
                  </Button>
                </div>
              </div>
            </div>

            {/* Safety (can go to either team) */}
            <div className="mt-4 grid grid-cols-2 gap-4">
              <Button
                onClick={() => handleQuickScore('afc', 2, 'Safety')}
                variant="outline"
                className="border-yellow-600 text-yellow-400"
              >
                Safety → AFC (+2)
              </Button>
              <Button
                onClick={() => handleQuickScore('nfc', 2, 'Safety')}
                variant="outline"
                className="border-yellow-600 text-yellow-400"
              >
                Safety → NFC (+2)
              </Button>
            </div>
          </Card>

          {/* Quarter Winners */}
          <Card className="p-6 bg-gray-800 border-gray-700 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <h3 className="text-lg font-bold text-white">Quarter Winners</h3>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((q) => {
                const winner = quarterWinners.find((w) => w.quarter === q);
                return (
                  <div
                    key={q}
                    className={`p-4 rounded-lg text-center ${
                      winner ? 'bg-green-900/30 border border-green-700' : 'bg-gray-700/50'
                    }`}
                  >
                    <p className="text-gray-400 text-sm mb-1">Q{q}</p>
                    {winner ? (
                      <>
                        <p className="font-bold text-white text-sm">
                          {(winner as any).profiles?.name || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {winner.row_score}-{winner.col_score}
                        </p>
                        {winner.prize_amount && (
                          <p className="text-green-400 text-sm font-bold">
                            ${winner.prize_amount}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-gray-500 text-sm">Pending</p>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Game Clock Control */}
          <Card className="p-6 bg-gray-800 border-gray-700">
            <h3 className="text-lg font-bold text-white mb-4">Game Clock</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-400">Quarter</Label>
                <select
                  value={scoreForm.quarter}
                  onChange={(e) =>
                    setScoreForm((prev) => ({
                      ...prev,
                      quarter: parseInt(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white mt-1"
                >
                  <option value={0}>Pre-Game</option>
                  <option value={1}>Q1</option>
                  <option value={2}>Q2</option>
                  <option value={3}>Q3</option>
                  <option value={4}>Q4</option>
                  <option value={5}>OT</option>
                </select>
              </div>
              <div>
                <Label className="text-gray-400">Time Remaining</Label>
                <Input
                  value={scoreForm.timeRemaining}
                  onChange={(e) =>
                    setScoreForm((prev) => ({
                      ...prev,
                      timeRemaining: e.target.value,
                    }))
                  }
                  placeholder="15:00"
                  className="bg-gray-700 border-gray-600 text-white mt-1"
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button
                onClick={() =>
                  updateGameState({
                    quarter: scoreForm.quarter,
                    time_remaining: scoreForm.timeRemaining,
                    is_halftime: scoreForm.quarter === 2 && scoreForm.timeRemaining === '0:00',
                  })
                }
                disabled={saving}
                className="bg-[#CDA33B] hover:bg-[#b8922f]"
              >
                Update Clock
              </Button>
              <Button
                onClick={() => updateGameState({ is_halftime: !gameState?.is_halftime })}
                variant="outline"
                className="border-gray-600 text-gray-300"
              >
                {gameState?.is_halftime ? 'End Halftime' : 'Set Halftime'}
              </Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}

