import { Star, Download, Eye, Link as LinkIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

interface RelatedNote {
  id: string;
  title: string;
  subject: string;
  uploader: string;
  uploaderId: string;
  rating: string;
  downloads: number;
  views: number;
  fileType: string;
  createdAt: string;
  description?: string;
  tags?: string[];
  similarity: number;
}

interface RelatedNotesProps {
  noteId: string;
  className?: string;
}

export function RelatedNotes({ noteId, className = "" }: RelatedNotesProps) {
  const { data: relatedNotes = [], isLoading, error } = useQuery<RelatedNote[]>({
    queryKey: [`/api/notes/${noteId}/related`],
    enabled: !!noteId
  });

  const getFileTypeIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf': return '📄';
      case 'image': return '🖼️';
      case 'text': return '📝';
      default: return '📎';
    }
  };

  const getSimilarityBadge = (similarity: number) => {
    if (similarity >= 10) return { text: "Very Similar", variant: "default" as const };
    if (similarity >= 6) return { text: "Similar", variant: "secondary" as const };
    return { text: "Related", variant: "outline" as const };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className={className}>
        <div className="flex items-center gap-2 mb-4">
          <LinkIcon className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Related Notes</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !relatedNotes?.length) {
    return null; // Don't show anything if no related notes
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-4">
        <LinkIcon className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Related Notes</h3>
        <Badge variant="secondary" className="text-xs">
          {relatedNotes.length} found
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {relatedNotes.map((note) => {
          const similarityBadge = getSimilarityBadge(note.similarity);
          
          return (
            <Card key={note.id} className="hover:shadow-md transition-shadow cursor-pointer group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{getFileTypeIcon(note.fileType)}</span>
                      <Badge variant={similarityBadge.variant} className="text-xs">
                        {similarityBadge.text}
                      </Badge>
                    </div>
                    <CardTitle className="text-base leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors">
                      <Link href={`/notes/${note.id}`} className="hover:underline">
                        {note.title}
                      </Link>
                    </CardTitle>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <Badge variant="outline" className="text-xs">{note.subject}</Badge>
                  <span className="text-xs">{formatDate(note.createdAt)}</span>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  {/* Description */}
                  {note.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {note.description}
                    </p>
                  )}

                  {/* Uploader */}
                  <div className="flex items-center gap-2 text-sm">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-xs">
                        {note.uploader.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-gray-600 text-xs">{note.uploader}</span>
                  </div>

                  {/* Tags */}
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {note.tags.slice(0, 2).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0.5">
                          {tag}
                        </Badge>
                      ))}
                      {note.tags.length > 2 && (
                        <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                          +{note.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {parseFloat(note.rating || '0').toFixed(1)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Download className="h-3 w-3 text-blue-600" />
                        {note.downloads}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3 text-gray-500" />
                        {note.views}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}