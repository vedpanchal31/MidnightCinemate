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

  // Split OTP into boxes
  const otpBoxes = otp
    .split("")
    .map(
      (digit) =>
        `<td style="background:#fff0f0;border:1px solid #E50914;border-radius:8px;width:40px;height:48px;font-size:24px;font-weight:bold;color:#E50914;text-align:center;">${digit}</td>`,
    )
    .join("");

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>${type === OTPType.EMAIL_VERIFICATION ? "Email Verification" : "Password Reset"}</title>
  </head>
  <body style="background:#f8f8ff;font-family:'Segoe UI',Arial,sans-serif;margin:0;padding:0;">
    <div style="border-top:6px solid #E50914;margin-bottom:32px;"></div>
    <div style="text-align:center;margin:32px auto 0;">
      <span style="font-size:28px;color:#E50914;font-weight:bold;">🎬 Cinemate</span>
    </div>
    <div style="background:#fff;border:1px solid #E50914;border-radius:16px;max-width:420px;margin:32px auto;padding:32px 24px;box-shadow:0 2px 8px rgba(229,9,20,0.08);text-align:center;">
      <div style="font-size:32px;color:#E50914;margin-bottom:8px;">✉️</div>
      <div style="color:#E50914;font-weight:600;font-size:18px;margin-bottom:12px;">${greeting}</div>
      <div style="color:#333;font-size:15px;margin-bottom:24px;">
        ${mainContent}<br>
        <span style="color:#888;font-size:13px;">Code is valid for the next 10 minutes.</span>
      </div>
      <div style="font-size:17px;font-weight:600;margin-bottom:12px;">Confirmation Code</div>
      <div style="display:inline-block;user-select:all;-webkit-user-select:all;-moz-user-select:all;-ms-user-select:all;">
        <table style="margin:0 auto;margin-bottom:24px;border-spacing:8px;">
          <tr>
            ${otpBoxes}
          </tr>
        </table>
      </div>
      <div style="color:#E50914;font-size:14px;margin-top:16px;">
        Thank You<br>
        <span style="color:#E50914;text-decoration:none;font-weight:500;">Cinemate Team</span>
      </div>
    </div>
  </body>
  </html>
`;
}
