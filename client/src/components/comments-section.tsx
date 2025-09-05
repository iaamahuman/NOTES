import { useState } from "react";
import { MessageCircle, Heart, Reply, MoreVertical, Flag, Edit, Trash, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

interface Comment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorBadge?: 'verified' | 'educator' | 'student';
  createdAt: Date;
  updatedAt?: Date;
  likes: number;
  isLiked: boolean;
  replies: Comment[];
  isEditing?: boolean;
}

interface CommentsSectionProps {
  noteId: string;
  comments: Comment[];
  currentUserId?: string;
  onAddComment: (content: string, parentId?: string) => Promise<void>;
  onEditComment: (commentId: string, content: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  onLikeComment: (commentId: string) => Promise<void>;
  onReportComment: (commentId: string, reason: string) => Promise<void>;
  isLoading?: boolean;
}

export function CommentsSection({
  noteId,
  comments,
  currentUserId,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onLikeComment,
  onReportComment,
  isLoading = false,
}: CommentsSectionProps) {
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} week${Math.ceil(diffDays / 7) > 1 ? 's' : ''} ago`;
    return new Date(date).toLocaleDateString();
  };

  const getBadgeColor = (badge?: string) => {
    switch (badge) {
      case 'verified': return 'bg-blue-500';
      case 'educator': return 'bg-green-500';
      case 'student': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getBadgeLabel = (badge?: string) => {
    switch (badge) {
      case 'verified': return 'Verified';
      case 'educator': return 'Educator';
      case 'student': return 'Student';
      default: return '';
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onAddComment(newComment);
      setNewComment("");
      toast({
        title: "Comment posted",
        description: "Your comment has been added successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to post comment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onAddComment(replyContent, parentId);
      setReplyContent("");
      setReplyingTo(null);
      toast({
        title: "Reply posted",
        description: "Your reply has been added successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to post reply. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onEditComment(commentId, editContent);
      setEditingComment(null);
      setEditContent("");
      toast({
        title: "Comment updated",
        description: "Your comment has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update comment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await onDeleteComment(commentId);
      toast({
        title: "Comment deleted",
        description: "Your comment has been removed.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete comment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLikeComment = async (commentId: string) => {
    try {
      await onLikeComment(commentId);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to like comment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleReportComment = async (commentId: string, reason: string) => {
    try {
      await onReportComment(commentId, reason);
      toast({
        title: "Comment reported",
        description: "Thank you for helping keep our community safe.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to report comment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const startEditing = (comment: Comment) => {
    setEditingComment(comment.id);
    setEditContent(comment.content);
  };

  const cancelEditing = () => {
    setEditingComment(null);
    setEditContent("");
  };

  const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => (
    <div className={`${isReply ? 'ml-8 border-l-2 border-gray-200 dark:border-gray-700 pl-4' : ''}`}>
      <div className="flex space-x-3">
        <Avatar className="w-8 h-8">
          <AvatarImage src={comment.authorAvatar} />
          <AvatarFallback className="text-xs">
            {comment.authorName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              {comment.authorName}
            </h4>
            {comment.authorBadge && (
              <Badge 
                variant="secondary" 
                className={`text-xs text-white ${getBadgeColor(comment.authorBadge)}`}
              >
                {getBadgeLabel(comment.authorBadge)}
              </Badge>
            )}
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatDate(comment.createdAt)}
              {comment.updatedAt && " (edited)"}
            </span>

            {currentUserId && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {currentUserId === comment.authorId ? (
                    <>
                      <DropdownMenuItem onClick={() => startEditing(comment)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-red-600"
                      >
                        <Trash className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <DropdownMenuItem 
                      onClick={() => handleReportComment(comment.id, 'inappropriate')}
                      className="text-red-600"
                    >
                      <Flag className="h-4 w-4 mr-2" />
                      Report
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {editingComment === comment.id ? (
            <div className="space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Edit your comment..."
                className="min-h-[80px]"
                data-testid={`edit-comment-${comment.id}`}
              />
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  onClick={() => handleEditComment(comment.id)}
                  disabled={isSubmitting || !editContent.trim()}
                  data-testid={`save-edit-${comment.id}`}
                >
                  Save
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={cancelEditing}
                  data-testid={`cancel-edit-${comment.id}`}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2" data-testid={`comment-content-${comment.id}`}>
                {comment.content}
              </p>

              <div className="flex items-center space-x-4 text-xs">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-6 px-2 ${comment.isLiked ? 'text-red-500' : 'text-gray-500'}`}
                  onClick={() => handleLikeComment(comment.id)}
                  data-testid={`like-comment-${comment.id}`}
                >
                  <Heart className={`h-3 w-3 mr-1 ${comment.isLiked ? 'fill-current' : ''}`} />
                  {comment.likes}
                </Button>

                {!isReply && currentUserId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-gray-500"
                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                    data-testid={`reply-comment-${comment.id}`}
                  >
                    <Reply className="h-3 w-3 mr-1" />
                    Reply
                  </Button>
                )}
              </div>

              {replyingTo === comment.id && (
                <div className="mt-3 space-y-2">
                  <Textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder={`Reply to ${comment.authorName}...`}
                    className="min-h-[80px]"
                    data-testid={`reply-textarea-${comment.id}`}
                  />
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleSubmitReply(comment.id)}
                      disabled={isSubmitting || !replyContent.trim()}
                      data-testid={`submit-reply-${comment.id}`}
                    >
                      <Send className="h-3 w-3 mr-1" />
                      Reply
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setReplyingTo(null)}
                      data-testid={`cancel-reply-${comment.id}`}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-4">
              {comment.replies.map((reply) => (
                <CommentItem key={reply.id} comment={reply} isReply={true} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Card className="w-full" data-testid="comments-section">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageCircle className="h-5 w-5" />
          <span>Comments ({comments.length})</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Add Comment Form */}
        {currentUserId ? (
          <div className="space-y-3">
            <Textarea
              placeholder="Share your thoughts about this note..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[100px]"
              data-testid="new-comment-textarea"
            />
            <Button 
              onClick={handleSubmitComment}
              disabled={isSubmitting || !newComment.trim()}
              data-testid="submit-comment"
            >
              <Send className="h-4 w-4 mr-2" />
              {isSubmitting ? "Posting..." : "Post Comment"}
            </Button>
          </div>
        ) : (
          <Alert>
            <AlertDescription>
              Please log in to join the discussion and share your thoughts about this note.
            </AlertDescription>
          </Alert>
        )}

        {/* Comments List */}
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex space-x-3">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/4" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No comments yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Be the first to share your thoughts about this note!
            </p>
          </div>
        ) : (
          <div className="space-y-6" data-testid="comments-list">
            {comments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}