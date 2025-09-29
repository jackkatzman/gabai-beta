import { useState, useRef } from "react";
import { permissionManager } from "@/lib/permissions";
import { useToast } from "@/hooks/use-toast";
import { CordovaDirect } from "@/lib/cordova-direct";

interface UseCameraOptions {
  onCaptureComplete?: (imageData: string | Blob) => void;
  onError?: (error: Error) => void;
}

export function useCamera({ onCaptureComplete, onError }: UseCameraOptions = {}) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          reject(new Error("Failed to convert image to base64"));
        }
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // Resize image if needed to optimize for upload
  const resizeImage = (base64Str: string, maxWidth = 1024, maxHeight = 1024): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round(height * (maxWidth / width));
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round(width * (maxHeight / height));
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.8));
        } else {
          resolve(base64Str);
        }
      };
      img.onerror = () => resolve(base64Str);
    });
  };

  const capturePhoto = async () => {
    console.log("📸 Starting photo capture...");
    setIsCapturing(true);

    try {
      // Check if we're in APK/Cordova environment
      const isAPK = CordovaDirect.isAvailable();
      
      if (isAPK) {
        console.log("📸 APK detected, using native camera directly...");
        try {
          // Use native camera through CordovaDirect - it will handle its own permissions
          const imageBlob = await CordovaDirect.capturePhoto();
          console.log("📸 Native photo captured:", imageBlob.type, imageBlob.size);
          
          // Send the blob directly to onCaptureComplete
          if (onCaptureComplete) {
            console.log("📸 Sending blob directly to callback, size:", imageBlob.size);
            onCaptureComplete(imageBlob);
          }
          
          // Also create base64 for preview display only
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result as string;
            console.log("📸 Preview created");
            setImagePreview(base64);
          };
          reader.onerror = (error) => {
            console.error("📸 Preview creation error:", error);
          };
          reader.readAsDataURL(imageBlob);
        } catch (error: any) {
          console.error("📸 Native camera error:", error);
          throw error;
        } finally {
          setIsCapturing(false);
        }
      } else {
        // Fall back to file input for web - request permission first
        console.log("📸 Web environment, checking permission...");
        const hasPermission = await permissionManager.requestCameraPermission();
        if (!hasPermission) {
          throw new Error("Camera permission denied");
        }
        
        console.log("📸 Using file input...");
        if (fileInputRef.current) {
          fileInputRef.current.click();
        } else {
          throw new Error("Camera input not initialized");
        }
      }
    } catch (error: any) {
      console.error("📸 Camera error:", error);
      toast({
        title: "Camera Error",
        description: error.message || "Failed to access camera",
        variant: "destructive",
      });
      if (onError) {
        onError(error);
      }
      setIsCapturing(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setIsCapturing(false);
      return;
    }

    console.log("📸 Photo captured:", {
      name: file.name,
      type: file.type,
      size: file.size,
    });

    try {
      // Convert to base64
      const base64 = await fileToBase64(file);
      
      // Resize if needed
      const resized = await resizeImage(base64);
      
      console.log("📸 Image processed:", {
        originalSize: base64.length,
        resizedSize: resized.length,
      });

      setImagePreview(resized);
      
      if (onCaptureComplete) {
        onCaptureComplete(resized);
      }
    } catch (error: any) {
      console.error("📸 Image processing error:", error);
      toast({
        title: "Image Error",
        description: "Failed to process captured image",
        variant: "destructive",
      });
      if (onError) {
        onError(error);
      }
    } finally {
      setIsCapturing(false);
      // Clear the input for next capture
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const clearPreview = () => {
    setImagePreview(null);
  };

  return {
    isCapturing,
    imagePreview,
    capturePhoto,
    clearPreview,
    fileInputRef,
    handleFileSelect,
  };
}