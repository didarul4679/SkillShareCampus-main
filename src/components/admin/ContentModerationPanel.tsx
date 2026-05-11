import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useAdminModeration } from "@/hooks/useAdminModeration";
import { UserAvatar } from "@/components/UserAvatar";
import { Flag, Trash2, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ReviewReportDialog } from "./ReviewReportDialog";

export const ContentModerationPanel = () => {
  const [status, setStatus] = useState<"pending" | "reviewed" | "dismissed">("pending");
  const [page, setPage] = useState(0);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [selectedReports, setSelectedReports] = useState<Set<string>>(new Set());
  const pageSize = 20;

  const { reports, totalCount, isLoading, bulkDismiss } = useAdminModeration(
    status,
    page,
    pageSize
  );

  const totalPages = Math.ceil(totalCount / pageSize);

  const getReportTypeBadge = (type: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      spam: { variant: "secondary", icon: Flag },
      harassment: { variant: "destructive", icon: AlertTriangle },
      inappropriate: { variant: "destructive", icon: XCircle },
      misinformation: { variant: "default", icon: AlertTriangle },
      other: { variant: "outline", icon: Flag },
    };
    const config = variants[type] || variants.other;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {type}
      </Badge>
    );
  };

  const toggleSelectReport = (reportId: string) => {
    const newSelected = new Set(selectedReports);
    if (newSelected.has(reportId)) {
      newSelected.delete(reportId);
    } else {
      newSelected.add(reportId);
    }
    setSelectedReports(newSelected);
  };

  const handleBulkDismiss = () => {
    bulkDismiss.mutate(Array.from(selectedReports), {
      onSuccess: () => setSelectedReports(new Set()),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Content Moderation</h2>
        {selectedReports.size > 0 && (
          <Button variant="outline" onClick={handleBulkDismiss}>
            Dismiss {selectedReports.size} Selected
          </Button>
        )}
      </div>

      <Tabs value={status} onValueChange={(v) => setStatus(v as any)}>
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="reviewed">Reviewed</TabsTrigger>
          <TabsTrigger value="dismissed">Dismissed</TabsTrigger>
        </TabsList>

        <TabsContent value={status} className="space-y-4 mt-4">
          {isLoading ? (
            <Card>
              <CardContent className="py-8 text-center">Loading reports...</CardContent>
            </Card>
          ) : reports.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No {status} reports</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-4">
                {reports.map((report) => (
                  <Card key={report.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          {status === "pending" && (
                            <input
                              type="checkbox"
                              checked={selectedReports.has(report.id)}
                              onChange={() => toggleSelectReport(report.id)}
                              className="mt-1"
                            />
                          )}
                          <div className="flex-1">
                            <CardTitle className="flex items-center gap-2 text-base">
                              {getReportTypeBadge(report.report_type)}
                              <span className="text-sm text-muted-foreground">
                                Reported{" "}
                                {formatDistanceToNow(new Date(report.created_at), {
                                  addSuffix: true,
                                })}
                              </span>
                            </CardTitle>
                            <CardDescription className="mt-1">
                              By: {report.reporter?.full_name || "Anonymous"}
                            </CardDescription>
                          </div>
                        </div>
                        {status === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedReport(report.id)}
                          >
                            Review
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <h4 className="text-sm font-semibold mb-1">Reason:</h4>
                        <p className="text-sm text-muted-foreground">{report.reason}</p>
                      </div>

                      {report.post && (
                        <div className="border rounded-lg p-3 bg-muted/50">
                          <div className="flex items-start gap-3">
                            <UserAvatar
                              avatarUrl={report.post.author?.avatar_url}
                              fullName={report.post.author?.full_name}
                              className="h-9 w-9"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">
                                {report.post.author?.full_name || "Unknown User"}
                              </p>
                              <p className="text-sm mt-1 line-clamp-3">
                                {report.post.content}
                              </p>
                              {report.post.image_url && (
                                <img
                                  src={report.post.image_url}
                                  alt="Post"
                                  className="mt-2 rounded-lg max-h-48 object-cover"
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                        className={
                          page === 0 ? "pointer-events-none opacity-50" : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = page < 3 ? i : page - 2 + i;
                      if (pageNum >= totalPages) return null;
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            onClick={() => setPage(pageNum)}
                            isActive={page === pageNum}
                            className="cursor-pointer"
                          >
                            {pageNum + 1}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                        className={
                          page >= totalPages - 1
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      {selectedReport && (
        <ReviewReportDialog
          reportId={selectedReport}
          open={!!selectedReport}
          onOpenChange={(open) => !open && setSelectedReport(null)}
        />
      )}
    </div>
  );
};
