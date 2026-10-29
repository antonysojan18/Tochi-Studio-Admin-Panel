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
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'certificates');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filename = `Certificate_${safeStudentId}.pdf`;
    const targetPath = path.join(uploadDir, filename);
    fs.writeFileSync(targetPath, buffer);

    const certificateUrl = `/uploads/certificates/${filename}`;

    // Update fellow record
    const updated = await updateFellow(fellow.id, {
      certificate_url: certificateUrl,
      status: 'CERTIFIED',
    });

    return NextResponse.json({
      success: true,
      message: 'Certificate PDF successfully uploaded and attached',
      certificate_url: certificateUrl,
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

