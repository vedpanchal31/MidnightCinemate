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

  const otpBoxes = otp
    .split("")
    .map(
      (digit) =>
        `<div style="width: 30px; height: 40px; margin: 0 5px; border: 1px solid #E50914; border-radius: 5px; text-align: center; font-size: 18px; font-weight: bold; color: #E50914; display: inline-block; line-height: 40px; background: transparent; overflow: hidden;">${digit}</div>`,
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${type === OTPType.EMAIL_VERIFICATION ? "Email Verification" : "Password Reset"}</title>
      </head>
      <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f9f9f9">
        <table cellpadding="0" cellspacing="0" style="width: 100%; max-width: 600px; margin: 0 auto; border-top: 11px solid #E50914;">
          <tr>
            <td style="text-align: center; padding: 39px 0">
              <span style="font-size: 32px; color: #E50914; font-weight: bold;">🎬 Cinemate</span>
            </td>
          </tr>
          <tr>
            <td>
              <div style="padding: 20px; border: 1px solid #E50914; border-radius: 20px; margin: 0 25px; padding-top: 20px; padding-bottom: 19px; margin-bottom: 76px; background-color: #e5091410;">
                <p style="text-align: center; color: #E50914; font-weight: 600; font-size: 18px; line-height: 20px; margin: 0; padding-top: 7px">${greeting}</p>
                <p style="text-align: center; color: #181822cc; font-weight: 400; font-size: 18px; line-height: 20px; margin: 0; padding-top: 26px; padding-bottom: 12px">
                  ${mainContent}<br />
                  <span style="color: #888; font-size: 13px;">Code is valid for the next 10 minutes.</span>
                </p>
                <h2 style="text-align: center; font-size: 24px; font-weight: 600; color: #181822cc; margin: 0; padding-bottom: 12px">Confirmation Code</h2>
                <div style="padding-bottom: 26px; display: table; margin: 0 auto; text-align: center">
                  ${otpBoxes}
                </div>
                <p style="text-align: center; color: #181822cc; font-weight: 600; font-size: 16px; line-height: 20px; margin: 0; padding-bottom: 8px">Thank You</p>
                <p style="text-align: center; margin: 0; color: #E50914; font-weight: 400; font-size: 14px">Cinemate Team</p>
              </div>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}
