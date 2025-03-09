// src/app/api/cart/add-items/route.js
import { NextResponse } from 'next/server';
import { addItemsToCart } from '@/lib/woocommerce';

export async function POST(request) {
  try {
    const data = await request.json();
    
    if (!data.cartKey) {
      return NextResponse.json(
        { error: 'Cart key is required' }, 
        { status: 400 }
      );
    }
    
    if (!data.items || !Array.isArray(data.items)) {
      return NextResponse.json(
        { error: 'Items array is required' }, 
        { status: 400 }
      );
    }
    
    // Add items to the cart
    const result = await addItemsToCart(data.cartKey, data.items);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Add to cart error:', error);
    return NextResponse.json(
      { error: 'Failed to add items to cart' }, 
      { status: 500 }
    );
  }
}