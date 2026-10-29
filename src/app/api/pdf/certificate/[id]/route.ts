import { NextRequest, NextResponse } from 'next/server';
import { getFellowById } from '@/lib/fellows-service';
import { generateCertificatePdf } from '@/lib/pdf/generate-certificate';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const fellow = await getFellowById(params.id);
    if (!fellow) {
      return NextResponse.json(
        { success: false, error: 'Fellow not found' },
        { status: 404 }
      );
    }

    const host = req.headers.get('host');
    const protocol = host && (host.includes('localhost') || host.includes('127.0.0.1')) ? 'http' : 'https';
    const hostUrl = host ? `${protocol}://${host}` : 'https://tochidevstudio.in';

    const pdfBytes = await generateCertificatePdf(fellow, hostUrl);

    const filename = `Certificate_${fellow.student_id}.pdf`;

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('[Certificate PDF Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate Certificate PDF' },
      { status: 500 }
    );
  }
}

