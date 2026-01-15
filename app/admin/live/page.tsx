'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trophy, Save, RotateCcw, CheckCircle2 } from 'lucide-react';
import type { QuarterWinner } from '@/lib/supabase/types';

interface QuarterScore {
  afcScore: string;
  nfcScore: string;
}

export default function AdminLivePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [quarterWinners, setQuarterWinners] = useState<QuarterWinner[]>([]);

  const [afcTeam, setAfcTeam] = useState('');
  const [nfcTeam, setNfcTeam] = useState('');

  const [quarterScores, setQuarterScores] = useState<Record<number, QuarterScore>>({
    1: { afcScore: '', nfcScore: '' },
    2: { afcScore: '', nfcScore: '' },
    3: { afcScore: '', nfcScore: '' },
    4: { afcScore: '', nfcScore: '' },
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const supabase = createClient();

      // Load game state for team names
      const { data: gameState } = await supabase
        .from('game_state')
        .select('*')
        .single();

      if (gameState) {
        setAfcTeam(gameState.afc_team || '');
        setNfcTeam(gameState.nfc_team || '');
      }

      // Load quarter winners
      const { data: winners } = await supabase
        .from('quarterly_winners')
        .select(`*, profiles:user_id(name)`)
        .order('quarter');

      if (winners) {
        setQuarterWinners(winners);

        // Populate quarter scores from winners
        const scores: Record<number, QuarterScore> = {
          1: { afcScore: '', nfcScore: '' },
          2: { afcScore: '', nfcScore: '' },
          3: { afcScore: '', nfcScore: '' },
          4: { afcScore: '', nfcScore: '' },
        };

        winners.forEach((w) => {
          if (w.afc_final_score !== null && w.nfc_final_score !== null) {
            scores[w.quarter] = {
              afcScore: w.afc_final_score.toString(),
              nfcScore: w.nfc_final_score.toString(),
            };
          }
        });

        setQuarterScores(scores);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (quarter: number, team: 'afc' | 'nfc', value: string) => {
    // Only allow numbers
    if (value !== '' && !/^\d+$/.test(value)) return;

    setQuarterScores((prev) => ({
      ...prev,
      [quarter]: {
        ...prev[quarter],
        [team === 'afc' ? 'afcScore' : 'nfcScore']: value,
      },
    }));
  };

  const saveTeamNames = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      await supabase
        .from('game_state')
        .update({
          afc_team: afcTeam,
          nfc_team: nfcTeam,
          updated_at: new Date().toISOString(),
        })
        .not('id', 'is', null);

      alert('Team names saved!');
    } catch (error) {
      console.error('Error saving team names:', error);
      alert('Error saving team names');
    } finally {
      setSaving(false);
    }
  };

  const saveQuarterScore = async (quarter: number) => {
    const scores = quarterScores[quarter];

    if (!scores.afcScore || !scores.nfcScore) {
      alert('Please enter both scores');
      return;
    }

    const afcScore = parseInt(scores.afcScore);
    const nfcScore = parseInt(scores.nfcScore);

    if (isNaN(afcScore) || isNaN(nfcScore)) {
      alert('Invalid scores');
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();

      // Calculate winning digits (last digit of each score)
      const afcLast = afcScore % 10;
      const nfcLast = nfcScore % 10;

      // Find the winning square
      const { data: winningSquare } = await supabase
        .from('grid_squares')
        .select('user_id')
        .eq('row_score', afcLast)
        .eq('col_score', nfcLast)
        .eq('status', 'paid')
        .single();

      // Get prize amount for this quarter
      const { data: prizeSetting } = await supabase
        .from('settings')
        .select('value')
        .eq('key', `payout_q${quarter}`)
        .single();

      const prizeAmount = prizeSetting?.value ? parseFloat(prizeSetting.value) : null;

      // Save or update the quarter winner
      await supabase.from('quarterly_winners').upsert({
        quarter,
        user_id: winningSquare?.user_id || null,
        row_score: afcLast,
        col_score: nfcLast,
        afc_final_score: afcScore,
        nfc_final_score: nfcScore,
        prize_amount: prizeAmount,
      }, { onConflict: 'quarter' });

      // Update game_state with latest scores
      const updateData: Record<string, unknown> = {
        afc_score: afcScore,
        nfc_score: nfcScore,
        updated_at: new Date().toISOString(),
      };

      if (quarter === 4) {
        updateData.is_final = true;
        updateData.is_live = false;
      }

      await supabase
        .from('game_state')
        .update(updateData)
        .not('id', 'is', null);

      await loadData();
      alert(`Q${quarter} score saved!`);
    } catch (error) {
      console.error('Error saving quarter score:', error);
      alert('Error saving score');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset all scores and winners? This cannot be undone.')) return;

    setSaving(true);
    try {
      const supabase = createClient();

      // Clear quarterly winners
      await supabase.from('quarterly_winners').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      // Reset game state
      await supabase
        .from('game_state')
        .update({
          afc_score: 0,
          nfc_score: 0,
          quarter: 0,
          is_live: false,
          is_halftime: false,
          is_final: false,
          updated_at: new Date().toISOString(),
        })
        .not('id', 'is', null);

      // Clear local state
      setQuarterScores({
        1: { afcScore: '', nfcScore: '' },
        2: { afcScore: '', nfcScore: '' },
        3: { afcScore: '', nfcScore: '' },
        4: { afcScore: '', nfcScore: '' },
      });

      await loadData();
      alert('All scores reset!');
    } catch (error) {
      console.error('Error resetting:', error);
      alert('Error resetting scores');
    } finally {
      setSaving(false);
    }
  };

  const getQuarterLabel = (quarter: number) => {
    switch (quarter) {
      case 1: return 'Q1 (End of 1st Quarter)';
      case 2: return 'Q2 (Halftime)';
      case 3: return 'Q3 (End of 3rd Quarter)';
      case 4: return 'Q4 (Final Score)';
      default: return `Q${quarter}`;
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
    <div className="p-6 lg:p-8 max-w-3xl">
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Game Scoring</h1>
        <p className="text-white/60">Enter final scores for each quarter to determine winners</p>
      </div>

      {/* Team Names */}
      <Card className="p-6 bg-white/5 border-white/10 mb-6">
        <h3 className="text-lg font-bold text-white mb-4">Team Names</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <Label className="text-white/80 mb-2 block">AFC Team</Label>
            <Input
              value={afcTeam}
              onChange={(e) => setAfcTeam(e.target.value)}
              placeholder="e.g. Chiefs"
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
          <div>
            <Label className="text-white/80 mb-2 block">NFC Team</Label>
            <Input
              value={nfcTeam}
              onChange={(e) => setNfcTeam(e.target.value)}
              placeholder="e.g. Eagles"
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
        </div>
        <Button
          onClick={saveTeamNames}
          disabled={saving}
          className="mt-4 bg-[#cda33b] hover:bg-[#b8922f]"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Team Names
        </Button>
      </Card>

      {/* Quarter Scores */}
      <Card className="p-6 bg-white/5 border-white/10 mb-6">
        <h3 className="text-lg font-bold text-white mb-6">Quarter Scores</h3>

        <div className="space-y-6">
          {[1, 2, 3, 4].map((quarter) => {
            const winner = quarterWinners.find((w) => w.quarter === quarter);
            const scores = quarterScores[quarter];
            const hasScore = scores.afcScore && scores.nfcScore;

            return (
              <div key={quarter} className="p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-white">{getQuarterLabel(quarter)}</h4>
                  {winner && (
                    <span className="flex items-center gap-1 text-green-400 text-sm">
                      <CheckCircle2 className="w-4 h-4" />
                      Winner: {(winner as any).profiles?.name || 'No winner'}
                    </span>
                  )}
                </div>

                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <Label className="text-white/60 text-sm mb-1 block">
                      {afcTeam || 'AFC'}
                    </Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={scores.afcScore}
                      onChange={(e) => handleScoreChange(quarter, 'afc', e.target.value)}
                      placeholder="0"
                      className="bg-white/10 border-white/20 text-white text-center text-xl font-bold"
                    />
                  </div>

                  <div className="pb-2 text-white/30 text-2xl font-bold">-</div>

                  <div className="flex-1">
                    <Label className="text-white/60 text-sm mb-1 block">
                      {nfcTeam || 'NFC'}
                    </Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={scores.nfcScore}
                      onChange={(e) => handleScoreChange(quarter, 'nfc', e.target.value)}
                      placeholder="0"
                      className="bg-white/10 border-white/20 text-white text-center text-xl font-bold"
                    />
                  </div>

                  <Button
                    onClick={() => saveQuarterScore(quarter)}
                    disabled={saving || !hasScore}
                    className="bg-[#cda33b] hover:bg-[#b8922f] disabled:opacity-50"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </div>

                {hasScore && (
                  <div className="mt-3 text-sm text-white/50">
                    Winning numbers: <span className="text-[#cda33b] font-bold">{parseInt(scores.afcScore) % 10}-{parseInt(scores.nfcScore) % 10}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Winners Summary */}
      {quarterWinners.length > 0 && (
        <Card className="p-6 bg-white/5 border-white/10 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <h3 className="text-lg font-bold text-white">Winners</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
      )}

      {/* Reset Button */}
      <div className="text-center">
        <Button
          onClick={handleReset}
          variant="outline"
          className="border-red-600/50 text-red-400 hover:bg-red-500/10"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset All Scores
        </Button>
      </div>
    </div>
  );
}
