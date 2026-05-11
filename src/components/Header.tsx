import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import NotificationBadge from "@/components/NotificationBadge";

const Header = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const isSignInPage = location.pathname === "/signin";
  const isJoinPage = location.pathname === "/join";
  
  return (
    <header className="bg-[hsl(var(--header-bg))] py-4 px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to={user ? "/campus" : "/"} className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-foreground">
            SkillShare<span className="text-sm align-top">Campus</span>
          </h1>
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link to="/campus">
                <Button variant="ghost" className="text-foreground hover:bg-white/50">
                  Campus
                </Button>
              </Link>
              <Link to="/friends">
                <Button variant="ghost" className="text-foreground hover:bg-white/50">
                  Friends
                </Button>
              </Link>
              <Link to="/messages">
                <Button variant="ghost" className="text-foreground hover:bg-white/50">
                  Messages
                </Button>
              </Link>
              <NotificationBadge />
              <Link to="/profile">
                <Button variant="ghost" className="text-foreground hover:bg-white/50">
                  Profile
                </Button>
              </Link>
              <Button 
                variant="secondary" 
                className="bg-white text-foreground hover:bg-white/90"
                onClick={() => signOut()}
              >
                Sign Out
              </Button>
            </>
          ) : (
            <>
              {!isJoinPage ? (
                <Link to="/join">
                  <Button variant="ghost" className="text-foreground hover:bg-white/50">
                    Join Now
                  </Button>
                </Link>
              ) : (
                <Button variant="ghost" className="text-foreground hover:bg-white/50">
                  Join Now
                </Button>
              )}
              {!isSignInPage ? (
                <Link to="/signin">
                  <Button variant="secondary" className="bg-white text-foreground hover:bg-white/90">
                    Sign In
                  </Button>
                </Link>
              ) : (
                <Button variant="secondary" className="bg-white text-foreground hover:bg-white/90">
                  Sign In
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
