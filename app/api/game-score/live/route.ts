import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Live Score Fetcher
 * Fetches real-time NFL game scores from ESPN API
 * Can be called periodically (every 30s) during game time
 */

interface ESPNCompetitor {
  id: string;
  homeAway: 'home' | 'away';
  score?: string;
  team: {
    abbreviation: string;
    displayName: string;
  };
}

interface ESPNCompetition {
  id: string;
  status: {
    type: {
      state: 'pre' | 'in' | 'post';
      completed: boolean;
    };
    period: number;
    displayClock: string;
  };
  competitors: ESPNCompetitor[];
  situation?: {
    possession: string;
    down: number;
    distance: number;
    yardLine: number;
    lastPlay?: {
      text: string;
    };
  };
}

interface ESPNEvent {
  id: string;
  name: string;
  competitions: ESPNCompetition[];
}

interface ESPNResponse {
  events: ESPNEvent[];
}

// ESPN API endpoint for NFL scoreboard
const ESPN_NFL_SCOREBOARD = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard';

export async function GET() {
  try {
    const supabase = await createClient();

    // Check settings for use_mock_data and game_id
    const { data: settings } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', ['use_mock_data', 'game_id', 'game_date']);

    const useMock = settings?.find(s => s.key === 'use_mock_data')?.value === 'true';
    const gameId = settings?.find(s => s.key === 'game_id')?.value;
    const gameDate = settings?.find(s => s.key === 'game_date')?.value;

    if (useMock) {
      // Return mock data for testing
      return NextResponse.json(getMockLiveData());
    }

    // Fetch from ESPN API
    let espnUrl = ESPN_NFL_SCOREBOARD;

    // If we have a specific game date, add it as a filter
    if (gameDate) {
      const date = new Date(gameDate);
      const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
      espnUrl += `?dates=${dateStr}`;
    }

    const response = await fetch(espnUrl, {
      next: { revalidate: 30 }, // Cache for 30 seconds
    });

    if (!response.ok) {
      throw new Error(`ESPN API error: ${response.status}`);
    }

    const data: ESPNResponse = await response.json();

    // Find the Super Bowl or the specific game
    let targetGame: ESPNCompetition | null = null;
    let targetEvent: ESPNEvent | null = null;

    for (const event of data.events) {
      // If we have a game ID, match it
      if (gameId && event.id === gameId) {
        targetEvent = event;
        targetGame = event.competitions[0];
        break;
      }

      // Otherwise look for Super Bowl or championship game
      const eventName = event.name.toLowerCase();
      if (eventName.includes('super bowl') || eventName.includes('championship')) {
        targetEvent = event;
        targetGame = event.competitions[0];
        break;
      }
    }

    // If no specific game found, use the first game (useful for testing)
    if (!targetGame && data.events.length > 0) {
      targetEvent = data.events[0];
      targetGame = data.events[0].competitions[0];
    }

    if (!targetGame || !targetEvent) {
      return NextResponse.json({
        error: 'No game found',
        message: 'Could not find the Super Bowl or specified game',
        availableGames: data.events.map(e => ({ id: e.id, name: e.name })),
      }, { status: 404 });
    }

    // Parse game data
    const homeTeam = targetGame.competitors.find(c => c.homeAway === 'home');
    const awayTeam = targetGame.competitors.find(c => c.homeAway === 'away');

    const gameData = {
      gameId: targetEvent.id,
      gameName: targetEvent.name,
      afcScore: parseInt(awayTeam?.score || '0', 10),
      nfcScore: parseInt(homeTeam?.score || '0', 10),
      afcTeam: awayTeam?.team.displayName || 'AFC Team',
      nfcTeam: homeTeam?.team.displayName || 'NFC Team',
      quarter: targetGame.status.period,
      timeRemaining: targetGame.status.displayClock,
      isLive: targetGame.status.type.state === 'in',
      isHalftime: targetGame.status.period === 2 && targetGame.status.displayClock === '0:00',
      isFinal: targetGame.status.type.completed,
      possession: targetGame.situation?.possession || null,
      down: targetGame.situation?.down || null,
      yardsToGo: targetGame.situation?.distance || null,
      yardLine: targetGame.situation?.yardLine || null,
      lastPlay: targetGame.situation?.lastPlay?.text || null,
      source: 'espn',
      fetchedAt: new Date().toISOString(),
    };

    // Update game state in database
    const { data: currentState } = await supabase
      .from('game_state')
      .select('id')
      .limit(1)
      .single();

    if (currentState) {
      await supabase
        .from('game_state')
        .update({
          afc_score: gameData.afcScore,
          nfc_score: gameData.nfcScore,
          afc_team: gameData.afcTeam,
          nfc_team: gameData.nfcTeam,
          quarter: gameData.quarter,
          time_remaining: gameData.timeRemaining,
          is_live: gameData.isLive,
          is_halftime: gameData.isHalftime,
          is_final: gameData.isFinal,
          possession: gameData.possession,
          down: gameData.down,
          yards_to_go: gameData.yardsToGo,
          yard_line: gameData.yardLine,
          last_play: gameData.lastPlay,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentState.id);
    } else {
      await supabase.from('game_state').insert({
        afc_score: gameData.afcScore,
        nfc_score: gameData.nfcScore,
        afc_team: gameData.afcTeam,
        nfc_team: gameData.nfcTeam,
        quarter: gameData.quarter,
        time_remaining: gameData.timeRemaining,
        is_live: gameData.isLive,
        is_halftime: gameData.isHalftime,
        is_final: gameData.isFinal,
        possession: gameData.possession,
        down: gameData.down,
        yards_to_go: gameData.yardsToGo,
        yard_line: gameData.yardLine,
        last_play: gameData.lastPlay,
        game_date: gameDate || new Date().toISOString(),
      });
    }

    return NextResponse.json(gameData);
  } catch (error) {
    console.error('Live score fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch live scores', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Mock data for the 2024 Super Bowl (Chiefs vs 49ers)
 * Used for testing and development
 */
function getMockLiveData() {
  // Simulate a game in progress
  const mockQuarters = [
    { quarter: 1, afcScore: 0, nfcScore: 0, time: '15:00' },
    { quarter: 1, afcScore: 0, nfcScore: 3, time: '8:42' },
    { quarter: 1, afcScore: 0, nfcScore: 10, time: '0:00' },
    { quarter: 2, afcScore: 3, nfcScore: 10, time: '12:15' },
    { quarter: 2, afcScore: 10, nfcScore: 10, time: '0:00' },
    { quarter: 3, afcScore: 13, nfcScore: 10, time: '7:00' },
    { quarter: 3, afcScore: 13, nfcScore: 16, time: '0:00' },
    { quarter: 4, afcScore: 16, nfcScore: 16, time: '5:30' },
    { quarter: 4, afcScore: 19, nfcScore: 19, time: '0:00' },
    { quarter: 5, afcScore: 25, nfcScore: 22, time: '0:00', isFinal: true },
  ];

  // Pick a random state to simulate live game
  const currentState = mockQuarters[Math.floor(Math.random() * mockQuarters.length)];

  return {
    gameId: 'mock-superbowl-lviii',
    gameName: 'Super Bowl LVIII',
    afcScore: currentState.afcScore,
    nfcScore: currentState.nfcScore,
    afcTeam: 'Kansas City Chiefs',
    nfcTeam: 'San Francisco 49ers',
    quarter: currentState.quarter,
    timeRemaining: currentState.time,
    isLive: !currentState.isFinal,
    isHalftime: currentState.quarter === 2 && currentState.time === '0:00',
    isFinal: currentState.isFinal || false,
    possession: currentState.afcScore > currentState.nfcScore ? 'KC' : 'SF',
    down: 2,
    yardsToGo: 7,
    yardLine: 35,
    lastPlay: 'P.Mahomes pass complete to T.Kelce for 12 yards',
    source: 'mock',
    fetchedAt: new Date().toISOString(),
  };
}
