import { useState } from "react";
import { Sparkles, Star, Download, Eye, Heart, ExternalLink, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface RecommendedNote {
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
  recommendationScore: number;
}

interface PersonalizedRecommendationsProps {
  limit?: number;
  showHeader?: boolean;
  className?: string;
}

export function PersonalizedRecommendations({ 
  limit = 6, 
  showHeader = true, 
  className = "" 
}: PersonalizedRecommendationsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: recommendations, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/notes/recommendations'],
    select: (data: RecommendedNote[]) => data.slice(0, limit),
    retry: 1
  });

  const getFileTypeIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf': return '📄';
      case 'image': return '🖼️';
      case 'text': return '📝';
      default: return '📎';
    }
  };

  const getRecommendationReason = (score: number) => {
    if (score >= 15) return "Perfect match";
    if (score >= 10) return "Great match";
    if (score >= 5) return "Good match";
    return "Interesting";
  };

  const handleRefresh = async () => {
    try {
      await refetch();
      toast({
        title: "Recommendations updated",
        description: "We've found new notes that might interest you!",
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Unable to refresh recommendations. Please try again.",
        variant: "destructive",
      });
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
            <Sparkles className="h-6 w-6 text-purple-600" />
            <h2 className="text-2xl font-bold">Recommended for You</h2>
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

  if (error) {
    return (
      <div className={className}>
        {showHeader && (
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="h-6 w-6 text-purple-600" />
            <h2 className="text-2xl font-bold">Recommended for You</h2>
          </div>
        )}
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-32 text-center">
            <p className="text-gray-500 mb-3">Please log in to see personalized recommendations</p>
            <Link href="/login">
              <Button size="sm">Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!recommendations?.length) {
    return (
      <div className={className}>
        {showHeader && (
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="h-6 w-6 text-purple-600" />
            <h2 className="text-2xl font-bold">Recommended for You</h2>
          </div>
        )}
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-32 text-center">
            <p className="text-gray-500 mb-3">Upload some notes to get personalized recommendations!</p>
            <Link href="/upload">
              <Button size="sm">
                Upload Notes
              </Button>
            </Link>
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
            <Sparkles className="h-6 w-6 text-purple-600" />
            <h2 className="text-2xl font-bold">Recommended for You</h2>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Link href="/recommendations">
              <Button variant="outline" size="sm">
                View All
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations.map((note) => (
          <Card key={note.id} className="hover:shadow-lg transition-shadow cursor-pointer group border-l-4 border-l-purple-500">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{getFileTypeIcon(note.fileType)}</span>
                    <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                      <Heart className="h-3 w-3 mr-1" />
                      {getRecommendationReason(note.recommendationScore)}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg leading-tight line-clamp-2 group-hover:text-purple-600 transition-colors">
                    <Link href={`/notes/${note.id}`} className="hover:underline">
                      {note.title}
                    </Link>
                  </CardTitle>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-600">
                <Badge variant="outline">{note.subject}</Badge>
                <span>{formatDate(note.createdAt)}</span>
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
                  <div className="flex items-center gap-1 text-purple-600 font-medium text-xs">
                    <Sparkles className="h-3 w-3" />
                    {Math.round(note.recommendationScore)}% match
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