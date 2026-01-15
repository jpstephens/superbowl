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
    const { squareId, userId, status } = body;

    if (!squareId) {
      return NextResponse.json(
        { error: 'Square ID is required' },
        { status: 400 }
      );
    }

    // Valid statuses
    const validStatuses = ['available', 'claimed', 'paid'];

    // Build update data based on provided parameters
    const updateData: Record<string, unknown> = {};

    // Handle user assignment
    if (userId === null || userId === undefined) {
      // Make available - clear ownership
      updateData.user_id = null;
      updateData.paid_at = null;
      updateData.payment_method = null;
      updateData.payment_id = null;
      // Default to available status if not specified
      if (!status) {
        updateData.status = 'available';
      }
    } else {
      // Assign to user
      updateData.user_id = userId;
      // Only set paid_at if status is paid
      if (status === 'paid') {
        updateData.paid_at = new Date().toISOString();
      }
    }

    // Handle status if explicitly provided
    if (status) {
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        );
      }
      updateData.status = status;

      // If setting to available, also clear ownership fields
      if (status === 'available') {
        updateData.user_id = null;
        updateData.paid_at = null;
        updateData.payment_method = null;
        updateData.payment_id = null;
      }
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
