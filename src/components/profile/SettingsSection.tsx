import { Bell, Shield, HelpCircle, ChevronRight, LogOut, Settings, FileEdit } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SettingsSectionProps {
  isAdmin: boolean;
  onLogout: () => void;
}

const SettingsSection = ({ isAdmin, onLogout }: SettingsSectionProps) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Admin Quick Access */}
      {isAdmin && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border bg-accent/10">
            <div className="flex items-center gap-2">
              <Settings size={18} className="text-accent" />
              <h2 className="font-semibold">Admin Tools</h2>
            </div>
          </div>
          <button 
            className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
            onClick={() => navigate("/admin")}
          >
            <div className="flex items-center gap-3">
              <FileEdit size={18} className="text-muted-foreground" />
              <span>Admin Dashboard</span>
            </div>
            <ChevronRight size={18} className="text-muted-foreground" />
          </button>
        </div>
      )}

      {/* Settings */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border bg-secondary/30">
          <h2 className="font-semibold">Settings</h2>
        </div>
        <div>
          <button className="w-full flex items-center justify-between p-4 border-b border-border hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <Bell size={18} className="text-muted-foreground" />
              <span>Notifications</span>
            </div>
            <ChevronRight size={18} className="text-muted-foreground" />
          </button>
          <button className="w-full flex items-center justify-between p-4 border-b border-border hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <Shield size={18} className="text-muted-foreground" />
              <span>Privacy</span>
            </div>
            <ChevronRight size={18} className="text-muted-foreground" />
          </button>
          <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <HelpCircle size={18} className="text-muted-foreground" />
              <span>Help & Support</span>
            </div>
            <ChevronRight size={18} className="text-muted-foreground" />
          </button>
        </div>
      </div>
      
      {/* About */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border bg-secondary/30">
          <h2 className="font-semibold">About</h2>
        </div>
        <div>
          <button className="w-full flex items-center justify-between p-4 border-b border-border hover:bg-muted/50 transition-colors">
            <span>Terms of Service</span>
            <ChevronRight size={18} className="text-muted-foreground" />
          </button>
          <button className="w-full flex items-center justify-between p-4 border-b border-border hover:bg-muted/50 transition-colors">
            <span>Privacy Policy</span>
            <ChevronRight size={18} className="text-muted-foreground" />
          </button>
          <div className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Version 1.0.0</p>
            <p className="text-sm text-muted-foreground mt-1">© 2024 Performance First US</p>
          </div>
        </div>
      </div>
      
      {/* Logout */}
      <button 
        onClick={onLogout}
        className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors mb-8"
      >
        <LogOut size={18} />
        <span className="font-medium">Log Out</span>
      </button>
    </div>
  );
};

export default SettingsSection;
