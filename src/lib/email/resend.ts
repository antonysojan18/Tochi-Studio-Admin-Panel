import { Resend } from 'resend';
import { Fellow } from '@/types/fellow';
import { EmailTemplateType, generateEmailHtml, getEmailSubject } from './templates';

const apiKey = process.env.RESEND_API_KEY;
const resendClient = apiKey ? new Resend(apiKey) : null;

// Default sender address: Resend provides onboarding@resend.dev for testing, or custom domain
const FROM_EMAIL = process.env.EMAIL_FROM || 'Tochi .dev Studio <onboarding@resend.dev>';

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  mocked?: boolean;
  error?: string;
}

export async function sendFellowEmail({
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

  // If Resend API key is configured, send real email
  if (resendClient && apiKey) {
    try {
      const response = await resendClient.emails.send({
        from: FROM_EMAIL,
        to: [recipient],
        replyTo: 'tochi.devstudio@gmail.com',
        subject,
        html,
        attachments: attachments.map(a => ({
          filename: a.filename,
          content: a.content,
        })),
      });

      if (response.error) {
        console.error('[Resend Error]', response.error);
        return {
          success: false,
          error: response.error.message || 'Failed to dispatch via Resend',
        };
      }

      return {
        success: true,
        messageId: response.data?.id,
        mocked: false,
      };
    } catch (err: any) {
      console.error('[Resend Exception]', err);
      return {
        success: false,
        error: err.message || 'Internal error dispatching email',
      };
    }
  }

  // Graceful simulation mode when API key is not yet set
  console.log(`[Email Simulated - Resend API Key not configured]`);
  console.log(`To: ${recipient}`);
  console.log(`Subject: ${subject}`);
  console.log(`Attachment: ${pdfFilename || 'None'}`);

  return {
    success: true,
    messageId: `sim_${Date.now()}`,
    mocked: true,
  };
}

