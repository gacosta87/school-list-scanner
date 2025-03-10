'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, Aperture, Image, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * CameraCapture component provides a camera interface for capturing images
 * 
 * @param {Object} props
 * @param {Function} props.onCapture - Callback function called with the captured image data
 * @param {Function} props.onClose - Callback function called when the camera is closed
 * @param {boolean} props.showGalleryOption - Whether to show the option to upload from gallery
 */
const CameraCapture = ({ 
  onCapture, 
  onClose, 
  showGalleryOption = true 
}) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' is rear camera
  const [error, setError] = useState('');
  const [takingPhoto, setTakingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  // Initialize camera when component mounts
  useEffect(() => {
    startCamera();
    
    // Clean up when component unmounts
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  // Start the camera with current facing mode
  const startCamera = async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Camera access is not supported in your browser');
      return;
    }

    try {
      // Stop any existing stream
      stopCamera();
      
      setCameraReady(false);
      setError('');
      
      // Request camera access
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });
      
      // Attach stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          setCameraReady(true);
        };
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      
      if (err.name === 'NotAllowedError') {
        setError('Camera access denied. Please check your permissions.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on your device, or the requested camera is not available.');
      } else {
        setError(`Failed to access camera: ${err.message}`);
      }
    }
  };

  // Stop the camera stream
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
      });
      setStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setCameraReady(false);
  };

  // Toggle between front and rear cameras
  const toggleCamera = () => {
    setFacingMode(prevMode => 
      prevMode === 'environment' ? 'user' : 'environment'
    );
  };

  // Capture image from the video stream
  const captureImage = () => {
    if (!cameraReady || !videoRef.current || !canvasRef.current) {
      setError('Camera is not ready');
      return;
    }
    
    setTakingPhoto(true);
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw the current video frame to the canvas
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Get the image data as base64 string
      const imageData = canvas.toDataURL('image/jpeg', 0.9);
      
      // Send the image data to the parent component
      onCapture(imageData);
    } catch (err) {
      console.error('Error capturing image:', err);
      setError('Failed to capture image');
    } finally {
      setTakingPhoto(false);
    }
  };

  // Handle file selection from gallery
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      onCapture(event.target.result);
    };
    reader.onerror = () => {
      setError('Failed to read file');
    };
    reader.readAsDataURL(file);
  };

  // Trigger file input click
  const openGallery = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Camera view */}
      <div className="relative flex-grow flex items-center justify-center bg-black">
        {error ? (
          <div className="text-white text-center p-6">
            <p className="mb-4">{error}</p>
            <Button 
              variant="outline" 
              className="bg-background/10 text-background border-background/30 hover:bg-background/20"
              onClick={startCamera}
            >
              <RefreshCw size={18} className="mr-2" />
              Retry
            </Button>
          </div>
        ) : (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className={`max-h-full max-w-full ${cameraReady ? 'opacity-100' : 'opacity-0'}`}
          />
        )}
        
        {/* Loading indicator */}
        {!cameraReady && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        {/* Flash effect when taking photo */}
        {takingPhoto && (
          <div className="absolute inset-0 bg-white animate-flash"></div>
        )}
        
        {/* Hidden canvas for image capture */}
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Hidden file input for gallery */}
        <input 
          ref={fileInputRef}
          type="file" 
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
      
      {/* Camera controls */}
      <div className="bg-black p-6">
        <div className="flex items-center justify-between">
          <button 
            onClick={onClose}
            className="p-3 bg-background/10 rounded-full text-background hover:bg-background/20"
            aria-label="Close camera"
          >
            <X size={24} />
          </button>
          
          <button 
            onClick={captureImage}
            disabled={!cameraReady || takingPhoto}
            className="p-5 bg-background rounded-full text-primary disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Take photo"
          >
            <Aperture size={28} />
          </button>
          
          {showGalleryOption ? (
            <button 
              onClick={openGallery}
              className="p-3 bg-background/10 rounded-full text-background hover:bg-background/20"
              aria-label="Choose from gallery"
            >
              <Image size={24} />
            </button>
          ) : (
            <button 
              onClick={toggleCamera}
              className="p-3 bg-background/10 rounded-full text-background hover:bg-background/20"
              aria-label="Switch camera"
            >
              <Camera size={24} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CameraCapture;