import { useState, useEffect } from "react";
import { FileText, Image, Download, ExternalLink, Eye, EyeOff, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeletons";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import type { Note } from "@shared/schema";

interface FilePreviewProps {
  note: Note;
  className?: string;
  showFullscreen?: boolean;
}

interface PreviewProps {
  note: Note;
  isFullscreen?: boolean;
}

function PDFPreview({ note, isFullscreen }: PreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleLoad = () => {
    setIsLoading(false);
    setError(null);
  };

  const handleError = () => {
    setIsLoading(false);
    setError("Failed to load PDF preview");
  };

  return (
    <div className={cn("relative", isFullscreen ? "h-[80vh]" : "h-96")}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <Skeleton className="w-full h-full" />
        </div>
      )}
      
      {error ? (
        <Alert className="h-full">
          <FileText className="h-4 w-4" />
          <AlertDescription>
            {error}. <a href={`/uploads/${note.fileName}`} target="_blank" rel="noopener noreferrer" className="underline">Open in new tab</a>
          </AlertDescription>
        </Alert>
      ) : (
        <iframe
          src={`/uploads/${note.fileName}#toolbar=0`}
          className={cn("w-full rounded-lg border", isFullscreen ? "h-full" : "h-96")}
          title={`Preview of ${note.title}`}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </div>
  );
}

function ImagePreview({ note, isFullscreen }: PreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleLoad = () => {
    setIsLoading(false);
    setError(null);
  };

  const handleError = () => {
    setIsLoading(false);
    setError("Failed to load image");
  };

  return (
    <div className={cn("relative flex items-center justify-center bg-gray-50 rounded-lg", isFullscreen ? "h-[80vh]" : "h-96")}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Skeleton className="w-full h-full" />
        </div>
      )}
      
      {error ? (
        <Alert>
          <Image className="h-4 w-4" />
          <AlertDescription>
            {error}. <a href={`/uploads/${note.fileName}`} target="_blank" rel="noopener noreferrer" className="underline">Open in new tab</a>
          </AlertDescription>
        </Alert>
      ) : (
        <img
          src={`/uploads/${note.fileName}`}
          alt={note.title}
          className={cn("max-w-full max-h-full object-contain rounded-lg", isFullscreen ? "h-full" : "h-96")}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </div>
  );
}

function TextPreview({ note, isFullscreen }: PreviewProps) {
  const [content, setContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTextContent = async () => {
      try {
        const response = await fetch(`/uploads/${note.fileName}`);
        if (!response.ok) throw new Error("Failed to fetch file content");
        
        const text = await response.text();
        setContent(text);
      } catch (err) {
        setError("Failed to load text content");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTextContent();
  }, [note.fileName]);

  if (isLoading) {
    return (
      <div className={cn("space-y-2", isFullscreen ? "h-[80vh]" : "h-96")}>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription>
          {error}. <a href={`/uploads/${note.fileName}`} target="_blank" rel="noopener noreferrer" className="underline">Open in new tab</a>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={cn("bg-gray-50 rounded-lg p-4 overflow-auto", isFullscreen ? "h-[80vh]" : "h-96")}>
      <pre className="whitespace-pre-wrap text-sm font-mono text-gray-900">
        {content}
      </pre>
    </div>
  );
}

function UnsupportedFilePreview({ note }: PreviewProps) {
  return (
    <div className="h-96 flex flex-col items-center justify-center bg-gray-50 rounded-lg text-gray-500">
      <FileText className="h-16 w-16 mb-4 text-gray-300" />
      <p className="text-lg font-medium mb-2">Preview not available</p>
      <p className="text-sm text-center mb-4 max-w-md">
        This file type ({note.fileType.toUpperCase()}) cannot be previewed directly. 
        You can download the file to view its contents.
      </p>
      <div className="flex gap-2">
        <Button asChild>
          <a href={`/api/notes/${note.id}/download`} target="_blank">
            <Download className="h-4 w-4 mr-2" />
            Download
          </a>
        </Button>
        <Button variant="outline" asChild>
          <a href={`/uploads/${note.fileName}`} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            Open
          </a>
        </Button>
      </div>
    </div>
  );
}

function getPreviewComponent(note: Note, isFullscreen?: boolean) {
  const props = { note, isFullscreen };
  
  switch (note.fileType.toLowerCase()) {
    case "pdf":
      return <PDFPreview {...props} />;
    case "image":
      return <ImagePreview {...props} />;
    case "text":
      return <TextPreview {...props} />;
    default:
      return <UnsupportedFilePreview {...props} />;
  }
}

export function FilePreview({ note, className, showFullscreen = true }: FilePreviewProps) {
  const [previewVisible, setPreviewVisible] = useState(true);

  const formatFileSize = (bytes: number): string => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i) * 10) / 10} ${sizes[i]}`;
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* File Info Header */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-white rounded-lg">
            {note.fileType === "pdf" && <FileText className="h-6 w-6 text-red-600" />}
            {note.fileType === "image" && <Image className="h-6 w-6 text-blue-600" />}
            {note.fileType === "text" && <FileText className="h-6 w-6 text-gray-600" />}
          </div>
          <div>
            <p className="font-medium text-gray-900">{note.fileName}</p>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Badge variant="outline" className="text-xs">
                {note.fileType.toUpperCase()}
              </Badge>
              <span>{formatFileSize(note.fileSize)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewVisible(!previewVisible)}
          >
            {previewVisible ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Hide Preview
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Show Preview
              </>
            )}
          </Button>

          {showFullscreen && previewVisible && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Maximize2 className="h-4 w-4 mr-2" />
                  Fullscreen
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl w-full h-full max-h-screen p-6">
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-2">
                    <span>{note.title}</span>
                    <Badge variant="outline">{note.fileType.toUpperCase()}</Badge>
                  </DialogTitle>
                </DialogHeader>
                {getPreviewComponent(note, true)}
              </DialogContent>
            </Dialog>
          )}

          <Button size="sm" asChild>
            <a href={`/api/notes/${note.id}/download`}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </a>
          </Button>
        </div>
      </div>

      {/* Preview Content */}
      {previewVisible && (
        <div className="border rounded-lg p-4 bg-white">
          {getPreviewComponent(note, false)}
        </div>
      )}
    </div>
  );
}

// Compact version for use in cards or smaller spaces
export function CompactFilePreview({ note, className }: { note: Note; className?: string }) {
  return (
    <div className={cn("relative group", className)}>
      <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
        {note.fileType === "image" ? (
          <img
            src={`/uploads/${note.fileName}`}
            alt={note.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {note.fileType === "pdf" && <FileText className="h-12 w-12 text-red-600" />}
            {note.fileType === "text" && <FileText className="h-12 w-12 text-gray-600" />}
          </div>
        )}
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Button size="sm" variant="secondary">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
        </div>
      </div>
      
      <div className="absolute top-2 right-2">
        <Badge variant="secondary" className="text-xs">
          {note.fileType.toUpperCase()}
        </Badge>
      </div>
    </div>
  );
}
