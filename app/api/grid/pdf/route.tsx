import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import ReactPDF, { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 25,
    textAlign: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#232842',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: '#666666',
  },
  gridWrapper: {
    alignItems: 'center',
  },
  nfcLabel: {
    textAlign: 'center',
    marginBottom: 8,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1d4ed8',
  },
  gridContainer: {
    flexDirection: 'row',
  },
  afcLabel: {
    width: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  afcText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#dc2626',
    transform: 'rotate(-90deg)',
  },
  grid: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
  },
  headerCell: {
    width: 42,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#6b7280',
  },
  rowLabel: {
    width: 25,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cell: {
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    border: '1 solid #e5e7eb',
    margin: 1,
  },
  cellAvailable: {
    backgroundColor: '#ecfdf5',
  },
  cellTaken: {
    backgroundColor: '#f3f4f6',
  },
  cellText: {
    fontSize: 8,
    color: '#374151',
    textAlign: 'center',
  },
  cellNumber: {
    fontSize: 6,
    color: '#9ca3af',
  },
  prizeSection: {
    marginTop: 25,
    padding: 15,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
  },
  prizeTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#232842',
    marginBottom: 10,
    textAlign: 'center',
  },
  prizeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    paddingHorizontal: 20,
  },
  prizeLabel: {
    fontSize: 9,
    color: '#4b5563',
  },
  prizeAmount: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#d97706',
  },
  prizeDivider: {
    borderTop: '1 solid #e5e7eb',
    marginVertical: 8,
    marginHorizontal: 20,
  },
  footer: {
    marginTop: 20,
    textAlign: 'center',
  },
  footerText: {
    fontSize: 8,
    color: '#9ca3af',
  },
});

interface SquareData {
  row_number: number;
  col_number: number;
  row_score: number | null;
  col_score: number | null;
  status: string;
  user_name: string | null;
}

function createGridPDF(
  squares: SquareData[],
  rowScores: Map<number, number>,
  colScores: Map<number, number>,
  tournamentLaunched: boolean
) {
  const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const prizes = { q1: 350, q2: 600, q3: 350, q4: 1200 };
  const total = prizes.q1 + prizes.q2 + prizes.q3 + prizes.q4;

  const getSquare = (row: number, col: number) =>
    squares.find(s => s.row_number === row && s.col_number === col);

  const getInitials = (name: string | null) => {
    if (!name) return '';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Super Bowl Pool</Text>
          <Text style={styles.subtitle}>Michael Williams Memorial Scholarship</Text>
        </View>

        {/* Grid */}
        <View style={styles.gridWrapper}>
          <Text style={styles.nfcLabel}>← NFC →</Text>

          <View style={styles.gridContainer}>
            {/* AFC Label */}
            <View style={styles.afcLabel}>
              <Text style={styles.afcText}>AFC</Text>
            </View>

            {/* Grid Content */}
            <View style={styles.grid}>
              {/* Column Headers */}
              <View style={styles.row}>
                <View style={styles.rowLabel} />
                {numbers.map(col => (
                  <View key={`col-${col}`} style={styles.headerCell}>
                    <Text style={styles.headerText}>
                      {tournamentLaunched ? (colScores.get(col) ?? '-') : ''}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Rows */}
              {numbers.map(row => (
                <View key={`row-${row}`} style={styles.row}>
                  {/* Row Header */}
                  <View style={styles.rowLabel}>
                    <Text style={styles.headerText}>
                      {tournamentLaunched ? (rowScores.get(row) ?? '-') : ''}
                    </Text>
                  </View>

                  {/* Cells */}
                  {numbers.map(col => {
                    const square = getSquare(row, col);
                    const isTaken = square?.status === 'paid' || square?.status === 'confirmed';
                    const boxNum = row * 10 + col + 1;

                    return (
                      <View
                        key={`cell-${row}-${col}`}
                        style={[styles.cell, isTaken ? styles.cellTaken : styles.cellAvailable]}
                      >
                        {isTaken ? (
                          <Text style={styles.cellText}>{getInitials(square?.user_name || null)}</Text>
                        ) : (
                          <Text style={styles.cellNumber}>{boxNum}</Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Prize Section */}
        <View style={styles.prizeSection}>
          <Text style={styles.prizeTitle}>Prize Breakdown</Text>
          <View style={styles.prizeRow}>
            <Text style={styles.prizeLabel}>Q1 - End of 1st Quarter</Text>
            <Text style={styles.prizeAmount}>${prizes.q1}</Text>
          </View>
          <View style={styles.prizeRow}>
            <Text style={styles.prizeLabel}>Q2 - Halftime</Text>
            <Text style={styles.prizeAmount}>${prizes.q2}</Text>
          </View>
          <View style={styles.prizeRow}>
            <Text style={styles.prizeLabel}>Q3 - End of 3rd Quarter</Text>
            <Text style={styles.prizeAmount}>${prizes.q3}</Text>
          </View>
          <View style={styles.prizeRow}>
            <Text style={styles.prizeLabel}>Q4 - Final Score</Text>
            <Text style={styles.prizeAmount}>${prizes.q4}</Text>
          </View>
          <View style={styles.prizeDivider} />
          <View style={styles.prizeRow}>
            <Text style={[styles.prizeLabel, { fontWeight: 'bold' }]}>Total Prize Pool</Text>
            <Text style={[styles.prizeAmount, { fontSize: 11 }]}>${total}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Follow along live at superbowlpool.com</Text>
          <Text style={[styles.footerText, { marginTop: 2 }]}>
            100% of proceeds support the Michael Williams Memorial Scholarship
          </Text>
        </View>
      </Page>
    </Document>
  );
}

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

    if (squaresError) throw squaresError;

    // Check tournament status
    const { data: settings } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'tournament_launched')
      .single();

    const tournamentLaunched = settings?.value === 'true';

    // Build score maps and process squares
    const rowScores = new Map<number, number>();
    const colScores = new Map<number, number>();

    const processedSquares: SquareData[] = (squares || []).map((square: any) => {
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
    });

    // Generate PDF
    const pdfDoc = createGridPDF(processedSquares, rowScores, colScores, tournamentLaunched);
    const pdfBuffer = await ReactPDF.renderToBuffer(pdfDoc);

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="super-bowl-pool-grid.pdf"',
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
