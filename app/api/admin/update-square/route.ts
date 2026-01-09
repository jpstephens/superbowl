import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify admin access
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - not logged in' },
        { status: 401 }
      );
    }

    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id, role')
      .eq('email', user.email)
      .single();

    if (!adminUser) {
      return NextResponse.json(
        { error: 'Unauthorized - not an admin' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { squareId, userId } = body;

    if (!squareId) {
      return NextResponse.json(
        { error: 'Square ID is required' },
        { status: 400 }
      );
    }

    // Determine the new status based on userId
    let newStatus: string;
    let updateData: Record<string, unknown>;

    if (userId === null || userId === undefined) {
      // Make available - clear ownership
      newStatus = 'available';
      updateData = {
        user_id: null,
        status: newStatus,
        paid_at: null,
        payment_method: null,
        payment_id: null,
      };
    } else {
      // Assign to user - mark as confirmed
      newStatus = 'confirmed';
      updateData = {
        user_id: userId,
        status: newStatus,
        paid_at: new Date().toISOString(),
      };
    }

    // Update the square
    const { data: updatedSquare, error: updateError } = await supabase
      .from('grid_squares')
      .update(updateData)
      .eq('id', squareId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating square:', updateError);
      return NextResponse.json(
        { error: 'Failed to update square' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      square: updatedSquare,
    });
  } catch (error) {
    console.error('Error in update-square API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
