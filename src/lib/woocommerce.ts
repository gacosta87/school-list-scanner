// src/lib/woocommerce.js
import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

// Initialize the WooCommerce API client
export const wooCommerceClient = new WooCommerceRestApi({
  url: process.env.WOO_API_URL || 'https://partner-store.com',
  consumerKey: process.env.WOO_CONSUMER_KEY || '',
  consumerSecret: process.env.WOO_CONSUMER_SECRET || '',
  version: 'wc/v3',
  queryStringAuth: true // Force Basic Authentication as query string for some hosting environments
});

// Search products in WooCommerce store
export const searchProducts = async (searchTerms) => {
  try {
    // Create an array of search promises for each term
    const searchPromises = searchTerms.map(async (term) => {
      const encodedTerm = encodeURIComponent(term.trim());
      const { data } = await wooCommerceClient.get(`products`, {
        search: encodedTerm,
        per_page: 5, // Limit results per term
        status: 'publish', // Only published products
      });
      
      // If products found, return the best match
      if (data && data.length > 0) {
        // Format the product data for our app
        return {
          id: data[0].id,
          name: data[0].name,
          brand: data[0].attributes.find(attr => attr.name === 'Brand')?.options[0] || '',
          price: parseFloat(data[0].price),
          image: data[0].images[0]?.src || '',
          originalTerm: term
        };
      }
      
      // Return null if no products found
      return null;
    });
    
    // Execute all searches in parallel
    const results = await Promise.all(searchPromises);
    
    // Filter out null results (no matches)
    return results.filter(item => item !== null);
  } catch (error) {
    console.error('Error searching products:', error);
    throw error;
  }
};

// Create a cart in WooCommerce
export const createCart = async () => {
  try {
    // For WooCommerce REST API v3, we use a different approach to create carts
    // than what was shown in the previous implementation

    // First create a temporary order with status "pending"
    const { data: order } = await wooCommerceClient.post('orders', {
      status: 'pending',
      customer_id: 0, // Guest customer
      set_paid: false
    });
    
    // Return the order ID as the "cart key"
    return order.id;
  } catch (error) {
    console.error('Error creating cart:', error);
    throw error;
  }
};

// Add items to the "cart" (pending order)
export const addItemsToCart = async (orderId, items) => {
  try {
    // Prepare the line items for the order
    const line_items = items.map(item => ({
      product_id: item.id,
      quantity: item.quantity || 1
    }));
    
    // Update the order with the line items
    const { data } = await wooCommerceClient.put(`orders/${orderId}`, {
      line_items
    });
    
    return data;
  } catch (error) {
    console.error('Error adding items to cart:', error);
    throw error;
  }
};

// Generate checkout URL with the order ID and affiliate ID
export const getCheckoutUrl = (orderId, affiliateId) => {
  // Build the checkout URL using the order ID
  const baseUrl = process.env.WOO_API_URL.replace('/wp-json/wc/v3', '');
  return `${baseUrl}/checkout/order-pay/${orderId}?key=${getOrderKey(orderId)}&ref=${affiliateId}`;
};

// Helper function to get or create an order key
// In a real implementation, you would get this from the order response
const getOrderKey = async (orderId) => {
  try {
    // Get the order details to retrieve the order key
    const { data } = await wooCommerceClient.get(`orders/${orderId}`);
    return data.order_key;
  } catch (error) {
    console.error('Error getting order key:', error);
    throw error;
  }
};

// Process a scanned list text and search for matching products
export const processScannedList = async (scannedText) => {
  // If scannedText is an array, use it directly
  // Otherwise, split by new lines and clean up
  const searchTerms = Array.isArray(scannedText) 
    ? scannedText 
    : scannedText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
  
  // Search for each item in the WooCommerce store
  return await searchProducts(searchTerms);
};