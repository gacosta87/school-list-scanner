'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  ExternalLink, 
  AlertCircle 
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import NavBar from '@/components/NavBar';
import { getLocalStorage, setLocalStorage, formatCurrency } from '@/lib/utils';

// Define TypeScript interfaces
interface CartItem {
  id: number;
  name: string;
  brand: string;
  price: number;
  image: string;
  quantity: number;
  originalTerm: string;
}

export default function CartPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showCheckoutDialog, setShowCheckoutDialog] = useState<boolean>(false);
  const [showClearCartDialog, setShowClearCartDialog] = useState<boolean>(false);
  const [checkoutLoading, setCheckoutLoading] = useState<boolean>(false);
  
  // Load cart items from localStorage on component mount
  useEffect(() => {
    loadCartItems();
  }, []);
  
  const loadCartItems = () => {
    // Try to load cart items from localStorage
    const storedItems = getLocalStorage('cartItems', []);
    if (Array.isArray(storedItems) && storedItems.length > 0) {
      setCartItems(storedItems);
    } else {
      // If no items in cart, also get scanned items that were marked for cart
      const scannedItems = getLocalStorage('scannedItems', []);
      if (Array.isArray(scannedItems) && scannedItems.length > 0) {
        const itemsForCart = scannedItems
          .filter(item => item.inCart)
          .map(item => ({
            id: item.id,
            name: item.name,
            brand: item.brand || '',
            price: item.price,
            image: item.image || '',
            quantity: item.requestedQuantity || 1,
            originalTerm: item.originalTerm || ''
          }));
        
        if (itemsForCart.length > 0) {
          setCartItems(itemsForCart);
          setLocalStorage('cartItems', itemsForCart);
        }
      }
    }
  };
  
  // Update item quantity
  const updateQuantity = (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    const updatedItems = cartItems.map(item => 
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    );
    
    setCartItems(updatedItems);
    setLocalStorage('cartItems', updatedItems);
  };
  
  // Remove item from cart
  const removeItem = (itemId: number) => {
    const updatedItems = cartItems.filter(item => item.id !== itemId);
    setCartItems(updatedItems);
    setLocalStorage('cartItems', updatedItems);
  };
  
  // Clear entire cart
  const clearCart = () => {
    setCartItems([]);
    setLocalStorage('cartItems', []);
    setShowClearCartDialog(false);
  };
  
  // Process checkout
  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      setErrorMessage('Your cart is empty. Please add items before checkout.');
      return;
    }
    
    setCheckoutLoading(true);
    setErrorMessage('');
    
    try {
      // Create a new cart
      const cartResponse = await fetch('/api/cart/create', {
        method: 'POST'
      });
      
      if (!cartResponse.ok) {
        throw new Error('Failed to create cart');
      }
      
      const { cartKey } = await cartResponse.json();
      
      // Add items to the cart
      const addItemsResponse = await fetch('/api/cart/add-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartKey,
          items: cartItems.map(item => ({
            id: item.id,
            quantity: item.quantity
          }))
        })
      });
      
      if (!addItemsResponse.ok) {
        throw new Error('Failed to add items to cart');
      }
      
      // Get the checkout URL
      const checkoutResponse = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartKey })
      });
      
      if (!checkoutResponse.ok) {
        throw new Error('Failed to generate checkout URL');
      }
      
      const { checkoutUrl } = await checkoutResponse.json();
      
      // Clear the local cart after successful checkout initiation
      setLocalStorage('cartItems', []);
      
      // Redirect to the checkout URL
      window.location.href = checkoutUrl;
      
    } catch (error) {
      console.error('Checkout error:', error);
      setErrorMessage('There was a problem preparing your cart. Please try again.');
      setCheckoutLoading(false);
      setShowCheckoutDialog(false);
    }
  };
  
  // Calculate cart totals
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const estimatedTax = subtotal * 0.0825; // Example: 8.25% tax rate
  const total = subtotal + estimatedTax;
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="p-4 pb-20">
        <Card className="mb-4">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl flex items-center">
                  <ShoppingCart className="mr-2 h-6 w-6" />
                  Your Cart
                </CardTitle>
                <CardDescription>{cartItems.length} items</CardDescription>
              </div>
              
              {cartItems.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowClearCartDialog(true)}
                >
                  <Trash2 className="mr-1 h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>
          </CardHeader>
          
          <CardContent>
            {errorMessage && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-center mb-4">
                <AlertCircle className="text-destructive mr-2 h-5 w-5 flex-shrink-0" />
                <p className="text-sm text-destructive">{errorMessage}</p>
              </div>
            )}
            
            {cartItems.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">Your cart is empty</h3>
                <p className="text-gray-500 mb-4">Looks like you haven't added any items yet</p>
                <Button 
                  onClick={() => router.push('/')} 
                  className="mx-auto"
                >
                  Start Shopping
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center p-3 border rounded-lg">
                    <img 
                      src={item.image || "/api/placeholder/80/80"} 
                      alt={item.name} 
                      className="w-16 h-16 object-cover rounded mr-4"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/api/placeholder/80/80";
                      }} 
                    />
                    
                    <div className="flex-grow">
                      <h3 className="font-medium">{item.name}</h3>
                      {item.brand && (
                        <p className="text-sm text-gray-600">{item.brand}</p>
                      )}
                      <p className="text-primary font-bold">
                        {formatCurrency(item.price)}
                      </p>
                      {item.originalTerm && (
                        <p className="text-xs text-gray-500">From list: "{item.originalTerm}"</p>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-center space-y-2">
                      <div className="flex items-center">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8 rounded-r-none"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input 
                          type="number" 
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                          min="1"
                          className="h-8 w-14 rounded-none text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8 rounded-l-none"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          
          {cartItems.length > 0 && (
            <CardFooter className="flex flex-col">
              <div className="w-full space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Estimated Tax</span>
                  <span>{formatCurrency(estimatedTax)}</span>
                </div>
                <div className="flex justify-between font-bold pt-2 border-t">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
              
              <Button 
                onClick={() => setShowCheckoutDialog(true)}
                className="w-full mt-4"
                disabled={cartItems.length === 0}
              >
                Proceed to Checkout
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
      
      <NavBar currentPage="cart" />
      
      {/* Checkout Confirmation Dialog */}
      <AlertDialog open={showCheckoutDialog} onOpenChange={setShowCheckoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete Your Purchase</AlertDialogTitle>
            <AlertDialogDescription>
              You're about to be redirected to our partner store where all your items will be waiting in your cart.
              
              <div className="bg-gray-50 p-4 rounded-lg my-4">
                <div className="flex justify-between mb-2">
                  <span>Items:</span>
                  <span>{cartItems.length}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
              
              <div className="flex items-start text-sm mt-4">
                <ExternalLink className="mr-2 h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>You will complete your purchase securely on our partner's website.</span>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCheckout}
              disabled={checkoutLoading}
            >
              {checkoutLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Redirecting...
                </>
              ) : (
                <>
                  Continue <ExternalLink className="ml-2 h-4 w-4" />
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Clear Cart Confirmation Dialog */}
      <AlertDialog open={showClearCartDialog} onOpenChange={setShowClearCartDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Shopping Cart</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove all items from your cart? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={clearCart}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Clear Cart
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}