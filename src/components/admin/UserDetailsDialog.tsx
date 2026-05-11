import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { useAuditLogs } from "@/hooks/useAuditLogs";
import { UserAvatar } from "@/components/UserAvatar";
import { ShieldAlert, ShieldCheck, UserCog, History } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface UserDetailsDialogProps {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UserDetailsDialog = ({ userId, open, onOpenChange }: UserDetailsDialogProps) => {
  const { users, banUser, unbanUser, assignRole, revokeRole } = useAdminUsers();
  const { logs } = useAuditLogs(0, 20, userId);
  const [banReason, setBanReason] = useState("");
  const [isPermanent, setIsPermanent] = useState(true);
  const [selectedRole, setSelectedRole] = useState<string>("");

  const user = users.find((u) => u.id === userId);

  if (!user) return null;

  const handleBan = () => {
    if (!banReason.trim()) {
      return;
    }
    banUser.mutate(
      {
        userId: user.id,
        reason: banReason,
        isPermanent,
      },
      {
        onSuccess: () => {
          setBanReason("");
          onOpenChange(false);
        },
      }
    );
  };

  const handleUnban = () => {
    unbanUser.mutate(user.id, {
      onSuccess: () => onOpenChange(false),
    });
  };

  const handleAssignRole = () => {
    if (!selectedRole) return;
    assignRole.mutate(
      { userId: user.id, role: selectedRole },
      {
        onSuccess: () => setSelectedRole(""),
      }
    );
  };

  const handleRevokeRole = (role: string) => {
    revokeRole.mutate({ userId: user.id, role });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <UserAvatar
              avatarUrl={user.avatar_url}
              fullName={user.full_name}
              email={user.email}
              className="h-12 w-12"
            />
            <div>
              <div>{user.full_name || "Anonymous User"}</div>
              <div className="text-sm font-normal text-muted-foreground">
                {user.email || "No email"}
              </div>
            </div>
          </DialogTitle>
          <DialogDescription>
            Manage user roles, permissions, and account status
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="roles">Roles</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* User Info */}
            <div className="space-y-2">
              <h3 className="font-semibold">User Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">User ID:</span>
                  <p className="font-mono text-xs">{user.id}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <p>
                    {user.is_banned ? (
                      <Badge variant="destructive" className="gap-1">
                        <ShieldAlert className="h-3 w-3" />
                        Banned
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <ShieldCheck className="h-3 w-3" />
                        Active
                      </Badge>
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Joined:</span>
                  <p>
                    {formatDistanceToNow(new Date(user.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Last Seen:</span>
                  <p>
                    {user.last_seen_at
                      ? formatDistanceToNow(new Date(user.last_seen_at), {
                          addSuffix: true,
                        })
                      : "Never"}
                  </p>
                </div>
              </div>
            </div>

            {/* Ban/Unban Section */}
            <div className="space-y-2 pt-4 border-t">
              <h3 className="font-semibold text-destructive">Danger Zone</h3>
              {user.is_banned ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    This user is currently banned
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleUnban}
                    disabled={unbanUser.isPending}
                  >
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    Unban User
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="ban-reason">Ban Reason</Label>
                    <Textarea
                      id="ban-reason"
                      placeholder="Reason for banning this user..."
                      value={banReason}
                      onChange={(e) => setBanReason(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="permanent"
                      checked={isPermanent}
                      onChange={(e) => setIsPermanent(e.target.checked)}
                    />
                    <Label htmlFor="permanent">Permanent Ban</Label>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={handleBan}
                    disabled={!banReason.trim() || banUser.isPending}
                  >
                    <ShieldAlert className="h-4 w-4 mr-2" />
                    Ban User
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="roles" className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Current Roles</h3>
              <div className="flex gap-2 flex-wrap">
                {user.roles.map((role) => (
                  <Badge key={role} variant="default" className="gap-2">
                    {role}
                    {role !== "user" && (
                      <button
                        onClick={() => handleRevokeRole(role)}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    )}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t">
              <h3 className="font-semibold">Assign New Role</h3>
              <div className="flex gap-2">
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {!user.roles.includes("admin") && (
                      <SelectItem value="admin">Admin</SelectItem>
                    )}
                    {!user.roles.includes("moderator") && (
                      <SelectItem value="moderator">Moderator</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleAssignRole}
                  disabled={!selectedRole || assignRole.isPending}
                >
                  <UserCog className="h-4 w-4 mr-2" />
                  Assign
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <History className="h-4 w-4" />
                Recent Activity Logs
              </h3>
              {logs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity logs found</p>
              ) : (
                <div className="space-y-2">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 border rounded-lg text-sm space-y-1"
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-medium">{log.action_type}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(log.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <p className="text-muted-foreground">
                        By: {log.admin?.full_name || "Unknown Admin"}
                      </p>
                      {log.details && (
                        <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
