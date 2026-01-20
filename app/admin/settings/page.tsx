'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Power, DollarSign, Trophy, Users, Loader2, ToggleLeft, ToggleRight } from 'lucide-react';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({
    pool_active: 'true',
    square_price: '50',
    payout_q1: '1000',
    payout_q2: '1000',
    payout_q3: '1000',
    payout_q4: '2000',
    afc_team: '',
    nfc_team: '',
    show_team_names: 'false',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const supabase = createClient();

      // Load settings
      const { data, error } = await supabase
        .from('settings')
        .select('key, value');

      if (error) throw error;

      if (data) {
        const settingsObj: Record<string, string> = {};
        data.forEach((item) => {
          settingsObj[item.key] = item.value;
        });
        setSettings((prev) => ({ ...prev, ...settingsObj }));
      }

      // Also load team names from game_state
      const { data: gameState } = await supabase
        .from('game_state')
        .select('afc_team, nfc_team')
        .single();

      if (gameState) {
        setSettings((prev) => ({
          ...prev,
          afc_team: gameState.afc_team || '',
          nfc_team: gameState.nfc_team || '',
        }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const supabase = createClient();

      // Save all settings (including team names)
      const promises = Object.entries(settings).map(async ([key, value]) => {
        const { error } = await supabase
          .from('settings')
          .upsert(
            { key, value, updated_at: new Date().toISOString() },
            { onConflict: 'key' }
          );

        if (error) throw error;
      });

      await Promise.all(promises);

      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  // Calculate totals
  const squarePrice = parseFloat(settings.square_price || '50');
  const totalRevenue = squarePrice * 100;
  const q1 = parseFloat(settings.payout_q1 || '0');
  const q2 = parseFloat(settings.payout_q2 || '0');
  const q3 = parseFloat(settings.payout_q3 || '0');
  const q4 = parseFloat(settings.payout_q4 || '0');
  const totalPayout = q1 + q2 + q3 + q4;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-3 border-[#cda33b] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 lg:p-8 max-w-3xl">
      {/* Page Title */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-white">Settings</h1>
        <p className="text-xs sm:text-base text-white/60">Configure your Super Bowl pool</p>
      </div>

      {/* Pool Status */}
      <Card className={`p-3 sm:p-6 mb-4 sm:mb-6 ${settings.pool_active === 'true' ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex items-start sm:items-center gap-2 sm:gap-4 min-w-0">
            <div className={`p-2 sm:p-3 rounded-xl flex-shrink-0 ${settings.pool_active === 'true' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
              <Power className={`w-5 h-5 sm:w-6 sm:h-6 ${settings.pool_active === 'true' ? 'text-green-400' : 'text-red-400'}`} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-white">
                {settings.pool_active === 'true' ? 'OPEN' : 'CLOSED'}
              </h2>
              <p className="text-xs sm:text-sm text-white/60">
                {settings.pool_active === 'true'
                  ? 'Users can purchase'
                  : 'No purchases allowed'}
              </p>
            </div>
          </div>
          <Button
            onClick={() => setSettings({ ...settings, pool_active: settings.pool_active === 'true' ? 'false' : 'true' })}
            className={`w-full sm:w-auto text-sm ${settings.pool_active === 'true' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
          >
            {settings.pool_active === 'true' ? 'Close' : 'Open'}
          </Button>
        </div>
      </Card>

      {/* Team Names */}
      <Card className="p-3 sm:p-6 mb-4 sm:mb-6 bg-white/5 border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20 flex-shrink-0">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white">Team Names</h2>
          </div>

          {/* Toggle */}
          <button
            onClick={() => setSettings({ ...settings, show_team_names: settings.show_team_names === 'true' ? 'false' : 'true' })}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1 sm:py-2 rounded-lg transition-colors hover:bg-white/10"
          >
            <span className={`text-xs sm:text-sm font-medium ${settings.show_team_names === 'true' ? 'text-green-400' : 'text-white/60'}`}>
              {settings.show_team_names === 'true' ? 'On' : 'Off'}
            </span>
            {settings.show_team_names === 'true' ? (
              <ToggleRight className="w-6 h-6 sm:w-8 sm:h-8 text-green-400" />
            ) : (
              <ToggleLeft className="w-6 h-6 sm:w-8 sm:h-8 text-white/40" />
            )}
          </button>
        </div>

        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 ${settings.show_team_names === 'false' ? 'opacity-50' : ''}`}>
          <div className="space-y-2">
            <Label className="text-white/80">AFC Team (Rows)</Label>
            <Input
              type="text"
              placeholder="e.g. Chiefs"
              value={settings.afc_team}
              onChange={(e) => setSettings({ ...settings, afc_team: e.target.value })}
              disabled={settings.show_team_names === 'false'}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 disabled:cursor-not-allowed"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-white/80">NFC Team (Columns)</Label>
            <Input
              type="text"
              placeholder="e.g. Eagles"
              value={settings.nfc_team}
              onChange={(e) => setSettings({ ...settings, nfc_team: e.target.value })}
              disabled={settings.show_team_names === 'false'}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 disabled:cursor-not-allowed"
            />
          </div>
        </div>
        <p className="text-xs text-white/50 mt-3">
          {settings.show_team_names === 'true'
            ? 'Team names will appear on the grid instead of AFC/NFC'
            : 'Toggle on to display custom team names on the grid'}
        </p>
      </Card>

      {/* Pricing */}
      <Card className="p-3 sm:p-6 mb-4 sm:mb-6 bg-white/5 border-white/10">
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <div className="p-2 rounded-lg bg-[#cda33b]/20 flex-shrink-0">
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-[#cda33b]" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-white">Pricing</h2>
        </div>

        <div className="space-y-2">
          <Label className="text-xs sm:text-sm text-white/80">Price per Square ($)</Label>
          <Input
            type="number"
            value={settings.square_price}
            onChange={(e) => setSettings({ ...settings, square_price: e.target.value })}
            className="bg-white/5 border-white/10 text-white max-w-xs text-sm"
          />
          <p className="text-xs text-white/50">
            Total pot: <span className="text-[#cda33b] font-semibold">${totalRevenue.toLocaleString()}</span>
          </p>
        </div>
      </Card>

      {/* Payouts */}
      <Card className="p-3 sm:p-6 mb-4 sm:mb-6 bg-white/5 border-white/10">
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <div className="p-2 rounded-lg bg-green-500/20 flex-shrink-0">
            <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-white">Quarter Payouts</h2>
        </div>

        <p className="text-xs sm:text-sm text-white/60 mb-4 sm:mb-6">
          Set the dollar amount for each quarter winner.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm text-white/80">Q1</Label>
            <Input
              type="number"
              min="0"
              value={settings.payout_q1}
              onChange={(e) => setSettings({ ...settings, payout_q1: e.target.value })}
              className="bg-white/5 border-white/10 text-white text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm text-white/80">Q2 / Halftime</Label>
            <Input
              type="number"
              min="0"
              value={settings.payout_q2}
              onChange={(e) => setSettings({ ...settings, payout_q2: e.target.value })}
              className="bg-white/5 border-white/10 text-white text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm text-white/80">Q3</Label>
            <Input
              type="number"
              min="0"
              value={settings.payout_q3}
              onChange={(e) => setSettings({ ...settings, payout_q3: e.target.value })}
              className="bg-white/5 border-white/10 text-white text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm text-white/80">Q4 / Final</Label>
            <Input
              type="number"
              min="0"
              value={settings.payout_q4}
              onChange={(e) => setSettings({ ...settings, payout_q4: e.target.value })}
              className="bg-white/5 border-white/10 text-white text-sm"
            />
          </div>
        </div>

        {/* Summary */}
        <div className="p-3 sm:p-4 bg-[#cda33b]/10 border border-[#cda33b]/20 rounded-lg">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-xs sm:text-sm font-semibold text-[#cda33b]">Summary</span>
          </div>
          <div className="grid grid-cols-4 gap-1 sm:gap-2 mb-2 sm:mb-3">
            <div className="text-center p-2 bg-white/5 rounded">
              <p className="text-xs text-white/60">Q1</p>
              <p className="text-xs sm:text-sm font-bold text-white">${q1.toLocaleString()}</p>
            </div>
            <div className="text-center p-2 bg-white/5 rounded">
              <p className="text-xs text-white/60">Q2</p>
              <p className="text-xs sm:text-sm font-bold text-white">${q2.toLocaleString()}</p>
            </div>
            <div className="text-center p-2 bg-white/5 rounded">
              <p className="text-xs text-white/60">Q3</p>
              <p className="text-xs sm:text-sm font-bold text-white">${q3.toLocaleString()}</p>
            </div>
            <div className="text-center p-2 bg-white/5 rounded">
              <p className="text-xs text-white/60">Q4</p>
              <p className="text-xs sm:text-sm font-bold text-white">${q4.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-white/60">Total:</span>
            <span className="font-bold text-white">${totalPayout.toLocaleString()}</span>
          </div>
          {totalPayout > totalRevenue && (
            <p className="text-amber-400 text-xs mt-2">
              ⚠️ Exceeds pot by ${(totalPayout - totalRevenue).toLocaleString()}
            </p>
          )}
        </div>
      </Card>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-[#cda33b] hover:bg-[#b8922f] text-white text-sm sm:text-base"
        size="lg"
      >
        {saving ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="w-4 h-4 mr-2" />
            Save
          </>
        )}
      </Button>
    </div>
  );
}
