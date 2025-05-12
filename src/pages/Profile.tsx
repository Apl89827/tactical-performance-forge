import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MobileLayout from "../components/layouts/MobileLayout";
import { 
  User, 
  LogOut, 
  ChevronRight,
  Bell,
  Shield,
  HelpCircle,
  Settings,
  FileEdit
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ProfileData {
  id: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  isAdmin?: boolean;
}

const Profile = () => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function getProfile() {
      try {
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate("/login");
          return;
        }
        
        // Get the user's profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (profileError) throw profileError;
        
        // Check if the user is an admin
        const { data: roles, error: rolesError } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', user.id)
          .eq('role', 'admin');
          
        if (rolesError) throw rolesError;
        
        setProfileData({
          ...profile,
          id: user.id,
          first_name: profile.first_name || user.user_metadata.first_name,
          last_name: profile.last_name || user.user_metadata.last_name
        });
        
        setIsAdmin(roles && roles.length > 0);
      } catch (error) {
        console.error("Error loading profile:", error);
        toast.error("Error loading profile data");
      } finally {
        setLoading(false);
      }
    }
    
    getProfile();
  }, [navigate]);
  
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error("Error logging out");
    }
  };
  
  const updatePTScore = () => {
    toast.info("PT score update feature coming soon");
  };
  
  const navigateToAdmin = () => {
    navigate("/admin");
  };
  
  if (loading) {
    return (
      <MobileLayout>
        <div className="h-full flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-tactical-blue border-t-transparent rounded-full"></div>
        </div>
      </MobileLayout>
    );
  }
  
  return (
    <MobileLayout title="Profile">
      <div className="mobile-safe-area">
        {/* User info */}
        <div className="bg-card rounded-lg border border-border p-4 mb-6 flex items-center">
          <div className="bg-tactical-blue/20 h-16 w-16 rounded-full flex items-center justify-center mr-4">
            {profileData?.avatar_url ? (
              <img 
                src={profileData.avatar_url} 
                alt="Avatar" 
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <User size={32} className="text-tactical-blue" />
            )}
          </div>
          <div>
            <h1 className="font-bold text-lg">
              {profileData?.first_name || ''} {profileData?.last_name || ''}
            </h1>
            <p className="text-muted-foreground">
              {isAdmin ? 'Administrator' : 'Member'}
            </p>
          </div>
        </div>
        
        {/* Admin section (only visible for admins) */}
        {isAdmin && (
          <div className="bg-card rounded-lg border border-border mb-6">
            <h2 className="font-semibold p-4 border-b border-border">Admin Tools</h2>
            
            <div>
              <button 
                className="w-full flex items-center justify-between p-4 border-b border-border"
                onClick={navigateToAdmin}
              >
                <div className="flex items-center">
                  <FileEdit size={18} className="mr-3 text-tactical-blue" />
                  <span>Content Management</span>
                </div>
                <ChevronRight size={18} className="text-muted-foreground" />
              </button>
              
              <button className="w-full flex items-center justify-between p-4">
                <div className="flex items-center">
                  <Settings size={18} className="mr-3 text-tactical-blue" />
                  <span>System Settings</span>
                </div>
                <ChevronRight size={18} className="text-muted-foreground" />
              </button>
            </div>
          </div>
        )}
        
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-card rounded-lg border border-border p-3 text-center">
            <div className="text-xl font-bold">26</div>
            <div className="text-xs text-muted-foreground">Workouts</div>
          </div>
          <div className="bg-card rounded-lg border border-border p-3 text-center">
            <div className="text-xl font-bold">92%</div>
            <div className="text-xs text-muted-foreground">Adherence</div>
          </div>
          <div className="bg-card rounded-lg border border-border p-3 text-center">
            <div className="text-xl font-bold">Phase 2</div>
            <div className="text-xs text-muted-foreground">Program</div>
          </div>
        </div>
        
        {/* Physical metrics */}
        <div className="bg-card rounded-lg border border-border mb-6">
          <h2 className="font-semibold p-4 border-b border-border">Physical Metrics</h2>
          
          <div className="divide-y divide-border">
            <div className="flex justify-between items-center p-4">
              <span>Height</span>
              <span className="font-medium">{profileData?.height ? `${Math.floor(profileData.height / 12)}' ${profileData.height % 12}"` : "--"}</span>
            </div>
            <div className="flex justify-between items-center p-4">
              <span>Weight</span>
              <span className="font-medium">{profileData?.weight ? `${profileData.weight} lbs` : "--"}</span>
            </div>
            <div className="flex justify-between items-center p-4">
              <span>1.5 Mile Run</span>
              <span className="font-medium">{profileData?.ptScores?.runTime || "--"}</span>
            </div>
            <div className="flex justify-between items-center p-4">
              <span>Push-ups</span>
              <span className="font-medium">{profileData?.ptScores?.pushups || "--"}</span>
            </div>
            <div className="flex justify-between items-center p-4">
              <span>Sit-ups</span>
              <span className="font-medium">{profileData?.ptScores?.situps || "--"}</span>
            </div>
            <div className="flex justify-between items-center p-4">
              <span>Pull-ups</span>
              <span className="font-medium">{profileData?.ptScores?.pullups || "--"}</span>
            </div>
          </div>
          
          <div className="p-4">
            <button className="btn-primary" onClick={updatePTScore}>
              Update PT Scores
            </button>
          </div>
        </div>
        
        {/* Settings */}
        <div className="bg-card rounded-lg border border-border mb-6">
          <h2 className="font-semibold p-4 border-b border-border">Settings</h2>
          
          <div>
            <button className="w-full flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center">
                <Bell size={18} className="mr-3 text-muted-foreground" />
                <span>Notifications</span>
              </div>
              <ChevronRight size={18} className="text-muted-foreground" />
            </button>
            
            <button className="w-full flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center">
                <Shield size={18} className="mr-3 text-muted-foreground" />
                <span>Privacy</span>
              </div>
              <ChevronRight size={18} className="text-muted-foreground" />
            </button>
            
            <button className="w-full flex items-center justify-between p-4">
              <div className="flex items-center">
                <HelpCircle size={18} className="mr-3 text-muted-foreground" />
                <span>Help & Support</span>
              </div>
              <ChevronRight size={18} className="text-muted-foreground" />
            </button>
          </div>
        </div>
        
        {/* About */}
        <div className="bg-card rounded-lg border border-border mb-6">
          <h2 className="font-semibold p-4 border-b border-border">About</h2>
          
          <div>
            <button className="w-full flex items-center justify-between p-4 border-b border-border">
              <span>Terms of Service</span>
              <ChevronRight size={18} className="text-muted-foreground" />
            </button>
            
            <button className="w-full flex items-center justify-between p-4 border-b border-border">
              <span>Privacy Policy</span>
              <ChevronRight size={18} className="text-muted-foreground" />
            </button>
            
            <div className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Version 1.0.0</p>
              <p className="text-sm text-muted-foreground mt-1">© 2023 Performance First US</p>
            </div>
          </div>
        </div>
        
        {/* Logout button */}
        <div className="mb-8">
          <button 
            onClick={handleLogout}
            className="btn-outline text-red-500 border-red-500/30"
          >
            <LogOut size={18} className="mr-2" />
            Log Out
          </button>
        </div>
      </div>
    </MobileLayout>
  );
};

export default Profile;
