import { useState } from "react";
import { MessageCircle, Reply, Edit2, Trash2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  user: {
    id: string;
    username: string;
    avatar?: string;
  };
  replies?: Comment[];
}

interface CommentSectionProps {
  noteId: string;
  comments: Comment[];
  onAddComment: (content: string, parentId?: string) => void;
  onEditComment: (commentId: string, content: string) => void;
  onDeleteComment: (commentId: string) => void;
  currentUserId?: string;
}

export function CommentSection({
  noteId,
  comments,
  onAddComment,
  onEditComment,
  onDeleteComment,
  currentUserId = "sample-user-id"
}: CommentSectionProps) {
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  };

  const handleSubmitComment = () => {
    if (newComment.trim()) {
      onAddComment(newComment.trim());
      setNewComment("");
    }
  };

  const handleSubmitReply = (parentId: string) => {
    if (replyContent.trim()) {
      onAddComment(replyContent.trim(), parentId);
      setReplyContent("");
      setReplyingTo(null);
    }
  };

  const handleEditSubmit = (commentId: string) => {
    if (editContent.trim()) {
      onEditComment(commentId, editContent.trim());
      setEditingComment(null);
      setEditContent("");
    }
  };

  const startEdit = (comment: Comment) => {
    setEditingComment(comment.id);
    setEditContent(comment.content);
  };

  const cancelEdit = () => {
    setEditingComment(null);
    setEditContent("");
  };

  const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => (
    <div className={`${isReply ? "ml-6 mt-3" : "mb-4"}`} data-testid={`comment-${comment.id}`}>
      <Card className={isReply ? "bg-gray-50" : ""}>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarImage src={comment.user.avatar || undefined} />
              <AvatarFallback className="text-sm">
                {comment.user.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm" data-testid={`comment-author-${comment.id}`}>
                  {comment.user.username}
                </span>
                <span className="text-xs text-gray-500" data-testid={`comment-date-${comment.id}`}>
                  {formatDate(comment.createdAt)}
                </span>
                {comment.user.id === currentUserId && (
                  <Badge variant="outline" className="text-xs">You</Badge>
                )}
              </div>
              
              {editingComment === comment.id ? (
                <div className="space-y-2">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="Edit your comment..."
                    className="resize-none"
                    rows={3}
                    data-testid={`edit-comment-textarea-${comment.id}`}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleEditSubmit(comment.id)}
                      disabled={!editContent.trim()}
                      data-testid={`save-edit-${comment.id}`}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={cancelEdit}
                      data-testid={`cancel-edit-${comment.id}`}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-gray-800" data-testid={`comment-content-${comment.id}`}>
                    {comment.content}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm">
                    {!isReply && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-gray-600 hover:text-gray-800"
                        onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                        data-testid={`reply-button-${comment.id}`}
                      >
                        <Reply className="h-3 w-3 mr-1" />
                        Reply
                      </Button>
                    )}
                    
                    {comment.user.id === currentUserId && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-gray-600 hover:text-gray-800"
                          onClick={() => startEdit(comment)}
                          data-testid={`edit-button-${comment.id}`}
                        >
                          <Edit2 className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-red-600 hover:text-red-800"
                          onClick={() => onDeleteComment(comment.id)}
                          data-testid={`delete-button-${comment.id}`}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reply form */}
      {replyingTo === comment.id && (
        <div className="ml-6 mt-3" data-testid={`reply-form-${comment.id}`}>
          <Card className="bg-blue-50">
            <CardContent className="p-4">
              <div className="space-y-3">
                <Textarea
                  placeholder="Write a reply..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="resize-none bg-white"
                  rows={3}
                  data-testid={`reply-textarea-${comment.id}`}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleSubmitReply(comment.id)}
                    disabled={!replyContent.trim()}
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
            </CardContent>
          </Card>
        </div>
      )}

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-2" data-testid={`replies-${comment.id}`}>
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} isReply />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="h-5 w-5 text-gray-600" />
        <h3 className="text-lg font-semibold">
          Comments ({comments.length})
        </h3>
      </div>

      {/* New comment form */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            <Textarea
              placeholder="Share your thoughts about this note..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="resize-none"
              rows={4}
              data-testid="new-comment-textarea"
            />
            <div className="flex justify-end">
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim()}
                data-testid="submit-comment"
              >
                <Send className="h-4 w-4 mr-2" />
                Post Comment
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments list */}
      <div className="space-y-4" data-testid="comments-list">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No comments yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))
        )}
      </div>
    </div>
  );
}