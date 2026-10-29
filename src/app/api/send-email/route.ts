import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getFellowById, updateFellow } from '@/lib/fellows-service';
import { sendGmailEmail } from '@/lib/email/gmail';
import { generateOfferLetterPdf } from '@/lib/pdf/generate-offer-letter';
import { generateCertificatePdf } from '@/lib/pdf/generate-certificate';
import { EmailTemplateType } from '@/lib/email/templates';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fellowId, type, customRecipient } = body as {
      fellowId: string;
      type: EmailTemplateType;
      customRecipient?: string;
    };

    if (!fellowId || !type) {
      return NextResponse.json(
        { success: false, error: 'fellowId and type are required' },
        { status: 400 }
      );
    }

    const fellow = await getFellowById(fellowId);
    if (!fellow) {
      return NextResponse.json(
        { success: false, error: 'Candidate not found' },
        { status: 404 }
      );
    }

    const host = req.headers.get('host');
    const protocol = host && (host.includes('localhost') || host.includes('127.0.0.1')) ? 'http' : 'https';
    const hostUrl = host ? `${protocol}://${host}` : 'https://tochidevstudio.in';

    let pdfBuffer: Uint8Array | undefined;
    let pdfFilename: string | undefined;

    // Generate dynamic vector attachments based on email type
    if (type === 'OFFER') {
      pdfBuffer = await generateOfferLetterPdf(fellow, hostUrl);
      pdfFilename = `Offer_Letter_${fellow.student_id}.pdf`;
      // Update offer_letter_url if not set
      await updateFellow(fellow.id, {
        offer_letter_url: `/api/pdf/offer-letter/${fellow.id}`,
        status: fellow.status === 'APPLIED' ? 'OFFER_SENT' : fellow.status,
      });
    } else if (type === 'CERTIFICATE') {
      pdfFilename = `Certificate_${fellow.student_id}.pdf`;

      // Check if user uploaded a custom certificate PDF
      let customUploadedPath = '';
      if (fellow.certificate_url && fellow.certificate_url.startsWith('/uploads/certificates/')) {
        customUploadedPath = path.join(process.cwd(), 'public', fellow.certificate_url);
      } else {
        const safeStudentId = fellow.student_id.replace(/[^a-zA-Z0-9_-]/g, '_');
        const defaultPath = path.join(process.cwd(), 'public', 'uploads', 'certificates', `Certificate_${safeStudentId}.pdf`);
        if (fs.existsSync(defaultPath)) {
          customUploadedPath = defaultPath;
        }
      }

      if (customUploadedPath && fs.existsSync(customUploadedPath)) {
        pdfBuffer = fs.readFileSync(customUploadedPath);
      } else {
        pdfBuffer = await generateCertificatePdf(fellow, hostUrl);
      }

      // Mark as certified
      await updateFellow(fellow.id, {
        certificate_url: fellow.certificate_url || `/api/pdf/certificate/${fellow.id}`,
        status: 'CERTIFIED',
      });
    }

    const result = await sendGmailEmail({
      to: customRecipient || fellow.email,
      fellow,
      type,
      pdfBuffer,
      pdfFilename,
      hostUrl,
    });

    return NextResponse.json({
      success: result.success,
      mocked: result.mocked || false,
      messageId: result.messageId,
      error: result.error,
      candidate: {
        id: fellow.id,
        student_id: fellow.student_id,
        email: customRecipient || fellow.email,
      },
    });
  } catch (error: any) {
    console.error('[SendEmail API Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to dispatch email' },
      { status: 500 }
    );
  }
}
