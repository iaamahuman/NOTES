import { FileText, FileImage, Download, Eye, Star, Heart, Share2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/rating-stars";
import type { NoteWithUploader } from "@shared/schema";
import { downloadNote } from "@/lib/api";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface NoteCardProps {
  note: NoteWithUploader;
  variant?: "featured" | "compact";
  showBookmark?: boolean;
  isBookmarked?: boolean;
  onBookmarkToggle?: (noteId: string) => void;
}

export function NoteCard({ 
  note, 
  variant = "featured", 
  showBookmark = true,
  isBookmarked = false,
  onBookmarkToggle 
}: NoteCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { toast } = useToast();

  const handleDownload = () => {
    downloadNote(note.id);
    toast({
      title: "Download started",
      description: `Downloading ${note.title}`,
    });
  };

  const handleBookmark = () => {
    if (onBookmarkToggle) {
      onBookmarkToggle(note.id);
      toast({
        title: isBookmarked ? "Removed from bookmarks" : "Added to bookmarks",
        description: isBookmarked ? "Note removed from your bookmarks" : "Note saved to your bookmarks",
      });
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: note.title,
        text: note.description || `Check out this note: ${note.title}`,
        url: `${window.location.origin}/notes/${note.id}`,
      });
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/notes/${note.id}`);
      toast({
        title: "Link copied",
        description: "Note link copied to clipboard",
      });
    }
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
      <Card 
        className="hover:shadow-lg transition-all duration-200 border border-gray-200 dark:border-gray-700 dark:bg-gray-800" 
        data-testid={`note-card-compact-${note.id}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              {getFileIcon()}
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {note.fileType.toUpperCase()} • {formatFileSize(note.fileSize)}
              </span>
            </div>
            {note.tags && note.tags.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {note.tags[0]}
              </Badge>
            )}
          </div>
          
          <h4 className="font-medium text-gray-900 dark:text-white mb-2 line-clamp-2" data-testid={`note-title-${note.id}`}>
            {note.title}
          </h4>
          
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3" data-testid={`note-subject-${note.id}`}>
            {note.subject}
          </p>

          <div className="flex items-center justify-between mb-3">
            <RatingStars rating={parseFloat(note.rating || '0')} size="sm" readonly />
            <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
              <span>{note.downloads} downloads</span>
              <span>•</span>
              <span>{note.views} views</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {note.uploader.username.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-300" data-testid={`note-uploader-${note.id}`}>
                {note.uploader.username}
              </span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-500 dark:text-gray-400" data-testid={`note-date-${note.id}`}>
                {formatDate(note.createdAt)}
              </span>
            </div>
            
            {isHovered && showBookmark && (
              <div className="flex items-center space-x-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleBookmark}
                  className="h-6 w-6 p-0"
                  data-testid={`bookmark-button-${note.id}`}
                >
                  <Heart className={`h-3 w-3 ${isBookmarked ? 'fill-red-500 text-red-500' : ''}`} />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={handleShare}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDownload}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className="shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 dark:bg-gray-800 group" 
      data-testid={`note-card-featured-${note.id}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-2">
            {getFileIcon()}
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {note.fileType.toUpperCase()}
            </span>
            {note.tags && note.tags.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {note.tags[0]}
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <RatingStars rating={parseFloat(note.rating || '0')} size="sm" readonly />
            {isHovered && showBookmark && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleBookmark}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                data-testid={`bookmark-button-${note.id}`}
              >
                <Heart className={`h-4 w-4 ${isBookmarked ? 'fill-red-500 text-red-500' : ''}`} />
              </Button>
            )}
          </div>
        </div>

        <div className="w-full h-32 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg mb-4 flex items-center justify-center">
          <div className="text-6xl opacity-20">
            {note.fileType === "pdf" ? "📄" : note.fileType === "image" ? "🖼️" : "📝"}
          </div>
        </div>

        <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2 line-clamp-2" data-testid={`note-title-${note.id}`}>
          {note.title}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-3" data-testid={`note-description-${note.id}`}>
          {note.description || "No description available"}
        </p>

        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
          <span data-testid={`note-subject-${note.id}`}>{note.subject}</span>
          <span data-testid={`note-date-${note.id}`}>{formatDate(note.createdAt)}</span>
        </div>

        <div className="flex items-center space-x-3 mb-4">
          <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
            {note.uploader.username.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-300" data-testid={`note-uploader-${note.id}`}>
            {note.uploader.username}
          </span>
          <span className="text-sm text-gray-400">•</span>
          <span className="text-sm text-gray-500 dark:text-gray-400" data-testid={`note-downloads-${note.id}`}>
            {note.downloads} downloads
          </span>
          <span className="text-sm text-gray-400">•</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {note.views} views
          </span>
        </div>

        <div className="flex gap-2">
          <Button className="flex-1" data-testid={`button-view-${note.id}`}>
            <Eye className="h-4 w-4 mr-2" />
            View
          </Button>
          <Button
            variant="outline"
            onClick={handleShare}
            data-testid={`button-share-${note.id}`}
          >
            <Share2 className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
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
