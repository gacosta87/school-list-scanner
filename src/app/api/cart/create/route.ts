// src/app/api/cart/create/route.js
import { NextResponse } from 'next/server';
import { createCart } from '@/lib/woocommerce';

export async function POST() {
  try {
    // Create a new cart in WooCommerce
    const cartKey = await createCart();
    
    return NextResponse.json({ cartKey });
  } catch (error) {
    console.error('Cart creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create cart' }, 
      { status: 500 }
    );
  }
}