'use client';

import CameraCapture from '@/components/CameraCapture';
import { useRouter } from 'next/navigation';

export default function CameraPage() {
  const router = useRouter();
  
  const handleCapture = (imageData) => {
    // Get existing scanned pages from sessionStorage
    let scannedPages = [];
    try {
      const savedPages = sessionStorage.getItem('scannedPages');
      if (savedPages) {
        scannedPages = JSON.parse(savedPages);
      }
    } catch (e) {
      console.error('Error parsing saved pages:', e);
    }
    
    // Add the new image to the array
    scannedPages.push(imageData);
    
    // Save back to sessionStorage
    sessionStorage.setItem('scannedPages', JSON.stringify(scannedPages));
    
    // Navigate back to scan page
    router.push('/scan');
  };
  
  const handleClose = () => {
    router.push('/scan');
  };
  
  return (
    <div className="min-h-screen bg-black">
      <CameraCapture 
        onCapture={handleCapture}
        onClose={handleClose}
        showGalleryOption={true}
      />
    </div>
  );
} 