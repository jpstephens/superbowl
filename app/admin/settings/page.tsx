'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Power, AlertTriangle } from 'lucide-react';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({
    pool_active: 'true',
    square_price: '50',
    prize_q1: '250',
    prize_q2: '250',
    prize_q3: '250',
    prize_q4: '250',
    payout_percent_q1: '20',
    payout_percent_q2: '20',
    payout_percent_q3: '20',
    payout_percent_q4: '40',
    charity_percentage: '0',
    venmo_username: '@username',
    venmo_memo: 'Super Bowl Pool',
    game_date: '2025-02-09T18:30:00-05:00',
    game_id: '',
    use_mock_data: 'true',
    logo_url: '/logo.png',
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
        setSettings(settingsObj);
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

      // Update each setting one by one
      const promises = Object.entries(settings).map(async ([key, value]) => {
        const { error } = await supabase
          .from('settings')
          .upsert(
            { key, value, updated_at: new Date().toISOString() },
            { onConflict: 'key' }
          );
        
        if (error) {
          console.error(`Error updating ${key}:`, error);
          throw error;
        }
      });

      await Promise.all(promises);

      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert(`Error saving settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>

        {/* Pool Status Toggle - Most Important Control */}
        <Card className={`p-6 mb-6 border-2 ${settings.pool_active === 'true' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${settings.pool_active === 'true' ? 'bg-green-500' : 'bg-red-500'}`}>
                <Power className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">
                  Pool Status: {settings.pool_active === 'true' ? 'ACTIVE' : 'CLOSED'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {settings.pool_active === 'true'
                    ? 'Users can view and purchase squares'
                    : 'Pool is closed - no purchases allowed'}
                </p>
              </div>
            </div>
            <Button
              variant={settings.pool_active === 'true' ? 'destructive' : 'default'}
              onClick={() => setSettings({ ...settings, pool_active: settings.pool_active === 'true' ? 'false' : 'true' })}
              className="min-w-[140px]"
            >
              {settings.pool_active === 'true' ? (
                <>
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Close Pool
                </>
              ) : (
                <>
                  <Power className="w-4 h-4 mr-2" />
                  Open Pool
                </>
              )}
            </Button>
          </div>
          {settings.pool_active !== 'true' && (
            <div className="mt-4 p-3 bg-red-100 rounded-lg border border-red-200">
              <p className="text-sm text-red-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Pool is currently closed. Users will see a "Pool Closed" message and cannot make purchases.
              </p>
            </div>
          )}
        </Card>

        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-6">Pricing</h2>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="square_price">Price per Square ($)</Label>
              <Input
                id="square_price"
                type="number"
                value={settings.square_price}
                onChange={(e) => setSettings({ ...settings, square_price: e.target.value })}
              />
            </div>
          </div>
        </Card>

        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-2">Payout Percentages (Recommended)</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Configure payout percentages that calculate automatically from total revenue. 
            Percentages should total 100% (excluding charity percentage). 
            If percentages are set, they will be used instead of fixed prize amounts.
          </p>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="payout_percent_q1">Q1 Payout (%)</Label>
              <Input
                id="payout_percent_q1"
                type="number"
                min="0"
                max="100"
                value={settings.payout_percent_q1 || '20'}
                onChange={(e) => setSettings({ ...settings, payout_percent_q1: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payout_percent_q2">Q2 Payout (%)</Label>
              <Input
                id="payout_percent_q2"
                type="number"
                min="0"
                max="100"
                value={settings.payout_percent_q2 || '20'}
                onChange={(e) => setSettings({ ...settings, payout_percent_q2: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payout_percent_q3">Q3 Payout (%)</Label>
              <Input
                id="payout_percent_q3"
                type="number"
                min="0"
                max="100"
                value={settings.payout_percent_q3 || '20'}
                onChange={(e) => setSettings({ ...settings, payout_percent_q3: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payout_percent_q4">Q4 Payout (%)</Label>
              <Input
                id="payout_percent_q4"
                type="number"
                min="0"
                max="100"
                value={settings.payout_percent_q4 || '40'}
                onChange={(e) => setSettings({ ...settings, payout_percent_q4: e.target.value })}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="charity_percentage">Charity Percentage (%)</Label>
            <Input
              id="charity_percentage"
              type="number"
              min="0"
              max="100"
              value={settings.charity_percentage || '0'}
              onChange={(e) => setSettings({ ...settings, charity_percentage: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Percentage of total revenue to retain for charity (deducted before calculating prizes)
            </p>
          </div>
          
          {(() => {
            const q1 = parseFloat(settings.payout_percent_q1 || '0');
            const q2 = parseFloat(settings.payout_percent_q2 || '0');
            const q3 = parseFloat(settings.payout_percent_q3 || '0');
            const q4 = parseFloat(settings.payout_percent_q4 || '0');
            const charity = parseFloat(settings.charity_percentage || '0');
            const total = q1 + q2 + q3 + q4 + charity;
            const squarePrice = parseFloat(settings.square_price || '50');
            const totalRevenue = squarePrice * 100;
            
            return (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-semibold text-blue-900 mb-2">Calculation Preview:</p>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>Total Revenue: ${totalRevenue.toFixed(2)} (${squarePrice} × 100 squares)</p>
                  <p>Charity Amount: ${(totalRevenue * charity / 100).toFixed(2)} ({charity}%)</p>
                  <p>Prize Pool: ${(totalRevenue * (100 - charity) / 100).toFixed(2)}</p>
                  <div className="mt-2 pt-2 border-t border-blue-300">
                    <p className="font-semibold">Quarter Prizes:</p>
                    <p>Q1: ${(totalRevenue * (100 - charity) / 100 * q1 / 100).toFixed(2)} ({q1}%)</p>
                    <p>Q2: ${(totalRevenue * (100 - charity) / 100 * q2 / 100).toFixed(2)} ({q2}%)</p>
                    <p>Q3: ${(totalRevenue * (100 - charity) / 100 * q3 / 100).toFixed(2)} ({q3}%)</p>
                    <p>Q4: ${(totalRevenue * (100 - charity) / 100 * q4 / 100).toFixed(2)} ({q4}%)</p>
                  </div>
                  <p className={`mt-2 font-semibold ${total === 100 ? 'text-green-700' : total > 100 ? 'text-red-700' : 'text-orange-700'}`}>
                    Total: {total.toFixed(1)}% {total === 100 ? '✓' : total > 100 ? '(Over 100%)' : '(Under 100%)'}
                  </p>
                </div>
              </div>
            );
          })()}
        </Card>

        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-2">Fixed Prize Amounts (Fallback)</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Fixed dollar amounts used if payout percentages are not set. 
            These are kept for backward compatibility.
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prize_q1">Q1 Prize ($)</Label>
              <Input
                id="prize_q1"
                type="number"
                value={settings.prize_q1}
                onChange={(e) => setSettings({ ...settings, prize_q1: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prize_q2">Q2 Prize ($)</Label>
              <Input
                id="prize_q2"
                type="number"
                value={settings.prize_q2}
                onChange={(e) => setSettings({ ...settings, prize_q2: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prize_q3">Q3 Prize ($)</Label>
              <Input
                id="prize_q3"
                type="number"
                value={settings.prize_q3}
                onChange={(e) => setSettings({ ...settings, prize_q3: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prize_q4">Q4 Prize ($)</Label>
              <Input
                id="prize_q4"
                type="number"
                value={settings.prize_q4}
                onChange={(e) => setSettings({ ...settings, prize_q4: e.target.value })}
              />
            </div>
          </div>
        </Card>

        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-6">Game Configuration</h2>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="game_date">Game Date & Time</Label>
              <Input
                id="game_date"
                type="datetime-local"
                value={settings.game_date ? (() => {
                  try {
                    const date = new Date(settings.game_date);
                    // Convert to local datetime-local format (YYYY-MM-DDTHH:mm)
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
                  const dateValue = e.target.value;
                  if (dateValue) {
                    // Store as ISO string (will be interpreted in user's timezone)
                    const date = new Date(dateValue);
                    setSettings({ ...settings, game_date: date.toISOString() });
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                This sets the countdown timer and determines when the game starts
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="game_id">Game ID (Optional)</Label>
              <Input
                id="game_id"
                type="text"
                value={settings.game_id || ''}
                onChange={(e) => setSettings({ ...settings, game_id: e.target.value })}
                placeholder="API game ID (leave empty to search by date)"
              />
              <p className="text-xs text-muted-foreground">
                If you know the specific game ID from the API, enter it here for faster lookups
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="use_mock_data"
                  checked={settings.use_mock_data === 'true'}
                  onChange={(e) => setSettings({ ...settings, use_mock_data: e.target.checked ? 'true' : 'false' })}
                  className="w-5 h-5"
                />
                <Label htmlFor="use_mock_data" className="cursor-pointer">
                  Use Mock Data (2024 Super Bowl - Chiefs vs 49ers)
                </Label>
              </div>
              <p className="text-xs text-muted-foreground ml-8">
                Enable this to show mock game data for testing. Disable to use real API data.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-6">Branding</h2>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="logo_url">Logo URL</Label>
              <Input
                id="logo_url"
                value={settings.logo_url || '/logo.png'}
                onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
                placeholder="/logo.png"
              />
              <p className="text-xs text-muted-foreground">
                Path to your logo image (e.g., /logo.png for public folder, or full URL for external image)
              </p>
              {settings.logo_url && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-600 mb-2">Preview:</p>
                  <div className="w-16 h-16 border border-gray-300 rounded-lg overflow-hidden bg-white flex items-center justify-center">
                    <img 
                      src={settings.logo_url} 
                      alt="Logo preview" 
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        const parent = (e.target as HTMLImageElement).parentElement;
                        if (parent) {
                          parent.innerHTML = '<span class="text-xs text-gray-400">Preview unavailable</span>';
                        }
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-6">Venmo Settings</h2>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="venmo_username">Venmo Username</Label>
              <Input
                id="venmo_username"
                value={settings.venmo_username}
                onChange={(e) => setSettings({ ...settings, venmo_username: e.target.value })}
                placeholder="@username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="venmo_memo">Venmo Memo</Label>
              <Input
                id="venmo_memo"
                value={settings.venmo_memo}
                onChange={(e) => setSettings({ ...settings, venmo_memo: e.target.value })}
              />
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
}

