import { NextRequest, NextResponse } from 'next/server';
import { getFellowById, updateFellow } from '@/lib/fellows-service';

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
    return NextResponse.json({ success: true, data: fellow });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch candidate' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updates = await req.json();
    const updated = await updateFellow(params.id, updates);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Fellow not found or update failed' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update candidate' },
      { status: 500 }
    );
  }
}

