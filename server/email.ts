
import nodemailer from 'nodemailer';

// For production, use real SMTP credentials
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${process.env.APP_URL || 'https://your-repl-url.replit.dev'}/verify-email?token=${token}`;
  
  await transporter.sendMail({
    from: process.env.SMTP_FROM || '"Cycling App" <noreply@example.com>',
    to: email,
    subject: 'Verify your email address',
    text: `Please verify your email by clicking: ${verifyUrl}`,
    html: `
      <h1>Welcome to Cycling App!</h1>
      <p>Please verify your email address by clicking the link below:</p>
      <a href="${verifyUrl}">Verify Email</a>
    `,
  });
}
