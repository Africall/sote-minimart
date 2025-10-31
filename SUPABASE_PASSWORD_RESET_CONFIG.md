# Supabase Password Reset Configuration Guide

## ⚠️ IMPORTANT: Required Configuration

If the password reset email link is redirecting to login instead of `/reset-password`, you need to configure Supabase properly.

## Step-by-Step Configuration

### 1. Configure Redirect URLs in Supabase Dashboard

1. Go to your **Supabase Dashboard**
2. Navigate to **Authentication > URL Configuration**
3. Add these redirect URLs:

   **For Development:**
   ```
   http://localhost:8081/reset-password
   http://localhost:5173/reset-password
   ```

   **For Production:**
   ```
   https://yourdomain.com/reset-password
   ```

4. Set the **Site URL** to your main domain:
   - Development: `http://localhost:8081`
   - Production: `https://yourdomain.com`

5. Click **Save**

### 2. Configure Email Template

1. Go to **Authentication > Email Templates**
2. Select **Reset Password** template
3. Update the email body to use the correct redirect:

```html
<h2>Reset Your Password</h2>
<p>Hi there,</p>
<p>We received a request to reset your password. Click the button below to set a new password:</p>
<p><a href="{{ .SiteURL }}/reset-password?token={{ .Token }}&type=recovery">Reset Password</a></p>
<p>Or copy this link: {{ .SiteURL }}/reset-password?token={{ .Token }}&type=recovery</p>
<p>If you didn't request this, you can safely ignore this email.</p>
<p>This link will expire in 1 hour.</p>
```

### 3. Alternative: Use the Confirmation URL

If the above doesn't work, use the built-in `ConfirmationURL`:

```html
<h2>Reset Your Password</h2>
<p>Hi there,</p>
<p>We received a request to reset your password. Click the button below to set a new password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
<p>If you didn't request this, you can safely ignore this email.</p>
<p>This link will expire in 1 hour.</p>
```

### 4. Verify the redirectTo Parameter

In your code, ensure the redirect URL is correct. Check `src/contexts/AuthContext.tsx`:

```typescript
requestPasswordReset: async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  // ...
}
```

This should automatically use:
- `http://localhost:8081/reset-password` in development
- Your production URL in production

## Testing the Configuration

1. **Request Password Reset:**
   - Go to `/forgot-password`
   - Enter your email
   - Click "Send Reset Link"

2. **Check Your Email:**
   - Open the password reset email
   - Look at the link URL
   - It should contain `/reset-password` in the path

3. **Click the Link:**
   - Should redirect to `/reset-password`
   - Should NOT redirect to `/login`

4. **Enter New Password:**
   - Type your new password
   - Confirm it
   - Submit the form

## Troubleshooting

### Issue: Still redirecting to login

**Solution 1: Check Allowed Redirect URLs**
- Ensure your redirect URL is in the allowed list in Supabase
- Include both `http://` and `https://` versions if needed

**Solution 2: Clear Browser Cache**
- Clear cookies and cache
- Try in incognito/private window

**Solution 3: Check Supabase Logs**
- Go to Supabase Dashboard > Logs
- Look for authentication errors
- Check what URL Supabase is trying to use

**Solution 4: Verify Environment**
```bash
# Check what URL is being used
console.log(window.location.origin); // Should show your current domain
```

### Issue: Link expires too quickly

In Supabase Dashboard:
- Go to **Authentication > Providers > Email**
- Find "Password Recovery" settings
- Increase expiry time (default is 1 hour)

### Issue: Email not received

1. Check Supabase logs for email sending errors
2. Check spam/junk folder
3. Verify email provider is configured
4. For development, use Supabase Inbucket at `http://localhost:54324`

## Production Checklist

Before deploying to production:

- [ ] Configure production redirect URLs in Supabase
- [ ] Update Site URL to production domain
- [ ] Configure custom SMTP provider (not Supabase default)
- [ ] Test password reset flow end-to-end
- [ ] Verify emails are being delivered
- [ ] Check that links redirect correctly
- [ ] Ensure SSL/HTTPS is enabled

## Common Mistakes

1. ❌ **Forgetting to add redirect URL to allowed list**
   - ✅ Add it in Authentication > URL Configuration

2. ❌ **Using wrong Site URL**
   - ✅ Make sure it matches your actual domain

3. ❌ **Email template using wrong variable**
   - ✅ Use `{{ .ConfirmationURL }}` or proper token format

4. ❌ **Not saving changes in Supabase**
   - ✅ Always click Save after making changes

## Need More Help?

If you're still having issues:

1. Check Supabase documentation: https://supabase.com/docs/guides/auth
2. Look at Supabase logs for specific error messages
3. Verify your email template is correct
4. Test with different browsers
5. Check browser console for JavaScript errors

## Current Configuration Check

Run this in your browser console on the forgot password page:

```javascript
console.log('Origin:', window.location.origin);
console.log('Expected redirect:', `${window.location.origin}/reset-password`);
```

This will show you what URL is being used for the redirect.
