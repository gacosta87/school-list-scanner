'use client';

import NavBar from '@/components/NavBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Info, List, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ScanPage() {
  const router = useRouter();
  const [scannedPages, setScannedPages] = useState([]);
  
  // Load any existing scanned pages from sessionStorage
  useEffect(() => {
    const savedPages = sessionStorage.getItem('scannedPages');
    if (savedPages) {
      try {
        setScannedPages(JSON.parse(savedPages));
      } catch (e) {
        console.error('Error parsing saved pages:', e);
      }
    }
  }, []);
  
  const handleCameraClick = () => {
    router.push('/scan/camera');
  };
  
  const handleUploadClick = () => {
    router.push('/scan/upload');
  };
  
  const handleProcessList = () => {
    // Save the current pages to sessionStorage before navigating
    sessionStorage.setItem('scannedPages', JSON.stringify(scannedPages));
    router.push('/results?source=multipage');
  };
  
  const clearScannedPages = () => {
    setScannedPages([]);
    sessionStorage.removeItem('scannedPages');
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50">
      <div className="w-full max-w-md">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Upload Your School Supply List</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-center mb-8">
              Take photos of your list or upload images from your gallery
            </p>
            
            {scannedPages.length > 0 ? (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">Scanned Pages: {scannedPages.length}</h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={clearScannedPages}
                  >
                    Clear All
                  </Button>
                </div>
                
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {scannedPages.map((page, index) => (
                    <div key={index} className="relative aspect-[3/4] bg-gray-100 rounded-md overflow-hidden">
                      <img 
                        src={page} 
                        alt={`Page ${index + 1}`} 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-bl-md">
                        {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    onClick={handleCameraClick}
                    className="flex-1 flex items-center justify-center"
                  >
                    <Camera size={18} className="mr-1" />
                    <span>Add Page</span>
                  </Button>
                  
                  <Button 
                    onClick={handleProcessList}
                    className="flex-1 flex items-center justify-center bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <List size={18} className="mr-1" />
                    <span>Process List</span>
                  </Button>
                </div>
                
                <div className="mt-3 flex items-start text-xs text-gray-500">
                  <Info size={14} className="mr-1 flex-shrink-0 mt-0.5" />
                  <span>All pages will be processed together to create your complete supply list</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col space-y-4">
                <Button 
                  onClick={handleCameraClick}
                  className="flex items-center justify-center bg-primary text-primary-foreground p-6 rounded-lg shadow-lg hover:bg-primary/90 transition w-full"
                >
                  <Camera size={24} className="mr-2" />
                  <span>Take Photos</span>
                </Button>
                
                <Button 
                  onClick={handleUploadClick}
                  variant="outline"
                  className="flex items-center justify-center bg-background text-primary p-6 rounded-lg shadow border border-primary/20 hover:bg-accent transition w-full"
                >
                  <Upload size={24} className="mr-2" />
                  <span>Upload from Gallery</span>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <NavBar currentPage="home" />
    </div>
  );
} 