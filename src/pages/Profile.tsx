
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
  FileEdit,
  Calendar,
  Dumbbell
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import ProgramCreator from "@/components/admin/ProgramCreator";
import PTScoreForm from "@/components/profile/PTScoreForm";

interface ProfileData {
  id: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  isAdmin?: boolean;
  height?: number | null;
  weight?: number | null;
  ptScores?: {
    runTime?: string;
    pushups?: number;
    situps?: number;
    pullups?: number;
  };
  selectionType?: string | null;
  selectionDate?: string | null;
  swim_time?: string | null;
  bench_5rm?: number | null;
  deadlift_5rm?: number | null;
  squat_5rm?: number | null;
}

const Profile = () => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Edit states
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isEditingSelection, setIsEditingSelection] = useState(false);
  const [isEditingPTScores, setIsEditingPTScores] = useState(false);
  
  // Form states
  const [height, setHeight] = useState<number | undefined>(undefined);
  const [weight, setWeight] = useState<number | undefined>(undefined);
  const [selectionType, setSelectionType] = useState<string | null>(null);
  const [selectionDate, setSelectionDate] = useState<Date | undefined>(undefined);
  
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
        
        // Get stored selection data
        const storedData = localStorage.getItem("profileData");
        const selectionData = storedData ? JSON.parse(storedData) : {};
        
        const combinedProfile: ProfileData = {
          ...profile,
          id: user.id,
          first_name: profile.first_name || user.user_metadata.first_name,
          last_name: profile.last_name || user.user_metadata.last_name,
          height: profile.height,
          weight: profile.weight,
          swim_time: profile.swim_time,
          bench_5rm: profile.bench_5rm,
          deadlift_5rm: profile.deadlift_5rm,
          squat_5rm: profile.squat_5rm,
          selectionType: selectionData.selectionType || null,
          selectionDate: selectionData.selectionDate || null,
          ptScores: selectionData.ptScores || {}
        };
        
        setProfileData(combinedProfile);
        setHeight(combinedProfile.height || undefined);
        setWeight(combinedProfile.weight || undefined);
        setSelectionType(combinedProfile.selectionType);
        setSelectionDate(combinedProfile.selectionDate ? new Date(combinedProfile.selectionDate) : undefined);
        
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
  
  const handleSavePersonal = async () => {
    if (!profileData) return;
    
    try {
      // Update profile in Supabase
      const { error } = await supabase
        .from('profiles')
        .update({
          height: height,
          weight: weight
        })
        .eq('id', profileData.id);
        
      if (error) throw error;
      
      // Update local state
      setProfileData(prev => prev ? {
        ...prev,
        height,
        weight
      } : null);
      
      setIsEditingPersonal(false);
      toast.success("Personal information updated");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    }
  };
  
  const handleSaveSelection = () => {
    if (!selectionType || !selectionDate) {
      toast.error("Please select both a selection type and date");
      return;
    }
    
    try {
      // Update local state
      const updatedProfile = {
        ...profileData,
        selectionType,
        selectionDate: selectionDate.toISOString()
      };
      setProfileData(updatedProfile);
      
      // Store in localStorage for other components
      const dataToStore = {
        selectionType,
        selectionDate: selectionDate.toISOString()
      };
      localStorage.setItem("profileData", JSON.stringify(dataToStore));
      
      setIsEditingSelection(false);
      toast.success("Selection information updated");
    } catch (error) {
      console.error("Error updating selection:", error);
      toast.error("Failed to update selection information");
    }
  };
  
  const updatePTScore = () => {
    setIsEditingPTScores(true);
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
              {isAdmin ? (
                <Badge variant="secondary" className="mt-1">Administrator</Badge>
              ) : (
                'Member'
              )}
            </p>
          </div>
        </div>
        
        {/* Selection information */}
        <div className="bg-card rounded-lg border border-border mb-6">
          <div className="flex justify-between items-center p-4 border-b border-border">
            <h2 className="font-semibold">Selection Information</h2>
            <button 
              className="p-1 rounded-full hover:bg-muted"
              onClick={() => setIsEditingSelection(true)}
            >
              <FileEdit size={18} className="text-tactical-blue" />
            </button>
          </div>
          
          {isEditingSelection ? (
            <div className="p-4">
              <div className="mb-4">
                <label className="text-sm font-medium mb-1 block">Selection Type</label>
                <Select value={selectionType || ''} onValueChange={setSelectionType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SFAS">Special Forces Assessment & Selection (SFAS)</SelectItem>
                    <SelectItem value="RASP">Ranger Assessment & Selection Program (RASP)</SelectItem>
                    <SelectItem value="A&S">Marine Raider Assessment & Selection (A&S)</SelectItem>
                    <SelectItem value="BUD/S">Basic Underwater Demolition/SEAL (BUD/S)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="mb-4">
                <label className="text-sm font-medium mb-1 block">Selection Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <Calendar className="mr-2 h-4 w-4" />
                      {selectionDate ? format(selectionDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={selectionDate}
                      onSelect={(date) => setSelectionDate(date || undefined)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditingSelection(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveSelection}>Save</Button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border">
              <div className="flex justify-between items-center p-4">
                <span>Selection Type</span>
                <span className="font-medium">{profileData?.selectionType || "Not set"}</span>
              </div>
              <div className="flex justify-between items-center p-4">
                <span>Selection Date</span>
                <span className="font-medium">
                  {profileData?.selectionDate 
                    ? format(new Date(profileData.selectionDate), "PPP") 
                    : "Not set"}
                </span>
              </div>
            </div>
          )}
        </div>
        
        {/* Admin section (only visible for admins) */}
        {isAdmin && (
          <div className="bg-card rounded-lg border border-border mb-6">
            <h2 className="font-semibold p-4 border-b border-border">Admin Tools</h2>
            
            <div className="p-4">
              <ProgramCreator />
            </div>
            
            <div>
              <button 
                className="w-full flex items-center justify-between p-4 border-t border-border"
                onClick={navigateToAdmin}
              >
                <div className="flex items-center">
                  <FileEdit size={18} className="mr-3 text-tactical-blue" />
                  <span>Content Management</span>
                </div>
                <ChevronRight size={18} className="text-muted-foreground" />
              </button>
              
              <button className="w-full flex items-center justify-between p-4 border-t border-border">
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
          <div className="flex justify-between items-center p-4 border-b border-border">
            <h2 className="font-semibold">Physical Metrics</h2>
            <button 
              className="p-1 rounded-full hover:bg-muted"
              onClick={() => setIsEditingPersonal(true)}
            >
              <FileEdit size={18} className="text-tactical-blue" />
            </button>
          </div>
          
          {isEditingPersonal ? (
            <div className="p-4">
              <div className="mb-4">
                <label className="text-sm font-medium mb-1 block">Height (inches)</label>
                <Input 
                  type="number" 
                  value={height || ''} 
                  onChange={(e) => setHeight(e.target.value ? parseInt(e.target.value) : undefined)} 
                  placeholder="Height in inches"
                />
              </div>
              
              <div className="mb-4">
                <label className="text-sm font-medium mb-1 block">Weight (lbs)</label>
                <Input 
                  type="number" 
                  value={weight || ''} 
                  onChange={(e) => setWeight(e.target.value ? parseInt(e.target.value) : undefined)} 
                  placeholder="Weight in pounds"
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditingPersonal(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSavePersonal}>Save</Button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border">
              <div className="flex justify-between items-center p-4">
                <span>Height</span>
                <span className="font-medium">{profileData?.height ? `${Math.floor(profileData.height / 12)}' ${profileData.height % 12}"` : "--"}</span>
              </div>
              <div className="flex justify-between items-center p-4">
                <span>Weight</span>
                <span className="font-medium">{profileData?.weight ? `${profileData.weight} lbs` : "--"}</span>
              </div>
            </div>
          )}
        </div>

        {/* PT Scores */}
        <div className="bg-card rounded-lg border border-border mb-6">
          <div className="flex justify-between items-center p-4 border-b border-border">
            <h2 className="font-semibold flex items-center">
              <Dumbbell size={16} className="mr-2" />
              PT Scores
            </h2>
            <button 
              className="p-1 rounded-full hover:bg-muted"
              onClick={updatePTScore}
            >
              <FileEdit size={18} className="text-tactical-blue" />
            </button>
          </div>
          
          {isEditingPTScores ? (
            <div className="p-4">
              <PTScoreForm 
                userId={profileData?.id || ''}
                initialValues={{
                  runTime: profileData?.ptScores?.runTime,
                  pushups: profileData?.ptScores?.pushups,
                  situps: profileData?.ptScores?.situps,
                  pullups: profileData?.ptScores?.pullups,
                  swimTime: profileData?.swim_time || '',
                  bench5rm: profileData?.bench_5rm || undefined,
                  deadlift5rm: profileData?.deadlift_5rm || undefined,
                  squat5rm: profileData?.squat_5rm || undefined
                }}
                onComplete={() => {
                  setIsEditingPTScores(false);
                  // Refetch profile data
                  window.location.reload();
                }}
              />
            </div>
          ) : (
            <div className="divide-y divide-border">
              <div className="flex justify-between items-center p-4">
                <span>1.5 Mile Run</span>
                <span className="font-medium">{profileData?.ptScores?.runTime || "--"}</span>
              </div>
              <div className="flex justify-between items-center p-4">
                <span>500m Swim</span>
                <span className="font-medium">{profileData?.swim_time || "--"}</span>
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
              <div className="p-4 border-t border-border">
                <h3 className="font-medium mb-2">Strength Metrics (5RM)</h3>
              </div>
              <div className="flex justify-between items-center p-4">
                <span>Bench Press</span>
                <span className="font-medium">{profileData?.bench_5rm ? `${profileData.bench_5rm} lbs` : "--"}</span>
              </div>
              <div className="flex justify-between items-center p-4">
                <span>Squat</span>
                <span className="font-medium">{profileData?.squat_5rm ? `${profileData.squat_5rm} lbs` : "--"}</span>
              </div>
              <div className="flex justify-between items-center p-4">
                <span>Deadlift</span>
                <span className="font-medium">{profileData?.deadlift_5rm ? `${profileData.deadlift_5rm} lbs` : "--"}</span>
              </div>
            </div>
          )}
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
