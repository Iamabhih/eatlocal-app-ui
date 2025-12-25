# Email Verification Setup Guide

## Enable Email Verification in Supabase

### Step 1: Configure Supabase Dashboard

1. Go to your Supabase project: https://app.supabase.com
2. Navigate to **Authentication** → **Settings**
3. Under **Email Auth** settings:
   - ✅ Enable "Confirm email" toggle
   - Set "Confirmation email template" (optional customization)
4. Click **Save**

### Step 2: Email Templates (Optional Customization)

**Confirmation Email Template:**
```html
<h2>Confirm your email for EatLocal</h2>
<p>Hi {{ .Email }},</p>
<p>Welcome to EatLocal! Please confirm your email address to get started.</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your email</a></p>
<p>Or copy and paste this link: {{ .ConfirmationURL }}</p>
<p>This link expires in 24 hours.</p>
<p>If you didn't create this account, please ignore this email.</p>
```

### Step 3: Update Frontend Code

The Auth.tsx page already handles the verification flow:

**src/pages/Auth.tsx** - Shows message after signup:
```typescript
// After successful signup
toast.success("Check your email for verification link!");
```

### Step 4: Verification Redirect

1. In Supabase Dashboard → **Authentication** → **URL Configuration**
2. Add your site URL to "Site URL":
   - Development: `http://localhost:8080`
   - Production: `https://yoursite.lovable.app` or custom domain
3. Add redirect URLs:
   - Development: `http://localhost:8080/**`
   - Production: `https://yoursite.lovable.app/**`

### Step 5: Resend Verification Email (Optional Enhancement)

Add to `src/pages/Auth.tsx`:

```typescript
const resendVerification = async (email: string) => {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
  });

  if (error) {
    toast.error("Failed to resend verification email");
  } else {
    toast.success("Verification email resent!");
  }
};
```

### Step 6: Testing

1. Sign up with a real email address
2. Check inbox for confirmation email
3. Click the confirmation link
4. Verify redirect to app
5. Try logging in - should work after confirmation
6. Try logging in without confirmation - should show error

### Step 7: Production Checklist

- [ ] Email confirmation enabled in Supabase dashboard
- [ ] Site URL configured for production domain
- [ ] Redirect URLs added (production + development)
- [ ] Email template customized (optional)
- [ ] SMTP settings configured (if using custom SMTP)
- [ ] Test signup → confirm → login flow
- [ ] Verify email deliverability

### Troubleshooting

**Problem:** Verification emails not arriving
**Solution:**
- Check spam folder
- Verify SMTP settings in Supabase
- Check Supabase logs for email errors
- Use a verified email provider (not temp emails)

**Problem:** Confirmation link redirects to wrong URL
**Solution:**
- Update "Site URL" in Supabase Auth settings
- Add correct redirect URLs
- Clear browser cache

**Problem:** Users can't login without confirming
**Solution:**
- This is expected behavior when email confirmation is enabled
- Show clear message: "Please check your email to verify your account"
- Add "Resend verification email" button

### Email Deliverability

For production, consider:
- Using a verified domain for FROM address
- Setting up SPF, DKIM, DMARC records
- Using a reputable email service (Resend, SendGrid, AWS SES)
- Monitoring bounce rates
- Handling undeliverable emails

### Auto-Confirm for Development

In Supabase dashboard, you can enable "Disable email confirmations" for development:
- **Development:** Disable email confirmations (auto-confirm)
- **Production:** Enable email confirmations (require verification)

---

**Status:** ✅ Ready to enable (simple dashboard toggle)
**Estimated Time:** 5 minutes to enable
**Impact:** Prevents spam accounts, improves security
