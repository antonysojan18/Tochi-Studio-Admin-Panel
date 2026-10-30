import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
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

    let pdfBytes: Uint8Array | Buffer;
    const filename = `Certificate_${fellow.student_id}.pdf`;

    // 1. If fellow has an uploaded custom certificate stored as Base64 data URL
    if (fellow.certificate_url && fellow.certificate_url.startsWith('data:application/pdf;base64,')) {
      const base64Data = fellow.certificate_url.replace(/^data:application\/pdf;base64,/, '');
      pdfBytes = Buffer.from(base64Data, 'base64');
    } else {
      // 2. Check for uploaded file on disk (public or /tmp)
      let diskPath = '';
      if (fellow.certificate_url && fellow.certificate_url.startsWith('/uploads/certificates/')) {
        diskPath = path.join(process.cwd(), 'public', fellow.certificate_url);
      } else {
        const safeStudentId = fellow.student_id.replace(/[^a-zA-Z0-9_-]/g, '_');
        const standardPath = path.join(process.cwd(), 'public', 'uploads', 'certificates', `Certificate_${safeStudentId}.pdf`);
        const tmpPath = path.join('/tmp', 'uploads', 'certificates', `Certificate_${safeStudentId}.pdf`);
        if (fs.existsSync(standardPath)) {
          diskPath = standardPath;
        } else if (fs.existsSync(tmpPath)) {
          diskPath = tmpPath;
        }
      }

      if (diskPath && fs.existsSync(diskPath)) {
        pdfBytes = fs.readFileSync(diskPath);
      } else {
        // 3. Fallback to generating authentic high-res certificate
        pdfBytes = await generateCertificatePdf(fellow, hostUrl);
      }
    }

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

