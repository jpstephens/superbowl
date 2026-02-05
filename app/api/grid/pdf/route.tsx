import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Document, Page, View, Text, StyleSheet, renderToBuffer } from '@react-pdf/renderer';

// Force Node.js runtime for PDF generation
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CELL_SIZE = 50;
const HEADER_SIZE = 24;

const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 15,
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#232842',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: '#666666',
  },
  gridSection: {
    alignItems: 'center',
    marginBottom: 15,
  },
  teamLabelTop: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#004C54',
    marginBottom: 5,
    textAlign: 'center',
  },
  gridWithLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamLabelLeft: {
    width: 18,
    height: CELL_SIZE * 10 + HEADER_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  teamLabelLeftText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#E31837',
    transform: 'rotate(-90deg)',
    width: CELL_SIZE * 10,
    textAlign: 'center',
  },
  table: {
    borderWidth: 1,
    borderColor: '#232842',
  },
  tableRow: {
    flexDirection: 'row',
  },
  headerCell: {
    width: CELL_SIZE,
    height: HEADER_SIZE,
    backgroundColor: '#232842',
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#374151',
  },
  headerCellText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  rowHeader: {
    width: HEADER_SIZE,
    height: CELL_SIZE,
    backgroundColor: '#232842',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  cornerCell: {
    width: HEADER_SIZE,
    height: HEADER_SIZE,
    backgroundColor: '#232842',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  cellAvailable: {
    backgroundColor: '#f0fdf4',
  },
  cellTaken: {
    backgroundColor: '#fef3c7',
  },
  cellNumber: {
    fontSize: 7,
    color: '#9ca3af',
  },
  cellName: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#232842',
    textAlign: 'center',
    paddingHorizontal: 2,
    lineHeight: 1.2,
  },
  prizeSection: {
    marginTop: 10,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
  },
  prizeTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#232842',
    marginBottom: 8,
    textAlign: 'center',
  },
  prizeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
    paddingHorizontal: 15,
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
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginVertical: 6,
    marginHorizontal: 15,
  },
  footer: {
    marginTop: 12,
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

function GridPDF({
  squares,
  rowScores,
  colScores,
  tournamentLaunched,
  prizes,
  afcTeam,
  nfcTeam,
}: {
  squares: SquareData[];
  rowScores: Map<number, number>;
  colScores: Map<number, number>;
  tournamentLaunched: boolean;
  prizes: { q1: number; q2: number; q3: number; q4: number };
  afcTeam: string;
  nfcTeam: string;
}) {
  const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const total = prizes.q1 + prizes.q2 + prizes.q3 + prizes.q4;

  const getSquare = (row: number, col: number) =>
    squares.find(s => s.row_number === row && s.col_number === col);

  const formatName = (name: string | null) => {
    if (!name) return '';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0];
    // Return "First L." format to fit in cell
    const firstName = parts[0];
    const lastInitial = parts[parts.length - 1][0];
    return `${firstName} ${lastInitial}.`;
  };

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Super Bowl Pool</Text>
          <Text style={styles.subtitle}>Michael Williams Memorial Scholarship</Text>
        </View>

        {/* Grid Section */}
        <View style={styles.gridSection}>
          <Text style={styles.teamLabelTop}>{nfcTeam || 'NFC'}</Text>

          <View style={styles.gridWithLabel}>
            {/* AFC Label */}
            <View style={styles.teamLabelLeft}>
              <Text style={styles.teamLabelLeftText}>{afcTeam || 'AFC'}</Text>
            </View>

            {/* Grid Table */}
            <View style={styles.table}>
              {/* Header Row with column scores */}
              <View style={styles.tableRow}>
                <View style={styles.cornerCell} />
                {numbers.map(col => (
                  <View key={`header-${col}`} style={styles.headerCell}>
                    <Text style={styles.headerCellText}>
                      {tournamentLaunched ? (colScores.get(col) ?? '') : col}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Data Rows */}
              {numbers.map(row => (
                <View key={`row-${row}`} style={styles.tableRow}>
                  {/* Row header with score */}
                  <View style={styles.rowHeader}>
                    <Text style={styles.headerCellText}>
                      {tournamentLaunched ? (rowScores.get(row) ?? '') : row}
                    </Text>
                  </View>

                  {/* Cells */}
                  {numbers.map(col => {
                    const square = getSquare(row, col);
                    const isTaken = square?.status === 'paid';
                    const boxNum = row * 10 + col + 1;

                    return (
                      <View
                        key={`cell-${row}-${col}`}
                        style={[styles.cell, isTaken ? styles.cellTaken : styles.cellAvailable]}
                      >
                        {isTaken ? (
                          <Text style={styles.cellName}>{formatName(square?.user_name || null)}</Text>
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
            <Text style={styles.prizeAmount}>${prizes.q1.toLocaleString()}</Text>
          </View>
          <View style={styles.prizeRow}>
            <Text style={styles.prizeLabel}>Q2 - Halftime</Text>
            <Text style={styles.prizeAmount}>${prizes.q2.toLocaleString()}</Text>
          </View>
          <View style={styles.prizeRow}>
            <Text style={styles.prizeLabel}>Q3 - End of 3rd Quarter</Text>
            <Text style={styles.prizeAmount}>${prizes.q3.toLocaleString()}</Text>
          </View>
          <View style={styles.prizeRow}>
            <Text style={styles.prizeLabel}>Q4 - Final Score</Text>
            <Text style={styles.prizeAmount}>${prizes.q4.toLocaleString()}</Text>
          </View>
          <View style={styles.prizeDivider} />
          <View style={styles.prizeRow}>
            <Text style={[styles.prizeLabel, { fontWeight: 'bold' }]}>Total Prize Pool</Text>
            <Text style={[styles.prizeAmount, { fontSize: 11 }]}>${total.toLocaleString()}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Follow along live at superbowl.michaelwilliamsscholarship.com</Text>
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

    // Check tournament status, get prizes, and team names
    const { data: settings } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', ['tournament_launched', 'payout_q1', 'payout_q2', 'payout_q3', 'payout_q4', 'afc_team', 'nfc_team']);

    const settingsMap = new Map(settings?.map(s => [s.key, s.value]) || []);
    const tournamentLaunched = settingsMap.get('tournament_launched') === 'true';
    const afcTeam = settingsMap.get('afc_team') || 'AFC';
    const nfcTeam = settingsMap.get('nfc_team') || 'NFC';

    const prizes = {
      q1: parseInt(settingsMap.get('payout_q1') || '1000'),
      q2: parseInt(settingsMap.get('payout_q2') || '1000'),
      q3: parseInt(settingsMap.get('payout_q3') || '1000'),
      q4: parseInt(settingsMap.get('payout_q4') || '2000'),
    };

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
    const pdfDoc = (
      <GridPDF
        squares={processedSquares}
        rowScores={rowScores}
        colScores={colScores}
        tournamentLaunched={tournamentLaunched}
        prizes={prizes}
        afcTeam={afcTeam}
        nfcTeam={nfcTeam}
      />
    );
    const pdfBuffer = await renderToBuffer(pdfDoc);

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="super-bowl-pool-grid.pdf"',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: any) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({
      error: 'Failed to generate PDF',
      details: error?.message || 'Unknown error'
    }, { status: 500 });
  }
}
