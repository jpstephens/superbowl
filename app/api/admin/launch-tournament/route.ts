import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Admin API: Launch Tournament
 * Randomizes row_score and col_score for all grid squares
 * - Horizontal axis (col_score): 0-9 in random order, no repeats
 * - Vertical axis (row_score): 0-9 in random order, no repeats
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Verify admin access
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: adminData } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', user.email)
      .single();

    if (!adminData) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Check if tournament is already launched
    const { data: setting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'tournament_launched')
      .single();

    if (setting?.value === 'true') {
      return NextResponse.json(
        { error: 'Tournament is already launched. Cannot randomize again.' },
        { status: 400 }
      );
    }

    // CRITICAL: Check that all 100 squares are sold before launching
    const { data: allSquares, error: squaresCheckError } = await supabase
      .from('grid_squares')
      .select('id, status')
      .eq('status', 'paid');

    if (squaresCheckError) throw squaresCheckError;

    const soldCount = allSquares?.length || 0;
    if (soldCount < 100) {
      return NextResponse.json(
        { 
          error: `Cannot launch tournament. Only ${soldCount} of 100 squares are sold. All squares must be sold before numbers can be assigned.`,
          soldCount,
          requiredCount: 100
        },
        { status: 400 }
      );
    }

    // Generate random arrays for row and column scores (0-9, no repeats)
    const rowScores = Array.from({ length: 10 }, (_, i) => i);
    const colScores = Array.from({ length: 10 }, (_, i) => i);
    
    // Shuffle arrays using Fisher-Yates algorithm
    const shuffle = (array: number[]) => {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };

    const shuffledRowScores = shuffle(rowScores);
    const shuffledColScores = shuffle(colScores);

    // Get all grid squares ordered by row_number and col_number
    const { data: squares, error: squaresError } = await supabase
      .from('grid_squares')
      .select('id, row_number, col_number')
      .order('row_number')
      .order('col_number');

    if (squaresError) throw squaresError;

    if (!squares || squares.length !== 100) {
      return NextResponse.json(
        { error: 'Grid is not properly initialized. Expected 100 squares.' },
        { status: 400 }
      );
    }

    // Update each square with randomized scores
    // row_number maps to shuffledRowScores, col_number maps to shuffledColScores
    const updates = squares.map(square => ({
      id: square.id,
      row_score: shuffledRowScores[square.row_number],
      col_score: shuffledColScores[square.col_number],
    }));

    // Batch update all squares with concurrent execution and error tracking
    // Group updates by row for more efficient batching
    const updatePromises = [];
    const updatedIds: string[] = [];
    const failedUpdates: { id: string; error: any }[] = [];

    // Execute updates concurrently in batches of 10 for efficiency
    const batchSize = 10;
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      const batchPromises = batch.map(async (update) => {
        const { error: updateError } = await supabase
          .from('grid_squares')
          .update({
            row_score: update.row_score,
            col_score: update.col_score,
          })
          .eq('id', update.id);

        if (updateError) {
          failedUpdates.push({ id: update.id, error: updateError });
        } else {
          updatedIds.push(update.id);
        }
      });

      await Promise.all(batchPromises);
    }

    // If any updates failed, attempt to rollback successful ones
    if (failedUpdates.length > 0) {
      console.error('Some square updates failed:', failedUpdates);

      // Rollback: clear row_score and col_score from successfully updated squares
      if (updatedIds.length > 0) {
        await supabase
          .from('grid_squares')
          .update({ row_score: null, col_score: null })
          .in('id', updatedIds);
      }

      return NextResponse.json(
        {
          error: `Tournament launch failed. ${failedUpdates.length} squares could not be updated. All changes have been rolled back.`,
          failedCount: failedUpdates.length,
        },
        { status: 500 }
      );
    }

    // Mark tournament as launched
    await supabase
      .from('settings')
      .upsert({
        key: 'tournament_launched',
        value: 'true',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' });

    return NextResponse.json({
      success: true,
      message: 'Tournament launched successfully! Numbers have been randomized.',
      rowScores: shuffledRowScores,
      colScores: shuffledColScores,
    });
  } catch (error: any) {
    console.error('Launch tournament error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to launch tournament' },
      { status: 500 }
    );
  }
}

