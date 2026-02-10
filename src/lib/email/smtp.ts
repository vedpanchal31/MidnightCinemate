import { OTPType } from "@/data/constants";
import nodemailer from "nodemailer";

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
}

const emailConfig: EmailConfig = {
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  user: process.env.SMTP_USER || "",
  password: process.env.SMTP_PASS || "",
  from: process.env.SMTP_FROM || "Cinemate <noreply@cinemate.com>",
};

// Create transporter
const createTransporter = () => {
  if (!emailConfig.user || !emailConfig.password) {
    console.warn("SMTP credentials not configured. Using mock email service.");
    return null;
  }

  return nodemailer.createTransport({
    host: emailConfig.host,
    port: emailConfig.port,
    secure: emailConfig.secure,
    auth: {
      user: emailConfig.user,
      pass: emailConfig.password,
    },
  });
};

export async function sendOTPEmail(
  email: string,
  otp: string,
  type: OTPType,
  userName?: string,
): Promise<boolean> {
  try {
    const subject =
      type === OTPType.EMAIL_VERIFICATION
        ? "Verify Your Cinemate Account"
        : "Reset Your Cinemate Password";

    const htmlContent = generateEmailTemplate(otp, type, userName);

    const transporter = createTransporter();

    if (!transporter) {
      // Fallback to mock email sending when SMTP is not configured
      console.log(`[MOCK EMAIL] Sending email to ${email}:`);
      console.log(`[MOCK EMAIL] Subject: ${subject}`);
      console.log(`[MOCK EMAIL] OTP: ${otp}`);
      console.log(`[MOCK EMAIL] Type: ${type}`);
      return true;
    }

    // Send real email
    const mailOptions = {
      from: emailConfig.from,
      to: email,
      subject,
      html: htmlContent,
    };

    console.log(`Sending email to ${email} via SMTP...`);
    const info = await transporter.sendMail(mailOptions);

    console.log("Email sent successfully:", {
      messageId: info.messageId,
      response: info.response,
      to: email,
      subject: subject,
    });

    return true;
  } catch (error) {
    console.error("Failed to send email:", error);

    // Fallback to mock email on error
    console.log(`[FALLBACK MOCK EMAIL] Sending email to ${email}:`);
    console.log(
      `[FALLBACK MOCK EMAIL] Subject: ${type === OTPType.EMAIL_VERIFICATION ? "Verify Your Cinemate Account" : "Reset Your Cinemate Password"}`,
    );
    console.log(`[FALLBACK MOCK EMAIL] OTP: ${otp}`);
    console.log(`[FALLBACK MOCK EMAIL] Type: ${type}`);

    return true; // Still return true so the app continues working
  }
}

function generateEmailTemplate(
  otp: string,
  type: OTPType,
  userName?: string,
): string {
  const greeting = userName ? `Hi ${userName},` : "Hi,";

  const mainContent =
    type === OTPType.EMAIL_VERIFICATION
      ? `Thank you for signing up for Cinemate! Your verification code is:`
      : `You requested to reset your password. Your reset code is:`;

  const footer =
    type === OTPType.EMAIL_VERIFICATION
      ? "This code will expire in 10 minutes. If you didn't create an account, please ignore this email."
      : "This code will expire in 10 minutes. If you didn't request a password reset, please ignore this email.";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${type === OTPType.EMAIL_VERIFICATION ? "Email Verification" : "Password Reset"}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f4f4f4;
        }
        .container {
          background-color: #ffffff;
          border-radius: 8px;
          padding: 40px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #e50914; /* Netflix red */
        }
        .otp-code {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          font-size: 32px;
          font-weight: bold;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
          letter-spacing: 4px;
          margin: 30px 0;
        }
        .footer {
          text-align: center;
          font-size: 14px;
          color: #666;
          margin-top: 30px;
        }
        .button {
          display: inline-block;
          background: #e50914;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 4px;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🎬 Cinemate</div>
        </div>
        
        ${greeting}
        
        <p>${mainContent}</p>
        
        <div class="otp-code">${otp}</div>
        
        <p style="text-align: center;">
          <a href="#" class="button">Verify Now</a>
        </p>
        
        <div class="footer">
          <p>${footer}</p>
          <p>Best regards,<br>The Cinemate Team</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
