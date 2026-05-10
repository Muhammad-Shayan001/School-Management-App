import { NextResponse } from 'next/server';
import QRCode from 'qrcode';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const data = searchParams.get('data');

  if (!data) {
    return NextResponse.json({ error: 'Data parameter is required' }, { status: 400 });
  }

  try {
    const qrDataUrl = await QRCode.toDataURL(data, {
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });

    return NextResponse.json({ qrCode: qrDataUrl });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate QR code' }, { status: 500 });
  }
}
