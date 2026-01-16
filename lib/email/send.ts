import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase/admin';

// Lazy-load Resend to avoid build-time errors
let resendInstance: Resend | null = null;

function getResend(): Resend | null {
  if (!resendInstance && process.env.RESEND_API_KEY) {
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }
  return resendInstance;
}

// Email sender addresses
const SENDERS = {
  default: 'Super Bowl Pool <noreply@michaelwilliamsscholarship.com>',
  pool: 'Super Bowl Pool <pool@superbowlpool.com>',
} as const;

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: keyof typeof SENDERS;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: string; // base64 encoded
  }>;
}

export interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * Send an email using Resend
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const resend = getResend();

  if (!resend) {
    console.error('Email service not configured - RESEND_API_KEY missing');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: SENDERS[options.from || 'default'],
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      replyTo: options.replyTo,
      attachments: options.attachments,
    });

    if (error) {
      console.error('Resend error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (error) {
    console.error('Failed to send email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send an email to all admin users
 */
export async function sendToAdmins(subject: string, html: string): Promise<void> {
  try {
    const supabase = createAdminClient();

    // Get all admin emails
    const { data: admins, error } = await supabase
      .from('profiles')
      .select('email')
      .eq('is_admin', true)
      .not('email', 'is', null);

    if (error) {
      console.error('Failed to fetch admin emails:', error);
      return;
    }

    if (!admins || admins.length === 0) {
      console.log('No admin emails found');
      return;
    }

    const adminEmails = admins.map(a => a.email).filter(Boolean) as string[];

    // Send to all admins
    const result = await sendEmail({
      to: adminEmails,
      subject,
      html,
    });

    if (!result.success) {
      console.error('Failed to send admin email:', result.error);
    }
  } catch (error) {
    console.error('Error sending to admins:', error);
  }
}

/**
 * Send email with error handling that doesn't fail the parent operation
 * Use this when email is non-critical (e.g., notifications)
 */
export async function sendEmailSafe(options: SendEmailOptions): Promise<void> {
  try {
    const result = await sendEmail(options);
    if (!result.success) {
      console.error(`Failed to send email to ${options.to}: ${result.error}`);
    }
  } catch (error) {
    console.error('Email send error (non-fatal):', error);
  }
}

/**
 * Check if email service is configured
 */
export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}
