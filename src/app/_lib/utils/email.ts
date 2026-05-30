'use server';

interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Send email via SMTP (Gmail)
 * Includes comprehensive error handling and logging
 */
export async function sendEmail({ to, subject, text, html }: SendEmailOptions) {
  try {
    // Validate environment variables
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error('CRITICAL: SMTP credentials are not configured in environment variables');
      console.error('Missing: SMTP_USER or SMTP_PASS');
      return {
        success: false,
        error: 'Email service is not properly configured. Please contact system administrator.'
      };
    }

    // Validate recipient email
    if (!to || !to.includes('@')) {
      console.error('Invalid recipient email:', to);
      return { success: false, error: 'Invalid recipient email address.' };
    }

    // Lazy import to prevent Turbopack MODULE_UNPARSABLE error
    const nodemailer = await import('nodemailer');

    // Create transporter with Gmail SMTP
    const transporter = nodemailer.default.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      // Add timeout settings
      connectionTimeout: 5000,
      socketTimeout: 10000,
    });

    // Verify connection before sending
    try {
      await transporter.verify();
      console.log('SMTP connection verified successfully');
    } catch (verifyError: any) {
      console.error('SMTP connection verification failed:', {
        code: verifyError.code,
        message: verifyError.message,
        command: verifyError.command,
      });
      return {
        success: false,
        error: 'Failed to connect to email service. Please try again later.',
      };
    }

    // Send email
    const info = await transporter.sendMail({
      from: `"Skolic - School Management" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html: html || text, // Fallback to text if html not provided
      headers: {
        'X-Mailer': 'Skolic School Management System',
        'X-Email-Type': 'Transactional',
      },
    });

    console.log('✅ Email sent successfully:', {
      to,
      subject,
      messageId: info.messageId,
      response: info.response,
    });

    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    // Detailed error logging for debugging
    console.error('❌ CRITICAL: Error sending email via SMTP:', {
      error_name: error.name,
      error_message: error.message,
      error_code: error.code,
      error_command: error.command,
      recipient: to,
      subject: subject,
      stack: error.stack,
    });

    // Return user-friendly error message
    let userMessage = 'Failed to send email. Please try again later.';
    
    if (error.code === 'EAUTH') {
      userMessage = 'Email authentication failed. The system administrator needs to check SMTP credentials.';
      console.error('⚠️ SMTP Authentication Error - check SMTP_USER and SMTP_PASS in .env.local');
    } else if (error.code === 'ECONNREFUSED') {
      userMessage = 'Unable to connect to email service. Please try again later.';
    } else if (error.code === 'ETIMEDOUT') {
      userMessage = 'Email service timed out. Please try again.';
    }

    return { success: false, error: userMessage };
  }
}
