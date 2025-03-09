'use client';

import NavBar from '@/components/NavBar';
import SchoolInfoDisplay from '@/components/SchoolInfoDisplay';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AlertCircle, Check, ExternalLink, Search, ShoppingCart } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const source = searchParams.get('source');
  
  const [scannedItems, setScannedItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [gradeLists, setGradeLists] = useState([]);
  const [selectedGradeIndex, setSelectedGradeIndex] = useState(0);
  const [showGradeSelector, setShowGradeSelector] = useState(false);
  
  useEffect(() => {
    // If coming from camera scan, process the captured image
    if (source === 'camera') {
      processScannedImage();
    } else if (source === 'multipage') {
      processMultipleImages();
    } else {
      // Load any previously saved items from localStorage
      const savedItems = localStorage.getItem('scannedItems');
      if (savedItems) {
        try {
          setScannedItems(JSON.parse(savedItems));
        } catch (e) {
          console.error('Error parsing saved items:', e);
        }
      }
    }
  }, [source]);
  
  const processScannedImage = async () => {
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      // Get the captured image from sessionStorage
      const imageData = sessionStorage.getItem('capturedImage');
      if (!imageData) {
        throw new Error('No captured image found');
      }
      
      // Send the image for Claude AI processing
      const claudeResponse = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData })
      });
      
      if (!claudeResponse.ok) {
        throw new Error('Claude AI processing failed');
      }
      
      const claudeData = await claudeResponse.json();
      
      // Store school information if available
      if (claudeData.schoolName || (claudeData.gradeLists && claudeData.gradeLists.length > 0)) {
        localStorage.setItem('schoolInfo', JSON.stringify({
          schoolName: claudeData.schoolName,
          grade: claudeData.gradeLists[0]?.grade,
          teacherName: claudeData.teacherName,
          year: claudeData.year
        }));
      }
      
      // Store grade lists for later selection
      setGradeLists(claudeData.gradeLists || []);
      
      // If multiple grade lists are found, show the grade selector
      if (claudeData.gradeLists && claudeData.gradeLists.length > 1) {
        setShowGradeSelector(true);
        return; // Wait for user to select a grade
      }
      
      // Get the supply items from the first grade list
      const supplyItems = claudeData.gradeLists && claudeData.gradeLists.length > 0 
        ? claudeData.gradeLists[0].supplyItems 
        : [];
      
      // Format the items directly from the supply list without searching
      const items = supplyItems.map((item) => {
        return {
          id: Math.random().toString(36).substring(2, 15), // Generate a random ID
          name: item.name,
          brand: '',
          price: 0.00, // Default price
          image: '', // No image
          inCart: false,
          originalTerm: item.originalText || item.name,
          requestedQuantity: item.quantity || 1
        };
      });
      
      // Save items to state and localStorage
      setScannedItems(items);
      localStorage.setItem('scannedItems', JSON.stringify(items));
      
    } catch (error) {
      console.error('Error processing image:', error);
      setErrorMessage('Failed to process your list. Please try again.');
    } finally {
      setIsLoading(false);
      // Clear the captured image from sessionStorage
      sessionStorage.removeItem('capturedImage');
    }
  };
  
  const processMultipleImages = async () => {
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      // Get the captured images from sessionStorage
      const savedPages = sessionStorage.getItem('scannedPages');
      if (!savedPages) {
        throw new Error('No scanned pages found');
      }
      
      const imageDataArray = JSON.parse(savedPages);
      if (!Array.isArray(imageDataArray) || imageDataArray.length === 0) {
        throw new Error('No valid images found');
      }
      
      // Process each image with Claude AI and collect all supply items
      let allGradeLists = [];
      let schoolInfoData = {};
      
      for (let i = 0; i < imageDataArray.length; i++) {
        // Send the image for Claude AI processing
        const claudeResponse = await fetch('/api/claude', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: imageDataArray[i] })
        });
        
        if (!claudeResponse.ok) {
          throw new Error(`Claude AI processing failed for image ${i+1}`);
        }
        
        const claudeData = await claudeResponse.json();
        
        // Collect school information from the first page that has it
        if ((claudeData.schoolName || claudeData.year) && Object.keys(schoolInfoData).length === 0) {
          schoolInfoData = {
            schoolName: claudeData.schoolName,
            year: claudeData.year,
            teacherName: claudeData.teacherName
          };
        }
        
        // Add grade lists to our collection
        if (claudeData.gradeLists && claudeData.gradeLists.length > 0) {
          allGradeLists = [...allGradeLists, ...claudeData.gradeLists];
        }
      }
      
      // Store school information if available
      if (Object.keys(schoolInfoData).length > 0) {
        localStorage.setItem('schoolInfo', JSON.stringify(schoolInfoData));
      }
      
      // Store grade lists for later selection
      setGradeLists(allGradeLists);
      
      // If multiple grade lists are found, show the grade selector
      if (allGradeLists.length > 1) {
        setShowGradeSelector(true);
        setIsLoading(false);
        return; // Wait for user to select a grade
      }
      
      // Get the supply items from the first grade list
      const supplyItems = allGradeLists.length > 0 ? allGradeLists[0].supplyItems : [];
      
      // Update school info with the selected grade
      if (allGradeLists.length > 0) {
        const schoolInfo = JSON.parse(localStorage.getItem('schoolInfo') || '{}');
        schoolInfo.grade = allGradeLists[0].grade;
        localStorage.setItem('schoolInfo', JSON.stringify(schoolInfo));
      }
      
      // Format the items directly from the supply list without searching
      const items = supplyItems.map((item) => {
        return {
          id: Math.random().toString(36).substring(2, 15), // Generate a random ID
          name: item.name,
          brand: '',
          price: 0.00, // Default price
          image: '', // No image
          inCart: false,
          originalTerm: item.originalText || item.name,
          requestedQuantity: item.quantity || 1
        };
      });
      
      // Save items to state and localStorage
      setScannedItems(items);
      localStorage.setItem('scannedItems', JSON.stringify(items));
      
    } catch (error) {
      console.error('Error processing images:', error);
      setErrorMessage('Failed to process your list. Please try again.');
    } finally {
      setIsLoading(false);
      // Clear the scanned pages from sessionStorage
      sessionStorage.removeItem('scannedPages');
    }
  };
  
  const toggleCart = (id) => {
    const updatedItems = scannedItems.map(item => 
      item.id === id ? {...item, inCart: !item.inCart} : item
    );
    setScannedItems(updatedItems);
    localStorage.setItem('scannedItems', JSON.stringify(updatedItems));
  };
  
  const handleCheckout = async () => {
    setCheckoutLoading(true);
    setErrorMessage('');
    
    try {
      // Get only the items that are marked for cart
      const itemsToCheckout = scannedItems.filter(item => item.inCart);
      
      if (itemsToCheckout.length === 0) {
        setErrorMessage('Please select at least one item to purchase.');
        setCheckoutLoading(false);
        return;
      }
      
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
          items: itemsToCheckout.map(item => ({
            id: item.id,
            quantity: item.requestedQuantity
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
      
      // Redirect to the checkout URL
      window.location.href = checkoutUrl;
      
    } catch (error) {
      console.error('Checkout error:', error);
      setErrorMessage('There was a problem preparing your cart. Please try again.');
      setCheckoutLoading(false);
    }
  };
  
  const handleGradeSelection = async (gradeIndex) => {
    setSelectedGradeIndex(gradeIndex);
    setShowGradeSelector(false);
    setIsLoading(true);
    
    try {
      // Get the supply items from the selected grade list
      const supplyItems = gradeLists[gradeIndex].supplyItems;
      
      // Update school info with the selected grade
      const schoolInfo = JSON.parse(localStorage.getItem('schoolInfo') || '{}');
      schoolInfo.grade = gradeLists[gradeIndex].grade;
      localStorage.setItem('schoolInfo', JSON.stringify(schoolInfo));
      
      // Format the items directly from the supply list without searching
      const items = supplyItems.map((item) => {
        return {
          id: Math.random().toString(36).substring(2, 15), // Generate a random ID
          name: item.name,
          brand: '',
          price: 0.00, // Default price
          image: '', // No image
          inCart: false,
          originalTerm: item.originalText || item.name,
          requestedQuantity: item.quantity || 1
        };
      });
      
      // Save items to state and localStorage
      setScannedItems(items);
      localStorage.setItem('scannedItems', JSON.stringify(items));
    } catch (error) {
      console.error('Error processing grade selection:', error);
      setErrorMessage('Failed to process your selection. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="p-4 pb-20">
        <SchoolInfoDisplay />
        
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Your School List</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              We found {scannedItems.length} items on your list
            </p>
            
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <Input 
                  placeholder="Search your list..." 
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center mb-4">
                <AlertCircle size={20} className="text-red-600 mr-2 flex-shrink-0" />
                <p className="text-sm text-red-800">{errorMessage}</p>
              </div>
            )}
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center mb-4">
              <ShoppingCart size={20} className="text-blue-600 mr-2 flex-shrink-0" />
              <p className="text-sm text-blue-800 flex-grow">
                Save up to 15% when you checkout through our partner store!
              </p>
            </div>
          </CardContent>
        </Card>
        
        <div className="space-y-3 mb-20">
          {isLoading ? (
            <div className="py-12 flex justify-center items-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-3 text-gray-600">Loading products...</span>
            </div>
          ) : (
            scannedItems
              .filter(item => 
                searchQuery === '' || 
                item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.originalTerm.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map(item => (
                <Card key={item.id} className="overflow-hidden">
                  <CardContent className="p-4 flex items-center">
                    <img 
                      src={item.image || "https://placehold.co/80x80/e6e6e6/a3a3a3?text=Item"} 
                      alt={item.name} 
                      className="w-16 h-16 object-cover rounded mr-4"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://placehold.co/80x80/e6e6e6/a3a3a3?text=Item";
                      }} 
                    />
                    
                    <div className="flex-grow">
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-sm text-gray-600">{item.brand}</p>
                      <p className="text-blue-600 font-bold">${item.price.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">From list: "{item.originalTerm}"</p>
                    </div>
                    
                    <button 
                      onClick={() => toggleCart(item.id)}
                      className={`p-3 rounded-full ${item.inCart ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}
                    >
                      {item.inCart ? <Check size={20} /> : <ShoppingCart size={20} />}
                    </button>
                  </CardContent>
                </Card>
              ))
          )}
        </div>
      </div>
      
      {/* Checkout Button - Fixed at bottom */}
      <div className="fixed bottom-16 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-lg">
        <Button 
          onClick={() => setShowCheckoutModal(true)}
          className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center"
          disabled={isLoading || scannedItems.filter(i => i.inCart).length === 0}
        >
          <ShoppingCart size={20} className="mr-2" />
          Purchase All Items ({scannedItems.filter(i => i.inCart).length})
        </Button>
      </div>
      
      <NavBar currentPage="results" />
      
      {/* Checkout Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Complete Your Purchase</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                You're about to be redirected to our partner store where all your items will be waiting in your cart.
              </p>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="flex justify-between mb-2">
                  <span>Items:</span>
                  <span>{scannedItems.filter(i => i.inCart).length}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Note:</span>
                  <span>Prices will be shown in the partner store</span>
                </div>
              </div>
              
              <p className="text-sm text-gray-500 flex items-start mb-4">
                <ExternalLink size={18} className="mr-2 flex-shrink-0 mt-0.5" />
                <span>You will complete your purchase securely on our partner's website.</span>
              </p>
              
              <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                <Button 
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowCheckoutModal(false)}
                >
                  Cancel
                </Button>
                
                <Button 
                  className="flex-1 bg-blue-600"
                  disabled={checkoutLoading}
                  onClick={handleCheckout}
                >
                  {checkoutLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Redirecting...
                    </>
                  ) : (
                    <>
                      Continue <ExternalLink size={18} className="ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Grade Selector Modal */}
      {showGradeSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Select Grade</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                We found multiple grade lists in your scan. Please select the grade you want to shop for:
              </p>
              
              <div className="space-y-2">
                {gradeLists.map((gradeList, index) => (
                  <Button 
                    key={index}
                    variant="outline"
                    className="w-full justify-start text-left"
                    onClick={() => handleGradeSelection(index)}
                  >
                    {gradeList.grade || `Grade List ${index + 1}`}
                    <span className="ml-auto text-gray-500 text-sm">
                      {gradeList.supplyItems.length} items
                    </span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}