import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';

// PDF Styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#232842',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 10,
  },
  gridContainer: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  teamHeader: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  teamLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#232842',
    padding: 5,
    textAlign: 'center',
  },
  nfcLabel: {
    marginLeft: 35,
  },
  gridRow: {
    flexDirection: 'row',
  },
  rowHeader: {
    width: 30,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowHeaderText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666666',
  },
  colHeader: {
    width: 45,
    height: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colHeaderText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666666',
  },
  cell: {
    width: 45,
    height: 45,
    border: '1px solid #e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  cellAvailable: {
    backgroundColor: '#dcfce7',
  },
  cellTaken: {
    backgroundColor: '#f3f4f6',
  },
  cellNumber: {
    fontSize: 8,
    color: '#9ca3af',
    marginBottom: 2,
  },
  cellName: {
    fontSize: 7,
    color: '#374151',
    textAlign: 'center',
  },
  prizeSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f9fafb',
    borderRadius: 5,
  },
  prizeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#232842',
    marginBottom: 10,
    textAlign: 'center',
  },
  prizeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  prizeLabel: {
    fontSize: 10,
    color: '#666666',
  },
  prizeAmount: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#d4af37',
  },
  footer: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 9,
    color: '#9ca3af',
  },
  afcLabelContainer: {
    width: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  afcLabelText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#232842',
    transform: 'rotate(-90deg)',
  },
});

interface GridSquareData {
  row_number: number;
  col_number: number;
  row_score: number | null;
  col_score: number | null;
  status: string;
  user_name: string | null;
}

// PDF Document Component
const GridPDF = ({
  squares,
  rowScores,
  colScores,
  tournamentLaunched
}: {
  squares: GridSquareData[];
  rowScores: Map<number, number>;
  colScores: Map<number, number>;
  tournamentLaunched: boolean;
}) => {
  const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const prizes = { q1: 350, q2: 600, q3: 350, q4: 1200 };

  const getSquare = (row: number, col: number) => {
    return squares.find(s => s.row_number === row && s.col_number === col);
  };

  const getDisplayName = (name: string | null) => {
    if (!name) return '';
    const firstName = name.split(' ')[0];
    return firstName.length > 7 ? firstName.slice(0, 6) + '.' : firstName;
  };

  return React.createElement(Document, {},
    React.createElement(Page, { size: 'LETTER', style: styles.page },
      // Header
      React.createElement(View, { style: styles.header },
        React.createElement(Text, { style: styles.title }, 'Super Bowl Pool'),
        React.createElement(Text, { style: styles.subtitle }, 'Michael Williams Memorial Scholarship')
      ),

      // Grid Container
      React.createElement(View, { style: styles.gridContainer },
        // NFC Label
        React.createElement(View, { style: styles.teamHeader },
          React.createElement(View, { style: { width: 30 } }),
          React.createElement(Text, { style: [styles.teamLabel, styles.nfcLabel] }, 'NFC')
        ),

        // Column Headers
        React.createElement(View, { style: styles.gridRow },
          React.createElement(View, { style: styles.rowHeader }),
          ...numbers.map(col =>
            React.createElement(View, { key: `col-${col}`, style: styles.colHeader },
              React.createElement(Text, { style: styles.colHeaderText },
                tournamentLaunched ? String(colScores.get(col) ?? '?') : ''
              )
            )
          )
        ),

        // Grid Rows
        ...numbers.map(row =>
          React.createElement(View, { key: `row-${row}`, style: styles.gridRow },
            // Row Header
            React.createElement(View, { style: styles.rowHeader },
              React.createElement(Text, { style: styles.rowHeaderText },
                tournamentLaunched ? String(rowScores.get(row) ?? '?') : ''
              )
            ),
            // Cells
            ...numbers.map(col => {
              const square = getSquare(row, col);
              const isTaken = square?.status === 'paid' || square?.status === 'confirmed';
              const boxNumber = row * 10 + col + 1;

              return React.createElement(View, {
                key: `cell-${row}-${col}`,
                style: [styles.cell, isTaken ? styles.cellTaken : styles.cellAvailable]
              },
                React.createElement(Text, { style: styles.cellNumber }, `#${boxNumber}`),
                isTaken && React.createElement(Text, { style: styles.cellName },
                  getDisplayName(square?.user_name || null)
                )
              );
            })
          )
        ),

        // AFC Label (shown vertically on left)
        React.createElement(View, {
          style: { position: 'absolute', left: -20, top: 150 }
        },
          React.createElement(Text, { style: { fontSize: 14, fontWeight: 'bold', color: '#232842' } }, 'AFC')
        )
      ),

      // Prize Section
      React.createElement(View, { style: styles.prizeSection },
        React.createElement(Text, { style: styles.prizeTitle }, 'Prize Breakdown'),
        React.createElement(View, { style: styles.prizeRow },
          React.createElement(Text, { style: styles.prizeLabel }, 'Q1 (End of 1st Quarter)'),
          React.createElement(Text, { style: styles.prizeAmount }, `$${prizes.q1}`)
        ),
        React.createElement(View, { style: styles.prizeRow },
          React.createElement(Text, { style: styles.prizeLabel }, 'Q2 (Halftime)'),
          React.createElement(Text, { style: styles.prizeAmount }, `$${prizes.q2}`)
        ),
        React.createElement(View, { style: styles.prizeRow },
          React.createElement(Text, { style: styles.prizeLabel }, 'Q3 (End of 3rd Quarter)'),
          React.createElement(Text, { style: styles.prizeAmount }, `$${prizes.q3}`)
        ),
        React.createElement(View, { style: styles.prizeRow },
          React.createElement(Text, { style: styles.prizeLabel }, 'Q4 (Final Score)'),
          React.createElement(Text, { style: styles.prizeAmount }, `$${prizes.q4}`)
        ),
        React.createElement(View, { style: [styles.prizeRow, { marginTop: 10, borderTop: '1px solid #e5e7eb', paddingTop: 10 }] },
          React.createElement(Text, { style: [styles.prizeLabel, { fontWeight: 'bold' }] }, 'Total Prize Pool'),
          React.createElement(Text, { style: [styles.prizeAmount, { fontSize: 12 }] }, `$${prizes.q1 + prizes.q2 + prizes.q3 + prizes.q4}`)
        )
      ),

      // Footer
      React.createElement(View, { style: styles.footer },
        React.createElement(Text, {}, 'Follow along live at superbowlpool.com'),
        React.createElement(Text, { style: { marginTop: 3 } }, '100% of proceeds support the Michael Williams Memorial Scholarship')
      )
    )
  );
};

export async function GET() {
  try {
    const supabase = await createClient();

    // Fetch grid data
    const { data: squares, error: squaresError } = await supabase
      .from('grid_squares')
      .select(`
        row_number,
        col_number,
        row_score,
        col_score,
        status,
        profiles:user_id (name)
      `)
      .order('row_number', { ascending: true })
      .order('col_number', { ascending: true });

    if (squaresError) {
      throw squaresError;
    }

    // Check tournament status
    const { data: settings } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'tournament_launched')
      .single();

    const tournamentLaunched = settings?.value === 'true';

    // Build score maps
    const rowScores = new Map<number, number>();
    const colScores = new Map<number, number>();

    const processedSquares: GridSquareData[] = squares?.map((square: any) => {
      if (tournamentLaunched && square.row_score !== null) {
        rowScores.set(square.row_number, square.row_score);
      }
      if (tournamentLaunched && square.col_score !== null) {
        colScores.set(square.col_number, square.col_score);
      }

      return {
        row_number: square.row_number,
        col_number: square.col_number,
        row_score: square.row_score,
        col_score: square.col_score,
        status: square.status,
        user_name: square.profiles?.name || null,
      };
    }) || [];

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      React.createElement(GridPDF, {
        squares: processedSquares,
        rowScores,
        colScores,
        tournamentLaunched
      })
    );

    // Return PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="super-bowl-pool-grid.pdf"',
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
