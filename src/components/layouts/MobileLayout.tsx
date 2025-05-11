
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  BarChart2, 
  Calendar as CalendarIcon, 
  Home, 
  PlaySquare, 
  User
} from "lucide-react";

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

  const isActive = (path: string) => {
    if (path === "/dashboard" && currentPath === "/dashboard") return true;
    if (path === "/calendar" && currentPath === "/calendar") return true;
    if (path === "/workout" && currentPath.includes("/workout")) return true;
    if (path === "/progress" && currentPath === "/progress") return true;
    if (path === "/profile" && currentPath === "/profile") return true;
    return false;
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="mobile-container">
      {title && (
        <header className="sticky top-0 z-10 bg-tactical-darkgray border-b border-border">
          <div className="flex items-center h-14 px-4">
            {!hideBackButton && (
              <button 
                onClick={handleBack}
                className="mr-3 p-1"
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
        <nav className="bottom-tabs">
          <div className="tab-item" onClick={() => navigate("/dashboard")}>
            <Home 
              size={20} 
              className={isActive("/dashboard") ? "text-tactical-blue" : "text-gray-400"} 
            />
            <span className={`tab-text ${isActive("/dashboard") ? "text-tactical-blue" : "text-gray-400"}`}>
              Home
            </span>
          </div>
          <div className="tab-item" onClick={() => navigate("/calendar")}>
            <CalendarIcon 
              size={20} 
              className={isActive("/calendar") ? "text-tactical-blue" : "text-gray-400"} 
            />
            <span className={`tab-text ${isActive("/calendar") ? "text-tactical-blue" : "text-gray-400"}`}>
              Calendar
            </span>
          </div>
          <div className="tab-item" onClick={() => navigate("/workout/today")}>
            <PlaySquare 
              size={20} 
              className={isActive("/workout") ? "text-tactical-blue" : "text-gray-400"} 
            />
            <span className={`tab-text ${isActive("/workout") ? "text-tactical-blue" : "text-gray-400"}`}>
              Workout
            </span>
          </div>
          <div className="tab-item" onClick={() => navigate("/progress")}>
            <BarChart2 
              size={20} 
              className={isActive("/progress") ? "text-tactical-blue" : "text-gray-400"} 
            />
            <span className={`tab-text ${isActive("/progress") ? "text-tactical-blue" : "text-gray-400"}`}>
              Progress
            </span>
          </div>
          <div className="tab-item" onClick={() => navigate("/profile")}>
            <User 
              size={20} 
              className={isActive("/profile") ? "text-tactical-blue" : "text-gray-400"} 
            />
            <span className={`tab-text ${isActive("/profile") ? "text-tactical-blue" : "text-gray-400"}`}>
              Profile
            </span>
          </div>
        </nav>
      )}
    </div>
  );
};

export default MobileLayout;
