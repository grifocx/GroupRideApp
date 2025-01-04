import nodemailer from 'nodemailer';
import { randomBytes } from 'crypto';

// Create a test account using Ethereal Email for development
let transporter: nodemailer.Transporter;

export async function setupEmailTransporter() {
  // Create a test account if we're in development
  if (process.env.NODE_ENV !== 'production') {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  } else {
    // In production, use real SMTP settings
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
}

export function generateVerificationToken(): string {
  return randomBytes(32).toString('hex');
}

export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${process.env.APP_URL || 'http://localhost:5000'}/verify-email?token=${token}`;
  
  const info = await transporter.sendMail({
    from: '"CycleGroup" <noreply@cyclegroup.com>',
    to: email,
    subject: "Verify your email address",
    text: `Welcome to CycleGroup! Please verify your email address by clicking the following link: ${verificationUrl}`,
    html: `
      <div>
        <h1>Welcome to CycleGroup!</h1>
        <p>Please verify your email address by clicking the button below:</p>
        <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px;">
          Verify Email Address
        </a>
        <p>If the button doesn't work, you can also click this link: <a href="${verificationUrl}">${verificationUrl}</a></p>
        <p>If you didn't create this account, you can safely ignore this email.</p>
      </div>
    `,
  });

  if (process.env.NODE_ENV !== 'production') {
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
  }

  return info;
}
