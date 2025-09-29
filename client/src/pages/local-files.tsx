import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Image, Download, Trash2, Search } from "lucide-react";
import { Link } from "wouter";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { useAuth } from "@/contexts/auth";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

interface SavedFile {
  id: string;
  filename: string;
  type: string;
  size: number;
  url?: string;
  createdAt: Date;
  source: string;
}

export function LocalFilesPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<"all" | "image" | "document">("all");

  // For now, we'll use localStorage to track files
  // In production, this would come from the database
  const { data: files = [], refetch } = useQuery({
    queryKey: ["/local-files", user?.id],
    queryFn: async () => {
      // Get files from localStorage for now
      const savedFiles = localStorage.getItem(`gabai_files_${user?.id}`);
      return savedFiles ? JSON.parse(savedFiles) : [];
    },
    enabled: !!user,
  });

  const filteredFiles = files.filter((file: SavedFile) => {
    const matchesSearch = file.filename.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "all" || 
      (selectedType === "image" && file.type.startsWith("image/")) ||
      (selectedType === "document" && !file.type.startsWith("image/"));
    return matchesSearch && matchesType;
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const handleDelete = (fileId: string) => {
    const updatedFiles = files.filter((f: SavedFile) => f.id !== fileId);
    localStorage.setItem(`gabai_files_${user?.id}`, JSON.stringify(updatedFiles));
    refetch();
  };

  const handleDownload = (file: SavedFile) => {
    // Create download link
    const link = document.createElement("a");
    link.href = file.url || "";
    link.download = file.filename;
    link.click();
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4 mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Home</span>
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Local Files</h1>
          <div className="w-16"></div>
        </div>
        
        {/* Title and Description */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Your Files
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            Photos, documents, and files captured from your conversations
          </p>
        </div>
        
        {/* Search and Filter */}
        <div className="mb-6 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={selectedType === "all" ? "default" : "outline"}
              onClick={() => setSelectedType("all")}
            >
              All Files
            </Button>
            <Button
              size="sm"
              variant={selectedType === "image" ? "default" : "outline"}
              onClick={() => setSelectedType("image")}
            >
              <Image className="h-4 w-4 mr-1" />
              Images
            </Button>
            <Button
              size="sm"
              variant={selectedType === "document" ? "default" : "outline"}
              onClick={() => setSelectedType("document")}
            >
              <FileText className="h-4 w-4 mr-1" />
              Documents
            </Button>
          </div>
        </div>
        
        {/* Files Grid */}
        {filteredFiles.length === 0 ? (
          <div className="text-center py-12">
            <div className="mb-4">
              <FileText className="h-12 w-12 mx-auto text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No files yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Files from your chat conversations will appear here
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredFiles.map((file: SavedFile) => (
              <div
                key={file.id}
                className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 flex items-center justify-between"
              >
                <div className="flex items-start space-x-3 flex-1">
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded">
                    {file.type.startsWith("image/") ? (
                      <Image className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    ) : (
                      <FileText className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 dark:text-white truncate">
                      {file.filename}
                    </h4>
                    <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span>{formatFileSize(file.size)}</span>
                      <span>•</span>
                      <span>{formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}</span>
                      <span>•</span>
                      <span>{file.source}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDownload(file)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(file.id)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Bottom Navigation */}
      <div className="h-20" />
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <BottomNav />
      </div>
    </div>
  );
}