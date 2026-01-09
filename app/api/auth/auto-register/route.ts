import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';
import crypto from 'crypto';

// Initialize Resend only if API key is available (avoids build errors)
const getResend = () => {
  if (process.env.RESEND_API_KEY) {
    return new Resend(process.env.RESEND_API_KEY);
  }
  return null;
};

/**
 * Auto-registers a user after payment
 * Creates Supabase Auth account, profile, and sends login email
 */
export async function POST(request: Request) {
  try {
    const { email, name, phone, selectedSquareIds } = await request.json();

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    // Generate temporary password
    const tempPassword = crypto.randomBytes(12).toString('base64url');
    
    // Check if user already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, auth_user_id, phone')
      .eq('email', email)
      .single();

    let authUserId: string;
    let profileId: string;

    if (existingProfile?.auth_user_id) {
      // User already has auth account
      authUserId = existingProfile.auth_user_id;
      profileId = existingProfile.id;
    } else {
      // Create new Supabase Auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          name,
          phone,
        },
      });

      if (authError) {
        console.error('Error creating auth user:', authError);
        return NextResponse.json(
          { error: 'Failed to create user account' },
          { status: 500 }
        );
      }

      authUserId = authData.user.id;

      // Create or update profile
      if (existingProfile) {
        // Update existing profile with auth_user_id
        const { data: updatedProfile, error: updateError } = await supabase
          .from('profiles')
          .update({
            auth_user_id: authUserId,
            name,
            phone: phone || existingProfile.phone,
            needs_password_reset: true,
          })
          .eq('id', existingProfile.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating profile:', updateError);
          return NextResponse.json(
            { error: 'Failed to update profile' },
            { status: 500 }
          );
        }

        profileId = updatedProfile.id;
      } else {
        // Create new profile
        const { data: newProfile, error: profileError } = await supabase
          .from('profiles')
          .insert({
            email,
            name,
            phone,
            auth_user_id: authUserId,
            needs_password_reset: true,
          })
          .select()
          .single();

        if (profileError) {
          console.error('Error creating profile:', profileError);
          return NextResponse.json(
            { error: 'Failed to create profile' },
            { status: 500 }
          );
        }

        profileId = newProfile.id;
      }
    }

    // Link squares to user
    if (selectedSquareIds && selectedSquareIds.length > 0) {
      const { error: squaresError } = await supabase
        .from('grid_squares')
        .update({
          user_id: profileId,
          status: 'paid',
          paid_at: new Date().toISOString(),
        })
        .in('id', selectedSquareIds);

      if (squaresError) {
        console.error('Error linking squares:', squaresError);
      }
    }

    // Generate password reset token
    const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
    });

    if (resetError) {
      console.error('Error generating reset link:', resetError);
    }

    // Send welcome email with password reset link
    const resetLink = resetData?.properties?.action_link;
    const resend = getResend();

    if (resetLink && resend) {
      try {
        await resend.emails.send({
          from: 'Super Bowl Pool <noreply@michaelwilliamsscholarship.com>',
          to: email,
          subject: 'Welcome to the Super Bowl Pool! Set Your Password',
          html: `
            <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #232842; margin-bottom: 10px;">Welcome to the Super Bowl Pool!</h1>
                <p style="color: #666; font-size: 16px;">Michael Williams Memorial Scholarship Fund</p>
              </div>

              <div style="background: #f9f9f9; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <p style="color: #333; font-size: 16px; line-height: 1.6;">
                  Hi <strong>${name}</strong>,
                </p>
                <p style="color: #333; font-size: 16px; line-height: 1.6;">
                  Thank you for participating in our Super Bowl Pool! Your squares have been reserved.
                </p>
                <p style="color: #333; font-size: 16px; line-height: 1.6;">
                  To view your squares and track the game, please set your password by clicking the button below:
                </p>
              </div>

              <div style="text-align: center; margin: 32px 0;">
                <a href="${resetLink}" style="display: inline-block; background: #cda33b; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                  Set Your Password
                </a>
              </div>

              <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
                <p style="color: #888; font-size: 14px; text-align: center;">
                  Good luck! All proceeds support the Michael Williams Memorial Scholarship Fund.
                </p>
              </div>
            </div>
          `,
        });
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError);
        // Don't fail the request if email fails - user is still registered
      }
    }

    return NextResponse.json({
      success: true,
      authUserId,
      profileId,
      message: 'User registered successfully. Check your email for login instructions.',
    });
  } catch (error) {
    console.error('Auto-register error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



