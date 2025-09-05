import { useState } from "react";
import { X, Download, ZoomIn, ZoomOut, RotateCw, Maximize2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface FilePreviewProps {
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  onDownload?: () => void;
  className?: string;
}

export function FilePreview({
  fileUrl,
  fileName,
  fileType,
  fileSize,
  onDownload,
  className,
}: FilePreviewProps) {
  const [zoom, setZoom] = useState([100]);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { toast } = useToast();

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const handleZoomIn = () => {
    setZoom([Math.min(zoom[0] + 25, 200)]);
  };

  const handleZoomOut = () => {
    setZoom([Math.max(zoom[0] - 25, 50)]);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else {
      // Fallback download
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download started",
        description: `Downloading ${fileName}`,
      });
    }
  };

  const PreviewContent = () => {
    if (fileType === 'pdf') {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
          <iframe
            src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=0`}
            className="w-full h-full rounded-lg"
            style={{
              transform: `scale(${zoom[0] / 100}) rotate(${rotation}deg)`,
              transformOrigin: 'center center',
            }}
            title={fileName}
            data-testid="pdf-preview"
          />
        </div>
      );
    }

    if (fileType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileType)) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
          <img
            src={fileUrl}
            alt={fileName}
            className="max-w-full max-h-full object-contain transition-transform duration-200"
            style={{
              transform: `scale(${zoom[0] / 100}) rotate(${rotation}deg)`,
            }}
            data-testid="image-preview"
          />
        </div>
      );
    }

    // Fallback for unsupported file types
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg text-center p-8">
        <div className="text-6xl mb-4">📄</div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Preview not available
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          This file type cannot be previewed in the browser
        </p>
        <Button onClick={handleDownload} data-testid="download-fallback">
          <Download className="h-4 w-4 mr-2" />
          Download to view
        </Button>
      </div>
    );
  };

  const ControlBar = () => (
    <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-4">
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white truncate max-w-48">
            {fileName}
          </h3>
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <Badge variant="secondary">{fileType.toUpperCase()}</Badge>
            <span>{formatFileSize(fileSize)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {/* Zoom Controls */}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            disabled={zoom[0] <= 50}
            data-testid="zoom-out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <div className="w-24">
            <Slider
              value={zoom}
              onValueChange={setZoom}
              max={200}
              min={50}
              step={25}
              className="w-full"
              data-testid="zoom-slider"
            />
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            disabled={zoom[0] >= 200}
            data-testid="zoom-in"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          
          <span className="text-sm text-gray-600 dark:text-gray-400 w-12">
            {zoom[0]}%
          </span>
        </div>

        {/* Action Controls */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleRotate}
          data-testid="rotate"
        >
          <RotateCw className="h-4 w-4" />
        </Button>

        <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" data-testid="fullscreen">
              <Maximize2 className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-7xl max-h-[90vh] p-0">
            <DialogHeader className="p-4 border-b">
              <DialogTitle className="flex items-center justify-between">
                <span>{fileName}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsFullscreen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogTitle>
            </DialogHeader>
            <div className="h-[70vh] p-4">
              <PreviewContent />
            </div>
          </DialogContent>
        </Dialog>

        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          data-testid="download-button"
        >
          <Download className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(fileUrl, '_blank')}
          data-testid="open-external"
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <Card className={`overflow-hidden ${className}`} data-testid="file-preview-card">
      <ControlBar />
      <CardContent className="p-0 h-96">
        <PreviewContent />
      </CardContent>
    </Card>
  );
}