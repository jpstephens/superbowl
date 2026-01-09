'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Trophy, DollarSign } from 'lucide-react';
import Link from 'next/link';

export default function DisclaimerModal() {
  const [open, setOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [prizeAmounts, setPrizeAmounts] = useState<Record<number, string>>({
    1: '250',
    2: '250',
    3: '250',
    4: '250',
  });
  const [squarePrice, setSquarePrice] = useState<string>('50');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user has already agreed
    const hasAgreed = localStorage.getItem('disclaimer_agreed') === 'true';
    if (!hasAgreed) {
      setOpen(true);
    }
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', ['prize_q1', 'prize_q2', 'prize_q3', 'prize_q4', 'square_price']);

      if (error) throw error;

      if (data) {
        const amounts: Record<number, string> = {};
        data.forEach((item) => {
          if (item.key.startsWith('prize_q')) {
            const quarter = parseInt(item.key.replace('prize_q', ''));
            amounts[quarter] = item.value || '250';
          } else if (item.key === 'square_price') {
            setSquarePrice(item.value || '50');
          }
        });
        setPrizeAmounts(amounts);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAgree = () => {
    if (agreed) {
      localStorage.setItem('disclaimer_agreed', 'true');
      localStorage.setItem('disclaimer_agreed_date', new Date().toISOString());
      setOpen(false);
    }
  };

  const totalPrizePool = Object.values(prizeAmounts).reduce((sum, amount) => sum + parseFloat(amount || '0'), 0);

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Terms & Disclaimer</DialogTitle>
          <DialogDescription>
            Please read and agree to the terms before participating in the Super Bowl Pool
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          {/* Prize Breakdown */}
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-lg border-2 border-amber-200">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="h-5 w-5 text-amber-700" />
              <h3 className="text-lg font-bold text-gray-900">Prize Breakdown</h3>
            </div>
            
            {loading ? (
              <div className="text-gray-600">Loading prize information...</div>
            ) : (
              <div className="space-y-3">
                <div className="bg-white p-3 rounded-lg border border-amber-200">
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div>
                      <div className="text-xs text-gray-600 mb-1">Q1</div>
                      <div className="text-xl font-bold text-amber-700">${prizeAmounts[1] || '250'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 mb-1">Q2</div>
                      <div className="text-xl font-bold text-amber-700">${prizeAmounts[2] || '250'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 mb-1">Q3</div>
                      <div className="text-xl font-bold text-amber-700">${prizeAmounts[3] || '250'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 mb-1">Q4</div>
                      <div className="text-xl font-bold text-amber-700">${prizeAmounts[4] || '250'}</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-3 rounded-lg border border-amber-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-amber-700" />
                      <span className="font-semibold text-gray-900">Total Prize Pool:</span>
                    </div>
                    <div className="text-xl font-bold text-amber-700">${totalPrizePool.toFixed(2)}</div>
                  </div>
                  <div className="bg-blue-50 p-2 rounded border border-blue-200 mb-2">
                    <p className="text-xs font-semibold text-gray-900 mb-1">Revenue Split:</p>
                    <p className="text-xs text-gray-700">50% scholarship fund (house keeps) • 50% prizes</p>
                    <p className="text-xs text-gray-600 italic mt-1">Prize amounts are manually set by admin</p>
                  </div>
                  <div className="mt-2 text-xs text-gray-600">
                    Square Price: ${squarePrice} per square
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Key Terms */}
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900">Key Terms:</h3>
            <ul className="list-disc pl-5 space-y-1 text-gray-700">
              <li>Participants must be 18 years or older</li>
              <li>Square purchases are final and non-refundable</li>
              <li><strong>50% of donations go to the scholarship fund (house keeps), 50% to prizes (manually set by admin)</strong></li>
              <li>Winners determined by last digit of each team's score at quarter end</li>
              <li>Prize money distributed within 48 hours of game conclusion</li>
              <li>All decisions by the pool administrator are final</li>
            </ul>
          </div>

          {/* Full Terms Link */}
          <div className="text-center pt-2">
            <Link href="/disclaimer" className="text-primary hover:underline text-sm">
              View full terms and disclaimer →
            </Link>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="checkbox"
              id="agree-checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <Label htmlFor="agree-checkbox" className="text-sm cursor-pointer">
              I have read and agree to the terms and disclaimer
            </Label>
          </div>
          <Button
            onClick={handleAgree}
            disabled={!agreed}
            className="w-full sm:w-auto"
          >
            I Agree
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

