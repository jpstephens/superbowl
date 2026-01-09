import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Fetches game state from database.
 * Game state is updated by:
 * 1. Admin panel (manual entry)
 * 2. External API polling (NFL API, ESPN API)
 * 3. Realtime updates via Supabase
 */
export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get the current game state from database
    const { data: gameState, error } = await supabase
      .from('game_state')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching game state:', error);
    }

    // If we have a game state in the database, return it
    if (gameState) {
      return NextResponse.json({
        afcScore: gameState.afc_score,
        nfcScore: gameState.nfc_score,
        quarter: gameState.quarter,
        timeRemaining: gameState.time_remaining,
        isLive: gameState.is_live,
        isHalftime: gameState.is_halftime,
        isFinal: gameState.is_final,
        afcTeam: gameState.afc_team,
        nfcTeam: gameState.nfc_team,
        possession: gameState.possession,
        down: gameState.down,
        yardsToGo: gameState.yards_to_go,
        yardLine: gameState.yard_line,
        lastPlay: gameState.last_play,
        gameDate: gameState.game_date,
        updatedAt: gameState.updated_at,
        source: 'database',
      });
    }

    // Fallback to mock data if no game state exists
    return NextResponse.json(getMockGameData());
  } catch (error) {
    console.error('Game score API error:', error);
    return NextResponse.json(getMockGameData());
  }
}

/**
 * Updates game state (admin only)
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    
    const {
      afcScore,
      nfcScore,
      quarter,
      timeRemaining,
      isLive,
      isHalftime,
      isFinal,
      possession,
      down,
      yardsToGo,
      yardLine,
      lastPlay,
      scoringType,
    } = body;

    // Update game state
    const { data: currentState } = await supabase
      .from('game_state')
      .select('id, afc_score, nfc_score')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    const updateData = {
      ...(afcScore !== undefined && { afc_score: afcScore }),
      ...(nfcScore !== undefined && { nfc_score: nfcScore }),
      ...(quarter !== undefined && { quarter }),
      ...(timeRemaining !== undefined && { time_remaining: timeRemaining }),
      ...(isLive !== undefined && { is_live: isLive }),
      ...(isHalftime !== undefined && { is_halftime: isHalftime }),
      ...(isFinal !== undefined && { is_final: isFinal }),
      ...(possession !== undefined && { possession }),
      ...(down !== undefined && { down }),
      ...(yardsToGo !== undefined && { yards_to_go: yardsToGo }),
      ...(yardLine !== undefined && { yard_line: yardLine }),
      ...(lastPlay !== undefined && { last_play: lastPlay }),
    };

    if (currentState) {
      // Update existing game state
      const { error } = await supabase
        .from('game_state')
        .update(updateData)
        .eq('id', currentState.id);

      if (error) throw error;

      // If score changed, record in history
      const scoreChanged = 
        (afcScore !== undefined && afcScore !== currentState.afc_score) ||
        (nfcScore !== undefined && nfcScore !== currentState.nfc_score);

      if (scoreChanged) {
        await supabase.from('score_history').insert({
          afc_score: afcScore ?? currentState.afc_score,
          nfc_score: nfcScore ?? currentState.nfc_score,
          quarter: quarter ?? 0,
          time_remaining: timeRemaining,
          play_description: lastPlay,
          scoring_type: scoringType,
        });
      }
    } else {
      // Create new game state
      const { error } = await supabase
        .from('game_state')
        .insert({
          afc_team: 'Kansas City Chiefs',
          nfc_team: 'Philadelphia Eagles',
          ...updateData,
        });

      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating game state:', error);
    return NextResponse.json(
      { error: 'Failed to update game state' },
      { status: 500 }
    );
  }
}

/**
 * Returns mock game data for development/preview
 */
function getMockGameData() {
  return {
    afcScore: 0,
    nfcScore: 0,
    quarter: 0,
    timeRemaining: '15:00',
    isLive: false,
    isHalftime: false,
    isFinal: false,
    afcTeam: 'Kansas City Chiefs',
    nfcTeam: 'Philadelphia Eagles',
    possession: null,
    down: null,
    yardsToGo: null,
    yardLine: null,
    lastPlay: null,
    gameDate: '2025-02-09',
    source: 'mock',
  };
}
