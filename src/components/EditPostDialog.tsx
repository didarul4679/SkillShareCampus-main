import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ImageIcon, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface EditPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: {
    id: string;
    content: string;
    hashtags?: string[];
    image_url?: string | null;
    created_at: string;
  };
  onEditSuccess: (postId: string, content: string, hashtags: string[], image?: File, removeImage?: boolean) => void;
}

/**
 * EditPostDialog component for editing posts
 * Implements FR-CONTENT-002: Post Editing with 15-minute time restriction
 */
export const EditPostDialog = ({
  open,
  onOpenChange,
  post,
  onEditSuccess,
}: EditPostDialogProps) => {
  const [content, setContent] = useState(post.content);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(post.image_url || null);
  const [removeImage, setRemoveImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // FR-CONTENT-002: Check if edit window (15 minutes) has expired
  const isEditWindowExpired = () => {
    const createdAt = new Date(post.created_at);
    const now = new Date();
    const diffInMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);
    return diffInMinutes > 15;
  };

  useEffect(() => {
    if (open) {
      // Reset state when dialog opens
      setContent(post.content);
      setImagePreview(post.image_url || null);
      setImageFile(null);
      setRemoveImage(false);

      // Check if edit window expired
      if (isEditWindowExpired()) {
        toast.error("Edit window expired. Posts can only be edited within 15 minutes of creation.");
        onOpenChange(false);
      }
    }
  }, [open, post]);

  // Extract hashtags from content (FR-CONTENT-002: Can update hashtags)
  const extractHashtags = (text: string): string[] => {
    const hashtagRegex = /#[\w]+/g;
    const matches = text.match(hashtagRegex);
    return matches ? matches : [];
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Invalid file type. Please upload a JPG, PNG, or WebP image.");
      return;
    }

    // Validate file size (max 5MB per SRS)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("File size exceeds 5MB limit.");
      return;
    }

    setImageFile(file);
    setRemoveImage(false);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error("Post content cannot be empty");
      return;
    }

    // Check character limit (FR-CONTENT-001: max 5000 chars)
    if (content.length > 5000) {
      toast.error("Post content exceeds 5000 character limit");
      return;
    }

    // Check if anything changed
    const contentChanged = content.trim() !== post.content.trim();
    const imageChanged = imageFile !== null || removeImage;
    
    if (!contentChanged && !imageChanged) {
      onOpenChange(false);
      return;
    }

    setIsSubmitting(true);

    try {
      const hashtags = extractHashtags(content);
      
      // Call parent's edit function
      await onEditSuccess(post.id, content, hashtags, imageFile || undefined, removeImage);
      
      onOpenChange(false);
    } catch (error) {
      // Error handled by parent mutation
    } finally {
      setIsSubmitting(false);
    }
  };

  const characterCount = content.length;
  const characterLimit = 5000;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Post</DialogTitle>
          <DialogDescription>
            You can edit this post within 15 minutes of creation
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Content Textarea */}
          <div className="space-y-2">
            <Label htmlFor="content">Post Content *</Label>
            <Textarea
              id="content"
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[150px] resize-none"
              disabled={isSubmitting}
            />
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Tip: Use #hashtags to categorize your post
              </span>
              <span className={`font-medium ${characterCount > characterLimit ? 'text-destructive' : 'text-muted-foreground'}`}>
                {characterCount}/{characterLimit}
              </span>
            </div>
          </div>

          {/* Hashtag Preview */}
          {extractHashtags(content).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {extractHashtags(content).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Image Upload/Preview */}
          <div className="space-y-2">
            <Label>Image (Optional)</Label>
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Post preview"
                  className="w-full rounded-lg max-h-64 object-cover"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2 rounded-full h-8 w-8"
                  onClick={handleRemoveImage}
                  disabled={isSubmitting}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageSelect}
                  className="hidden"
                  disabled={isSubmitting}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                  disabled={isSubmitting}
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Upload Image
                </Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Max 5MB • JPG, PNG, or WebP
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting || characterCount > characterLimit}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
