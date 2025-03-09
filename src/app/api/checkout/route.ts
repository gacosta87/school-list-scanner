// src/app/api/checkout/route.js
import { NextResponse } from 'next/server';
import { getCheckoutUrl } from '@/lib/woocommerce';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    if (!data.cartKey) {
      return NextResponse.json(
        { error: 'Cart key is required' }, 
        { status: 400 }
      );
    }
    
    // Generate checkout URL with the cart key and affiliate ID
    const checkoutUrl = getCheckoutUrl(
      data.cartKey, 
      process.env.AFFILIATE_ID || 'default-affiliate'
    );
    
    return NextResponse.json({ checkoutUrl });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to generate checkout URL' }, 
      { status: 500 }
    );
  }
}