// src/app/api/ocr/route.js
import { NextResponse } from 'next/server';
import { processSupplyListImage } from '@/lib/ocr-service';

export async function POST(request: Request) {
  try {
    const data = await request.json();  
    
    if (!data.image) {
      return NextResponse.json(
        { error: 'Image data is required' }, 
        { status: 400 }
      );
    }
    
    // Process the image with OCR
    const result = await processSupplyListImage(data.image);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('OCR processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process image' }, 
      { status: 500 }
    );
  }
}