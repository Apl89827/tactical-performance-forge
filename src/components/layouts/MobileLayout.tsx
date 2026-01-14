import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  BarChart2, 
  Calendar as CalendarIcon, 
  Home, 
  Layers,
  User
} from "lucide-react";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";

interface MobileLayoutProps {
  children: React.ReactNode;
  hideTabBar?: boolean;
  hideBackButton?: boolean;
  title?: string;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({ 
  children, 
  hideTabBar = false,
  hideBackButton = false,
  title
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const { tabChange, buttonPress } = useHapticFeedback();

  const isActive = (path: string) => {
    if (path === "/dashboard" && currentPath === "/dashboard") return true;
    if (path === "/calendar" && currentPath === "/calendar") return true;
    if (path === "/programs" && currentPath === "/programs") return true;
    if (path === "/progress" && currentPath === "/progress") return true;
    if (path === "/profile" && currentPath === "/profile") return true;
    return false;
  };

  const handleBack = () => {
    buttonPress();
    navigate(-1);
  };

  const handleNavigate = (path: string) => {
    if (!isActive(path)) {
      tabChange();
      navigate(path);
    }
  };

  return (
    <div className="mobile-container">
      {title && (
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="flex items-center h-14 px-4">
            {!hideBackButton && (
              <button 
                onClick={handleBack}
                className="mr-3 p-2 -ml-2 rounded-lg active:bg-muted transition-colors touch-target"
                aria-label="Go back"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path 
                    d="M15 18L9 12L15 6" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
            <h1 className="text-lg font-semibold flex-1 text-center">
              {title}
            </h1>
            {!hideBackButton && <div className="w-8" />}
          </div>
        </header>
      )}

      <main className="mobile-screen">
        <div className="mobile-content">
          {children}
        </div>
      </main>

      {!hideTabBar && (
        <nav className="bottom-tabs safe-area-bottom">
          <button 
            className={`tab-item touch-target ${isActive("/dashboard") ? "active" : ""}`}
            onClick={() => handleNavigate("/dashboard")}
          >
            <Home 
              size={20} 
              className={`tab-icon ${isActive("/dashboard") ? "text-primary" : "text-muted-foreground"}`} 
            />
            <span className={`tab-text ${isActive("/dashboard") ? "text-primary" : "text-muted-foreground"}`}>
              Home
            </span>
          </button>
          <button 
            className={`tab-item touch-target ${isActive("/calendar") ? "active" : ""}`}
            onClick={() => handleNavigate("/calendar")}
          >
            <CalendarIcon 
              size={20} 
              className={`tab-icon ${isActive("/calendar") ? "text-primary" : "text-muted-foreground"}`} 
            />
            <span className={`tab-text ${isActive("/calendar") ? "text-primary" : "text-muted-foreground"}`}>
              Calendar
            </span>
          </button>
          <button 
            className={`tab-item touch-target ${isActive("/programs") ? "active" : ""}`}
            onClick={() => handleNavigate("/programs")}
          >
            <Layers 
              size={20} 
              className={`tab-icon ${isActive("/programs") ? "text-primary" : "text-muted-foreground"}`} 
            />
            <span className={`tab-text ${isActive("/programs") ? "text-primary" : "text-muted-foreground"}`}>
              Programs
            </span>
          </button>
          <button 
            className={`tab-item touch-target ${isActive("/progress") ? "active" : ""}`}
            onClick={() => handleNavigate("/progress")}
          >
            <BarChart2 
              size={20} 
              className={`tab-icon ${isActive("/progress") ? "text-primary" : "text-muted-foreground"}`} 
            />
            <span className={`tab-text ${isActive("/progress") ? "text-primary" : "text-muted-foreground"}`}>
              Progress
            </span>
          </button>
          <button 
            className={`tab-item touch-target ${isActive("/profile") ? "active" : ""}`}
            onClick={() => handleNavigate("/profile")}
          >
            <User 
              size={20} 
              className={`tab-icon ${isActive("/profile") ? "text-primary" : "text-muted-foreground"}`} 
            />
            <span className={`tab-text ${isActive("/profile") ? "text-primary" : "text-muted-foreground"}`}>
              Profile
            </span>
          </button>
        </nav>
      )}
    </div>
  );
};

export default MobileLayout;
