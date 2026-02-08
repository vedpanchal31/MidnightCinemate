# SMTP Configuration for Email Sending
# Replace with your actual SMTP credentials

# Gmail SMTP Example
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=Cinemate <noreply@cinemate.com>

# For Gmail, you'll need to:
# 1. Enable 2-factor authentication on your Gmail account
# 2. Generate an App Password: https://myaccount.google.com/apppasswords
# 3. Use the App Password as SMTP_PASSWORD

# Alternative SMTP Providers:
# Outlook/Hotmail:
# SMTP_HOST=smtp-mail.outlook.com
# SMTP_PORT=587

# SendGrid:
# SMTP_HOST=smtp.sendgrid.net
# SMTP_PORT=587

# Mailgun:
# SMTP_HOST=smtp.mailgun.org
# SMTP_PORT=587
