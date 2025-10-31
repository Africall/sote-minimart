# Password Reset Feature Setup Guide

This document explains how the password reset feature works and what configuration is needed in Supabase.

## Overview

The forgot password feature has been implemented with the following components:

1. **ForgotPasswordPage** (`/forgot-password`) - Where users request a password reset
2. **ResetPasswordPage** (`/reset-password`) - Where users set their new password
3. **AuthContext** - Contains `requestPasswordReset()` and `resetPassword()` methods

## How It Works

### User Flow

1. User clicks "Forgot Password?" on the login page
2. User enters their email address
3. System sends a password reset email via Supabase Auth
4. User clicks the link in the email
5. User is redirected to `/reset-password` with a token
6. User enters and confirms their new password
7. Password is updated and user is redirected to login

### Technical Flow

1. `requestPasswordReset(email)` calls `supabase.auth.resetPasswordForEmail()`
2. Supabase sends email with magic link containing token
3. Link redirects to: `{YOUR_SITE_URL}/reset-password#access_token=...`
4. `resetPassword(newPassword)` calls `supabase.auth.updateUser()`
5. Supabase updates the user's password

## Supabase Configuration

### 1. Email Templates (Important!)

Go to **Authentication > Email Templates** in your Supabase dashboard and configure the "Reset Password" template:

**Subject:** Reset Your Password

**Body:**
```html
<h2>Reset Your Password</h2>
<p>Hi there,</p>
<p>We received a request to reset your password. Click the button below to set a new password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
<p>If you didn't request this, you can safely ignore this email.</p>
<p>This link will expire in 1 hour.</p>
```

### 2. Site URL Configuration

In **Authentication > URL Configuration**, ensure:

- **Site URL**: Set to your production URL (e.g., `https://yourdomain.com`)
- **Redirect URLs**: Add your domain and localhost for development:
  - `http://localhost:5173/reset-password`
  - `https://yourdomain.com/reset-password`

### 3. Email Provider Setup

Make sure you have configured an email provider in **Project Settings > Auth**:

- For development: Supabase provides a built-in email service (limited)
- For production: Configure a custom SMTP provider (SendGrid, AWS SES, etc.)

## Development Testing

### Local Testing

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:5173/forgot-password`

3. Enter a test user's email address

4. Check your email inbox (or Supabase logs for dev emails)

5. Click the reset link and set a new password

### Supabase Inbucket (Development Emails)

For local development with Supabase CLI:

1. Start Supabase: `npx supabase start`
2. Access Inbucket at: `http://localhost:54324`
3. View all development emails sent by your local instance

## Security Considerations

1. **Token Expiration**: Reset tokens expire after 1 hour by default
2. **One-Time Use**: Reset links can only be used once
3. **HTTPS**: Always use HTTPS in production for secure token transmission
4. **Rate Limiting**: Supabase has built-in rate limiting for password reset requests

## Troubleshooting

### Email Not Received

- Check spam/junk folder
- Verify email provider configuration in Supabase
- Check Supabase logs for email sending errors
- Ensure the email address exists in your user database

### Reset Link Not Working

- Verify redirect URLs are configured correctly
- Check that the token hasn't expired (1 hour limit)
- Ensure the link hasn't been used already
- Verify Site URL matches your actual domain

### Password Update Failing

- Ensure password meets minimum requirements (6 characters)
- Check browser console for specific error messages
- Verify user has a valid session from the reset link
- Check Supabase Auth logs for detailed error information

## Code Reference

### AuthContext Methods

```typescript
// Request password reset email
await requestPasswordReset(email: string): Promise<void>

// Update password with new value
await resetPassword(newPassword: string): Promise<void>
```

### Pages

- `/forgot-password` - ForgotPasswordPage component
- `/reset-password` - ResetPasswordPage component

### Routes

Configured in `src/App.tsx`:
```typescript
<Route path="/forgot-password" element={<ForgotPasswordPage />} />
<Route path="/reset-password" element={<ResetPasswordPage />} />
```

## Additional Features

The implementation includes:

- ✅ Email validation
- ✅ Password strength indicator
- ✅ Password confirmation matching
- ✅ Loading states
- ✅ User-friendly error messages
- ✅ Success confirmations
- ✅ Accessibility features
- ✅ Responsive design
- ✅ Back navigation to login

## Next Steps

1. Configure Supabase email templates
2. Set up production email provider
3. Test the complete flow in development
4. Deploy and test in production
5. Monitor email delivery rates
6. Consider adding additional security measures (e.g., CAPTCHA)
