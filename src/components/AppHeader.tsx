import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Home, Users, BookOpen, MessageSquare, Search, Menu } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import NotificationBadge from "@/components/NotificationBadge";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { UserAvatar } from "@/components/UserAvatar";
import { useUserProfile } from "@/hooks/useUserProfile";

interface AppHeaderProps {
  currentPage: "campus" | "activity" | "friends" | "messages" | "profile" | "notifications" | "admin" | "courses";
}

export const AppHeader = ({ currentPage }: AppHeaderProps) => {
  const { user } = useAuth();
  const { profile } = useUserProfile(user?.id);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: "campus", icon: Home, label: "Home", path: "/campus" },
    { id: "friends", icon: Users, label: "Requests", path: "/friends" },
    { id: "courses", icon: BookOpen, label: "Courses", path: "/courses" },
    { id: "messages", icon: MessageSquare, label: "Messages", path: "/messages" },
  ];

  const isActive = (itemId: string) => {
    if (itemId === "campus" && currentPage === "campus") return true;
    if (itemId === "friends" && currentPage === "friends") return true;
    if (itemId === "messages" && currentPage === "messages") return true;
    if (itemId === "courses" && currentPage === "courses") return true;
    if (currentPage === "activity" && itemId === "campus") return false;
    return false;
  };

  return (
    <header className="bg-[hsl(var(--header-bg))] py-3 px-4 md:px-6 border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to={user ? "/campus" : "/"} className="flex items-center gap-2">
          <h1 className="text-lg md:text-xl font-semibold text-foreground">
            SkillShare<span className="text-xs md:text-sm align-top">Campus</span>
          </h1>
        </Link>
        
        {/* Desktop Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <Link to="/search" className="w-full">
            <div className="relative cursor-pointer">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                placeholder="Search users..." 
                className="pl-10 bg-background/50"
                readOnly
              />
            </div>
          </Link>
        </div>

        {/* Mobile Search Icon */}
        <Link to="/search" className="md:hidden">
          <Search className="h-5 w-5 text-foreground/70" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.id);
            
            return (
              <Link
                key={item.id}
                to={item.path}
                className={`flex flex-col items-center gap-1 transition-colors ${
                  active
                    ? "text-primary"
                    : "text-foreground/70 hover:text-foreground"
                }`}
              >
                <div className="h-5 flex items-center justify-center">
                  <Icon className="h-5 w-5" />
                </div>
                <span className={`text-xs ${active ? "font-semibold" : ""}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* Notifications with Badge */}
          <Link
            to="/notifications"
            className={`flex flex-col items-center gap-1 transition-colors ${
              currentPage === "notifications"
                ? "text-primary"
                : "text-foreground/70 hover:text-foreground"
            }`}
          >
            <div className="relative h-5 flex items-center justify-center">
              <NotificationBadge />
            </div>
            <span
              className={`text-xs ${
                currentPage === "notifications" ? "font-semibold" : ""
              }`}
            >
              Notifications
            </span>
          </Link>

          {/* Profile */}
          <Link
            to="/profile"
            className={`flex flex-col items-center gap-1 transition-colors ${
              currentPage === "profile" || currentPage === "activity"
                ? "text-primary"
                : "text-foreground/70 hover:text-foreground"
            }`}
          >
            <div className="h-5 flex items-center justify-center">
              <UserAvatar 
                avatarUrl={profile?.avatar_url} 
                fullName={profile?.full_name} 
                className="h-5 w-5 text-[8px]"
              />
            </div>
            <span
              className={`text-xs ${
                currentPage === "profile" || currentPage === "activity"
                  ? "font-semibold"
                  : ""
              }`}
            >
              {currentPage === "activity" ? "Activity" : "Me"}
            </span>
          </Link>
        </nav>

        {/* Mobile Menu */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild className="lg:hidden">
            <button className="p-2">
              <Menu className="h-6 w-6" />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px] bg-background z-[60]">
            <nav className="flex flex-col gap-4 mt-8">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.id);
                
                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-foreground/70 hover:bg-accent"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className={`text-base ${active ? "font-semibold" : ""}`}>
                      {item.label}
                    </span>
                  </Link>
                );
              })}

              {/* Notifications */}
              <Link
                to="/notifications"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  currentPage === "notifications"
                    ? "bg-primary/10 text-primary"
                    : "text-foreground/70 hover:bg-accent"
                }`}
              >
                <div className="relative">
                  <NotificationBadge />
                </div>
                <span className={`text-base ${currentPage === "notifications" ? "font-semibold" : ""}`}>
                  Notifications
                </span>
              </Link>

              {/* Profile */}
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  currentPage === "profile" || currentPage === "activity"
                    ? "bg-primary/10 text-primary"
                    : "text-foreground/70 hover:bg-accent"
                }`}
              >
              <UserAvatar 
                avatarUrl={profile?.avatar_url} 
                fullName={profile?.full_name} 
                className="h-5 w-5 text-[8px]"
              />
                <span className={`text-base ${currentPage === "profile" || currentPage === "activity" ? "font-semibold" : ""}`}>
                  {currentPage === "activity" ? "Activity" : "Profile"}
                </span>
              </Link>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};
