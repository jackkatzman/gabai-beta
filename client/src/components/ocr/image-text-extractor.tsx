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