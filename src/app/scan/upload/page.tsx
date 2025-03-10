'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Image } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsLoading(true);
    setError('');
    
    // Process each selected file
    const filePromises = Array.from(files).map(file => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (event) => {
          resolve(event.target.result);
        };
        
        reader.onerror = () => {
          reject(new Error(`Failed to read file: ${file.name}`));
        };
        
        reader.readAsDataURL(file);
      });
    });
    
    // When all files are processed
    Promise.all(filePromises)
      .then(imageDataArray => {
        // Get existing scanned pages
        let scannedPages = [];
        try {
          const savedPages = sessionStorage.getItem('scannedPages');
          if (savedPages) {
            scannedPages = JSON.parse(savedPages);
          }
        } catch (e) {
          console.error('Error parsing saved pages:', e);
        }
        
        // Add new images to the array
        scannedPages = [...scannedPages, ...imageDataArray];
        
        // Save back to sessionStorage
        sessionStorage.setItem('scannedPages', JSON.stringify(scannedPages));
        
        // Navigate back to scan page
        router.push('/scan');
      })
      .catch(err => {
        console.error('Error processing files:', err);
        setError('Failed to process one or more files. Please try again.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };
  
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => router.push('/scan')}
        >
          <ArrowLeft size={18} className="mr-1" />
          Back
        </Button>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-center">Upload Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:bg-accent/50 transition"
              onClick={triggerFileInput}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <Image size={48} className="mx-auto mb-4 text-muted-foreground" />
              
              <p className="text-gray-600 mb-2">Click to select images or drag and drop</p>
              <p className="text-sm text-gray-500">Supports JPG, PNG, HEIC</p>
            </div>
            
            {error && (
              <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                {error}
              </div>
            )}
            
            {isLoading && (
              <div className="mt-4 flex justify-center">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-2 text-gray-600">Processing images...</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 