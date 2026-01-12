import { z } from 'zod';

/**
 * Validation schemas for admin API endpoints
 */

// UUID validation helper
const uuidSchema = z.string().uuid('Invalid UUID format');

// =====================================================
// Square Management
// =====================================================

export const updateSquareSchema = z.object({
  squareId: uuidSchema,
  userId: uuidSchema.nullable(),
});

export type UpdateSquareInput = z.infer<typeof updateSquareSchema>;

// =====================================================
// Tournament Launch
// =====================================================

export const launchTournamentSchema = z.object({
  confirm: z.literal(true, {
    message: 'Must confirm tournament launch',
  }),
});

export type LaunchTournamentInput = z.infer<typeof launchTournamentSchema>;

// =====================================================
// Payment Management
// =====================================================

export const confirmPaymentSchema = z.object({
  paymentId: uuidSchema,
});

export type ConfirmPaymentInput = z.infer<typeof confirmPaymentSchema>;

// =====================================================
// Prop Bet Management
// =====================================================

export const createPropSchema = z.object({
  question: z.string().min(1, 'Question is required').max(500),
  answer_type: z.enum(['yes_no', 'over_under', 'multiple_choice', 'exact_number']),
  category: z.string().optional(),
  options: z.array(z.string()).optional(),
  over_under_line: z.number().optional(),
  over_under_unit: z.string().optional(),
  point_value: z.number().min(0).default(1),
  status: z.enum(['draft', 'open', 'locked', 'graded']).default('draft'),
  display_order: z.number().optional(),
});

export type CreatePropInput = z.infer<typeof createPropSchema>;

export const gradePropSchema = z.object({
  propId: uuidSchema,
  correct_answer: z.string().min(1, 'Correct answer is required'),
  result_value: z.string().optional(),
  result_notes: z.string().optional(),
});

export type GradePropInput = z.infer<typeof gradePropSchema>;

// =====================================================
// Game State Management
// =====================================================

export const updateGameStateSchema = z.object({
  afc_score: z.number().min(0).optional(),
  nfc_score: z.number().min(0).optional(),
  quarter: z.number().min(0).max(5).optional(), // 0 = pre-game, 5 = OT
  time_remaining: z.string().optional(),
  is_live: z.boolean().optional(),
  is_halftime: z.boolean().optional(),
  is_final: z.boolean().optional(),
});

export type UpdateGameStateInput = z.infer<typeof updateGameStateSchema>;

// =====================================================
// Settings Management
// =====================================================

export const updateSettingSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
});

export type UpdateSettingInput = z.infer<typeof updateSettingSchema>;

// =====================================================
// Checkout Session
// =====================================================

export const createCheckoutSchema = z.object({
  selectedSquares: z.array(
    z.object({
      id: uuidSchema,
      row_number: z.number().min(0).max(9),
      col_number: z.number().min(0).max(9),
    })
  ).min(1, 'At least one square must be selected'),
  totalAmount: z.number().positive('Total amount must be positive'),
  baseAmount: z.number().positive().optional(),
});

export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>;

// =====================================================
// Validation helper function
// =====================================================

export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // Format error message
  const errors = result.error.issues.map((issue) => issue.message).join(', ');
  return { success: false, error: errors };
}
