'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Play, RotateCcw, Plus, Minus, Trophy, CheckCircle2, RefreshCw,
} from 'lucide-react';
import type { GameState, QuarterWinner } from '@/lib/supabase/types';

export default function AdminLivePage() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [quarterWinners, setQuarterWinners] = useState<QuarterWinner[]>([]);

  const [scoreForm, setScoreForm] = useState({
    afcScore: 0,
    nfcScore: 0,
    quarter: 0,
    timeRemaining: '15:00',
    playDescription: '',
  });
  const [afcTeam, setAfcTeam] = useState('');
  const [nfcTeam, setNfcTeam] = useState('');

  useEffect(() => {
    loadGameState();
    loadQuarterWinners();

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
            setAfcTeam((payload.new as GameState).afc_team || '');
            setNfcTeam((payload.new as GameState).nfc_team || '');
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
      setAfcTeam(data.afc_team || '');
      setNfcTeam(data.nfc_team || '');
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
      setScoreForm((prev) => ({ ...prev, afcScore: Math.max(0, prev.afcScore + delta) }));
    } else {
      setScoreForm((prev) => ({ ...prev, nfcScore: Math.max(0, prev.nfcScore + delta) }));
    }
  };

  const handleQuickScore = async (team: 'afc' | 'nfc', points: number, type: string) => {
    const newScore = team === 'afc'
      ? { afc_score: (gameState?.afc_score || 0) + points }
      : { nfc_score: (gameState?.nfc_score || 0) + points };

    setScoreForm((prev) => ({ ...prev, playDescription: type }));
    await updateGameState(newScore);
  };

  const handleEndQuarter = async () => {
    if (!gameState) return;

    const currentQuarter = gameState.quarter;
    if (currentQuarter >= 4 && !gameState.is_final) {
      if (gameState.afc_score === gameState.nfc_score) {
        await updateGameState({ quarter: 5, time_remaining: '10:00', is_halftime: false });
        return;
      }
    }

    const afcLast = gameState.afc_score % 10;
    const nfcLast = gameState.nfc_score % 10;

    const supabase = createClient();

    const { data: winningSquare } = await supabase
      .from('grid_squares')
      .select('user_id')
      .eq('row_score', afcLast)
      .eq('col_score', nfcLast)
      .eq('status', 'paid')
      .single();

    const { data: prizeSetting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', `prize_q${currentQuarter}`)
      .single();

    await supabase.from('quarterly_winners').upsert({
      quarter: currentQuarter,
      user_id: winningSquare?.user_id || null,
      row_score: afcLast,
      col_score: nfcLast,
      prize_amount: prizeSetting?.value ? parseFloat(prizeSetting.value) : null,
    }, { onConflict: 'quarter' });

    if (currentQuarter === 2) {
      await updateGameState({ is_halftime: true, time_remaining: '0:00' });
    } else if (currentQuarter >= 4) {
      await updateGameState({ is_final: true, is_live: false, time_remaining: '0:00' });
    } else {
      await updateGameState({ quarter: currentQuarter + 1, time_remaining: '15:00', is_halftime: false });
    }

    await loadQuarterWinners();
    alert(`Q${currentQuarter} ended! Winner recorded.`);
  };

  const handleStartGame = async () => {
    await updateGameState({
      is_live: true, quarter: 1, time_remaining: '15:00', is_halftime: false, is_final: false,
    });
  };

  const handleResetGame = async () => {
    if (!confirm('Reset game to pre-game state? This will clear all scores.')) return;

    await updateGameState({
      afc_score: 0, nfc_score: 0, quarter: 0, time_remaining: '15:00',
      is_live: false, is_halftime: false, is_final: false,
      possession: null, down: null, yards_to_go: null, yard_line: null, last_play: null,
    });

    const supabase = createClient();
    await supabase.from('quarterly_winners').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('score_history').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    await loadQuarterWinners();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-3 border-[#cda33b] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Live Game Control</h1>
        <p className="text-white/60">Manage scores during the Super Bowl</p>
      </div>

      {/* Team Names */}
      <Card className="p-6 bg-white/5 border-white/10 mb-6">
        <h3 className="text-lg font-bold text-white mb-4">Team Names</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <Label className="text-white/80 mb-2 block">AFC Team (Row Headers)</Label>
            <div className="flex gap-2">
              <Input
                value={afcTeam}
                onChange={(e) => setAfcTeam(e.target.value)}
                placeholder="e.g. Chiefs"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>
          <div>
            <Label className="text-white/80 mb-2 block">NFC Team (Column Headers)</Label>
            <div className="flex gap-2">
              <Input
                value={nfcTeam}
                onChange={(e) => setNfcTeam(e.target.value)}
                placeholder="e.g. Eagles"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>
        </div>
        <Button
          onClick={() => updateGameState({ afc_team: afcTeam, nfc_team: nfcTeam })}
          disabled={saving}
          className="mt-4 bg-[#cda33b] hover:bg-[#b8922f]"
        >
          Save Team Names
        </Button>
      </Card>

      {/* Game Status */}
      <Card className="p-6 bg-white/5 border-white/10 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {gameState?.is_live ? (
              <>
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <span className="text-red-400 font-bold">LIVE</span>
              </>
            ) : gameState?.is_final ? (
              <span className="text-white/60 font-bold">FINAL</span>
            ) : (
              <span className="text-white/60 font-bold">PRE-GAME</span>
            )}
            <span className="text-white/30">|</span>
            <span className="text-white/60">Q{gameState?.quarter || 0} • {gameState?.time_remaining || '15:00'}</span>
          </div>

          <div className="flex items-center gap-2">
            {!gameState?.is_live && !gameState?.is_final && (
              <Button onClick={handleStartGame} className="bg-green-600 hover:bg-green-700">
                <Play className="w-4 h-4 mr-2" />
                Start
              </Button>
            )}
            {gameState?.is_live && (
              <Button onClick={handleEndQuarter} className="bg-yellow-600 hover:bg-yellow-700">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                End Q{gameState.quarter}
              </Button>
            )}
            <Button onClick={handleResetGame} variant="outline" className="border-red-600/50 text-red-400 hover:bg-red-500/10">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>

        {/* Score Display */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-white/60 text-sm mb-2">{gameState?.afc_team || 'AFC'}</p>
            <div className="text-5xl font-black text-white mb-4">{scoreForm.afcScore}</div>
            <div className="flex items-center justify-center gap-2">
              <Button onClick={() => handleScoreChange('afc', -1)} size="sm" variant="outline" className="border-white/20 text-white">
                <Minus className="w-4 h-4" />
              </Button>
              <Button onClick={() => handleScoreChange('afc', 1)} size="sm" variant="outline" className="border-white/20 text-white">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center">
            <span className="text-3xl text-white/30">-</span>
            <Button
              onClick={() => updateGameState({ afc_score: scoreForm.afcScore, nfc_score: scoreForm.nfcScore })}
              disabled={saving}
              className="mt-4 bg-[#cda33b] hover:bg-[#b8922f]"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${saving ? 'animate-spin' : ''}`} />
              Update
            </Button>
          </div>

          <div>
            <p className="text-white/60 text-sm mb-2">{gameState?.nfc_team || 'NFC'}</p>
            <div className="text-5xl font-black text-white mb-4">{scoreForm.nfcScore}</div>
            <div className="flex items-center justify-center gap-2">
              <Button onClick={() => handleScoreChange('nfc', -1)} size="sm" variant="outline" className="border-white/20 text-white">
                <Minus className="w-4 h-4" />
              </Button>
              <Button onClick={() => handleScoreChange('nfc', 1)} size="sm" variant="outline" className="border-white/20 text-white">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-white/50 text-sm">
            Winning Numbers: <span className="font-bold text-[#cda33b]">{scoreForm.afcScore % 10}-{scoreForm.nfcScore % 10}</span>
          </p>
        </div>
      </Card>

      {/* Quick Score */}
      <Card className="p-6 bg-white/5 border-white/10 mb-6">
        <h3 className="text-lg font-bold text-white mb-4">Quick Score</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-white/60 text-sm mb-3">{gameState?.afc_team || 'AFC'}</p>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={() => handleQuickScore('afc', 6, 'TD')} variant="outline" className="border-white/20 text-white">+6 TD</Button>
              <Button onClick={() => handleQuickScore('afc', 1, 'XP')} variant="outline" className="border-white/20 text-white">+1 XP</Button>
              <Button onClick={() => handleQuickScore('afc', 2, '2PT')} variant="outline" className="border-white/20 text-white">+2 2PT</Button>
              <Button onClick={() => handleQuickScore('afc', 3, 'FG')} variant="outline" className="border-white/20 text-white">+3 FG</Button>
            </div>
          </div>
          <div>
            <p className="text-white/60 text-sm mb-3">{gameState?.nfc_team || 'NFC'}</p>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={() => handleQuickScore('nfc', 6, 'TD')} variant="outline" className="border-white/20 text-white">+6 TD</Button>
              <Button onClick={() => handleQuickScore('nfc', 1, 'XP')} variant="outline" className="border-white/20 text-white">+1 XP</Button>
              <Button onClick={() => handleQuickScore('nfc', 2, '2PT')} variant="outline" className="border-white/20 text-white">+2 2PT</Button>
              <Button onClick={() => handleQuickScore('nfc', 3, 'FG')} variant="outline" className="border-white/20 text-white">+3 FG</Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Quarter Winners */}
      <Card className="p-6 bg-white/5 border-white/10">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <h3 className="text-lg font-bold text-white">Quarter Winners</h3>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((q) => {
            const winner = quarterWinners.find((w) => w.quarter === q);
            return (
              <div
                key={q}
                className={`p-4 rounded-lg text-center ${winner ? 'bg-green-500/10 border border-green-500/30' : 'bg-white/5'}`}
              >
                <p className="text-white/50 text-xs mb-1">Q{q}</p>
                {winner ? (
                  <>
                    <p className="font-bold text-white text-sm truncate">{(winner as any).profiles?.name || '—'}</p>
                    <p className="text-xs text-white/50">{winner.row_score}-{winner.col_score}</p>
                    {winner.prize_amount && <p className="text-green-400 text-sm font-bold">${winner.prize_amount}</p>}
                  </>
                ) : (
                  <p className="text-white/30 text-sm">—</p>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
