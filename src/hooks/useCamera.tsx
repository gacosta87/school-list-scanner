'use client';

import { useState, useCallback } from 'react';

export default function useCamera(videoRef) {
  const [stream, setStream] = useState(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  
  // Start the camera stream
  const startCamera = useCallback(async () => {
    if (!videoRef.current) {
      throw new Error('Video element not available');
    }
    
    try {
      // Request camera access with preferred settings
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile devices
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });
      
      // Set the stream as the video source
      videoRef.current.srcObject = mediaStream;
      setStream(mediaStream);
      
      // Wait for the video to be loaded
      return new Promise((resolve) => {
        videoRef.current.onloadedmetadata = () => {
          setIsCameraReady(true);
          resolve(mediaStream);
        };
      });
    } catch (error) {
      console.error('Error accessing camera:', error);
      throw error;
    }
  }, [videoRef]);
  
  // Stop the camera stream
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
      });
      setStream(null);
      setIsCameraReady(false);
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  }, [stream, videoRef]);
  
  // Capture an image from the video stream
  const captureImage = useCallback((canvasRef) => {
    if (!videoRef.current || !canvasRef.current || !isCameraReady) {
      throw new Error('Video or canvas element not ready');
    }
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw the current video frame to the canvas
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Get the image data as a base64 encoded string
    // Use JPEG for smaller file size compared to PNG
    return canvas.toDataURL('image/jpeg', 0.9);
  }, [videoRef, isCameraReady]);
  
  return {
    startCamera,
    stopCamera,
    captureImage,
    isCameraReady,
    stream
  };
}