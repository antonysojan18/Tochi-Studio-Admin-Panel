import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getFellowById, updateFellow } from '@/lib/fellows-service';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const fellow = await getFellowById(params.id);
    if (!fellow) {
      return NextResponse.json(
        { success: false, error: 'Candidate not found' },
        { status: 404 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No certificate file provided' },
        { status: 400 }
      );
    }

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      return NextResponse.json(
        { success: false, error: 'File must be a PDF document (.pdf)' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Clean safe filename based on student ID
    const safeStudentId = fellow.student_id.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `Certificate_${safeStudentId}.pdf`;

    // Attempt local/tmp filesystem cache safely (prevents EROFS crashes on Vercel)
    try {
      const publicUploadDir = path.join(process.cwd(), 'public', 'uploads', 'certificates');
      if (!fs.existsSync(publicUploadDir)) {
        fs.mkdirSync(publicUploadDir, { recursive: true });
      }
      fs.writeFileSync(path.join(publicUploadDir, filename), buffer);
    } catch {
      try {
        const tmpDir = path.join('/tmp', 'uploads', 'certificates');
        if (!fs.existsSync(tmpDir)) {
          fs.mkdirSync(tmpDir, { recursive: true });
        }
        fs.writeFileSync(path.join(tmpDir, filename), buffer);
      } catch (err) {
        // Filesystem is completely read-only on serverless; base64 persistence in DB will handle it
      }
    }

    // Persist as high-fidelity Base64 data URL directly into database so it persists across Vercel Lambdas
    const base64Data = buffer.toString('base64');
    const persistentDataUrl = `data:application/pdf;base64,${base64Data}`;

    // Update fellow record in Supabase / store
    const updated = await updateFellow(fellow.id, {
      certificate_url: persistentDataUrl,
      status: 'CERTIFIED',
    });

    const publicEndpoint = `/api/pdf/certificate/${fellow.id}`;

    return NextResponse.json({
      success: true,
      message: 'Certificate PDF successfully uploaded and attached',
      certificate_url: publicEndpoint,
      filename,
      sizeBytes: buffer.length,
      candidate: updated,
    });
  } catch (error: any) {
    console.error('[Upload Certificate Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to upload certificate PDF' },
      { status: 500 }
    );
  }
}

