// src/app/api/products/search/route.js
import { NextResponse } from 'next/server';
import { searchProducts } from '@/lib/woocommerce';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    if (!data.searchTerms || !Array.isArray(data.searchTerms)) {
      return NextResponse.json(
        { error: 'Search terms array is required' }, 
        { status: 400 }
      );
    }
    
    // Search for products in WooCommerce
    const results = await searchProducts(data.searchTerms);
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Product search error:', error);
    return NextResponse.json(
      { error: 'Failed to search products' }, 
      { status: 500 }
    );
  }
}