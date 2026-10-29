import nodemailer from 'nodemailer';
import { Fellow } from '@/types/fellow';
import { EmailTemplateType, generateEmailHtml, getEmailSubject } from './templates';

const GMAIL_USER = process.env.GMAIL_USER || process.env.STUDIO_EMAIL || 'tochi.devstudio@gmail.com';
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD; // 16-character Google App Password

export const isGmailConfigured = Boolean(GMAIL_USER && GMAIL_APP_PASSWORD);

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  mocked?: boolean;
  error?: string;
  provider?: 'gmail' | 'simulation';
}

export async function sendGmailEmail({
  to,
  fellow,
  type,
  pdfBuffer,
  pdfFilename,
  hostUrl,
}: {
  to?: string;
  fellow: Fellow;
  type: EmailTemplateType;
  pdfBuffer?: Buffer | Uint8Array;
  pdfFilename?: string;
  hostUrl?: string;
}): Promise<SendEmailResult> {
  const recipient = to || fellow.email;
  const subject = getEmailSubject(type, fellow);
  const html = generateEmailHtml(type, fellow, hostUrl);

  const attachments: Array<{ filename: string; content: Buffer }> = [];
  if (pdfBuffer && pdfFilename) {
    attachments.push({
      filename: pdfFilename,
      content: Buffer.from(pdfBuffer),
    });
  }

  // If Gmail app password is provided, send real transactional email directly from official Gmail
  if (GMAIL_USER && GMAIL_APP_PASSWORD) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: GMAIL_USER,
          // Strip any accidental spaces from 16-char Google App Password
          pass: GMAIL_APP_PASSWORD.replace(/\s+/g, ''),
        },
      });

      const info = await transporter.sendMail({
        from: `"Tochi .dev Studio" <${GMAIL_USER}>`,
        to: recipient,
        replyTo: GMAIL_USER,
        subject,
        html,
        attachments: attachments.map(a => ({
          filename: a.filename,
          content: a.content,
        })),
      });

      console.log(`[Gmail SMTP Success] Email (${type}) sent to ${recipient}, id: ${info.messageId}`);
      return {
        success: true,
        messageId: info.messageId,
        mocked: false,
        provider: 'gmail',
      };
    } catch (err: any) {
      console.error('[Gmail SMTP Error]', err);
      return {
        success: false,
        error: err.message || 'Failed to dispatch email via official Gmail SMTP',
        provider: 'gmail',
      };
    }
  }

  // Safe simulation fallback if GMAIL_APP_PASSWORD is not set yet in .env.local
  console.log(`[Email Simulated] (${type}) for ${recipient} (Configure GMAIL_APP_PASSWORD in .env.local for live delivery)`);
  return {
    success: true,
    mocked: true,
    messageId: `mock-gmail-${Date.now()}`,
    provider: 'simulation',
  };
}

