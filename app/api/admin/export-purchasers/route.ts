import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();

    // Fetch all paid squares with user info
    const { data: squares, error } = await supabase
      .from('grid_squares')
      .select(`
        row_number,
        col_number,
        row_score,
        col_score,
        status,
        paid_at,
        profiles:user_id (
          name,
          email,
          phone
        )
      `)
      .eq('status', 'paid')
      .order('row_number', { ascending: true })
      .order('col_number', { ascending: true });

    if (error) throw error;

    // Create CSV header
    const csvRows = [
      ['Name', 'Email', 'Phone', 'Row', 'Column', 'Row Score', 'Column Score', 'Paid At'].join(',')
    ];

    // Add data rows
    for (const square of squares || []) {
      const profile = square.profiles as any;
      const row = [
        `"${profile?.name || ''}"`,
        `"${profile?.email || ''}"`,
        `"${profile?.phone || ''}"`,
        square.row_number,
        square.col_number,
        square.row_score ?? '',
        square.col_score ?? '',
        square.paid_at ? `"${new Date(square.paid_at).toLocaleDateString()}"` : ''
      ].join(',');
      csvRows.push(row);
    }

    const csvContent = csvRows.join('\n');

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="superbowl-purchasers.csv"',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: any) {
    console.error('Error generating CSV:', error);
    return NextResponse.json({
      error: 'Failed to generate CSV',
      details: error?.message || 'Unknown error'
    }, { status: 500 });
  }
}
