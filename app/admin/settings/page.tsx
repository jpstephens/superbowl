'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Power, AlertTriangle, DollarSign, Calendar, Loader2 } from 'lucide-react';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({
    pool_active: 'true',
    square_price: '50',
    payout_percent_q1: '20',
    payout_percent_q2: '20',
    payout_percent_q3: '20',
    payout_percent_q4: '40',
    game_date: '2025-02-09T18:30:00-05:00',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const supabase = createClient();
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

  // Calculate prize preview
  const squarePrice = parseFloat(settings.square_price || '50');
  const totalRevenue = squarePrice * 100;
  const q1 = parseFloat(settings.payout_percent_q1 || '0');
  const q2 = parseFloat(settings.payout_percent_q2 || '0');
  const q3 = parseFloat(settings.payout_percent_q3 || '0');
  const q4 = parseFloat(settings.payout_percent_q4 || '0');
  const totalPercent = q1 + q2 + q3 + q4;

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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-white/60">Configure your Super Bowl pool</p>
      </div>

      {/* Pool Status - Most Important */}
      <Card className={`p-6 mb-6 ${settings.pool_active === 'true' ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${settings.pool_active === 'true' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
              <Power className={`w-6 h-6 ${settings.pool_active === 'true' ? 'text-green-400' : 'text-red-400'}`} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Pool Status: {settings.pool_active === 'true' ? 'OPEN' : 'CLOSED'}
              </h2>
              <p className="text-sm text-white/60">
                {settings.pool_active === 'true'
                  ? 'Users can purchase squares'
                  : 'Pool is closed - no purchases allowed'}
              </p>
            </div>
          </div>
          <Button
            onClick={() => setSettings({ ...settings, pool_active: settings.pool_active === 'true' ? 'false' : 'true' })}
            className={settings.pool_active === 'true' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
          >
            {settings.pool_active === 'true' ? 'Close Pool' : 'Open Pool'}
          </Button>
        </div>
      </Card>

      {/* Pricing */}
      <Card className="p-6 mb-6 bg-white/5 border-white/10">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-[#cda33b]/20">
            <DollarSign className="w-5 h-5 text-[#cda33b]" />
          </div>
          <h2 className="text-lg font-bold text-white">Pricing</h2>
        </div>

        <div className="space-y-2">
          <Label className="text-white/80">Price per Square ($)</Label>
          <Input
            type="number"
            value={settings.square_price}
            onChange={(e) => setSettings({ ...settings, square_price: e.target.value })}
            className="bg-white/5 border-white/10 text-white"
          />
        </div>
      </Card>

      {/* Payout Percentages */}
      <Card className="p-6 mb-6 bg-white/5 border-white/10">
        <h2 className="text-lg font-bold text-white mb-2">Payout Percentages</h2>
        <p className="text-sm text-white/60 mb-6">
          Configure what percentage of the pot goes to each quarter winner.
        </p>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
            <Label className="text-white/80">Q1 (%)</Label>
            <Input
              type="number"
              min="0"
              max="100"
              value={settings.payout_percent_q1}
              onChange={(e) => setSettings({ ...settings, payout_percent_q1: e.target.value })}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-white/80">Q2 (%)</Label>
            <Input
              type="number"
              min="0"
              max="100"
              value={settings.payout_percent_q2}
              onChange={(e) => setSettings({ ...settings, payout_percent_q2: e.target.value })}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-white/80">Q3 (%)</Label>
            <Input
              type="number"
              min="0"
              max="100"
              value={settings.payout_percent_q3}
              onChange={(e) => setSettings({ ...settings, payout_percent_q3: e.target.value })}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-white/80">Q4 / Final (%)</Label>
            <Input
              type="number"
              min="0"
              max="100"
              value={settings.payout_percent_q4}
              onChange={(e) => setSettings({ ...settings, payout_percent_q4: e.target.value })}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
        </div>

        {/* Preview */}
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-sm font-semibold text-blue-300 mb-3">Prize Preview</p>
          <div className="text-sm text-blue-200 space-y-1">
            <p>Total Pot: <span className="font-bold">${totalRevenue.toLocaleString()}</span></p>
            <div className="grid grid-cols-4 gap-2 mt-2">
              <div className="text-center p-2 bg-blue-500/10 rounded">
                <p className="text-xs text-blue-300">Q1</p>
                <p className="font-bold">${(totalRevenue * q1 / 100).toFixed(0)}</p>
              </div>
              <div className="text-center p-2 bg-blue-500/10 rounded">
                <p className="text-xs text-blue-300">Q2</p>
                <p className="font-bold">${(totalRevenue * q2 / 100).toFixed(0)}</p>
              </div>
              <div className="text-center p-2 bg-blue-500/10 rounded">
                <p className="text-xs text-blue-300">Q3</p>
                <p className="font-bold">${(totalRevenue * q3 / 100).toFixed(0)}</p>
              </div>
              <div className="text-center p-2 bg-blue-500/10 rounded">
                <p className="text-xs text-blue-300">Final</p>
                <p className="font-bold">${(totalRevenue * q4 / 100).toFixed(0)}</p>
              </div>
            </div>
            <p className={`mt-2 ${totalPercent === 100 ? 'text-green-400' : 'text-amber-400'}`}>
              Total: {totalPercent}% {totalPercent === 100 ? '✓' : totalPercent > 100 ? '(Over 100%)' : '(Under 100%)'}
            </p>
          </div>
        </div>
      </Card>

      {/* Game Date */}
      <Card className="p-6 mb-6 bg-white/5 border-white/10">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-purple-500/20">
            <Calendar className="w-5 h-5 text-purple-400" />
          </div>
          <h2 className="text-lg font-bold text-white">Game Date</h2>
        </div>

        <div className="space-y-2">
          <Label className="text-white/80">Game Date & Time</Label>
          <Input
            type="datetime-local"
            value={settings.game_date ? (() => {
              try {
                const date = new Date(settings.game_date);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                return `${year}-${month}-${day}T${hours}:${minutes}`;
              } catch {
                return '';
              }
            })() : ''}
            onChange={(e) => {
              if (e.target.value) {
                const date = new Date(e.target.value);
                setSettings({ ...settings, game_date: date.toISOString() });
              }
            }}
            className="bg-white/5 border-white/10 text-white"
          />
          <p className="text-xs text-white/50">
            This sets the countdown timer on the homepage
          </p>
        </div>
      </Card>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-[#cda33b] hover:bg-[#b8922f] text-white"
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
            Save Settings
          </>
        )}
      </Button>
    </div>
  );
}
