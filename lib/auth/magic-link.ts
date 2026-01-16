import { createAdminClient } from '@/lib/supabase/admin';
import crypto from 'crypto';

const TOKEN_EXPIRY_HOURS = 72; // Magic links expire after 72 hours

/**
 * Generate a secure random token
 */
function generateToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Create a magic link for a user
 * Returns the full URL that can be included in emails
 */
export async function createMagicLink(
  profileId: string,
  baseUrl: string
): Promise<string | null> {
  try {
    const supabase = createAdminClient();
    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + TOKEN_EXPIRY_HOURS);

    // Store the token
    const { error } = await supabase.from('magic_tokens').insert({
      profile_id: profileId,
      token,
      expires_at: expiresAt.toISOString(),
    });

    if (error) {
      console.error('Error creating magic token:', error);
      return null;
    }

    // Return the full magic link URL
    return `${baseUrl}/api/auth/magic-login?token=${token}`;
  } catch (error) {
    console.error('Error in createMagicLink:', error);
    return null;
  }
}

/**
 * Validate a magic token and return the profile if valid
 */
export async function validateMagicToken(token: string): Promise<{
  valid: boolean;
  profileId?: string;
  email?: string;
  error?: string;
}> {
  try {
    const supabase = createAdminClient();

    // Find the token
    const { data: tokenData, error: tokenError } = await supabase
      .from('magic_tokens')
      .select('id, profile_id, expires_at, used_at')
      .eq('token', token)
      .single();

    if (tokenError || !tokenData) {
      return { valid: false, error: 'Invalid or expired link' };
    }

    // Check if already used
    if (tokenData.used_at) {
      return { valid: false, error: 'This link has already been used' };
    }

    // Check if expired
    if (new Date(tokenData.expires_at) < new Date()) {
      return { valid: false, error: 'This link has expired' };
    }

    // Get the profile email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('id', tokenData.profile_id)
      .single();

    if (profileError || !profile) {
      return { valid: false, error: 'User not found' };
    }

    // Mark token as used
    await supabase
      .from('magic_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tokenData.id);

    return {
      valid: true,
      profileId: profile.id,
      email: profile.email,
    };
  } catch (error) {
    console.error('Error validating magic token:', error);
    return { valid: false, error: 'An error occurred' };
  }
}
