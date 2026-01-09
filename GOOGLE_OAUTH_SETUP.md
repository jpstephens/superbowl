# Google OAuth Setup Guide

## Step-by-Step Instructions

### Step 1: Go to Google Cloud Console
1. Visit: https://console.cloud.google.com/
2. Sign in with your Google account
3. Create a new project (or select existing one)
   - Click project dropdown at top
   - Click "New Project"
   - Name it: "Super Bowl Pool" (or your choice)
   - Click "Create"

### Step 2: Enable Google+ API
1. In your project, go to **APIs & Services** > **Library**
2. Search for "Google+ API" or "Google Identity"
3. Click on it and click **Enable**

### Step 3: Create OAuth Credentials
1. Go to **APIs & Services** > **Credentials**
2. Click **+ CREATE CREDENTIALS** at the top
3. Select **OAuth client ID**

### Step 4: Configure OAuth Consent Screen (if prompted)
1. If asked to configure consent screen:
   - User Type: **External** (for public use)
   - App name: "Super Bowl Pool"
   - User support email: Your email
   - Developer contact: Your email
   - Click **Save and Continue**
   - Scopes: Click **Save and Continue** (default is fine)
   - Test users: Click **Save and Continue** (skip for now)
   - Click **Back to Dashboard**

### Step 5: Create OAuth Client ID
1. Application type: Select **Web application**
2. Name: "Super Bowl Pool Web"
3. **Authorized redirect URIs**: Click **+ ADD URI**
4. Paste this EXACT URL (from your Supabase settings):
   ```
   https://zlbelhvixjozmjtchmsj.supabase.co/auth/v1/callback
   ```
5. Click **Create**

### Step 6: Copy Your Credentials
After creating, you'll see a popup with:
- **Your Client ID** (looks like: `123456789-abc123def456.apps.googleusercontent.com`)
- **Your Client Secret** (looks like: `GOCSPX-abc123def456`)

**IMPORTANT:** Copy both of these immediately - you won't see the secret again!

### Step 7: Add to Supabase
1. Go back to your Supabase Dashboard
2. Go to **Authentication** > **Providers**
3. Find **Google** and click to expand
4. Enable the toggle: **Enable Sign in with Google**
5. Paste your **Client ID** into the "Client IDs" field
6. Paste your **Client Secret** into the "Client Secret (for OAuth)" field
7. The **Callback URL** should already be filled: `https://zlbelhvixjozmjtchmsj.supabase.co/auth/v1/callback`
8. Click **Save**

### Step 8: Test It
1. Go to your app: `http://localhost:3000/auth/login`
2. Click "Continue with Google"
3. You should be redirected to Google sign-in
4. After signing in, you'll be redirected back to your app

## Troubleshooting

**Error: "redirect_uri_mismatch"**
- Make sure you copied the EXACT callback URL from Supabase
- Check for extra spaces or typos
- The URL must match exactly in Google Cloud Console

**Error: "invalid_client"**
- Double-check your Client ID and Client Secret
- Make sure you copied them correctly (no extra spaces)

**Can't see Client Secret**
- If you lost it, go to Google Cloud Console > Credentials
- Click on your OAuth client
- You can reset the secret if needed

## Quick Checklist
- [ ] Created Google Cloud project
- [ ] Enabled Google+ API
- [ ] Created OAuth client ID (Web application)
- [ ] Added callback URL to authorized redirect URIs
- [ ] Copied Client ID and Client Secret
- [ ] Added credentials to Supabase
- [ ] Enabled Google provider in Supabase
- [ ] Tested login flow



