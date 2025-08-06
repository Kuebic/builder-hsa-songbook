import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Reply, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSongComments, useSubmitComment } from "@features/songs/hooks/useVerses";
import { songCommentSchema } from "@features/songs/types/song.types";
import type { SongComment } from "@features/songs/types/song.types";
import type { z } from "zod";

type CommentFormData = z.infer<typeof songCommentSchema>;

export interface CommunitySectionProps {
  songId: string;
}

interface CommentCardProps {
  comment: SongComment;
  onReply: (parentId: string) => void;
  isReplying?: boolean;
  onCancelReply?: () => void;
  level?: number;
}

function CommentCard({
  comment,
  onReply,
  isReplying = false,
  onCancelReply,
  level = 0,
}: CommentCardProps) {
  const submitComment = useSubmitComment();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CommentFormData>({
    resolver: zodResolver(songCommentSchema),
  });

  const onSubmitReply = async (data: CommentFormData) => {
    try {
      await submitComment.mutateAsync({
        songId: comment.songId,
        content: data.content,
        parentId: comment.id,
      });
      reset();
      onCancelReply?.();
    } catch (error) {
      console.error("Failed to submit reply:", error);
    }
  };

  return (
    <div
      className={cn(
        "space-y-3",
        level > 0 && "ml-6 border-l-2 border-muted pl-4",
      )}
    >
      <Card className="hover:shadow-sm transition-shadow">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">
                  {comment.userName}
                </span>
                <span className="text-xs text-muted-foreground">
                  {comment.createdAt.toLocaleDateString()}
                  {comment.isEdited && " • edited"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <ChevronUp className="h-3 w-3" />
                  {comment.upvotes}
                </div>
              </div>
            </div>

            <p className="text-sm leading-relaxed">{comment.content}</p>

            {level < 2 && ( // Limit nesting to 2 levels
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => onReply(comment.id)}
                >
                  <Reply className="h-3 w-3" />
                  Reply
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {isReplying && (
        <Card className="border-2">
          <CardContent className="p-4">
            <form onSubmit={handleSubmit(onSubmitReply)} className="space-y-3">
              <div className="space-y-2">
                <Textarea
                  placeholder="Write a reply..."
                  rows={3}
                  {...register("content")}
                />
                {errors.content && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errors.content.message}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button type="submit" size="sm" disabled={isSubmitting}>
                  {isSubmitting ? "Posting..." : "Post Reply"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onCancelReply}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function CommunitySection({ songId }: CommunitySectionProps) {
  const { data: comments = [], isLoading } = useSongComments(songId);
  const submitComment = useSubmitComment();
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CommentFormData>({
    resolver: zodResolver(songCommentSchema),
  });

  const onSubmitComment = async (data: CommentFormData) => {
    try {
      await submitComment.mutateAsync({
        songId,
        content: data.content,
      });
      reset();
    } catch (error) {
      console.error("Failed to submit comment:", error);
    }
  };

  const handleReply = (parentId: string) => {
    setReplyingTo(replyingTo === parentId ? null : parentId);
  };

  // Group comments by parent/child relationship
  const topLevelComments = comments.filter((c) => !c.parentId);
  const replies = comments.filter((c) => c.parentId);

  const getRepliesToComment = (commentId: string) => {
    return replies.filter((r) => r.parentId === commentId);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-24 bg-muted rounded" />
                    <div className="h-3 w-16 bg-muted rounded" />
                  </div>
                  <div className="h-16 bg-muted rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5" />
        <h3 className="text-lg font-semibold">
          Community Discussion ({comments.length})
        </h3>
      </div>

      {/* Comment submission form */}
      <Card className="border-2">
        <CardContent className="p-4">
          <form onSubmit={handleSubmit(onSubmitComment)} className="space-y-4">
            <div className="space-y-2">
              <Textarea
                placeholder="Share your thoughts about this song..."
                rows={4}
                {...register("content")}
              />
              {errors.content && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errors.content.message}
                </p>
              )}
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Posting..." : "Post Comment"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Comments list */}
      {topLevelComments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-lg mb-1">No comments yet</p>
          <p className="text-sm">
            Start the discussion by sharing your thoughts above.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {topLevelComments
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .map((comment) => (
              <div key={comment.id} className="space-y-3">
                <CommentCard
                  comment={comment}
                  onReply={handleReply}
                  isReplying={replyingTo === comment.id}
                  onCancelReply={() => setReplyingTo(null)}
                />

                {/* Render replies */}
                {getRepliesToComment(comment.id)
                  .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
                  .map((reply) => (
                    <CommentCard
                      key={reply.id}
                      comment={reply}
                      onReply={handleReply}
                      isReplying={replyingTo === reply.id}
                      onCancelReply={() => setReplyingTo(null)}
                      level={1}
                    />
                  ))}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
