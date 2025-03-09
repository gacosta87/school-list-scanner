// src/app/api/products/route.js
import { NextResponse } from 'next/server';
import { wooCommerceClient } from '@/lib/woocommerce';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query') || '';
  const category = searchParams.get('category') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const perPage = parseInt(searchParams.get('per_page') || '20');
  
  try {
    // Build query parameters
    const params = {
      per_page: perPage,
      page,
      status: 'publish',
    };
    
    // Add search query if provided
    if (query) {
      params.search = query;
    }
    
    // Add category filter if provided
    if (category) {
      params.category = category;
    }
    
    // Fetch products from WooCommerce
    const { data, headers } = await wooCommerceClient.get('products', params);
    
    // Get total counts from headers
    const totalProducts = parseInt(headers['x-wp-total']);
    const totalPages = parseInt(headers['x-wp-totalpages']);
    
    // Transform the product data for our frontend
    const products = data.map(product => ({
      id: product.id,
      name: product.name,
      description: product.short_description,
      price: product.price,
      regularPrice: product.regular_price,
      salePrice: product.sale_price,
      onSale: product.on_sale,
      permalink: product.permalink,
      images: product.images.map(img => ({
        id: img.id,
        src: img.src,
        alt: img.alt
      })),
      categories: product.categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug
      })),
      attributes: product.attributes.map(attr => ({
        id: attr.id,
        name: attr.name,
        options: attr.options
      }))
    }));
    
    // Return the products with pagination info
    return NextResponse.json({
      products,
      pagination: {
        page,
        perPage,
        totalProducts,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' }, 
      { status: 500 }
    );
  }
}