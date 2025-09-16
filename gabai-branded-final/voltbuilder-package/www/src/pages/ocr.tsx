import { ImageTextExtractor } from "@/components/ocr/image-text-extractor";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { BottomNav } from "@/components/navigation/bottom-nav";

export function OCRPage() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Navigation Header */}
        <div className="flex items-center justify-between border-b pb-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Text Scanner</h1>
          <div className="w-20"></div> {/* Spacer for balance */}
        </div>
        
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Text Extractor
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Extract text from images using AI-powered OCR technology. Perfect for digitizing handwritten lists, invitations, receipts, and more.
          </p>
        </div>
        
        <ImageTextExtractor />
      </div>
      
      {/* Bottom Navigation */}
      <div className="h-20" /> {/* Spacer for bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <BottomNav />
      </div>
    </div>
  );
}