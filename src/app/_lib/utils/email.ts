'use server';

interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail({ to, subject, text, html }: SendEmailOptions) {
  try {
    // Lazy import to prevent Turbopack MODULE_UNPARSABLE error.
    // nodemailer uses raw Node.js net/tls modules which Turbopack can't parse at module load time.
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.default.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: `"School Management System" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html,
    });

    console.log('Email sent: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('CRITICAL: Error sending email via SMTP:', error);
    return { success: false, error: error.message || 'Unknown SMTP error' };
  }
}
