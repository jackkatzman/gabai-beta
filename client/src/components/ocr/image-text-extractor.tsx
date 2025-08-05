import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Upload, Camera, FileText, Copy, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export function ImageTextExtractor() {
  const [extractedText, setExtractedText] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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

  const addTextToChat = async () => {
    if (!extractedText.trim()) return;
    
    try {
      // This would integrate with the chat system
      toast({
        title: "Added to chat",
        description: "The extracted text has been sent to GabAi for processing.",
      });
      // TODO: Integrate with chat system to send extracted text
    } catch (error) {
      toast({
        title: "Failed to add to chat",
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Image Text Extractor</span>
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Upload images of lists, invitations, receipts, or any text-based documents to extract the text content.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload Area */}
          <div
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="flex flex-col items-center space-y-4">
              <div className="flex space-x-4">
                <Upload className="h-8 w-8 text-gray-400" />
                <Camera className="h-8 w-8 text-gray-400" />
              </div>
              <div>
                <p className="text-lg font-medium">Drop an image here or click to upload</p>
                <p className="text-sm text-gray-500">
                  Supports JPG, PNG, and other image formats
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                <Badge variant="secondary">Shopping Lists</Badge>
                <Badge variant="secondary">Wedding Invitations</Badge>
                <Badge variant="secondary">Business Cards</Badge>
                <Badge variant="secondary">Receipts</Badge>
                <Badge variant="secondary">Handwritten Notes</Badge>
              </div>
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
                    className="flex items-center space-x-2"
                  >
                    <Camera className="h-4 w-4" />
                    <span>Send to GabAi</span>
                  </Button>
                </div>
              </div>
              
              {/* Sharing Options */}
              <div className="space-y-2">
                <h5 className="text-sm font-medium">Share extracted text:</h5>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={shareViaWhatsApp}
                    className="flex items-center space-x-2"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.690z"/>
                    </svg>
                    <span>WhatsApp</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={shareViaSMS}
                    className="flex items-center space-x-2"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                    </svg>
                    <span>SMS</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={shareViaEmail}
                    className="flex items-center space-x-2"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                    </svg>
                    <span>Email</span>
                  </Button>
                </div>
              </div>
              <Textarea
                value={extractedText}
                onChange={(e) => setExtractedText(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
                placeholder="Extracted text will appear here..."
              />
              <p className="text-xs text-gray-500">
                You can edit the extracted text above before copying or sending to GabAi.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}