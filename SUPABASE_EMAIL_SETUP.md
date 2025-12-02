# Supabase Email Configuration Guide

This guide will help you configure custom email templates for Bookshelf authentication emails in Supabase.

## Prerequisites

- Access to your Supabase project dashboard
- Admin access to configure email settings

## Step 1: Access Email Templates

1. Log in to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your Bookshelf project
3. Navigate to **Authentication** → **Email Templates** in the left sidebar

## Step 2: Configure Site URL

1. Go to **Authentication** → **URL Configuration**
2. Set the **Site URL** to: `https://mybooksshelf.vercel.app/`
3. Add **Redirect URLs**:
   - `https://mybooksshelf.vercel.app/**`
   - `https://mybooksshelf.vercel.app/auth/callback`
4. Click **Save**

## Step 3: Configure Email Templates

### 3.1 Welcome Email (Sign Up)

1. In **Email Templates**, find **"Confirm signup"** template
2. Click **Edit** or **Customize**
3. Copy the content from `email-templates/welcome-email.html`
4. Paste it into the email template editor
5. **Important**: Replace `{{ .ConfirmationURL }}` with `{{ .ConfirmationURL }}` (Supabase will automatically replace this with the actual confirmation link)
6. Set the **Subject** to: `Welcome to Bookshelf! 📚 Start Your Reading Journey`
7. Click **Save**

### 3.2 Confirmation Email

1. In **Email Templates**, find **"Confirm signup"** template (same as above)
2. Use the `email-templates/confirmation-email.html` template
3. Set the **Subject** to: `Confirm Your Email - Bookshelf 📚`
4. Make sure `{{ .ConfirmationURL }}` is included in the template
5. Click **Save**

### 3.3 Magic Link Email (Optional)

If you want to customize the magic link email:

1. Find **"Magic Link"** template
2. You can use a similar design to the confirmation email
3. Set the **Subject** to: `Your Bookshelf Magic Link 📚`
4. Include `{{ .ConfirmationURL }}` for the magic link

### 3.4 Password Reset Email (Optional)

1. Find **"Reset password"** template
2. Use a similar design with appropriate messaging
3. Set the **Subject** to: `Reset Your Bookshelf Password 📚`
4. Include `{{ .ConfirmationURL }}` for the reset link

## Step 4: Configure SMTP Settings (Optional but Recommended)

For better email deliverability, configure custom SMTP:

1. Go to **Settings** → **Auth**
2. Scroll to **SMTP Settings**
3. Enable **Custom SMTP**
4. Configure your SMTP provider (e.g., SendGrid, Mailgun, AWS SES, or Gmail)
5. Enter your SMTP credentials:
   - **Host**: Your SMTP server
   - **Port**: Usually 587 or 465
   - **Username**: Your SMTP username
   - **Password**: Your SMTP password
   - **Sender email**: `noreply@mybooksshelf.vercel.app` (or your domain)
   - **Sender name**: `Bookshelf`

### Recommended SMTP Providers:

- **SendGrid**: Free tier: 100 emails/day
- **Mailgun**: Free tier: 5,000 emails/month
- **AWS SES**: Very affordable, pay-as-you-go
- **Resend**: Modern API, great for transactional emails

## Step 5: Test Email Templates

1. Go to **Authentication** → **Users**
2. Create a test user or use an existing one
3. Trigger the email you want to test:
   - For signup: Create a new account
   - For password reset: Click "Forgot password"
   - For magic link: Use magic link login
4. Check the email inbox to verify:
   - Template renders correctly
   - Links work properly
   - Styling looks good on desktop and mobile
   - All variables are replaced correctly

## Step 6: Verify Redirect URLs

1. After a user confirms their email, they should be redirected back to your app
2. Test the full flow:
   - Sign up → Receive email → Click confirmation link → Should redirect to `https://mybooksshelf.vercel.app/`
3. If redirects aren't working:
   - Check **Redirect URLs** in URL Configuration
   - Ensure the redirect URL in the email template matches your site URL

## Template Variables

Supabase provides these variables you can use in templates:

- `{{ .ConfirmationURL }}` - The confirmation/reset link
- `{{ .Email }}` - User's email address
- `{{ .Token }}` - The confirmation token (if needed)
- `{{ .TokenHash }}` - Hashed token
- `{{ .SiteURL }}` - Your configured site URL
- `{{ .RedirectTo }}` - Redirect URL after confirmation

## Important Notes

1. **Email HTML**: Supabase supports HTML emails, so you can use the full HTML templates provided
2. **Link Expiration**: Confirmation links expire after 24 hours by default (configurable in Auth settings)
3. **Rate Limiting**: Supabase has rate limits on emails to prevent abuse
4. **Testing**: Always test emails in a real inbox (not just preview) to ensure they render correctly
5. **Mobile Responsive**: The templates provided are mobile-responsive, but test on actual devices

## Troubleshooting

### Emails not sending?
- Check SMTP configuration
- Verify email limits haven't been exceeded
- Check Supabase logs for errors

### Links not working?
- Verify Site URL is set correctly
- Check Redirect URLs include your domain
- Ensure `{{ .ConfirmationURL }}` is in the template

### Template not rendering?
- Check HTML syntax
- Verify all template variables are correct
- Test with a simple template first, then add complexity

### Styling issues?
- Some email clients strip CSS - the templates use inline styles where possible
- Test in multiple email clients (Gmail, Outlook, Apple Mail)
- Use email testing tools like Litmus or Email on Acid

## Security Best Practices

1. **Never expose tokens** in email templates unnecessarily
2. **Use HTTPS** for all redirect URLs
3. **Set appropriate expiration times** for confirmation links
4. **Monitor email sending** for suspicious activity
5. **Use custom SMTP** for better deliverability and control

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase Email Templates Guide](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Supabase SMTP Configuration](https://supabase.com/docs/guides/auth/auth-smtp)

---

**Need Help?** Check the Supabase documentation or reach out to their support team.

