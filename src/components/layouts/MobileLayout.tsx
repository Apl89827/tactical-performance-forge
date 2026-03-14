import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { BarChart2, Calendar as CalendarIcon, Home, Layers, User } from "lucide-react";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
interface MobileLayoutProps { children: React.ReactNode; hideTabBar?: boolean; hideBackButton?: boolean; title?: string; }
const MobileLayout: React.FC<MobileLayoutProps> = ({ children, hideTabBar = false, hideBackButton = false, title }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const { tabChange, buttonPress } = useHapticFeedback();
  const isActive = (path: string) => currentPath === path;
  const handleBack = () => { buttonPress(); navigate(-1); };
  const handleNavigate = (path: string) => { if (!isActive(path)) { tabChange(); navigate(path); } };
  const tabs = [
    { path: "/dashboard", label: "Home", icon: Home },
    { path: "/calendar", label: "Calendar", icon: CalendarIcon },
    { path: "/programs", label: "Programs", icon: Layers },
    { path: "/progress", label: "Progress", icon: BarChart2 },
    { path: "/profile", label: "Profile", icon: User },
  ];
  return ( <div className="mobile-container"> {title && <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border"> <div className="flex items-center h-14 px-4"> {!hideBackButton && <button onClick={handleBack} className="mr-3 p-2 -ml-2 rounded-lg active:bg-muted transition-colors touch-target" aria-label="Go back"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></button>} <h1 className="text-lg font-semibold flex-1 text-center">{title}</h1> {!hideBackButton && <div className="w-8" />} </div> </header>} <main className="mobile-screen"><div className="mobile-content">{children}</div></main> {!hideTabBar && <nav className="bottom-tabs safe-area-bottom"> {tabs.map(({ path, label, icon: Icon }) => { const active = isActive(path); return <button key={path} className="tab-item touch-target" onClick={() => handleNavigate(path)}> <div className={`flex flex-col items-center justify-center px-3 py-1 rounded-xl transition-all ${active ? "bg-tactical-blue/15" : ""}`}> <Icon size={20} className={`mb-0.5 transition-transform ${active ? "text-tactical-blue scale-110" : "text-muted-foreground"}`} /> <span className={`text-xs transition-all ${active ? "text-tactical-blue font-medium" : "text-muted-foreground"}`}>{label}</span> </div> </button>; })} </nav>} </div> );
};
export default MobileLayout;
