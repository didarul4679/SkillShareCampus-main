import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import MobileBottomNav from "@/components/MobileBottomNav";
import Index from "./pages/Index";
import SignIn from "./pages/SignIn";
import Join from "./pages/Join";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Campus from "./pages/Campus";
import Friends from "./pages/Friends";
import PendingRequests from "./pages/PendingRequests";
import SearchUsers from "./pages/SearchUsers";
import Messages from "./pages/Messages";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import Activity from "./pages/Activity";
import UserProfile from "./pages/UserProfile";
import HashtagPage from "./pages/HashtagPage";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import CourseLearn from "./pages/CourseLearn";
import MyCourses from "./pages/MyCourses";
import CourseCertificate from "./pages/CourseCertificate";
import CreateCourse from "./pages/CreateCourse";
import AdminCourses from "./pages/AdminCourses";
import EditCourse from "./pages/EditCourse";
import ManageLessons from "./pages/ManageLessons";
import PaymentHistory from "./pages/PaymentHistory";
import AuthCallback from "./pages/AuthCallback";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <MobileBottomNav />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/join" element={<Join />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/campus" element={<ProtectedRoute><Campus /></ProtectedRoute>} />
            <Route path="/friends" element={<ProtectedRoute><Friends /></ProtectedRoute>} />
            <Route path="/pending-requests" element={<ProtectedRoute><PendingRequests /></ProtectedRoute>} />
            <Route path="/search" element={<ProtectedRoute><SearchUsers /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/activity" element={<ProtectedRoute><Activity /></ProtectedRoute>} />
            <Route path="/user/:id" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
            <Route path="/hashtag/:tag" element={<ProtectedRoute><HashtagPage /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
            <Route path="/courses" element={<ProtectedRoute><Courses /></ProtectedRoute>} />
            <Route path="/courses/my-courses" element={<ProtectedRoute><MyCourses /></ProtectedRoute>} />
            <Route path="/courses/payment-history" element={<ProtectedRoute><PaymentHistory /></ProtectedRoute>} />
            <Route path="/courses/create" element={<ProtectedRoute><CreateCourse /></ProtectedRoute>} />
            <Route path="/courses/:id" element={<ProtectedRoute><CourseDetail /></ProtectedRoute>} />
            <Route path="/courses/:id/learn" element={<ProtectedRoute><CourseLearn /></ProtectedRoute>} />
            <Route path="/courses/:id/certificate" element={<ProtectedRoute><CourseCertificate /></ProtectedRoute>} />
            <Route path="/admin/courses" element={<ProtectedRoute><AdminCourses /></ProtectedRoute>} />
            <Route path="/admin/courses/:id/edit" element={<ProtectedRoute><EditCourse /></ProtectedRoute>} />
            <Route path="/admin/courses/:id/lessons" element={<ProtectedRoute><ManageLessons /></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <div className="pb-16 lg:pb-0" />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
