import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Upload, Camera, FileText, Copy, Check, Loader2, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { api } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { CordovaNative } from "@/lib/cordova-native";

export function ImageTextExtractor() {
  const [extractedText, setExtractedText] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Show image preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Store the selected file for later use
    setSelectedFile(file);
    
    // Extract text
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to extract text');
      }

      const data = await response.json();
      setExtractedText(data.text);
      
      toast({
        title: "Text extracted successfully!",
        description: "The text from your image is ready below.",
      });
    } catch (error) {
      console.error('OCR error:', error);
      toast({
        title: "Extraction failed",
        description: "Failed to extract text from the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleCameraUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(extractedText);
      setCopied(true);
      toast({
        title: "Text copied!",
        description: "The extracted text has been copied to your clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy text to clipboard.",
        variant: "destructive",
      });
    }
  };

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("/api/chat", "POST", { 
        message: message,
        userId: user?.id,
        conversationId: null
      });
      return response.json();
    },
    onSuccess: (response) => {
      // Update messages cache with both user and assistant messages
      queryClient.setQueryData(
        ["/api/messages", response.conversationId],
        (oldMessages: any[] = []) => [...oldMessages, response.userMessage, response.message]
      );

      // Invalidate lists and reminders cache if AI performed actions
      if (response.actions && response.actions.length > 0) {
        queryClient.invalidateQueries({ queryKey: ["/api/smart-lists", user?.id] });
        queryClient.invalidateQueries({ queryKey: ["/api/reminders", user?.id] });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send to GabAi",
        description: error.message || "Could not send the text to GabAi.",
        variant: "destructive",
      });
    },
  });

  const addTextToChat = async () => {
    if (!extractedText.trim()) return;
    
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to send text to GabAi.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Check if this might be a business card by looking for contact information
      const hasContactInfo = extractedText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/) || // email
                            extractedText.match(/(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/) || // phone
                            extractedText.toLowerCase().includes('ceo') ||
                            extractedText.toLowerCase().includes('manager') ||
                            extractedText.toLowerCase().includes('director');
      
      if (hasContactInfo && selectedFile) {
        // Process as business card
        const formData = new FormData();
        formData.append('image', selectedFile);
        formData.append('userId', user.id);
        
        const response = await fetch('/api/ocr/business-card', {
          method: 'POST',
          body: formData,
        });
        
        if (response.ok) {
          const result = await response.json();
          toast({
            title: result.wasUpdated ? "Contact updated!" : "Contact created!",
            description: result.wasUpdated 
              ? `${result.contact.firstName || 'Contact'} has been updated in your contacts with a follow-up reminder.`
              : `${result.contact.firstName || 'New contact'} has been added to your contacts with a follow-up reminder.`,
          });
          
          // Also send to chat for AI interaction
          const messageText = `I just scanned a business card and created a contact for ${result.contact.firstName || 'someone'}. Here's the info: ${extractedText}`;
          sendMessageMutation.mutate(messageText);
          
          // Invalidate contacts cache to refresh the contacts page
          queryClient.invalidateQueries({ queryKey: ["/api/contacts", user.id] });
        } else {
          // Fallback to regular chat if business card processing fails
          const messageText = `Please process this text I extracted from an image:\n\n${extractedText}`;
          sendMessageMutation.mutate(messageText);
        }
      } else {
        // Use the extracted text to interact with the AI normally
        const messageText = `Please process this text I extracted from an image:\n\n${extractedText}`;
        sendMessageMutation.mutate(messageText);
      }
      
      toast({
        title: "Sent to GabAi",
        description: "The extracted text has been sent to GabAi for processing.",
      });
      
      // Navigate to chat to see the response
      setTimeout(() => {
        setLocation("/");
      }, 1000);
    } catch (error) {
      toast({
        title: "Failed to send to GabAi",
        description: "Could not send the text to GabAi.",
        variant: "destructive",
      });
    }
  };

  const shareViaWhatsApp = () => {
    const message = encodeURIComponent(`Text extracted from image:\n\n${extractedText}`);
    const whatsappUrl = `https://wa.me/?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  const shareViaSMS = () => {
    const message = encodeURIComponent(`Text extracted from image: ${extractedText}`);
    const smsUrl = `sms:?body=${message}`;
    window.open(smsUrl, '_self');
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent('Text Extracted from Image');
    const body = encodeURIComponent(`Here's the text I extracted from an image using GabAi:\n\n${extractedText}`);
    const emailUrl = `mailto:?subject=${subject}&body=${body}`;
    window.open(emailUrl, '_self');
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">
            Text Scanner
          </CardTitle>
          <p className="text-center text-lg text-gray-600 dark:text-gray-300">
            Scan text from images using your camera or upload files
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          {/* Camera input specifically for mobile */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleCameraUpload}
            className="hidden"
            data-testid="camera-input"
          />
          
          {/* Simple Two-Button Layout */}
          <div className="flex flex-col space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Camera Button */}
              <Button
                size="lg"
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  console.log('📷 Camera button clicked');
                  
                  // Check if Cordova native camera is available
                  if (CordovaNative.isAvailable()) {
                    console.log('📷 Using native Cordova camera');
                    try {
                      // v30: takePicture now returns Blob directly
                      const blob = await CordovaNative.takePicture();
                      console.log('📷 Camera returned blob:', blob.type, blob.size);
                      
                      // Convert to File for FormData compatibility
                      const file = new File([blob], 'camera-photo.jpg', { type: blob.type || 'image/jpeg' });
                      
                      handleFileSelect(file);
                      return;
                    } catch (error) {
                      console.error('📷 Native camera error:', error);
                      toast({
                        title: "Camera error",
                        description: "Failed to take photo. Please try again.",
                        variant: "destructive",
                      });
                      return;
                    }
                  }
                  
                  // Detect if we're in APK/WebView - check for Android WebView
                  const isAPK = window.location.protocol === 'https:' && 
                                (window.location.hostname === 'localhost' || 
                                 window.location.hostname.includes('gabai.ai'));
                  const isWebView = /wv|Android/.test(navigator.userAgent) || 
                                    (window as any).Android !== undefined ||
                                    (window as any).webkit !== undefined;
                  
                  console.log('📷 APK detected:', isAPK);
                  console.log('📷 WebView detected:', isWebView);
                  console.log('📷 User Agent:', navigator.userAgent);
                  
                  // For APK/WebView (without Cordova), use file input directly (most reliable)
                  if (isAPK || isWebView) {
                    console.log('📷 Using direct camera capture for APK/WebView');
                    if (cameraInputRef.current) {
                      // Reset the input value first to ensure onChange fires
                      cameraInputRef.current.value = '';
                      // Set capture attribute dynamically for mobile
                      cameraInputRef.current.setAttribute('capture', 'environment');
                      cameraInputRef.current.click();
                    }
                    return;
                  }
                  
                  // For web browsers, try getUserMedia with fallback
                  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia && !isAPK && !isWebView) {
                    try {
                      console.log('📷 Attempting getUserMedia for web browser');
                      // Request camera with preview
                      const stream = await navigator.mediaDevices.getUserMedia({ 
                        video: { 
                          facingMode: 'environment',
                          width: { ideal: 1280 },
                          height: { ideal: 720 }
                        } 
                      });
                      
                      // Create preview modal
                      const modal = document.createElement('div');
                      modal.style.cssText = `
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(0,0,0,0.9);
                        z-index: 9999;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                      `;
                      
                      // Create video preview
                      const video = document.createElement('video');
                      video.srcObject = stream;
                      video.autoplay = true;
                      video.playsInline = true;
                      video.style.cssText = `
                        width: 90%;
                        max-width: 400px;
                        height: auto;
                        border-radius: 8px;
                        margin-bottom: 20px;
                      `;
                      
                      // Create capture button
                      const captureBtn = document.createElement('button');
                      captureBtn.textContent = '📷 Take Photo';
                      captureBtn.style.cssText = `
                        background: #2563eb;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        padding: 15px 30px;
                        font-size: 18px;
                        margin: 10px;
                        cursor: pointer;
                      `;
                      
                      // Create cancel button
                      const cancelBtn = document.createElement('button');
                      cancelBtn.textContent = '❌ Cancel';
                      cancelBtn.style.cssText = `
                        background: #dc2626;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        padding: 15px 30px;
                        font-size: 18px;
                        margin: 10px;
                        cursor: pointer;
                      `;
                      
                      modal.appendChild(video);
                      modal.appendChild(captureBtn);
                      modal.appendChild(cancelBtn);
                      document.body.appendChild(modal);
                      
                      // Capture photo
                      captureBtn.onclick = () => {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        
                        canvas.width = video.videoWidth;
                        canvas.height = video.videoHeight;
                        ctx?.drawImage(video, 0, 0);
                        
                        canvas.toBlob((blob) => {
                          if (blob) {
                            const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
                            handleFileSelect(file);
                          }
                          
                          // Cleanup
                          stream.getTracks().forEach(track => track.stop());
                          document.body.removeChild(modal);
                        }, 'image/jpeg', 0.8);
                      };
                      
                      // Cancel
                      cancelBtn.onclick = () => {
                        stream.getTracks().forEach(track => track.stop());
                        document.body.removeChild(modal);
                      };
                      
                    } catch (error) {
                      console.log('📷 getUserMedia failed, using file input fallback:', error);
                      if (cameraInputRef.current) {
                        cameraInputRef.current.click();
                      }
                    }
                  } else {
                    // Fallback for all other cases
                    console.log('📷 Using file input fallback');
                    if (cameraInputRef.current) {
                      cameraInputRef.current.click();
                    }
                  }
                }}
                className="h-24 bg-blue-600 hover:bg-blue-700 text-white flex flex-col items-center justify-center space-y-2"
                data-testid="camera-button"
              >
                <Camera className="h-8 w-8" />
                <div className="text-center">
                  <div className="text-lg font-semibold">Take Photo</div>
                  <div className="text-sm opacity-90">Use your camera to scan text</div>
                </div>
              </Button>
              
              {/* File Upload Button */}
              <Button
                size="lg"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="h-24 border-2 border-dashed border-gray-300 hover:border-blue-400 flex flex-col items-center justify-center space-y-2"
              >
                <Upload className="h-8 w-8 text-blue-600" />
                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-600">Upload Image</div>
                  <div className="text-sm text-gray-500">Choose a file from your device</div>
                </div>
              </Button>
            </div>
          </div>

          {/* Image Preview */}
          {imagePreview && (
            <div className="space-y-2">
              <h4 className="font-medium">Selected Image:</h4>
              <div className="flex justify-center">
                <img
                  src={imagePreview}
                  alt="Selected for OCR"
                  className="max-h-60 rounded-lg border object-contain"
                />
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center space-x-2 py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Extracting text from image...</span>
            </div>
          )}

          {/* Extracted Text */}
          {extractedText && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Extracted Text:</h4>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyToClipboard}
                    className="flex items-center space-x-2"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    <span>{copied ? "Copied!" : "Copy"}</span>
                  </Button>
                  <Button
                    size="sm"
                    onClick={addTextToChat}
                    disabled={sendMessageMutation.isPending}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {sendMessageMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                    <span>{sendMessageMutation.isPending ? "Sending..." : "Send to GabAi"}</span>
                  </Button>
                  
                  {/* Business Card Detection */}
                  {(extractedText.toLowerCase().includes('phone') ||
                   extractedText.toLowerCase().includes('email') ||
                   extractedText.toLowerCase().includes('@') ||
                   /\d{3}.*\d{3}.*\d{4}/.test(extractedText)) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        if (!user || !selectedFile) return;
                        try {
                          const result = await api.processBusinessCard(selectedFile, user.id);
                          toast({
                            title: "Contact Created!",
                            description: result.message,
                          });
                        } catch (error: any) {
                          toast({
                            title: "Error",
                            description: error.message,
                            variant: "destructive",
                          });
                        }
                      }}
                      className="flex items-center space-x-2"
                    >
                      <User className="h-4 w-4" />
                      <span>Save as Contact</span>
                    </Button>
                  )}
                </div>
              </div>
              <Textarea
                value={extractedText}
                onChange={(e) => setExtractedText(e.target.value)}
                className="min-h-[300px] max-h-[500px] text-lg leading-relaxed p-6 resize-y overflow-y-auto"
                style={{ fontSize: '18px', lineHeight: '1.6' }}
                placeholder="Extracted text will appear here..."
              />
              <p className="text-base text-gray-600 dark:text-gray-400 text-center">
                You can edit the extracted text above before copying or sending to GabAi.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}// Force rebuild Wed Aug 27 10:28:39 PM UTC 2025
