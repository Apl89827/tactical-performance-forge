import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MobileLayout from "../components/layouts/MobileLayout";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

import ProfileHeader from "@/components/profile/ProfileHeader";
import SelectionInfoCard from "@/components/profile/SelectionInfoCard";
import PhysicalMetricsCard from "@/components/profile/PhysicalMetricsCard";
import PTScoresCard from "@/components/profile/PTScoresCard";
import QuickStats from "@/components/profile/QuickStats";
import SettingsSection from "@/components/profile/SettingsSection";

interface ProfileData {
  id: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
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
  bench_3rm?: number | null;
  deadlift_3rm?: number | null;
  squat_3rm?: number | null;
}

const Profile = () => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isEditingSelection, setIsEditingSelection] = useState(false);
  const [isEditingPTScores, setIsEditingPTScores] = useState(false);
  
  const [height, setHeight] = useState<number | undefined>(undefined);
  const [weight, setWeight] = useState<number | undefined>(undefined);
  const [selectionType, setSelectionType] = useState<string | null>(null);
  const [selectionDate, setSelectionDate] = useState<Date | undefined>(undefined);
  
  useEffect(() => {
    async function getProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { navigate("/login"); return; }
        
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (profileError) throw profileError;
        
        const { data: roles } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', user.id)
          .eq('role', 'admin');
        
        const { data: latestMetrics } = await supabase
          .from('pt_metrics')
          .select('run_time, pushups, situps, pullups')
          .eq('user_id', user.id)
          .order('recorded_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        const ptScoresFromDb = latestMetrics ? {
          runTime: latestMetrics.run_time || undefined,
          pushups: latestMetrics.pushups || undefined,
          situps: latestMetrics.situps || undefined,
          pullups: latestMetrics.pullups || undefined,
        } : undefined;
        
        const storedData = localStorage.getItem("profileData");
        const selectionData = storedData ? JSON.parse(storedData) : {};
        
        const combinedProfile: ProfileData = {
          ...profile,
          id: user.id,
          first_name: profile.first_name || user.user_metadata.first_name,
          last_name: profile.last_name || user.user_metadata.last_name,
          ptScores: ptScoresFromDb ?? (selectionData.ptScores || {}),
          selectionType: selectionData.selectionType || null,
          selectionDate: selectionData.selectionDate || null,
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
    const { error } = await supabase.auth.signOut();
    if (error) { toast.error("Error logging out"); return; }
    toast.success("Logged out successfully");
    navigate("/login");
  };
  
  const handleSavePersonal = async () => {
    if (!profileData) return;
    const { error } = await supabase
      .from('profiles')
      .update({ height, weight })
      .eq('id', profileData.id);
    if (error) { toast.error("Failed to update profile"); return; }
    setProfileData(prev => prev ? { ...prev, height, weight } : null);
    setIsEditingPersonal(false);
    toast.success("Personal information updated");
  };
  
  const handleSaveSelection = () => {
    if (!selectionType || !selectionDate) {
      toast.error("Please select both a selection type and date");
      return;
    }
    const updatedProfile = { ...profileData, selectionType, selectionDate: selectionDate.toISOString() };
    setProfileData(updatedProfile as ProfileData);
    localStorage.setItem("profileData", JSON.stringify({ selectionType, selectionDate: selectionDate.toISOString() }));
    setIsEditingSelection(false);
    toast.success("Selection information updated");
  };
  
  if (loading) {
    return (
      <MobileLayout>
        <div className="h-full flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </MobileLayout>
    );
  }
  
  return (
    <MobileLayout title="Profile">
      <div className="mobile-safe-area py-4">
        <ProfileHeader
          firstName={profileData?.first_name}
          lastName={profileData?.last_name}
          avatarUrl={profileData?.avatar_url}
          isAdmin={isAdmin}
        />
        
        <QuickStats
          workoutsCompleted={26}
          adherence={92}
          currentWeek={4}
          totalWeeks={8}
        />
        
        <SelectionInfoCard
          selectionType={selectionType}
          selectionDate={selectionDate}
          isEditing={isEditingSelection}
          onEdit={() => setIsEditingSelection(true)}
          onSave={handleSaveSelection}
          onCancel={() => setIsEditingSelection(false)}
          onTypeChange={setSelectionType}
          onDateChange={(date) => setSelectionDate(date)}
        />
        
        <PhysicalMetricsCard
          height={profileData?.height ?? undefined}
          weight={profileData?.weight ?? undefined}
          isEditing={isEditingPersonal}
          editHeight={height}
          editWeight={weight}
          onEdit={() => setIsEditingPersonal(true)}
          onSave={handleSavePersonal}
          onCancel={() => setIsEditingPersonal(false)}
          onHeightChange={setHeight}
          onWeightChange={setWeight}
        />
        
        <PTScoresCard
          userId={profileData?.id || ''}
          ptScores={profileData?.ptScores}
          swimTime={profileData?.swim_time}
          bench3rm={profileData?.bench_3rm}
          squat3rm={profileData?.squat_3rm}
          deadlift3rm={profileData?.deadlift_3rm}
          bench5rm={profileData?.bench_5rm}
          squat5rm={profileData?.squat_5rm}
          deadlift5rm={profileData?.deadlift_5rm}
          isEditing={isEditingPTScores}
          onEdit={() => setIsEditingPTScores(true)}
          onComplete={() => { setIsEditingPTScores(false); window.location.reload(); }}
        />
        
        <SettingsSection isAdmin={isAdmin} onLogout={handleLogout} />
      </div>
    </MobileLayout>
  );
};

export default Profile;
