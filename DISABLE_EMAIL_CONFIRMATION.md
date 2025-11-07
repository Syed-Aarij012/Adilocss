# How to Customize Email Sender Name in Supabase

Change the email sender from "Supabase" to "Adilocs" so users see professional branded emails.

## Steps to Change Email Sender Name:

1. **Go to your Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project: `cuuocsngtpmzuhzfppda`

2. **Navigate to Authentication Settings**
   - Click on "Authentication" in the left sidebar
   - Click on "Email Templates" or "Settings"

3. **Update Sender Name**
   - Look for "Sender name" or "From name" field
   - Change from "Supabase" to **"Adilocs"**
   - You can also update "Sender email" if you have a custom domain

4. **Customize Email Templates (Optional)**
   - Click on "Email Templates"
   - You can customize:
     - **Confirm signup** - Welcome email
     - **Magic Link** - Login link email
     - **Change Email Address** - Email change confirmation
     - **Reset Password** - Password reset email
   
   - In each template, you can customize:
     - Subject line
     - Email body/content
     - Add your logo/branding

5. **Save Changes**
   - Click "Save" at the bottom of each page

## Example Email Template Customization:

**Subject:** Welcome to Adilocs - Confirm Your Email

**Body:**
```
Hi {{ .Name }},

Welcome to Adilocs! We're excited to have you.

Please confirm your email address by clicking the link below:

{{ .ConfirmationURL }}

Best regards,
The Adilocs Team
```

## After Making Changes:

- All emails will show "Adilocs" as the sender
- Users will see your brand name instead of "Supabase"
- More professional and trustworthy appearance

## Note:

For a custom email domain (like noreply@adilocs.com), you'll need to:
1. Set up SMTP settings in Supabase
2. Verify your domain
3. This requires a paid Supabase plan
