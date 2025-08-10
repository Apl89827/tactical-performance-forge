
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        toast.error(error.message);
      } else {
        // Ensure a profile row exists for this user (Phase 0 bootstrap)
        const userId = data.user?.id;
        if (userId) {
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({ id: userId }, { onConflict: 'id', ignoreDuplicates: true });
          if (profileError) {
            console.warn('Profile upsert failed:', profileError);
          }
        }

        // Migrate any legacy localStorage onboarding data into Supabase
        try {
          if (userId) {
            const profileDataRaw = localStorage.getItem('profileData');
            const hasCompleted = localStorage.getItem('hasCompletedOnboarding') === 'true';
            let update: Record<string, any> = {};
            if (profileDataRaw) {
              const pd = JSON.parse(profileDataRaw || '{}');
              update = {
                first_name: pd.first_name ?? null,
                height: typeof pd.height === 'number' ? pd.height : null,
                weight: typeof pd.weight === 'number' ? pd.weight : null,
                focus_type: pd.focusType ?? null,
                selection_type: pd.focusType === 'Selection Candidate' ? (pd.selectionType ?? null) : null,
                selection_date: pd.focusType === 'Selection Candidate' ? (pd.selectionDate || null) : null,
              };
              if (hasCompleted) update.has_completed_onboarding = true;
            } else if (hasCompleted) {
              update = { has_completed_onboarding: true };
            }
            if (Object.keys(update).length > 0) {
              const { error: migrateErr } = await supabase
                .from('profiles')
                .update(update)
                .eq('id', userId);
              if (migrateErr) console.warn('Failed migrating onboarding data:', migrateErr);
              localStorage.removeItem('profileData');
              localStorage.removeItem('hasCompletedOnboarding');
            }
          }
        } catch (e) {
          console.warn('Onboarding migration error:', e);
        }

        toast.success("Signed in successfully");
        navigate("/dashboard");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-tactical-darkgray px-6 py-8">
      {/* Back button and title */}
      <div className="mb-8 flex items-center">
        <button 
          onClick={() => navigate("/")}
          className="p-1"
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
        <h1 className="text-xl font-semibold flex-1 text-center mr-8">Sign In</h1>
      </div>
      
      {/* Logo */}
      <div className="flex justify-center mb-8">
        <div className="w-16 h-16 bg-tactical-blue rounded-full flex items-center justify-center">
          <span className="text-white text-2xl font-bold">PF</span>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
            placeholder="your@email.com"
            required
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
            <Link to="/forgot-password" className="text-sm text-tactical-blue">
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
            placeholder="••••••••"
            required
          />
        </div>
        
        <button 
          type="submit"
          className="btn-primary"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Signing in...
            </span>
          ) : (
            "Sign In"
          )}
        </button>
      </form>
      
      <div className="mt-8 text-center">
        <span className="text-muted-foreground">Don't have an account? </span>
        <Link to="/register" className="text-tactical-blue font-medium">
          Sign up
        </Link>
      </div>
    </div>
  );
};

export default Login;
