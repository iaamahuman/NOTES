import { useState, useEffect } from "react";
import { TrendingUp, Star, Download, Eye, Calendar, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

interface TrendingNote {
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
  trendingScore: number;
  tags?: string[];
}

interface TrendingNotesProps {
  limit?: number;
  showHeader?: boolean;
  className?: string;
}

export function TrendingNotes({ limit = 6, showHeader = true, className = "" }: TrendingNotesProps) {
  const { data: trendingNotes, isLoading, error } = useQuery({
    queryKey: ['/api/notes/trending'],
    select: (data: TrendingNote[]) => data.slice(0, limit)
  });

  const getFileTypeIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf': return '📄';
      case 'image': return '🖼️';
      case 'text': return '📝';
      default: return '📎';
    }
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
        {showHeader && (
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="h-6 w-6 text-orange-600" />
            <h2 className="text-2xl font-bold">Trending Notes</h2>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: limit }).map((_, i) => (
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

  if (error || !trendingNotes?.length) {
    return (
      <div className={className}>
        {showHeader && (
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="h-6 w-6 text-orange-600" />
            <h2 className="text-2xl font-bold">Trending Notes</h2>
          </div>
        )}
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <p className="text-gray-500">No trending notes available at the moment.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={className}>
      {showHeader && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-orange-600" />
            <h2 className="text-2xl font-bold">Trending Notes</h2>
          </div>
          <Link href="/trending">
            <Button variant="outline" size="sm">
              View All
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {trendingNotes.map((note, index) => (
          <Card key={note.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{getFileTypeIcon(note.fileType)}</span>
                    <Badge variant={index < 3 ? "default" : "secondary"} className="text-xs">
                      #{index + 1} Trending
                    </Badge>
                  </div>
                  <CardTitle className="text-lg leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors">
                    <Link href={`/notes/${note.id}`} className="hover:underline">
                      {note.title}
                    </Link>
                  </CardTitle>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-600">
                <Badge variant="outline">{note.subject}</Badge>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(note.createdAt)}
                </span>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                {/* Uploader */}
                <div className="flex items-center gap-2 text-sm">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {note.uploader.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-gray-600">{note.uploader}</span>
                </div>

                {/* Tags */}
                {note.tags && note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {note.tags.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs px-2 py-0.5">
                        {tag}
                      </Badge>
                    ))}
                    {note.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs px-2 py-0.5">
                        +{note.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-gray-600">
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
                  <div className="flex items-center gap-1 text-orange-600 font-medium">
                    <TrendingUp className="h-3 w-3" />
                    {Math.round(note.trendingScore)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}