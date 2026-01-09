'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Team {
  name: string;
  abbreviation: string;
  conference: 'AFC' | 'NFC';
  record: string;
  city: string;
}

interface TeamBreakdownProps {
  afcTeam: Team;
  nfcTeam: Team;
}

export default function TeamBreakdown({ afcTeam, nfcTeam }: TeamBreakdownProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* AFC Team Card */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 hover:shadow-lg transition-all">
        <div className="flex items-center justify-between mb-4">
          <Badge className="bg-blue-600 text-white">AFC</Badge>
          <span className="text-sm font-semibold text-blue-800">American Football Conference</span>
        </div>
        
        <div className="space-y-3">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{afcTeam.name}</h3>
            <p className="text-sm text-gray-600">{afcTeam.city}</p>
          </div>
          
          <div className="flex items-center gap-4 pt-3 border-t border-blue-200">
            <div>
              <div className="text-xs text-gray-600 uppercase tracking-wide">Abbreviation</div>
              <div className="text-lg font-bold text-blue-700">{afcTeam.abbreviation}</div>
            </div>
            <div>
              <div className="text-xs text-gray-600 uppercase tracking-wide">Record</div>
              <div className="text-lg font-bold text-blue-700">{afcTeam.record}</div>
            </div>
          </div>
        </div>
      </Card>

      {/* NFC Team Card */}
      <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-300 hover:shadow-lg transition-all">
        <div className="flex items-center justify-between mb-4">
          <Badge className="bg-red-600 text-white">NFC</Badge>
          <span className="text-sm font-semibold text-red-800">National Football Conference</span>
        </div>
        
        <div className="space-y-3">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{nfcTeam.name}</h3>
            <p className="text-sm text-gray-600">{nfcTeam.city}</p>
          </div>
          
          <div className="flex items-center gap-4 pt-3 border-t border-red-200">
            <div>
              <div className="text-xs text-gray-600 uppercase tracking-wide">Abbreviation</div>
              <div className="text-lg font-bold text-red-700">{nfcTeam.abbreviation}</div>
            </div>
            <div>
              <div className="text-xs text-gray-600 uppercase tracking-wide">Record</div>
              <div className="text-lg font-bold text-red-700">{nfcTeam.record}</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}



