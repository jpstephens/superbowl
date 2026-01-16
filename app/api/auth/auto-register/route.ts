import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';
import { sendEmailSafe } from '@/lib/email/send';
import { rateLimitResponse } from '@/lib/rateLimit';
import {
  emailWrapper,
  contentCard,
  sectionTitle,
  paragraph,
  highlight,
  goldButton,
} from '@/lib/email/templates';

/**
 * Auto-registers a user after payment
 * Creates Supabase Auth account, profile, and sends login email
 */
export async function POST(request: Request) {
  // Rate limit: 5 requests per minute per IP
  const rateLimited = rateLimitResponse(request, 5, 60000);
  if (rateLimited) return rateLimited;

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

    if (resetLink) {
      const welcomeHtml = emailWrapper(`
        ${sectionTitle('Welcome!', '🏈')}

        ${contentCard(`
          ${paragraph(`Hi ${highlight(name)}! 👋`)}

          ${paragraph(`Thank you for joining the Super Bowl Pool! Your squares have been reserved.`)}

          ${paragraph(`To view your squares and track the game on Super Bowl Sunday, please set your password:`)}
        `)}

        ${goldButton('Set Your Password', resetLink)}

        ${contentCard(`
          <p style="color: rgba(255, 255, 255, 0.6); font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px 0;">
            What's Next?
          </p>
          ${paragraph(`<strong>1.</strong> Set your password using the button above`, { muted: true })}
          ${paragraph(`<strong>2.</strong> Check back before the game - numbers will be randomly assigned`, { muted: true })}
          ${paragraph(`<strong>3.</strong> Watch live during the Super Bowl to see if you win!`, { muted: true })}
        `)}
      `);

      await sendEmailSafe({
        to: email,
        subject: 'Welcome to the Super Bowl Pool! Set Your Password',
        html: welcomeHtml,
      });
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



