import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdminModeration } from "@/hooks/useAdminModeration";
import { Trash2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface ReviewReportDialogProps {
  reportId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ReviewReportDialog = ({
  reportId,
  open,
  onOpenChange,
}: ReviewReportDialogProps) => {
  const { reports, updateReportStatus, deletePost, issueWarning } = useAdminModeration();
  const [adminNotes, setAdminNotes] = useState("");
  const [warningType, setWarningType] = useState<string>("warning");
  const [warningSeverity, setWarningSeverity] = useState<string>("medium");

  const report = reports.find((r) => r.id === reportId);

  if (!report) return null;

  const handleDismiss = () => {
    updateReportStatus.mutate(
      {
        reportId: report.id,
        status: "dismissed",
        adminNotes,
      },
      {
        onSuccess: () => {
          setAdminNotes("");
          onOpenChange(false);
        },
      }
    );
  };

  const handleDeletePost = () => {
    if (!report.post) return;
    deletePost.mutate(
      {
        postId: report.post.id,
        reason: adminNotes || "Violated community guidelines",
      },
      {
        onSuccess: () => {
          updateReportStatus.mutate(
            {
              reportId: report.id,
              status: "action_taken",
              adminNotes: "Post deleted",
            },
            {
              onSuccess: () => {
                setAdminNotes("");
                onOpenChange(false);
              },
            }
          );
        },
      }
    );
  };

  const handleIssueWarning = () => {
    if (!report.post?.author_id) return;
    issueWarning.mutate(
      {
        userId: report.post.author_id,
        warningType,
        reason: adminNotes || "Content policy violation",
        severity: warningSeverity,
      },
      {
        onSuccess: () => {
          updateReportStatus.mutate(
            {
              reportId: report.id,
              status: "action_taken",
              adminNotes: `Warning issued: ${warningType}`,
            },
            {
              onSuccess: () => {
                setAdminNotes("");
                onOpenChange(false);
              },
            }
          );
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Review Report</DialogTitle>
          <DialogDescription>
            Take action on this reported content
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Report Details */}
          <div className="space-y-2">
            <h3 className="font-semibold">Report Details</h3>
            <div className="p-3 bg-muted rounded-lg space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Type:</span>{" "}
                <span className="font-medium">{report.report_type}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Reason:</span>{" "}
                <p>{report.reason}</p>
              </div>
            </div>
          </div>

          {/* Post Content */}
          {report.post && (
            <div className="space-y-2">
              <h3 className="font-semibold">Reported Post</h3>
              <div className="p-3 border rounded-lg space-y-2">
                <p className="text-sm">{report.post.content}</p>
                {report.post.image_url && (
                  <img
                    src={report.post.image_url}
                    alt="Post"
                    className="rounded-lg max-h-64 object-cover"
                  />
                )}
              </div>
            </div>
          )}

          {/* Admin Notes */}
          <div className="space-y-2">
            <Label htmlFor="admin-notes">Admin Notes</Label>
            <Textarea
              id="admin-notes"
              placeholder="Add notes about your decision..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Warning Options */}
          <div className="space-y-2">
            <Label>Issue Warning</Label>
            <div className="flex gap-2">
              <Select value={warningType} onValueChange={setWarningType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="suspension">Suspension</SelectItem>
                  <SelectItem value="notice">Notice</SelectItem>
                </SelectContent>
              </Select>
              <Select value={warningSeverity} onValueChange={setWarningSeverity}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleDismiss}
            disabled={updateReportStatus.isPending}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Dismiss
          </Button>
          <Button
            variant="secondary"
            onClick={handleIssueWarning}
            disabled={issueWarning.isPending}
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Issue Warning
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeletePost}
            disabled={deletePost.isPending}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Post
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
