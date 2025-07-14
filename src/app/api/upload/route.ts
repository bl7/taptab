import { NextRequest, NextResponse } from 'next/server';
import cloudinary from 'cloudinary';

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  const data = await req.formData();
  const file = data.get('file');
  const folder = data.get('folder') || 'taptap-logos';
  
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  // Read file as buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Upload to Cloudinary
  try {
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.v2.uploader.upload_stream(
        { folder: folder as string },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(buffer);
    });
    // @ts-expect-error - Cloudinary result type
    return NextResponse.json({ url: result.secure_url });
  } catch (err) {
    console.error('Cloudinary upload error:', err);
    const errorMsg = (err as Error)?.message || String(err);
    return NextResponse.json({ error: 'Cloudinary upload failed', details: errorMsg }, { status: 500 });
  }
} 