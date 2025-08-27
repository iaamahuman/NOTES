import { FileText, FileImage, Download, Eye, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { NoteWithUploader } from "@shared/schema";
import { downloadNote } from "@/lib/api";

interface NoteCardProps {
  note: NoteWithUploader;
  variant?: "featured" | "compact";
}

export function NoteCard({ note, variant = "featured" }: NoteCardProps) {
  const handleDownload = () => {
    downloadNote(note.id);
  };

  const getFileIcon = () => {
    switch (note.fileType) {
      case "pdf":
        return <FileText className="text-red-500 text-xl" />;
      case "image":
        return <FileImage className="text-green-500 text-xl" />;
      default:
        return <FileText className="text-blue-500 text-xl" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - new Date(date).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} week${Math.ceil(diffDays / 7) > 1 ? 's' : ''} ago`;
    return new Date(date).toLocaleDateString();
  };

  if (variant === "compact") {
    return (
      <Card className="hover:shadow-md transition-shadow" data-testid={`note-card-compact-${note.id}`}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 mb-3">
            {getFileIcon()}
            <span className="text-sm text-gray-500">
              {note.fileType.toUpperCase()} • {formatFileSize(note.fileSize)}
            </span>
          </div>
          <h4 className="font-medium text-gray-900 mb-2 line-clamp-2" data-testid={`note-title-${note.id}`}>
            {note.title}
          </h4>
          <p className="text-sm text-gray-600 mb-3" data-testid={`note-subject-${note.id}`}>
            {note.subject}
          </p>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span data-testid={`note-uploader-${note.id}`}>{note.uploader.username}</span>
            <span data-testid={`note-date-${note.id}`}>{formatDate(note.createdAt)}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow border border-gray-100" data-testid={`note-card-featured-${note.id}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-2">
            {getFileIcon()}
            <span className="text-sm font-medium text-gray-500">
              {note.fileType.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center space-x-1 text-sm text-gray-500">
            <Star className="text-yellow-400 h-4 w-4 fill-current" />
            <span data-testid={`note-rating-${note.id}`}>{parseFloat(note.rating || '0').toFixed(1)}</span>
          </div>
        </div>

        <div className="w-full h-32 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg mb-4 flex items-center justify-center">
          <div className="text-6xl opacity-20">
            {note.fileType === "pdf" ? "📄" : note.fileType === "image" ? "🖼️" : "📝"}
          </div>
        </div>

        <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2" data-testid={`note-title-${note.id}`}>
          {note.title}
        </h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-3" data-testid={`note-description-${note.id}`}>
          {note.description || "No description available"}
        </p>

        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <span data-testid={`note-subject-${note.id}`}>{note.subject}</span>
          <span data-testid={`note-date-${note.id}`}>{formatDate(note.createdAt)}</span>
        </div>

        <div className="flex items-center space-x-3 mb-4">
          <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
            {note.uploader.username.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm text-gray-600" data-testid={`note-uploader-${note.id}`}>
            {note.uploader.username}
          </span>
          <span className="text-sm text-gray-400">•</span>
          <span className="text-sm text-gray-500" data-testid={`note-downloads-${note.id}`}>
            {note.downloads} downloads
          </span>
        </div>

        <div className="flex gap-2">
          <Button className="flex-1" data-testid={`button-view-${note.id}`}>
            <Eye className="h-4 w-4 mr-2" />
            View
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleDownload}
            data-testid={`button-download-${note.id}`}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
