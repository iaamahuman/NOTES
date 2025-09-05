import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { 
  Download, Eye, Calendar, User, FileText, Star, 
  Heart, Share2, Flag, Bookmark, BookmarkCheck 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { RatingStars } from "@/components/rating-stars";
import { CommentSection } from "@/components/comment-section";
import { Header } from "@/components/header";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  getNoteDetails, 
  getNoteComments, 
  downloadNote, 
  createBookmark, 
  removeBookmark,
  createComment 
} from "@/lib/api";
import type { NoteWithDetails, CommentWithUser } from "@shared/schema";

export default function NoteDetail() {
  const [match, params] = useRoute("/notes/:id");
  const noteId = params?.id || "";
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: note, isLoading: isLoadingNote } = useQuery({
    queryKey: ['/api/notes', noteId, 'details'],
    queryFn: () => getNoteDetails(noteId),
    enabled: !!noteId,
  });

  const { data: comments = [], isLoading: isLoadingComments } = useQuery({
    queryKey: ['/api/notes', noteId, 'comments'],
    queryFn: () => getNoteComments(noteId),
    enabled: !!noteId,
  });

  const downloadMutation = useMutation({
    mutationFn: async (noteId: string) => {
      downloadNote(noteId);
      return Promise.resolve();
    },
    onSuccess: () => {
      toast({ title: "Download started", description: "Your file is being downloaded." });
      queryClient.invalidateQueries({ queryKey: ['/api/notes', noteId] });
    },
    onError: () => {
      toast({ title: "Download failed", description: "Please try again later.", variant: "destructive" });
    }
  });

  const bookmarkMutation = useMutation({
    mutationFn: async ({ noteId, isCurrentlyBookmarked }: { noteId: string; isCurrentlyBookmarked: boolean }) => {
      if (isCurrentlyBookmarked) {
        return removeBookmark(noteId);
      } else {
        return createBookmark(noteId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes', noteId, 'details'] });
      toast({ 
        title: note?.isBookmarked ? "Bookmark removed" : "Bookmark added", 
        description: note?.isBookmarked ? "Note removed from bookmarks" : "Note added to bookmarks" 
      });
    },
    onError: () => {
      toast({ 
        title: "Action failed", 
        description: "Failed to update bookmark",
        variant: "destructive" 
      });
    }
  });

  const handleDownload = () => {
    downloadMutation.mutate(noteId);
  };

  const handleRating = (rating: number) => {
    // TODO: Implement rating functionality
    toast({ 
      title: "Rating submitted", 
      description: `You rated this note ${rating} stars.` 
    });
  };

  const handleBookmark = () => {
    const isCurrentlyBookmarked = note?.isBookmarked || false;
    bookmarkMutation.mutate({ noteId, isCurrentlyBookmarked });
  };

  const handleAddComment = (content: string, parentId?: string) => {
    toast({ 
      title: "Comment posted", 
      description: "Your comment has been added successfully." 
    });
  };

  const handleEditComment = (commentId: string, content: string) => {
    toast({ 
      title: "Comment updated", 
      description: "Your comment has been updated successfully." 
    });
  };

  const handleDeleteComment = (commentId: string) => {
    toast({ 
      title: "Comment deleted", 
      description: "Your comment has been removed." 
    });
  };

  if (!match) {
    return <div>Note not found</div>;
  }

  if (isLoadingNote) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header onSearchChange={() => {}} onUploadClick={() => {}} />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!note) {
    return <div>Note not found</div>;
  }

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header onSearchChange={() => {}} onUploadClick={() => {}} />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Note Header */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" data-testid="note-subject">
                        {note.subject}
                      </Badge>
                      {note.isFeatured && (
                        <Badge className="bg-yellow-500 hover:bg-yellow-600" data-testid="featured-badge">
                          ⭐ Featured
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-2xl mb-3" data-testid="note-title">
                      {note.title}
                    </CardTitle>
                    {note.description && (
                      <p className="text-gray-600 leading-relaxed" data-testid="note-description">
                        {note.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Tags */}
                {note.tags && note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4" data-testid="note-tags">
                    {note.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Course Info */}
                {(note.course || note.professor || note.semester) && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                      {note.course && (
                        <div>
                          <span className="font-medium">Course:</span> {note.course}
                        </div>
                      )}
                      {note.professor && (
                        <div>
                          <span className="font-medium">Professor:</span> {note.professor}
                        </div>
                      )}
                      {note.semester && (
                        <div>
                          <span className="font-medium">Semester:</span> {note.semester}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardHeader>

              <CardContent>
                {/* Actions */}
                <div className="flex flex-wrap gap-3 mb-6">
                  <Button 
                    onClick={handleDownload}
                    disabled={downloadMutation.isPending}
                    className="bg-primary hover:bg-primary/90"
                    data-testid="download-button"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {downloadMutation.isPending ? "Downloading..." : "Download"}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={handleBookmark}
                    className="flex items-center gap-2"
                    data-testid="bookmark-button"
                  >
                    {note?.isBookmarked ? (
                      <>
                        <BookmarkCheck className="h-4 w-4" />
                        Bookmarked
                      </>
                    ) : (
                      <>
                        <Bookmark className="h-4 w-4" />
                        Bookmark
                      </>
                    )}
                  </Button>

                  <Button variant="outline" data-testid="share-button">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>

                  <Button variant="outline" size="sm" data-testid="report-button">
                    <Flag className="h-4 w-4 mr-2" />
                    Report
                  </Button>
                </div>

                {/* Rating Section */}
                <div className="space-y-4">
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="font-medium">Rate this note</h4>
                    <div className="flex items-center gap-4">
                      <RatingStars
                        rating={note?.userRating || 0}
                        onRatingChange={handleRating}
                        size="lg"
                      />
                      <div className="text-sm text-gray-600">
                        <RatingStars
                          rating={parseFloat(note.rating || '0')}
                          readonly
                          showCount
                          count={note.ratingCount}
                          size="sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Comments Section */}
            <Card>
              <CardContent className="p-6">
                {isLoadingComments ? (
                  <div className="space-y-4">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : (
                  <CommentSection
                    noteId={noteId}
                    comments={comments}
                    onAddComment={handleAddComment}
                    onEditComment={handleEditComment}
                    onDeleteComment={handleDeleteComment}
                    currentUserId="sample-user-id"
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* File Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">File Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium" data-testid="file-name">{note.fileName}</p>
                    <p className="text-sm text-gray-600">
                      {note.fileType.toUpperCase()} • {formatFileSize(note.fileSize)}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Downloads
                    </span>
                    <span className="font-medium" data-testid="download-count">
                      {note.downloads.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Views
                    </span>
                    <span className="font-medium" data-testid="view-count">
                      {note.views.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Uploaded
                    </span>
                    <span className="font-medium" data-testid="upload-date">
                      {formatDate(note.createdAt)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Uploader Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Uploader</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={note.uploader.avatar || undefined} />
                    <AvatarFallback>
                      {note.uploader.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium" data-testid="uploader-name">
                      {note.uploader.username}
                    </p>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-current text-yellow-400" />
                      <span className="text-sm text-gray-600" data-testid="uploader-reputation">
                        {note.uploader.reputation} reputation
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Button className="w-full" variant="outline" data-testid="view-profile-button">
                    <User className="h-4 w-4 mr-2" />
                    View Profile
                  </Button>
                  <Button className="w-full" variant="outline" data-testid="follow-button">
                    <Heart className="h-4 w-4 mr-2" />
                    Follow
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}