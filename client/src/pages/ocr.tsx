import { ImageTextExtractor } from "@/components/ocr/image-text-extractor";

export function OCRPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Text Extractor
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Extract text from images using AI-powered OCR technology. Perfect for digitizing handwritten lists, invitations, receipts, and more.
        </p>
      </div>
      
      <ImageTextExtractor />
    </div>
  );
}