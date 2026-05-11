import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { UserManagementTable } from "@/components/admin/UserManagementTable";
import { ContentModerationPanel } from "@/components/admin/ContentModerationPanel";
import { AnalyticsDashboard } from "@/components/admin/AnalyticsDashboard";

const Admin = () => {
  const { user } = useAuth();
  const { isAdmin, isModerator, isStaff, primaryRole } = useUserRole();
  const navigate = useNavigate();

  // Redirect non-admin users
  useEffect(() => {
    if (!user) {
      navigate("/signin");
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  // Show access denied for non-staff users
  if (!isStaff) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader currentPage="admin" />
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              You don't have permission to access the admin panel. This area is restricted to administrators and moderators only.
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button onClick={() => navigate("/campus")}>Return to Campus</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader currentPage="admin" />
      <main className="container mx-auto px-4 py-4 md:py-8 max-w-7xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Manage users, content, and system settings
              </p>
            </div>
            <Badge variant="default" className="text-base md:text-lg px-3 md:px-4 py-1.5 md:py-2">
              {primaryRole}
            </Badge>
          </div>

          {/* Admin Tabs */}
          <Tabs defaultValue="users" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-auto">
              <TabsTrigger value="users" className="text-xs md:text-sm">User Management</TabsTrigger>
              <TabsTrigger value="moderation" className="text-xs md:text-sm">Content Moderation</TabsTrigger>
              <TabsTrigger value="analytics" className="text-xs md:text-sm">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="mt-6">
              <UserManagementTable />
            </TabsContent>

            <TabsContent value="moderation" className="mt-6">
              <ContentModerationPanel />
            </TabsContent>

            <TabsContent value="analytics" className="mt-6">
              <AnalyticsDashboard />
            </TabsContent>
          </Tabs>

          {/* Setup Instructions */}
          <Card className="border-primary/50">
            <CardHeader>
              <CardTitle>Assigning Admin Roles</CardTitle>
              <CardDescription>
                To assign the first admin or moderator role, use SQL commands in Supabase
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Assign Admin Role:</h3>
                <pre className="bg-muted p-3 rounded-lg text-sm overflow-x-auto">
{`INSERT INTO user_roles (user_id, role)
VALUES ('your-user-id-here', 'admin');`}
                </pre>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Assign Moderator Role:</h3>
                <pre className="bg-muted p-3 rounded-lg text-sm overflow-x-auto">
{`INSERT INTO user_roles (user_id, role)
VALUES ('your-user-id-here', 'moderator');`}
                </pre>
              </div>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Run these commands in your Supabase SQL Editor. Find your user ID in the Auth Users table.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Admin;
